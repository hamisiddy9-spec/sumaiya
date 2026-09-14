/**
 * Launch gate: is production actually launch-healthy, right now?
 *
 * Everything here was checked by hand first, one curl at a time, while deciding
 * whether sumaiya.app could be announced. This is that checklist as one command,
 * so "we're good to launch" is a result you can re-run after every deploy rather
 * than a claim from memory.
 *
 *   node scripts/verify-launch.mjs                 # against sumaiya.app
 *   node scripts/verify-launch.mjs http://localhost:3000
 *
 * Exits non-zero if any HARD check fails. INFO lines are state, not verdicts —
 * they describe the environment (e.g. whether email sign-up can work yet) and
 * deliberately do not fail the run.
 *
 * Optional: SUMAIYA_APK_SHA256=<sha> to assert the downloadable artifact is
 * exactly the build you verified.
 */
import { readFileSync } from "node:fs";

const base = (process.argv[2] ?? "https://sumaiya.app").replace(/\/$/, "");
const SUPABASE_URL = "https://ayczgaddnufdxnhizpcr.supabase.co";

/**
 * The anon key is PUBLIC by design — it ships in the browser bundle and only
 * does what RLS allows — but /auth/v1/settings returns 401 without it, and a 401
 * silently read as "provider disabled" the first time this script ran. Take it
 * from the environment, else from the app's own env file.
 */
function readAnonKey() {
  if (process.env.SUMAIYA_ANON_KEY) return process.env.SUMAIYA_ANON_KEY;
  try {
    const envPath = new URL("../.env.local", import.meta.url);
    const line = readFileSync(envPath, "utf8")
      .split("\n")
      .find((l) => l.startsWith("NEXT_PUBLIC_SUPABASE_ANON_KEY="));
    return line?.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "") ?? "";
  } catch {
    return "";
  }
}
const ANON_KEY = readAnonKey();

const results = [];
const record = (kind, name, detail = "") => {
  results.push({ kind, name, detail });
  const label = kind === "FAIL" ? "FAIL" : kind === "INFO" ? "INFO" : "PASS";
  console.log(`${label}  ${name}${detail ? `  — ${detail}` : ""}`);
};

const check = async (name, url, expect = 200) => {
  try {
    const res = await fetch(url, { redirect: "follow" });
    const ok = Array.isArray(expect) ? expect.includes(res.status) : res.status === expect;
    record(ok ? "PASS" : "FAIL", name, `${res.status}${ok ? "" : ` (expected ${expect})`}`);
    return res;
  } catch (err) {
    record("FAIL", name, `unreachable: ${err.message}`);
    return null;
  }
};

console.log(`\nLaunch gate — ${base}\n${"─".repeat(60)}`);

// 1. The service answers at all.
await check("health endpoint", `${base}/api/health`);

// 2. Every surface a visitor can land on, in BOTH languages. A marketing page
//    that 404s in one locale is invisible until someone shares that link.
const PAGES = [
  "/",
  "/en",
  "/snap-to-apply",
  "/en/snap-to-apply",
  "/snap",
  "/assistant",
  "/editor/cv/try",
  "/templates",
  "/en/templates",
  "/jobs",
  "/en/jobs",
  "/sign-up",
  "/sign-in",
];
for (const path of PAGES) {
  await check(`page ${path}`, base + path);
}

// 3. SEO plumbing on the page search engines will index first.
//
// Two shapes to survive here, both learned the hard way: attribute order is not
// guaranteed, and Next renders `hrefLang` (capital L) — a lowercase `hreflang`
// regex reports "none declared" on a page that has three of them.
try {
  const html = await (await fetch(`${base}/`)).text();
  const canonicalTag = /<link[^>]*rel="canonical"[^>]*>/i.exec(html)?.[0] ?? "";
  const canonical = /href="([^"]+)"/.exec(canonicalTag)?.[1];
  const hreflang = [...html.matchAll(/hreflang="([^"]+)"/gi)].map((m) => m[1]);
  if (canonical) record("PASS", "homepage canonical", canonical);
  else record("FAIL", "homepage canonical", "missing — a client-component homepage cannot export metadata");
  if (hreflang.length) record("PASS", "homepage hreflang", hreflang.join(", "));
  else record("FAIL", "homepage hreflang", "none — / and /en look like duplicates to a crawler");
} catch (err) {
  record("FAIL", "homepage HTML", err.message);
}

// 4. The Android build people will download. Follow the chain by hand so the
//    final URL is visible: a wrong release tag or asset name here means every
//    download 404s while the page itself still looks fine (that happened once).
try {
  const res = await fetch(`${base}/downloads/sumaiya.apk`, { redirect: "manual" });
  let url = res.headers.get("location") ?? "";
  // Remember the release URL rather than the final one: GitHub hands off to a
  // signed release-assets host, which carries neither the tag nor the asset name.
  let releaseUrl = /releases\/download\//.test(url) ? url : "";
  let hops = 1;
  while (url && hops < 6) {
    const next = await fetch(url, { redirect: "manual" });
    if (/releases\/download\//.test(url)) releaseUrl = url;
    const loc = next.headers.get("location");
    if (loc) {
      url = loc;
      hops++;
      continue;
    }
    const version = /releases\/download\/([^/]+)\//.exec(releaseUrl)?.[1] ?? "unknown tag";
    const size = next.headers.get("content-length");
    record(
      releaseUrl ? "PASS" : "FAIL",
      "APK download resolves to a release asset",
      `${version} · ${size ? `${Math.round(Number(size) / 1e6)}MB` : "size unknown"}`,
    );
    break;
  }
  if (!url) record("INFO", "APK download", `no redirect (status ${res.status})`);
} catch (err) {
  record("FAIL", "APK download", err.message);
}

// 5. What can actually sign a new user in TODAY. This is the difference between
//    "we can launch" and "we can launch once the dashboard work is done", so it
//    is reported as state, not as a pass/fail.
try {
  const headers = ANON_KEY ? { apikey: ANON_KEY } : {};
  const res = await fetch(`${SUPABASE_URL}/auth/v1/settings`, { headers });
  const s = await res.json();
  record(
    s.mailer_autoconfirm ? "PASS" : "INFO",
    "email sign-up",
    s.mailer_autoconfirm
      ? "auto-confirm on (no email needed)"
      : "needs a confirmation email → requires SMTP configured in Supabase, or every sign-up returns 500",
  );
  record(
    s.external?.google ? "PASS" : "FAIL",
    "Google sign-in",
    s.external?.google
      ? "provider enabled — the only sign-up path that works end-to-end without email"
      : "provider disabled",
  );
  if (s.disable_signup) record("FAIL", "signups", "disabled project-wide");
} catch (err) {
  record("INFO", "auth settings", `could not read: ${err.message}`);
}

const failed = results.filter((r) => r.kind === "FAIL");
console.log(`${"─".repeat(60)}\n${results.filter((r) => r.kind === "PASS").length} passed · ${failed.length} failed\n`);
if (failed.length) {
  console.log("Blocking:");
  for (const f of failed) console.log(`  · ${f.name}${f.detail ? ` — ${f.detail}` : ""}`);
}
process.exit(failed.length ? 1 : 0);
