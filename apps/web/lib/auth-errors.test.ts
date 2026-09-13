import { describe, it, expect } from "vitest";
import { authErrorMessage } from "./auth-errors";
import { COMPANY } from "./legal";

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

  /**
   * `unexpected_failure` is what GoTrue returns in its body when its mailer
   * cannot send — observed live on 2026-09-13 with no SMTP configured on the
   * project. It is NOT an unknown code: falling through to the generic threw
   * away the one fact the user needed, and the generic promises a retry that
   * fails the same way every time while the mailer is down.
   */
  describe("the mailer could not send", () => {
    /**
     * The shape supabase-js ACTUALLY hands the UI for this failure, dumped
     * from the live project:
     *
     *   name: "AuthRetryableFetchError", status: 500,
     *   message: "Error sending confirmation email", code: undefined
     *
     * The body's `error_code` is dropped, so a check on `code` alone never
     * fires. An earlier revision of this fix did exactly that and was dead
     * code — hence this test asserts the message-only path explicitly.
     */
    const LIVE_ERROR = { code: undefined, message: "Error sending confirmation email" };

    it("fires on the message alone, because code is undefined for a 500", () => {
      const sw = authErrorMessage(LIVE_ERROR.code, true, LIVE_ERROR.message);
      const en = authErrorMessage(LIVE_ERROR.code, false, LIVE_ERROR.message);
      expect(en).not.toBe("Something went wrong. Try again.");
      expect(sw).not.toBe("Kuna hitilafu imetokea. Jaribu tena.");
      expect(en).toMatch(/on my side/i);
    });

    it("still recognises the code when a code IS present", () => {
      expect(authErrorMessage("unexpected_failure", true)).toMatch(/Sikuweza/);
    });

    it("covers every email kind the mailer sends", () => {
      for (const msg of [
        "Error sending magic link email",
        "Error sending confirmation email",
        "Error sending recovery email",
        "Error sending invite email",
      ]) {
        expect(authErrorMessage(undefined, false, msg)).toMatch(/on my side/i);
      }
    });

    it("keeps both locales free of raw SDK English", () => {
      const sw = authErrorMessage(LIVE_ERROR.code, true, LIVE_ERROR.message);
      const en = authErrorMessage(LIVE_ERROR.code, false, LIVE_ERROR.message);
      expect(sw).not.toMatch(/magic link|confirmation email|unexpected_failure|Something went wrong/i);
      expect(en).not.toMatch(/magic link|unexpected_failure/i);
    });

    it("takes the blame instead of implying the user did something wrong", () => {
      const sw = authErrorMessage(LIVE_ERROR.code, true, LIVE_ERROR.message);
      expect(sw).toMatch(/upande wangu/);
      expect(sw).not.toMatch(/mtandao/i); // not the user's connection
    });

    it("gives a route to a human instead of only 'try again'", () => {
      for (const sw of [true, false]) {
        expect(authErrorMessage(LIVE_ERROR.code, sw, LIVE_ERROR.message)).toContain(
          COMPANY.supportEmail,
        );
      }
    });

    it("does not hijack an unrelated message", () => {
      // A message that merely mentions email must not be swallowed.
      expect(authErrorMessage(undefined, false, "Invalid email address")).toBe(
        "Something went wrong. Try again.",
      );
    });

    it("uses the persona's first person, matching the native app", () => {
      const sw = authErrorMessage(LIVE_ERROR.code, true, LIVE_ERROR.message);
      expect(sw).toMatch(/^Sikuweza/);
      expect(sw).not.toMatch(/\b(Imeshindwa|Inashindwa)\b/);
    });
  });
});
