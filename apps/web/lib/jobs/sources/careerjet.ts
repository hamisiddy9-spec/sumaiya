/**
 * Careerjet — global job search API.
 * https://www.careerjet.com/partners/api/
 * Requires: CAREERJET_API_KEY (registration: careerjet.com partners) +
 *           CAREERJET_AFFILIATE_ID (your affiliate id).
 * Optional: CAREERJET_LOCALE (default "en_GB").
 */
import type { JobSourceAdapter, RawJob } from "./types";
import { fetchJson, str, companyName, employmentType } from "./shared";
import { cleanHtml } from "../text";

const CAREERJET_KEY_ENV = "CAREERJET_API_KEY";
const CAREERJET_AFFID_ENV = "CAREERJET_AFFILIATE_ID";
const CAREERJET_LOCALE_ENV = "CAREERJET_LOCALE";

export const careerjetAdapter: JobSourceAdapter = {
  id: "careerjet",
  name: "Careerjet",
  enabled: () => Boolean(process.env[CAREERJET_KEY_ENV] && process.env[CAREERJET_AFFID_ENV]),
  async fetch(): Promise<RawJob[]> {
    const locale = (process.env[CAREERJET_LOCALE_ENV] || "en_GB").trim();
    const data = await fetchJson(
      `https://public.api.careerjet.net/search?api_key=${encodeURIComponent(process.env[CAREERJET_KEY_ENV]!)}` +
        `&affid=${encodeURIComponent(process.env[CAREERJET_AFFID_ENV]!)}` +
        `&locale_code=${encodeURIComponent(locale)}&keywords=engineer&page=1&pagesize=50`
    );
    const jobs: any[] = data?.jobs ?? [];
    const out: RawJob[] = [];
    for (const j of jobs) {
      const url = str(j.url);
      const externalId = str(j.id);
      if (!url || !externalId || !/^https?:\/\//i.test(url)) continue;
      const loc = Array.isArray(j.locations) ? j.locations.map(String).join(", ") : str(j.locations);
      out.push({
        title: str(j.title),
        company: companyName(j.company),
        location: loc,
        category: str(j.salary) ? `Salary: ${str(j.salary)}` : "", // CJ has no category; surface salary when present
        employmentType: employmentType(j.contract_type) || str(j.type).toLowerCase() || "full-time",
        description: cleanHtml(str(j.description)),
        applyUrl: url,
        sourceUrl: url,
        externalId,
        postedAt: j.date ? new Date(j.date) : null,
        remote: /remote|work from home/i.test(`${loc} ${str(j.description).slice(0, 300)}`),
      });
    }
    return out;
  },
};
