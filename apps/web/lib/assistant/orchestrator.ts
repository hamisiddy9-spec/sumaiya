/**
 * Goal-chaining orchestrator — Phase 2 (D). One intent → many tools.
 *
 * After each tool executes, computeNextAction decides the next best step from
 * the goal + real state, so Sumaiya walks the user through the canonical
 * chain — "I want this job" → match → tailor → cover letter → track →
 * interview prep — WITHOUT auto-applying anything. Read tools run instantly
 * and render cards; write tools always go through preview→confirm (the client
 * enforces that via the tool sideEffect). The chain never auto-applies; it
 * proposes the next step and waits.
 *
 * Pure + deterministic: no AI, fully testable. The server computes scores
 * with the real engines (matchCvToJd / atsScore) so every next-step is
 * grounded in actual numbers, never invented.
 */
import type { UnifiedContext } from "./context";
import { matchCvToJd } from "@/lib/job-match";
import { analyzeCv, atsScore } from "@/lib/ats-score";

export interface ExecutedAction {
  tool: string;
  args: Record<string, unknown>;
  /** Real score when the executed read-tool produced one (jobs.match / ats.check). */
  score?: number;
  /** Application id when a jobs.track executed. */
  applicationId?: string;
}

export interface NextAction {
  tool: string;
  args: Record<string, unknown>;
  /** Where a suggested step lives outside the tool catalog (e.g. interview page). */
  href?: string;
  reason: { en: string; sw: string };
}

const TARGET_SCORE = 70;

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

/**
 * Compute the next best action after `last` executed. Rules (deterministic):
 *   jobs.match score < 70  → cv.tailor (same JD — close the gap)
 *   jobs.match score >= 70 → coverLetter.generate (strong fit — apply well)
 *   ats.check (low score)  → cv.improveSummary (the read ran; fix prose next)
 *   cv.tailor applied      → coverLetter.generate
 *   coverLetter.generate   → jobs.track
 *   jobs.track             → interview.prep (link to the interview page)
 *   everything else        → null (no invented next step)
 */
export function computeNextAction(
  context: UnifiedContext,
  last: ExecutedAction | null,
): NextAction | null {
  if (!last) return null;
  const jd = str(last.args?.jobDescription);

  switch (last.tool) {
    case "jobs.match": {
      if (!context.activeCv) return null;
      // NEVER trust a client-supplied score: the chain chip's numbers must
      // come from the real engine or a lying client could force the next step
      // (score:0 → cv.tailor, score:99 → coverLetter.generate) and spoof the
      // reason text. `last.score` is informational only and is ignored here.
      const score = jd ? matchCvToJd(context.activeCv.data, jd).score : 0;
      if (jd && score < TARGET_SCORE) {
        return {
          tool: "cv.tailor",
          args: { jobDescription: jd },
          reason: {
            en: `Your match is ${score}% — tailoring the CV to this job would close the gap.`,
            sw: `Unaendana kwa ${score}% — kutengeneza CV kwa kazi hii kutaongeza nafasi.`,
          },
        };
      }
      if (jd) {
        return {
          tool: "coverLetter.generate",
          args: { jobDescription: jd },
          reason: {
            en: `Strong match (${score}%) — a tailored cover letter would seal the application.`,
            sw: `Mechi imara (${score}%) — barua ya maombi itakamilisha ombi.`,
          },
        };
      }
      return null;
    }
    case "ats.check": {
      if (!context.activeCv) return null;
      // Same trust rule as jobs.match: the real engine decides, never the
      // client-supplied score.
      const score = atsScore(analyzeCv(context.activeCv.data, false));
      if (score < TARGET_SCORE) {
        return {
          tool: "cv.improveSummary",
          args: {},
          reason: {
            en: `ATS score is ${score}/100 — improving the summary is the fastest fix.`,
            sw: `Alama ya ATS ni ${score}/100 — kuboresha muhtasari ndiyo njia ya haraka.`,
          },
        };
      }
      return null;
    }
    case "cv.tailor":
      return {
        tool: "coverLetter.generate",
        args: jd ? { jobDescription: jd } : {},
        reason: {
          en: "CV tailored — next, write the cover letter for this job.",
          sw: "CV imekamilika — sasa andika barua ya maombi ya kazi hii.",
        },
      };
    case "coverLetter.generate":
      return {
        tool: "jobs.track",
        args: {
          jobTitle: str(last.args?.jobTitle) || undefined,
          companyName: str(last.args?.company) || undefined,
          jobDescription: jd || undefined,
        },
        reason: {
          en: "Letter ready — track the application so we can follow up.",
          sw: "Barua iko tayari — fuatilia ombi ili tuweze kufuatilia.",
        },
      };
    case "jobs.track":
      return {
        tool: "interview.prep",
        args: {},
        href: last.applicationId ? `/interview?app=${last.applicationId}` : "/interview",
        reason: {
          en: "Application tracked — want to prep for the interview?",
          sw: "Ombi limefuatiliwa — unataka kujitayarisha kwa mahojiano?",
        },
      };
    default:
      return null;
  }
}
