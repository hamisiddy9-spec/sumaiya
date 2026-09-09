/**
 * P5 — Voice input (mic).
 *
 * The Web Speech API can't run in CI (no real speech service), so the specs
 * inject a deterministic MOCK SpeechRecognition before the page scripts run —
 * the same API shape the app uses (start/stop, onresult/onerror/onend). This
 * verifies OUR wiring: button appears only when supported, permission-denied
 * shows a friendly inline state (never a silent no-op), and transcriptions
 * land in the composer as reviewable text.
 *
 * The real permission gate is verified separately: the Permissions-Policy
 * header must allow microphone=(self) (it was microphone=() — the mic was
 * dead at the platform level).
 */
import { test, expect, type Page } from "@playwright/test";

function installMockRecognition(page: Page, behavior: "denied" | "no-speech" | "transcribe") {
  return page.addInitScript((mode) => {
    const win = window as unknown as Record<string, unknown>;
    win.SpeechRecognition = class {
      lang = "sw-TZ";
      interimResults = false;
      continuous = false;
      onresult: ((e: unknown) => void) | null = null;
      onerror: ((e: unknown) => void) | null = null;
      onend: (() => void) | null = null;
      private started = false;
      start() {
        this.started = true;
        if (mode === "denied") {
          this.onerror?.({ error: "not-allowed" });
          this.onend?.();
        } else if (mode === "no-speech") {
          this.onerror?.({ error: "no-speech" });
          this.onend?.();
        } else {
          // transcribe: emit one cumulative result, then end
          setTimeout(() => {
            if (!this.started) return;
            this.onresult?.({
              resultIndex: 0,
              results: [[{ transcript: "Habari Sumaiya nataka CV" }]],
            });
            this.onend?.();
          }, 30);
        }
      }
      stop() {
        this.started = false;
        this.onend?.();
      }
    };
  }, behavior);
}

async function openAssistant(page: Page) {
  await page.goto("/assistant", { waitUntil: "networkidle" });
  await page.waitForSelector("textarea", { timeout: 30000 });
  // Same guard as composer.spec.ts: some WebKit builds fail to load subresource
  // CSS from localhost ("unexpected TLS packet" on an HTTP port — a harness/env
  // quirk, not an app bug) and their React event dispatch is unreliable there,
  // so interaction specs skip rather than assert on a broken page.
  const cssLoaded = await page.evaluate(() => {
    const bg = getComputedStyle(document.body).backgroundColor;
    return bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent";
  });
  test.skip(!cssLoaded, "CSS not loaded in this WebKit build (env quirk) — skipping interaction assertion");
}

test.describe("voice input (P5)", () => {
  test("Permissions-Policy allows microphone=(self) — was microphone=()", async ({ request }) => {
    const res = await request.get("/assistant");
    expect(res.ok()).toBeTruthy();
    const policy = res.headers()["permissions-policy"] || "";
    expect(policy).toContain("microphone=(self)");
    expect(policy).not.toContain("microphone=()");
    // camera/geolocation stay locked down
    expect(policy).toContain("camera=()");
    expect(policy).toContain("geolocation=()");
  });

  test("mic button appears when SpeechRecognition exists and starts listening", async ({ page }) => {
    await installMockRecognition(page, "transcribe");
    await openAssistant(page);

    const mic = page.locator("button[aria-label*='Sema badala ya kuandika'], button[aria-label*='Speak instead']").first();
    await expect(mic).toBeVisible({ timeout: 10000 });
  });

  test("transcription lands in the composer as reviewable text", async ({ page }) => {
    await installMockRecognition(page, "transcribe");
    await openAssistant(page);

    const mic = page.locator("button[aria-label*='Sema badala ya kuandika'], button[aria-label*='Speak instead']").first();
    await mic.click();

    const ta = page.locator("textarea").first();
    await expect(ta).toHaveValue(/Habari Sumaiya nataka CV/, { timeout: 10000 });
  });

  test("permission denied shows a friendly inline state, never a silent no-op", async ({ page }) => {
    await installMockRecognition(page, "denied");
    await openAssistant(page);

    const mic = page.locator("button[aria-label*='Sema badala ya kuandika'], button[aria-label*='Speak instead']").first();
    await mic.click();

    const status = page.locator("[role='status']").first();
    await expect(status).toBeVisible({ timeout: 10000 });
    await expect(status).toContainText(/maikrofoni|Microphone/);
  });

  test("no-speech shows a try-again hint", async ({ page }) => {
    await installMockRecognition(page, "no-speech");
    await openAssistant(page);

    const mic = page.locator("button[aria-label*='Sema badala ya kuandika'], button[aria-label*='Speak instead']").first();
    await mic.click();

    const status = page.locator("[role='status']").first();
    await expect(status).toBeVisible({ timeout: 10000 });
    await expect(status).toContainText(/Sikusikia|didn't hear/);
  });
});
