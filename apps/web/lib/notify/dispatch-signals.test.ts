import { describe, it, expect } from "vitest";
import { notifKey, deepLink, webDeepLink } from "./dispatch-signals";
import type { Signal } from "@/lib/assistant/signals";

function sig(overrides: Partial<Signal> = {}): Signal {
  return {
    type: "cv.tailor",
    tool: "cv.tailor",
    priority: 90,
    title: { en: "T", sw: "T" },
    detail: { en: "D", sw: "D" },
    trigger: "x",
    ...overrides,
  };
}

describe("notifKey", () => {
  it("collapses a jobId-bearing signal to type+jobId, ignoring the trigger's day-count", () => {
    const a = sig({ jobId: "j1", trigger: "applicationDeadline 2026-09-20 (in 5d)" });
    const b = sig({ jobId: "j1", trigger: "applicationDeadline 2026-09-20 (in 4d)" });
    expect(notifKey(a)).toBe(notifKey(b)); // same key across days — cooldown governs re-send, not the trigger text
  });

  it("distinguishes different jobs of the same type", () => {
    expect(notifKey(sig({ jobId: "j1" }))).not.toBe(notifKey(sig({ jobId: "j2" })));
  });

  it("falls back to applicationId, then a fixed profile key", () => {
    expect(notifKey(sig({ type: "application.followUp", applicationId: "a1" }))).toBe("application.followUp|a1");
    expect(notifKey(sig({ type: "confirmations" }))).toBe("confirmations|profile");
  });
});

describe("deepLink", () => {
  it("routes every signal type somewhere concrete, never a raw fallback for a known type", () => {
    const types: Signal["type"][] = ["confirmations", "cv.tailor", "coverLetter.generate", "ats.check", "career.skillGap", "application.followUp", "job.newMatch"];
    for (const type of types) {
      expect(deepLink(sig({ type })).screen).toBeTruthy();
    }
  });

  it("job.newMatch and cv.tailor both land on Jobs", () => {
    expect(deepLink(sig({ type: "job.newMatch" })).screen).toBe("Jobs");
    expect(deepLink(sig({ type: "cv.tailor" })).screen).toBe("Jobs");
  });
});

describe("webDeepLink", () => {
  it("returns a real path (never empty/undefined) for every signal type — a web push notification must never fall back to the bare homepage", () => {
    const types: Signal["type"][] = ["confirmations", "cv.tailor", "coverLetter.generate", "ats.check", "career.skillGap", "application.followUp", "job.newMatch"];
    for (const type of types) {
      const url = webDeepLink(sig({ type }));
      expect(url).toBeTruthy();
      expect(url.startsWith("/")).toBe(true);
    }
  });
});
