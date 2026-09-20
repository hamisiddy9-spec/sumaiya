/**
 * SEAM TEST — HTTP probes.
 *
 * Every probe records the REAL status line and body, because the assertion is
 * allowed to be about the status code and the row, never about the screen.
 * Nothing here throws on a non-2xx: a 400 is data.
 */

/** Base URL under test. `http://localhost:3010` by default so a dev server the
 *  user already has on :3000 is never disturbed. */
export const LOCAL_APP = process.env.SEAM_APP_URL || "http://localhost:3010";
export const LIVE_APP = process.env.SEAM_LIVE_URL || "https://sumaiya.app";

export async function probe(url, opts = {}) {
  const started = Date.now();
  try {
    const res = await fetch(url, { redirect: "manual", ...opts });
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      /* not JSON — that is itself the observation */
    }
    return {
      ok: true,
      status: res.status,
      location: res.headers.get("location"),
      contentType: res.headers.get("content-type"),
      cacheControl: res.headers.get("cache-control"),
      text,
      json,
      ms: Date.now() - started,
      url,
    };
  } catch (err) {
    return { ok: false, status: null, error: err.message, text: "", json: null, url, ms: Date.now() - started };
  }
}

export function jsonPost(body, headers = {}) {
  return {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  };
}

export function bearer(token) {
  return { authorization: `Bearer ${token}` };
}

/** `HTTP 200 · 41ms · {"ok":true}` — one line of observed truth. */
export function describe(res, chars = 160) {
  if (!res.ok) return `FETCH FAILED (${res.error}) after ${res.ms}ms`;
  const body = (res.json ? JSON.stringify(res.json) : res.text).replace(/\s+/g, " ").slice(0, chars);
  const loc = res.location ? ` → ${res.location}` : "";
  return `HTTP ${res.status}${loc} · ${res.ms}ms · ${body}`;
}

/** Count rows in a `{success,data:[...]}` or `[...]` shaped JSON body. */
export function dataArray(res) {
  if (!res.json) return null;
  if (Array.isArray(res.json)) return res.json;
  if (Array.isArray(res.json.data)) return res.json.data;
  if (Array.isArray(res.json.jobs)) return res.json.jobs;
  return null;
}
