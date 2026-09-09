"use client";

// Generates a clean, ATS-optimised Microsoft Word (.docx) résumé from the
// structured CV data. This is the format many applicant tracking systems and
// recruiters parse most reliably — a single linear column, standard headings,
// real bullet lists, standard fonts, NO tables / text boxes / columns / images
// (all of which break ATS parsing). Built from data, so it's genuine selectable
// text, not a screenshot.

import type { CVData } from "@/types";

const FONT = "Calibri";
const DEFAULT_ACCENT = "1F3A34"; // pine, as hex (docx wants no leading #)

/** Normalize a "#RRGGBB" (or "RRGGBB") to the bare 6-hex docx wants. */
function normalizeHex(input?: string): string {
  const h = (input ?? "").replace(/[^0-9a-fA-F]/g, "");
  return h.length === 6 ? h.toUpperCase() : DEFAULT_ACCENT;
}

function fmtPeriod(start?: string, end?: string, current?: boolean): string {
  const s = (start ?? "").trim();
  const e = current ? "Present" : (end ?? "").trim();
  if (s && e) return `${s} – ${e}`;
  return s || e || "";
}

// Split a description into bullet lines (strip leading -, •, * markers).
function toBullets(description?: string): string[] {
  return (description ?? "")
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*[-•*]\s*/, "").trim())
    .filter(Boolean);
}

export async function buildCvDocument(cv: CVData, opts: { accent?: string } = {}): Promise<any> {
  const docx = await import("docx");
  const { Document, Paragraph, TextRun, AlignmentType, BorderStyle, ExternalHyperlink } = docx as any;
  const ACCENT = normalizeHex(opts.accent);

  const children: any[] = [];

  const heading = (text: string) =>
    new Paragraph({
      spacing: { before: 240, after: 80 },
      border: { bottom: { color: ACCENT, size: 6, style: BorderStyle.SINGLE, space: 2 } },
      children: [new TextRun({ text: text.toUpperCase(), bold: true, size: 24, color: ACCENT, font: FONT, characterSpacing: 20 })],
    });

  const p = cv.personal;

  // ── Name + title (name uses the CV's accent colour for a branded-but-ATS-safe
  //    header — no tables/columns/images, so parsers still read it cleanly) ──
  if (p.fullName?.trim()) {
    children.push(new Paragraph({
      spacing: { after: 20 },
      children: [new TextRun({ text: p.fullName.trim(), bold: true, size: 44, color: ACCENT, font: FONT })],
    }));
  }
  if (p.jobTitle?.trim()) {
    children.push(new Paragraph({
      spacing: { after: 60 },
      children: [new TextRun({ text: p.jobTitle.trim(), size: 24, color: "555555", font: FONT, characterSpacing: 10 })],
    }));
  }

  // ── Contact line, closed with a full-width accent rule ──
  const contacts = [p.email, p.phone, p.location, p.linkedin, p.website].map((x) => (x ?? "").trim()).filter(Boolean);
  if (contacts.length) {
    children.push(new Paragraph({
      spacing: { after: 40 },
      border: { bottom: { color: ACCENT, size: 12, style: BorderStyle.SINGLE, space: 6 } },
      children: [new TextRun({ text: contacts.join("   •   "), size: 20, color: "333333", font: FONT })],
    }));
  }

  // ── Summary ──
  if (cv.summary?.trim()) {
    children.push(heading("Professional Summary"));
    children.push(new Paragraph({
      spacing: { after: 80 },
      children: [new TextRun({ text: cv.summary.trim(), size: 21, font: FONT })],
    }));
  }

  // ── Experience ──
  if (cv.experience?.length) {
    children.push(heading("Experience"));
    for (const e of cv.experience) {
      const title = [e.position, e.company].filter(Boolean).join(" — ");
      const meta = [e.location, fmtPeriod(e.startDate, e.endDate, e.current)].filter(Boolean).join("  •  ");
      children.push(new Paragraph({
        spacing: { before: 100, after: 0 },
        children: [new TextRun({ text: title || "—", bold: true, size: 22, font: FONT })],
      }));
      if (meta) {
        children.push(new Paragraph({
          spacing: { after: 40 },
          children: [new TextRun({ text: meta, italics: true, size: 19, color: "666666", font: FONT })],
        }));
      }
      for (const b of toBullets(e.description)) {
        children.push(new Paragraph({
          bullet: { level: 0 },
          spacing: { after: 20 },
          children: [new TextRun({ text: b, size: 21, font: FONT })],
        }));
      }
    }
  }

  // ── Education ──
  if (cv.education?.length) {
    children.push(heading("Education"));
    for (const ed of cv.education) {
      const line = [ed.degree, ed.field].filter(Boolean).join(", ");
      const meta = [ed.institution, fmtPeriod(ed.startDate, ed.endDate), ed.grade].filter(Boolean).join("  •  ");
      children.push(new Paragraph({
        spacing: { before: 80, after: 0 },
        children: [new TextRun({ text: line || ed.institution || "—", bold: true, size: 21, font: FONT })],
      }));
      if (meta) {
        children.push(new Paragraph({
          spacing: { after: 20 },
          children: [new TextRun({ text: meta, size: 19, color: "666666", font: FONT })],
        }));
      }
    }
  }

  // ── Skills ──
  if (cv.skills?.length) {
    children.push(heading("Skills"));
    children.push(new Paragraph({
      spacing: { after: 60 },
      children: [new TextRun({ text: cv.skills.map((s) => s.name).filter(Boolean).join("  •  "), size: 21, font: FONT })],
    }));
  }

  // ── Languages ──
  if (cv.languages?.length) {
    children.push(heading("Languages"));
    children.push(new Paragraph({
      spacing: { after: 60 },
      children: [new TextRun({ text: cv.languages.map((l) => l.proficiency ? `${l.name} (${l.proficiency})` : l.name).filter(Boolean).join("  •  "), size: 21, font: FONT })],
    }));
  }

  // ── Certifications ──
  if (cv.certifications?.length) {
    children.push(heading("Certifications"));
    for (const c of cv.certifications) {
      const line = [c.name, c.issuer, c.date].filter(Boolean).join("  •  ");
      children.push(new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 20 },
        children: [new TextRun({ text: line, size: 21, font: FONT })],
      }));
    }
  }

  // ── Interests ──
  if (cv.hobbies?.trim()) {
    children.push(heading("Interests"));
    children.push(new Paragraph({
      children: [new TextRun({ text: cv.hobbies.trim(), size: 21, font: FONT })],
    }));
  }

  // Reference AlignmentType/ExternalHyperlink so tree-shakers keep them; harmless.
  void AlignmentType; void ExternalHyperlink;

  return new Document({
    creator: "Sumaiya",
    title: p.fullName ? `${p.fullName} — CV` : "CV",
    styles: { default: { document: { run: { font: FONT } } } },
    sections: [{
      properties: { page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } } },
      children,
    }],
  });
}

/** Client-side: build the .docx and trigger a download. */
export async function downloadCvDocx(cv: CVData, filename: string, accent?: string): Promise<void> {
  const docx = await import("docx");
  const doc = await buildCvDocument(cv, { accent });
  const blob = await (docx as any).Packer.toBlob(doc);
  const { triggerBlobDownload } = await import("@/lib/pdf");
  triggerBlobDownload(blob, filename.endsWith(".docx") ? filename : `${filename}.docx`);
}
