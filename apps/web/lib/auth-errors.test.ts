import { describe, it, expect } from "vitest";
import { authErrorMessage } from "./auth-errors";

describe("authErrorMessage — localized Supabase auth errors", () => {
  it("maps over_email_send_rate_limit to a friendly Swahili/English message", () => {
    expect(authErrorMessage("over_email_send_rate_limit", true)).toBe("Umejaribu mara nyingi — subiri dakika chache kisha ujaribu tena.");
    expect(authErrorMessage("over_email_send_rate_limit", false)).toBe("Too many requests — wait a few minutes and try again.");
  });

  it("maps over_request_rate_limit", () => {
    expect(authErrorMessage("over_request_rate_limit", true)).toContain("subiri");
    expect(authErrorMessage("over_request_rate_limit", false)).toBe("Too many requests — slow down and try again.");
  });

  it("maps email_exists to a sign-in nudge", () => {
    expect(authErrorMessage("email_exists", true)).toBe("Akaunti tayari ipo — ingia badala yake.");
    expect(authErrorMessage("email_exists", false)).toBe("An account already exists — sign in instead.");
  });

  it("never leaks a raw English SDK string — unknown/absent codes get the localized generic", () => {
    for (const code of [undefined, "", "some_unknown_code", "invalid_credentials", "over_email_send_rate_limit_typo"]) {
      const sw = authErrorMessage(code, true);
      const en = authErrorMessage(code, false);
      // No raw SDK phrasing leaks into either locale.
      expect(sw).not.toMatch(/rate limit|Something went wrong/i);
      expect(en).toBe("Something went wrong. Try again.");
    }
    expect(authErrorMessage(undefined, true)).toBe("Kuna hitilafu imetokea. Jaribu tena.");
  });
});
