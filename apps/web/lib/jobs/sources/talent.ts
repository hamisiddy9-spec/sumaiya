/**
 * Talent.com — global job search API.
 * https://www.talent.com/en/partners/api
 * Requires: TALENT_PUBLISHER_ID + TALENT_API_KEY (registration: talent.com)
 * Optional: TALENT_QUERY (default "software engineer").
 */
import type { JobSourceAdapter, RawJob } from "./types";
import { fetchJson, str, companyName, employmentType } from "./shared";
import { cleanHtml } from "../text";

const TALENT_PUBLISHER_ENV = "TALENT_PUBLISHER_ID";
const TALENT_KEY_ENV = "TALENT_API_KEY";
const TALENT_QUERY_ENV = "TALENT_QUERY";

export const talentAdapter: JobSourceAdapter = {
  id: "talent",
  name: "Talent.com",
  enabled: () => Boolean(process.env[TALENT_PUBLISHER_ENV] && process.env[TALENT_KEY_ENV]),
  async fetch(): Promise<RawJob[]> {
    const query = (process.env[TALENT_QUERY_ENV] || "software engineer").trim();
    const data = await fetchJson(
      `https://api.talent.com/v4/public-jobs` +
        `?publisher_id=${encodeURIComponent(process.env[TALENT_PUBLISHER_ENV]!)}` +
        `&api_key=${encodeURIComponent(process.env[TALENT_KEY_ENV]!)}` +
        `&query=${encodeURIComponent(query)}&limit=50`
    );
    const jobs: any[] = data?.results ?? [];
    const out: RawJob[] = [];
    for (const j of jobs) {
      const url = str(j.url);
      const externalId = str(j.id);
      if (!url || !externalId || !/^https?:\/\//i.test(url)) continue;
      const loc =
        typeof j.location === "object" && j.location
          ? [str((j.location as any).city), str((j.location as any).country)]
              .filter(Boolean)
              .join(", ")
          : str(j.location);
      const salary =
        typeof j.salary === "object" && j.salary
          ? [str((j.salary as any).min), str((j.salary as any).max)].filter(Boolean).join(" - ")
          : "";
      out.push({
        title: str(j.title),
        company: companyName(j.company),
        location: loc,
        category: str(j.job_category) || (salary ? `Salary: ${salary}` : ""),
        employmentType: employmentType(j.employment_type) || str(j.job_type).toLowerCase(),
        description: cleanHtml(str(j.description)),
        applyUrl: url,
        sourceUrl: url,
        externalId,
        postedAt: j.published_at ? new Date(j.published_at) : null,
        remote: /remote|work from home|fully remote/i.test(
          `${loc} ${str(j.workplace_type)} ${str(j.description).slice(0, 300)}`
        ),
      });
    }
    return out;
  },
};
