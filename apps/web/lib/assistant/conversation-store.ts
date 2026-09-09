/**
 * Chat conversation store — multi-conversation persistence for the Sumaiya
 * assistant.
 *
 * Previously the assistant kept ONE permanent thread per user in localStorage
 * (`sumaiya-assistant-v3:{scope}`) with no way to start fresh, list, open
 * or retire old chats. This module is the pure, unit-tested shape behind the
 * v4 store: multiple conversations, an active pointer, per-conversation
 * metadata, and a retention policy so old threads never pile up forever.
 *
 * Rules:
 *  - messages stay generic (`unknown[]`) so the lib never imports the chat's
 *    React card types — it stays pure and testable.
 *  - pruneConversations is the ONE place retention is enforced: conversations
 *    untouched for RETENTION_MS (30 days) are dropped, and the store never
 *    keeps more than MAX_CONVERSATIONS (oldest-first eviction).
 *  - a pruned activeId falls back to null (the component starts fresh), never
 *    to a wrong thread.
 *  - migrateLegacy wraps the old single-thread shape into a v4 store so
 *    existing users don't lose their history.
 */

export interface StoredConversation {
  id: string;
  /** Auto-title from the first real user message (or the doc label). */
  title: string;
  docType: string | null;
  done: boolean;
  seenSignals?: string[];
  effort?: string;
  messages: unknown[];
  createdAt: number;
  updatedAt: number;
}

export interface ConversationStoreData {
  conversations: StoredConversation[];
  activeId: string | null;
}

export interface LegacyThread {
  messages: unknown[];
  docType: string | null;
  done: boolean;
  seenSignals?: string[];
  effort?: string;
}

export const MAX_CONVERSATIONS = 20;
export const RETENTION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const TITLE_MAX = 60;

export function emptyStore(): ConversationStoreData {
  return { conversations: [], activeId: null };
}

/**
 * Auto-title: the first real user message, trimmed to TITLE_MAX chars; falls
 * back to the document label, then a generic "New chat". Never empty.
 */
export function conversationTitle(firstUserText: string, docTypeLabel: string | null, sw: boolean): string {
  const text = (firstUserText || "").trim().replace(/\s+/g, " ");
  if (text) {
    return text.length > TITLE_MAX ? `${text.slice(0, TITLE_MAX - 1).trimEnd()}…` : text;
  }
  if (docTypeLabel) return docTypeLabel;
  return sw ? "Mazungumzo mapya" : "New chat";
}

/** The first user-authored message in a thread (assistant greeting ignored). */
export function firstUserMessage(messages: readonly { role?: string; content?: string }[]): string {
  for (const m of messages) {
    if (m?.role === "user" && typeof m.content === "string" && m.content.trim()) {
      return m.content.trim();
    }
  }
  return "";
}

/**
 * Enforce retention: drop conversations untouched for RETENTION_MS, then keep
 * the newest MAX_CONVERSATIONS. Deterministic — same input + now = same output.
 */
export function pruneConversations(data: ConversationStoreData, now = Date.now()): ConversationStoreData {
  const cutoff = now - RETENTION_MS;
  let list = data.conversations
    .filter((c) => c.updatedAt >= cutoff)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, MAX_CONVERSATIONS);
  const activeId = list.some((c) => c.id === data.activeId) ? data.activeId : null;
  return { conversations: list, activeId };
}

/** Insert or replace a conversation, touch its updatedAt, enforce retention. */
export function upsertConversation(data: ConversationStoreData, convo: StoredConversation, now = Date.now()): ConversationStoreData {
  const existing = data.conversations.find((c) => c.id === convo.id);
  const fresh: StoredConversation = {
    ...convo,
    createdAt: existing?.createdAt ?? convo.createdAt ?? now,
    updatedAt: now,
  };
  const list = existing
    ? data.conversations.map((c) => (c.id === convo.id ? fresh : c))
    : [fresh, ...data.conversations];
  return pruneConversations({ conversations: list, activeId: convo.id }, now);
}

export function deleteConversation(data: ConversationStoreData, id: string): ConversationStoreData {
  const list = data.conversations.filter((c) => c.id !== id);
  const activeId = data.activeId === id ? null : data.activeId;
  return { conversations: list, activeId };
}

export function openConversation(data: ConversationStoreData, id: string): ConversationStoreData {
  return data.conversations.some((c) => c.id === id)
    ? { ...data, activeId: id }
    : data;
}

/** Wrap the old single-thread shape into a v4 store (title from real history). */
export function migrateLegacy(legacy: LegacyThread, now = Date.now(), sw = false): ConversationStoreData {
  if (!Array.isArray(legacy.messages) || legacy.messages.length === 0) return emptyStore();
  const title = conversationTitle(
    firstUserMessage(legacy.messages as { role?: string; content?: string }[]),
    typeof legacy.docType === "string" ? legacy.docType : null,
    sw
  );
  const convo: StoredConversation = {
    id: "legacy",
    title,
    docType: legacy.docType ?? null,
    done: !!legacy.done,
    seenSignals: Array.isArray(legacy.seenSignals) ? legacy.seenSignals : undefined,
    messages: legacy.messages,
    createdAt: now,
    updatedAt: now,
  };
  return pruneConversations({ conversations: [convo], activeId: "legacy" }, now);
}

/** Shape-validate a stored conversation — tampered storage never crashes render. */
export function isValidConversation(c: unknown): c is StoredConversation {
  if (!c || typeof c !== "object") return false;
  const o = c as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.title === "string" &&
    Array.isArray(o.messages) &&
    (o.docType === null || typeof o.docType === "string") &&
    typeof o.done === "boolean"
  );
}
