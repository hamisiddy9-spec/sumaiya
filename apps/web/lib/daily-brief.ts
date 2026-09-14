// E3 — "Your Daily Brief" core (vertical slice #1 of the Autonomous Career
// Agent). Assembled from REAL data only: live job recommendations (the
// deterministic match engine in lib/jobs/recommend.ts), the user's actual
// applications (lib/applications nudge logic) and the verified career profile.
//
// HARD PRODUCT RULES:
//  - The core is deterministic — zero AI. Nothing here invents a job, a match,
//    a score or experience the user lacks. AI drafts (tailored CV/cover
//    letter) live behind the snap/tailor pipeline and are NEVER generated,
//    sent, saved or published without an explicit user tap.
//  - Empty is honest: no matches / no profile → a warm truthful state, never
//    padded with weak or fake items.
//  - Bilingual sw/en via the `sw` flag, like every other surface.

import type { Recommendation } from "@/lib/jobs/recommend";
import { toStringArray } from "@/types";

// ─── Pure helpers (unit-tested, no IO) ──────────────────────────────────────

export interface BriefMatch {
  jobId: string;
  title: string;
  company: string;
  location: string;
  score: number;
  reason: string;
  matchedTerms: string[];
  /** True when a tailored CV/cover letter for this job can be produced on tap. */
  actionable: boolean;
}

export interface BriefFollowUp {
  applicationId: string;
  title: string;
  company: string;
  status: string;
  daysWaiting: number;
}

export interface DailyBrief {
  /** Honest one-liner — e.g. "3 new roles fit you; strongest match is X — 82%". */
  headline: string;
  /** True when the user has a career profile (or a CV-derived profile). */
  hasProfile: boolean;
  matches: BriefMatch[];
  followUps: BriefFollowUp[];
  /** Count of live jobs scanned (for the "checked N roles today" line). */
  jobsScanned: number;
  generatedAt: string;
}

/**
 * Build the brief's honest headline from what actually exists.
 * Rules: never mention a count that is zero as an opportunity; when there are
 * matches, lead with the strongest (real) match + its real score; when there
 * are only follow-ups, say so plainly; when nothing, say nothing happened —
 * truthfully, warmly.
 */
export function briefHeadline(
  sw: boolean,
  hasProfile: boolean,
  matches: BriefMatch[],
  followUps: BriefFollowUp[],
): string {
  if (!hasProfile) {
    return sw
      ? "Kwanza jenga Wasifu wako wa Kazi — ndipo nikutafutie kazi zinazofaa."
      : "Start by building your Career Profile — then I'll find roles that fit you.";
  }
  if (matches.length === 0 && followUps.length === 0) {
    return sw
      ? "Hakuna nafasi mpya za kazi zinazokufaa leo — njoo tena kesho."
      : "No new roles fit you today — check back tomorrow.";
  }
  if (matches.length === 0) {
    return sw
      ? `Hakuna nafasi mpya za kazi, lakini una maombi ${followUps.length} yanayohitaji kufuatiliwa.`
      : `No new roles today, but you have ${followUps.length} application${followUps.length === 1 ? "" : "s"} to follow up on.`;
  }
  const top = matches[0];
  if (sw) {
    return `${matches.length} nafasi ${matches.length === 1 ? "mpya inakufaa" : "mpya zinakufaa"}; mwenye nguvu zaidi ni ${top.title} — ${top.score}%.`;
  }
  return `${matches.length} new role${matches.length === 1 ? "" : "s"} fit you; strongest match is ${top.title} — ${top.score}%.`;
}

/**
 * Rank + shape raw recommendations into brief matches. Deterministic: sorts
 * by score desc (stable), keeps the top N, marks actionable = true whenever
 * the job has a description (so tailoring has real input material). Never
 * fabricates — it only copies fields the engine actually produced.
 */
export function rankMatches(recs: Recommendation[], limit = 3): BriefMatch[] {
  return [...recs]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => ({
      jobId: r.jobId,
      title: r.job.title,
      company: r.job.company ?? "",
      location: r.job.location ?? "",
      score: r.score,
      reason: r.reason,
      matchedTerms: toStringArray(r.matchedTerms),
      actionable: Boolean(r.job.description && r.job.description.trim().length > 0),
    }));
}

/**
 * Shape applications needing follow-up (the nudge logic already decided WHO
 * needs it — we just carry the real fields).
 */
export function shapeFollowUps(
  apps: Array<{ id: string; title: string; companyName: string | null; status: string; appliedAt: Date | string | null; createdAt: Date | string }>,
): BriefFollowUp[] {
  return apps.map((a) => ({
    applicationId: a.id,
    title: a.title,
    company: a.companyName ?? "",
    status: a.status,
    daysWaiting: Math.max(
      0,
      Math.floor(
        (Date.now() - new Date(a.appliedAt ?? a.createdAt).getTime()) / 86_400_000,
      ),
    ),
  }));
}
