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
  // Password rules. Without these, the reset-password form rendered the SDK's
  // own English sentence ("Password should be at least 6 characters") on a
  // Swahili page — the same leak class as the mailer failure below, on the one
  // screen whose entire purpose is setting a password.
  if (code === "weak_password") {
    return sw
      ? "Nywila hii ni dhaifu mno. Tumia herufi nane au zaidi."
      : "That password is too weak. Use at least eight characters.";
  }
  if (code === "same_password") {
    return sw
      ? "Nywila mpya lazima itofautiane na ya awali."
      : "The new password has to be different from the old one.";
  }
  if (code === "reauthentication_needed") {
    return sw
      ? "Kwa usalama, ingia tena kisha ujaribu."
      : "For security, sign in again and then retry.";
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

/**
 * Localized copy for the Google Identity Services failure reasons
 * (`GoogleIdTokenFailure` in lib/google-identity.ts, delivered as `code`).
 *
 * Every branch necessarily points at the email code path, because that is the
 * route that must keep working no matter what Google or the browser does: a
 * jobseeker on a cheap Android phone with a blocked third-party context must
 * still be able to get in.
 */
export function googleSignInErrorMessage(reason: string | undefined, sw: boolean): string {
  switch (reason) {
    case "dismissed":
      return sw
        ? "Kuingia kwa Google kumeghairiwa. Jaribu tena, au tumia barua pepe hapa chini."
        : "Google sign-in was cancelled. Try again, or use email below.";
    case "timeout":
      return sw
        ? "Google haikujibu kwa wakati. Jaribu tena, au tumia barua pepe hapa chini."
        : "Google didn't answer in time. Try again, or use email below.";
    case "script_unavailable":
      return sw
        ? "Sikuweza kufikia Google — angalia mtandao wako, au tumia barua pepe hapa chini."
        : "I couldn't reach Google — check your connection, or use email below.";
    case "not_supported":
      return sw
        ? "Kivinjari chako hakiruhusu kuingia kwa Google. Tumia barua pepe hapa chini — inafanya kazi kwa kila kifaa."
        : "This browser won't allow Google sign-in. Use email below — it works on every device.";
    case "not_configured":
      return sw
        ? "Kuingia kwa Google hakujasanidiwa bado. Tumia barua pepe hapa chini."
        : "Google sign-in isn't set up yet. Use email below.";
    default:
      return sw
        ? "Kuingia kwa Google kumeshindikana. Tumia barua pepe hapa chini."
        : "Google sign-in failed. Use email below.";
  }
}
