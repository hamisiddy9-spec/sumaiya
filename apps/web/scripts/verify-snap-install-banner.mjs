/**
 * Does the "Install Sumaiya" banner sit on top of a page's primary CTA?
 *
 * Written after walking /snap in a real browser and finding the banner rendered
 * over the one button the page exists for ("Snap ombi langu"). The install
 * banner is `fixed bottom-*` with `z-[100]`, so wherever a page puts its main
 * action near the bottom of a phone screen, the first tap a visitor makes can
 * land on the banner instead of the button — the same click-steal that got
 * /assistant and /editor added to the blocked list.
 *
 * The banner is gated by a pure function (lib/pwa/install-prompt-logic.ts) whose
 * unit test only proves the regex list. This proves the thing users feel: is the
 * CTA actually covered, measured in the DOM at a phone viewport.
 *
 * Run against production (before) and a local build (after):
 *   node scripts/verify-snap-install-banner.mjs https://sumaiya.app
 *   node scripts/verify-snap-install-banner.mjs http://localhost:3000
 *
 * `beforeinstallprompt` only fires on a real installable PWA, so it is
 * dispatched synthetically — the component's gate is what's under test, not the
 * browser's installability heuristics.
 */
import { chromium } from "@playwright/test";

const base = process.argv[2] ?? "http://localhost:3000";

/** Pages with a primary CTA near the bottom, plus a control where the banner is allowed. */
const CASES = [
  // The gate exists to keep the banner off conversion surfaces; /snap is the
  // Snap-to-Apply entry point and was missing from it.
  { path: "/snap", cta: /Snap ombi langu/i, expectBanner: false },
  { path: "/assistant", cta: /Tuma/i, expectBanner: false },
  // Informational only: this asserts nothing about the app. It is here so the
  // run proves the harness CAN see the banner when the gate allows it — i.e.
  // that a "hidden" result above means "gated", not "my selector is broken".
  { path: "/", cta: null, expectBanner: null },
];

const BANNER = /Sakinisha Sumaiya|Install Sumaiya/;

/** The banner is `bottom-*` on phones and `md:bottom-4` from md up — measure both. */
const VIEWPORTS = [
  { name: "phone 390x844", width: 390, height: 844, isMobile: true },
  { name: "desktop 1280x800", width: 1280, height: 800, isMobile: false },
];

const browser = await chromium.launch();
let failures = 0;

for (const vp of VIEWPORTS) {
  console.log(`\n── ${vp.name}`);
  for (const c of CASES) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      isMobile: vp.isMobile,
      hasTouch: vp.isMobile,
      locale: "sw-TZ",
    });
    const page = await ctx.newPage();
    await page.goto(base + c.path, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);

    // Fire the install event the banner waits for.
    await page.evaluate(() => {
      const e = new Event("beforeinstallprompt");
      e.prompt = () => Promise.resolve();
      e.userChoice = Promise.resolve({ outcome: "dismissed" });
      window.dispatchEvent(e);
    });
    await page.waitForTimeout(800);

    const bannerVisible = await page
      .getByText(BANNER)
      .first()
      .isVisible()
      .catch(() => false);

    const bannerText = await page
      .locator("div")
      .filter({ hasText: BANNER })
      .last()
      .boundingBox()
      .catch(() => null);

    let overlap = null;
    if (c.cta) {
      const box = await page.locator("button", { hasText: c.cta }).first().boundingBox().catch(() => null);
      if (box && bannerText) {
        const x = Math.max(0, Math.min(box.x + box.width, bannerText.x + bannerText.width) - Math.max(box.x, bannerText.x));
        const y = Math.max(0, Math.min(box.y + box.height, bannerText.y + bannerText.height) - Math.max(box.y, bannerText.y));
        overlap = Math.round(x * y);
      }
    }

    const verdict =
      c.expectBanner === null ? "INFO" : bannerVisible === c.expectBanner ? "PASS" : "FAIL";
    if (verdict === "FAIL") failures++;
    console.log(
      `  ${verdict}  ${c.path}  banner=${bannerVisible}` +
        (c.expectBanner === null ? " (informational)" : ` (expected ${c.expectBanner})`) +
        (c.cta ? `  ctaCovered=${overlap === null ? "n/a" : overlap + "px²"}` : ""),
    );
    await ctx.close();
  }
}

await browser.close();
console.log(failures ? `\n${failures} case(s) failed` : "\nall cases passed");
process.exit(failures ? 1 : 0);
