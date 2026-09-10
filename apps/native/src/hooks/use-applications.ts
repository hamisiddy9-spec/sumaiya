import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  listApplications,
  getApplication,
  createApplication,
  updateApplication,
  deleteApplication,
  type Application,
} from "../lib/applications-store";
import { reportError } from "../lib/reporting";

export function useApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setApplications(await listApplications());
    } catch (e) {
      reportError(e, { scope: "applications.load" });
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const add = useCallback(
    async (input: Partial<Application> & { company: string; role: string }) => {
      const app = await createApplication(input);
      await refresh();
      return app;
    },
    [refresh],
  );

  const patch = useCallback(
    async (id: string, p: Partial<Application>) => {
      // optimistic
      setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, ...p, updatedAt: Date.now() } : a)));
      await updateApplication(id, p);
      await refresh();
    },
    [refresh],
  );

  const remove = useCallback(
    async (id: string) => {
      setApplications((prev) => prev.filter((a) => a.id !== id));
      await deleteApplication(id);
      await refresh();
    },
    [refresh],
  );

  return { applications, loading, refresh, add, patch, remove };
}

export function useApplication(id: string | undefined) {
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!id) return;
    setApplication(await getApplication(id));
    setLoading(false);
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { application, loading, refresh };
}
