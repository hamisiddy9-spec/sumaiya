/**
 * Arbeitnow — free keyless API, global jobs (remote + on-site).
 * https://www.arbeitnow.com/api/job-board-api
 */
import type { JobSourceAdapter, RawJob } from "./types";
import { fetchJson, str, firstTag, employmentType, globalSourceCap } from "./shared";

const ARBEITNOW_URL = "https://www.arbeitnow.com/api/job-board-api";

export const arbeitnowAdapter: JobSourceAdapter = {
  id: "arbeitnow",
  name: "Arbeitnow",
  enabled: () => true, // keyless
  maxPerSource: globalSourceCap, // global board — see shared.ts
  async fetch(): Promise<RawJob[]> {
    const data = await fetchJson(ARBEITNOW_URL);
    const jobs: any[] = data?.data ?? [];
    const out: RawJob[] = [];
    for (const j of jobs) {
      const slug = str(j.slug);
      const url = str(j.url) || (slug ? `https://www.arbeitnow.com/jobs/${slug}` : "");
      if (!url || !slug) continue;
      out.push({
        title: str(j.title),
        company: str(j.company_name),
        location: str(j.location),
        category: firstTag(j.tags),
        employmentType: employmentType(j.employment_type),
        description: str(j.description),
        applyUrl: url,
        sourceUrl: url,
        externalId: slug,
        remote: j.remote === true, // Arbeitnow carries on-site jobs too
      });
    }
    return out;
  },
};
