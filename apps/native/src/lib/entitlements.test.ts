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
 * A comparison against the clock is only true until the clock moves, so the
 * tests also pin WHEN the answer is re-decided: at the expiry instant itself
 * (a single timer, never an interval) and whenever the app comes back to the
 * foreground (a local re-compare, not a fresh round trip).
 *
 * The source is deliberately dumb: it trusts the server's `premiumUntil` and
 * stores nothing locally. Two guards at the bottom of this file keep it that
 * way (nothing stores a flag on the device, and the waitlist key is never
 * read — see the ⚠️ note in entitlements.ts).
 */
import fs from "fs";
import path from "path";
import React from "react";
import { AppState } from "react-native";
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

/**
 * The largest delay a JS engine can hold (2^31 - 1 ms, ~24.8 days). A longer
 * one overflows and fires at once instead of later — which is why the hook
 * clamps and re-arms rather than trusting a single long timer.
 */
const MAX_TIMER_DELAY = 2 ** 31 - 1;

/**
 * The hook's clock. `Date.now` reads this, so a test can walk time forward to
 * the expiry instant without waiting days for it — the re-check itself is fired
 * from the {@link captureTimers} spy, never scheduled for real.
 */
let clock = NOW;

let renders: Entitlements[] = [];
let latest: Entitlements | null = null;

function Probe() {
  latest = useEntitlements();
  renders.push(latest);
  return null;
}

/**
 * Trees live for one test and are unmounted before the next one.
 *
 * This matters now that the hook arms a timer: a tree left mounted by an
 * earlier test would keep its timer, fire it into this file's single shared
 * `latest`, and make a later test read an earlier test's answer.
 */
let trees: ReactTestRenderer[] = [];

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
  trees.push(tree);
  return tree;
}

/**
 * The hook's `setTimeout` calls, so a test can fire the expiry re-check itself
 * instead of waiting days for the clock to reach it.
 *
 * The spy calls through, so React's own scheduling is untouched and every timer
 * the hook arms is still a real one — which is why {@link armedWith} cancels
 * the real schedule before running the callback by hand: a 24-day timer left
 * behind would outlive the whole suite.
 */
function captureTimers() {
  const realSetTimeout = global.setTimeout as (
    callback: () => void,
    delay?: number,
  ) => ReturnType<typeof setTimeout>;
  const armed: {
    callback: () => void;
    delay: number;
    handle: ReturnType<typeof setTimeout>;
  }[] = [];

  jest
    .spyOn(global, "setTimeout")
    .mockImplementation(((callback: () => void, delay?: number) => {
      const handle = realSetTimeout(callback, delay);
      armed.push({ callback, delay: delay ?? 0, handle });
      return handle;
    }) as typeof setTimeout);

  return {
    delays: () => armed.map((call) => call.delay),
    /** Fire the one re-check armed with exactly this delay, as the clock had reached it. */
    armedWith(delay: number) {
      const call = armed.find((a) => a.delay === delay);
      if (!call) {
        throw new Error(
          `no re-check armed with a ${delay}ms delay; armed: ${JSON.stringify(
            armed.map((a) => a.delay),
          )}`,
        );
      }
      clearTimeout(call.handle);
      return call.callback;
    },
  };
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
  trees = [];
  clock = NOW;
  jest.clearAllMocks();
  jest.spyOn(Date, "now").mockImplementation(() => clock);
});

afterEach(async () => {
  const open = trees;
  trees = [];
  // Unmounting runs the hook's cleanup, which clears anything it scheduled.
  await act(async () => {
    for (const tree of open) tree.unmount();
  });
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
      // ...and it is not an answer, so it must not be handed on as one: the
      // field is documented as an ISO timestamp or null, and a consumer that
      // renders it would show "Invalid Date".
      expect(last().premiumUntil).toBeNull();
    }
  });

  it("treats an empty string as nothing earned", async () => {
    getReferral.mockResolvedValue(referral(""));
    await mount();
    expect(last().premium).toBe(false);
    // An empty string survives `?? null` — it is not nullish — even though the
    // field is documented as "an ISO timestamp or null". Every consumer guards
    // with truthiness (invite-screen.tsx:143), so `""` was inert for the
    // paywall, but it broke the type's promise to everyone else. It is
    // normalised to null on read, so the promise holds.
    expect(last().premiumUntil).toBeNull();
    expect(last()).toEqual({ premium: false, premiumUntil: null, loading: false });
  });
});

describe("useEntitlements — premiumUntil is normalised on read", () => {
  it("turns a whitespace-only value into null", async () => {
    getReferral.mockResolvedValue(referral("   "));
    await mount();
    expect(last()).toEqual({ premium: false, premiumUntil: null, loading: false });
  });

  it("turns a non-string value into null", async () => {
    // The type says string | null, but this arrives as JSON from the server.
    for (const wrong of [12345, 0, true, {}, ["2026-09-17T12:00:00.000Z"]]) {
      getReferral.mockResolvedValue(referral(wrong));
      await mount();
      expect(last()).toEqual({ premium: false, premiumUntil: null, loading: false });
    }
  });

  it("trims a padded timestamp rather than passing the padding on", async () => {
    getReferral.mockResolvedValue(referral(`  ${iso(NOW + 60_000)}  `));
    await mount();
    expect(last().premium).toBe(true);
    expect(last().premiumUntil).toBe(iso(NOW + 60_000));
  });
});

describe("useEntitlements — the answer is re-decided when the instant arrives", () => {
  it("drops premium at the expiry instant while the screen stays mounted", async () => {
    const until = NOW + 10 * 60_000;
    getReferral.mockResolvedValue(referral(iso(until)));
    const timers = captureTimers();
    await mount();
    expect(last().premium).toBe(true);

    // One re-check, armed for exactly the time that is left — not an interval,
    // and not a poll: nothing else can change the answer but the clock.
    const fireExpiry = timers.armedWith(10 * 60_000);
    const armedBeforeExpiry = timers.delays().length;

    // The app is never backgrounded; the screen just sits there past expiry.
    clock = until;
    await act(async () => {
      fireExpiry();
    });

    expect(last().premium).toBe(false);
    // Lapsed is still not the same as never-earned.
    expect(last().premiumUntil).toBe(iso(until));
    // And the chain stops here: nothing was re-armed, so this cannot become a
    // polling loop.
    expect(timers.delays().length).toBe(armedBeforeExpiry);
  });

  it("arms a window longer than a JS timer can hold in clamped steps", async () => {
    // Seven friends at seven days each is 49 days, far past the 24.8-day
    // maximum a JS timer can be given; an unclamped timer overflows and fires
    // immediately, which would hand out a re-check at the wrong instant.
    const until = NOW + 49 * 24 * 60 * 60 * 1000;
    getReferral.mockResolvedValue(referral(iso(until)));
    const timers = captureTimers();
    await mount();
    expect(last().premium).toBe(true);

    expect(timers.delays()).not.toContain(until - NOW);
    const firstArm = timers.armedWith(MAX_TIMER_DELAY);

    // The first arm lands ~24.8 days in, with ~24.2 days of earned time left.
    clock = NOW + MAX_TIMER_DELAY;
    await act(async () => {
      firstArm();
    });
    expect(last().premium).toBe(true);

    const remainder = until - clock;
    const secondArm = timers.armedWith(remainder);

    clock = until;
    await act(async () => {
      secondArm();
    });
    expect(last().premium).toBe(false);
  });
});

describe("useEntitlements — re-check on foregrounding", () => {
  it("drops premium that lapsed while the app was in the background", async () => {
    const until = NOW + 60 * 60_000;
    getReferral.mockResolvedValue(referral(iso(until)));
    const appState = jest.spyOn(AppState, "addEventListener");
    await mount();
    expect(last().premium).toBe(true);
    expect(appState).toHaveBeenCalled();

    // Pocketed across the expiry: Android can have the JS thread suspended (or
    // the process killed) for the whole window, so the armed timer may never
    // have run. The user opens the app again.
    clock = until + 1;
    const onAppStateChange = appState.mock.calls.at(-1)![1] as (next: string) => void;
    await act(async () => {
      onAppStateChange("active");
    });

    expect(last().premium).toBe(false);
    // A local re-compare, deliberately not a second round trip: a refetch that
    // fails (offline, a server hiccup) reads as "nothing earned" and would take
    // premium away from someone who has it — the expensive false negative.
    expect(getReferral).toHaveBeenCalledTimes(1);
  });

  it("reacts to becoming active, not to other transitions", async () => {
    const until = NOW + 60 * 60_000;
    getReferral.mockResolvedValue(referral(iso(until)));
    const appState = jest.spyOn(AppState, "addEventListener");
    await mount();

    clock = until + 1;
    const onAppStateChange = appState.mock.calls.at(-1)![1] as (next: string) => void;
    await act(async () => {
      onAppStateChange("background");
    });
    // Nothing re-decided, so nothing changed — the re-check belongs to coming
    // back to the foreground, not to leaving it.
    expect(last().premium).toBe(true);

    await act(async () => {
      onAppStateChange("active");
    });
    expect(last().premium).toBe(false);
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
    trees = trees.filter((t) => t !== tree);
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

  it("re-decides on events, never by polling", () => {
    // One timer at the expiry instant plus a foreground re-check. An interval
    // would burn the radio and the battery to learn something only the clock
    // can change.
    expect(code).not.toMatch(/setInterval/);
  });
});
