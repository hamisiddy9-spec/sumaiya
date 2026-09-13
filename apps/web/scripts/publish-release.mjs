#!/usr/bin/env node
/**
 * Publish a native build to users — the ONLY way a release reaches anyone.
 *
 * The updater manifest is served from the `app_release` table. An APK sitting
 * on GitHub does nothing on its own: uploading a file must never be able to
 * interrupt every user mid-task, which is exactly what "GitHub latest = live"
 * used to do. Nothing here runs automatically.
 *
 *   # publish a build whose APK is already hosted
 *   node --env-file=.env.local scripts/publish-release.mjs \
 *     --version 1.6.9 --url https://.../sumaiya.apk \
 *     --notes-sw "..." --notes-en "..."
 *
 *   # or host the APK on the releases repo as part of publishing
 *   node --env-file=.env.local scripts/publish-release.mjs \
 *     --version 1.6.9 --apk apps/native/android/app/build/outputs/apk/release/sumaiya.apk \
 *     --notes-sw "..." --notes-en "..."
 *
 *   # see what users are being offered right now
 *   node --env-file=.env.local scripts/publish-release.mjs --status
 */

import postgres from "postgres";
import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";

const REPO = "hamisiddy9-spec/sumaiya-releases";
const CHANNELS = new Set(["stable", "test"]);

function parseArgs(argv) {
  const out = { channel: "stable" };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const key = a.slice(2);
    if (key === "status") {
      out.status = true;
      continue;
    }
    const value = argv[i + 1];
    if (value === undefined || value.startsWith("--")) {
      console.error(`❌ --${key} needs a value`);
      process.exit(1);
    }
    out[key.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = value;
    i++;
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("❌ DATABASE_URL environment variable is required");
  process.exit(1);
}

const sql = postgres(url, { ssl: "require", prepare: false });

const VERSION_RE = /^\d+\.\d+\.\d+$/;

try {
  if (args.status) {
    const rows = await sql`
      select version, channel, apk_url, published_at
      from app_release
      order by published_at desc
      limit 10
    `;
    if (!rows.length) {
      console.log("Nothing published yet — the updater is serving the checked-in APP_RELEASE constant (no user is prompted for anything new).");
    } else {
      console.log("Published releases (newest first):");
      for (const r of rows) {
        console.log(`  ${r.version}  [${r.channel}]  ${r.published_at.toISOString()}  ${r.apk_url}`);
      }
    }
    process.exit(0);
  }

  const { version, notesSw = "", notesEn = "" } = args;
  if (!version || !VERSION_RE.test(version)) {
    console.error("❌ --version must look like 1.6.9");
    process.exit(1);
  }
  if (!CHANNELS.has(args.channel)) {
    console.error(`❌ --channel must be one of: ${[...CHANNELS].join(", ")}`);
    process.exit(1);
  }

  // ── Optional: host the APK as part of publishing ─────────────────────────
  let apkUrl = args.url;
  let sizeBytes = args.size ? Number(args.size) : null;
  if (args.apk) {
    const apkPath = path.resolve(process.cwd(), args.apk);
    if (!fs.existsSync(apkPath)) {
      console.error(`❌ APK not found: ${apkPath}`);
      process.exit(1);
    }
    sizeBytes = fs.statSync(apkPath).size;
    const tag = `mobile-v${version}`;
    console.log(`⤴️  Uploading ${(sizeBytes / 1024 / 1024).toFixed(1)} MB as ${tag} …`);
    try {
      execFileSync("gh", ["release", "view", tag, "--repo", REPO], { stdio: "ignore" });
      // Release already exists: replace the asset rather than fail.
      execFileSync("gh", ["release", "upload", tag, `${apkPath}#sumaiya.apk`, "--clobber", "--repo", REPO], {
        stdio: "inherit",
      });
    } catch {
      // `gh release create file#label` names the asset after the FILE, not the
      // label — a release once went out as app-release.apk and the resolver
      // skipped it, silently pinning everyone to the previous build. So the
      // asset is renamed on disk first, guaranteeing the canonical name.
      const staged = path.join(path.dirname(apkPath), "sumaiya.apk");
      if (staged !== apkPath) fs.copyFileSync(apkPath, staged);
      const body = [notesSw && `SW: ${notesSw}`, notesEn && `EN: ${notesEn}`].filter(Boolean).join("\n");
      execFileSync(
        "gh",
        ["release", "create", tag, staged, "--repo", REPO, "--title", `Sumaiya v${version}`, "--notes", body || `Sumaiya v${version}`],
        { stdio: "inherit" },
      );
    }
    apkUrl = `https://github.com/${REPO}/releases/download/mobile-v${version}/sumaiya.apk`;
  }

  if (!apkUrl) {
    console.error("❌ Need either --url <apk url> or --apk <path>");
    process.exit(1);
  }

  await sql`
    insert into app_release (id, version, apk_url, size_bytes, notes_sw, notes_en, channel)
    values (${`rel_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`},
            ${version}, ${apkUrl}, ${sizeBytes}, ${notesSw}, ${notesEn}, ${args.channel})
  `;

  console.log("");
  console.log(`✅ Published v${version} on channel "${args.channel}".`);
  console.log(`   Users on an older build are now offered it — and only they.`);
  console.log(`   Verify: curl -s https://www.templatehub.pro/api/app/update | head -c 400`);
} catch (err) {
  console.error("❌ Publish failed:", err.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
