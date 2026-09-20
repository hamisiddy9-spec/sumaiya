/**
 * SEAM TEST — what the DEPLOYED site is really running (the "deploy seam").
 *
 * ── THE MARKER RULE (learned by getting it wrong on the first run) ───────────
 * A marker for "is our fix deployed?" MUST come from OUR code. Symbols that the
 * dependency itself defines are worthless, because every bundle that contains
 * the library contains the symbol whether or not our code calls it:
 *
 *   "signInWithOAuth"  ← supabase-js's own method definition
 *                        (`async signInWithOAuth(e){…this._handleProviderSignIn…}`)
 *   "signInWithIdToken"← also a supabase-js method name
 *
 * An earlier version of this test asserted "the deployed bundle must NOT contain
 * signInWithOAuth" and reported FAIL. The reason was unsound: it was testing the
 * presence of supabase-js, not the absence of our OAuth call. The strings are
 * read out of `apps/web/lib/google-identity.ts` instead — a URL and a loader id
 * that exist nowhere but in this repository.
 *
 * The loader id (`google-identity-services`) is the strongest marker available:
 * it is a string this project invented, it appears in exactly one place in the
 * source, and it is created only when the GIS path actually runs.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const REPO = path.resolve(HERE, "..", "..", "..");

/** Derive the app-specific markers from the source that injects them. */
export function gisMarkers() {
  const src = fs.readFileSync(path.join(REPO, "apps", "web", "lib", "google-identity.ts"), "utf8");
  const url = /GOOGLE_GIS_SCRIPT_SRC\s*=\s*"([^"]+)"/.exec(src)?.[1] ?? null;
  // The loader <script> id the module creates — a string unique to this repo.
  const id = /script\.id\s*=\s*"([^"]+)"/.exec(src)?.[1] ?? /"([a-z0-9-]*google-identity-services[a-z0-9-]*)"/.exec(src)?.[1] ?? null;
  return { url, id, source: "apps/web/lib/google-identity.ts" };
}

function countIn(text, needle) {
  if (!needle) return 0;
  return text.split(needle).length - 1;
}

function contextAround(text, needle, span = 70) {
  const i = text.indexOf(needle);
  if (i < 0) return null;
  return text.slice(Math.max(0, i - span), i + needle.length + span);
}

/**
 * Fetch every JS chunk the live sign-in page references and count the markers.
 * Every fetched URL is returned so a human can reproduce the numbers exactly —
 * a count nobody can re-derive is not evidence.
 */
export async function deployedBundleScan({ liveUrl, secretNeedles = [] }) {
  const out = {
    pageStatus: null,
    scriptSrcs: [],
    chunks: [],
    bytes: 0,
    deploymentIds: [],
    markers: {},
    contexts: {},
    secretChecks: [],
    error: null,
  };
  try {
    const page = await fetch(`${liveUrl}/sign-in`, { redirect: "manual" });
    out.pageStatus = page.status;
    const html = await page.text();

    // HTML may percent-encode the parentheses/tilde that Next.js puts in chunk
    // paths; `new URL(...)` on the decoded value is what makes every chunk
    // reachable. (A crawl that skips one chunk can miss the only file that
    // carries the app's own marker.)
    const raw = [...new Set([...html.matchAll(/src="([^"]+\.js[^"]*)"/g)].map((m) => m[1]))];
    out.scriptSrcs = raw;

    const scanned = [];
    for (const src of raw) {
      const absolute = src.startsWith("http") ? src : `${liveUrl}${src}`;
      const res = await fetch(absolute, { redirect: "manual" });
      if (!res.ok) {
        scanned.push({ url: absolute, status: res.status, bytes: 0, text: "" });
        continue;
      }
      const text = await res.text();
      scanned.push({ url: absolute, status: res.status, bytes: text.length, text });
      const dpl = new URL(absolute).searchParams.get("dpl");
      if (dpl && !out.deploymentIds.includes(dpl)) out.deploymentIds.push(dpl);
    }

    const joined = scanned.map((c) => c.text).join("\n");
    out.bytes = joined.length;
    out.chunks = scanned.map((c) => ({ url: c.url, status: c.status, bytes: c.bytes }));

    const markers = gisMarkers();
    out.markers = {
      gisUrl: { needle: markers.url, count: countIn(joined, markers.url), from: markers.source },
      gisLoaderId: { needle: markers.id, count: countIn(joined, markers.id), from: markers.source },
      // Library symbols — recorded ONLY to show why they cannot be used.
      supabaseMethodSignInWithOAuth: { needle: "signInWithOAuth", count: countIn(joined, "signInWithOAuth"), library: "supabase-js" },
      supabaseMethodSignInWithIdToken: { needle: "signInWithIdToken", count: countIn(joined, "signInWithIdToken"), library: "supabase-js" },
    };

    for (const [key, needle] of [
      ["gisUrl", markers.url],
      ["gisLoaderId", markers.id],
      ["supabaseMethodSignInWithOAuth", "signInWithOAuth"],
    ]) {
      const hit = scanned.find((c) => c.text && c.text.includes(needle));
      out.contexts[key] = hit
        ? { chunk: hit.url.split("/").slice(-1)[0].split("?")[0], snippet: contextAround(hit.text, needle) }
        : null;
    }

    // Secret boundary: counts only. A secret's VALUE never leaves this function,
    // and this proves two things at once — that the scan really is reading the
    // compiled bundle (the public key MUST be inlined there) and that the
    // service_role key is not (it must never reach a browser).
    out.secretChecks = secretNeedles.map(({ label, value }) => ({
      label,
      count: value ? countIn(joined, value) : 0,
      measurable: Boolean(value),
    }));
  } catch (err) {
    out.error = err.message;
  }
  return out;
}
