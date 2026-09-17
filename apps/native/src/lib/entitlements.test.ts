/**
 * The paywall. `useEntitlements()` is the ONLY thing that decides whether the
 * premium designs and deep courses are open, and it decides it from one
 * comparison:
 *
 *     new Date(premiumUntil).getTime() > Date.now()
 *
 * Both ways of getting that wrong are expensive and neither is loud:
 *   - a false negative locks out someone who invited seven friends and earned
 *     49 days of Premium (they cannot open what they paid for in referrals);
 *   - a false positive hands the premium template set to every free user.
 *
 * So the tests below pin the exact boundary: one millisecond before expiry is
 * premium, the expiry instant itself is not, one millisecond after is not.
 * Every other property of the hook (a failed lookup, a missing field, a value
 * the server sent that no Date can parse) is here for the same reason.
 *
 * The source is deliberately dumb: it trusts the server's `premiumUntil` and
 * stores nothing locally. Two guards at the bottom of this file keep it that
 * way (nothing stores a flag on the device, and the waitlist key is never
 * read — see the ⚠️ note in entitlements.ts).
 */
import fs from "fs";
import path from "path";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { useEntitlements, type Entitlements } from "./entitlements";

jest.mock("./api-client", () => ({
  apiClient: { getReferral: jest.fn() },
}));

import { apiClient } from "./api-client";

const getReferral = apiClient.getReferral as jest.Mock;

/** A fixed "now" so the boundary is exact rather than racy. */
const NOW = Date.parse("2026-09-17T12:00:00.000Z");
const iso = (ms: number) => new Date(ms).toISOString();

let renders: Entitlements[] = [];
let latest: Entitlements | null = null;

function Probe() {
  latest = useEntitlements();
  renders.push(latest);
  return null;
}

/** Render the hook; effects have run and any settled promise has been handled. */
async function mount(): Promise<ReactTestRenderer> {
  let tree!: ReactTestRenderer;
  await act(async () => {
    tree = create(React.createElement(Probe));
  });
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
  return tree;
}

const last = () => {
  if (!latest) throw new Error("hook never rendered");
  return latest;
};

/** What the server told us about a referral code. */
const referral = (premiumUntil: unknown) => ({ premiumUntil }) as any;

beforeEach(() => {
  renders = [];
  latest = null;
  jest.clearAllMocks();
  jest.spyOn(Date, "now").mockReturnValue(NOW);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("useEntitlements — an active subscription is premium", () => {
  it("grants premium while the earned time is still running", async () => {
    getReferral.mockResolvedValue(referral(iso(NOW + 7 * 24 * 60 * 60 * 1000)));
    await mount();
    expect(last().premium).toBe(true);
    expect(last().loading).toBe(false);
    expect(last().premiumUntil).toBe(iso(NOW + 7 * 24 * 60 * 60 * 1000));
  });

  it("grants premium one millisecond before it runs out", async () => {
    getReferral.mockResolvedValue(referral(iso(NOW + 1)));
    await mount();
    expect(last().premium).toBe(true);
  });

  it("compares instants, not strings — an offset form of the same moment expires", async () => {
    // 15:00+03:00 is the fixed NOW (12:00Z). A string comparison would
    // consider "2026-09-17T15:00:00+03:00" a different day's value.
    getReferral.mockResolvedValue(referral("2026-09-17T15:00:00.000+03:00"));
    await mount();
    expect(last().premium).toBe(false);

    getReferral.mockResolvedValue(referral("2026-09-17T15:00:00.001+03:00"));
    await mount();
    expect(last().premium).toBe(true);
  });
});

describe("useEntitlements — the expiry boundary", () => {
  it("does NOT grant premium at the exact expiry instant", async () => {
    // `>` not `>=`: the moment the earned time runs out, it has run out. If
    // this ever flips, a lapse of a fraction of a second is still a lapse.
    getReferral.mockResolvedValue(referral(iso(NOW)));
    await mount();
    expect(last().premium).toBe(false);
  });

  it("does NOT grant premium one millisecond after expiry", async () => {
    getReferral.mockResolvedValue(referral(iso(NOW - 1)));
    await mount();
    expect(last().premium).toBe(false);
  });

  it("does NOT grant premium for time that ran out long ago", async () => {
    getReferral.mockResolvedValue(referral(iso(NOW - 30 * 24 * 60 * 60 * 1000)));
    await mount();
    expect(last().premium).toBe(false);
    // Lapsed is not the same as never-earned: the record still surfaces, so a
    // future invite screen can say when it ended.
    expect(last().premiumUntil).toBe(iso(NOW - 30 * 24 * 60 * 60 * 1000));
  });
});

describe("useEntitlements — values the server should not send", () => {
  it("treats a null premiumUntil as nothing earned", async () => {
    getReferral.mockResolvedValue(referral(null));
    await mount();
    expect(last()).toEqual({ premium: false, premiumUntil: null, loading: false });
  });

  it("treats an absent premiumUntil field as nothing earned", async () => {
    // An older / partially-deployed server that does not know the field yet.
    getReferral.mockResolvedValue({ code: "AB12", joined: 0 } as any);
    await mount();
    expect(last()).toEqual({ premium: false, premiumUntil: null, loading: false });
  });

  it("never grants premium for a value no Date can parse", async () => {
    for (const junk of ["not-a-date", "2026-13-45T99:99:99Z", "NaN", "null"]) {
      getReferral.mockResolvedValue(referral(junk));
      await mount();
      // NaN > NOW is false, so the fail-safe direction is "free" — the money
      // bug to guard against here would be preferring the other direction.
      expect(last().premium).toBe(false);
    }
  });

  it("treats an empty string as nothing earned", async () => {
    getReferral.mockResolvedValue(referral(""));
    await mount();
    expect(last().premium).toBe(false);
    // Documented wart: `?? null` only catches null/undefined, so an empty
    // string survives into the returned value. Every consumer guards with
    // truthiness (invite-screen.tsx:143) and the type says `string | null`,
    // so it is inert — but it is NOT null, and this pins that.
    expect(last().premiumUntil).toBe("");
  });
});

describe("useEntitlements — guest, offline, signed out", () => {
  it("stays on free when the lookup throws", async () => {
    getReferral.mockRejectedValue(new Error("401 Unauthorized"));
    await mount();
    expect(last()).toEqual({ premium: false, premiumUntil: null, loading: false });
  });

  it("is still loading until the server answers", async () => {
    // Screens use `loading` to show a neutral state instead of the free view,
    // so it must not flip early.
    getReferral.mockReturnValue(new Promise(() => {}));
    await mount();
    expect(last().loading).toBe(true);
    expect(last().premium).toBe(false);
  });

  it("does not warn or throw if it settles after the screen was left", async () => {
    let resolveIt: (v: unknown) => void = () => {};
    getReferral.mockReturnValue(new Promise((r) => (resolveIt = r)));
    const tree = await mount();
    const renderCountAtUnmount = renders.length;

    await act(async () => {
      tree.unmount();
    });
    await act(async () => {
      resolveIt(referral(iso(NOW + 60_000)));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(renders.length).toBe(renderCountAtUnmount);
  });
});

describe("useEntitlements — Premium is never granted locally", () => {
  const source = fs.readFileSync(path.join(__dirname, "entitlements.ts"), "utf8");
  // Comments are allowed to NAME the forbidden keys — that is where the
  // reasoning about them lives. What must never appear is code.
  const code = source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");

  it("never reads or writes a device-local premium flag", () => {
    expect(code).not.toMatch(/sumaiya_premium/);
    expect(code).not.toMatch(/AsyncStorage|SecureStore|getSecureItem|setSecureItem/);
  });

  it("reads the earned time back from the server, on the server's answer alone", () => {
    expect(code).toContain("apiClient.getReferral()");
    expect(code).toMatch(/new Date\(serverUntil\)\.getTime\(\) > Date\.now\(\)/);
  });

  it("is not fooled by the waitlist key that must never unlock anything", () => {
    // sumaiya_premium_waitlist records "notify me about a paid tier that does
    // not exist yet". It is interest, not a purchase; if entitlements ever read
    // it, tapping "notify me" would hand out the premium templates.
    expect(code).not.toContain("waitlist");
  });
});
