/**
 * SEAM TEST — environment loading.
 *
 * Secrets live OUTSIDE the repo, in `C:/Users/hamis/projects/_hdd-data/env/`
 * (one file per service). This module reads them at runtime and never prints a
 * value: `redactTarget()` is the only formatter that may be used on a URL, and
 * `describeEnv()` reports presence/absence only.
 *
 * Why read from files at runtime rather than a checked-in .env: a value being
 * PRESENT in an environment tells you nothing about whether it is non-empty —
 * an empty `NEXT_PUBLIC_SUPABASE_URL` once 500'd every authed route. So the
 * seam test distinguishes "missing" from "present but empty" and says which.
 */
import fs from "node:fs";
import path from "node:path";

export const ENV_DIR =
  process.env.SEAM_ENV_DIR || "C:/Users/hamis/projects/_hdd-data/env";

/** Parse every `KEY=value` line in the secrets directory. Never logs values. */
export function loadSecrets() {
  const out = {};
  let files = [];
  try {
    files = fs.readdirSync(ENV_DIR).filter((f) => f.endsWith(".env"));
  } catch (err) {
    return { values: out, files, error: `cannot read ${ENV_DIR}: ${err.message}` };
  }
  for (const f of files) {
    let text = "";
    try {
      text = fs.readFileSync(path.join(ENV_DIR, f), "utf8");
    } catch {
      continue;
    }
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (!m) continue;
      const value = m[2].replace(/^["']|["']$/g, "");
      if (value !== "") out[m[1]] = value;
    }
  }
  return { values: out, files };
}

/**
 * Resolve a variable from the process environment first (so a CI/seam runner can
 * override), then from the secrets files. Returns null when absent.
 */
export function resolve(name, secrets) {
  const fromProcess = process.env[name];
  if (fromProcess && fromProcess.trim() !== "") return fromProcess.trim();
  const fromFile = secrets?.values?.[name];
  return fromFile && fromFile !== "" ? fromFile : null;
}

/**
 * The four values that must all point at the SAME world. A mismatch here fails
 * silently, so the seam test states each one's presence explicitly.
 */
export const REQUIRED = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "DATABASE_URL",
];

/** Optional but needed for the full journey (test-user creation). */
export const OPTIONAL = ["SUPABASE_SERVICE_ROLE_KEY"];

/** Never print a password out of a connection string. */
export function redactTarget(url) {
  if (!url) return "(none)";
  try {
    const u = new URL(url);
    if (u.password) u.password = "<redacted>";
    return u.toString();
  } catch {
    return url.replace(/(:\/\/[^:]+:)[^@]+@/, "$1<redacted>@");
  }
}

/** The Supabase project ref embedded in a URL, e.g. `duywnmibgiqulqzunsmh`. */
export function projectRef(supabaseUrl) {
  const m = /^https?:\/\/([a-z0-9]+)\.supabase\.(co|in)/.exec(supabaseUrl || "");
  return m ? m[1] : null;
}

/**
 * Facts the live product has been burned by, asserted against whatever the run
 * is pointed at. Deaths and stale refs must never come back.
 */
export const DEAD_PROJECT_REFS = ["ayczgaddnufdxnhizpcr"];
export const STALE_PROJECT_REFS = ["fskokfnunjlrvxspkftx"];
export const LIVE_PROJECT_REF = "duywnmibgiqulqzunsmh";
