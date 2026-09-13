import { describe, expect, it } from "vitest";
import { resolveTemplatePreview } from "./template-preview";

describe("resolveTemplatePreview", () => {
  it("resolves a known CV template with its real metadata and detail-page href", () => {
    const info = resolveTemplatePreview("nakuru");
    expect(info).not.toBeNull();
    expect(info!.name).toBe("Nakuru");
    expect(info!.description.length).toBeGreaterThan(0);
    expect(info!.previewColor).toBe("#DA4A1C");
    expect(info!.thumbStyle).toBe("sidebar");
    expect(info!.docType).toBe("cv");
    expect(info!.href).toBe("/templates/nakuru");
  });

  it("resolves a popular template with a creative skeleton", () => {
    const info = resolveTemplatePreview("zanzibar");
    expect(info!.thumbStyle).toBe("creative");
    expect(info!.href).toBe("/templates/zanzibar");
  });

  it("resolves business-card templates to the card editor", () => {
    const info = resolveTemplatePreview("zege-card");
    expect(info).not.toBeNull();
    expect(info!.docType).toBe("business-card");
    expect(info!.thumbStyle).toBe("card");
    expect(info!.href).toBe("/editor/business-card/try");
  });

  it("resolves letter templates to the letter editor", () => {
    const info = resolveTemplatePreview("formal");
    expect(info).not.toBeNull();
    expect(info!.docType).toBe("letter");
    expect(info!.thumbStyle).toBe("letter");
    expect(info!.href).toBe("/editor/letter/try");
  });

  it("returns null for an unknown id (callers fall back to the plain chip)", () => {
    expect(resolveTemplatePreview("no-such-template")).toBeNull();
    expect(resolveTemplatePreview("")).toBeNull();
    expect(resolveTemplatePreview(undefined)).toBeNull();
    expect(resolveTemplatePreview(null)).toBeNull();
  });

  it("is fully deterministic — same id always yields the same info", () => {
    const a = resolveTemplatePreview("executive-one");
    const b = resolveTemplatePreview("executive-one");
    expect(a).toEqual(b);
  });
});

// The assistant recommends designs in chat. It must be able to say which are
// Premium (advice), while never being the thing that hands one over (that is
// `template.premium` in lib/entitlements.ts). These pin the information half.
describe("resolveTemplatePreview — premium tier", () => {
  it("flags the curated premium flagships", () => {
    for (const id of ["coral", "kioo", "malachite", "nuru", "pemba", "rift", "zahabu"]) {
      const info = resolveTemplatePreview(id);
      expect(info, `${id} should resolve`).not.toBeNull();
      expect(info!.premium, `${id} should be premium`).toBe(true);
    }
  });

  it("does not flag a free template", () => {
    expect(resolveTemplatePreview("nakuru")!.premium).toBe(false);
  });

  it("never reports premium for an unknown id (it resolves to null instead)", () => {
    expect(resolveTemplatePreview("not-a-real-template")).toBeNull();
  });

  it("carries the flag on non-CV doc types too", () => {
    // Business cards and letters share the same id space and the same gate, so
    // the flag must be answered for them, not just for CVs.
    const bc = resolveTemplatePreview("zege-card");
    const lt = resolveTemplatePreview("formal");
    expect(bc!.premium).toBe(false);
    expect(lt!.premium).toBe(false);
  });
});
