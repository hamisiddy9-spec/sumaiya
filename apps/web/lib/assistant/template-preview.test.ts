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
