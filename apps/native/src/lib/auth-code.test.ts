import { EMAIL_OTP_DIGITS, isCompleteEmailOtp, normalizeEmailOtp } from "./auth-code";

describe("email OTP code handling", () => {
  it("matches Sumaiya production OTP length", () => {
    expect(EMAIL_OTP_DIGITS).toBe(8);
  });

  it("keeps all digits from the production-length code users receive", () => {
    expect(normalizeEmailOtp("13695957")).toBe("13695957");
    expect(isCompleteEmailOtp("13695957")).toBe(true);
  });

  it("does not accept the first six digits of an 8-digit code", () => {
    expect(normalizeEmailOtp("13695957").slice(0, 6)).toBe("136959");
    expect(isCompleteEmailOtp("136959")).toBe(false);
  });

  it("strips non-digits and caps at the configured length", () => {
    expect(normalizeEmailOtp("code: 136-959-5799")).toBe("13695957");
  });
});
