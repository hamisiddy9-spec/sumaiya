/**
 * Adzuna — global job search API with a generous free tier.
 * https://developer.adzuna.com/
 * Requires: ADZUNA_APP_ID + ADZUNA_API_KEY (registration: developer.adzuna.com)
 * Optional: ADZUNA_COUNTRY (default "us"; "gb", "de", "in", "ng"… supported)
 * Free tier: generous daily quota; we fetch a bounded page (50 results).
 */
import type { JobSourceAdapter, RawJob } from "./types";
import { fetchJson, str, companyName, employmentType, salaryNum, dateOrNull } from "./shared";
import { cleanHtml } from "../text";

const ADZUNA_APP_ID_ENV = "ADZUNA_APP_ID";
const ADZUNA_KEY_ENV = "ADZUNA_API_KEY";
const ADZUNA_COUNTRY_ENV = "ADZUNA_COUNTRY";

export const adzunaAdapter: JobSourceAdapter = {
  id: "adzuna",
  name: "Adzuna",
  enabled: () => Boolean(process.env[ADZUNA_APP_ID_ENV] && process.env[ADZUNA_KEY_ENV]),
  async fetch(): Promise<RawJob[]> {
    const country = (process.env[ADZUNA_COUNTRY_ENV] || "us").trim();
    const appId = process.env[ADZUNA_APP_ID_ENV]!;
    const key = process.env[ADZUNA_KEY_ENV]!;
    const data = await fetchJson(
      `https://api.adzuna.com/v1/api/jobs/${encodeURIComponent(country)}/search/1` +
        `?app_id=${encodeURIComponent(appId)}&app_key=${encodeURIComponent(key)}` +
        `&results_per_page=50&content_type=application/json`
    );
    const jobs: any[] = data?.results ?? [];
    const out: RawJob[] = [];
    for (const j of jobs) {
      const url = str(j.redirect_url);
      const externalId = str(j.id);
      if (!url || !externalId || !/^https?:\/\//i.test(url)) continue;
      const loc =
        Array.isArray(j.location?.area) ? j.location.area.map(String).join(", ")
        : typeof j.location === "object" && j.location ? str((j.location as any).display_name)
        : str(j.location);
      out.push({
        title: str(j.title),
        company: companyName(j.company),
        location: loc,
        category: str(j.category?.label),
        employmentType: employmentType(j.contract_type),
        description: cleanHtml(str(j.description)),
        applyUrl: url,
        sourceUrl: url,
        externalId,
        postedAt: dateOrNull(j.created),
        // Adzuna returns `salary_is_predicted: "1"` when the figure is THEIR
        // model's estimate rather than the employer's. An estimate printed as a
        // salary on a screen where someone decides whether to apply is a
        // fabricated number, so a predicted figure is dropped entirely.
        ...(str(j.salary_is_predicted) === "1"
          ? {}
          : {
              salaryMin: salaryNum(j.salary_min),
              salaryMax: salaryNum(j.salary_max),
              salaryPeriod: "year", // Adzuna annualises the range it returns
            }),
        remote: /remote|work from home/i.test(`${loc} ${str(j.description).slice(0, 300)}`),
      });
    }
    return out;
  },
};
