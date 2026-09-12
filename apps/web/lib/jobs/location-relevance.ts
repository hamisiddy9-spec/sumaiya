/**
 * Location relevance for job recommendations.
 *
 * Why this exists: the recommendation score (job-match.ts) is pure keyword
 * overlap between a CV and a job description. A Dar es Salaam warehouse
 * supervisor's CV can share enough generic terms with a Canada-only
 * logistics posting to clear MIN_SCORE, even though the user has no
 * realistic way to take that job (no visa, no relocation). That produced
 * "matches" in the 13–31% range that read as noise, while the app already
 * knows — from the user's own CV/profile location — that they're not a
 * plausible candidate for a location-locked foreign role.
 *
 * This never filters jobs out (a global remote board is genuinely useful),
 * it only demotes a specific, non-remote, non-matching location so keyword
 * coincidence stops outranking real local/remote fits.
 */
import { isRemoteLocation } from "./feed-filter";

// Generic geography words that carry no identifying signal on their own.
const GENERIC_LOCATION_WORDS = new Set([
  "area", "region", "city", "county", "state", "province", "district",
  "metro", "greater", "based", "office", "hq", "headquarters", "remote",
]);

/** Lowercase, punctuation-stripped, generic-word-filtered location tokens. */
function locationTokens(location: string): Set<string> {
  return new Set(
    location
      .toLowerCase()
      .split(/[^a-z]+/)
      .filter((w) => w.length >= 3 && !GENERIC_LOCATION_WORDS.has(w)),
  );
}

/**
 * Multiplier applied to a job's keyword-match score based on geographic fit.
 * 1.0 = no adjustment (remote job, unknown location on either side, or a
 * real overlap). Less than 1.0 = the job names a specific place that shares
 * no token with the user's own location — demoted, not removed.
 */
export function locationRelevance(userLocation: string, jobLocation: string): number {
  const job = jobLocation.trim();
  if (!job) return 1; // job didn't state a location — no basis to penalize
  if (isRemoteLocation(job)) return 1; // remote is viable from anywhere

  const user = userLocation.trim();
  if (!user) return 1; // we don't know where the user is — no basis to judge

  const userTokens = locationTokens(user);
  const jobTokens = locationTokens(job);
  if (!userTokens.size || !jobTokens.size) return 1;

  const overlaps = [...userTokens].some((t) => jobTokens.has(t));
  return overlaps ? 1 : 0.4;
}
