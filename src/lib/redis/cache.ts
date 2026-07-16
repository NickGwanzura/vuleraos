import redis from "./client";

const DEFAULT_TTL = 60; // seconds

/**
 * Cache-aside pattern: get from Redis cache or fetch from source.
 * 
 * @param key - Redis cache key
 * @param fetchFn - Function to fetch data if cache miss
 * @param ttl - Time-to-live in seconds (default 60)
 */
export async function getCached<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = DEFAULT_TTL
): Promise<T> {
  try {
    const cached = await redis.get(key);
    if (cached) {
      return JSON.parse(cached) as T;
    }
  } catch {
    // Cache miss or Redis error — fall through to fetch
  }

  const data = await fetchFn();

  try {
    await redis.setex(key, ttl, JSON.stringify(data));
  } catch {
    // Non-critical — data is still returned
  }

  return data;
}

/**
 * Invalidate a cache key.
 */
export async function invalidateCache(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch {
    // Non-critical
  }
}

/**
 * Invalidate multiple cache keys matching a pattern.
 * E.g., invalidatePattern("stock:items:*")
 */
export async function invalidatePattern(pattern: string): Promise<void> {
  try {
    let cursor = "0";
    do {
      const [nextCursor, keys] = await redis.scan(
        cursor,
        "MATCH",
        pattern,
        "COUNT",
        100
      );
      cursor = nextCursor;
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } while (cursor !== "0");
  } catch {
    // Non-critical
  }
}

/**
 * Build a cache key for tenant-scoped data.
 */
export function tenantCacheKey(tenantId: string, ...parts: string[]): string {
  return `vuleraos:${tenantId}:${parts.join(":")}`;
}

/**
 * Build a cache key for global data.
 */
export function globalCacheKey(...parts: string[]): string {
  return `vuleraos:global:${parts.join(":")}`;
}
