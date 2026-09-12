import { resolveNotificationTarget } from "./notification-route";

describe("resolveNotificationTarget", () => {
  it("routes a top-level tab (confirmations signal) directly, not nested under HomeTab", () => {
    expect(resolveNotificationTarget("ProfileTab", { screen: "CareerProfile" })).toEqual({
      screen: "ProfileTab",
      params: { screen: "CareerProfile" },
    });
  });

  it("routes another top-level tab (coverLetter.generate signal) directly", () => {
    expect(resolveNotificationTarget("SumaiyaTab", { seed: "x" })).toEqual({
      screen: "SumaiyaTab",
      params: { seed: "x" },
    });
  });

  it("nests a HomeStack screen (the original follow-up-cron shape) under HomeTab", () => {
    expect(resolveNotificationTarget("Applications")).toEqual({
      screen: "HomeTab",
      params: { screen: "Applications", params: undefined },
    });
  });

  it("nests other HomeStack screens (Jobs, AtsChecker, LearningHub, Guide) under HomeTab too", () => {
    for (const screen of ["Jobs", "AtsChecker", "LearningHub", "Guide"]) {
      expect(resolveNotificationTarget(screen).screen).toBe("HomeTab");
    }
  });

  it("recognizes every real AppTabs tab as top-level, not just the ones a signal happens to target today", () => {
    // A regression test for its own sake: ImportTab was missing from
    // TOP_LEVEL_TABS despite being a real sibling tab in app-tabs.tsx — no
    // live signal targets it yet, but the gap would have silently failed to
    // navigate the moment one did, exactly like the bug this file fixes.
    for (const tab of ["HomeTab", "CVsTab", "SumaiyaTab", "ImportTab", "ProfileTab"]) {
      expect(resolveNotificationTarget(tab, { x: 1 })).toEqual({ screen: tab, params: { x: 1 } });
    }
  });
});
