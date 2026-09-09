/**
 * SmartRecruiters — keyless public ATS posting API. First-party postings
 * from the company's own SmartRecruiters account.
 * https://api.smartrecruiters.com/v1/companies/{company}/postings
 *
 * Company identifiers configured via SMARTRECRUITERS_COMPANIES
 * (comma-separated). Defaults to a live public board; set the env var to
 * your own list.
 */
import type { JobSourceAdapter, RawJob } from "./types";
import { fetchJson, str, companyName, employmentType } from "./shared";
import { cleanHtml } from "../text";

const SR_COMPANIES_ENV = "SMARTRECRUITERS_COMPANIES";
const DEFAULT_COMPANIES = ["Hootsuite"];

function companies(): string[] {
  const raw = process.env[SR_COMPANIES_ENV]?.trim();
  if (!raw) return DEFAULT_COMPANIES;
  return raw
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
}

export const smartrecruitersAdapter: JobSourceAdapter = {
  id: "smartrecruiters",
  name: "SmartRecruiters",
  enabled: () => companies().length > 0,
  async fetch(): Promise<RawJob[]> {
    const out: RawJob[] = [];
    for (const company of companies()) {
      const data = await fetchJson(
        `https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(company)}/postings?limit=100`
      );
      const jobs: any[] = data?.content ?? [];
      for (const j of jobs) {
        const externalId = str(j.id);
        if (!externalId) continue;
        const url = str(j.ref) || str(j.url);
        if (!url || !/^https?:\/\//i.test(url)) continue;
        const loc =
          typeof j.location === "object" && j.location
            ? [str((j.location as any).city), str((j.location as any).country)]
                .filter(Boolean)
                .join(", ")
            : "";
        out.push({
          title: str(j.name),
          company: companyName(j.company) || company,
          location: loc,
          category: str(j.department),
          employmentType: employmentType(j.typeOfEmployment),
          description: cleanHtml(str(j.jobDescription)),
          applyUrl: url,
          sourceUrl: url,
          externalId: `${company}|${externalId}`,
          postedAt: j.releasedDate ? new Date(j.releasedDate) : null,
          remote: /remote|home|tele/i.test(loc) || /remote|home|tele/i.test(str(j.workplace)),
        });
      }
    }
    return out;
  },
};
