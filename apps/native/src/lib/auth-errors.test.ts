import { friendlyError } from "./auth-errors";

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
});
