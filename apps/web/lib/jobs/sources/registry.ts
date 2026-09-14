/**
 * Job source registry — the single place the pipeline knows its sources.
 *
 * `runSources(adapters)` iterates a list of JobSourceAdapters, isolates each
 * one (try/catch), normalizes every raw job through the text.ts clean
 * pipeline into the canonical `NormalizedJob` shape, and reports per-source
 * outcomes. `runAllSources()` runs the built-in registry.
 *
 * Resilience contract:
 *   - disabled adapter (enabled() === false) → skipped silently, counted,
 *     and the run CONTINUES
 *   - throwing adapter (network/5xx/bad JSON) → logged, counted, and the
 *     run CONTINUES — a single source's failure can NEVER break ingest
 *   - normalization failures are per-job: a malformed job is dropped, not
 *     the whole source
 */
import type {
  JobSourceAdapter,
  NormalizedJob,
  RawJob,
  SourceRunReport,
} from "./types";
import { clean, cleanHtml } from "../text";
import { remotiveAdapter } from "./remotive";
import { jobicyAdapter } from "./jobicy";
import { arbeitnowAdapter } from "./arbeitnow";
import { remoteokAdapter } from "./remoteok";
import { himalayasAdapter } from "./himalayas";
import { greenhouseAdapter } from "./greenhouse";
import { leverAdapter } from "./lever";
import { smartrecruitersAdapter } from "./smartrecruiters";
import { adzunaAdapter } from "./adzuna";
import { joobleAdapter } from "./jooble";
import { usajobsAdapter } from "./usajobs";
import { careerjetAdapter } from "./careerjet";
import { talentAdapter } from "./talent";
import { jobwebTanzaniaAdapter } from "./jobwebtanzania";

/**
 * The built-in source list. Add a new source here (one file per source).
 *
 * Keyless sources (remotive … smartrecruiters) run whenever enabled() says
 * so; key-gated sources (adzuna, jooble, usajobs, careerjet, talent) return
 * enabled() === false until their env vars are set — ingest skips them
 * silently and still succeeds.
 */
export const JOB_SOURCE_REGISTRY: JobSourceAdapter[] = [
  remotiveAdapter,
  jobicyAdapter,
  arbeitnowAdapter,
  remoteokAdapter,
  himalayasAdapter,
  greenhouseAdapter,
  leverAdapter,
  smartrecruitersAdapter,
  adzunaAdapter,
  joobleAdapter,
  usajobsAdapter,
  careerjetAdapter,
  talentAdapter,
  // Regional. Listed last only because it is a single-country board — it is the
  // source that makes the feed usable for the users the product is built for.
  jobwebTanzaniaAdapter,
];

/**
 * Normalize a raw source job into the canonical shape through the text.ts
 * pipeline. The ONLY place raw → canonical happens.
 */
export function normalizeRawJob(adapter: JobSourceAdapter, raw: RawJob): NormalizedJob {
  const location = clean(raw.location, 200);
  return {
    title: clean(raw.title, 200),
    company: clean(raw.company, 200),
    // Location fallback: only claim "Remote" when the source marks it remote
    // (or the board is remote-only) — never fabricate a location.
    location: location || (raw.remote ? "Remote" : ""),
    category: clean(raw.category, 100),
    employmentType: raw.employmentType || "full-time",
    description: cleanHtml(raw.description),
    applyUrl: raw.applyUrl,
    source: adapter.id,
    sourceName: adapter.name,
    sourceUrl: raw.sourceUrl || raw.applyUrl,
    externalId: raw.externalId,
    applicationDeadline: raw.applicationDeadline ?? null,
    postedAt: raw.postedAt ?? null,
  };
}

/**
 * Run a list of adapters with full isolation. Returns canonical jobs plus a
 * per-source report (which ran, which were skipped, which failed).
 */
export async function runSources(
  adapters: JobSourceAdapter[]
): Promise<{ jobs: NormalizedJob[]; reports: SourceRunReport[] }> {
  const reports: SourceRunReport[] = [];
  const jobs: NormalizedJob[] = [];

  for (const adapter of adapters) {
    let enabled = false;
    try {
      enabled = adapter.enabled();
    } catch {
      enabled = false;
    }
    if (!enabled) {
      reports.push({
        source: adapter.id,
        name: adapter.name,
        ran: false,
        ok: false,
        count: 0,
        skipped: true,
      });
      console.log(`[jobs] source ${adapter.id} SKIPPED (disabled — key not configured?)`);
      continue;
    }

    try {
      const raw = await adapter.fetch();
      let okCount = 0;
      for (const r of raw) {
        try {
          jobs.push(normalizeRawJob(adapter, r));
          okCount += 1;
        } catch (e) {
          console.warn(
            `[jobs] source ${adapter.id} dropped a malformed job:`,
            e instanceof Error ? e.message : e
          );
        }
      }
      reports.push({
        source: adapter.id,
        name: adapter.name,
        ran: true,
        ok: true,
        count: okCount,
      });
      console.log(`[jobs] source ${adapter.id} ran: ${okCount} jobs`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      reports.push({
        source: adapter.id,
        name: adapter.name,
        ran: true,
        ok: false,
        count: 0,
        error: msg,
      });
      console.error(`[jobs] source ${adapter.id} FAILED: ${msg}`);
    }
  }

  return { jobs, reports };
}

/** Run the built-in registry. */
export async function runAllSources(): Promise<{
  jobs: NormalizedJob[];
  reports: SourceRunReport[];
}> {
  return runSources(JOB_SOURCE_REGISTRY);
}

/** Compact one-line summary of a run for logs/PR evidence. */
export function summarizeRun(reports: SourceRunReport[]): string {
  const ran = reports.filter((r) => r.ran && r.ok);
  const skipped = reports.filter((r) => r.skipped);
  const failed = reports.filter((r) => r.ran && !r.ok);
  const total = ran.reduce((n, r) => n + r.count, 0);
  return [
    `ran=${ran.length} (${total} jobs)`,
    `skipped=${skipped.length}`,
    `failed=${failed.length}`,
    ...(failed.length ? [`failedSources=[${failed.map((f) => f.source).join(", ")}]`] : []),
  ].join(" ");
}
