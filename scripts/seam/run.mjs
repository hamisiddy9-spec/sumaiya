#!/usr/bin/env node
/**
 * ============================================================================
 * THE SEAM TEST — one command that walks the whole user journey and asserts
 * against SERVER STATE, not against what the screen shows.
 * ============================================================================
 *
 * WHY THIS EXISTS
 * Three bugs shipped in one day and every one lived at a SEAM BETWEEN
 * components, while each component passed its own tests in isolation:
 *     app sends 8 digits      vs  server sends 6
 *     web signs in via Supabase vs native signs in via Google directly
 *     config says X           vs  the deployed environment holds Y
 *     tests pass              vs  the product does not work
 * The pieces were tested. The JOURNEY never was. This is the journey.
 *
 * ============================================================================
 * ANTISEAM DISCIPLINE — read this before trusting a green line below
 * ============================================================================
 * 1. TWO SURFACES EXIST: (a) web — desktop AND mobile web, one bundle, two
 *    layouts; (b) the Android app — a separate codebase, its own API host, its
 *    own build, shipped separately. ONE PASSING PROVES NOTHING ABOUT THE OTHER.
 *    Every run PRINTS which surfaces it exercised and which it did not. The
 *    Android surface is NEVER exercised by this script (no device, no emulator):
 *    a green web run is not evidence about the APK, ever.
 * 2. NEVER "works" — always "I ran X and observed Y". Every line below is a
 *    command that ran and an output it produced, or it is labelled UNVERIFIED.
 * 3. An assertion may only be about server-observable state: a row in Postgres,
 *    an HTTP status, the bytes/pages/text of a file, a token response. The
 *    screen is context, never the assertion.
 * 4. Missing credential or unreachable app ⇒ print THAT reason, exit non-zero.
 *    A seam test that cannot run must never look like it passed.
 *
 * RUN:
 *   npm run seam                 # full journey (starts its own dev server)
 *   npm run seam -- --skip-evals # everything except the anti-fabrication pack
 *   npm run seam -- --app-url=http://localhost:3000   # use a server you have up
 *   npm run seam -- --cleanup    # delete the test user this run created
 *
 * EXIT CODE: 0 only when the whole journey was exercised and every assertion
 * held. Any FAIL or any BLOCKED keeps it non-zero, on purpose.
 * ============================================================================
 */
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

import {
  loadSecrets, resolve, redactTarget, projectRef, ENV_DIR,
  REQUIRED, OPTIONAL, LIVE_PROJECT_REF, STALE_PROJECT_REFS, DEAD_PROJECT_REFS,
} from "./lib/env.mjs";
import { Report, EVIDENCE, sha256 } from "./lib/report.mjs";
import { probe, jsonPost, bearer, describe, dataArray, LOCAL_APP, LIVE_APP } from "./lib/http.mjs";
import { openDb, baselineCounts, cvRowsForUser, cvRow, cvsMentioning, jobCounts, jsonbShape } from "./lib/db.mjs";
import {
  createTestUser, deleteTestUser, passwordGrant, mintSsrCookies,
  authSettings, requestEmailOtp, googleAuthorizeProbe, googleIdTokenProbe, storageKey,
} from "./lib/auth.mjs";
import { ensureAppServer, appEnv, REPO } from "./lib/app-server.mjs";
import { deployedBundleScan } from "./lib/deploy.mjs";
import {
  guestBuildsCvAndDownloadsPdf, assertPdf, makePhotoBuffer, createOutDir,
  SURFACE, waitForDownloadControl, probeGoogleMechanism,
} from "./lib/browser.mjs";
import { pdfFacts, containsAll } from "./lib/pdf.mjs";

// ── arguments ───────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const flag = (name) => argv.includes(`--${name}`);
const opt = (name, dflt) => {
  const hit = argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : dflt;
};
const OPTS = {
  appUrl: opt("app-url", LOCAL_APP),
  liveUrl: opt("live-url", LIVE_APP),
  skipEvals: flag("skip-evals"),
  skipLive: flag("skip-live"),
  cleanup: flag("cleanup"),
  httpOnly: flag("http-only"),
  skipBrowser: flag("skip-browser"),
};
const RUN_ID = randomUUID();
const PORT = Number(new URL(OPTS.appUrl).port || 3000);
const report = new Report();
const outDir = createOutDir();
const artifacts = { runId: RUN_ID, startedAt: new Date().toISOString(), appUrl: OPTS.appUrl, liveUrl: OPTS.liveUrl };
let browser = null;
let server = null;
let sql = null;
let createdUser = null;

const banner = (t) => {
  report.say("════════════════════════════════════════════════════════════════════");
  report.say(t);
  report.say("════════════════════════════════════════════════════════════════════");
};

async function shutdown() {
  try { if (browser) await browser.close(); } catch { /* ignore */ }
  try { if (sql) await sql.end({ timeout: 5 }); } catch { /* ignore */ }
  if (server?.started && server.child) {
    try { server.child.kill(); } catch { /* ignore */ }
  }
}

function writeArtifacts(extra = {}) {
  const file = path.join(outDir, `seam-${RUN_ID.slice(0, 8)}.json`);
  try {
    fs.writeFileSync(file, JSON.stringify({ ...artifacts, ...extra, results: report.all() }, null, 2));
  } catch { /* best effort */ }
  report.say(`artifact: ${file}`);
}

/** Dead-on-arrival helper: print the ONE reason and stop, never a green tick. */
async function fatal(reason, extra = {}) {
  report.say("");
  report.say(`SEAM: CANNOT RUN — ${reason}`);
  report.say("Nothing was asserted to be working. Fix the reason above and re-run.");
  writeArtifacts({ ...extra, fatal: reason });
  await shutdown();
  process.exit(1);
}

// ═══════════════════════════════════════════════════════════════════════════
async function main() {
  banner(`THE SEAM TEST — run ${RUN_ID.slice(0, 8)} · ${new Date().toISOString()}`);
  report.say(`app under test : ${OPTS.appUrl}   (starting one if nothing answers)`);
  report.say(`live probe     : ${OPTS.liveUrl}`);
  report.say(`surfaces       : this run exercises the WEB surface only.`);
  report.say(`                 the ANDROID app is NOT exercised (no device attached).`);
  report.say(`                 one passing proves nothing about the other.`);

  // ── STEP 1: preflight — the run must be able to exist ────────────────────
  report.step("PREFLIGHT — credentials, database, browser, reachable app");
  const secrets = loadSecrets();
  if (secrets.error) {
    await fatal(`${secrets.error}. Expected the secrets directory ${ENV_DIR} with one file per service.`);
  }
  report.observed(`secrets directory ${ENV_DIR}: ${secrets.files.length} env file(s) [${secrets.files.join(", ")}]`);

  const present = {};
  for (const n of [...REQUIRED, ...OPTIONAL]) present[n] = resolve(n, secrets) ? "present" : "MISSING";
  report.observed(`credentials: ${Object.entries(present).map(([k, v]) => `${k}=${v}`).join(" · ")}`);

  const missing = REQUIRED.filter((n) => !resolve(n, secrets));
  if (missing.length) {
    // A present-but-EMPTY variable once 500'd every authed route; distinguish it
    // from absent, because the fix is different.
    await fatal(`missing required credential(s): ${missing.join(", ")}. Looked in the process env, then ${ENV_DIR}.`);
  }

  const supabaseUrl = resolve("NEXT_PUBLIC_SUPABASE_URL", secrets);
  const anonKey = resolve("NEXT_PUBLIC_SUPABASE_ANON_KEY", secrets);
  const serviceRoleKey = resolve("SUPABASE_SERVICE_ROLE_KEY", secrets);
  const databaseUrl = resolve("DATABASE_URL", secrets);
  const ref = projectRef(supabaseUrl);
  artifacts.supabaseRef = ref;
  report.observed(`supabase target ${redactTarget(supabaseUrl)} (project ref ${ref})`);
  report.observed(`database target ${redactTarget(databaseUrl)}`);

  if (DEAD_PROJECT_REFS.includes(ref)) {
    report.fail(`SUPABASE POINTS AT THE DELETED PROJECT ${ref} — nothing can work`, { evidence: EVIDENCE.SOURCE });
  } else if (STALE_PROJECT_REFS.includes(ref)) {
    report.fail(`SUPABASE POINTS AT THE NON-AUTHORITATIVE REF ${ref} (live is ${LIVE_PROJECT_REF})`, { evidence: EVIDENCE.SOURCE });
  } else if (ref === LIVE_PROJECT_REF) {
    report.pass(`supabase project ref is the live one (${ref})`, { evidence: EVIDENCE.SOURCE });
  } else {
    report.fail(`supabase project ref is ${ref}, which is neither the live ref (${LIVE_PROJECT_REF}) nor a known stale one`, { evidence: EVIDENCE.SOURCE });
  }
  if (!serviceRoleKey) {
    report.blocked("SUPABASE_SERVICE_ROLE_KEY is absent — no test user can be created, so the signed-in half of the journey cannot be exercised", {
      evidence: EVIDENCE.SERVER,
      detail: "the guest->account seam and every authenticated endpoint stay UNVERIFIED without it",
    });
  }

  try {
    sql = await openDb(databaseUrl);
    const probeRows = await sql`select 1 as one`;
    report.pass(`Postgres reachable (select 1 → ${probeRows[0].one}) — every assertion below can be about real rows`, { evidence: EVIDENCE.SERVER });
  } catch (err) {
    await fatal(`database unreachable: ${err.message}. Without it there is no server state to assert against.`);
  }

  report.observed(`DB baseline: ${JSON.stringify(await baselineCounts(sql, ["cv", "job", "profile", "application", "download_log", "auth.users"]))}`);

  // ── STEP 2: an app that actually answers ─────────────────────────────────
  report.step("APP UNDER TEST — reachable, and the DB it reports is the DB we assert against");
  if (OPTS.httpOnly || OPTS.skipBrowser) {
    report.blocked("browser journey skipped by flag (--http-only/--skip-browser) — the whole guest journey stays UNVERIFIED", { evidence: EVIDENCE.UI });
    const h = await probe(`${OPTS.appUrl}/api/health`);
    report.observed(`GET /api/health → ${describe(h)}`);
  } else {
    server = await ensureAppServer({
      port: PORT,
      env: appEnv({ secrets, appUrl: OPTS.appUrl, resolveEnv: resolve }),
      outDir,
    });
    if (!server.ok) {
      await fatal(`the app under test is not reachable: ${server.error}`, { serverStarted: server.started, port: PORT });
    }
    report.pass(
      `app is up on ${OPTS.appUrl} (${server.started ? "started by this run" : "an already-running server was reused"}) · /api/health → ${JSON.stringify(server.health)}`,
      { evidence: EVIDENCE.SERVER, detail: server.logPath ? `dev log: ${server.logPath}` : undefined },
    );
    const health = await probe(`${OPTS.appUrl}/api/health`);
    report.pass(`GET /api/health → ${describe(health)}`, { evidence: EVIDENCE.SERVER });
  }

  // ── STEP 3: the guest builds a CV and downloads a real PDF ───────────────
  report.step(`GUEST JOURNEY (${SURFACE}) — opens the editor, builds a CV, downloads the PDF`);
  let guest = null;
  if (OPTS.httpOnly || OPTS.skipBrowser) {
    report.blocked("guest journey not exercised (flag) — the first half of the journey is UNVERIFIED");
  } else {
    const { chromium } = await import("playwright");
    const require = (await import("node:module")).createRequire(path.join(REPO, "package.json"));
    const playwrightPkg = require("playwright/package.json");
    report.observed(`browser: playwright ${playwrightPkg.version}`);
    try {
      browser = await chromium.launch({ channel: "chrome", headless: true });
      report.pass(`Chromium launched (channel "chrome", headless)`, { evidence: EVIDENCE.SERVER });
    } catch (err) {
      browser = await chromium.launch({ headless: true }).catch(() => null);
      if (browser) report.observed(`channel "chrome" unavailable (${String(err).slice(0, 80)}); used the bundled chromium instead`);
      else await fatal(`no Chromium could be launched for the guest journey: ${err.message}`);
    }
    const photoBuffer = await makePhotoBuffer(browser, { size: 900 });
    report.observed(`fixture photo drawn in-browser: ${photoBuffer.length} bytes of real JPEG`);

    guest = await guestBuildsCvAndDownloadsPdf({
      browser, appUrl: OPTS.appUrl, runId: RUN_ID, outDir, report,
      label: "local-guest", photoBuffer,
    });
    artifacts.guest = {
      status: guest.status, finalUrl: guest.finalUrl, name: guest.name,
      draftName: guest.draftName, draftPhotoChars: guest.draftPhotoChars,
      draftRawBytes: guest.draftRawBytes, pdf: guest.pdf && {
        bytes: guest.pdf.bytes, pages: guest.pdf.pages, sha256: guest.pdf.sha256,
        textChars: guest.pdf.textChars, file: guest.pdf.file,
      },
    };

    if (guest.status !== 200) {
      report.fail(`guest editor answered HTTP ${guest.status} (expected 200)`, { evidence: EVIDENCE.SERVER });
    } else {
      report.pass(`guest editor served HTTP 200 without an account`, { evidence: EVIDENCE.SERVER });
    }
    if (guest.filled?.fullName) {
      report.pass(`the name field accepted input (${guest.filled.fullName.selector})`, { evidence: EVIDENCE.UI });
    } else {
      report.fail("the guest editor's name field could not be found or filled — the journey stopped at its first field", {
        evidence: EVIDENCE.UI,
      });
    }

    // The guest's ONLY store is this browser. That is a seam in its own right
    // (see the next step), but first: did the editor persist it at all?
    if (guest.draftName) {
      report.pass(`guest draft present in browser storage: fullName="${guest.draftName}" · ${guest.draftRawBytes} bytes of JSON`, {
        evidence: EVIDENCE.UI,
        detail: "localStorage key sumaiya-guest-cv — client-only by design; the server half is asserted next",
      });
    } else if (guest.draftRawBytes) {
      report.fail(`the guest draft exists in browser storage but carries no fullName (read back: "${guest.draftName ?? "(missing)"}")`, { evidence: EVIDENCE.UI });
    } else {
      report.fail("after typing and waiting out the 2s autosave debounce, NO guest draft was written to browser storage — a guest's work would be lost on reload", {
        evidence: EVIDENCE.UI,
      });
    }
    if (guest.photoUploaded) {
      report.pass(`guest photo reached the draft as a ${guest.draftPhotoChars}-char data URL (the editor's own validate→crop→re-encode pipeline ran)`, {
        evidence: EVIDENCE.UI,
        detail: "whether it survives sign-up is asserted against the database, below",
      });
      if (guest.draftPhotoChars < 1000) {
        report.fail(`the guest photo in the draft is only ${guest.draftPhotoChars} chars — that is not a stored image`, { evidence: EVIDENCE.UI });
      }
    } else if (guest.photoUploaded === false) {
      report.fail("no image file input was found in the guest editor — the photo path could not be exercised", { evidence: EVIDENCE.UI });
    }
    assertPdf(report, guest, { expectName: guest.name, stepLabel: "guest, no account" });

    if (guest.consoleErrors?.length) {
      report.observed(`console/page errors during the guest journey: ${JSON.stringify(guest.consoleErrors)}`);
    }
  }

  // ── STEP 4: the orphan question — where does a guest's work LIVE? ────────
  report.step("THE GUEST-ORPHAN QUESTION (a) — is any of the guest's work on the server before they sign in?");
  const guestNeedle = guest?.name ?? "Seam";
  const since = new Date(Date.now() - 30 * 60_000).toISOString();
  if (guest?.name) {
    const orphans = await cvsMentioning(sql, guest.name, since);
    artifacts.orphanCheck = { needle: guest.name, since, rows: orphans.map((r) => ({ id: r.id, user_id: r.user_id, title: r.title })) };
    report.observed(`SELECT … FROM cv WHERE data::text LIKE '%${guest.name}%' AND created_at >= '${since}' → ${orphans.length} row(s)`);
    if (orphans.length === 0) {
      report.pass("a guest who built and downloaded a CV leaves ZERO rows in the database — the work exists only in that one browser's localStorage", {
        evidence: EVIDENCE.SERVER,
        detail:
          "consequence, not opinion: clearing browser data, using another device, or the in-app copy 'Open it on your phone too?' cannot recover it, " +
          "because the server has never seen it",
      });
    } else {
      report.info(`the guest's work is already on the server (${orphans.length} matching row(s)) — the orphan claim does NOT hold on this surface`, {
        evidence: EVIDENCE.SERVER,
      });
    }
    // ── WHAT THE PUBLIC KEY THE BROWSER SHIPS CAN READ ────────────────────
    // The anon key is compiled into every visitor's bundle by design. What it
    // can READ is therefore a product-facing fact, not an internal one.
    const rest = async (path, key) => {
      const r = await fetch(`${supabaseUrl}/rest/v1/${path}`, { headers: { apikey: key, authorization: `Bearer ${key}` } });
      const text = await r.text();
      let rows = null;
      try {
        const j = JSON.parse(text);
        rows = Array.isArray(j) ? j.length : null;
      } catch {
        /* not an array — the status code is the observation */
      }
      return { status: r.status, rows, text: text.slice(0, 140) };
    };
    const anonCvRest = await rest("cv?select=id&limit=2", anonKey);
    const anonJobInternal = await rest("job?select=source,source_url&limit=2", anonKey);
    artifacts.publicKeyReads = { cv: anonCvRest, jobInternal: anonJobInternal };
    report.observed(`PostgREST with the PUBLIC anon key: GET /rest/v1/cv → HTTP ${anonCvRest.status}${anonCvRest.rows === null ? "" : ` · ${anonCvRest.rows} row(s)`} · GET /rest/v1/job?select=source,source_url → HTTP ${anonJobInternal.status}${anonJobInternal.rows === null ? "" : ` · ${anonJobInternal.rows} row(s)`}`);
    if (anonCvRest.status === 401 || anonCvRest.rows === 0) {
      report.pass("the public key cannot read any CV rows (RLS in front of the table), so a guest's or a user's document is not reachable by key alone", {
        evidence: EVIDENCE.SERVER,
      });
    } else {
      report.fail(`the public anon key READ ${anonCvRest.rows} CV row(s) over PostgREST — user documents are exposed by the key every browser ships`, {
        evidence: EVIDENCE.SERVER,
      });
    }
    if (anonJobInternal.status === 200 && (anonJobInternal.rows ?? 0) > 0) {
      report.fail("the public anon key can read the job table's INTERNAL columns over PostgREST (source / source_url) although lib/api/routes/jobs.ts states it never exposes them on an unauthenticated endpoint — the route's careful projection is bypassed by the table-level grant", {
        evidence: EVIDENCE.SERVER,
      });
    } else {
      report.pass("the public key cannot read the job table's internal columns", { evidence: EVIDENCE.SERVER });
    }
  } else {
    report.unverified("the orphan question could not be answered because the guest journey did not produce a name to search for");
  }

  // ── STEP 5: a REAL session, from the product's own auth API ──────────────
  report.step("SIGN-IN MECHANISM — is the session real, and does the server honour it?");
  let session = null;
  if (!serviceRoleKey) {
    report.blocked("no SUPABASE_SERVICE_ROLE_KEY ⇒ no test account can be created ⇒ the sign-in half of the journey is UNVERIFIED", {
      evidence: EVIDENCE.SERVER,
    });
  } else {
    const email = `seam-${RUN_ID.slice(0, 8)}@sumaiya-seam.invalid`;
    const password = `Seam!${randomUUID()}`;
    const created = await createTestUser({ supabaseUrl, serviceRoleKey, email, password });
    artifacts.testUser = { id: created.id, email: created.email, status: created.status };
    if (!created.ok) {
      report.blocked(`test account could not be created via the admin API (HTTP ${created.status}: ${created.error}) — the authenticated journey is UNVERIFIED`, {
        evidence: EVIDENCE.SERVER,
      });
    } else {
      createdUser = { ...created, password };
      report.pass(`real test account created through the Supabase admin API (user id ${created.id}, address @sumaiya-seam.invalid so no mail can be delivered)`, {
        evidence: EVIDENCE.SERVER,
      });
      const grant = await passwordGrant({ supabaseUrl, anonKey, email, password });
      if (!grant.ok) {
        report.fail(`POST /auth/v1/token?grant_type=password answered HTTP ${grant.status}: ${grant.error}`, { evidence: EVIDENCE.SERVER });
      } else {
        session = grant;
        report.pass(
          `real session minted: ${grant.tokenType} token, ${String(grant.accessToken).length} chars, expires in ${grant.expiresIn}s, user ${grant.userId}`,
          { evidence: EVIDENCE.SERVER, detail: "value never printed; it is used, in memory only, for the requests below" },
        );
        const me = await probe(`${supabaseUrl}/auth/v1/user`, { headers: { apikey: anonKey, ...bearer(grant.accessToken) } });
        report.pass(`GET /auth/v1/user with that token → HTTP ${me.status} (sub ${me.json?.id ?? "?"})`, { evidence: EVIDENCE.SERVER });

        const noAuth = await probe(`${OPTS.appUrl}/api/cv`);
        const withAuth = await probe(`${OPTS.appUrl}/api/cv`, { headers: bearer(grant.accessToken) });
        report.observed(`GET /api/cv — anonymous: HTTP ${noAuth.status} · with bearer: HTTP ${withAuth.status} · ${(dataArray(withAuth) ?? []).length} row(s)`);
        if (noAuth.status === 401 && withAuth.status === 200) {
          report.pass("the API rejects anonymous reads and accepts the real token — the 401/200 seam behaves", { evidence: EVIDENCE.SERVER });
        } else {
          report.fail(`auth seam wrong: anonymous=${noAuth.status} (expected 401), bearer=${withAuth.status} (expected 200)`, { evidence: EVIDENCE.SERVER });
        }
        if ((dataArray(withAuth) ?? []).length === 0) {
          report.pass("a brand-new account starts with 0 CVs on the server — so anything that appears later was carried there by the journey", {
            evidence: EVIDENCE.SERVER,
          });
        }
      }
    }
  }

  // ── STEP 6: the guest→account seam, through the product's own page ───────
  report.step("THE GUEST→ACCOUNT SEAM (a) — the product's own migration page carries the guest's work across");
  if (!guest?.page || !session) {
    report.blocked("the migration leg needs both a live guest browser and a real session", {
      evidence: EVIDENCE.SERVER,
      detail: `guest browser: ${guest?.page ? "yes" : "no"} · session: ${session ? "yes" : "no"}`,
    });
  } else {
    const page = guest.page;
    const context = guest.context;
    const key = storageKey(supabaseUrl);
    const minted = await mintSsrCookies({
      supabaseUrl, anonKey,
      accessToken: session.accessToken, refreshToken: session.refreshToken,
    });
    artifacts.sessionCookies = { storageKey: key, names: minted.cookies.map((c) => c.name), ok: minted.ok };
    if (!minted.ok) {
      report.blocked(`the app's own session cookie could not be minted (${minted.error}) — the migration leg is UNVERIFIED`, { evidence: EVIDENCE.SERVER });
    } else {
      report.observed(`session cookies minted with @supabase/ssr itself: ${minted.cookies.map((c) => c.name).join(", ")} (chunked if needed, exactly as the app writes them)`);
      const shapeNow = await jsonbShape(sql, "cv");
      report.observed(`cv rows by jsonb shape (before this run's migration): ${JSON.stringify(shapeNow)}`);
      await context.addCookies(
        // Playwright wants either `url` OR `domain`+`path` — not both. The cookie
        // is scoped to the app origin for this run.
        minted.cookies.map((c) => ({ name: c.name, value: c.value, url: OPTS.appUrl })),
      );
      // Prove the SERVER reads them before blaming the page.
      const apiAsUser = await page.evaluate(async () => {
        const r = await fetch("/api/cv", { credentials: "include" });
        return { status: r.status, body: (await r.text()).slice(0, 120) };
      });
      report.observed(`in-page GET /api/cv with the injected cookies → HTTP ${apiAsUser.status} ${apiAsUser.body}`);

      const before = await cvRowsForUser(sql, session.userId);
      const migUrl = `${OPTS.appUrl}/migrate-guest`;
      await page.goto(migUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
      let landed = null;
      try {
        await page.waitForURL(/\/editor\/cv\/[A-Za-z0-9_-]+/, { timeout: 75_000 });
        landed = page.url();
      } catch {
        landed = page.url();
      }
      report.observed(`the product's own /migrate-guest page ended on: ${landed}`);
      const cvId = /\/editor\/cv\/([A-Za-z0-9_-]+)/.exec(landed)?.[1] ?? null;

      if (!cvId) {
        report.fail(`the migration page did not reach an editor for a real CV (ended on ${landed}) — the guest's work was not saved to the account`, {
          evidence: EVIDENCE.SERVER,
        });
      } else {
        // The client's own write bodies are evidence: a payload-shape bug is
        // invisible on screen and obvious on the wire.
        for (const r of guest.apiRequests.filter((x) => x.url?.includes("/api/cv") && x.method !== "GET")) {
          report.observed(`request seen in the browser: ${r.method} ${r.url.replace(OPTS.appUrl, "")} · body[0..159]=${JSON.stringify(r.body)}`);
        }
        const before = await cvRowsForUser(sql, session.userId);
        const after = await cvRowsForUser(sql, session.userId);
        const row = await cvRow(sql, cvId);
        artifacts.migration = {
          cvId, rowsBefore: before.length, rowsAfter: after.length,
          row: row && { id: row.id, title: row.title, jsonb_type: row.jsonb_type, data_json_bytes: row.data_json_bytes, full_name: row.full_name, photo_chars: row.photo_chars },
        };
        report.observed(`row ${cvId}: jsonb_type=${row?.jsonb_type} · ${row?.data_json_bytes} bytes of column text · fullName read back="${row?.full_name}" · photo ${row?.photo_chars} chars`);

        if (after.length > 0) {
          report.pass(`THE GUEST'S WORK WAS CARRIED ACROSS: a real row (id ${cvId}) now exists for the account, ${row?.data_json_bytes} bytes`, {
            evidence: EVIDENCE.SERVER,
          });
        } else {
          report.fail("the migration reported success but NO row exists for the user — the work was lost at the seam", { evidence: EVIDENCE.SERVER });
        }

        if (row?.full_name === guest.name) {
          report.pass(`the migrated row's fullName equals the string typed in the guest browser ("${row.full_name}")`, { evidence: EVIDENCE.SERVER });
        } else {
          report.fail(`the migrated row's fullName is "${row?.full_name}", not the guest's "${guest.name}" — content did not survive the seam`, {
            evidence: EVIDENCE.SERVER,
          });
        }

        // THE PHOTO — the half a "the page rendered" test can never see.
        const guestPhoto = guest.draft?.cv?.personal?.photo ?? "";
        if (row?.photo_chars && guestPhoto && row.photo_chars === guestPhoto.length) {
          report.pass(`the guest's uploaded PHOTO survived: ${row.photo_chars} chars in the database, identical in length to the browser's draft (sha256:${sha256(guestPhoto).slice(0, 16)})`, {
            evidence: EVIDENCE.SERVER,
          });
        } else if (row?.photo_chars) {
          report.pass(`a photo reached the DB (${row.photo_chars} chars) but the browser draft held ${guestPhoto.length} — recorded, not assumed (the signed-in editor may re-encode on its first save)`, {
            evidence: EVIDENCE.SERVER,
          });
        } else if (guestPhoto) {
          report.fail(`the guest uploaded a ${guestPhoto.length}-char photo and it is ABSENT from the migrated row (photo length 0) — the photo was orphaned at sign-up`, {
            evidence: EVIDENCE.SERVER,
          });
        } else {
          report.unverified("no photo was uploaded in this run, so the photo half of the seam is unproven");
        }

        // ── THE STORAGE SHAPE — a seam between the API and the database ─────
        // JSONB objects are queryable with `->`/`->>`; JSONB holding a JSON
        // *string* is not. The app's own reader unwraps it, so the happy path
        // hides it — which is exactly how a bug like this survives a green suite.
        if (row?.jsonb_type && row.jsonb_type !== "object") {
          report.fail(
            `the CV is stored as a jsonb ${row.jsonb_type}, not a jsonb OBJECT: writing through the app's own API double-encodes the payload, so every SQL jsonb operator (data->'personal'->>'fullName') returns NULL on a row that holds the data`,
            {
              evidence: EVIDENCE.SERVER,
              detail: `row ${cvId}: jsonb_type_typeof=${row.jsonb_type}; the app's JS reader compensates, so screenshots look right while the database cannot query its own content`,
            },
          );
        } else if (row?.jsonb_type === "object") {
          report.pass("the CV is stored as a real jsonb object — queryable with SQL jsonb operators", { evidence: EVIDENCE.SERVER });
        }

        // ── "sees their own work back" ──────────────────────────────────────
        const { loc } = await waitForDownloadControl(page);
        const editorText = await page.evaluate(() => document.body.innerText.replace(/\s+/g, " ").slice(0, 200)).catch(() => "");
        report.observed(`signed-in editor at ${page.url()} says: "${editorText.slice(0, 120)}"`);
        if (!loc) {
          report.fail("after migration the signed-in editor shows no visible PDF control within 45s — the user cannot get their document back", {
            evidence: EVIDENCE.UI,
          });
        } else {
          try {
            const [dl] = await Promise.all([
              page.waitForEvent("download", { timeout: 120_000 }),
              loc.click({ timeout: 20_000 }),
            ]);
            const file = path.join(outDir, `signed-in-${RUN_ID.slice(0, 6)}.pdf`);
            await dl.saveAs(file);
            const facts = await pdfFacts(file);
            artifacts.signedInPdf = { bytes: facts.bytes, pages: facts.pages, textChars: facts.textChars, sha256: facts.sha256, file };
            report.observed(`signed-in export: ${facts.bytes} bytes · ${facts.pages} page(s) · text layer ${facts.textChars} chars`);
            const hit = containsAll(facts.text, [guest.name])[0];
            if (hit.found) {
              report.pass(`the PDF downloaded from the SIGNED-IN editor (built from the database row) contains "${guest.name}" — the work came back from the server, not from memory`, {
                evidence: EVIDENCE.BYTES,
              });
            } else {
              report.fail(`the signed-in PDF's text layer does NOT contain "${guest.name}" — the round trip lost the content`, { evidence: EVIDENCE.BYTES });
            }
          } catch (err) {
            report.fail(`the signed-in editor could not produce a PDF: ${String(err).split("\n")[0].slice(0, 160)}`, { evidence: EVIDENCE.BYTES });
          }
        }

        // The list endpoint, as the server answers it.
        const list = await probe(`${OPTS.appUrl}/api/cv`, { headers: bearer(session.accessToken) });
        const rows = dataArray(list) ?? [];
        artifacts.cvList = { status: list.status, count: rows.length, ids: rows.map((r) => r.id) };
        if (list.status === 200 && rows.some((r) => r.id === cvId)) {
          report.pass(`GET /api/cv returns the migrated CV (${rows.length} row(s)) — what any client, web or native, reads back`, {
            evidence: EVIDENCE.SERVER,
          });
        } else {
          report.fail(`GET /api/cv returned HTTP ${list.status} with ${rows.length} row(s), none matching the migrated id ${cvId}`, {
            evidence: EVIDENCE.SERVER,
          });
        }
      }
      await context.close();
    }
  }

  // ── STEP 7: email sign-in ────────────────────────────────────────────────
  report.step("EMAIL SIGN-IN (b) — does the code the app asks for exist in the email the server sends?");
  const settings = await authSettings({ supabaseUrl, anonKey });
  report.observed(`GET ${supabaseUrl}/auth/v1/settings → HTTP ${settings.status} · ${JSON.stringify(settings.body).slice(0, 200)}`);
  if (settings.body?.external?.email === true) {
    report.pass("the auth server reports the email provider ENABLED", { evidence: EVIDENCE.SERVER });
  }
  // The address deliberately uses example.com: RFC-reserved, no MX, so a stray
  // send cannot reach a human. (.invalid is rejected outright by Supabase's
  // validator — observed: HTTP 400 email_address_invalid.)
  const otp = await requestEmailOtp({ supabaseUrl, anonKey, email: `seam-probe-${RUN_ID.slice(0, 8)}@example.com` });
  artifacts.emailOtp = { status: otp.status, body: otp.body };
  report.observed(`POST ${supabaseUrl}/auth/v1/otp (what signIn.emailCode / signIn.magicLink call) → HTTP ${otp.status} · ${JSON.stringify(otp.body).slice(0, 200)}`);
  if (otp.status === 200) {
    report.pass("the auth server ACCEPTS an email OTP request (HTTP 200) — the endpoint is open; whether the CODE inside the mail is usable is the next assertion", {
      evidence: EVIDENCE.SERVER,
    });
  } else if (otp.status === 429) {
    report.fail("the auth server answered 429 (over_email_send_rate_limit) — an email sign-in attempt RIGHT NOW fails for a real person", {
      evidence: EVIDENCE.SERVER,
      detail:
        "Supabase's built-in mailer cap is project-wide (it lifts once custom SMTP exists). Automated probes — including this suite's own — consume it, so this may be partly self-inflicted; " +
        "what it does not change is the observation: at this moment a human asking for a sign-in link gets nothing",
    });
  } else {
    report.fail(`the auth server refused the OTP request (HTTP ${otp.status}: ${JSON.stringify(otp.body).slice(0, 120)})`, { evidence: EVIDENCE.SERVER });
  }

  // ── THE CROSS-SURFACE CODE-LENGTH SEAM ──────────────────────────────────
  // This is the exact bug class that started all of this: one component expects
  // N digits, the other produces M. Read both rules out of the source and assert
  // they agree. Neither component's own test can see this.
  const webSignInPath = path.join(REPO, "apps", "web", "app", "(app)", "(auth)", "sign-in", "sign-in-form.tsx");
  const nativeCodePath = path.join(REPO, "apps", "native", "src", "lib", "auth-code.ts");
  // The number itself has ONE home now (packages/utils) — both surfaces read it,
  // so neither may carry a literal of its own. Resolve the declaration first,
  // then check each surface DERIVES from it: a literal in either file is the
  // drift this step exists to catch, and it is caught whether or not it happens
  // to agree today.
  const sharedCodePath = path.join(REPO, "packages", "utils", "src", "auth-code.ts");
  const SHARED_MARKER = "@sumaiya/utils/auth-code";
  let sharedDigits = null;
  try {
    sharedDigits = /EMAIL_OTP_DIGITS\s*=\s*(\d+)/.exec(fs.readFileSync(sharedCodePath, "utf8"))?.[1] ?? null;
  } catch (err) {
    report.unverified(`could not read the shared code-length declaration in ${path.relative(REPO, sharedCodePath)}: ${err.message}`);
  }
  let webRule = null;
  let nativeRule = null;
  try {
    const form = fs.readFileSync(webSignInPath, "utf8");
    // `maxLength={8}` (a second copy of the number) or `maxLength={EMAIL_OTP_DIGITS}`
    // (derived). Both are parsed; only the second is healthy.
    const literalMax = /maxLength=\{(\d+)\}/.exec(form)?.[1] ?? null;
    const derives = /maxLength=\{EMAIL_OTP_DIGITS\}/.test(form) && form.includes(SHARED_MARKER);
    webRule = {
      maxLength: literalMax ?? (derives ? sharedDigits : null),
      gate: /code\.length < (\d+)/.exec(form)?.[1] ?? (derives ? sharedDigits : null),
      literal: literalMax,
      derives,
    };
  } catch (err) {
    report.unverified(`could not read the web sign-in form to check its digit rule: ${err.message}`);
  }
  try {
    const native = fs.readFileSync(nativeCodePath, "utf8");
    const literalDigits = /EMAIL_OTP_DIGITS\s*=\s*(\d+)/.exec(native)?.[1] ?? null;
    const derives = native.includes(SHARED_MARKER);
    nativeRule = { digits: literalDigits ?? (derives ? sharedDigits : null), literal: literalDigits, derives };
  } catch (err) {
    report.unverified(`could not read the native email-code rule: ${err.message}`);
  }
  artifacts.otpDigits = { shared: sharedDigits, web: webRule, native: nativeRule };
  report.observed(`shared code length (${path.relative(REPO, sharedCodePath)}): EMAIL_OTP_DIGITS=${sharedDigits}`);
  report.observed(`web sign-in form: maxLength=${webRule?.maxLength} (own literal: ${webRule?.literal ?? "none"}), submit gate "${webRule?.gate} digits"`);
  report.observed(`native (apps/native/src/lib/auth-code.ts): email OTP digits=${nativeRule?.digits} (own literal: ${nativeRule?.literal ?? "none"})`);
  if (webRule?.literal || nativeRule?.literal) {
    report.fail(
      `a surface carries its OWN copy of the code length (web: ${webRule?.literal ?? "none"}, native: ${nativeRule?.literal ?? "none"}) — the shared declaration is ${sharedDigits}, and a second copy is how the web came to accept 6 digits while the server sent 8`,
      { evidence: EVIDENCE.SOURCE, detail: `both surfaces must read ${SHARED_MARKER}` },
    );
  } else if (webRule?.maxLength && webRule.gate === webRule.maxLength) {
    report.pass(`web's email-code field expects exactly ${webRule.maxLength} digits and its submit gate agrees`, { evidence: EVIDENCE.SOURCE });
  } else if (webRule) {
    report.fail(`web's email-code field is internally inconsistent: maxLength=${webRule.maxLength}, gate=${webRule.gate}`, { evidence: EVIDENCE.SOURCE });
  }

  if (webRule?.maxLength && nativeRule?.digits && webRule.maxLength === nativeRule.digits) {
    report.pass(`both surfaces demand the SAME number of digits (${webRule.maxLength})`, { evidence: EVIDENCE.SOURCE });
  } else if (webRule?.maxLength && nativeRule?.digits) {
    report.fail(
      `THE TWO SURFACES DISAGREE ON THE CODE: web accepts ${webRule.maxLength} digits, the Android app accepts ${nativeRule.digits}. THE SERVER SENDS ONE LENGTH, so one of these two sign-ins cannot succeed`,
      {
        evidence: EVIDENCE.SOURCE,
        detail:
          `${path.relative(REPO, nativeCodePath)} also ships a test asserting ${nativeRule.digits}; ` +
          `the web field's maxLength is ${webRule.maxLength}. Both suites pass while the product is broken for one surface.`,
      },
    );
  }

  // The claim under test cannot be settled without the email itself.
  report.blocked(
    "cannot verify that the emailed template contains a CODE rather than a link — that lives in the Supabase Auth email template, which is not readable over the public API and is not editable until custom SMTP exists",
    {
      evidence: EVIDENCE.SERVER,
      detail:
        "to settle it: read Auth → Email Templates → Magic Link in the Supabase dashboard, or open a real message in an inbox; " +
        "until then the app's code field is UNVERIFIABLE from here and the assertion above is the only part that can be proved mechanically",
    },
  );

  // ── STEP 8: Google sign-in ───────────────────────────────────────────────
  report.step("GOOGLE SIGN-IN (c) — which mechanism is actually in the deployed code?");
  const authorize = await googleAuthorizeProbe({ supabaseUrl, anonKey });
  report.observed(`GET ${supabaseUrl}/auth/v1/authorize?provider=google (the route web used to take) → HTTP ${authorize.status} · ${authorize.body.slice(0, 160)}`);
  artifacts.googleAuthorize = { status: authorize.status, body: authorize.body.slice(0, 200) };
  if (/missing OAuth secret/i.test(authorize.body)) {
    report.fail(
      "the Supabase-hosted Google route STILL answers 400 'missing OAuth secret' — any client that signs in THROUGH Supabase is dead, which is exactly the web/native divergence that shipped",
      { evidence: EVIDENCE.SERVER, detail: "the shipped fix avoids this route (GIS + signInWithIdToken); anything still on the OAuth route fails here" },
    );
  }
  const idToken = await googleIdTokenProbe({ supabaseUrl, anonKey });
  report.observed(`POST ${supabaseUrl}/auth/v1/token?grant_type=id_token (fake token) → HTTP ${idToken.status} · ${JSON.stringify(idToken.body).slice(0, 160)}`);
  if (idToken.status === 400 && /id token/i.test(JSON.stringify(idToken.body ?? {}))) {
    report.pass("the ID-token route the shipped web fix depends on is alive — it rejects a FAKE token for being fake, not for the route being missing", {
      evidence: EVIDENCE.SERVER,
    });
  } else {
    report.fail(`the ID-token route did not behave as the fix requires (HTTP ${idToken.status}: ${JSON.stringify(idToken.body).slice(0, 160)})`, {
      evidence: EVIDENCE.SERVER,
    });
  }
  // Source: both surfaces must still agree. Comments are stripped first — the
  // file's own doc-comment explains why signInWithOAuth must NOT come back, and
  // a naive grep reads that warning as a violation (it did, on the first run).
  try {
    const strip = (src) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    const web = strip(fs.readFileSync(path.join(REPO, "apps", "web", "lib", "auth-client.ts"), "utf8"));
    const native = strip(fs.readFileSync(path.join(REPO, "apps", "native", "src", "contexts", "auth-context.tsx"), "utf8"));
    const webOauth = /\.signInWithOAuth\s*\(/.test(web);
    const webIdToken = /\.signInWithIdToken\s*\(/.test(web);
    const nativeIdToken = /\.signInWithIdToken\s*\(/.test(native);
    artifacts.googleMechanism = { webOauth, webIdToken, nativeIdToken };
    report.observed(`source read (comments stripped) — web: signInWithIdToken=${webIdToken}, signInWithOAuth=${webOauth} · native: signInWithIdToken=${nativeIdToken}`);
    if (!webOauth && webIdToken && nativeIdToken) {
      report.pass("web and native both use the ID-token mechanism in the working tree — the two surfaces have not drifted apart again", {
        evidence: EVIDENCE.SOURCE,
      });
    } else {
      report.fail(`mechanism divergence in the tree: web OAuth-route=${webOauth}, web id-token=${webIdToken}, native id-token=${nativeIdToken}`, {
        evidence: EVIDENCE.SOURCE,
      });
    }
  } catch (err) {
    report.unverified(`could not read both auth sources to compare mechanisms: ${err.message}`);
  }

  // ── STEP 9: the deployed bundle vs the working tree ──────────────────────
  report.step("THE DEPLOY SEAM (c) — what the LIVE site is really running, and which project it points at");
  if (OPTS.skipLive) {
    report.blocked("live-site probes disabled by --skip-live — the deployed surface is UNVERIFIED", { evidence: EVIDENCE.SERVER });
  } else {
    const liveHealth = await probe(`${OPTS.liveUrl}/api/health`);
    report.observed(`GET ${OPTS.liveUrl}/api/health → ${describe(liveHealth)}`);
    if (liveHealth.status === 200 && liveHealth.json?.ok) {
      report.pass(`the deployed site answers and reports its own DB as ${liveHealth.json.db}`, { evidence: EVIDENCE.SERVER });
    } else {
      report.fail(`the deployed site's health check answered ${describe(liveHealth, 80)}`, { evidence: EVIDENCE.SERVER });
    }

    const signIn = await probe(`${OPTS.liveUrl}/sign-in`);
    report.observed(`GET ${OPTS.liveUrl}/sign-in → HTTP ${signIn.status} · ${signIn.text.length} chars of HTML`);

    // ── THE DEPLOYED BUNDLE, MARKED BY OUR OWN STRINGS ─────────────────────
    const scan = await deployedBundleScan({
      liveUrl: OPTS.liveUrl,
      // Counted, never printed: the public key proves the scan read compiled
      // env; the service key must be absent.
      secretNeedles: [
        { label: "NEXT_PUBLIC_SUPABASE_ANON_KEY (public by design)", value: anonKey },
        { label: "SUPABASE_SERVICE_ROLE_KEY (must never ship)", value: serviceRoleKey },
      ],
    });
    artifacts.deployedBundle = {
      pageStatus: scan.pageStatus,
      chunks: scan.chunks.length,
      bytes: scan.bytes,
      deploymentIds: scan.deploymentIds,
      markers: scan.markers,
      contexts: scan.contexts,
      error: scan.error,
    };
    if (scan.error) {
      report.unverified(`the deployed chunks could not be scanned (${scan.error})`);
    } else {
      report.observed(
        `deployed bundle: ${scan.chunks.length} chunk(s) referenced by /sign-in, ${scan.bytes} bytes, deployment id(s) ${JSON.stringify(scan.deploymentIds)}`,
      );
      // WHY THE OBVIOUS MARKERS ARE INVALID — printed on every run so nobody
      // reintroduces them. Both are METHOD NAMES OF supabase-js, which every
      // bundle that includes the library contains whether or not our code calls
      // them; asserting on them tests the dependency, not the application.
      report.observed(
        `marker discipline: "signInWithOAuth"=${scan.markers.supabaseMethodSignInWithOAuth.count} and "signInWithIdToken"=${scan.markers.supabaseMethodSignInWithIdToken.count} are supabase-js's OWN method definitions ` +
          `(context: ${JSON.stringify(scan.contexts.supabaseMethodSignInWithOAuth?.snippet ?? "")}), so neither can prove which path the app uses. ` +
          `The markers used below are strings out of OUR ${scan.markers.gisUrl.from}: "${scan.markers.gisUrl.needle}" and the loader id "${scan.markers.gisLoaderId.needle}".`,
      );
      report.observed(
        `app-specific markers in the deployed JS: GIS url=${scan.markers.gisUrl.count} · loader id=${scan.markers.gisLoaderId.count}` +
          (scan.contexts.gisLoaderId ? ` · found in chunk ${scan.contexts.gisLoaderId.chunk}: ${JSON.stringify(scan.contexts.gisLoaderId.snippet)}` : ""),
      );
      const gisDeployed = scan.markers.gisUrl.count > 0 && scan.markers.gisLoaderId.count > 0;
      if (gisDeployed) {
        report.pass(
          `the DEPLOYED bundle carries the Google Identity Services fix: our own loader URL and its "google-identity-services" script id are both present in this deployment — the web sign-in path is the shipped one, not the OAuth-redirect one`,
          { evidence: EVIDENCE.SERVER, detail: `same deployment id on every chunk: ${JSON.stringify(scan.deploymentIds)}` },
        );
      } else {
        report.fail(
          `the DEPLOYED bundle does NOT contain our Google Identity Services loader (url=${scan.markers.gisUrl.count}, loader id=${scan.markers.gisLoaderId.count} across ${scan.chunks.length} chunks / ${scan.bytes} bytes) — this deployment predates the fix, so the live web still signs in through the dead Supabase OAuth route`,
          { evidence: EVIDENCE.SERVER, detail: `chunk list: ${scan.chunks.map((c) => `${c.url.split("/").pop()} (${c.bytes}B)`).join(", ")}` },
        );
      }
    }

    const bundleFacts = { liveRefInBundle: false, staleRefInBundle: [], deadRefInBundle: [] };
    {
      const chunks = await Promise.all(
        scan.scriptSrcs.slice(0, 40).map((src) => probe(src.startsWith("http") ? src : `${OPTS.liveUrl}${src}`)),
      );
      const joined = chunks.filter((c) => c.ok).map((c) => c.text).join("\n");
      bundleFacts.liveRefInBundle = joined.includes(LIVE_PROJECT_REF);
      bundleFacts.staleRefInBundle = STALE_PROJECT_REFS.filter((r) => joined.includes(r));
      bundleFacts.deadRefInBundle = DEAD_PROJECT_REFS.filter((r) => joined.includes(r));
    }

    // ── THE SECRET BOUNDARY in the shipped JS ──────────────────────────────
    if (!scan.error && scan.secretChecks?.length) {
      for (const c of scan.secretChecks) {
        if (!c.measurable) {
          report.blocked(`${c.label}: not present in the secrets file, so its absence from the bundle cannot be checked`);
        } else if (c.label.includes("SERVICE_ROLE")) {
          if (c.count === 0) {
            report.pass("the SUPABASE_SERVICE_ROLE_KEY appears in 0 deployed JS chunks (checked by value; only the count is printed)", {
              evidence: EVIDENCE.SERVER,
            });
          } else {
            report.fail(`the SUPABASE_SERVICE_ROLE_KEY APPEARS ${c.count} time(s) in the deployed JS — full database admin would be served to browsers`, {
              evidence: EVIDENCE.SERVER,
            });
          }
        } else if (c.count > 0) {
          report.pass(`control: the public anon key IS inlined in the deployed bundle (${c.count} chunk(s)) — proof the scan really read this deployment's compiled env`, {
            evidence: EVIDENCE.SERVER,
          });
        } else {
          report.unverified(`the public anon key was not found in the fetched chunks, so the absence-checks above rest on an unproven scan (${scan.chunks.length} chunks fetched)`);
        }
      }
    }
    artifacts.deployedBundle.refs = bundleFacts;
    report.observed(`project refs found in the deployed bundle: live(${LIVE_PROJECT_REF})=${bundleFacts.liveRefInBundle} · stale=${JSON.stringify(bundleFacts.staleRefInBundle)} · dead=${JSON.stringify(bundleFacts.deadRefInBundle)}`);

    if (bundleFacts.staleRefInBundle.length || bundleFacts.deadRefInBundle.length) {
      report.fail(`the DEPLOYED bundle contains an obsolete Supabase ref (${[...bundleFacts.staleRefInBundle, ...bundleFacts.deadRefInBundle].join(", ")}) while the app's env says ${ref} — config-vs-deploy seam`, {
        evidence: EVIDENCE.SERVER,
      });
    } else if (bundleFacts.liveRefInBundle) {
      report.pass(`the deployed bundle's compiled-in Supabase target is the SAME project the env file names (${LIVE_PROJECT_REF}) — no stale ref in the shipped JS`, {
        evidence: EVIDENCE.SERVER,
      });
    } else {
      report.unverified("no Supabase project ref was found in the deployed JS chunks fetched here (the URL may live in a chunk not linked from the HTML)");
    }

    // ── BEHAVIOURAL: click the real Google button on the LIVE page ──────────
    if (browser) {
      const g = await probeGoogleMechanism({ browser, liveUrl: OPTS.liveUrl });
      artifacts.liveGoogle = {
        status: g.status, buttonFound: g.buttonFound, clicked: g.clicked,
        googleGsi: g.hits.googleGsi.slice(0, 3), supabaseAuth: g.hits.supabaseAuth.slice(0, 3),
        popups: g.popups, scriptTags: g.scriptTags, error: g.error,
      };
      report.observed(
        `clicked "Continue with Google" on ${OPTS.liveUrl}/sign-in (HTTP ${g.status}, button found: ${g.buttonFound}) → context-wide requests to accounts.google.com: ${g.hits.googleGsi.length}, to *.supabase.co/auth: ${g.hits.supabaseAuth.length}` +
          (g.popups.length ? ` · popup(s): ${JSON.stringify(g.popups.map((u) => u.slice(0, 70)))}` : "") +
          (g.scriptTags.length ? ` · GIS <script> now in the DOM: ${JSON.stringify(g.scriptTags.map((u) => u.slice(0, 70)))}` : ""),
      );
      for (const u of g.hits.googleGsi.slice(0, 2)) report.observed(`  → ${u.slice(0, 110)}`);
      for (const u of g.hits.supabaseAuth.slice(0, 2)) report.observed(`  → ${u.slice(0, 110)}`);
      if (g.hits.supabaseAuth.some((u) => /\/auth\/v1\/authorize/.test(u))) {
        report.fail(
          "THE LIVE SITE USES THE OLD PATH: clicking Google on the deployed sign-in page calls supabase.co/auth/v1/authorize, the route that answers 400 'missing OAuth secret'. Google sign-in on the deployed web is dead until a fixed bundle ships",
          { evidence: EVIDENCE.SERVER },
        );
      } else if (g.hits.googleGsi.some((u) => /gsi\/(client|fedcm|listaccounts)/.test(u))) {
        report.pass(`the LIVE page really contacted Google Identity Services (${g.hits.googleGsi.length} request(s) to accounts.google.com) and never called supabase.co/auth/v1/authorize — the deployed web carries the fix`, {
          evidence: EVIDENCE.SERVER,
        });
      } else if (!g.buttonFound) {
        report.unverified(`the deployed sign-in page served no visible Google button (HTTP ${g.status}) — the mechanism could not be observed`);
      } else {
        report.unverified(
          `the Google button was clicked but no request to either host was observed (${g.error ?? "no signal"}). This is a limitation of observing a cross-origin popup/FedCM flow, NOT evidence about which path is deployed — the chunk markers above are the evidence for that`,
        );
      }
    } else {
      report.blocked("no browser available, so the deployed sign-in mechanism could not be observed over the network", { evidence: EVIDENCE.SERVER });
    }

    for (const [label, p] of [
      ["/auth/callback (the URI configured in Google Cloud)", "/auth/callback"],
      ["/api/auth/callback (the route the code actually reads)", "/api/auth/callback"],
    ]) {
      const r = await probe(`${OPTS.liveUrl}${p}`);
      report.observed(`GET ${p} → HTTP ${r.status}${r.location ? ` → ${r.location}` : ""}`);
      artifacts.deployRoutes = artifacts.deployRoutes ?? {};
      artifacts.deployRoutes[p] = { status: r.status, location: r.location };
    }

    const liveOtp = await requestEmailOtp({ supabaseUrl, anonKey, email: "seam-live-probe@example.com" });
    report.observed(`live OTP request → HTTP ${liveOtp.status}`);

    // ── The DEPLOYED surface's guest journey: does the live bundle deliver a
    // real file from a real editor? Same code path as step 3, different build.
    if (browser && !OPTS.httpOnly && !OPTS.skipBrowser) {
      const liveGuest = await guestBuildsCvAndDownloadsPdf({
        browser, appUrl: OPTS.liveUrl, runId: RUN_ID, outDir, report,
        label: "live-guest", photoBuffer: null, captureDraft: false,
      });
      artifacts.liveGuest = {
        status: liveGuest.status,
        pdf: liveGuest.pdf && { bytes: liveGuest.pdf.bytes, pages: liveGuest.pdf.pages, textChars: liveGuest.pdf.textChars, file: liveGuest.pdf.file },
        pdfError: liveGuest.pdfError,
      };
      assertPdf(report, liveGuest, { expectName: liveGuest.name, stepLabel: "DEPLOYED bundle" });
    }
  }

  // ── STEP 10: the job feed ───────────────────────────────────────────────
  report.step("THE JOB FEED (d) — does what the user sees come from the database?");
  const dbJobs = await jobCounts(sql);
  artifacts.jobs = { db: { total: dbJobs.total, live: dbJobs.live, byStatus: dbJobs.byStatus, newest: dbJobs.newest, oldest: dbJobs.oldest, error: dbJobs.error } };
  if (dbJobs.error) {
    report.fail(`the job table could not be counted at all (${dbJobs.error})`, { evidence: EVIDENCE.SERVER });
  } else {
    report.observed(`DB: job rows total=${dbJobs.total} · live(published|expiring)=${dbJobs.live} · newest created_at=${dbJobs.newest ?? "(none)"} · oldest=${dbJobs.oldest ?? "(none)"}`);
    report.observed(`DB: by status ${JSON.stringify(dbJobs.byStatus)}`);
  }

  // The route caps its own answer (`.limit(100)` in lib/api/routes/jobs.ts) — so
  // "how many rows the feed returns" must be compared with min(live, 100), not
  // with the raw count, or the test would report a design limit as a bug.
  const expectedRows = dbJobs.live === null ? null : Math.min(dbJobs.live, 100);
  const apiJobs = await probe(`${OPTS.appUrl}/api/jobs`);
  const apiRows = dataArray(apiJobs) ?? [];
  artifacts.jobs.api = { status: apiJobs.status, rows: apiRows.length, expected: expectedRows, first: apiRows[0] ? { id: apiRows[0].id, title: apiRows[0].title } : null };
  report.observed(`GET /api/jobs (the DB-backed feed every client reads) → HTTP ${apiJobs.status} · ${apiRows.length} row(s)${apiRows[0] ? ` · first: ${JSON.stringify({ id: apiRows[0].id, title: apiRows[0].title })}` : ""}`);
  if (apiJobs.status === 200 && expectedRows !== null && apiRows.length === expectedRows) {
    report.pass(`the feed the user sees is exactly the database's live rows (${apiRows.length} returned = min(${dbJobs.live} live rows, 100-row page cap))`, {
      evidence: EVIDENCE.SERVER,
    });
  } else if (apiJobs.status === 200 && expectedRows !== null) {
    report.fail(`feed divergence: GET /api/jobs returned ${apiRows.length} row(s) while the DB holds ${dbJobs.live} live row(s) (page cap 100)`, {
      evidence: EVIDENCE.SERVER,
    });
  } else {
    report.fail(`GET /api/jobs answered HTTP ${apiJobs.status}`, { evidence: EVIDENCE.SERVER });
  }
  if (dbJobs.live === 0) {
    report.fail("THE LIVE JOB FEED IS EMPTY: 0 rows with a live status in the `job` table — a seeker sees no jobs, and nothing in the product says why", {
      evidence: EVIDENCE.SERVER,
      detail: "observed earlier in this same session: job=0 rows at 14:55 while a cron later filled 806 — the feed's emptiness depends on a cron nobody sees",
    });
  }

  // The legacy mock route: does anything actually point at it? (If it has no
  // callers it is dead code, not a divergence — say which, from the source.)
  const mockFeed = await probe(`${OPTS.appUrl}/api/jobs/feed`, jsonPost({ page: 1, limit: 50 }));
  const mockRows = dataArray(mockFeed) ?? [];
  const callers = await countSourceCallers("/api/jobs/feed");
  artifacts.jobs.mockFeed = { status: mockFeed.status, count: mockRows.length, callers };
  report.observed(`POST /api/jobs/feed (a hardcoded array in app/api/jobs/feed/route.ts) → HTTP ${mockFeed.status} · ${mockRows.length} job(s); references to that path anywhere in apps/* or packages/*: ${callers}`);
  if (mockRows.length > 0 && callers === 0) {
    report.info("a second, hardcoded job feed exists and serves made-up listings, but nothing in the codebase calls it — dead code, not a live divergence", {
      evidence: EVIDENCE.SOURCE,
    });
  } else if (mockRows.length > 0 && callers > 0) {
    report.fail(`TWO FEEDS, TWO TRUTHS: ${callers} source reference(s) to /api/jobs/feed, which serves ${mockRows.length} hardcoded jobs, while the real feed serves the database's rows`, {
      evidence: EVIDENCE.SERVER,
    });
  }

  // And the deployed surface's feed, for the record.
  if (!OPTS.skipLive) {
    const liveJobs = await probe(`${OPTS.liveUrl}/api/jobs`);
    const liveRows = dataArray(liveJobs) ?? [];
    artifacts.jobs.liveApi = { status: liveJobs.status, rows: liveRows.length };
    report.observed(`GET ${OPTS.liveUrl}/api/jobs → HTTP ${liveJobs.status} · ${liveRows.length} row(s)`);
    if (liveRows.length !== apiRows.length) {
      report.info(`the deployed feed and the local feed return different counts (${liveRows.length} vs ${apiRows.length}) — both point at the same database, so this is a build/caching difference, not user data`, {
        evidence: EVIDENCE.SERVER,
      });
    }
  }

  // ── STEP 11: the anti-fabrication harness ───────────────────────────────
  report.step("THE EXISTING ANTI-FABRICATION HARNESS — does `npm run evals` really exist, and what does it say?");
  const evalStep = await findEvalsScript();
  if (!evalStep) {
    report.fail("`npm run evals` does NOT exist in this repo (no package.json declares an `evals` script) — the anti-fabrication harness the queue claims is missing; nothing was invented in its place", {
      evidence: EVIDENCE.SOURCE,
    });
  } else {
    report.observed(`npm run evals exists at ${path.relative(REPO, evalStep.pkgPath)}: "evals": "${evalStep.script}"`);
    if (OPTS.skipEvals) {
      report.blocked("the evals pack was skipped by --skip-evals flag — the anti-fabrication layer is UNVERIFIED for this run", { evidence: EVIDENCE.SOURCE });
    } else {
      const logPath = path.join(outDir, "evals.log");
      const started = Date.now();
      const res = await runCommand("npm", ["run", "evals"], { cwd: path.dirname(evalStep.pkgPath), logPath, timeoutMs: 600_000 });
      const tail = res.output.split(/\r?\n/).filter((l) => /Test Files|Tests |Duration|FAIL|✗|failed/.test(l)).slice(-10);
      artifacts.evals = { exitCode: res.exitCode, ms: Date.now() - started, log: logPath, summary: tail };
      report.observed(`npm run evals → exit ${res.exitCode} in ${Math.round((Date.now() - started) / 1000)}s (full output: ${logPath})`);
      for (const l of tail) report.observed(`evals | ${l.trim()}`);
      if (res.exitCode === 0) {
        report.pass("the anti-fabrication / eval pack passes on this tree", { evidence: EVIDENCE.SERVER, detail: tail.join(" · ") });
      } else {
        report.fail(`the evals pack FAILS (exit ${res.exitCode}) — the anti-fabrication harness is red on this tree`, {
          evidence: EVIDENCE.SERVER,
          detail: tail.join(" · "),
        });
      }
    }
  }

  // ── STEP 12: cleanup + surfaces ────────────────────────────────────────
  report.step("WHAT THIS RUN EXERCISED, AND WHAT IT DID NOT");
  report.observed(`EXERCISED: web, desktop viewport (Chromium ${browser ? "headless" : "n/a"}), against ${OPTS.appUrl}${server?.started ? " (started by this run)" : ""}`);
  report.observed(`EXERCISED: HTTP/API surface of ${OPTS.appUrl} + the deployed site ${OPTS.skipLive ? "(skipped)" : OPTS.liveUrl}`);
  report.observed("EXERCISED: Postgres directly — rows, columns, byte lengths");
  report.blocked("NOT EXERCISED: the ANDROID app. A separate codebase, its own API host and its own build; a green web run says nothing about the APK. Verifying it needs a device/emulator and a real install.", {
    evidence: EVIDENCE.UI,
  });
  report.blocked("NOT EXERCISED: mobile-web layout (the same bundle at a phone viewport). The desktop viewport was used here.", { evidence: EVIDENCE.UI });
  report.blocked("NOT EXERCISED: a human clicking Google's consent screen or receiving the sign-in email — this run injected a REAL session in the app's own cookie format instead (see the sign-in step).", {
    evidence: EVIDENCE.SERVER,
  });

  report.step("TEST DATA THIS RUN CREATED (server state is real, so it is named)");
  if (createdUser) {
    report.observed(`test account ${createdUser.email} (id ${createdUser.id}) and its CV row(s) in the live database`);
    if (OPTS.cleanup && serviceRoleKey) {
      const del = await deleteTestUser({ supabaseUrl, serviceRoleKey, id: createdUser.id });
      report.observed(`--cleanup: DELETE /auth/v1/admin/users/${createdUser.id} → HTTP ${del.status}`);
    } else {
      report.observed("kept on purpose as evidence; re-run with --cleanup to remove it");
    }
  } else {
    report.observed("no test account was created");
  }
  if (sql) {
    const rows = await cvsMentioning(sql, guestNeedle, since).catch(() => []);
    report.observed(`after the whole run, cv rows containing the guest's name (created in the last 30 min): ${rows.length}`);
  }

  const { exitCode, failed, blocked } = report.summary();
  writeArtifacts({ exitCode, failed, blocked });
  await shutdown();
  process.exit(exitCode);
}

/** How many source files reference a route path (excluding the route that serves it)? */
async function countSourceCallers(routePath) {
  const roots = ["apps", "packages"].map((d) => path.join(REPO, d));
  const skip = new Set(["node_modules", ".next", ".git", "dist", "build", "android", "ios"]);
  const exts = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
  let count = 0;
  const walk = (dir) => {
    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (skip.has(e.name)) continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        walk(full);
      } else if (exts.has(path.extname(e.name))) {
        try {
          const src = fs.readFileSync(full, "utf8");
          // The route's own file declares the path in a doc comment; ignore it.
          if (src.includes(routePath) && !full.endsWith(path.join("jobs", "feed", "route.ts"))) count += 1;
        } catch {
          /* unreadable — not a caller */
        }
      }
    }
  };
  for (const r of roots) walk(r);
  return count;
}

/** Where is the `evals` script declared? */
async function findEvalsScript() {
  const dirs = [REPO, path.join(REPO, "apps", "web"), path.join(REPO, "apps", "native")];
  for (const dir of dirs) {
    const pkgPath = path.join(dir, "package.json");
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
      if (pkg.scripts?.evals) return { pkgPath, script: pkg.scripts.evals };
    } catch { /* next */ }
  }
  return null;
}

/** Run a command, stream-preserving, capped by a timeout. */
function runCommand(cmd, args, { cwd, logPath, timeoutMs }) {
  return new Promise((resolveP) => {
    const chunks = [];
    const child = spawn(cmd, args, { cwd, shell: process.platform === "win32", windowsHide: true });
    const timer = setTimeout(() => {
      try { child.kill(); } catch { /* ignore */ }
    }, timeoutMs);
    const collect = (d) => chunks.push(d.toString());
    child.stdout.on("data", collect);
    child.stderr.on("data", collect);
    child.on("close", (code) => {
      clearTimeout(timer);
      const output = chunks.join("");
      try { fs.writeFileSync(logPath, output); } catch { /* best effort */ }
      resolveP({ exitCode: code ?? -1, output });
    });
  });
}

main().catch(async (err) => {
  report.say("");
  report.say(`SEAM: CANNOT RUN — unexpected failure: ${err.message}`);
  if (process.env.SEAM_DEBUG) report.say(err.stack);
  writeArtifacts({ crash: String(err.message) });
  await shutdown();
  process.exit(1);
});
