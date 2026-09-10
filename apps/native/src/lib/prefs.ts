import { getSecureItem, setSecureItem } from "@sumaiya/utils";
import { CV_TEMPLATES, type CvTemplateId } from "./cv-html";

/**
 * Small, device-local preferences that aren't part of the career profile.
 */
const TEMPLATE_KEY = "sumaiya_default_template";

export async function getDefaultTemplate(): Promise<CvTemplateId> {
  try {
    const v = await getSecureItem(TEMPLATE_KEY);
    return CV_TEMPLATES.some((t) => t.id === v) ? (v as CvTemplateId) : "classic";
  } catch {
    return "classic";
  }
}

export async function setDefaultTemplate(id: CvTemplateId): Promise<void> {
  await setSecureItem(TEMPLATE_KEY, id).catch(() => {});
}
