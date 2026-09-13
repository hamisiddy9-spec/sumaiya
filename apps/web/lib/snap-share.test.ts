// Unit tests for the D4 client-safe share helpers — deterministic, node-only.

import { describe, it, expect } from "vitest";
import {
  SNAP_SHARE_PATH,
  sanitizeShareTitle,
  isPlausibleShareToken,
  buildShareUrl,
  snapShareText,
} from "@/lib/snap-share";

describe("sanitizeShareTitle", () => {
  it("trims and collapses whitespace", () => {
    expect(sanitizeShareTitle("  Senior   Software Engineer  ")).toBe("Senior Software Engineer");
  });

  it("strips URLs and email addresses (PII guard)", () => {
    expect(sanitizeShareTitle("Sales https://evil.example/x lead")).toBe("Sales lead");
    expect(sanitizeShareTitle("Contact me@example.com now")).toBe("Contact now");
  });

  it("drops control characters and keeps letters/numbers/basic punctuation", () => {
    expect(sanitizeShareTitle("Sales\u0000Manager\u0007Lead")).toBe("Sales Manager Lead");
    expect(sanitizeShareTitle("Data Analyst (BI) — KPI & SQL, 2026")).toBe("Data Analyst (BI) — KPI & SQL, 2026");
  });

  it("returns empty for empty/whitespace/absent input", () => {
    expect(sanitizeShareTitle("")).toBe("");
    expect(sanitizeShareTitle("   ")).toBe("");
    expect(sanitizeShareTitle(undefined)).toBe("");
    expect(sanitizeShareTitle(null)).toBe("");
  });

  it("caps the title at 80 chars", () => {
    const long = "x".repeat(200);
    expect(sanitizeShareTitle(long).length).toBeLessThanOrEqual(80);
  });
});

describe("isPlausibleShareToken", () => {
  it("accepts a minted-shaped token (payload.signature)", () => {
    expect(isPlausibleShareToken("eyJ2IjoxfQ.sig-sig_sig")).toBe(true);
  });

  it("rejects empty / absent tokens", () => {
    expect(isPlausibleShareToken("")).toBe(false);
    expect(isPlausibleShareToken(undefined)).toBe(false);
    expect(isPlausibleShareToken(null)).toBe(false);
  });

  it("rejects malformed shapes", () => {
    expect(isPlausibleShareToken("nodot")).toBe(false);
    expect(isPlausibleShareToken("a.b.c")).toBe(false); // two dots
    expect(isPlausibleShareToken(".sig")).toBe(false);
    expect(isPlausibleShareToken("payload.")).toBe(false);
    expect(isPlausibleShareToken("pay load.sig")).toBe(false); // space
    expect(isPlausibleShareToken("payload/sig")).toBe(false); // slash
  });

  it("rejects oversized tokens", () => {
    expect(isPlausibleShareToken(`${"a".repeat(600)}.${"b".repeat(600)}`)).toBe(false);
  });
});

describe("buildShareUrl", () => {
  it("builds the absolute share URL", () => {
    expect(buildShareUrl("https://sumaiya.app", "abc.def")).toBe(
      "https://sumaiya.app/snap/share/abc.def",
    );
  });

  it("strips a trailing slash from the origin", () => {
    expect(buildShareUrl("https://sumaiya.app/", "abc.def")).toBe(
      "https://sumaiya.app/snap/share/abc.def",
    );
  });

  it("returns null when the origin is missing or non-http", () => {
    expect(buildShareUrl("", "abc.def")).toBe(null);
    expect(buildShareUrl(undefined, "abc.def")).toBe(null);
    expect(buildShareUrl("ftp://files.example", "abc.def")).toBe(null);
  });

  it("returns null when the token is unusable — never fabricates a link", () => {
    expect(buildShareUrl("https://sumaiya.app", "")).toBe(null);
    expect(buildShareUrl("https://sumaiya.app", undefined)).toBe(null);
    expect(buildShareUrl("https://sumaiya.app", "not-a-token")).toBe(null);
  });
});

describe("snapShareText", () => {
  it("builds English text with the real job title", () => {
    expect(snapShareText(false, "Sales Manager")).toBe(
      "My CV, tailored for Sales Manager — made free with Sumaiya.",
    );
  });

  it("builds Swahili text with the real job title", () => {
    expect(snapShareText(true, "Sales Manager")).toBe(
      "CV yangu imelengwa kwa Sales Manager — imetengenezwa bure kwa Sumaiya.",
    );
  });

  it("falls back to the generic line when there is no title (never invents one)", () => {
    expect(snapShareText(false, "")).toBe("My tailored CV — made free with Sumaiya.");
    expect(snapShareText(false, "   ")).toBe("My tailored CV — made free with Sumaiya.");
    expect(snapShareText(false, undefined)).toBe("My tailored CV — made free with Sumaiya.");
    expect(snapShareText(true, "")).toBe("CV yangu lengwa — imetengenezwa bure kwa Sumaiya.");
  });

  it("sanitizes PII out of the title before it enters share text", () => {
    expect(snapShareText(false, "Sales https://evil.example/x lead")).toBe(
      "My CV, tailored for Sales lead — made free with Sumaiya.",
    );
  });
});

describe("SNAP_SHARE_PATH", () => {
  it("is the public share route", () => {
    expect(SNAP_SHARE_PATH).toBe("/snap/share/");
  });
});
