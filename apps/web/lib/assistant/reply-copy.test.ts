import { describe, expect, it } from "vitest";
import { SWAHILI_COPY_FIXES, fixSwahiliReplyCopy, hasSwahiliCopyDefect } from "./reply-copy";

describe("Swahili reply copy guard", () => {
  it("translates the measured English leak out of a Swahili reply", () => {
    // Quoted from the device run (docs/QA-NATIVE-1625-2026-09-21.md §2.3): the
    // literal "customer service" sat inside an otherwise Swahili reply.
    const raw = "Nimeona CV yako ya customer service — nzuri sana. Tuendelee?";
    const out = fixSwahiliReplyCopy(raw, "sw");
    expect(out).toBe("Nimeona CV yako ya huduma kwa mteja — nzuri sana. Tuendelee?");
    expect(out).not.toMatch(/customer service/i);
  });

  it("removes ATS jargon from Swahili and names the outcome instead", () => {
    expect(fixSwahiliReplyCopy("Nikuonyeshe alama ya ATS yako?", "sw")).toBe("Nikuonyeshe alama ya CV yako?");
    expect(fixSwahiliReplyCopy("Tunaweza kagua ATS kwa CV yako.", "sw")).toBe("Tunaweza kukagua CV kwa CV yako.");
    expect(fixSwahiliReplyCopy("Nikupe ATS check?", "sw")).toBe("Nikupe ukaguzi wa CV?");
    expect(fixSwahiliReplyCopy('Unamaanisha "ATS", mfumo wa kuchuja CV?', "sw")).not.toMatch(/ATS/);
  });

  it("uses the house word for employer screening criteria", () => {
    expect(fixSwahiliReplyCopy("Waajiri wanaangalia vichujio vya waajiri.", "sw")).toBe(
      "Waajiri wanaangalia vigezo vya waajiri.",
    );
  });

  it("keeps the user's own CV in the second person", () => {
    expect(fixSwahiliReplyCopy("Fungua CV yangu uone.", "sw")).toBe("Fungua CV yako uone.");
    expect(fixSwahiliReplyCopy("Nimeboresha CV yangu na kuongeza ujuzi.", "sw")).toBe(
      "Nimeboresha CV yako na kuongeza ujuzi.",
    );
    expect(fixSwahiliReplyCopy("Hii ni wasifu wangu.", "sw")).toBe("Hii ni wasifu wako.");
  });

  it("leaves English replies alone — ATS and 'customer service' are correct there", () => {
    const en = "I can run an ATS check on your CV for that customer service role.";
    expect(fixSwahiliReplyCopy(en, "en")).toBe(en);
    expect(hasSwahiliCopyDefect(en)).toBe(true); // the defect detector still sees it
  });

  it("does not mangle correct Swahili", () => {
    const clean =
      "Muhtasari wa CV yako: msaidizi wa huduma kwa mteja mwenye uzoefu wa miaka mitatu. Ningependa kuongeza ujuzi wako wa kompyuta.";
    expect(fixSwahiliReplyCopy(clean, "sw")).toBe(clean);
  });

  it("is idempotent — a fixed reply is already clean", () => {
    const once = fixSwahiliReplyCopy("CV yangu na customer service na ATS", "sw");
    expect(fixSwahiliReplyCopy(once, "sw")).toBe(once);
    expect(hasSwahiliCopyDefect(once)).toBe(false);
  });

  it("exports every fix with a stated reason (no unexplained rewrites)", () => {
    expect(SWAHILI_COPY_FIXES.length).toBeGreaterThan(5);
    for (const f of SWAHILI_COPY_FIXES) expect(f.why.length, f.to).toBeGreaterThan(10);
  });
});
