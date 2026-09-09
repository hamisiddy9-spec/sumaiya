/**
 * Himalayas — free keyless API, remote jobs.
 * https://himalayas.app/jobs/api  (OBJECT { jobs, totalCount, … }; limit caps at 20)
 */
import type { JobSourceAdapter, RawJob } from "./types";
import { fetchJson, str, firstTag, locationName, employmentType } from "./shared";

const HIMALAYAS_URL = "https://himalayas.app/jobs/api?limit=100&offset=0";

export const himalayasAdapter: JobSourceAdapter = {
  id: "himalayas",
  name: "Himalayas",
  enabled: () => true, // keyless
  async fetch(): Promise<RawJob[]> {
    const data = await fetchJson(HIMALAYAS_URL);
    const jobs: any[] = Array.isArray(data) ? data : (data?.jobs ?? []);
    const out: RawJob[] = [];
    for (const j of jobs) {
      const guid = str(j.guid);
      const url = str(j.applicationLink) || str(j.guid);
      if (!guid || !/^https?:\/\//i.test(url)) continue;
      const loc = Array.isArray(j.locationRestrictions)
        ? j.locationRestrictions.map(String).join(", ")
        : locationName(j.locationRestrictions);
      out.push({
        title: str(j.title),
        company: str(j.companyName),
        location: loc,
        category: firstTag(j.categories) || firstTag(j.parentCategories),
        employmentType: employmentType(j.employmentType),
        description: str(j.description || j.excerpt || ""),
        applyUrl: url,
        sourceUrl: str(j.guid) || url,
        externalId: guid,
        applicationDeadline:
          typeof j.expiryDate === "number" ? new Date(j.expiryDate * 1000) : null,
        remote: true, // Himalayas is a remote-only board
      });
    }
    return out;
  },
};
