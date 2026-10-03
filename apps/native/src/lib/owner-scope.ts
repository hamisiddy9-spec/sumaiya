/**
 * ONE OWNER'S DEVICE DATA — scoped to the PERSON, never the install.
 *
 * The pattern chat-scope.ts established for the chat transcript, extracted here
 * so every per-person store on the device shares ONE implementation instead of a
 * bespoke copy each. It is the same defect every time: a person's private data
 * written under a device-wide key with no owner in it, so on a shared handset
 * the next person to open the app is handed the previous person's data.
 *
 * A key written here names its owner (`scopedKey(base, ownerId)` →
 * `<base>:<ownerId>`). A value written before scoping existed (the bare `<base>`
 * key) or by a guest (`<base>:guest`) cannot name an owner, so it is CLAIMED
 * ONCE by the owner present when it is first read, moved into that owner's scope
 * and deleted at the source — so nobody after them can inherit it. That is the
 * same one-time migration chat-scope.ts performs for the transcript, and the
 * same "a guest's work follows them into an account" rule lib/local-owner.ts
 * applies to CVs.
 *
 * The owner id is the SAME id the CV store uses (`ownerIdFor` — the account id,
 * or GUEST_OWNER_ID when signed out), so "whose data is this" has one answer in
 * the app rather than two.
 *
 * CALLERS MUST NOT GUESS AN OWNER WHILE THE SESSION RESTORES. A read claims an
 * unscoped value for whoever is present, so reading under the guest bucket
 * before the persisted account session has loaded would claim the signed-in
 * user's data into the guest bucket. Callers gate on the auth context's
 * `loading` first (as use-sumaiya-chat.ts and memory-screen.tsx do).
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GUEST_OWNER_ID, LEGACY_GUEST_OWNER_IDS } from "./local-owner";

/** The slice of AsyncStorage this module needs — injectable for tests. */
export interface ScopedStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

/** The device-local key holding ONE owner's value for the store `base`. */
export function scopedKey(base: string, ownerId: string): string {
  return `${base}:${ownerId}`;
}

/** Every key holding `base` for a guest — current and legacy spellings. */
function guestDonors(base: string): string[] {
  return [scopedKey(base, GUEST_OWNER_ID), ...LEGACY_GUEST_OWNER_IDS.map((g) => scopedKey(base, g))];
}

/**
 * Read the value for `ownerId` under `base`, claiming a still-unscoped value
 * (the pre-scope `base` key itself) or a guest's exactly once.
 *
 * Returns the raw string, or null when this owner has nothing. Never throws on
 * storage trouble — the caller gets null and the app falls back to empty.
 */
export async function readScoped(
  base: string,
  ownerId: string,
  storage: ScopedStorage = AsyncStorage,
): Promise<string | null> {
  const key = scopedKey(base, ownerId);
  const own = await storage.getItem(key).catch(() => null);
  if (own !== null) return own;

  // Nothing under this owner yet: adopt whatever is still addressed to the
  // device rather than to a person, and delete it at the source so the next
  // person cannot inherit it. ORDER MATTERS — the unscoped key first (it is the
  // pre-scope value and belongs to whoever is here at the upgrade), then the
  // guest buckets, current and legacy spellings. A claim that skips a spelling
  // leaves that value orphaned.
  const donors = [base, ...guestDonors(base)].filter((donor) => donor !== key);

  for (const donor of donors) {
    const raw = await storage.getItem(donor).catch(() => null);
    if (raw === null) continue;
    await storage.setItem(key, raw).catch(() => {});
    await storage.removeItem(donor).catch(() => {});
    return raw;
  }
  return null;
}

/** Persist one owner's value under `base`. Never throws. */
export function writeScoped(
  base: string,
  ownerId: string,
  value: string,
  storage: ScopedStorage = AsyncStorage,
): Promise<void> {
  return storage.setItem(scopedKey(base, ownerId), value).catch(() => {});
}

/** Erase one owner's value — and only theirs. Never throws. */
export function clearScoped(
  base: string,
  ownerId: string,
  storage: ScopedStorage = AsyncStorage,
): Promise<void> {
  return storage.removeItem(scopedKey(base, ownerId)).catch(() => {});
}
