/**
 * Jobicy — free keyless API, remote jobs, attribution required.
 * https://jobicy.com/api/v2/remote-jobs
 */
import type { JobSourceAdapter, RawJob } from "./types";
import { fetchJson, str, companyName, employmentType, globalSourceCap } from "./shared";

const JOBICY_URL = "https://jobicy.com/api/v2/remote-jobs?count=100";

export const jobicyAdapter: JobSourceAdapter = {
  id: "jobicy",
  name: "Jobicy",
  enabled: () => true, // keyless
  maxPerSource: globalSourceCap, // global remote board — see shared.ts
  async fetch(): Promise<RawJob[]> {
    const data = await fetchJson(JOBICY_URL);
    const jobs: any[] = data?.jobs ?? [];
    const out: RawJob[] = [];
    for (const j of jobs) {
      const url = str(j.url);
      const externalId = str(j.id);
      if (!url || !/^https?:\/\//i.test(url) || !externalId) continue;
      out.push({
        title: str(j.jobTitle),
        company: companyName(j.companyName),
        location: str(j.jobGeo),
        category: jobicyIndustry(j.jobIndustry),
        employmentType: employmentType(j.jobType),
        description: str(j.jobDescription || j.jobExcerpt || ""),
        applyUrl: url,
        sourceUrl: url,
        externalId,
        remote: true, // Jobicy is a remote-only board
      });
    }
    return out;
  },
};

function jobicyIndustry(raw: unknown): string {
  return Array.isArray(raw) ? raw.map(String).join(", ") : str(raw);
}
