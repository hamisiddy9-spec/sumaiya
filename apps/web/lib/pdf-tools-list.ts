import { Image, Combine, Scissors, RotateCw, Stamp, ListOrdered, FileMinus, FileText, type LucideIcon } from "lucide-react";
import { translations } from "@/lib/i18n/translations";

/** Lightweight PDF-tool list for the marketing surfaces (landing band + nav
 *  dropdown). The full tool config (endpoints, accepts, options) lives in the
 *  tools page; this only needs id + icon + a localized name key. Each links to
 *  `/tools#tool-<id>`, which the tools page reads on load to open that tool. */
export interface PdfToolLink {
  id: string;
  nameKey: keyof typeof translations.en.tools;
  Icon: LucideIcon;
}

export const PDF_TOOL_LINKS: PdfToolLink[] = [
  { id: "image-to-pdf", nameKey: "imageToPdf", Icon: Image },
  { id: "merge", nameKey: "merge", Icon: Combine },
  { id: "split", nameKey: "split", Icon: Scissors },
  { id: "rotate", nameKey: "rotate", Icon: RotateCw },
  { id: "watermark", nameKey: "watermark", Icon: Stamp },
  { id: "page-numbers", nameKey: "pageNumbers", Icon: ListOrdered },
  { id: "delete-pages", nameKey: "deletePages", Icon: FileMinus },
  { id: "extract-text", nameKey: "extractText", Icon: FileText },
];

export const pdfToolHref = (id: string) => `/tools#tool-${id}`;
