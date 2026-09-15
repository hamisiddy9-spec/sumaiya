import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import type { CV, SyncQueueItem } from "@sumaiya/types";
import { offlineStorage } from "@sumaiya/utils";
import { apiClient } from "../lib/api-client";
import { dedupe } from "../lib/cv-dedupe";
import { classifyCvError, type CvErrorKind } from "../lib/cv-fetch-error";
import { useAuthContext } from "../contexts/auth-context";

/**
 * Offline-first CV list for the mobile app.
 *
 * The shared `useCVs` from @sumaiya/hooks only ever reads `apiClient.listCVs()`
 * — so a CV made offline, or just created and not yet synced, wouldn't show,
 * and the list was empty on a flaky connection. This reads the on-device SQLite
 * cache first (instant, offline-safe) and folds the server's copies into it.
 *
 * Same return shape as the shared hook so screens swap the import and nothing
 * else changes.
 */
/** CVs from a fresh server fetch that are safe to persist into local offline
 *  storage — i.e. not sitting in `queuedCvIds` with an edit that hasn't
 *  synced yet. Exported standalone so the skip logic is unit-testable
 *  without mocking the whole hook/SQLite stack. */
export function cvsSafeToPersist(server: CV[], queuedCvIds: Set<string>): CV[] {
  return server.filter((cv) => !queuedCvIds.has(cv.id));
}

/** Sync-queue item ids to drop when a CV is deleted — any create/update still
 *  queued for that CV id is now moot, and left alone would resurrect the CV
 *  on a later sync (its op goes through the idempotent-by-clientId upsert). */
export function queueItemIdsToDropOnDelete(queue: SyncQueueItem[], deletedCvId: string): string[] {
  return queue.filter((item) => item.cvId === deletedCvId).map((item) => item.id);
}

export function useCvs() {
  const { user } = useAuthContext();
  // Scope the on-device cache to the actual signed-in account. This used to be
  // the constant "me" — fine for a single-account phone, but on a shared
  // device (or this QA phone, signed in/out across 3 test accounts) every
  // account read and wrote the same cache rows, so one account's CVs could
  // show up under another's session.
  const LOCAL_USER = user?.id ?? "signed-out";
  const [cvs, setCvs] = useState<CV[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /**
   * WHY the load failed, not just that it did. Every caller used to print the
   * same "couldn't reach the server" line — false for a 401, and it sent people
   * to retry a request that could never succeed.
   */
  const [errorKind, setErrorKind] = useState<CvErrorKind | null>(null);
  // True when the server gave us rows but they could not be cached on the
  // device. The list still renders them; we just say so instead of pretending
  // local storage is fine.
  const [storageBlocked, setStorageBlocked] = useState(false);
  const mounted = useRef(true);
  // Mirrors of cvs/error for the focus effect, so it can decide whether a
  // cheap local re-read is enough or a real re-sync is needed.
  const latest = useRef<{ count: number; error: string | null }>({ count: 0, error: null });
  latest.current = { count: cvs.length, error };

  const readLocal = useCallback(async (): Promise<CV[]> => {
    try {
      const raw = await offlineStorage.getCVsOffline(LOCAL_USER);
      const { kept, drop } = dedupe(raw);
      // Best-effort self-heal — remove the stale duplicate rows.
      for (const id of drop) await offlineStorage.deleteCVOffline(id).catch(() => {});
      if (mounted.current) setCvs(kept);
      return kept;
    } catch {
      return [];
    }
  }, [LOCAL_USER]);

  // Guards against two overlapping loadCVs() runs. This hook is a fresh
  // instance per screen, so `latest.current.count` starts at 0 on every
  // mount — the mount effect's loadCVs() and the focus effect firing on that
  // same mount (see below) could both see count === 0 and both call
  // loadCVs() concurrently. Two runs racing on the same local-storage rows
  // (each doing its own read → persist → read) could land in between the
  // other's writes and briefly report zero CVs, even though nothing was
  // actually lost — a real user saw this as their just-saved CV vanishing
  // for a moment after leaving and returning to the editor.
  const loadInFlight = useRef(false);

  const loadCVs = useCallback(async () => {
    if (loadInFlight.current) return;
    loadInFlight.current = true;
    setLoading(true);
    await readLocal(); // show what's on the device right away
    try {
      const server = await apiClient.listCVs();
      // Best-effort persist — but a storage failure must NEVER hide rows the
      // server just handed us. That combination is exactly how a returning user
      // on a fresh install ended up staring at "CV zako zipo hapa" while six
      // CVs sat on the server: the write threw, the re-read returned [], and
      // nothing said so.
      //
      // Skip any CV that still has an unsynced edit queued (use-offline-sync's
      // sync_queue). Without this, a screen-focus refresh right after an edit
      // — before the queue has actually flushed to the server — overwrites the
      // just-made local edit with the server's stale pre-edit copy. The edit
      // itself isn't lost (it's still queued and will eventually sync), but
      // the user would see it vanish from the list until the sync completes.
      let queuedCvIds: Set<string>;
      try {
        const queue = await offlineStorage.getSyncQueue();
        queuedCvIds = new Set(queue.map((item) => item.cvId));
      } catch {
        queuedCvIds = new Set();
      }
      let persistFailed = false;
      for (const cv of cvsSafeToPersist(server, queuedCvIds)) {
        // One failed write means the local store is unusable — stop trying.
        // Waiting on every row here is what froze the UI for ~10 s (624 skipped
        // frames) once the SQLite layer started failing: six sequential writes,
        // each with its own retry, all blocking the list from rendering.
        if (persistFailed) break;
        try {
          await offlineStorage.saveCVOffline({ ...cv, userId: LOCAL_USER });
        } catch {
          persistFailed = true;
        }
      }
      const local = await readLocal();
      if (mounted.current) {
        const storageUnusable = local.length === 0 && server.length > 0;
        if (storageUnusable) setCvs(server);
        setStorageBlocked(persistFailed || storageUnusable);
        setError(null);
        setErrorKind(null);
      }
    } catch (e) {
      // Offline / not signed in — the local list still stands.
      if (mounted.current) {
        setError(e instanceof Error ? e.message : "Couldn't refresh from the server");
        setErrorKind(classifyCvError(e));
      }
    } finally {
      loadInFlight.current = false;
      if (mounted.current) setLoading(false);
    }
  }, [readLocal, LOCAL_USER]);

  const deleteCV = useCallback(async (id: string) => {
    await offlineStorage.deleteCVOffline(id).catch(() => {});
    if (mounted.current) setCvs((prev) => prev.filter((cv) => cv.id !== id));
    // Drop any create/update already queued for this id — otherwise an edit
    // made offline, followed by an online delete (which bypasses the queue
    // entirely on success), leaves a stale queued update behind. It fires on
    // a later sync pass and, since a non-synced id's queued op goes through
    // apiClient.createCV's idempotent-by-clientId upsert, resurrects the exact
    // CV that was just deleted.
    try {
      const queue = await offlineStorage.getSyncQueue();
      for (const itemId of queueItemIdsToDropOnDelete(queue, id)) {
        await offlineStorage.removeSyncQueueItem(itemId).catch(() => {});
      }
    } catch {
      /* best-effort */
    }
    try {
      // A synced CV has a server id (m_…) — delete it directly. A local-only
      // row is keyed by its id as clientId.
      if (id.startsWith("m_")) await apiClient.deleteCV(id);
      else await apiClient.deleteCVByClientId(id);
    } catch {
      // Offline / transient — queue it so it isn't resurrected on next sync.
      await offlineStorage
        .addToSyncQueue({
          id: `delete_cv-${id}-${Date.now()}`,
          cvId: id,
          operation: "delete_cv",
          data: undefined,
          timestamp: Date.now(),
          retries: 0,
        } as never)
        .catch(() => {});
    }
  }, []);

  const updateCV = useCallback(
    async (id: string, patch: Partial<CV>) => {
      const current = cvs.find((cv) => cv.id === id);
      const merged = {
        ...(current ?? {}),
        ...patch,
        id,
        userId: LOCAL_USER,
        updatedAt: new Date(),
      } as CV;
      await offlineStorage.saveCVOffline(merged).catch(() => {});
      await readLocal();
      try {
        if (id.startsWith("m_")) await apiClient.updateCV(id, patch);
        else await apiClient.createCV({ ...merged, clientId: id });
      } catch {
        await offlineStorage
          .addToSyncQueue({
            id: `update_cv-${id}-${Date.now()}`,
            cvId: id,
            operation: "update_cv",
            data: merged,
            timestamp: Date.now(),
            retries: 0,
          } as never)
          .catch(() => {});
      }
      return merged;
    },
    [cvs, readLocal, LOCAL_USER],
  );

  useEffect(() => {
    mounted.current = true;
    loadCVs();
    return () => {
      mounted.current = false;
    };
  }, [loadCVs]);

  // Coming back to a screen (e.g. from the editor) — re-read the local cache so
  // a just-saved CV shows immediately. Cheap: SQLite read, no network.
  //
  // But if we have nothing to show, or the last sync failed, a local read can
  // never help: the rows were never cached. Go back to the server instead, so a
  // returning user is not stuck on "huna CV" while their CVs sit on the server.
  useFocusEffect(
    useCallback(() => {
      mounted.current = true;
      if (latest.current.count === 0 || latest.current.error) loadCVs();
      else readLocal();
      return () => {};
    }, [loadCVs, readLocal]),
  );

  return { cvs, loading, error, errorKind, storageBlocked, loadCVs, deleteCV, updateCV };
}
