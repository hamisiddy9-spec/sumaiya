jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

import { profileIsEmpty, profilePromptBlock, EMPTY_PROFILE, type CareerProfile } from "./profile-store";

const p = (over: Partial<CareerProfile> = {}): CareerProfile => ({ ...EMPTY_PROFILE, ...over });

describe("profileIsEmpty", () => {
  it("is true for a blank profile", () => {
    expect(profileIsEmpty(EMPTY_PROFILE)).toBe(true);
  });

  it("is true when only contact fields are filled (not a useful profile)", () => {
    expect(profileIsEmpty(p({ location: "Nairobi", phone: "0700", email: "a@b.c" }))).toBe(true);
  });

  it("is false once there's a name, headline, skills or experience", () => {
    expect(profileIsEmpty(p({ fullName: "Asha" }))).toBe(false);
    expect(profileIsEmpty(p({ headline: "Storekeeper" }))).toBe(false);
    expect(profileIsEmpty(p({ skills: "forklift" }))).toBe(false);
    expect(profileIsEmpty(p({ experience: "3 years at X" }))).toBe(false);
  });
});

describe("profilePromptBlock", () => {
  it("is empty for an empty profile so Sumaiya gets no noise", () => {
    expect(profilePromptBlock(EMPTY_PROFILE)).toBe("");
  });

  it("packs the filled fields into one directive block", () => {
    const out = profilePromptBlock(p({ fullName: "Asha Mwangi", headline: "Storekeeper", skills: "forklift\ninventory" }));
    expect(out).toContain("Name: Asha Mwangi");
    expect(out).toContain("Headline: Storekeeper");
    expect(out).toContain("Skills: forklift, inventory");
    expect(out).toContain("don't ask them to repeat it");
  });
});
