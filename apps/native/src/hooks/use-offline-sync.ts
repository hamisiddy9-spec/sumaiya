import { useCallback, useEffect, useState } from "react";
import { offlineStorage } from "@sumaiya/utils";
import { retryAsync, sleep } from "@sumaiya/utils";
import type { CV, SyncOperation } from "@sumaiya/types";
import { apiClient } from "../lib/api-client";
import { reportError } from "../lib/reporting";

interface SyncStatus {
  isSyncing: boolean;
  pendingCount: number;
  lastSyncedAt?: Date;
  errors: string[];
}

// Extended sync queue item for mobile-specific operations
interface MobileSyncQueueItem {
  id: string;
  cvId: string;
  operation: SyncOperation;
  data?: Partial<CV>;
  timestamp: number;
  retries: number;
  lastError?: string;
}

/**
 * Offline-first push queue for CV writes.
 *
 * `enabled: false` is for the guest path (no account, so no server to push to):
 * the queue is not polled and nothing is flushed, which keeps an unauthenticated
 * request from being issued at all on a phone that may not even have data.
 */
export function useOfflineSync(options: { enabled?: boolean } = {}) {
  const enabled = options.enabled !== false;
  const [status, setStatus] = useState<SyncStatus>({
    isSyncing: false,
    pendingCount: 0,
    errors: [],
  });

  // Get pending operations from queue on mount
  useEffect(() => {
    if (!enabled) return;
    const initPendingCount = async () => {
      try {
        const queue = await offlineStorage.getSyncQueue();
        setStatus(prev => ({ ...prev, pendingCount: queue.length }));
      } catch (err) {
        reportError(err, { scope: 'offlineSync.initCount' });
      }
    };
    initPendingCount();
  }, [enabled]);

  const processSyncQueue = useCallback(async () => {
    setStatus((prev) => ({ ...prev, isSyncing: true, errors: [] }));

    try {
      const queue = (await offlineStorage.getSyncQueue()) as MobileSyncQueueItem[];

      for (const item of queue) {
        try {
          // Exponential backoff: 2s → 4s → 8s → 16s
          const delays = [2000, 4000, 8000, 16000];
          const maxDelay = delays[Math.min(item.retries, delays.length - 1)];

          await retryAsync(
            async () => {
              // Route every queued op through the shared ApiClient so it hits
              // the Bearer-authenticated Hono API with the right base URL. The
              // client's LOCAL cv id is passed as `clientId` for create/delete
              // so the server derives a deterministic row id — a retried op is
              // idempotent instead of creating duplicates.
              const op = item.operation as SyncOperation;

              if ((op === "create_cv" || op === "update_cv") && item.data) {
                if (item.cvId.startsWith("m_")) {
                  // Already synced once — it has a real server id. PUT by id.
                  await apiClient.updateCV(item.cvId, item.data);
                } else {
                  // First sync (or an edit before the first sync landed):
                  // POST /api/cv with the local id as clientId — the server
                  // treats it as an idempotent upsert keyed by (userId,
                  // clientId), so a create and a later edit both land on the
                  // same row instead of the old PUT /api/cv/<local-id> 404.
                  await apiClient.createCV({ ...item.data, clientId: item.cvId });
                }
              } else if (op === "delete_cv") {
                if (item.cvId.startsWith("m_")) await apiClient.deleteCV(item.cvId);
                else await apiClient.deleteCVByClientId(item.cvId);
              } else {
                throw new Error(`Unsupported sync operation: ${op}`);
              }

              // Remove from queue after successful sync
              await offlineStorage.removeSyncQueueItem(item.id);
            },
            3,
            maxDelay
          );
        } catch (error) {
          const msg = error instanceof Error ? error.message : "Sync failed";
          await offlineStorage.updateSyncQueueItem(item.id, {
            retries: item.retries + 1,
            lastError: msg,
          });

          // Past 4 failures (total time so far: 2s+4s+8s+16s = 30s), just
          // report it — NEVER delete the queued edit. This used to call
          // removeSyncQueueItem here, which is real, silent data loss: the
          // edit is gone from the sync queue with nothing left pointing at
          // it, and if the local cache is ever later overwritten by a
          // stale server read (a pull-to-refresh, a re-login), the edit
          // never existed as far as anyone can tell. Leaving it queued
          // means it keeps counting toward pendingCount (the editor's own
          // "N to sync" pill) and keeps being retried on every future
          // processSyncQueue call (on reconnect / app foreground) — each
          // attempt already costs one exponential-backoff cycle, so this
          // isn't a tight retry loop, just "never silently give up".
          if (item.retries >= 3) {
            reportError(error, { scope: "offlineSync.giveUp", op: item.operation, cvId: item.cvId });
            setStatus((prev) => ({
              ...prev,
              errors: [...prev.errors, `Failed to sync: ${msg}`],
            }));
          }
        }

        await sleep(100);
      }

      const remaining = await offlineStorage.getSyncQueue();
      setStatus((prev) => ({
        ...prev,
        isSyncing: false,
        pendingCount: remaining.length,
        lastSyncedAt: new Date(),
      }));
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Sync error";
      setStatus((prev) => ({
        ...prev,
        isSyncing: false,
        errors: [...prev.errors, msg],
      }));
    }
  }, []);

  const queueOperation = useCallback(
    async (
      operation: SyncOperation,
      itemId: string,
      data?: Partial<CV>
    ) => {
      const item: MobileSyncQueueItem = {
        id: `${operation}-${itemId}-${Date.now()}`,
        cvId: itemId,
        operation,
        data,
        timestamp: Date.now(),
        retries: 0,
      };

      // Cast to SyncQueueItem for storage (operation types compatible)
      await offlineStorage.addToSyncQueue(item as any);
      setStatus((prev) => ({ ...prev, pendingCount: prev.pendingCount + 1 }));

      // Try to sync right away instead of waiting on the 30s interval below.
      // That interval only runs while this hook is mounted — and it's only
      // ever mounted by the CV editor screen — so the common "edit, save,
      // immediately go back" flow used to unmount the timer before it ever
      // fired once, leaving an online-and-syncable edit sitting untried
      // until the editor happened to be reopened and left open 30+ seconds.
      // Fire-and-forget: this runs in the background even if the screen
      // unmounts right after save() returns, and processSyncQueue's own
      // per-item retry/backoff logic still applies if it's actually offline.
      //
      // Skipped entirely without an account (guest mode): an unauthenticated
      // push can only fail, and the queued edit is uploaded by the claim on
      // sign-in instead.
      if (enabled) void processSyncQueue();
    },
    [processSyncQueue, enabled]
  );

  // Auto-sync every 30 seconds
  useEffect(() => {
    if (!enabled) return;
    const timer = setInterval(() => {
      processSyncQueue();
    }, 30000);

    return () => clearInterval(timer);
  }, [processSyncQueue, enabled]);

  return {
    status,
    isSyncing: status.isSyncing,
    pendingCount: status.pendingCount,
    lastSyncedAt: status.lastSyncedAt,
    errors: status.errors,
    processSyncQueue,
    queueOperation,
  };
}
