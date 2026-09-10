import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import type { CV } from "@sumaiya/types";
import { offlineStorage } from "@sumaiya/utils";
import { apiClient } from "../lib/api-client";
import { dedupe } from "../lib/cv-dedupe";

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
const LOCAL_USER = "me";

export function useCvs() {
  const [cvs, setCvs] = useState<CV[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

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
  }, []);

  const loadCVs = useCallback(async () => {
    setLoading(true);
    await readLocal(); // show what's on the device right away
    try {
      const server = await apiClient.listCVs();
      for (const cv of server) {
        await offlineStorage.saveCVOffline({ ...cv, userId: LOCAL_USER }).catch(() => {});
      }
      await readLocal();
      if (mounted.current) setError(null);
    } catch (e) {
      // Offline / not signed in — the local list still stands.
      if (mounted.current) {
        setError(e instanceof Error ? e.message : "Couldn't refresh from the server");
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [readLocal]);

  const deleteCV = useCallback(async (id: string) => {
    await offlineStorage.deleteCVOffline(id).catch(() => {});
    if (mounted.current) setCvs((prev) => prev.filter((cv) => cv.id !== id));
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
    [cvs, readLocal],
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
  useFocusEffect(
    useCallback(() => {
      mounted.current = true;
      readLocal();
      return () => {};
    }, [readLocal]),
  );

  return { cvs, loading, error, loadCVs, deleteCV, updateCV };
}
