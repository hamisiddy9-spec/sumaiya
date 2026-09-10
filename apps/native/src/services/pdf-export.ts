/**
 * PDF export — renders a CV to HTML (shared with the in-app preview via
 * lib/cv-html) and prints it with expo-print.
 */
import * as Print from "expo-print";
import type { CV } from "@sumaiya/types";
import { cvToHtml, type CvHtmlOptions } from "../lib/cv-html";

export async function exportCVAsPDF(cv: CV, opts: CvHtmlOptions = {}): Promise<string> {
  const { uri } = await Print.printToFileAsync({ html: cvToHtml(cv, opts), base64: false });
  return uri;
}
