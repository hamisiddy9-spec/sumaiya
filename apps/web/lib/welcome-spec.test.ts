/**
 * The welcome screen's type must not drift again.
 *
 * This class has now been reported twice: the web landing rendered the greeting
 * as a hand-picked, small, NON-BOLD line while the spec's greeting is 29/800/-0.6,
 * and it fused the greeting and the language line into a "Karibu · Welcome"
 * word-pair that the spec explicitly rejects ("one word, the app's own greeting,
 * with the bilingual line under it doing the explaining"). Two "Karibu"s at two
 * weights on two web screens is exactly what "this will make our products feel
 * vibe coded" describes.
 *
 * The guard has three parts, so the drift cannot come back through any door:
 *   1. the web spec (lib/welcome-spec.ts) holds the EXACT spec numbers — 29 is
 *      not 30, 15 is not 16, 15.5 is not 16, -0.6 is not -0.5;
 *   2. the NATIVE onboarding screen still writes those same numbers, so the two
 *      repos cannot diverge (the same cross-screen source-guard pattern
 *      `mark-well-tokens.test.ts` uses on the native side);
 *   3. the landing actually reads the spec and does not re-hand-roll the greeting
 *      with Tailwind scale steps.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  WELCOME_GREETING,
  WELCOME_BODY,
  WELCOME_WORD,
  WELCOME_BODY_TEXT,
  MARK_WELL,
  wellTint,
  SLIDE_TITLE,
  SLIDE_BODY,
  CHOICE_TITLE,
  CHOICE_HINT,
  TERTIARY_ACTION,
} from "@/lib/welcome-spec";

const here = dirname(fileURLToPath(import.meta.url));
const NATIVE = join(here, "../../../apps/native/src/screens/onboarding-screen.tsx");
const LANDING = join(here, "../app/[locale]/(marketing)/home-page-client.tsx");

describe("welcome spec — the exact numbers, never a rounded scale step", () => {
  it("the greeting is 29 / 800 / -0.6", () => {
    expect(WELCOME_GREETING).toEqual({ fontSize: 29, fontWeight: 800, letterSpacing: -0.6 });
  });

  it("the greeting body is 15 / line-height 22 / max-width 290", () => {
    expect(WELCOME_BODY).toEqual({ fontSize: 15, lineHeight: 22, maxWidth: 290 });
  });

  it("the greeting is ONE word — no separator dot, no second word", () => {
    expect(WELCOME_WORD).toBe("Karibu");
    expect(WELCOME_WORD).not.toMatch(/·/);
  });

  it("the body is the bilingual pair, Swahili first, on two lines", () => {
    expect(WELCOME_BODY_TEXT).toBe("Mimi ni Sumaiya. Chagua lugha yako.\nI'm Sumaiya. Choose your language.");
  });

  it("the well is the house MARK_WELL — 128 / 40 / 72, accent + 14", () => {
    expect(MARK_WELL).toEqual({ size: 128, radius: 40, mark: 72, tint: "14" });
    expect(wellTint("#DA4A1C")).toBe("#DA4A1C14");
    expect(MARK_WELL.radius / MARK_WELL.size).toBeCloseTo(0.3125, 4);
    expect(MARK_WELL.mark / MARK_WELL.size).toBeCloseTo(0.5625, 4);
  });

  it("the slide, choice and tertiary numbers are the spec's too", () => {
    expect(SLIDE_TITLE).toEqual({ fontSize: 26, fontWeight: 800, letterSpacing: -0.5 });
    expect(SLIDE_BODY).toEqual({ fontSize: 15.5, lineHeight: 23, maxWidth: 320 });
    expect(CHOICE_TITLE).toEqual({ fontSize: 18, fontWeight: 800 });
    expect(CHOICE_HINT).toEqual({ fontSize: 13 });
    expect(TERTIARY_ACTION).toEqual({ fontSize: 14, fontWeight: 700 });
  });
});

describe("the web spec is pinned to the native screen (cross-repo drift guard)", () => {
  const native = readFileSync(NATIVE, "utf8");

  it("native WelcomeStage still writes 29 / 800 / -0.6 and 15 / 22 / 290", () => {
    expect(native).toContain('fontSize: 29, fontWeight: "800", letterSpacing: -0.6');
    expect(native).toContain('fontSize: 15, textAlign: "center", lineHeight: 22, maxWidth: 290');
  });

  it("native Slide / choice / skip numbers still match the web spec", () => {
    expect(native).toContain('fontSize: 26, fontWeight: "800"');
    expect(native).toContain('fontSize: 15.5, textAlign: "center", lineHeight: 23, maxWidth: 320');
    expect(native).toContain('fontSize: 18, fontWeight: "800"');
    expect(native).toContain("fontSize: 13");
    expect(native).toContain('fontSize: 14, fontWeight: "700"');
  });

  it("native still rejects the separator dot in the welcome comment", () => {
    // The reason for the rule, kept where the rule is written.
    expect(native).toContain("No separator dot");
  });
});

describe("the landing cannot re-hand-roll the greeting", () => {
  const landing = readFileSync(LANDING, "utf8");

  it("renders the greeting through the spec", () => {
    expect(landing).toContain("@/lib/welcome-spec");
    expect(landing).toMatch(/WELCOME_GREETING\./);
    expect(landing).toMatch(/WELCOME_BODY\./);
    expect(landing).toContain("WELCOME_WORD");
  });

  it("does not invent the greeting with Tailwind steps or a word-pair", () => {
    // The old, felt-wrong treatment: a 13px muted line reading "Karibu · Welcome".
    expect(landing).not.toMatch(/·\s*\{lang === "sw" \? "Welcome"/);
    expect(landing).not.toMatch(/text-text-muted\/60/);
    expect(landing).not.toMatch(/text-\[13px\][^\n]*Karibu/);
  });
});
