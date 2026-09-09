/**
 * Chat template previews (P3) — deterministic resolution of a template id into
 * everything an inline preview card needs, straight from the existing template
 * metadata (no images, no AI, no network).
 *
 * The visual is a tiny "document skeleton" per style — the same style field the
 * templates already carry — so the thumbnail is deterministic and shifts no
 * layout (fixed aspect box). Unknown ids resolve to null and callers fall back
 * to their existing plain-text chip (never crash).
 */
import { TEMPLATES, BUSINESS_CARD_TEMPLATES, LETTER_TEMPLATES } from "@/types";

export type TemplateDocType = "cv" | "business-card" | "letter";
export type TemplateThumbStyle = "sidebar" | "header" | "minimal" | "creative" | "classic" | "card" | "letter";

export interface TemplatePreviewInfo {
  id: string;
  name: string;
  description: string;
  previewColor: string;
  /** Which skeleton the thumbnail renders. */
  thumbStyle: TemplateThumbStyle;
  docType: TemplateDocType;
  /** Where "tap to open" goes — a page that actually exists for this id. */
  href: string;
}

export function resolveTemplatePreview(id: string | undefined | null): TemplatePreviewInfo | null {
  if (!id) return null;
  const cv = TEMPLATES.find((t) => t.id === id);
  if (cv) {
    return {
      id: cv.id,
      name: cv.name,
      description: cv.description,
      previewColor: cv.previewColor,
      thumbStyle: cv.style,
      docType: "cv",
      href: `/templates/${cv.id}`,
    };
  }
  const bc = BUSINESS_CARD_TEMPLATES.find((t) => t.id === id);
  if (bc) {
    return {
      id: bc.id,
      name: bc.name,
      description: bc.description,
      previewColor: bc.previewColor,
      thumbStyle: "card",
      docType: "business-card",
      href: "/editor/business-card/try",
    };
  }
  const lt = LETTER_TEMPLATES.find((t) => t.id === id);
  if (lt) {
    return {
      id: lt.id,
      name: lt.name,
      description: lt.description,
      previewColor: lt.previewColor,
      thumbStyle: "letter",
      docType: "letter",
      href: "/editor/letter/try",
    };
  }
  return null;
}
