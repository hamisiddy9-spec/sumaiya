/**
 * Jobs ingestion pipeline.
 *
 * Sources live as adapters in lib/jobs/sources/ (one file per source),
 * registered in the registry. This module owns the ingest semantics:
 * fetch (via the registry) → authenticity check → dedup → upsert.
 *
 * Pipeline: fetch → authenticity check → normalize → dedup → upsert.
 * GLOBAL scope — no region filter; every posting from a trusted source is a
 * candidate opening. Authenticity (lib/jobs/authenticity.ts) drops scam and
 * placeholder listings before they ever reach the feed.
 *
 * Upsert semantics (no duplicates, no data loss):
 *   - New listing  → INSERT with last_verified_at = now, status = published.
 *   - Known listing (source + external_id) → compare content; UPDATE changed
 *     fields (title/company/location/description/applyUrl/deadline) and refresh
 *     last_verified_at. Content that did NOT change also refreshes verification
 *     — that's how a listing proves it's still live.
 *
 * All imports are RELATIVE on purpose — this module is also executed directly
 * by scripts/seed-jobs.ts under tsx, which doesn't resolve "@/” aliases.
 */
import { db, job, type NewJob } from "../db";
import { eq, inArray, sql } from "drizzle-orm";
import { VERIFY_GRACE_DAYS, type JobStatus } from "./constants";
import { expireJobs } from "./lifecycle";
import { verifyListing } from "./authenticity";
import { runAllSources, summarizeRun } from "./sources/registry";
import { dedupeJobs, corroboratingSources } from "./dedup";
// Relative, like every import in this module: scripts/seed-jobs.ts runs it
// directly under tsx, which does not resolve the "@/" alias.
import { jsonbParam } from "../db/jsonb";
import type { NormalizedJob } from "./sources/types";

// Re-export the canonical shape so existing callers keep working.
export type { NormalizedJob } from "./sources/types";
export { runAllSources as fetchAllSources, JOB_SOURCE_REGISTRY } from "./sources/registry";

// ─── Ingest (authenticity → upsert + verification) ───────────────────────────

export interface IngestResult {
  fetched: number; // raw jobs from sources (before dedup)
  deduped: number; // cross-source duplicates collapsed to one canonical record
  corroborated: number; // canonical records carried by 2+ sources
  inserted: number;
  updated: number;
  unchanged: number;
  skipped: number;
  flagged: number; // dropped by the authenticity guard (scam/placeholder/unsafe url)
  expired: number;
}

/**
 * Fetches, normalizes and upserts listings. Existing listings are matched on
 * (source, external_id); changed content updates the record, and every sighting
 * refreshes last_verified_at — the proof a listing is still live. Listings that
 * fail the authenticity guard are dropped and counted, never published.
 *
 * Performance: all DB work is batched (one read + one upsert + one touch), so
 * a feed of 1,000+ listings completes well inside the cron's time budget.
 */
export async function ingestJobs(): Promise<IngestResult> {
  // Fetch through the registry: every adapter isolated, disabled sources
  // skipped, failures logged — the run never dies because one source broke.
  const { jobs: fetched, reports } = await runAllSources();
  console.log(`[jobs] ingest sources: ${summarizeRun(reports)}`);

  // ── Cross-source dedup BEFORE upsert: the same real opening on multiple
  //    boards collapses to ONE canonical record. Corroboration (2+ sources
  //    carrying the posting) is recorded — it is an authenticity signal. ──
  const { jobs: canonical, corroboration, collapsed, corroboratedGroups } = dedupeJobs(fetched);
  const result: IngestResult = {
    fetched: fetched.length, deduped: collapsed, corroborated: corroboratedGroups,
    inserted: 0, updated: 0, unchanged: 0, skipped: 0, flagged: 0, expired: 0,
  };
  if (collapsed > 0) {
    console.log(`[jobs] dedup: ${fetched.length} → ${canonical.length} (${collapsed} collapsed, ${corroboratedGroups} corroborated by 2+ sources)`);
  }

  if (!canonical.length) {
    result.expired = await expireJobs();
    return result;
  }

  const now = new Date();

  // ── Load the existing feed for our sources ONCE (in-memory dedup/upsert). ──
  const sourceKeys = [...new Set(canonical.map((j) => j.source))];
  const existing = await db
    .select({
      id: job.id, source: job.source, externalId: job.externalId, title: job.title, company: job.company,
      location: job.location, category: job.category, employmentType: job.employmentType,
      description: job.description, applyUrl: job.applyUrl, status: job.status,
      applicationDeadline: job.applicationDeadline,
    })
    .from(job)
    .where(inArray(job.source, sourceKeys));

  const byExternal = new Map<string, (typeof existing)[number]>();
  const fingerprints = new Set<string>(); // source|title|company — same-source dedup
  for (const e of existing) {
    if (e.externalId) byExternal.set(`${e.source}|${e.externalId}`, e);
    fingerprints.add(`${e.source}|${e.title.toLowerCase()}|${e.company.toLowerCase()}`);
  }

  const upsertRows: NewJob[] = [];
  const touchIds: string[] = [];
  let flaggedCount = 0;

  for (const j of canonical) {
    // ── Authenticity guard: never publish scam/placeholder/unsafe listings.
    const verdict = verifyListing({
      title: j.title,
      company: j.company,
      description: j.description,
      applyUrl: j.applyUrl,
    });
    if (!verdict.ok) {
      flaggedCount += 1;
      console.warn(`[jobs] flagged ${j.source}/${j.externalId}: ${verdict.reasons.join("; ")}`);
      continue;
    }

    const cur = byExternal.get(`${j.source}|${j.externalId}`);

    if (cur) {
      const changed =
        cur.title !== j.title ||
        cur.company !== j.company ||
        cur.location !== j.location ||
        cur.category !== j.category ||
        cur.employmentType !== j.employmentType ||
        cur.description !== j.description ||
        cur.applyUrl !== j.applyUrl ||
        cur.applicationDeadline?.getTime() !== j.applicationDeadline?.getTime();

      if (!changed && cur.status !== "expired") {
        // Same content, still live — just refresh the verification stamp.
        touchIds.push(cur.id);
        result.unchanged += 1;
        continue;
      }
      // Changed content (or an expired listing the source lists again) → the
      // batched upsert below updates it.
      result.updated += 1;
    } else {
      // New listing — skip if a same-source (title, company) fingerprint exists
      // (a source may list the same opening under different external ids).
      if (fingerprints.has(`${j.source}|${j.title.toLowerCase()}|${j.company.toLowerCase()}`)) {
        result.skipped += 1;
        continue;
      }
      result.inserted += 1;
      fingerprints.add(`${j.source}|${j.title.toLowerCase()}|${j.company.toLowerCase()}`);
    }

    upsertRows.push({
      id: `job_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`,
      title: j.title,
      company: j.company,
      location: j.location,
      category: j.category,
      employmentType: j.employmentType,
      description: j.description,
      applyUrl: j.applyUrl,
      source: j.source,
      sourceName: j.sourceName,
      sourceUrl: j.sourceUrl,
      externalId: j.externalId,
      // `::text::jsonb` (lib/db/jsonb.ts) — a bare array here is stored as a
      // JSON *string*, so `jsonb_array_length(corroborated_sources)` throws and
      // containment queries (`@> '["ajira"]'`) match nothing on a row that
      // plainly holds the source keys.
      corroboratedSources: jsonbParam(corroboratingSources(j, corroboration)),
      status: "published",
      applicationDeadline: j.applicationDeadline ?? null,
      // The source's own posting date and pay facts. Until these were written,
      // `postedAt` was computed by eleven adapters and dropped here, and the
      // feed reported `createdAt` (ingestion) under the label "Imepostiwa".
      postedAt: j.postedAt ?? null,
      salaryMin: j.salaryMin ?? null,
      salaryMax: j.salaryMax ?? null,
      salaryCurrency: j.salaryCurrency ?? "",
      salaryPeriod: j.salaryPeriod ?? "",
      salaryText: j.salaryText ?? "",
      jobLevel: j.jobLevel ?? "",
      lastVerifiedAt: now,
      featured: false,
    });
  }

  result.flagged = flaggedCount;

  // ── One batched upsert: inserts new rows, updates changed rows, revives
  //    expired-but-listed-again rows. ──
  if (upsertRows.length) {
    await db
      .insert(job)
      .values(upsertRows)
      .onConflictDoUpdate({
        target: [job.source, job.externalId],
        // The dedup unique index is partial (WHERE external_id <> '') — the
        // conflict target must match it exactly or Postgres rejects the upsert.
        targetWhere: sql`${job.externalId} <> ''`,
        set: {
          title: sql`excluded.title`, company: sql`excluded.company`,
          location: sql`excluded.location`, category: sql`excluded.category`,
          employmentType: sql`excluded.employment_type`, description: sql`excluded.description`,
          applyUrl: sql`excluded.apply_url`,
          applicationDeadline: sql`excluded.application_deadline`,
          corroboratedSources: sql`excluded.corroborated_sources`,
          // Refreshed from the source like everything else here: without these
          // the 806 rows already in the feed would keep a null posting date and
          // an empty salary forever, and only NEW listings would ever show them.
          postedAt: sql`excluded.posted_at`,
          salaryMin: sql`excluded.salary_min`,
          salaryMax: sql`excluded.salary_max`,
          salaryCurrency: sql`excluded.salary_currency`,
          salaryPeriod: sql`excluded.salary_period`,
          salaryText: sql`excluded.salary_text`,
          jobLevel: sql`excluded.job_level`,
          lastVerifiedAt: now, updatedAt: now,
          status: sql`CASE WHEN ${job.status} = 'expired' THEN 'published' ELSE ${job.status} END`,
        },
      });
  }

  // ── One batched touch for unchanged-but-live rows. ──
  if (touchIds.length) {
    await db
      .update(job)
      .set({ lastVerifiedAt: now, updatedAt: now })
      .where(inArray(job.id, touchIds));
  }

  result.expired = await expireJobs();
  return result;
}

// Re-export lifecycle helpers from their own module so callers have one entry.
export { expireJobs, markExpiringJobs, runLifecycle } from "./lifecycle";
