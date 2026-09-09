/**
 * Greeting-language guard for Sumaiya's replies (R1 live-QA finding, 2026-08).
 *
 * The prompt now says "GREETING WORDS MUST MATCH" — but that is advisory.
 * Live QA with lang=en produced "Karibu Grace!" (a SWAHILI greeting) on a
 * non-trivial fraction of replies: the NAMES rule historically listed
 * ("Karibu!", "Welcome!") side by side, and the model sometimes picked the
 * first even in an English conversation. This is a deterministic SERVER-SIDE
 * backstop: if the language is English, a leading Swahili greeting is swapped
 * for an English one (rotated); if the language is Swahili, a leading English
 * greeting is swapped for a Swahili one. Pure — no IO, unit-testable.
 */

const SW_GREETING = "Karibu";
const EN_GREETINGS = ["Hello", "Hi", "Welcome"];

/** Match a leading "Karibu" greeting (optionally followed by a name/punct). */
const LEADING_KARIBU = /^Karibu\b/i;

/** Match a leading English greeting word. */
const LEADING_EN = /^(Hello|Hi|Welcome)\b/i;

/**
 * Normalize a leading greeting so the rest of the reply stays untouched.
 * Returns the original reply when no fix is needed (the common case).
 */
export function guardGreetingLanguage(reply: string, lang: "en" | "sw", rotation = 0): string {
  const text = (reply || "").trim();
  if (!text) return reply;

  if (lang === "en" && LEADING_KARIBU.test(text)) {
    const greeting = EN_GREETINGS[rotation % EN_GREETINGS.length];
    return text.replace(LEADING_KARIBU, greeting);
  }

  if (lang === "sw" && LEADING_EN.test(text)) {
    return text.replace(LEADING_EN, SW_GREETING);
  }

  return reply;
}

/** True when the reply starts with the WRONG-language greeting (used in tests). */
export function hasWrongLanguageGreeting(reply: string, lang: "en" | "sw"): boolean {
  const text = (reply || "").trim();
  if (!text) return false;
  if (lang === "en") return LEADING_KARIBU.test(text);
  return LEADING_EN.test(text);
}
