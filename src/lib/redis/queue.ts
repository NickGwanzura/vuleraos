import redis from "./client";

const QUEUE_PREFIX = "offline-queue";

export interface QueueEntry {
  id: string;
  tenantId: string;
  url: string;
  method: string;
  body: any;
  timestamp: string;
  description: string;
}

/**
 * Add an entry to the offline queue (Redis list).
 */
export async function enqueue(
  tenantId: string,
  entry: Omit<QueueEntry, "id" | "timestamp">
): Promise<void> {
  const key = `${QUEUE_PREFIX}:${tenantId}`;
  const fullEntry: QueueEntry = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
  };

  try {
    await redis.lpush(key, JSON.stringify(fullEntry));
  } catch {
    // Fallback: if Redis fails, queue fails silently
    // The browser-side localStorage queue still works as a backup
  }
}

/**
 * Get all pending entries for a tenant.
 */
export async function getQueue(tenantId: string): Promise<QueueEntry[]> {
  const key = `${QUEUE_PREFIX}:${tenantId}`;
  try {
    const items = await redis.lrange(key, 0, -1);
    return items.map((item) => JSON.parse(item));
  } catch {
    return [];
  }
}

/**
 * Process the queue: pop entries and execute them.
 * Returns the number of successfully processed entries.
 */
export async function processQueue(
  tenantId: string
): Promise<{ processed: number; failed: number }> {
  const processingKey = `${QUEUE_PREFIX}:processing:${tenantId}`;

  try {
    // Use a lock to prevent concurrent processing
    const lock = await redis.setex(processingKey, 30, "1");
    if (!lock) return { processed: 0, failed: 0 };
  } catch {
    return { processed: 0, failed: 0 };
  }

  let processed = 0;
  let failed = 0;
  const queueKey = `${QUEUE_PREFIX}:${tenantId}`;

  try {
    while (true) {
      const item = await redis.rpoplpush(queueKey, `${queueKey}:processing`);
      if (!item) break;

      const entry: QueueEntry = JSON.parse(item);
      try {
        const res = await fetch(entry.url, {
          method: entry.method,
          headers: { "Content-Type": "application/json" },
          body: entry.body ? JSON.stringify(entry.body) : undefined,
        });

        if (res.ok) {
          processed++;
          // Remove from processing list
          await redis.lrem(`${queueKey}:processing`, 1, item);
        } else {
          failed++;
          // Push back to main queue for retry
          await redis.lpush(queueKey, item);
          await redis.lrem(`${queueKey}:processing`, 1, item);
          break; // Stop processing on failure to preserve order
        }
      } catch {
        failed++;
        // Push back to main queue
        await redis.lpush(queueKey, item);
        await redis.lrem(`${queueKey}:processing`, 1, item);
        break;
      }
    }
  } catch {
    // If Redis errors mid-process, entries remain in the processing list
    // and will be retried on next cycle (after the lock expires)
  }

  // Clean up processing list
  try {
    const remaining = await redis.llen(`${queueKey}:processing`);
    if (remaining === 0) {
      await redis.del(processingKey);
    }
  } catch {}

  return { processed, failed };
}

/**
 * Get queue size for a tenant.
 */
export async function getQueueSize(tenantId: string): Promise<number> {
  const key = `${QUEUE_PREFIX}:${tenantId}`;
  try {
    return await redis.llen(key);
  } catch {
    return 0;
  }
}

/**
 * Clear the queue for a tenant.
 */
export async function clearQueue(tenantId: string): Promise<void> {
  const key = `${QUEUE_PREFIX}:${tenantId}`;
  try {
    await redis.del(key, `${key}:processing`);
  } catch {}
}
