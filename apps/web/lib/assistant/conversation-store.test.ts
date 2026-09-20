import { describe, expect, it } from "vitest";
import {
  MAX_CONVERSATIONS,
  RETENTION_MS,
  conversationTitle,
  deleteConversation,
  emptyStore,
  firstUserMessage,
  isValidConversation,
  migrateLegacy,
  openConversation,
  pruneConversations,
  searchConversations,
  upsertConversation,
} from "./conversation-store";

const DAY = 86_400_000;
const now = 1_800_000_000_000;

function convo(id: string, updatedAt: number, title = `Chat ${id}`) {
  return { id, title, docType: null, done: false, messages: [], createdAt: updatedAt, updatedAt };
}

describe("conversationTitle", () => {
  it("uses the first real user message, trimmed", () => {
    expect(conversationTitle("  I need a CV for a bank job  ", null, false)).toBe("I need a CV for a bank job");
  });

  it("collapses whitespace and truncates at 60 chars", () => {
    const long = "a ".repeat(50) + "b ".repeat(50);
    const t = conversationTitle(long, null, false);
    expect(t.length).toBeLessThanOrEqual(61);
    expect(t.endsWith("…")).toBe(true);
  });

  it("falls back to the doc label, then a generic new-chat label", () => {
    expect(conversationTitle("", "cover-letter", false)).toBe("cover-letter");
    expect(conversationTitle("", null, false)).toBe("New chat");
    expect(conversationTitle("", null, true)).toBe("Mazungumzo mapya");
  });
});

describe("firstUserMessage", () => {
  it("skips the assistant greeting and finds the first user text", () => {
    const messages = [
      { role: "assistant", content: "Welcome!" },
      { role: "user", content: "  " },
      { role: "user", content: "Tengeneza CV ya mhandisi" },
    ];
    expect(firstUserMessage(messages)).toBe("Tengeneza CV ya mhandisi");
  });

  it("returns empty when there is no real user text", () => {
    expect(firstUserMessage([{ role: "assistant", content: "hi" }])).toBe("");
  });
});

describe("pruneConversations", () => {
  it("drops conversations untouched for 30 days", () => {
    const store = {
      conversations: [
        convo("old", now - RETENTION_MS - 1),
        convo("fresh", now - DAY),
      ],
      activeId: "old",
    };
    const pruned = pruneConversations(store, now);
    expect(pruned.conversations.map((c) => c.id)).toEqual(["fresh"]);
    expect(pruned.activeId).toBeNull(); // pruned active → null, never wrong thread
  });

  it("keeps at most MAX_CONVERSATIONS, newest first", () => {
    const list = Array.from({ length: MAX_CONVERSATIONS + 5 }, (_, i) => convo(`c${i}`, now - i));
    const pruned = pruneConversations({ conversations: list, activeId: "c0" }, now);
    expect(pruned.conversations).toHaveLength(MAX_CONVERSATIONS);
    expect(pruned.conversations[0].id).toBe("c0");
    expect(pruned.conversations.some((c) => c.id === `c${MAX_CONVERSATIONS + 4}`)).toBe(false);
  });

  it("preserves the active conversation when it is fresh", () => {
    const store = { conversations: [convo("a", now), convo("b", now - DAY)], activeId: "a" };
    expect(pruneConversations(store, now).activeId).toBe("a");
  });
});

describe("upsertConversation", () => {
  it("inserts new conversations and makes them active", () => {
    const store = upsertConversation(emptyStore(), { ...convo("n1", now), messages: ["x"] }, now);
    expect(store.conversations).toHaveLength(1);
    expect(store.activeId).toBe("n1");
    expect(store.conversations[0].updatedAt).toBe(now);
  });

  it("updates in place and preserves createdAt", () => {
    const first = upsertConversation(emptyStore(), convo("n1", now), now);
    const second = upsertConversation(first, { ...convo("n1", now + 5), title: "New title" }, now + 5);
    expect(second.conversations).toHaveLength(1);
    expect(second.conversations[0].title).toBe("New title");
    expect(second.conversations[0].createdAt).toBe(now);
    expect(second.conversations[0].updatedAt).toBe(now + 5);
  });
});

describe("deleteConversation / openConversation", () => {
  it("removes a conversation and clears the active pointer when it was active", () => {
    const store = { conversations: [convo("a", now), convo("b", now)], activeId: "a" };
    const next = deleteConversation(store, "a");
    expect(next.conversations.map((c) => c.id)).toEqual(["b"]);
    expect(next.activeId).toBeNull();
  });

  it("keeps the active pointer when deleting another conversation", () => {
    const store = { conversations: [convo("a", now), convo("b", now)], activeId: "a" };
    expect(deleteConversation(store, "b").activeId).toBe("a");
  });

  it("openConversation only accepts existing ids", () => {
    const store = { conversations: [convo("a", now)], activeId: null };
    expect(openConversation(store, "missing").activeId).toBeNull();
    expect(openConversation(store, "a").activeId).toBe("a");
  });
});

describe("migrateLegacy", () => {
  it("wraps a legacy single thread into a v4 store with a real title", () => {
    const legacy = {
      messages: [
        { role: "assistant", content: "Welcome!" },
        { role: "user", content: "Nataka CV ya mhandisi wa programu" },
      ],
      docType: "cv",
      done: true,
      seenSignals: ["sig1"],
    };
    const store = migrateLegacy(legacy, now, true);
    expect(store.conversations).toHaveLength(1);
    expect(store.activeId).toBe("legacy");
    expect(store.conversations[0].title).toBe("Nataka CV ya mhandisi wa programu");
    expect(store.conversations[0].done).toBe(true);
    expect(store.conversations[0].seenSignals).toEqual(["sig1"]);
  });

  it("returns an empty store for an empty legacy thread", () => {
    expect(migrateLegacy({ messages: [], docType: null, done: false }, now)).toEqual(emptyStore());
  });
});

describe("searchConversations", () => {
  const list = [
    { ...convo("a", now, "Bank teller CV"), messages: [{ role: "user", content: "I need a CV for a bank job" }] },
    { ...convo("b", now, "Mazungumzo mapya"), messages: [{ role: "user", content: "Tengeneza barua ya kufunika" }] },
  ];

  it("returns everything for an empty query", () => {
    expect(searchConversations(list, "")).toEqual(list);
  });

  it("returns everything for a whitespace-only query", () => {
    expect(searchConversations(list, "   ")).toEqual(list);
  });

  it("matches on the conversation title, case-insensitively", () => {
    expect(searchConversations(list, "BANK").map((c) => c.id)).toEqual(["a"]);
  });

  it("matches on a message body, case-insensitively", () => {
    expect(searchConversations(list, "kufunika").map((c) => c.id)).toEqual(["b"]);
  });

  it("returns an empty array when nothing matches", () => {
    expect(searchConversations(list, "nonexistent query")).toEqual([]);
  });

  it("preserves input order", () => {
    const reordered = [list[1], list[0]];
    expect(searchConversations(reordered, "").map((c) => c.id)).toEqual(["b", "a"]);
    expect(searchConversations(reordered, "cv").map((c) => c.id)).toEqual(["a"]);
  });

  it("does not throw on malformed messages", () => {
    const malformed = [
      { ...convo("c", now, "No content field"), messages: [{ role: "user" }] },
      { ...convo("d", now, "Numeric content"), messages: [{ role: "user", content: 42 }] },
      { ...convo("e", now, "Object content"), messages: [{ role: "user", content: { text: "hidden" } }] },
      { ...convo("f", now, "Non-array messages"), messages: "not an array" as unknown as unknown[] },
    ];
    expect(() => searchConversations(malformed, "anything")).not.toThrow();
    expect(searchConversations(malformed, "anything")).toEqual([]);
    expect(searchConversations(malformed, "content field").map((c) => c.id)).toEqual(["c"]);
  });
});

describe("isValidConversation", () => {
  it("accepts a well-formed conversation and rejects junk", () => {
    expect(isValidConversation(convo("a", now))).toBe(true);
    expect(isValidConversation(null)).toBe(false);
    expect(isValidConversation({ id: "a", title: "x", messages: "nope", done: true })).toBe(false);
    expect(isValidConversation({ id: "a", title: "x", messages: [], docType: "cv", done: true })).toBe(true);
  });
});
