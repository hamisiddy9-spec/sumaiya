// Supabase is configured for an 8-digit email OTP on Sumaiya production.
// Keep this in one place so UI copy, input length, and verification agree with
// the code users actually receive.
export const EMAIL_OTP_DIGITS = 8;

export function normalizeEmailOtp(input: string): string {
  return input.replace(/\D/g, "").slice(0, EMAIL_OTP_DIGITS);
}

export function isCompleteEmailOtp(input: string): boolean {
  return normalizeEmailOtp(input).length === EMAIL_OTP_DIGITS;
}
