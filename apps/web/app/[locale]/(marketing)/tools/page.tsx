import type { Metadata } from "next";
import ToolsClient from "./tools-client";

// Server metadata for the PDF-tools hub. The interactive UI is a client
// component (ToolsClient); keeping this wrapper a server component lets the
// page ship a real crawlable title, description and canonical — the parent of
// the per-tool /tools/<slug> landing pages.
export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const sw = params.locale !== "en";
  return {
    title: sw
      ? "Zana za PDF Bila Malipo — Unganisha, Gawanya, Badilisha na Zaidi"
      : "Free PDF Tools — Merge, Split, Convert & More",
    description: sw
      ? "Zana za PDF za mtandaoni bila malipo — unganisha, gawanya, zungusha, ongeza alama ya maji, ongeza nambari za kurasa, futa kurasa, badilisha picha kuwa PDF na toa maandishi. Hakuna usajili, hakuna alama ya maji, na faili zako hazihifadhiwi."
      : "Free online PDF tools — merge, split, rotate, watermark, add page numbers, delete pages, convert images to PDF and extract text. No sign-up, no watermark, and your files are never stored.",
    keywords: sw
      ? ["zana za pdf", "unganisha pdf", "gawanya pdf", "picha kuwa pdf", "zungusha pdf", "pdf bila malipo", "kihariri pdf", "pdf tools"]
      : [
          "pdf tools", "free pdf tools", "merge pdf", "split pdf", "image to pdf",
          "rotate pdf", "watermark pdf", "add page numbers to pdf", "extract text from pdf",
          "pdf tools online free", "pdf editor free",
        ],
    alternates: { canonical: "/tools" },
    openGraph: {
      title: sw ? "Zana za PDF Bila Malipo | Sumaiya" : "Free PDF Tools | Sumaiya",
      description: sw
        ? "Unganisha, gawanya, zungusha, ongeza alama ya maji na badilisha PDF bila malipo — hakuna usajili, faili hazihifadhiwi."
        : "Merge, split, rotate, watermark and convert PDFs free — no sign-up, files never stored.",
      url: "/tools",
      images: ["/og-image.png"],
    },
  };
}

export default function ToolsPage() {
  return <ToolsClient />;
}
