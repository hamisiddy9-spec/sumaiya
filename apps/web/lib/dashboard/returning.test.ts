import { describe, it, expect } from "vitest";
import { isReturningUser, dashboardGreetingKey } from "./returning";
import { t } from "@/lib/i18n/translations";

const none = { docCount: 0, hasCareerProfile: false, applicationCount: 0, downloadCount: 0 };

describe("new vs returning", () => {
  it("a fresh account with nothing is NOT returning", () => {
    expect(isReturningUser(none)).toBe(false);
  });

  it("each of the four real signals makes an account returning", () => {
    expect(isReturningUser({ ...none, docCount: 1 })).toBe(true);
    expect(isReturningUser({ ...none, hasCareerProfile: true })).toBe(true);
    expect(isReturningUser({ ...none, applicationCount: 1 })).toBe(true);
    expect(isReturningUser({ ...none, downloadCount: 1 })).toBe(true);
  });

  it("a fresh account gets the first-run greeting, not 'welcome back'", () => {
    const key = dashboardGreetingKey(isReturningUser(none));
    expect(key).toBe("dashboard.welcomeFirst");
    expect(t("sw", key)).toBe("Karibu");
    expect(t("en", key)).toBe("Welcome");
    // and the returning key really is the one that says "back"
    expect(t("sw", "dashboard.welcome")).toBe("Karibu tena");
    expect(t("en", "dashboard.welcome")).toBe("Welcome back");
  });

  it("a returning account keeps 'Karibu tena'", () => {
    expect(dashboardGreetingKey(isReturningUser({ ...none, docCount: 2 }))).toBe("dashboard.welcome");
  });
});
