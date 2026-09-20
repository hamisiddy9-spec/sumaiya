/**
 * Job recommendations — the per-user "Jobs zako / Jobs for you" engine.
 *
 * Strategy (free, no AI cost): score every live listing against the user's
 * most recent CV with the same heuristic the editor uses (lib/job-match.ts),
 * keep the strongest matches, cache them in `job_recommendation`, and refresh
 * nightly (cron) + on-demand when a cached row is older than RECOMMENDATION_TTL_MS.
 *
 * The reason string is built from the terms the CV actually matched — honest,
 * explainable, and cheap.
 */
import { db, cv, job, jobRecommendation, userProfile, type NewJobRecommendation } from "../db";
import { eq, desc, inArray, gt, and } from "drizzle-orm";
import { parseCVData, parseCareerProfile, toStringArray } from "../../types";
import { getCVTerms, extractTerms, scoreTerms } from "../job-match";
import { profileToCvData } from "../career-profile/mapper";
import { LIVE_STATUSES } from "./constants";
import { locationFit, rankScore, compareByReach, type LocationFit, type ReachTier } from "./location-relevance";

export const RECOMMENDATION_TTL_MS = 12 * 60 * 60 * 1000; // 12h
const MIN_SCORE = 20; // below this a "match" is noise — don't recommend
const TOP_K = 8; // cache depth per user
const DEFAULT_LIMIT = 3;
const MAX_REFRESH_USERS = 100; // nightly batch cap (cron runs daily)
const TITLE_BOOST = 10; // per shared title term (job title ↔ CV job title/skills)

export interface Recommendation {
  jobId: string;
  score: number;
  reason: string;
  matchedTerms: string[];
  /**
   * How reachable the listing is from the user's stated location(s) — the
   * disclosure half of the location model (lib/jobs/location-relevance.ts).
   * `reachable: false` means the listing is tied to a place or region the user
   * cannot take (a foreign on-site role, or a region-locked remote one); it is
   * already ranked below reachable roles, and the UI may say so. Always set by
   * this module; optional only because callers that synthesise a Recommendation
   * for rendering (e.g. the brief page) have no location context.
   */
  reach?: { tier: ReachTier; label: string; reachable: boolean };
  job: {
    id: string;
    title: string;
    company: string;
    location: string;
    category: string;
    employmentType: string;
    description: string;
    applyUrl: string;
    sourceName: string;
    applicationDeadline: string | null;
    createdAt: string;
  };
}

function buildReason(matched: string[], sw: boolean): string {
  const terms = matched
    .slice(0, 4)
    .map((t) => t.charAt(0).toUpperCase() + t.slice(1))
    .join(", ");
  if (!terms) return sw ? "Inalingana na wasifu wako" : "Matches your profile";
  return sw ? `Unaendana na: ${terms}` : `Matches your: ${terms}`;
}

/**
 * Every location the user has told us about: where they live (CV /
 * Career Profile) plus any preferred locations they set. Best-of is applied
 * downstream, so adding a second location only ever helps a listing's rank.
 */
async function loadUserLocations(userId: string): Promise<string[]> {
  const out: string[] = [];
  try {
    const [c] = await db
      .select({ data: cv.data })
      .from(cv)
      .where(eq(cv.userId, userId))
      .orderBy(desc(cv.updatedAt))
      .limit(1);
    if (c) out.push(parseCVData(c.data).personal?.location ?? "");
  } catch {
    /* a malformed CV must not break the refresh */
  }
  try {
    const [row] = await db
      .select({ careerProfile: userProfile.careerProfile })
      .from(userProfile)
      .where(eq(userProfile.id, userId))
      .limit(1);
    if (row?.careerProfile) {
      const p = parseCareerProfile(row.careerProfile);
      out.push(p.personal?.location ?? "", ...(p.preferences?.preferredLocations ?? []));
    }
  } catch {
    /* same */
  }
  return [...new Set(out.map((s) => (s ?? "").trim()).filter(Boolean))];
}

/** Recompute + replace a user's cached recommendations. Returns top `limit`. */
export async function computeRecommendations(userId: string, limit = DEFAULT_LIMIT): Promise<Recommendation[]> {
  // The spine: recommendations are driven by the user's career facts. Prefer
  // the most recent CV (richest), but fall back to the Career Profile when no
  // CV exists yet — a user who only completed the Career Interview still gets
  // matched jobs (profile → jobs is a first-run payoff, not a CV prerequisite).
  const [c] = await db
    .select({ id: cv.id, data: cv.data })
    .from(cv)
    .where(eq(cv.userId, userId))
    .orderBy(desc(cv.updatedAt))
    .limit(1);

  // CV terms drive the keyword score. The user's LOCATION is loaded separately
  // by loadUserLocations below, which also folds in the Career Profile's
  // preferred locations (so "I'd also work in Nairobi" reaches the ranker).
  let cvTerms: Set<string>;
  if (c) {
    try {
      cvTerms = getCVTerms(parseCVData(c.data));
    } catch {
      return [];
    }
  } else {
    const [row] = await db
      .select({ careerProfile: userProfile.careerProfile })
      .from(userProfile)
      .where(eq(userProfile.id, userId))
      .limit(1);
    if (!row?.careerProfile) return [];
    const derived = profileToCvData(parseCareerProfile(row.careerProfile));
    if (!derived.summary?.trim() && !derived.skills?.length && !derived.experience?.length) return [];
    cvTerms = getCVTerms(derived);
  }
  if (!cvTerms.size) return [];

  // Where the user is (and where they say they'd work). Empty is a legitimate
  // answer: locationFit then applies NO demotion at all rather than guessing.
  const userLocations = await loadUserLocations(userId);

  // Score every live listing (only ones with a description carry signal).
  const live = await db
    .select({
      id: job.id, title: job.title, company: job.company, location: job.location,
      category: job.category, employmentType: job.employmentType, description: job.description,
      applyUrl: job.applyUrl, sourceName: job.sourceName,
      applicationDeadline: job.applicationDeadline, createdAt: job.createdAt,
    })
    .from(job)
    .where(inArray(job.status, LIVE_STATUSES))
    .limit(500);

  const scored: { jobId: string; score: number; rank: number; matched: string[]; fit: LocationFit }[] = [];
  for (const j of live) {
    if (!j.description.trim()) continue;
    const m = scoreTerms(extractTerms(j.description), cvTerms);
    // Title boost: a job whose TITLE shares terms with the CV (job title or
    // skills) is a strong fit even when the JD is generic keyword soup —
    // global remote postings often are. Title hits also lead the reason, so
    // "Unaendana na: React, Engineer" reads like a real fit, not noise.
    const titleTerms = extractTerms(j.title).filter((t) => cvTerms.has(t));
    const reasonTerms = [...new Set([...titleTerms, ...m.matched])];
    const rawScore = Math.min(100, m.score + titleTerms.length * TITLE_BOOST);
    // Reachability (lib/jobs/location-relevance.ts) nudges the RANK — bounded to
    // ±14%, so a listing needs a >23% better keyword score to beat a much more
    // local one. It is NOT applied to the threshold: the MIN_SCORE gate below
    // tests the raw keyword evidence, so geography can reorder the list but can
    // never shrink it. The previous implementation multiplied first and gated
    // second, which deleted 0.3× of the feed's matches before anyone saw them.
    const fit = locationFit(userLocations, j.location);
    const rank = rankScore(rawScore, fit);
    if (rawScore >= MIN_SCORE) {
      scored.push({ jobId: j.id, score: Math.round(rank), rank, matched: reasonTerms, fit });
    }
  }
  // TWO ORTHOGONAL AXES, in this order:
  //   1. reachability CLASS (`fit.reachable`) — a listing tied to a place the
  //      user cannot work from loses to every listing they can work from, no
  //      matter how well it matches on keywords. This is the constraint axis:
  //      a Dar es Salaam engineer cannot take a San Francisco on-site role, and
  //      ranking it first was the measured failure of a keyword-only rank (a
  //      58%-match SF role beat every African and global-remote listing). The
  //      class is broad and symmetric, so it is NOT "Tanzania-first": for a user
  //      anywhere it means their own country, their neighbours, their continent
  //      and every remote listing open to them.
  //   2. RANK within the class — keyword evidence nudged ±14% by how near the
  //      listing is. Here keywords dominate, so a genuinely better-matched role
  //      wins; geography only breaks near-ties.
  // Nothing is dropped: the class only orders, and the MIN_SCORE gate is on the
  // raw keyword score. Unreachable listings still fill the cache whenever the
  // user has fewer than TOP_K reachable matches.
  scored.sort(compareByReach);
  const top = scored.slice(0, TOP_K);
  if (!top.length) return [];

  // Replace the user's cache in one transaction-ish batch (delete → insert).
  const sw = true; // default reason language; UI re-labels via lang prop when rendering
  const now = new Date();
  await db.delete(jobRecommendation).where(eq(jobRecommendation.userId, userId));
  if (top.length) {
    const rows: NewJobRecommendation[] = top.map((t, i) => ({
      id: `rec_${userId.slice(0, 8)}_${Date.now()}_${i}`,
      userId,
      jobId: t.jobId,
      score: t.score,
      reason: buildReason(t.matched, sw),
      matchedTerms: t.matched.slice(0, 8),
      updatedAt: now,
    }));
    await db.insert(jobRecommendation).values(rows).onConflictDoNothing();
  }

  return top.slice(0, limit).map((t) => {
    const j = live.find((x) => x.id === t.jobId)!;
    return {
      jobId: t.jobId,
      score: t.score,
      reason: buildReason(t.matched, sw),
      matchedTerms: t.matched.slice(0, 8),
      reach: { tier: t.fit.tier, label: t.fit.label, reachable: t.fit.reachable },
      job: {
        id: j.id, title: j.title, company: j.company, location: j.location,
        category: j.category, employmentType: j.employmentType, description: j.description,
        applyUrl: j.applyUrl, sourceName: j.sourceName,
        applicationDeadline: j.applicationDeadline?.toISOString() ?? null,
        createdAt: j.createdAt.toISOString(),
      },
    };
  });
}

/** Cached read — recompute only when stale or empty. */
export async function getRecommendations(userId: string, limit = DEFAULT_LIMIT): Promise<Recommendation[]> {
  const cutoff = new Date(Date.now() - RECOMMENDATION_TTL_MS);
  try {
    const rows = await db
      .select({
        rec: {
          id: jobRecommendation.id,
          score: jobRecommendation.score,
          reason: jobRecommendation.reason,
          matchedTerms: jobRecommendation.matchedTerms,
          updatedAt: jobRecommendation.updatedAt,
        },
        job: {
          id: job.id, title: job.title, company: job.company, location: job.location,
          category: job.category, employmentType: job.employmentType, description: job.description,
          applyUrl: job.applyUrl, sourceName: job.sourceName,
          applicationDeadline: job.applicationDeadline, createdAt: job.createdAt,
        },
      })
      .from(jobRecommendation)
      .innerJoin(job, eq(jobRecommendation.jobId, job.id))
      .where(and(eq(jobRecommendation.userId, userId), gt(jobRecommendation.updatedAt, cutoff)))
      .orderBy(desc(jobRecommendation.score))
      .limit(TOP_K);

    if (rows.length) {
      // The cache stores score/reason only, so reachability is recomputed here
      // from the user's locations and each job's own location text, and the
      // reachable-first class order is restored (SQL only knows the score).
      // TOP_K rows are read — the same depth the write path caches — so the
      // class re-sort can never truncate a reachable listing on the client.
      const userLocations = await loadUserLocations(userId);
      const ordered = rows
        .map((r) => ({ r, fit: locationFit(userLocations, r.job.location) }))
        .sort((a, b) =>
          (a.fit.reachable === b.fit.reachable ? 0 : a.fit.reachable ? -1 : 1) ||
          b.r.rec.score - a.r.rec.score,
        )
        .slice(0, limit);
      return ordered.map(({ r, fit }) => ({
        jobId: r.job.id,
        score: r.rec.score,
        reason: r.rec.reason,
        // Not a cast: 46 of 46 stored rows are a JSON string, and a cast let
        // that reach the render path as an array-typed lie.
        matchedTerms: toStringArray(r.rec.matchedTerms),
        reach: { tier: fit.tier, label: fit.label, reachable: fit.reachable },
        job: {
          id: r.job.id, title: r.job.title, company: r.job.company, location: r.job.location,
          category: r.job.category, employmentType: r.job.employmentType, description: r.job.description,
          applyUrl: r.job.applyUrl, sourceName: r.job.sourceName,
          applicationDeadline: r.job.applicationDeadline?.toISOString() ?? null,
          createdAt: r.job.createdAt.toISOString(),
        },
      }));
    }
  } catch {
    // Table may not exist yet (migration not run) — recompute will also fail;
    // callers degrade gracefully.
  }
  return computeRecommendations(userId, limit);
}

/** Nightly batch for the cron: refresh every user who owns a CV. */
export async function refreshAllRecommendations(): Promise<{ users: number; failed: number }> {
  // (Postgres forbids ORDER BY on a column outside the DISTINCT select list,
  // so we order by userId — a stable, valid ordering for the batch cap.)
  const users = await db
    .selectDistinct({ userId: cv.userId })
    .from(cv)
    .orderBy(desc(cv.userId))
    .limit(MAX_REFRESH_USERS);

  let failed = 0;
  for (const u of users) {
    try {
      await computeRecommendations(u.userId, DEFAULT_LIMIT);
    } catch (e) {
      failed += 1;
      console.error(`[jobs] recommendation refresh failed for ${u.userId}:`, e);
    }
  }
  return { users: users.length, failed };
}
