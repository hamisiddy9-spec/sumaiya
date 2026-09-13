/**
 * Jooble — global job search API.
 * https://jooble.org/api/about
 * Requires: JOOBLE_API_KEY (registration: jooble.org, free tier)
 * The API is a POST to https://jooble.org/api/{key} with a JSON query.
 */
import type { JobSourceAdapter, RawJob } from "./types";
import { str, companyName } from "./shared";
import { cleanHtml } from "../text";

const JOOBLE_KEY_ENV = "JOOBLE_API_KEY";

export const joobleAdapter: JobSourceAdapter = {
  id: "jooble",
  name: "Jooble",
  enabled: () => Boolean(process.env[JOOBLE_KEY_ENV]),
  async fetch(): Promise<RawJob[]> {
    const key = process.env[JOOBLE_KEY_ENV]!;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15_000);
    let data: any;
    try {
      const res = await fetch(`https://jooble.org/api/${encodeURIComponent(key)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "User-Agent": "Sumaiya-Jobs-Ingest/1.0 (+https://sumaiya.app)" },
        body: JSON.stringify({ keywords: "developer", location: "" }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`jooble → HTTP ${res.status}`);
      data = await res.json();
    } finally {
      clearTimeout(timer);
    }
    const jobs: any[] = data?.jobs ?? [];
    const out: RawJob[] = [];
    for (const j of jobs) {
      const url = str(j.link);
      const externalId = str(j.id);
      if (!url || !externalId || !/^https?:\/\//i.test(url)) continue;
      out.push({
        title: str(j.title),
        company: companyName(j.company),
        location: str(j.location),
        category: "",
        employmentType: str(j.type).toLowerCase() || "full-time",
        description: cleanHtml(str(j.snippet)),
        applyUrl: url,
        sourceUrl: url,
        externalId,
        postedAt: j.updated ? new Date(j.updated) : null,
        remote: /remote|work from home/i.test(`${str(j.location)} ${str(j.snippet).slice(0, 300)}`),
      });
    }
    return out;
  },
};
