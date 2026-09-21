import { friendlyError } from "./auth-errors";
import { SUPPORT_EMAIL } from "./app-hosts";

/**
 * These strings are the last thing a user reads before giving up, they are
 * localised, and until now they were completely untested.
 *
 * The regression that motivated the file: a Google configuration failure
 * reached the sign-in screen verbatim as
 * "DEVELOPER_ERROR: Follow troubleshooting instructions at https://…", an
 * engineer's code and a GitHub URL, shown to a user in Dar es Salaam.
 */
describe("friendlyError", () => {
  // The exact string the device showed on 2026-09-13 (Samsung, pro.sumaiya.app).
  const RAW_DEVELOPER_ERROR =
    "DEVELOPER_ERROR: Follow troubleshooting instructions at https://react-native-google-signin.github.io/docs/troubleshooting";

  it("never leaks the raw Google configuration error", () => {
    for (const lang of ["en", "sw"] as const) {
      const msg = friendlyError(RAW_DEVELOPER_ERROR, lang);
      expect(msg).not.toContain("DEVELOPER_ERROR");
      expect(msg).not.toContain("http");
      expect(msg).not.toContain("react-native-google-signin");
    }
  });

  it("points at the path that still works when Google is misconfigured", () => {
    expect(friendlyError(RAW_DEVELOPER_ERROR, "en")).toMatch(/email/i);
    expect(friendlyError(RAW_DEVELOPER_ERROR, "sw")).toMatch(/barua pepe/i);
  });

  it("catches the ApiException 10 shape as well as the string form", () => {
    expect(friendlyError("ApiException: 10", "en")).toMatch(/email/i);
    expect(friendlyError("12500", "en")).toMatch(/email/i);
  });

  it("speaks Swahili when the app is in Swahili", () => {
    expect(friendlyError("DEVELOPER_ERROR", "sw")).toContain("hakupatikani");
    expect(friendlyError("token has expired", "sw")).toContain("umeisha muda");
    expect(friendlyError("rate limit exceeded", "sw")).toContain("Majaribio mengi");
  });

  it("speaks English when the app is in English", () => {
    expect(friendlyError("token has expired", "en")).toContain("expired");
    expect(friendlyError("rate limit exceeded", "en")).toContain("Too many attempts");
  });

  it("explains an unreachable backend instead of surfacing a fetch error", () => {
    expect(friendlyError("Network request failed", "en")).toMatch(/internet connection/i);
    expect(friendlyError("Network request failed", "sw")).toMatch(/mtandao/);
  });

  it("keeps an unrecognised error untouched rather than swallowing it", () => {
    expect(friendlyError("Something we have never seen", "en")).toBe(
      "Something we have never seen",
    );
  });

  it("does not mistake an unrelated code for the configuration failure", () => {
    // 1010 is not 10, and the word 'develop' is not 'DEVELOPER_ERROR'.
    expect(friendlyError("ApiException: 1010", "en")).toBe("ApiException: 1010");
  });

  /**
   * The failure the device actually showed on 2026-09-21, verbatim, on the Enigma
   * (Android 15, 720x1560 @ density 272): a mistyped address put the provider's
   * English — and the address itself — on a Kiswahili screen. Same convention as
   * RAW_MAIL_FAILURE below: a leak seen on a device gets its own case and its own
   * test, rather than replacing the deliberate passthrough this file keeps for
   * errors nobody has met yet.
   */
  const RAW_BAD_ADDRESS = 'Email address "qama-1625@example.com" is invalid';

  it("never returns the provider's own address rejection", () => {
    expect(friendlyError(RAW_BAD_ADDRESS, "en")).toMatch(/doesn't look right/i);
    expect(friendlyError(RAW_BAD_ADDRESS, "sw")).toMatch(/haionekani sahihi/);
    // and it must not echo the person's address back at them — the raw string did
    expect(friendlyError(RAW_BAD_ADDRESS, "en")).not.toContain("@");
    expect(friendlyError(RAW_BAD_ADDRESS, "sw")).not.toContain("@");
  });

  /**
   * The failure the device actually showed on 2026-09-13, verbatim, while the
   * auth project had no mailer configured. It reached a Swahili screen as raw
   * English SDK text because no branch matched it.
   */
  const RAW_MAIL_FAILURE = "Error sending magic link email";

  it("never leaks the mailer's own error text", () => {
    for (const lang of ["en", "sw"] as const) {
      const msg = friendlyError(RAW_MAIL_FAILURE, lang);
      expect(msg).not.toContain("magic link");
      expect(msg).not.toContain("unexpected_failure");
      expect(msg).not.toBe(RAW_MAIL_FAILURE);
    }
    // The signup variant names a different email; it is the same fault.
    expect(friendlyError("Error sending confirmation email", "sw")).toMatch(/Sikuweza/);
  });

  it("takes the blame instead of accusing the user's connection", () => {
    // "check your internet connection" would be a lie — the request reached
    // the server and the server failed to send.
    for (const lang of ["en", "sw"] as const) {
      const msg = friendlyError(RAW_MAIL_FAILURE, lang);
      expect(msg).not.toMatch(/internet|mtandao/i);
      expect(msg).not.toMatch(/connection/i);
    }
    expect(friendlyError(RAW_MAIL_FAILURE, "en")).toMatch(/on my side/i);
  });

  it("does not bounce the user to the other sign-in method", () => {
    // Google sign-in is broken on Android by an unrelated configuration
    // problem. If this message pointed at it, and Google's message points
    // back at email, the two dead ends would ping-pong the user forever.
    for (const lang of ["en", "sw"] as const) {
      const msg = friendlyError(RAW_MAIL_FAILURE, lang);
      expect(msg).not.toMatch(/use email instead/i);
      expect(msg).not.toMatch(/Tumia barua pepe badala yake/i);
      expect(msg).not.toMatch(/google/i);
    }
  });

  it("gives a way out that is not another button that will fail", () => {
    for (const lang of ["en", "sw"] as const) {
      expect(friendlyError(RAW_MAIL_FAILURE, lang)).toContain(SUPPORT_EMAIL);
    }
    expect(friendlyError(RAW_MAIL_FAILURE, "sw")).toMatch(/niandikie/);
  });

  it("uses the persona's first person, not a machine narrator", () => {
    // The product speaks as Sumaiya. The failure line takes ni-/nina-, never
    // the ina- class prefix used for a thing narrating a state.
    const sw = friendlyError(RAW_MAIL_FAILURE, "sw");
    expect(sw).toMatch(/^Sikuweza/);
    expect(sw).not.toMatch(/\b(Imeshindwa|Inashindwa)\b/);
  });
});
