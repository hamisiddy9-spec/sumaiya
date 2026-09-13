/**
 * Chat template previews (P3) — deterministic resolution of a template id into
 * everything an inline preview card needs, straight from the existing template
 * metadata (no images, no AI, no network).
 *
 * The visual is a tiny "document skeleton" per style — the same style field the
 * templates already carry — so the thumbnail is deterministic and shifts no
 * layout (fixed aspect box). Unknown ids resolve to null and callers fall back
 * to their existing plain-text chip (never crash).
 *
 * `premium` is carried through so the assistant can SAY which designs are
 * Premium. This is advice, not a gate: naming a premium design to someone who
 * has not got it is a legitimate, honest upsell — what must never happen is the
 * assistant silently APPLYING one, which is the entitlement check's job (see
 * `template.premium` in lib/entitlements.ts), not this resolver's.
 */
import { TEMPLATES, BUSINESS_CARD_TEMPLATES, LETTER_TEMPLATES, isPremiumTemplate } from "@/types";

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
  /** True for the premium-tier designs, so the card can label them. */
  premium: boolean;
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
      premium: isPremiumTemplate(cv.id),
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
      premium: isPremiumTemplate(bc.id),
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
      premium: isPremiumTemplate(lt.id),
    };
  }
  return null;
}
