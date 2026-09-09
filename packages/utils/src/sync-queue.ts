// Offline sync queue — FIFO with exponential backoff and conflict resolution
import type { CV, SyncQueueItem } from "@sumaiya/types";

const SYNC_KEY = "sumaiya-sync-queue";
const MAX_RETRIES = 5;
const INITIAL_DELAY_MS = 1000;

export class SyncQueue {
  private items: Map<string, SyncQueueItem> = new Map();

  /**
   * Load queue from local storage (web) or AsyncStorage (mobile).
   */
  async load(storage: Storage | any): Promise<void> {
    try {
      const data = storage.getItem(SYNC_KEY);
      if (data) {
        const items = JSON.parse(data) as SyncQueueItem[];
        items.forEach((item) => this.items.set(item.id, item));
      }
    } catch (error) {
      console.error("Failed to load sync queue:", error);
    }
  }

  /**
   * Persist queue to storage.
   */
  async save(storage: Storage | any): Promise<void> {
    try {
      const items = Array.from(this.items.values());
      storage.setItem(SYNC_KEY, JSON.stringify(items));
    } catch (error) {
      console.error("Failed to save sync queue:", error);
    }
  }

  /**
   * Enqueue a CV operation (create, update, delete).
   */
  enqueue(cvId: string, operation: "create" | "update" | "delete", cv: CV | null): SyncQueueItem {
    const id = `${cvId}-${operation}-${Date.now()}`;
    const item: SyncQueueItem = {
      id,
      cvId,
      operation,
      data: cv,
      timestamp: Date.now(),
      retries: 0,
    };
    this.items.set(id, item);
    return item;
  }

  /**
   * Get all pending items (FIFO order).
   */
  getPending(): SyncQueueItem[] {
    return Array.from(this.items.values())
      .filter((item) => item.retries < MAX_RETRIES)
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Mark item as synced (remove from queue).
   */
  markSynced(id: string): void {
    this.items.delete(id);
  }

  /**
   * Mark item as failed with error.
   */
  markFailed(id: string, error: string): void {
    const item = this.items.get(id);
    if (item) {
      item.retries += 1;
      item.lastError = error;
      if (item.retries >= MAX_RETRIES) {
        // Leave in queue but mark as exhausted
        console.error(`Sync item ${id} exhausted retries:`, error);
      }
    }
  }

  /**
   * Calculate delay for exponential backoff.
   */
  getBackoffDelay(retries: number): number {
    return INITIAL_DELAY_MS * Math.pow(2, retries);
  }

  /**
   * Get conflict-free items (delete-wins strategy).
   * If a create/update is followed by a delete of the same CV, only keep the delete.
   */
  getConflictFree(): SyncQueueItem[] {
    const pending = this.getPending();
    const cvsWithDeletes = new Set(
      pending.filter((item) => item.operation === "delete").map((item) => item.cvId)
    );

    return pending.filter((item) => {
      // If this CV has a delete pending, skip all non-delete ops
      if (cvsWithDeletes.has(item.cvId) && item.operation !== "delete") {
        return false;
      }
      return true;
    });
  }

  /**
   * Clear queue (after successful full sync).
   */
  clear(): void {
    this.items.clear();
  }

  /**
   * Get queue size.
   */
  size(): number {
    return this.items.size;
  }

  /**
   * Get exhausted items (failed after max retries).
   */
  getExhausted(): SyncQueueItem[] {
    return Array.from(this.items.values()).filter((item) => item.retries >= MAX_RETRIES);
  }
}

export default SyncQueue;
