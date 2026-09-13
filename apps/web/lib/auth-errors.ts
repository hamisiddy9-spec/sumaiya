/**
 * Localized messages for known Supabase auth error codes.
 *
 * The raw SDK error strings ("Email rate limit exceeded.") are English and
 * must never leak into the Swahili UI — every sign-in / sign-up surface maps
 * codes through here. Unknown codes get a friendly generic message.
 *
 * ⚠️ `code` ALONE IS NOT ENOUGH. Measured 2026-09-13 against the live project:
 * a 500 from the auth service comes back from supabase-js as
 *
 *   name: "AuthRetryableFetchError"
 *   status: 500
 *   message: "Error sending confirmation email"
 *   code: undefined          ← the body's error_code is dropped
 *
 * so the `message` is the only signal for that class of failure. Any check
 * that reads `code` only will silently never fire. Pass both.
 */
import { COMPANY } from "./legal";

/** GoTrue's mailer failing: "Error sending magic link email" / "confirmation
 *  email" / "recovery email". A 500, so `code` arrives undefined (see above). */
const MAIL_SEND_FAILED = /error sending (magic link|confirmation|recovery|invite) email/i;

export function authErrorMessage(
  code: string | undefined,
  sw: boolean,
  message?: string,
): string {
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
  // The mailer could not send at all. The request reached the server and the
  // server failed to send, so this is our fault and must not be worded as
  // anything the user did wrong.
  //
  // The important part is what it does NOT say. The generic fallback below
  // ("Something went wrong. Try again.") is an unqualified retry promise, and
  // while the mailer is down that retry fails identically every time — the
  // user retries a few times and concludes the product is broken. Name the
  // failure, keep the promise honest, and give a route to a human.
  if (code === "unexpected_failure" || MAIL_SEND_FAILED.test(message ?? "")) {
    return sw
      ? `Sikuweza kutuma msimbo wako — tatizo ni upande wangu, si wako. Jaribu tena baada ya dakika chache; kama likiendelea niandikie ${COMPANY.supportEmail} nitalishughulikia.`
      : `I couldn't send your code — that's on my side, not yours. Try again in a few minutes, and if it keeps happening write to ${COMPANY.supportEmail} and I'll sort it out.`;
  }
  return sw ? "Kuna hitilafu imetokea. Jaribu tena." : "Something went wrong. Try again.";
}
