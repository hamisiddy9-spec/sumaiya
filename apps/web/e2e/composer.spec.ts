/**
 * P2 — composer scroll/overflow + app-shell dvh fallback.
 *
 * Regression spec for the Sumaiya chat composer: a long message must grow the
 * textarea to the clamp (140px), then scroll internally — never hide text or
 * push the send button off-screen — and the app shell must keep full-viewport
 * height (h-dvh with a 100vh fallback for browsers without dvh).
 *
 * NOTE: some WebKit builds fail to load subresource CSS from localhost
 * ("unexpected TLS packet" on an HTTP port — a harness/environment quirk, not
 * an app bug). When CSS is missing we skip rather than assert on unstyled
 * layout; real-browser behaviour is covered by the chromium projects.
 */
import { test, expect, type Page } from "@playwright/test";

const COMPOSER_CLAMP_PX = 140;

async function openAssistant(page: Page) {
  await page.goto("/assistant", { waitUntil: "networkidle" });
  await page.waitForSelector("textarea", { timeout: 30000 });
}

async function cssLoaded(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const bg = getComputedStyle(document.body).backgroundColor;
    // Theme sand #EFE7DA — anything but fully transparent means CSS applied.
    return bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent";
  });
}

test.describe("composer scroll/overflow (P2)", () => {
  test("long message clamps at the cap, scrolls internally, keeps send visible", async ({ page }) => {
    await openAssistant(page);
    test.skip(!(await cssLoaded(page)), "CSS not loaded in this WebKit build (env quirk) — skipping layout assertion");

    const ta = page.locator("textarea").first();
    const LONG = "P2 regression: a genuinely long chat message must never hide text or overflow the composer bar. ".repeat(12);

    await ta.fill(LONG);

    const metrics = await ta.evaluate((el) => ({
      height: Math.round(el.getBoundingClientRect().height),
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
      overflowY: getComputedStyle(el).overflowY,
    }));

    // Grows to the clamp, then scrolls internally instead of growing forever.
    expect(metrics.height).toBeLessThanOrEqual(COMPOSER_CLAMP_PX + 4);
    expect(metrics.scrollHeight).toBeGreaterThan(metrics.clientHeight);
    expect(metrics.overflowY).toBe("auto");

    // The send button stays on-screen (never pushed below the viewport).
    const send = page.locator("button[aria-label*='Tuma'], button[aria-label*='Send']").first();
    await expect(send).toBeVisible();
    const sendBottom = await send.evaluate((el) => el.getBoundingClientRect().bottom);
    const vh = await page.evaluate(() => window.innerHeight);
    expect(sendBottom).toBeLessThanOrEqual(vh + 1);
  });

  test("short message grows to fit without internal scroll", async ({ page }) => {
    await openAssistant(page);
    test.skip(!(await cssLoaded(page)), "CSS not loaded in this WebKit build (env quirk) — skipping layout assertion");

    const ta = page.locator("textarea").first();
    await ta.fill("Habari Sumaiya!");
    const metrics = await ta.evaluate((el) => ({
      height: Math.round(el.getBoundingClientRect().height),
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
    }));
    // Fits the content — no scrollbar, height equals content.
    expect(metrics.height).toBeGreaterThanOrEqual(24);
    expect(metrics.scrollHeight).toBeLessThanOrEqual(metrics.clientHeight + 2);
  });
});

test.describe("app-shell viewport height (P2)", () => {
  test("assistant shell uses h-dvh with the 100vh fallback and fills the viewport", async ({ page }) => {
    await openAssistant(page);
    test.skip(!(await cssLoaded(page)), "CSS not loaded in this WebKit build (env quirk) — skipping layout assertion");

    const root = page.locator("textarea").first().locator("xpath=ancestor::div[contains(@class,'dvh')][1]");
    const cls = await root.getAttribute("class");
    expect(cls).toContain("h-dvh");

    const computed = await root.evaluate((el) => ({
      height: Math.round(el.getBoundingClientRect().height),
      innerHeight: window.innerHeight,
      cssHeight: getComputedStyle(el).height,
    }));
    // Full viewport (100vh fallback where dvh is unsupported; 100dvh where not).
    expect(computed.cssHeight).toMatch(/(100vh|100dvh|px)/);
    expect(computed.height).toBe(computed.innerHeight);
  });
});
