import { defineConfig, devices } from "@playwright/test";

/**
 * Standing cross-browser E2E harness — the "green WebKit E2E + Lighthouse"
 * bar that lets Claude auto-merge without waiting for Hamis's phone.
 *
 * Projects:
 *  - chromium-desktop  — baseline Chrome
 *  - chromium-pixel7   — Android Chrome (Pixel 7 emulation)
 *  - webkit-iphone13   — iOS Safari proxy (WebKit engine + iPhone 13 UA)
 *  - firefox-desktop   — Firefox
 *
 * Requires a LOCAL PRODUCTION BUILD on :3000 (next build && next start).
 * Run:  npx playwright test
 * Snapshot baseline (visual regression):  npx playwright test --update-snapshots
 */
export default defineConfig({
  testDir: ".",
  testMatch: "e2e/**/*.spec.ts",
  timeout: 90_000,
  expect: {
    timeout: 15_000,
    // Visual regression: flag anything that shifts >2% of pixels. Baselines
    // are committed under e2e/visual-baselines/ and refreshed deliberately.
    toHaveScreenshot: { maxDiffPixelRatio: 0.02, animations: "disabled" },
  },
  fullyParallel: false,
  workers: process.env.VERIFY_WORKERS ? Number(process.env.VERIFY_WORKERS) : 1,
  reporter: [["list"], ["html", { open: "never", outputFolder: "e2e/reports" }]],
  use: {
    baseURL: process.env.VERIFY_BASE_URL || "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium-desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    {
      name: "chromium-pixel7",
      use: {
        ...devices["Pixel 7"],
        userAgent:
          "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
      },
    },
    {
      name: "webkit-iphone13",
      use: { ...devices["iPhone 13"] },
    },
    {
      name: "firefox-desktop",
      use: { ...devices["Desktop Firefox"], viewport: { width: 1440, height: 900 } },
    },
  ],
});
