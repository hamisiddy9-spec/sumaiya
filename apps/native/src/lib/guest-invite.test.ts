/**
 * The account invitation must arrive AFTER the work, must say what signing up
 * EARNS, and must never become a nag.
 *
 * Tested here: the number of times it can appear (once, ever), who it is shown
 * to (a guest only), and the words themselves. The words matter as much as the
 * timing — the failure this whole feature exists to fix is a product that asked
 * for an account before it gave the user anything, and "sign in to continue" is
 * the sentence that says so.
 */
jest.mock("@sumaiya/utils", () => ({
  getSecureItem: jest.fn(),
  setSecureItem: jest.fn(),
}));

import { getSecureItem, setSecureItem } from "@sumaiya/utils";
import {
  GUEST_DELIVERABLE_INVITE,
  GUEST_GATE_ACCEPT,
  GUEST_GATE_CONTINUE,
  GUEST_GATE_COPY,
  GUEST_INVITE_SEEN_KEY,
  GUEST_KEEP_CARD,
  claimGuestInviteOnce,
  guestText,
} from "./guest-invite";

const getStored = getSecureItem as jest.Mock;
const setStored = setSecureItem as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  getStored.mockResolvedValue(null);
  setStored.mockResolvedValue(undefined);
});

describe("the guest invitation appears at most once, ever", () => {
  it("is due the first time and not the second", async () => {
    getStored.mockResolvedValueOnce(null).mockResolvedValue("true");

    expect(await claimGuestInviteOnce()).toBe(true);
    expect(await claimGuestInviteOnce()).toBe(false);
  });

  it("records the offer as made BEFORE it is shown", async () => {
    // If the flag were written after (or not at all), a guest who dismissed the
    // dialog and then saved another CV would be asked again — the nagging the
    // owner ruled out.
    await claimGuestInviteOnce();
    expect(setStored).toHaveBeenCalledWith(GUEST_INVITE_SEEN_KEY, "true");
  });

  it("stays quiet when the store cannot be read — asking blindly is worse", async () => {
    getStored.mockRejectedValue(new Error("keychain locked"));

    expect(await claimGuestInviteOnce()).toBe(false);
    expect(setStored).not.toHaveBeenCalled();
  });

  it("still makes the offer when the store cannot be written", async () => {
    setStored.mockRejectedValue(new Error("keychain full"));

    expect(await claimGuestInviteOnce()).toBe(true);
  });

  it("reads the flag it writes, under one key that no other feature uses", async () => {
    await claimGuestInviteOnce();
    getStored.mockResolvedValue("true");
    expect(await claimGuestInviteOnce()).toBe(false);
    expect(GUEST_INVITE_SEEN_KEY).toMatch(/guest/);
  });
});

describe("the words say what an account EARNS", () => {
  const everyString = (copy: { en: string; sw: string }) => [copy.en, copy.sw];

  const allCopy: string[] = [
    ...everyString(GUEST_DELIVERABLE_INVITE.title),
    ...everyString(GUEST_DELIVERABLE_INVITE.body),
    ...everyString(GUEST_DELIVERABLE_INVITE.accept),
    ...everyString(GUEST_DELIVERABLE_INVITE.later),
    ...everyString(GUEST_KEEP_CARD.body),
    ...everyString(GUEST_KEEP_CARD.cta),
    ...everyString(GUEST_GATE_ACCEPT),
    ...everyString(GUEST_GATE_CONTINUE),
    ...Object.values(GUEST_GATE_COPY).flatMap((c) => [...everyString(c.title), ...everyString(c.body)]),
  ];

  it("never tells the user to sign in to continue, in either language", () => {
    const forbidden = [/sign in to continue/i, /ingia ili kuendelea/i, /sign up to continue/i];
    for (const line of allCopy) {
      for (const pattern of forbidden) {
        expect(pattern.test(line)).toBe(false);
      }
    }
  });

  it("names what the account gives the guest: keeping the CV, on another phone", () => {
    expect(GUEST_DELIVERABLE_INVITE.title.en).toBe("Keep this CV");
    expect(GUEST_DELIVERABLE_INVITE.title.sw).toBe("Hifadhi CV yako");
    expect(GUEST_DELIVERABLE_INVITE.body.en).toMatch(/another phone/);
    expect(GUEST_DELIVERABLE_INVITE.body.sw).toMatch(/simu nyingine/);
    // The risk being answered has to be stated, not implied.
    expect(GUEST_DELIVERABLE_INVITE.body.en).toMatch(/isn't lost/);
    expect(GUEST_DELIVERABLE_INVITE.body.sw).toMatch(/haitapotea/);
  });

  it("offers a way out of every gate — never a one-button wall", () => {
    expect(GUEST_DELIVERABLE_INVITE.later.en).toBe("Not now");
    expect(GUEST_DELIVERABLE_INVITE.later.sw).toBe("Si sasa");
    expect(GUEST_GATE_CONTINUE.en).toMatch(/Build my CV/);
    expect(GUEST_GATE_CONTINUE.sw).toMatch(/CV yako/);
  });

  it("writes every string in both languages, and never reuses the English one", () => {
    for (const line of allCopy) {
      expect(typeof line).toBe("string");
      expect(line.trim().length).toBeGreaterThan(0);
    }
    for (const copy of Object.values(GUEST_GATE_COPY)) {
      expect(copy.title.en).not.toBe(copy.title.sw);
      expect(copy.body.en).not.toBe(copy.body.sw);
    }
  });

  it("has copy for every gate id the navigators actually use", () => {
    expect(Object.keys(GUEST_GATE_COPY).sort()).toEqual([
      "applications",
      "atsVerdict",
      "chat",
      "courses",
      "import",
      "invite",
      "jobs",
    ]);
  });

  it("picks the reader's language, and treats anything unknown as English", () => {
    expect(guestText(GUEST_DELIVERABLE_INVITE.title, "sw")).toBe("Hifadhi CV yako");
    expect(guestText(GUEST_DELIVERABLE_INVITE.title, "en")).toBe("Keep this CV");
    expect(guestText(GUEST_DELIVERABLE_INVITE.title, "fr")).toBe("Keep this CV");
  });
});
