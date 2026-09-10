import type { CV } from "@sumaiya/types";

/**
 * A CV synced to the server comes back under a server-derived id
 * (m_hash(userId:clientId)), while the row we created offline still has its
 * random local id — so folding the server list into the local cache can leave
 * the same CV twice.
 *
 * This collapses ONLY the exact create-then-sync signature: one local-id row
 * and one server-id (m_…) row with the same real person's name and title,
 * where the server copy has caught up. It never merges two blank "My CV"
 * rows and never drops a local row with a newer (unsynced) edit.
 */
export function dedupe(list: CV[]): { kept: CV[]; drop: string[] } {
  const drop = new Set<string>();
  const named = (cv: CV) => (cv.data?.personalInfo?.fullName || "").trim().toLowerCase();

  for (const local of list) {
    if (local.id.startsWith("m_") || drop.has(local.id)) continue;
    const name = named(local);
    if (!name) continue;
    const serverTwin = list.find(
      (s) =>
        s.id.startsWith("m_") &&
        !drop.has(s.id) &&
        named(s) === name &&
        (s.title || "") === (local.title || ""),
    );
    if (serverTwin && +new Date(serverTwin.updatedAt) >= +new Date(local.updatedAt) - 2000) {
      drop.add(local.id);
    }
  }

  return { kept: list.filter((cv) => !drop.has(cv.id)), drop: [...drop] };
}
