/**
 * Remotive — free keyless API, global remote jobs.
 * https://remotive.com/api-documentation
 */
import type { JobSourceAdapter, RawJob } from "./types";
import { fetchJson, str, companyName, employmentType } from "./shared";

const REMOTIVE_URL = "https://remotive.com/api/remote-jobs";

export const remotiveAdapter: JobSourceAdapter = {
  id: "remotive",
  name: "Remotive",
  enabled: () => true, // keyless
  async fetch(): Promise<RawJob[]> {
    const data = await fetchJson(REMOTIVE_URL);
    const jobs: any[] = data?.jobs ?? [];
    const out: RawJob[] = [];
    for (const j of jobs) {
      const url = str(j.url);
      const externalId = str(j.id);
      if (!url || !/^https?:\/\//i.test(url) || !externalId) continue;
      out.push({
        title: str(j.title),
        company: companyName(j.company_name),
        location: str(j.candidate_required_location),
        category: str(j.category),
        employmentType: employmentType(j.job_type),
        description: str(j.description),
        applyUrl: url,
        sourceUrl: url,
        externalId,
        remote: true, // Remotive is a remote-only board
      });
    }
    return out;
  },
};
