/**
 * Location relevance for job recommendations.
 *
 * Why this exists: the recommendation score (job-match.ts) is pure keyword
 * overlap between a CV and a job description. A Dar es Salaam warehouse
 * supervisor's CV can share enough generic terms with a Canada-only logistics
 * posting to clear MIN_SCORE, even though the user has no realistic way to
 * take that job (no visa, no relocation).
 *
 * Sumaiya is Tanzania-first. The feed leads with Tanzanian roles and treats
 * East African neighbours as "nearby", while a specific foreign location is
 * demoted hard (never fully removed — a global remote board is still useful).
 */
import { isRemoteLocation } from "./feed-filter";

// City → country, so "Dar es Salaam" and "Tanzania" resolve to the same place.
// Only East/Southern Africa is mapped — a place we can't resolve falls back to
// the token-overlap demotion below.
const CITY_TO_COUNTRY: Record<string, string> = {
  // Tanzania
  dar: "Tanzania", salaam: "Tanzania", dodoma: "Tanzania", mwanza: "Tanzania",
  arusha: "Tanzania", zanzibar: "Tanzania", mbeya: "Tanzania", morogoro: "Tanzania",
  tanga: "Tanzania", moshi: "Tanzania", kigoma: "Tanzania", tabora: "Tanzania",
  iringa: "Tanzania", bukoba: "Tanzania", musoma: "Tanzania", shinyanga: "Tanzania",
  // Kenya
  nairobi: "Kenya", mombasa: "Kenya", kisumu: "Kenya", nakuru: "Kenya", eldoret: "Kenya",
  // Uganda
  kampala: "Uganda", entebbe: "Uganda", jinja: "Uganda",
  // Rwanda
  kigali: "Rwanda",
  // Burundi
  bujumbura: "Burundi",
  // Zambia
  lusaka: "Zambia", kitwe: "Zambia", ndola: "Zambia",
  // Malawi
  lilongwe: "Malawi", blantyre: "Malawi",
  // Mozambique
  maputo: "Mozambique",
  // DRC
  kinshasa: "DRC", lubumbashi: "DRC", goma: "DRC",
};

const COUNTRY_TOKENS: Record<string, string> = {
  tanzania: "Tanzania", kenya: "Kenya", uganda: "Uganda", rwanda: "Rwanda",
  burundi: "Burundi", zambia: "Zambia", malawi: "Malawi", mozambique: "Mozambique",
  drc: "DRC", congo: "DRC",
};

// Tanzania + its neighbours: full or near-full weight. Anything else is far.
const NEARBY = new Set([
  "Tanzania", "Kenya", "Uganda", "Rwanda", "Burundi", "Zambia", "Malawi",
  "Mozambique", "DRC",
]);

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

/** Resolve a location string to a country, or null when unrecognised. */
function resolveCountry(location: string): string | null {
  for (const t of locationTokens(location)) {
    if (COUNTRY_TOKENS[t]) return COUNTRY_TOKENS[t];
    if (CITY_TO_COUNTRY[t]) return CITY_TO_COUNTRY[t];
  }
  return null;
}

/**
 * Multiplier applied to a job's keyword-match score based on geographic fit.
 * 1.0 = no adjustment (remote, unknown on both sides, or a real local match).
 * < 1.0 = demoted — mild for a nearby nation, hard for a far-away one.
 */
export function locationRelevance(userLocation: string, jobLocation: string): number {
  const job = jobLocation.trim();
  if (!job) return 1; // job didn't state a location — no basis to penalize
  if (isRemoteLocation(job)) return 1; // remote is viable from anywhere

  // A user with no stated location is treated as Tanzanian — Sumaiya is
  // Tanzania-first, so foreign postings must not float to the top on keyword
  // coincidence when the feed has no idea where the user is.
  const user = userLocation.trim() || "Tanzania";

  const userCountry = resolveCountry(user);
  const jobCountry = resolveCountry(job);

  if (userCountry && jobCountry) {
    if (jobCountry === userCountry) return 1; // same country — full weight
    if (NEARBY.has(jobCountry)) return 0.7; // nearby nation — mild demotion
    return 0.15; // far away — strong demotion
  }

  // Fallback for unrecognised places ("London", "Berlin", "Auckland"):
  // token overlap still wins, but a specific foreign place is demoted harder.
  const userTokens = locationTokens(user);
  const jobTokens = locationTokens(job);
  if (!userTokens.size || !jobTokens.size) return 1;
  const overlaps = [...userTokens].some((t) => jobTokens.has(t));
  return overlaps ? 1 : 0.3;
}
