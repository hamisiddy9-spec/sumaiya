/**
 * The email sign-in code — ONE source of truth for every surface.
 *
 * Why this file exists
 * -------------------
 * The web sign-in form accepted **6** digits; the Android app accepted **8**.
 * The server sends exactly ONE length, so one of those two sign-ins could never
 * succeed — and both test suites were green, because each surface only ever
 * asserted against its own literal. Nothing asserted the seam between them.
 *
 * Sumaiya production's Supabase project is configured for an 8-digit email OTP,
 * so 8 is the number the server actually mails out. The fix is not "change web
 * to 8": it is that the number must exist in ONE place that both clients read,
 * so the two surfaces cannot drift apart again. `apps/web/lib/otp-length-parity.test.ts`
 * fails if either surface grows its own copy.
 *
 * Everything a surface needs is derived from `EMAIL_OTP_DIGITS` — the input's
 * maxLength, the submit gate, and the "we sent a N-digit code" copy all read it,
 * so changing the project's OTP length is a one-line change here.
 */
export const EMAIL_OTP_DIGITS = 8;

/** Digits only, capped at the server's code length (paste-friendly). */
export function normalizeEmailOtp(input: string): string {
  return input.replace(/\D/g, "").slice(0, EMAIL_OTP_DIGITS);
}

/** True only for a code of exactly the length the server sends. */
export function isCompleteEmailOtp(input: string): boolean {
  return normalizeEmailOtp(input).length === EMAIL_OTP_DIGITS;
}

/** Placeholder/label text: `•`.repeat(EMAIL_OTP_DIGITS). */
export function emailOtpPlaceholder(): string {
  return "•".repeat(EMAIL_OTP_DIGITS);
}
