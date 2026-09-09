/**
 * Critical-flow E2E — the standing verification harness.
 *
 * Runs against a LOCAL PRODUCTION BUILD (next build && next start) on :3000
 * across 4 projects: chromium-desktop, chromium-pixel7 (Android Chrome),
 * webkit-iphone13 (iOS Safari engine proxy), firefox-desktop.
 *
 * Covers: guest CV build → non-JD guard (no bogus 0% card) → PDF export on
 * WebKit (the iOS-Safari proxy — the PR-3 money moment) → offline SW →
 * install prompt never over CTAs. Visual regression snapshots for the
 * layout/contrast class of bugs.
 */
import { test, expect, Page } from "@playwright/test";

const MATCH_CARD_TEXT = /Unalingana kwa \d+%|You match this job \d+%/;

async function forceInstallPrompt(page: Page) {
  await page.evaluate(() => {
    window.dispatchEvent(new Event("beforeinstallprompt"));
  });
}

test.describe("shell integrity", () => {
  test("home loads with brand content, no fatal console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page).toHaveTitle(/Sumaiya/);
    await expect(page.locator("body")).not.toBeEmpty();
    expect(errors.filter((e) => !e.includes("ResizeObserver"))).toEqual([]);
  });

  test("install prompt is never over bottom CTAs", async ({ page }) => {
    // Path gate: /assistant (chat input CTA) must never show the banner.
    await page.goto("/assistant", { waitUntil: "networkidle" });
    await forceInstallPrompt(page);
    await page.waitForTimeout(800);
    await expect(page.getByText(/Sakinisha Sumaiya|Install Sumaiya/)).toHaveCount(0);

    // Home: banner may show, but it must clear the fixed bottom chrome on
    // mobile (tab bar ~4rem) and never cover content on desktop.
    await page.goto("/", { waitUntil: "networkidle" });
    await forceInstallPrompt(page);
    const banner = page.getByText(/Sakinisha Sumaiya|Install Sumaiya/).first();
    await expect(banner).toBeVisible({ timeout: 5000 });
    const bottom = await banner.evaluate((el) => {
      const r = el.closest("div[class*='fixed']")?.getBoundingClientRect();
      return r ? window.innerHeight - r.bottom : -1;
    });
    const viewport = page.viewportSize()!;
    const minClearance = viewport.width < 768 ? 64 : 12;
    expect(bottom).toBeGreaterThanOrEqual(minClearance);
  });
});

test.describe("guest CV build (no auth)", () => {
  test("editor loads, editing the name updates the live A4 preview", async ({ page }) => {
    await page.goto("/editor/cv/try", { waitUntil: "networkidle" });
    await expect(page.getByText(/Kihariri|Editor|CV/).first()).toBeVisible({ timeout: 20000 });
    // The name field's label has no htmlFor — locate by the placeholder
    // ("mf. Alex Johnson" / "e.g. Alex Johnson").
    const nameField = page.getByPlaceholder(/Alex Johnson/).first();
    await expect(nameField).toBeVisible({ timeout: 20000 });
    await nameField.fill("E2E Test Mwanzilishi");
    await expect(page.locator("body")).toContainText("E2E Test Mwanzilishi", { timeout: 10000 });
  });
});

test.describe("non-JD guard — never a bogus match card", () => {
  test("typing a conversational sentence produces no match card", async ({ page }) => {
    await page.goto("/assistant", { waitUntil: "networkidle" });
    const chat = page.locator("textarea").first();
    await expect(chat).toBeVisible({ timeout: 20000 });
    await chat.fill("nahitaji mchumba");
    await chat.press("Enter");
    // Give the turn time to resolve (AI reply OR graceful error — either way
    // there must be NO match card built from a conversational sentence).
    await page.waitForTimeout(12000);
    expect(await page.locator("body").innerText()).not.toMatch(MATCH_CARD_TEXT);
  });
});

// ── PDF export — platform-specific paths (PR-3) ──────────────────────────────
// NOTE: the guest editor gates exports behind signup BY DESIGN (the funnel),
// so the REAL export paths are proven in e2e/auth-journey.spec.ts with an
// authenticated session. Here we assert the guest funnel itself.

test.describe("PDF export: guest funnel", () => {
  test("guest Download opens the signup funnel (by design)", async ({ page }) => {
    await page.goto("/editor/cv/try", { waitUntil: "networkidle" });
    const downloadBtn = page.locator('[title*="Pakua PDF"], [title*="Download PDF"]').first();
    await expect(downloadBtn).toBeVisible({ timeout: 30000 });
    await downloadBtn.click();
    await expect(page.getByRole("heading", { name: /Pakua CV yako|Download your CV/ })).toBeVisible({ timeout: 10000 });
  });
});

// ── Offline service worker (PR-2) ────────────────────────────────────────────

test.describe("offline service worker", () => {
  test("precache, offline shell, branded offline page, /api never cached", async ({ page, context }, testInfo) => {
    test.skip(!testInfo.project.name.startsWith("chromium"), "offline flow verified on Chromium");
    // Feature gate: the CACHING SW lands in PR-2. The no-op sw.js exists on
    // master, so gate on the actual caching marker (su-cache) in the source.
    const swBody = await page.request.get("/sw.js").then((r) => r.text()).catch(() => "");
    test.skip(!swBody.includes("su-cache"), "caching service worker not present on this branch");

    await page.goto("/", { waitUntil: "networkidle" });
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.waitForTimeout(1200);

    const swState = await page.evaluate(async () => {
      const keys = await caches.keys();
      const c = await caches.open(keys.find((k) => k.startsWith("su-cache")) || "");
      const precached = c ? (await c.keys()).map((r) => new URL(r.url).pathname) : [];
      return { caches: keys, precached };
    });
    expect(swState.caches.some((k) => /^su-cache-v\d+$/.test(k))).toBeTruthy();
    expect(swState.precached).toContain("/offline.html");

    await page.goto("/editor/cv/try", { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);

    await context.setOffline(true);
    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(1500);
    expect(await page.title()).toContain("Sumaiya");

    await page.goto("/never-visited-verify-path", { waitUntil: "domcontentloaded", timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(1000);
    expect(await page.locator("body").innerText()).toMatch(/You're offline|Huna mtandao/);

    await page.goto("/editor/cv/try", { waitUntil: "domcontentloaded", timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(1500);
    expect((await page.locator("body").innerText()).length).toBeGreaterThan(20);

    await context.setOffline(false);
    const apiLeak = await page.evaluate(async () => {
      const keys = await caches.keys();
      const leak: string[] = [];
      for (const k of keys) {
        const c = await caches.open(k);
        leak.push(...(await c.keys()).map((r) => r.url).filter((u) => u.includes("/api/")));
      }
      return leak;
    });
    expect(apiLeak).toEqual([]);
  });
});

// ── Visual regression — key pages (Chromium only; baselines committed) ───────

test.describe("visual regression", () => {
  test("home", async ({ page }, testInfo) => {
    test.skip(!testInfo.project.name.startsWith("chromium"), "snapshots are Chromium-only");
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page).toHaveScreenshot(`home-${page.viewportSize()!.width < 768 ? "mobile" : "desktop"}.png`);
  });

  test("templates", async ({ page }, testInfo) => {
    test.skip(!testInfo.project.name.startsWith("chromium"), "snapshots are Chromium-only");
    await page.goto("/templates", { waitUntil: "networkidle" });
    await expect(page).toHaveScreenshot(`templates-${page.viewportSize()!.width < 768 ? "mobile" : "desktop"}.png`);
  });

  test("pricing", async ({ page }, testInfo) => {
    test.skip(!testInfo.project.name.startsWith("chromium"), "snapshots are Chromium-only");
    await page.goto("/pricing", { waitUntil: "networkidle" });
    await expect(page).toHaveScreenshot(`pricing-${page.viewportSize()!.width < 768 ? "mobile" : "desktop"}.png`);
  });

  test("assistant", async ({ page }, testInfo) => {
    test.skip(!testInfo.project.name.startsWith("chromium"), "snapshots are Chromium-only");
    await page.goto("/assistant", { waitUntil: "networkidle" });
    await expect(page).toHaveScreenshot(`assistant-${page.viewportSize()!.width < 768 ? "mobile" : "desktop"}.png`);
  });
});
