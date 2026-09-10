/**
 * PDF export — renders a CV to HTML (shared with the in-app preview via
 * lib/cv-html) and prints it with expo-print, then gives the file a real name
 * so it doesn't land in WhatsApp / email / Drive as "a1b2c3d4-....pdf".
 */
import * as Print from "expo-print";
import * as FileSystem from "expo-file-system/legacy";
import type { CV } from "@sumaiya/types";
import { cvToHtml, type CvHtmlOptions } from "../lib/cv-html";

/** "Amina Yusuf" + "Storekeeper" -> "Amina Yusuf - Storekeeper CV.pdf" */
function cvFileName(cv: CV): string {
  const p = (cv.data?.personalInfo ?? {}) as { fullName?: string; headline?: string; jobTitle?: string };
  const name = (p.fullName ?? "").trim();
  const role = (p.headline ?? p.jobTitle ?? "").trim();
  const base = [name, role].filter(Boolean).join(" - ") || cv.title || "My";
  const clean = base
    .replace(/[/\\?%*:|"<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
  return `${clean} CV.pdf`;
}

export async function exportCVAsPDF(cv: CV, opts: CvHtmlOptions = {}): Promise<string> {
  const { uri } = await Print.printToFileAsync({ html: cvToHtml(cv, opts), base64: false });

  // Rename to a human filename. Best-effort — if the copy fails, share the
  // print output as-is rather than lose the export.
  try {
    const dir = (FileSystem.cacheDirectory ?? "").replace(/\/?$/, "/");
    const dest = `${dir}${cvFileName(cv)}`;
    await FileSystem.deleteAsync(dest, { idempotent: true });
    await FileSystem.copyAsync({ from: uri, to: dest });
    return dest;
  } catch {
    return uri;
  }
}
