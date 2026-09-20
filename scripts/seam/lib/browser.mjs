/**
 * SEAM TEST — the browser half: a guest really builds a CV and really downloads
 * a PDF, in a real Chromium, on the real page.
 *
 * ============================================================================
 * ANTISEAM DISCIPLINE (read before trusting anything this file reports)
 * ============================================================================
 * TWO SURFACES EXIST:
 *   1. web — desktop browser + mobile web (same bundle, different viewport)
 *   2. the Android app (a separate codebase, a separate API host, its own build)
 * ONE PASSING PROVES NOTHING ABOUT THE OTHER. This module exercises surface 1
 * in a DESKTOP viewport only. It says nothing about:
 *   - the Android app (no emulator/device is driven here),
 *   - mobile-web layout (the same code at 390px; not exercised unless the run
 *     says "mobile viewport"),
 *   - any surface whose bundle is older than the working tree (a deployed web
 *     bundle is checked separately, by hash/marker, in the deployed-bundle step).
 * Every claim this module emits is tagged with the surface it came from.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { pdfFacts, containsAll } from "./pdf.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "..", "..", "..");
const req = createRequire(path.join(REPO, "package.json"));

export const SURFACE = "web (desktop viewport, Chromium)";

/**
 * A real JPEG, drawn in the same browser that will upload it. Hand-written byte
 * arrays and "fake" images are avoided on purpose: this one has to survive the
 * app's own decode → centre-crop → re-encode pipeline.
 */
export async function makePhotoBuffer(browser, { size = 900 } = {}) {
  const page = await browser.newPage();
  const dataUrl = await page.evaluate(
    async ({ size }) => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      const grad = ctx.createLinearGradient(0, 0, size, size);
      grad.addColorStop(0, "#DA4A1C");
      grad.addColorStop(1, "#1B1B1F");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = "#F5EFE6";
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#111";
      ctx.font = `${Math.round(size / 12)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("SEAM", size / 2, size / 2 + size / 40);
      return canvas.toDataURL("image/jpeg", 0.9);
    },
    { size },
  );
  await page.close();
  return Buffer.from(dataUrl.split(",")[1], "base64");
}

export function createOutDir() {
  const dir = path.join(process.env.LOCALAPPDATA || process.cwd(), "Temp", "sumaiya-seam");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/**
 * The four typed fields. Selectors are derived from the editor's own
 * placeholders (read out of apps/web/components/editor/cv-editor-client.tsx),
 * and each one is tried in both languages so the run works on either locale.
 */
const FIELDS = [
  { key: "fullName", selectors: ['input[placeholder*="Alex Johnson"]'] },
  { key: "jobTitle", selectors: ['input[placeholder*="Product Designer"]', 'input[placeholder*="Mbunifu Bidhaa"]'] },
  { key: "summary", selectors: ['textarea[placeholder*="Brief overview"]', 'textarea[placeholder*="Muhtasari mfupi"]'] },
];

async function fillField(page, field, value) {
  for (const sel of field.selectors) {
    const loc = page.locator(sel).first();
    if ((await loc.count()) > 0 && (await loc.isVisible().catch(() => false))) {
      await loc.fill(value, { timeout: 8000 });
      return sel;
    }
  }
  return null;
}

/** The PDF control, whichever toolbar the viewport exposes. */
export async function downloadControl(page) {
  const candidates = [
    'button:visible:has-text("Pakua PDF")',
    'button:visible:has-text("Download PDF")',
  ];
  for (const sel of candidates) {
    const loc = page.locator(sel).first();
    if ((await loc.count()) > 0) return { loc, sel };
  }
  return { loc: null, sel: null };
}

/**
 * Wait for the export control to exist. Calling downloadControl() immediately
 * after a navigation reported "no control" on a page that simply had not
 * hydrated yet — a false failure is as bad as a false pass, so the journey
 * waits for the control (and says so when it never appears).
 */
export async function waitForDownloadControl(page, timeoutMs = 45_000) {
  const sel = 'button:visible:has-text("Pakua PDF"), button:visible:has-text("Download PDF")';
  try {
    await page.locator(sel).first().waitFor({ state: "visible", timeout: timeoutMs });
  } catch {
    return { loc: null, sel: null };
  }
  return downloadControl(page);
}

/**
 * Run the guest half of the journey.
 *
 * @returns facts about what was OBSERVED (never conclusions):
 *   status/http, editor url, filled fields, the guest draft as the BROWSER holds
 *   it, and facts about the PDF file that came out.
 */
export async function guestBuildsCvAndDownloadsPdf({
  browser,
  appUrl,
  runId,
  outDir,
  report,
  viewport = { width: 1440, height: 1000 },
  label,
  photoBuffer,
  captureDraft = true,
}) {
  const context = await browser.newContext({
    acceptDownloads: true,
    viewport,
    locale: "en-GB",
  });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("pageerror", (e) => consoleErrors.push(`pageerror: ${String(e).slice(0, 160)}`));
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(`console: ${m.text().slice(0, 160)}`);
  });
  const requests = [];
  page.on("request", (r) => {
    // Keep the CV API bodies: they are the evidence for what the CLIENT actually
    // put on the wire (a payload shape bug is invisible in a screenshot).
    if (/\/api\/cv/.test(r.url()) && r.method() !== "GET") {
      let body = "";
      try {
        body = (r.postData() ?? "").slice(0, 160);
      } catch {
        body = "(unreadable)";
      }
      requests.push({ method: r.method(), url: r.url(), body });
    } else if (/\/api\/cv|supabase\.co\/auth|accounts\.google\.com/.test(r.url())) {
      requests.push({ method: r.method(), url: r.url() });
    }
  });

  const name = `Seam ${runId.slice(0, 6)}`;
  const title = "Warehouse Supervisor";
  const summary = `Seam test run ${runId}: five years running warehouse stock control in Dar es Salaam.`;

  const facts = { surface: SURFACE, label, name, title, status: null, finalUrl: null };

  const res = await page.goto(`${appUrl}/editor/cv/try`, { waitUntil: "domcontentloaded", timeout: 90_000 });
  await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});
  facts.status = res?.status() ?? null;
  facts.finalUrl = page.url();
  report.observed(`guest editor: ${appUrl}/editor/cv/try → HTTP ${facts.status} · landed on ${facts.finalUrl}`);

  // The editor is a client component; wait for the name field to exist.
  await page.locator('input[placeholder*="Alex Johnson"]').first().waitFor({ timeout: 45_000 });

  const filled = {};
  for (const f of FIELDS) {
    const value = f.key === "fullName" ? name : f.key === "jobTitle" ? title : summary;
    const sel = await fillField(page, f, value);
    filled[f.key] = sel ? { selector: sel, value } : null;
  }
  facts.filled = filled;
  report.observed(`typed into the editor: ${Object.entries(filled).map(([k, v]) => `${k}=${v ? JSON.stringify(v.value.slice(0, 40)) : "NOT FOUND"}`).join(" · ")}`);

  // Photo — the real pipeline (validate → decode → crop → JPEG re-encode).
  let photoSet = null;
  if (photoBuffer) {
    const input = page.locator('input[type="file"][accept*="image"]').first();
    if ((await input.count()) > 0) {
      await input.setInputFiles({
        name: `seam-photo-${runId.slice(0, 4)}.jpg`,
        mimeType: "image/jpeg",
        buffer: photoBuffer,
      });
      await page.waitForTimeout(2500);
      photoSet = true;
    } else {
      photoSet = false;
    }
  }
  facts.photoUploaded = photoSet;
  report.observed(`photo upload: ${photoSet === null ? "not attempted" : photoSet ? "source JPEG handed to the editor's file input" : "no image file input found"}`);

  // Let the 2s autosave debounce flush, then read the draft AS THE BROWSER HAS IT.
  await page.waitForTimeout(3500);
  if (captureDraft) {
    const raw = await page.evaluate(() => localStorage.getItem("sumaiya-guest-cv"));
    facts.draftRawBytes = raw ? raw.length : 0;
    if (raw) {
      try {
        facts.draft = JSON.parse(raw);
        const p = facts.draft.cv?.personal ?? {};
        facts.draftName = p.fullName ?? null;
        facts.draftPhotoChars = p.photo ? p.photo.length : 0;
      } catch (err) {
        facts.draftParseError = err.message;
      }
    }
  }

  // The PDF — a real download event with real bytes.
  const { loc, sel } = await downloadControl(page);
  facts.downloadSelector = sel;
  if (!loc) {
    facts.pdfError = "no visible Pakua PDF / Download PDF control";
  } else {
    try {
      const [download] = await Promise.all([
        page.waitForEvent("download", { timeout: 120_000 }),
        loc.click({ timeout: 20_000 }),
      ]);
      const file = path.join(outDir, `${label}-${runId.slice(0, 6)}.pdf`);
      await download.saveAs(file);
      facts.suggestedFilename = download.suggestedFilename();
      facts.pdf = await pdfFacts(file);
    } catch (err) {
      facts.pdfError = `download failed: ${String(err).split("\n")[0].slice(0, 200)}`;
    }
  }

  // Screen-only context: what the guest is offered after delivery. Recorded as a
  // NOTE, never as an assertion — the assertion about delivery is the file.
  try {
    const text = (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, " ");
    facts.signUpPromptVisible = /sign in|sign up|open it on your phone|ingia|jisajili/i.test(text);
    facts.bodyTextSample = text.slice(0, 220);
  } catch {
    /* ignore */
  }

  facts.consoleErrors = consoleErrors.slice(0, 6);
  facts.apiRequests = requests;
  facts.surfaceRequests = {
    supabaseAuth: requests.filter((r) => r.url?.includes("supabase.co/auth")).length,
    googleGsi: requests.filter((r) => r.url?.includes("accounts.google.com")).length,
    cvWrites: requests.filter((r) => r.method !== "GET" && r.url?.includes("/api/cv")).length,
  };

  if (captureDraft) {
    facts.context = context;
    facts.page = page;
  } else {
    await context.close();
  }
  return facts;
}

/**
 * BEHAVIOURAL probe of a DEPLOYED sign-in page: which host does the Google
 * button really talk to?
 *
 * Grepping a minified bundle for "signInWithOAuth" is worthless — the Supabase
 * SDK ships that method name itself, so the string is present either way (it
 * produced exactly that false positive on the first run of this test). What
 * cannot lie is the network: the OLD path POSTs to `*.supabase.co/auth/v1/
 * authorize`; the SHIPPED path loads `accounts.google.com/gsi/client`. So the
 * probe clicks the real button on the real page and records who got called.
 */
export async function probeGoogleMechanism({ browser, liveUrl, timeoutMs = 25_000 }) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: "en-GB" });
  const page = await context.newPage();
  const hits = { googleGsi: [], supabaseAuth: [] };
  // Listen at the CONTEXT, not the page: GIS can open its account chooser in a
  // new window, and requests made by that window are invisible to a page-level
  // listener (this is why an earlier version of this probe recorded "no signal"
  // for a page that had in fact contacted Google).
  const record = (url) => {
    if (url.includes("accounts.google.com")) hits.googleGsi.push(url);
    else if (/supabase\.co\/auth/.test(url)) hits.supabaseAuth.push(url);
  };
  context.on("request", (r) => record(r.url()));
  const out = { buttonFound: false, clicked: false, hits, error: null, finalUrl: null, popups: [], scriptTags: [] };
  try {
    const res = await page.goto(`${liveUrl}/sign-in`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    out.status = res?.status() ?? null;
    const btn = page
      .locator('button:visible:has-text("Continue with Google"), button:visible:has-text("Endelea na Google")')
      .first();
    out.buttonFound = (await btn.count()) > 0;
    if (out.buttonFound) {
      await btn.click({ timeout: 10_000 }).catch((e) => {
        out.error = String(e).split("\n")[0].slice(0, 140);
      });
      out.clicked = true;
      await page.waitForTimeout(9000);
      out.scriptTags = await page
        .evaluate(() => Array.from(document.querySelectorAll("script[src]")).map((s) => s.src).filter((s) => /google/.test(s)))
        .catch(() => []);
      out.popups = context.pages().map((p) => p.url()).filter((u) => u !== page.url());
    }
    out.finalUrl = page.url();
  } catch (err) {
    out.error = String(err).split("\n")[0].slice(0, 200);
  }
  await context.close();
  return out;
}

/** Assertions about the PDF — the file, not the screen. */
export function assertPdf(report, facts, { expectName, stepLabel }) {
  if (!facts.pdf) {
    report.fail(`no PDF was produced by the guest download (${stepLabel})`, {
      evidence: "real-bytes",
      detail: facts.pdfError ?? "unknown",
    });
    return false;
  }
  const p = facts.pdf;
  let ok = true;
  ok = report.pass(`PDF delivered: ${p.bytes} bytes · ${p.pages} page(s) · ${p.pageSizes.join(",")} · sha256:${p.sha256}`, {
    evidence: "real-bytes",
    detail: `file: ${p.file} · header "${p.header}" · %%EOF:${p.eofMarker}`,
  }) && ok;
  if (p.header !== "%PDF-") {
    ok = report.fail(`the downloaded file is not a PDF (header "${p.header}")`, { evidence: "real-bytes" }) && ok;
  }
  if (p.pages < 1) {
    ok = report.fail(`the PDF has ${p.pages} pages`, { evidence: "real-bytes" }) && ok;
  }
  if (expectName) {
    const needles = containsAll(p.text, [expectName]);
    const found = needles[0].found;
    if (found) {
      report.pass(`the PDF's text layer contains the name typed in the editor ("${expectName}") — ATS-readable, not a screenshot`, {
        evidence: "real-bytes",
        detail: `extracted ${p.textChars} chars: "${p.text.slice(0, 120)}…"`,
      });
    } else {
      ok = report.fail(`the PDF's text layer does NOT contain "${expectName}" (extracted ${p.textChars} chars: "${p.text.slice(0, 120)}")`, {
        evidence: "real-bytes",
      }) && ok;
    }
  }
  return ok;
}
