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
 * The scoping/claim mechanism itself lives in lib/owner-scope.ts, which every
 * per-person store now shares (this transcript, and Sumaiya's memory in
 * ai-memory.ts). This module is the chat-shaped adapter over it: it names the
 * base key and caps the stored transcript.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { clearScoped, readScoped, scopedKey, writeScoped, type ScopedStorage } from "./owner-scope";

/** The pre-scope key. Also the base every owner-scoped key is built from. */
export const LEGACY_CHAT_KEY = "sumaiya_chat_v1";

/** The device-local key holding ONE owner's transcript. */
export function chatKeyFor(ownerId: string): string {
  return scopedKey(LEGACY_CHAT_KEY, ownerId);
}

/** The slice of AsyncStorage this module needs — injectable for tests. */
export type ChatStorage = ScopedStorage;

/**
 * Read the raw transcript for `ownerId`, claiming a still-unscoped transcript
 * (and a guest's, when an account is now using the app) exactly once.
 *
 * Returns the raw JSON string, or null when this owner has no transcript.
 */
export function readChatFor(ownerId: string, storage: ChatStorage = AsyncStorage): Promise<string | null> {
  return readScoped(LEGACY_CHAT_KEY, ownerId, storage);
}

/** Persist one owner's transcript, capped at the newest 40 turns. */
export function writeChatFor(
  ownerId: string,
  messages: readonly unknown[],
  storage: ChatStorage = AsyncStorage,
): Promise<void> {
  return writeScoped(LEGACY_CHAT_KEY, ownerId, JSON.stringify(messages.slice(-40)), storage);
}

/** Erase one owner's transcript — and only theirs. */
export function clearChatFor(ownerId: string, storage: ChatStorage = AsyncStorage): Promise<void> {
  return clearScoped(LEGACY_CHAT_KEY, ownerId, storage);
}
