const mockStore = new Map<string, string>();

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn((k: string) => Promise.resolve(mockStore.has(k) ? mockStore.get(k)! : null)),
  setItem: jest.fn((k: string, v: string) => {
    mockStore.set(k, v);
    return Promise.resolve();
  }),
  removeItem: jest.fn((k: string) => {
    mockStore.delete(k);
    return Promise.resolve();
  }),
}));

import AsyncStorage from "@react-native-async-storage/async-storage";
import { loadDraft, saveDraft, clearDraft } from "./cv-draft";

const draftPayload = (fullName: string) => ({
  data: { personalInfo: { fullName, email: "", phone: "", location: "" } },
  template: "classic",
  accent: "#DA4A1C",
});

beforeEach(() => {
  mockStore.clear();
  jest.clearAllMocks();
});

describe("saveDraft / loadDraft round-trip", () => {
  it("restores exactly what was saved, keyed to the document id", async () => {
    await saveDraft("cv-123", draftPayload("Asha Mwangi"));
    const loaded = await loadDraft("cv-123");
    expect(loaded?.data.personalInfo?.fullName).toBe("Asha Mwangi");
    expect(loaded?.template).toBe("classic");
  });

  it("keeps drafts for different documents apart", async () => {
    await saveDraft("cv-a", draftPayload("A"));
    await saveDraft("cv-b", draftPayload("B"));
    expect((await loadDraft("cv-a"))?.data.personalInfo?.fullName).toBe("A");
    expect((await loadDraft("cv-b"))?.data.personalInfo?.fullName).toBe("B");
  });

  it("uses a fixed slot for a CV with no id yet (a brand-new, never-saved CV)", async () => {
    await saveDraft(null, draftPayload("New Person"));
    const loaded = await loadDraft(null);
    expect(loaded?.data.personalInfo?.fullName).toBe("New Person");
    // Reachable across a fresh "New CV" entry (a new random id would not be).
    expect(await loadDraft("some-other-random-id")).toBeNull();
  });

  it("returns null when nothing was ever saved for that id", async () => {
    expect(await loadDraft("never-saved")).toBeNull();
  });
});

describe("restoration after a fresh mount", () => {
  it("a second, independent loadDraft call sees what an earlier session wrote", async () => {
    // Simulates: type in the editor (saveDraft), kill the app (module state is
    // gone), reopen (a fresh loadDraft call with no memory of the write above).
    await saveDraft("cv-9", draftPayload("Restored After Kill"));
    const restored = await loadDraft("cv-9");
    expect(restored?.data.personalInfo?.fullName).toBe("Restored After Kill");
  });
});

describe("a failed write leaves the previous draft intact", () => {
  it("does not clear or corrupt the last known-good draft when setItem rejects", async () => {
    await saveDraft("cv-5", draftPayload("Good Draft"));
    (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error("disk full"));

    const ok = await saveDraft("cv-5", draftPayload("Would-be corrupt write"));

    expect(ok).toBe(false);
    const stillThere = await loadDraft("cv-5");
    expect(stillThere?.data.personalInfo?.fullName).toBe("Good Draft");
  });

  it("reports failure to the caller instead of pretending the draft is safe", async () => {
    (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error("boom"));
    const ok = await saveDraft("cv-6", draftPayload("X"));
    expect(ok).toBe(false);
  });
});

describe("loadDraft resilience", () => {
  it("treats unreadable JSON as no draft rather than throwing", async () => {
    mockStore.set("cv_draft_v1:cv-7", "{not json");
    await expect(loadDraft("cv-7")).resolves.toBeNull();
  });

  it("treats a value with no data field as no draft", async () => {
    mockStore.set("cv_draft_v1:cv-8", JSON.stringify({ template: "classic" }));
    await expect(loadDraft("cv-8")).resolves.toBeNull();
  });
});

describe("clearDraft", () => {
  it("removes only the draft for that id, not other drafts", async () => {
    await saveDraft("cv-a", draftPayload("A"));
    await saveDraft("cv-b", draftPayload("B"));
    await clearDraft("cv-a");
    expect(await loadDraft("cv-a")).toBeNull();
    expect(await loadDraft("cv-b")).not.toBeNull();
  });

  it("never touches keys outside the cv_draft_v1 prefix (no leak into the saved-document path)", async () => {
    mockStore.set("cvs_table_sentinel", "untouched");
    await saveDraft("cv-a", draftPayload("A"));
    await clearDraft("cv-a");
    expect(mockStore.get("cvs_table_sentinel")).toBe("untouched");
    // The draft namespace is disjoint from anything a real-document store would use.
    for (const key of mockStore.keys()) {
      expect(key === "cvs_table_sentinel" || key.startsWith("cv_draft_v1:")).toBe(true);
    }
  });
});
