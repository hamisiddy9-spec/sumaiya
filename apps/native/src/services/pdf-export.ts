/**
 * PDF export — renders a CV to HTML (shared with the in-app preview via
 * lib/cv-html) and prints it with expo-print, then gives the file a real name
 * so it doesn't land in WhatsApp / email / Drive as "a1b2c3d4-....pdf".
 *
 * The letter path did NOT get that treatment, which is how a real cover letter
 * went out as `54abcd12-d5ef-47ae-8fb4-cae2774c3185.pdf`. Anything a person
 * sends to an employer gets a name that reads like a document.
 */
import * as Print from "expo-print";
import * as FileSystem from "expo-file-system/legacy";
import type { CV } from "@sumaiya/types";
import { cvToHtml, type CvHtmlOptions } from "../lib/cv-html";

/** Keeps a suggested filename safe on every platform and short enough to read. */
function safeFileName(base: string, fallback: string): string {
  const clean = base
    // Slashes become dashes rather than vanishing: "m/f/d" should read
    // "m-f-d", not "mfd".
    .replace(/[/\\]/g, "-")
    .replace(/[?%*:|"<>]/g, "") // the rest no filesystem wants
    .replace(/-+/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
  return `${clean || fallback}.pdf`;
}

/** "Amina Yusuf" + "Storekeeper" -> "Amina Yusuf - Storekeeper CV.pdf" */
function cvFileName(cv: CV): string {
  const p = (cv.data?.personalInfo ?? {}) as { fullName?: string; headline?: string; jobTitle?: string };
  const name = (p.fullName ?? "").trim();
  const role = (p.headline ?? p.jobTitle ?? "").trim();
  const base = [name, role].filter(Boolean).join(" - ") || cv.title || "My";
  return safeFileName(`${base} CV`, "My CV");
}

/**
 * "Cover letter - Platform Engineer (m/f/d) - Ecoplanet Green Operations.pdf".
 * The job title leads because that is what the person is searching for in their
 * files a week later.
 */
export function letterFileName(jobTitle?: string | null, company?: string | null): string {
  const parts = ["Cover letter", (jobTitle ?? "").trim(), (company ?? "").trim()].filter(Boolean);
  return safeFileName(parts.join(" - "), "Cover letter");
}

/**
 * Moves a freshly printed PDF to a readable name in the cache directory.
 * Best-effort by design: if the copy fails the caller shares the original file
 * rather than losing the export entirely — an ugly name beats no document.
 */
export async function renamePdf(uri: string, fileName: string): Promise<string> {
  try {
    const dir = (FileSystem.cacheDirectory ?? "").replace(/\/?$/, "/");
    const dest = `${dir}${fileName}`;
    await FileSystem.deleteAsync(dest, { idempotent: true });
    await FileSystem.copyAsync({ from: uri, to: dest });
    return dest;
  } catch {
    return uri;
  }
}

export async function exportCVAsPDF(cv: CV, opts: CvHtmlOptions = {}): Promise<string> {
  const { uri } = await Print.printToFileAsync({ html: cvToHtml(cv, opts), base64: false });
  return renamePdf(uri, cvFileName(cv));
}
