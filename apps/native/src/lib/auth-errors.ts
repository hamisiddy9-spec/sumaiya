/**
 * Turn a raw auth-provider error into something a person can act on, in the
 * language they are actually using.
 *
 * Why this module exists on its own:
 *
 * 1. It used to live inside auth-context.tsx and simply fall through to the raw
 *    message. A Google configuration failure therefore reached the sign-in
 *    screen verbatim:
 *
 *      DEVELOPER_ERROR: Follow troubleshooting instructions at
 *      https://react-native-google-signin.github.io/docs/troubleshooting
 *
 *    An engineer's error code, with a GitHub URL, shown to a user in Dar es
 *    Salaam. Every branch below either says what to do next or points at the
 *    path that still works.
 *
 * 2. Pulled out of the context it becomes a pure function with no native
 *    imports, so it can actually be tested — which matters, because the strings
 *    users read when something breaks are exactly the ones nobody tests.
 */
import type { Lang } from "./i18n";

// NOTE: `import type` on purpose. A value import of ./i18n would drag
// @sumaiya/utils -> expo-sqlite into this module, which makes it impossible to
// test in the node test environment and quietly couples pure string mapping to
// the whole app runtime. Types are erased, so this file stays dependency-free.

/**
 * @param lang Which language to answer in. Required rather than read from
 *   ambient state, so the caller owns the decision and both branches are testable.
 */
export function friendlyError(message: string, lang: Lang): string {
  const sw = lang === "sw";
  const t = (en: string, s: string) => (sw ? s : en);

  // A Google OAuth / SHA-1 misconfiguration (Android OAuth client missing the
  // signing key's fingerprint). Nothing the user can do, and the email path is
  // unaffected — so send them down it. The raw code is never shown.
  if (/DEVELOPER_ERROR|ApiException:?\s*10\b|\b12500\b/i.test(message)) {
    return t(
      "Google sign-in isn't available right now. Tap “Use email instead” below and we'll send you a code.",
      "Kuingia kwa Google hakupatikani kwa sasa. Gusa “Tumia barua pepe badala yake” hapa chini na tutakutumia msimbo.",
    );
  }
  if (/PLAY_SERVICES_NOT_AVAILABLE/i.test(message)) {
    return t(
      "Google Play Services is missing on this phone. Tap “Use email instead” below and we'll send you a code.",
      "Google Play Services haipo kwenye simu hii. Gusa “Tumia barua pepe badala yake” hapa chini na tutakutumia msimbo.",
    );
  }
  if (/network|timeout|timed out|failed to fetch|unable to resolve|ENOTFOUND/i.test(message)) {
    return t(
      "Can't reach Sumaiya. Check your internet connection and try again.",
      "Imeshindwa kufikia Sumaiya. Angalia mtandao wako, kisha ujaribu tena.",
    );
  }
  if (/token has expired|expired|otp_expired/i.test(message)) {
    return t(
      "That code has expired — tap “Send me a code” to get a fresh one.",
      "Msimbo huo umeisha muda — gusa “Nitumie msimbo” kupata mpya.",
    );
  }
  if (/invalid|incorrect|token/i.test(message) && /otp|code/i.test(message)) {
    return t(
      "That code isn't right. Check the digits and try again.",
      "Msimbo huo si sahihi. Angalia tarakimu, kisha ujaribu tena.",
    );
  }
  if (/rate limit|too many/i.test(message)) {
    return t(
      "Too many attempts. Wait a minute, then try again.",
      "Majaribio mengi mno. Subiri dakika moja, kisha ujaribu tena.",
    );
  }
  return message;
}
