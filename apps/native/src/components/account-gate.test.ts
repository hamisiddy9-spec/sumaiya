/**
 * WHEN the account is offered, and what the offer says.
 *
 * `offerGuestAccountOnce` is the prompt the owner's rule is about: it must
 * arrive after the guest has something worth keeping, say what the account
 * EARNS, and happen once. The three assertions that matter:
 *
 *   - a guest is offered it (and the dialog's accept button opens sign-in),
 *   - a signed-in user is never offered it,
 *   - the second delivery of the evening does not re-ask.
 */
jest.mock("@sumaiya/utils", () => ({
  getSecureItem: jest.fn(),
  setSecureItem: jest.fn(),
}));
jest.mock("../lib/i18n", () => ({
  useLang: () => ({ t: (en: string, _sw: string) => en, lang: "en" }),
  getLastKnownLang: jest.fn(() => "en"),
}));
jest.mock("../components/ui", () => ({
  dialog: { alert: jest.fn() },
  EmptyState: () => null,
  Screen: ({ children }: { children?: unknown }) => children ?? null,
  ScreenTitle: () => null,
}));
jest.mock("../contexts/auth-context", () => ({ useAuthContext: () => ({ user: null }) }));
jest.mock("../hooks/use-app-navigation", () => ({ useAppNavigation: () => ({ navigate: jest.fn() }) }));
jest.mock("../navigation/root-nav", () => ({
  openAuth: jest.fn(() => true),
  canDismissAuth: jest.fn(() => true),
  dismissAuth: jest.fn(() => true),
}));

import { getSecureItem, setSecureItem } from "@sumaiya/utils";
import { dialog } from "./ui";
import { getLastKnownLang } from "../lib/i18n";
import { openAuth } from "../navigation/root-nav";
import { offerAccountForGate, offerGuestAccountOnce } from "./account-gate";

const getStored = getSecureItem as jest.Mock;
const setStored = setSecureItem as jest.Mock;
const alert = dialog.alert as jest.Mock;
const lang = getLastKnownLang as jest.Mock;
const openAuthMock = openAuth as jest.Mock;

/** The title/message/buttons of the last dialog shown. */
function lastDialog() {
  const [title, message, buttons] = alert.mock.calls[alert.mock.calls.length - 1];
  return { title, message, buttons };
}

beforeEach(() => {
  jest.clearAllMocks();
  getStored.mockResolvedValue(null);
  setStored.mockResolvedValue(undefined);
  lang.mockReturnValue("en");
});

describe("after the deliverable, once", () => {
  it("offers a guest the account, in English, saying what it earns", async () => {
    const shown = await offerGuestAccountOnce({ isGuest: true });

    expect(shown).toBe(true);
    const { title, message } = lastDialog();
    expect(title).toBe("Keep this CV");
    expect(message).toMatch(/on this phone only/);
    expect(message).toMatch(/open it on another phone/);
  });

  it("uses the Swahili copy when that is the language in play", async () => {
    lang.mockReturnValue("sw");

    await offerGuestAccountOnce({ isGuest: true });

    const { title, message } = lastDialog();
    expect(title).toBe("Hifadhi CV yako");
    expect(message).toMatch(/simu hii pekee/);
  });

  it("opens sign-in from the accept button, and never from the dismiss", async () => {
    await offerGuestAccountOnce({ isGuest: true });

    const { buttons } = lastDialog();
    expect(buttons).toHaveLength(2);

    const [dismiss, accept] = buttons;
    expect(dismiss.style).toBe("cancel");
    expect(dismiss.onPress).toBeUndefined();
    accept.onPress();
    expect(openAuthMock).toHaveBeenCalledTimes(1);
  });

  it("does not ask twice — the second download of the evening gets no dialog", async () => {
    getStored.mockResolvedValueOnce(null).mockResolvedValue("true");

    expect(await offerGuestAccountOnce({ isGuest: true })).toBe(true);
    expect(await offerGuestAccountOnce({ isGuest: true })).toBe(false);
    expect(alert).toHaveBeenCalledTimes(1);
  });

  it("never offers it to someone who already has an account", async () => {
    expect(await offerGuestAccountOnce({ isGuest: false })).toBe(false);
    expect(alert).not.toHaveBeenCalled();
    // And it does not even read the flag: an account holder must not consume
    // the guest's one offer.
    expect(getStored).not.toHaveBeenCalled();
  });
});

describe("a gated surface", () => {
  it("explains what the account is for and leaves the CV path open", () => {
    offerAccountForGate("chat", "en");

    const { title, message, buttons } = lastDialog();
    expect(title).toMatch(/account/i);
    expect(message).toMatch(/servers/);
    expect(message).toMatch(/come with you/);
    expect(buttons.map((b: { text: string }) => b.text)).toEqual([
      "Not now",
      "Create a free account",
    ]);
  });

  it("gates nothing for a guest that a guest can already do locally", () => {
    // The CV check runs on the device (lib/ats.ts); only the WRITTEN review is
    // generated on the server, so that is the only part that may be gated, and
    // its copy says the local results stay.
    offerAccountForGate("atsVerdict", "en");
    expect(lastDialog().message).toMatch(/already on this phone/);
  });
});
