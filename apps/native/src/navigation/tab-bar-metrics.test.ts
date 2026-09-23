/**
 * The onboarding overlay regression.
 *
 * Reported from the phone: on a fresh install with an update pending, the update
 * download pill sat ON TOP of the language choices — the first screen a new user
 * sees — and, being pressable at zIndex 999, it swallowed the tap meant for the
 * last language.
 *
 * Mechanism: the pill is anchored `bottom: clearance + 8`. The clearance came from
 * a fallback that reserved the tab bar's height (52 + inset) whenever no height had
 * been measured, but onboarding renders OUTSIDE the tab navigator, so no bar exists
 * there to clear — while the language block is laid out at `insets.bottom + 52`.
 * Same marker, plus 8, put the pill exactly over the last row.
 *
 * The rule these tests pin: an overlay reserves room for furniture that is actually
 * on the screen. No bar mounted → the safe inset alone, nothing more.
 */
import {
  clearanceFor,
  publishTabBarHeight,
  publishTabBarLive,
  resetTabBarMetrics,
  tabBarMetricsSnapshot,
} from "./tab-bar-metrics";

const BAR_CONTENT = 52;
const BAR_DEFAULT_PAD = 10;

describe("clearanceFor — no tab bar mounted (onboarding, carousels)", () => {
  it("reserves NOTHING on a device with no bottom inset", () => {
    expect(clearanceFor({ live: false, measured: 0, insetBottom: 0 })).toBe(0);
  });

  it("reserves only the safe inset — never a bar's height", () => {
    expect(clearanceFor({ live: false, measured: 0, insetBottom: 48 })).toBe(48);
  });

  it("regression: must not reserve the old derived bar height when no bar exists", () => {
    const oldFallback = BAR_CONTENT + BAR_DEFAULT_PAD; // 62 — what floated the pill over the choices
    expect(clearanceFor({ live: false, measured: 0, insetBottom: 0 })).not.toBe(oldFallback);
    expect(clearanceFor({ live: false, measured: 0, insetBottom: 48 })).not.toBe(BAR_CONTENT + 48);
  });

  it("ignores a stale measured height once the bar unmounts", () => {
    // Measured while the tabs were up, then the user is back on a barless screen.
    expect(clearanceFor({ live: false, measured: 82, insetBottom: 24 })).toBe(24);
  });
});

describe("clearanceFor — tab bar mounted", () => {
  it("uses the bar's real measured height", () => {
    expect(clearanceFor({ live: true, measured: 82, insetBottom: 24 })).toBe(82);
  });

  it("falls back to the derived height for the first frame, so it cannot flash over the tabs", () => {
    expect(clearanceFor({ live: true, measured: 0, insetBottom: 0 })).toBe(BAR_CONTENT + BAR_DEFAULT_PAD);
    expect(clearanceFor({ live: true, measured: 0, insetBottom: 34 })).toBe(BAR_CONTENT + 34);
  });
});

describe("the store", () => {
  beforeEach(resetTabBarMetrics);

  it("is not live until a bar announces itself — the onboarding case", () => {
    const s = tabBarMetricsSnapshot();
    expect(s.live).toBe(false);
    expect(s.measured).toBe(0);
    // …and that state clears NOTHING, which is the fix.
    expect(clearanceFor({ live: s.live, measured: s.measured, insetBottom: 0 })).toBe(0);
  });

  it("goes live on mount and dead on unmount", () => {
    publishTabBarLive(true);
    expect(tabBarMetricsSnapshot().live).toBe(true);
    publishTabBarLive(false);
    expect(tabBarMetricsSnapshot().live).toBe(false);
  });

  it("keeps the measured height past unmount, but the live flag is what gates it", () => {
    publishTabBarLive(true);
    publishTabBarHeight(88);
    publishTabBarLive(false);
    const s = tabBarMetricsSnapshot();
    expect(s.measured).toBe(88); // still remembered…
    expect(clearanceFor({ live: s.live, measured: s.measured, insetBottom: 24 })).toBe(24); // …but not applied
  });

  it("ignores a zero height, a sub-half-pixel change, and applies a real one", () => {
    publishTabBarHeight(0);
    expect(tabBarMetricsSnapshot().measured).toBe(0);
    publishTabBarHeight(80);
    expect(tabBarMetricsSnapshot().measured).toBe(80);
    publishTabBarHeight(80.4);
    expect(tabBarMetricsSnapshot().measured).toBe(80);
    publishTabBarHeight(81);
    expect(tabBarMetricsSnapshot().measured).toBe(81);
  });
});
