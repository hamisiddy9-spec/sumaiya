// Shared React hooks for auth, offline sync, CV management

import { useState, useEffect, useCallback, useRef } from "react";
import type { CV, AuthUser, CVData } from "@sumaiya/types";
import { SyncQueue } from "@sumaiya/utils";
import { getStorage } from "@sumaiya/utils";

/**
 * Hook: useAuth
 * Manages authentication state (login, logout, current user).
 */
export function useAuth(apiClient: any) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const currentUser = await apiClient.getMe();
        setUser(currentUser);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Auth failed");
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [apiClient]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      try {
        const { user: newUser, token } = await apiClient.signIn(email, password);
        apiClient.setAccessToken(token);
        setUser(newUser);
        return newUser;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Sign in failed";
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiClient]
  );

  const signOut = useCallback(async () => {
    await apiClient.signOut();
    setUser(null);
  }, [apiClient]);

  return { user, loading, error, signIn, signOut };
}

/**
 * Hook: useCVs
 * Manages CV list (load, create, update, delete).
 */
export function useCVs(apiClient: any) {
  const [cvs, setCvs] = useState<CV[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCVs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.listCVs();
      setCvs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load CVs");
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  const createCV = useCallback(
    async (data: Partial<CV>) => {
      try {
        const newCV = await apiClient.createCV(data);
        setCvs((prev) => [...prev, newCV]);
        return newCV;
      } catch (err) {
        throw err;
      }
    },
    [apiClient]
  );

  const updateCV = useCallback(
    async (id: string, data: Partial<CV>) => {
      try {
        const updated = await apiClient.updateCV(id, data);
        setCvs((prev) => prev.map((cv) => (cv.id === id ? updated : cv)));
        return updated;
      } catch (err) {
        throw err;
      }
    },
    [apiClient]
  );

  const deleteCV = useCallback(
    async (id: string) => {
      try {
        await apiClient.deleteCV(id);
        setCvs((prev) => prev.filter((cv) => cv.id !== id));
      } catch (err) {
        throw err;
      }
    },
    [apiClient]
  );

  useEffect(() => {
    loadCVs();
  }, [loadCVs]);

  return { cvs, loading, error, loadCVs, createCV, updateCV, deleteCV };
}

/**
 * Hook: useOfflineSync
 * Manages offline sync queue (enqueue operations, sync when online).
 */
export function useOfflineSync(apiClient: any) {
  const syncQueueRef = useRef(new SyncQueue());
  const [isSynced, setIsSynced] = useState(true);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    const loadQueue = async () => {
      const storage = getStorage();
      await syncQueueRef.current.load(storage);
      setPending(syncQueueRef.current.size());
    };
    loadQueue();
  }, []);

  const enqueue = useCallback(
    async (cvId: string, op: "create" | "update" | "delete", cv: CV | null) => {
      syncQueueRef.current.enqueue(cvId, op, cv);
      setPending(syncQueueRef.current.size());
      const storage = getStorage();
      await syncQueueRef.current.save(storage);
      setIsSynced(false);
    },
    []
  );

  const syncNow = useCallback(async () => {
    const items = syncQueueRef.current.getConflictFree();
    if (items.length === 0) {
      setIsSynced(true);
      return;
    }

    try {
      const result = await apiClient.syncQueue(items);

      for (const id of result.synced) {
        syncQueueRef.current.markSynced(id);
      }

      for (const id of result.failed) {
        syncQueueRef.current.markFailed(id, "Sync failed");
      }

      const storage = getStorage();
      await syncQueueRef.current.save(storage);
      setPending(syncQueueRef.current.size());
      setIsSynced(pending === 0);
    } catch (error) {
      console.error("Sync error:", error);
    }
  }, [apiClient, pending]);

  return { isSynced, pending, enqueue, syncNow };
}

/**
 * Hook: useConnectivity
 * Detect online/offline state.
 */
export function useConnectivity() {
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof navigator !== "undefined") {
      return navigator.onLine;
    }
    return true;
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}
