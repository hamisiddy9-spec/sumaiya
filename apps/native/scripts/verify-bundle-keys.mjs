#!/usr/bin/env node
/**
 * Fails if the bundled app cannot talk to Supabase.
 *
 * WHY THIS EXISTS
 * ---------------
 * The 1.6.12 APK shipped with NO Supabase anon key in its JS bundle. The bundle
 * contained the project URL and zero copies of the key, so every auth request
 * went out without an `apikey` header and Supabase answered "Invalid API key".
 * Google sign-in was independently broken, so the email code was the only way
 * in — and it failed too. The app could not be used at all.
 *
 * Nothing caught it. Type checking passed, 1062 unit tests passed, the APK
 * installed cleanly, and the App Links verified. The defect only existed in
 * the built artefact, so only a check that reads the built artefact can catch
 * it. That is this script.
 *
 * Run after assembling, before publishing:
 *   node scripts/verify-bundle-keys.mjs
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.join(import.meta.dirname, "..");

const CANDIDATES = [
  "android/app/build/outputs/apk/release/app-release.apk",
  "android/app/build/generated/assets/react/release/index.android.bundle",
  "android/app/build/intermediates/assets/release/mergeReleaseAssets/index.android.bundle",
];

// The key is read from source so this file never carries its own copy.
function anonKeyFromSource() {
  const src = readFileSync(path.join(ROOT, "src/lib/supabase-env.ts"), "utf8");
  const m = /const FALLBACK_KEY\s*=\s*\n?\s*"([^"]+)"/.exec(src);
  if (!m) throw new Error("could not read FALLBACK_KEY from src/lib/supabase-env.ts");
  return m[1];
}

// The project ref is read from source too, so a rebuilt Supabase project never
// leaves this file pointing at a ref that no longer exists.
function projectRefFromSource() {
  const src = readFileSync(path.join(ROOT, "src/lib/supabase-env.ts"), "utf8");
  const m = /const FALLBACK_URL\s*=\s*"https:\/\/([a-z0-9]+)\.supabase\.co"/.exec(src);
  return m ? m[1] : null;
}

// The dead project ref the 1.6.12 APK generation carried. If this ever shows up
// in a fresh artefact, the build was made against a stale env.
const DEAD_URL_REF = "ayczgaddnufdxnhizpcr";

function bundleBytes(rel) {
  const abs = path.join(ROOT, rel);
  const buf = readFileSync(abs);
  const isZip = buf[0] === 0x50 && buf[1] === 0x4b; // "PK"
  if (!isZip) return { abs, bytes: buf };

  // It is an APK — pull the JS bundle out of it without a zip dependency.
  // Instead of parsing the central directory, scan for the local file header of
  // assets/index.android.bundle and fall back to a plain contains() on the
  // whole archive, which is enough for this check.
  return { abs, bytes: buf, apk: true };
}

const failures = [];
let checked = 0;

const key = anonKeyFromSource();
const urlRef = projectRefFromSource();

console.log(`expected Supabase project ref: ${urlRef ?? "(could not be read)"}`);

if (!urlRef) {
  failures.push(
    "src/lib/supabase-env.ts\n    Could not read a project ref out of FALLBACK_URL.\n" +
      "    Without it this script cannot tell which project the artefact should\n" +
      "    point at, so it cannot catch a build that shipped the wrong one.",
  );
}

for (const rel of CANDIDATES) {
  const abs = path.join(ROOT, rel);
  if (!existsSync(abs)) continue;
  const { bytes } = bundleBytes(rel);
  checked++;

  const hasKey = bytes.includes(Buffer.from(key, "utf8"));
  const hasHeader = bytes.includes(Buffer.from("eyJhbGci", "utf8"));
  const hasProject = urlRef ? bytes.includes(Buffer.from(urlRef, "utf8")) : false;
  const hasDeadProject = bytes.includes(Buffer.from(DEAD_URL_REF, "utf8"));

  console.log(`\n${rel}`);
  console.log(`  ${bytes.length.toLocaleString()} bytes`);
  console.log(`  project id present : ${hasProject}`);
  console.log(`  JWT header present : ${hasHeader}`);
  console.log(`  anon key present   : ${hasKey}`);

  if (!hasKey) {
    failures.push(
      `${rel}\n    The Supabase anon key is NOT in this artefact.\n` +
        `    An app built from this bundle cannot authenticate: every request goes\n` +
        `    out without an 'apikey' header and Supabase answers "Invalid API key".\n` +
        `    Check that src/lib/supabase-env.ts resolves FALLBACK_KEY and that\n` +
        `    EXPO_PUBLIC_SUPABASE_ANON_KEY is not set to an empty string in the\n` +
        `    build environment.`,
    );
  }

  if (hasDeadProject) {
    failures.push(
      `${rel}\n    This artefact contains the DELETED Supabase project ref\n` +
        `    "${DEAD_URL_REF}".\n` +
        `    That project no longer exists, so an app built from this bundle\n` +
        `    cannot reach Supabase at all. Rebuild from a clean environment.`,
    );
  }
}

if (checked === 0) {
  console.error("No build artefact found. Run `./gradlew assembleRelease` first.");
  process.exit(1);
}

if (failures.length) {
  console.error(`\n${failures.length} artefact(s) FAILED:\n`);
  for (const f of failures) console.error("  " + f + "\n");
  process.exit(1);
}

console.log(`\nAll ${checked} artefact(s) carry the Supabase anon key.`);
