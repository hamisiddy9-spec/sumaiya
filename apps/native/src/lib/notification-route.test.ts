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
});
