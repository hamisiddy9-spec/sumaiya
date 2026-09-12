/**
 * Regression guards for the defensive fixes applied after the resilience audit.
 *
 * These all share one shape: the server (or a partial/older payload) omitted a
 * field the TypeScript type declares as required, and the render path trusted
 * the type. Missing data therefore became a crash rather than a gap.
 *
 * Where a guard is a pure expression we can pin it directly; the JSX-level ones
 * are covered by typechecking. This file pins `signalText`, which was the one
 * that took a whole screen down during render.
 */
import { signalText, signalAction } from "./signal-actions";
import type { MobileSignal } from "@sumaiya/api-client";

function signal(over: Record<string, unknown> = {}): MobileSignal {
  return {
    type: "cv.tailor",
    title: { en: "Tailor your CV", sw: "Lenga CV yako" },
    detail: { en: "A job matches", sw: "Kazi inalingana" },
    ...over,
  } as unknown as MobileSignal;
}

describe("signalText is defensive about partial payloads", () => {
  it("returns the right language when both are present", () => {
    const s = signal();
    expect(signalText(s, "sw")).toEqual({ title: "Lenga CV yako", detail: "Kazi inalingana" });
    expect(signalText(s, "en")).toEqual({ title: "Tailor your CV", detail: "A job matches" });
  });

  it("falls back to English when the language key is missing", () => {
    const s = signal({ title: { en: "Only English" }, detail: { en: "Only English" } });
    expect(signalText(s, "sw").title).toBe("Only English");
  });

  it("does not throw when `detail` is absent entirely", () => {
    // This is the real bug: `detail` is typed as required but the server can
    // omit it, and `s.detail[lang]` threw inside render — killing the screen.
    const s = signal({ detail: undefined });
    expect(() => signalText(s, "sw")).not.toThrow();
    expect(signalText(s, "sw").detail).toBe("");
  });

  it("does not throw when `title` is absent entirely", () => {
    const s = signal({ title: undefined });
    expect(() => signalText(s, "en")).not.toThrow();
    expect(signalText(s, "en").title).toBe("");
  });

  it("still resolves an action for an unknown signal type", () => {
    const s = signal({ type: "something.new" });
    expect(signalAction(s)).toBeTruthy();
  });
});
