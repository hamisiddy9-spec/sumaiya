/**
 * Localized messages for known Supabase auth error codes.
 *
 * The raw SDK error strings ("Email rate limit exceeded.") are English and
 * must never leak into the Swahili UI — every sign-in / sign-up surface maps
 * codes through here. Unknown codes get a friendly generic message.
 */
export function authErrorMessage(code: string | undefined, sw: boolean): string {
  if (code === "over_email_send_rate_limit") {
    return sw
      ? "Umejaribu mara nyingi — subiri dakika chache kisha ujaribu tena."
      : "Too many requests — wait a few minutes and try again.";
  }
  if (code === "over_request_rate_limit") {
    return sw
      ? "Umejaribu mara nyingi — subiri kidogo kisha ujaribu tena."
      : "Too many requests — slow down and try again.";
  }
  if (code === "email_exists") {
    return sw
      ? "Akaunti tayari ipo — ingia badala yake."
      : "An account already exists — sign in instead.";
  }
  return sw ? "Kuna hitilafu imetokea. Jaribu tena." : "Something went wrong. Try again.";
}
