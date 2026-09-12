/**
 * Guards for "tailor my CV / write my cover letter".
 *
 * Why this exists: the API treated an empty cover-letter body as success. The
 * model returned `"coverLetter": ""`, `typeof "" === "string"` passed, the app
 * got a letter object with nothing in it, and the person exported a PDF
 * containing only the job title and the company name. A blank document that
 * opens perfectly is worse than an error, because it can be sent to an employer.
 *
 * Pure and dependency-free on purpose: the HTTP layer calls it, and the rules
 * are unit-tested here rather than inferred from a mock.
 */

/** A body shorter than this is not a letter. */
export const MIN_LETTER_BODY = 80;
/** A rewritten summary shorter than this is not a summary. */
export const MIN_SUMMARY = 40;

/** True when `value` is a string with real content (not "", not whitespace). */
export function usableText(value: unknown, min: number): boolean {
  return typeof value === "string" && value.trim().length >= min;
}

export interface TailoringRequest {
  wantCv: boolean;
  wantLetter: boolean;
}

export type TailoringVerdict =
  | { ok: true }
  | { ok: false; missing: "letter" | "cv"; error: string };

/**
 * Decides whether a model response is worth returning. Checked per-part on
 * purpose: a request for "both" that produced a good CV and an empty letter is
 * still a broken request, because the person is about to send the letter.
 */
export function checkTailoring(parsed: Record<string, unknown>, req: TailoringRequest): TailoringVerdict {
  if (req.wantLetter && !usableText(parsed.coverLetter, MIN_LETTER_BODY)) {
    return {
      ok: false,
      missing: "letter",
      error: "The letter didn't come out properly — nothing would have been written in it. Please try again.",
    };
  }

  if (req.wantCv) {
    const summaryOk = usableText(parsed.summary, MIN_SUMMARY);
    const experienceOk =
      Array.isArray(parsed.experience) &&
      parsed.experience.some((e) => usableText((e as { description?: unknown })?.description, 20));
    if (!summaryOk && !experienceOk) {
      return {
        ok: false,
        missing: "cv",
        error: "The tailoring didn't come out properly — nothing would have changed. Please try again.",
      };
    }
  }

  return { ok: true };
}
