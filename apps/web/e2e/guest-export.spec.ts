/**
 * Guest export — the "no sign-up required to download" contract.
 *
 * This is the regression guard for the export wall: a SIGNED-OUT visitor on
 * /editor/cv/try used to get a sign-up modal instead of a file on every
 * download path (PDF, DOCX, .txt, Share). Each test below fails on revert,
 * because Playwright waits for a REAL download event that the wall prevented —
 * there is no assertion here that a mocked function was called.
 *
 * The account prompt must still exist, but AFTER delivery: it is asserted to
 * appear once the export has finished, and to be absent before.
 */
import { test, expect } from "@playwright/test";

// Headless Chromium has no OS share sheet, so the Share test drives the
// documented desktop fallback (share the file → download a real PDF).
test.use({ channel: "chrome", acceptDownloads: true });

test.describe("guest editor exports", () => {
  test.setTimeout(180_000);

  /** Fill the personal step and wait until React has genuinely hydrated — the
   *  preview renders from the same store the form writes to, so the typed name
   *  reaching it proves the download click below will actually run. */
  async function fillRealData(page: import("@playwright/test").Page) {
    const previewHas = (t: string) =>
      `(document.querySelector("#cv-preview")?.textContent || "").includes(${JSON.stringify(t)})`;
    let hydrated = false;
    for (let i = 0; i < 15 && !hydrated; i++) {
      await page.fill('input[placeholder="mf. Alex Johnson"]', "Neema Mwangi");
      try {
        await page.waitForFunction(previewHas("Neema Mwangi"), undefined, { timeout: 4000 });
        hydrated = true;
      } catch {
        await page.waitForTimeout(1000);
      }
    }
    expect(hydrated, "editor never hydrated (typed name did not reach the preview)").toBe(true);
    await page.fill('input[placeholder="Barua pepe"]', "neema.mwangi@example.com");
    await page.fill('textarea[placeholder^="Muhtasari mfupi"]', "Mhandisi wa programu mwenye uzoefu wa miaka sita.");
  }

  test("a signed-out visitor gets the PDF, then the account prompt", async ({ page }) => {
    await page.goto("/editor/cv/try", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Hali ya mgeni")).toBeVisible();

    await fillRealData(page);

    // No account wall before the click.
    await expect(page.getByRole("heading", { name: /Hifadhi CV yako mtandaoni/ })).toHaveCount(0);

    const download = page.waitForEvent("download");
    // Two "Pakua PDF" buttons exist (topbar split button + the mobile bottom
    // bar); the topbar one is first in the DOM and is what a desktop visitor sees.
    await page.getByRole("button", { name: /Pakua PDF/ }).first().click();
    const pdf = await download;

    expect(pdf.suggestedFilename()).toMatch(/\.pdf$/);
    const file = await pdf.path();
    const { statSync } = await import("node:fs");
    expect(statSync(file!).size).toBeGreaterThan(10_000);

    // Delivery confirmed on screen, then the prompt — in that order.
    await expect(page.getByText(/iko tayari!/)).toBeVisible();
    await page.getByRole("button", { name: /Nimemaliza/ }).click();
    await expect(page.getByRole("heading", { name: /Kuifungua kwenye simu yako pia\?/ })).toBeVisible();
    await expect(page.getByText(/imehifadhiwa kwenye kifaa hiki/)).toBeVisible();
  });

  test("plain-text and Word exports work for a guest", async ({ page }) => {
    await page.goto("/editor/cv/try", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Hali ya mgeni")).toBeVisible();
    await fillRealData(page);

    const menu = () => page.getByRole("button", { name: "Miundo mingine ya kupakua" });
    for (const [item, ext] of [["Maandishi (.txt)", /\.txt$/], ["Word (.docx)", /\.docx$/]] as const) {
      await menu().click();
      const download = page.waitForEvent("download");
      await page.getByRole("button", { name: item }).click();
      const got = await download;
      expect(got.suggestedFilename()).toMatch(ext);
      // Each successful export offers the account — never blocks it.
      await expect(page.getByRole("heading", { name: /Kuifungua kwenye simu yako pia\?/ })).toBeVisible();
      await page.mouse.click(6, 6); // dismiss the prompt
    }
  });

  test("Share falls back to a real file where the OS has no share sheet", async ({ page }) => {
    await page.goto("/editor/cv/try", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Hali ya mgeni")).toBeVisible();
    await fillRealData(page);

    // The documented desktop case ("most desktops"): no file-sharing support.
    await page.evaluate(() => {
      Object.defineProperty(navigator, "share", { value: undefined, configurable: true });
      Object.defineProperty(navigator, "canShare", { value: undefined, configurable: true });
    });

    await page.getByRole("button", { name: "Miundo mingine ya kupakua" }).click();
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: /Shiriki faili/ }).click();
    const pdf = await download;
    expect(pdf.suggestedFilename()).toMatch(/\.pdf$/);
  });
});
