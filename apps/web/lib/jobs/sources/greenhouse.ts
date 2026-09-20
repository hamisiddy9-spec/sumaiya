/**
 * Greenhouse — keyless public ATS board API. First-party postings from the
 * company's own applicant tracking system (high-quality, structured, legal).
 * https://docs.greenhouse.io/board-api.html
 *
 * One board per company token. Which boards to ingest is configured via
 * GREENHOUSE_BOARDS (comma-separated tokens). Defaults to a few live public
 * boards; set the env var to your own list.
 */
import type { JobSourceAdapter, RawJob } from "./types";
import { fetchJson, str, companyName, employmentType, globalSourceCap } from "./shared";
import { cleanHtml } from "../text";

const GREENHOUSE_BOARDS_ENV = "GREENHOUSE_BOARDS";
const DEFAULT_BOARDS = ["affirm", "airbnb", "duolingo"];

function boards(): string[] {
  const raw = process.env[GREENHOUSE_BOARDS_ENV]?.trim();
  if (!raw) return DEFAULT_BOARDS;
  return raw
    .split(",")
    .map((b) => b.trim())
    .filter(Boolean);
}

export const greenhouseAdapter: JobSourceAdapter = {
  id: "greenhouse",
  name: "Greenhouse",
  enabled: () => boards().length > 0, // keyless — always on unless list emptied
  maxPerSource: globalSourceCap, // global ATS boards — see shared.ts
  async fetch(): Promise<RawJob[]> {
    const out: RawJob[] = [];
    for (const board of boards()) {
      // content=true brings the full HTML JD — no enrichment needed later.
      const data = await fetchJson(
        `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(board)}/jobs?content=true`
      );
      const jobs: any[] = data?.jobs ?? [];
      for (const j of jobs) {
        const url = str(j.absolute_url);
        const externalId = str(j.id);
        if (!url || !externalId || !/^https?:\/\//i.test(url)) continue;
        const location =
          typeof j.location === "object" && j.location ? str((j.location as any).name) : "";
        out.push({
          title: str(j.title),
          company: companyName(j.company_name) || board,
          location,
          category: "",
          employmentType: employmentType(j.employment_type),
          description: cleanHtml(str(j.content)),
          applyUrl: url,
          sourceUrl: url,
          externalId: `${board}|${externalId}`,
          postedAt: j.updated_at ? new Date(j.updated_at) : null,
        });
      }
    }
    return out;
  },
};
