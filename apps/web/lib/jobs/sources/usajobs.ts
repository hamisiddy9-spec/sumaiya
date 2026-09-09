/**
 * USAJOBS — official US government job search API (free, public data).
 * https://developer.usajobs.gov/
 * Requires: USAJOBS_API_KEY (registration: developer.usajobs.gov) +
 *           USAJOBS_EMAIL (the registered email, sent as User-Agent).
 * Optional: USAJOBS_KEYWORD (default "engineer" — broad, non-market-specific).
 */
import type { JobSourceAdapter, RawJob } from "./types";
import { str } from "./shared";
import { cleanHtml } from "../text";

const USAJOBS_KEY_ENV = "USAJOBS_API_KEY";
const USAJOBS_EMAIL_ENV = "USAJOBS_EMAIL";
const USAJOBS_KEYWORD_ENV = "USAJOBS_KEYWORD";

export const usajobsAdapter: JobSourceAdapter = {
  id: "usajobs",
  name: "USAJOBS",
  enabled: () => Boolean(process.env[USAJOBS_KEY_ENV] && process.env[USAJOBS_EMAIL_ENV]),
  async fetch(): Promise<RawJob[]> {
    const keyword = (process.env[USAJOBS_KEYWORD_ENV] || "engineer").trim();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15_000);
    let data: any;
    try {
      const res = await fetch(
        `https://data.usajobs.gov/api/search?Keyword=${encodeURIComponent(keyword)}&ResultsPerPage=100&SortField=PositionTitle`,
        {
          headers: {
            Host: "data.usajobs.gov",
            "User-Agent": process.env[USAJOBS_EMAIL_ENV]!,
            Authorization: `Bearer ${process.env[USAJOBS_KEY_ENV]}`,
          },
          signal: controller.signal,
        }
      );
      if (!res.ok) throw new Error(`usajobs → HTTP ${res.status}`);
      data = await res.json();
    } finally {
      clearTimeout(timer);
    }
    const items: any[] = data?.SearchResult?.SearchResultItems ?? [];
    const out: RawJob[] = [];
    for (const item of items) {
      const d = item?.MatchedObjectDescriptor ?? {};
      const url = str(d.PositionURI);
      const externalId = str(d.PositionID);
      if (!url || !externalId || !/^https?:\/\//i.test(url)) continue;
      const loc = Array.isArray(d.PositionLocationDisplay)
        ? d.PositionLocationDisplay.map(String).join(", ")
        : str(d.PositionLocationDisplay);
      out.push({
        title: str(d.PositionTitle),
        company: "USAJOBS — " + (str(d.DepartmentName) || "U.S. Government"),
        location: loc,
        category: str(d.JobCategory?.Name) || "",
        employmentType: str(d.WorkSchedule).toLowerCase() || "full-time",
        // QualificationSummary is a real, official summary — never fabricated.
        description: cleanHtml(
          str(d.QualificationSummary) || str(d.UserArea?.Details?.JobSummary || "")
        ),
        applyUrl: url,
        sourceUrl: url,
        externalId,
        applicationDeadline: d.ApplicationCloseDate ? new Date(d.ApplicationCloseDate) : null,
        postedAt: d.PositionStartDate ? new Date(d.PositionStartDate) : null,
        remote: /remote|telework/i.test(loc),
      });
    }
    return out;
  },
};
