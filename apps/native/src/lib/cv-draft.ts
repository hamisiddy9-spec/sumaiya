/**
 * CV editor draft persistence — device-local only, never synced.
 *
 * This is deliberately NOT `offlineStorage` (the `cvs` SQLite table): that table
 * holds real, saved documents with their own sync/claim/export rules. A draft is
 * what's mid-typing and has never been through Save. Keeping the two in separate
 * storage systems (AsyncStorage vs SQLite, distinct key prefix) makes it
 * structurally impossible for a draft write to land in the saved-document path.
 *
 * Keyed by the document being edited: a real `cvId` for an existing CV, or the
 * fixed NEW_SLOT for a CV that has never been saved (it has no stable id yet —
 * "New CV" always starts from a freshly generated id, so a random id can't be
 * the key or the draft would be unreachable after the app is killed and
 * relaunched).
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CVData } from "@sumaiya/types";

const PREFIX = "cv_draft_v1:";
const NEW_SLOT = "new";

export interface CvDraft {
  data: Partial<CVData>;
  template: string;
  accent: string;
  savedAt: number;
}

function keyFor(cvId: string | null): string {
  return PREFIX + (cvId || NEW_SLOT);
}

export async function loadDraft(cvId: string | null): Promise<CvDraft | null> {
  try {
    const raw = await AsyncStorage.getItem(keyFor(cvId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !parsed.data) return null;
    return parsed as CvDraft;
  } catch {
    // A corrupt or unreadable entry is treated as "no draft" rather than
    // thrown — restoring is best-effort and must never block opening the editor.
    return null;
  }
}

/**
 * Returns whether the write landed. `AsyncStorage.setItem` on a single key is
 * all-or-nothing (it either replaces the value or throws leaving the old value
 * in place) — so a failed call here already satisfies "never worse than
 * nothing": the previously-saved draft is untouched, and the caller can keep
 * showing it as the last known-good copy.
 */
export async function saveDraft(cvId: string | null, draft: Omit<CvDraft, "savedAt">): Promise<boolean> {
  try {
    await AsyncStorage.setItem(keyFor(cvId), JSON.stringify({ ...draft, savedAt: Date.now() }));
    return true;
  } catch {
    return false;
  }
}

export async function clearDraft(cvId: string | null): Promise<void> {
  try {
    await AsyncStorage.removeItem(keyFor(cvId));
  } catch {
    // best-effort — a leftover draft is stale, not harmful
  }
}
