/**
 * RemoteOK — free keyless API, remote jobs.
 * https://remoteok.com/api  (array; may LEAD with a meta/status object)
 */
import type { JobSourceAdapter, RawJob } from "./types";
import { fetchJson, str, firstTag } from "./shared";

const REMOTEOK_URL = "https://remoteok.com/api";

export const remoteokAdapter: JobSourceAdapter = {
  id: "remoteok",
  name: "RemoteOK",
  enabled: () => true, // keyless
  async fetch(): Promise<RawJob[]> {
    const data = await fetchJson(REMOTEOK_URL);
    const jobs: any[] = Array.isArray(data) ? data : [];
    const out: RawJob[] = [];
    for (const j of jobs) {
      // The API sometimes leads with a status/meta object — require job fields.
      const position = str(j.position);
      const externalId = str(j.id);
      if (!position || !externalId) continue;
      const url = str(j.apply_url) || str(j.url);
      if (!/^https?:\/\//i.test(url)) continue;
      out.push({
        title: str(position),
        company: str(j.company),
        location: str(j.location),
        category: firstTag(j.tags),
        employmentType: "full-time", // RemoteOK does not expose a type
        description: str(j.description),
        applyUrl: url,
        sourceUrl: str(j.url) || url,
        externalId,
        remote: true, // RemoteOK is a remote-only board
      });
    }
    return out;
  },
};
