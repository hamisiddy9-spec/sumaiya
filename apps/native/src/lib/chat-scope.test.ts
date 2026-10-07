/**
 * The chat transcript is a private confidant's, so it must be scoped to the
 * PERSON, not the install.
 *
 * The defect this pins: the transcript lived under one device-wide key
 * (`sumaiya_chat_v1`) with no owner in it, so on a shared handset the next
 * person to open Sumaiya was restored the previous person's conversation —
 * after one user signed out and another signed in, B saw A's messages.
 *
 * These tests fail on that old behaviour in the only way that matters: they
 * assert that a read for owner B returns NOTHING when the only transcript on
 * the device is A's, and that the guest is handed nothing of a signed-in
 * user's. The migration (a pre-scope transcript claimed once) and the
 * guest-signs-in claim are pinned here too.
 */
jest.mock("@sumaiya/utils", () => ({ offlineStorage: {} }));
// AsyncStorage ships a native module that does not exist under jest — mock it
// file-locally (as src/lib/ai-memory.test.ts does) so the import cannot kill
// the suite. Every call below injects its own in-memory storage anyway.
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

import {
  LEGACY_CHAT_KEY,
  chatKeyFor,
  clearChatFor,
  readChatFor,
  writeChatFor,
  type ChatStorage,
} from "./chat-scope";
import { GUEST_OWNER_ID } from "./local-owner";

/** In-memory AsyncStorage — the same get/set/remove contract. */
function memStorage(seed: Record<string, string> = {}) {
  const map = new Map<string, string>(Object.entries(seed));
  const storage: ChatStorage = {
    async getItem(key) {
      return map.has(key) ? map.get(key)! : null;
    },
    async setItem(key, value) {
      map.set(key, value);
    },
    async removeItem(key) {
      map.delete(key);
    },
  };
  return { storage, map };
}

/** One stored transcript, shaped like ChatMessage[] (only these keys are read). */
function transcript(...lines: string[]): string {
  return JSON.stringify(
    lines.map((content, i) => ({
      id: `m${i}`,
      type: "text",
      author: "user",
      content,
      data: {},
      timestamp: new Date(0).toISOString(),
    })),
  );
}

/** The message contents a raw stored value carries ([] when nothing). */
function contents(raw: string | null): string[] {
  return raw ? (JSON.parse(raw) as { content: string }[]).map((m) => m.content) : [];
}

describe("the transcript is scoped to its OWNER, not the install", () => {
  it("never hands user A's transcript to user B", async () => {
    // The exact live leak: only A's conversation exists on the device.
    const { storage } = memStorage({ [chatKeyFor("user-a")]: transcript("A private") });

    // B opens the chat and must see NOTHING of A's...
    expect(contents(await readChatFor("user-b", storage))).toEqual([]);
    // ...while A still gets their own back.
    expect(contents(await readChatFor("user-a", storage))).toEqual(["A private"]);
  });

  it("never hands a signed-in user's transcript to a guest (the guest case)", async () => {
    const { storage } = memStorage({ [chatKeyFor("user-a")]: transcript("A private") });
    expect(contents(await readChatFor(GUEST_OWNER_ID, storage))).toEqual([]);
  });

  it("writes under the writer's key only", async () => {
    const { storage, map } = memStorage();
    await writeChatFor("user-a", [{ id: "m0", content: "A private" }], storage);

    expect(map.has(chatKeyFor("user-b"))).toBe(false);
    expect(contents(await readChatFor("user-b", storage))).toEqual([]);
    expect(contents(await readChatFor("user-a", storage))).toEqual(["A private"]);
  });

  it("clears only the owner's own transcript", async () => {
    const { storage } = memStorage({
      [chatKeyFor("user-a")]: transcript("A private"),
      [chatKeyFor("user-b")]: transcript("B private"),
    });
    await clearChatFor("user-a", storage);

    expect(contents(await readChatFor("user-a", storage))).toEqual([]);
    expect(contents(await readChatFor("user-b", storage))).toEqual(["B private"]);
  });

  it("keeps only the newest 40 turns", async () => {
    const many = Array.from({ length: 45 }, (_, i) => ({ id: `m${i}`, content: `line ${i}` }));
    const { storage } = memStorage();
    await writeChatFor("user-a", many, storage);

    const raw = await readChatFor("user-a", storage);
    expect(raw && (JSON.parse(raw) as unknown[]).length).toBe(40);
    expect(contents(raw)[0]).toBe("line 5");
  });
});

describe("the pre-scope transcript is migrated ONCE, to the owner who is here", () => {
  it("gives an upgrading user their conversation and deletes the legacy key", async () => {
    const { storage, map } = memStorage({ [LEGACY_CHAT_KEY]: transcript("upgrade chat") });

    expect(contents(await readChatFor("user-a", storage))).toEqual(["upgrade chat"]);
    expect(map.get(chatKeyFor("user-a"))).toContain("upgrade chat");
    // Removed at the source — it must not sit there for the next person.
    expect(map.has(LEGACY_CHAT_KEY)).toBe(false);
  });

  it("a guest at the upgrade claims it too", async () => {
    const { storage, map } = memStorage({ [LEGACY_CHAT_KEY]: transcript("upgrade chat") });

    expect(contents(await readChatFor(GUEST_OWNER_ID, storage))).toEqual(["upgrade chat"]);
    expect(map.has(chatKeyFor(GUEST_OWNER_ID))).toBe(true);
    expect(map.has(LEGACY_CHAT_KEY)).toBe(false);
  });

  it("leaves nothing of the legacy transcript for the next person", async () => {
    const { storage } = memStorage({ [LEGACY_CHAT_KEY]: transcript("upgrade chat") });
    await readChatFor("user-a", storage); // claimed by A, once

    expect(contents(await readChatFor("user-b", storage))).toEqual([]);
  });

  it("never overwrites an owner's own transcript with the stale legacy key", async () => {
    const { storage } = memStorage({
      [chatKeyFor("user-a")]: transcript("mine"),
      [LEGACY_CHAT_KEY]: transcript("old"),
    });
    expect(contents(await readChatFor("user-a", storage))).toEqual(["mine"]);
  });
});

describe("a guest signing in keeps their own history — a claim, not a leak", () => {
  it("the account adopts the guest transcript and the guest bucket is emptied", async () => {
    const { storage, map } = memStorage({ [chatKeyFor(GUEST_OWNER_ID)]: transcript("guest chat") });

    expect(contents(await readChatFor("user-a", storage))).toEqual(["guest chat"]);
    // Emptied, so nobody else can inherit it.
    expect(map.has(chatKeyFor(GUEST_OWNER_ID))).toBe(false);
    expect(map.get(chatKeyFor("user-a"))).toContain("guest chat");
  });

  it("a legacy 'signed-out' bucket is claimed too — no orphaned transcript", async () => {
    const { storage, map } = memStorage({ [chatKeyFor("signed-out")]: transcript("old guest") });

    expect(contents(await readChatFor("user-a", storage))).toEqual(["old guest"]);
    expect(map.has(chatKeyFor("signed-out"))).toBe(false);
  });
});
