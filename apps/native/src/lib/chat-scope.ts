/**
 * WHICH TRANSCRIPT A DEVICE MAY SHOW — scoped to its OWNER, not the install.
 *
 * Sumaiya's chat is a private confidant, but its transcript used to live under
 * one device-wide key (`sumaiya_chat_v1`) with no owner in it. On a shared
 * handset the next person to open Sumaiya was therefore handed the previous
 * person's conversation — after one user signed out and another signed in, the
 * second person was restored the first person's chat. The web client scopes its
 * transcript the same way and for the same reason (see
 * apps/web/components/assistant/cv-assistant-client.tsx): the storage key names
 * the owner.
 *
 * The owner is the SAME id the CV store uses (`ownerIdFor` — the account id, or
 * GUEST_OWNER_ID when nobody is signed in), so "whose chat is this" has one
 * answer in the app rather than two.
 *
 * A transcript written before this scoping existed (the unscoped
 * `sumaiya_chat_v1` key) cannot name an owner, so it is CLAIMED ONCE by the
 * owner using the app when it is first read: moved into that owner's scope and
 * the legacy key deleted, so nobody after them can inherit it. A guest's
 * transcript is claimed the same way when the same person signs in — a claim,
 * not a leak, and the guest bucket is emptied, exactly as lib/local-owner.ts
 * does for CVs.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GUEST_OWNER_ID, LEGACY_GUEST_OWNER_IDS } from "./local-owner";

/** The pre-scope key. Kept only so a first read can migrate it away. */
export const LEGACY_CHAT_KEY = "sumaiya_chat_v1";

/** The device-local key holding ONE owner's transcript. */
export function chatKeyFor(ownerId: string): string {
  return `${LEGACY_CHAT_KEY}:${ownerId}`;
}

/** The slice of AsyncStorage this module needs — injectable for tests. */
export interface ChatStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

/**
 * Read the raw transcript for `ownerId`, claiming a still-unscoped transcript
 * (and a guest's, when an account is now using the app) exactly once.
 *
 * Returns the raw JSON string, or null when this owner has no transcript.
 */
export async function readChatFor(
  ownerId: string,
  storage: ChatStorage = AsyncStorage,
): Promise<string | null> {
  const key = chatKeyFor(ownerId);
  const own = await storage.getItem(key).catch(() => null);
  if (own !== null) return own;

  // Nothing under this owner yet: adopt whatever is still addressed to the
  // device rather than to a person, and delete it at the source so the next
  // person cannot inherit it. ORDER MATTERS — the unscoped key first (it is the
  // pre-scope transcript and belongs to whoever is here at the upgrade), then
  // the guest buckets, current and legacy spellings. A claim that skips a
  // spelling leaves that transcript orphaned.
  const donors = [
    LEGACY_CHAT_KEY,
    chatKeyFor(GUEST_OWNER_ID),
    ...LEGACY_GUEST_OWNER_IDS.map(chatKeyFor),
  ].filter((donor) => donor !== key);

  for (const donor of donors) {
    const raw = await storage.getItem(donor).catch(() => null);
    if (raw === null) continue;
    await storage.setItem(key, raw).catch(() => {});
    await storage.removeItem(donor).catch(() => {});
    return raw;
  }
  return null;
}

/** Persist one owner's transcript, capped at the newest 40 turns. */
export function writeChatFor(
  ownerId: string,
  messages: readonly unknown[],
  storage: ChatStorage = AsyncStorage,
): Promise<void> {
  return storage
    .setItem(chatKeyFor(ownerId), JSON.stringify(messages.slice(-40)))
    .catch(() => {});
}

/** Erase one owner's transcript — and only theirs. */
export function clearChatFor(ownerId: string, storage: ChatStorage = AsyncStorage): Promise<void> {
  return storage.removeItem(chatKeyFor(ownerId)).catch(() => {});
}
