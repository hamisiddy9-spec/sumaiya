// Supabase is configured for an 8-digit email OTP on Sumaiya production.
//
// The literal now lives in ONE place — the shared package
// (@sumaiya/utils/auth-code) — because web and native each carried their own
// copy and drifted apart: web accepted 6 digits while this app accepted 8, and
// the server mails out exactly ONE length, so the web sign-in could never
// succeed while both suites stayed green.
//
// Keep this a re-export. A literal here is that bug coming back:
// apps/web/lib/otp-length-parity.test.ts reads this file and fails if the
// number is written down twice.
export {
  EMAIL_OTP_DIGITS,
  normalizeEmailOtp,
  isCompleteEmailOtp,
  emailOtpPlaceholder,
} from "@sumaiya/utils/auth-code";
