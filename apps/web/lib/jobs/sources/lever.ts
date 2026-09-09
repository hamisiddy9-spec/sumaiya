/**
 * Lever — keyless public ATS posting API. First-party postings from the
 * company's own Lever account (structured, legal).
 * https://api.lever.co/v0/postings/{company}?mode=json
 *
 * Company slugs are configured via LEVER_COMPANIES (comma-separated).
 * DISABLED by default (no slugs configured) — the public `leverdemo` board
 * only carries fictional demo postings, and anti-fabrication forbids
 * ingesting demo rows as real jobs. Set the env var to real company slugs
 * (e.g. the URL path of jobs.lever.co/{slug}) and the adapter lights up.
 */
import type { JobSourceAdapter, RawJob } from "./types";
import { fetchJson, str, companyName, employmentType } from "./shared";

const LEVER_COMPANIES_ENV = "LEVER_COMPANIES";

function companies(): string[] {
  const raw = process.env[LEVER_COMPANIES_ENV]?.trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
}

export const leverAdapter: JobSourceAdapter = {
  id: "lever",
  name: "Lever",
  enabled: () => companies().length > 0,
  async fetch(): Promise<RawJob[]> {
    const out: RawJob[] = [];
    for (const slug of companies()) {
      const data = await fetchJson(
        `https://api.lever.co/v0/postings/${encodeURIComponent(slug)}?mode=json`
      );
      const jobs: any[] = Array.isArray(data) ? data : [];
      for (const j of jobs) {
        const url = str(j.hostedUrl) || str(j.applyUrl);
        const externalId = str(j.id);
        if (!url || !externalId || !/^https?:\/\//i.test(url)) continue;
        const cats = j.categories && typeof j.categories === "object" ? (j.categories as any) : {};
        const loc = str(cats.location) || str(j.workplaceType ? `Remote (${j.workplaceType})` : "");
        out.push({
          title: str(j.text),
          company: companyName(j.company) || slug,
          location: loc || "Remote",
          category: str(cats.team) || str(cats.department),
          employmentType: employmentType(cats.commitment),
          description: str(j.descriptionPlain || j.description || ""),
          applyUrl: url,
          sourceUrl: url,
          externalId: `${slug}|${externalId}`,
          postedAt: typeof j.createdAt === "number" ? new Date(j.createdAt) : null,
          remote: /remote/i.test(loc) || /remote/i.test(str(j.workplaceType)),
        });
      }
    }
    return out;
  },
};
