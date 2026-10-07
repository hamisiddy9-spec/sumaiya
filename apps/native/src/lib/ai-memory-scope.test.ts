/**
 * Sumaiya's MEMORY is a summary of the person — habits, worries, facts she has
 * concluded. It must be scoped to the PERSON, not the install, for the same
 * reason the chat transcript is (see chat-scope.test.ts): on a shared handset
 * the next person to open the app was handed the previous person's private
 * notes.
 *
 * The defect this pins: memory lived under one device-wide key
 * (`sumaiya.memory.v1`) with no owner in it, so after A signed out and B signed
 * in, B's every conversation was seeded with facts about A. These tests fail on
 * that old behaviour in the only way that matters: a read for owner B returns
 * NOTHING when the only memory on the device is A's, and A's consent never
 * becomes B's.
 *
 * The one-time migration (a pre-scope memory claimed once) and the guest journey
 * (a guest's memory follows them into the account) are pinned here too — the
 * same shape chat-scope.test.ts pins for the transcript.
 */
jest.mock("@sumaiya/utils", () => ({ offlineStorage: {} }));
// AsyncStorage ships a native module that does not exist under jest — mock it
// file-locally (as src/lib/ai-memory.test.ts and chat-scope.test.ts do). The
// mock is an in-memory store, so these tests exercise the real persistence path,
// wiped between tests.
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  EMPTY_MEMORY,
  eraseMemory,
  loadConsent,
  loadMemory,
  saveMemory,
  setConsent,
  setFact,
  updateMemory,
  type Memory,
} from "./ai-memory";
import { GUEST_OWNER_ID } from "./local-owner";
import { scopedKey } from "./owner-scope";

/** The pre-scope keys, kept here as the literal strings a device would hold. */
const MEMORY_BASE = "sumaiya.memory.v1";
const CONSENT_BASE = "sumaiya.memory.consent.v1";

beforeEach(async () => {
  await AsyncStorage.clear();
});

/** One memory that says something definite about the person. */
function memoryWith(fact: string): Memory {
  return setFact(EMPTY_MEMORY, "note", fact, true, 0);
}

/** The fact values a loaded memory carries ([] when empty). */
function notes(m: Memory): string[] {
  return m.facts.map((f) => f.value);
}

describe("Sumaiya's memory is scoped to its OWNER, not the install", () => {
  it("never hands user A's memory to user B — the exact live leak", async () => {
    await setConsent("user-a", "granted");
    await saveMemory("user-a", memoryWith("A worries about interviews"));

    // B opens the memory (and the chat that seeds from it) and must see NOTHING of A's...
    expect(notes(await loadMemory("user-b"))).toEqual([]);
    // ...and A's consent to be remembered must not become B's consent either.
    expect(await loadConsent("user-b")).toBe("unasked");
    // ...while A still gets their own back.
    expect(notes(await loadMemory("user-a"))).toEqual(["A worries about interviews"]);
  });

  it("writes under the writer's key only", async () => {
    await saveMemory("user-a", memoryWith("A private"));
    expect(await AsyncStorage.getItem(scopedKey(MEMORY_BASE, "user-b"))).toBeNull();
    expect(notes(await loadMemory("user-b"))).toEqual([]);
  });

  it("erases only the owner's memory", async () => {
    await saveMemory("user-a", memoryWith("A private"));
    await saveMemory("user-b", memoryWith("B private"));

    await eraseMemory("user-a");

    expect(notes(await loadMemory("user-a"))).toEqual([]);
    expect(notes(await loadMemory("user-b"))).toEqual(["B private"]);
  });

  it("updateMemory refuses to write without THIS owner's consent", async () => {
    // A has consented; B has not. B's write must be blocked, not inherited from A.
    await setConsent("user-a", "granted");

    const result = await updateMemory("user-b", () => memoryWith("B is being learned"));

    expect(result.blocked).toBe(true);
    expect(notes(await loadMemory("user-b"))).toEqual([]);
    expect(await AsyncStorage.getItem(scopedKey(MEMORY_BASE, "user-b"))).toBeNull();
  });
});

describe("the pre-scope memory is migrated ONCE, to the owner who is here", () => {
  it("gives an upgrading user their memory and deletes the legacy key", async () => {
    await AsyncStorage.setItem(MEMORY_BASE, JSON.stringify(memoryWith("upgrade memory")));

    expect(notes(await loadMemory("user-a"))).toEqual(["upgrade memory"]);
    // Removed at the source — it must not sit there for the next person.
    expect(await AsyncStorage.getItem(MEMORY_BASE)).toBeNull();
    // And the next person gets nothing of it.
    expect(notes(await loadMemory("user-b"))).toEqual([]);
  });

  it("never overwrites an owner's own memory with the stale legacy key", async () => {
    await saveMemory("user-a", memoryWith("mine"));
    await AsyncStorage.setItem(MEMORY_BASE, JSON.stringify(memoryWith("old")));

    expect(notes(await loadMemory("user-a"))).toEqual(["mine"]);
  });

  it("migrates a pre-scope consent the same way", async () => {
    await AsyncStorage.setItem(CONSENT_BASE, "granted");
    expect(await loadConsent("user-a")).toBe("granted");
    expect(await AsyncStorage.getItem(CONSENT_BASE)).toBeNull();
    expect(await loadConsent("user-b")).toBe("unasked");
  });
});

describe("a guest signing in keeps their own memory — a claim, not a leak", () => {
  it("the account adopts the guest memory and the guest bucket is emptied", async () => {
    await saveMemory(GUEST_OWNER_ID, memoryWith("guest memory"));

    expect(notes(await loadMemory("user-a"))).toEqual(["guest memory"]);
    // Emptied, so nobody else can inherit it.
    expect(await AsyncStorage.getItem(scopedKey(MEMORY_BASE, GUEST_OWNER_ID))).toBeNull();
    expect(await AsyncStorage.getItem(scopedKey(MEMORY_BASE, "user-a"))).not.toBeNull();
  });

  it("a legacy 'signed-out' bucket is claimed too — no orphaned memory", async () => {
    await AsyncStorage.setItem(scopedKey(MEMORY_BASE, "signed-out"), JSON.stringify(memoryWith("old guest")));

    expect(notes(await loadMemory("user-a"))).toEqual(["old guest"]);
    expect(await AsyncStorage.getItem(scopedKey(MEMORY_BASE, "signed-out"))).toBeNull();
  });
});
