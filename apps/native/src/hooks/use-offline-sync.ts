import { useCallback, useEffect, useState } from "react";
import { offlineStorage } from "@sumaiya/utils";
import { retryAsync, sleep } from "@sumaiya/utils";
import type { SyncOperation } from "@sumaiya/types";
import { apiClient } from "../lib/api-client";

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
  data: any;
  timestamp: number;
  retries: number;
  lastError?: string;
}

export function useOfflineSync() {
  const [status, setStatus] = useState<SyncStatus>({
    isSyncing: false,
    pendingCount: 0,
    errors: [],
  });

  // Get pending operations from queue on mount
  useEffect(() => {
    const initPendingCount = async () => {
      try {
        const queue = await offlineStorage.getSyncQueue();
        setStatus(prev => ({ ...prev, pendingCount: queue.length }));
      } catch (err) {
        console.error('Failed to init pending count:', err);
      }
    };
    initPendingCount();
  }, []);

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

              if (op === "create_cv" && item.data) {
                await apiClient.createCV({ ...item.data, clientId: item.cvId });
              } else if (op === "update_cv" && item.data) {
                await apiClient.updateCV(item.cvId, item.data);
              } else if (op === "delete_cv") {
                await apiClient.deleteCVByClientId(item.cvId);
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

          // Give up after 4 retries (total time: 2s + 4s + 8s + 16s = 30s)
          if (item.retries >= 3) {
            await offlineStorage.removeSyncQueueItem(item.id);
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
      data?: any
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
    },
    []
  );

  // Auto-sync every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      processSyncQueue();
    }, 30000);

    return () => clearInterval(timer);
  }, [processSyncQueue]);

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
