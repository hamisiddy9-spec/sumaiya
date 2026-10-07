/**
 * The "why the score moved" bullets, in ONE place and both languages.
 *
 * THE DEFECT THIS FILE EXISTS TO PREVENT
 * The snap screen's "KWA NINI ILIBADILIKA" section rendered RAW ENGLISH bullets
 * inside an otherwise Swahili conversation ("Still missing from your profile:
 * …", "Your profile already covers this job well — …"). The strings were built
 * server-side in lib/api/snap-apply.ts and lib/targeted-cv.ts, each with its own
 * hardcoded English copy, and the client could only print what it was given.
 *
 * Both producers now call this function with the caller's language, so the
 * bullets follow the conversation. The Swahili side describes the OUTCOME and
 * never names the screening mechanism: lib/swahili-lint.test.ts fails the build
 * on the mechanism named directly in Swahili (the guard fires when it follows a
 * Swahili connective or the word for a checker), so the Swahili says
 * "mifumo ya kuajiri" / "vigezo vya waajiri" / "waajiri" instead. English copy
 * may still name it.
 */

export type ExplanationLang = "en" | "sw";

export interface MatchExplanationInput {
  lang: ExplanationLang;
  /** Job keywords that the reorder surfaced (already present in the profile). */
  newlyMatched: string[];
  /** The top job keywords the profile still does not cover. */
  stillMissing: string[];
  /** Real engine scores (matchCvToJd) — before and after the reorder. */
  beforeScore: number;
  afterScore: number;
}

export function matchExplanation(input: MatchExplanationInput): string[] {
  const { lang, newlyMatched, stillMissing, beforeScore, afterScore } = input;
  const sw = lang === "sw";
  const out: string[] = [];

  if (newlyMatched.length) {
    const shown = newlyMatched.slice(0, 6);
    const tail = newlyMatched.length > 6 ? "…" : "";
    out.push(
      sw
        ? `Nimeweka mbele maneno ${newlyMatched.length} ambayo tayari yapo kwenye wasifu wako: ${shown.join(", ")}${tail}.`
        : `Reordering surfaced ${newlyMatched.length} keyword${newlyMatched.length === 1 ? "" : "s"} already in your profile: ${shown.join(", ")}${tail}.`,
    );
  }

  if (stillMissing.length) {
    const shown = stillMissing.slice(0, 6);
    out.push(
      sw
        ? `Bado hayapo kwenye wasifu wako: ${shown.join(", ")}.`
        : `Still missing from your profile: ${shown.join(", ")}.`,
    );
  }

  if (afterScore > beforeScore) {
    out.push(
      sw
        ? "Ujuzi na uzoefu unaofaa kazi hii sasa uko mbele, hivyo waajiri wanauona kwanza."
        : "Your best skills and experience for this role moved to the top, so ATS keyword scanning sees them first.",
    );
  } else if (afterScore === beforeScore) {
    out.push(
      sw
        ? "Wasifu wako unatosheleza kazi hii vizuri — mpangilio huu unabaki na ulinganifu ule ule, na unaweka mbele yaliyo muhimu zaidi kwa mwajiri."
        : "Your profile already covers this job well — the reorder keeps the same match while putting the most relevant content first for a human recruiter.",
    );
  } else {
    out.push(
      sw
        ? "Kazi hii inahitaji ujuzi ambao haupo kwenye wasifu wako — alama inaonyesha pengo halisi."
        : "This job asks for skills outside your profile — the score reflects the real gap.",
    );
  }

  return out;
}
