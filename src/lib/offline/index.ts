/**
 * Offline sync manager for VuleraOS.
 * Uses PouchDB for local storage and provides sync status.
 * 
 * This is the foundation layer — when online, API calls go direct.
 * When offline, transactions are queued locally and synced when connectivity returns.
 */

import { useEffect, useState, useCallback } from "react";

export type SyncStatus = "online" | "offline" | "syncing" | "error";

/**
 * Detect online/offline status.
 */
export function useOnlineStatus(): { isOnline: boolean } {
  // Always seed with `true` so the client's first render matches the
  // server-rendered HTML; the real value is read after mount to avoid a
  // hydration mismatch when the client happens to be offline at load time.
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return { isOnline };
}

/**
 * Sync queue for offline transactions.
 * Stores pending API calls in localStorage and replays them when online.
 */
export class OfflineQueue {
  private static STORAGE_KEY = "vuleraos_offline_queue";
  private static PROCESSING_KEY = "vuleraos_offline_processing";

  /**
   * Queue a failed API call for later retry.
   */
  static enqueue(entry: OfflineQueueEntry): void {
    const queue = this.getQueue();
    queue.push({ ...entry, id: Date.now().toString(), timestamp: new Date().toISOString() });
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(queue));
  }

  /**
   * Get the current queue.
   */
  static getQueue(): OfflineQueueEntry[] {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  }

  /**
   * Process all queued items. Returns number of successfully processed items.
   */
  static async processQueue(): Promise<{ processed: number; failed: number }> {
    const queue = this.getQueue();
    if (queue.length === 0) return { processed: 0, failed: 0 };

    // Prevent concurrent processing
    if (localStorage.getItem(this.PROCESSING_KEY) === "true") {
      return { processed: 0, failed: 0 };
    }
    localStorage.setItem(this.PROCESSING_KEY, "true");

    let processed = 0;
    let failed = 0;
    const remaining: OfflineQueueEntry[] = [];

    for (const entry of queue) {
      try {
        const res = await fetch(entry.url, {
          method: entry.method,
          headers: { "Content-Type": "application/json" },
          body: entry.body ? JSON.stringify(entry.body) : undefined,
        });
        if (res.ok) {
          processed++;
        } else {
          failed++;
          remaining.push(entry);
        }
      } catch {
        failed++;
        remaining.push(entry);
      }
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(remaining));
    localStorage.removeItem(this.PROCESSING_KEY);

    return { processed, failed };
  }

  /**
   * Get queue size.
   */
  static getQueueSize(): number {
    return this.getQueue().length;
  }

  /**
   * Clear the queue.
   */
  static clearQueue(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}

export interface OfflineQueueEntry {
  id: string;
  url: string;
  method: string;
  body: any;
  timestamp: string;
  description: string;
  tenantId?: string;
}

/**
 * Hook that provides sync status and processes the queue periodically.
 */
export function useSyncManager() {
  const { isOnline } = useOnlineStatus();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("online");
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const processQueue = useCallback(async () => {
    if (!isOnline) return;
    setSyncStatus("syncing");
    const result = await OfflineQueue.processQueue();
    setPendingCount(OfflineQueue.getQueueSize());
    setLastSync(new Date());
    setSyncStatus(result.failed > 0 ? "error" : "online");
  }, [isOnline]);

  // Update status when online/offline changes
  useEffect(() => {
    if (!isOnline) {
      setSyncStatus("offline");
    } else {
      setPendingCount(OfflineQueue.getQueueSize());
      if (OfflineQueue.getQueueSize() > 0) {
        setSyncStatus("syncing");
        processQueue();
      } else {
        setSyncStatus("online");
      }
    }
  }, [isOnline, processQueue]);

  // Periodically process queue when online (every 30s)
  useEffect(() => {
    if (!isOnline) return;
    const interval = setInterval(() => {
      if (OfflineQueue.getQueueSize() > 0) {
        processQueue();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [isOnline, processQueue]);

  return { syncStatus, pendingCount, lastSync, processQueue, isOnline };
}

/**
 * Utility: wrap a fetch call to automatically queue on failure when offline.
 */
export async function offlineResilientFetch(
  url: string,
  options: RequestInit & { offlineDescription?: string } = {}
): Promise<Response> {
  try {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      throw new Error("Offline");
    }
    const res = await fetch(url, options);
    if (!res.ok && typeof navigator !== "undefined" && !navigator.onLine) {
      throw new Error("Offline");
    }
    return res;
  } catch (error) {
    // Queue for later
    OfflineQueue.enqueue({
      id: Date.now().toString(),
      url,
      method: (options.method || "GET").toUpperCase(),
      body: options.body ? JSON.parse(options.body as string) : null,
      timestamp: new Date().toISOString(),
      description: options.offlineDescription || `${options.method || "GET"} ${url}`,
    });
    throw error;
  }
}
