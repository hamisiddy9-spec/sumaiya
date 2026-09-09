/**
 * PDF Export Service - Convert CV data to PDF using expo-print
 *
 * Phase 3 Bug Fix:
 * Fixed template literal syntax in generateHTMLFromCV
 * Changed from \${...} (escaped) to ${...} (actual template expressions)
 * This allows proper interpolation of CV data into the HTML template.
 *
 * Architecture:
 * 1. exportCVAsPDF() → Entry point, calls expo-print
 * 2. generateHTMLFromCV() → Converts CV object to styled HTML string
 * 3. HTML template → Professional CV layout with CSS styling
 * 4. Returns file URI → Pass to expo-sharing for native share sheet
 *
 * Usage:
 *   const pdfUri = await exportCVAsPDF(cvData, "modern");
 *   await shareService.shareFile(pdfUri, "CV.pdf");
 */

import * as Print from "expo-print";
import type { CV } from "@sumaiya/types";

export async function exportCVAsPDF(cv: CV, templateName: string): Promise<string> {
  const html = generateHTMLFromCV(cv, templateName);

  try {
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    return uri;
  } catch (error) {
    console.error("PDF export failed:", error);
    throw error;
  }
}

/**
 * Convert CV object to styled HTML string
 * Uses template literals with proper ${} interpolation (not escaped)
 * Generates professional resume layout with CSS styling
 */
function generateHTMLFromCV(cv: CV, templateName: string): string {
  const { personalInfo, summary, experience, education, skills, languages } = cv.data;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 20px;
            background: white;
          }
          .header {
            border-bottom: 3px solid #ff7a4f;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .name {
            font-size: 32px;
            font-weight: bold;
            color: #1a1410;
            margin: 0;
          }
          .contact {
            font-size: 12px;
            color: #666;
            margin-top: 5px;
          }
          .section {
            margin-bottom: 20px;
          }
          .section-title {
            font-size: 16px;
            font-weight: bold;
            color: #ff7a4f;
            border-bottom: 2px solid #f0f0f0;
            padding-bottom: 8px;
            margin-bottom: 12px;
            text-transform: uppercase;
          }
          .entry {
            margin-bottom: 12px;
          }
          .entry-title {
            font-weight: bold;
            color: #1a1410;
            font-size: 14px;
          }
          .entry-subtitle {
            color: #666;
            font-size: 12px;
            font-style: italic;
          }
          .entry-date {
            color: #999;
            font-size: 11px;
          }
          .entry-description {
            color: #555;
            font-size: 12px;
            margin-top: 4px;
            line-height: 1.4;
          }
          .skills-list {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 8px;
          }
          .skill-tag {
            background: #fff3f0;
            color: #ff7a4f;
            padding: 4px 10px;
            border-radius: 16px;
            font-size: 11px;
            font-weight: bold;
          }
          .summary {
            color: #555;
            font-size: 12px;
            line-height: 1.5;
            font-style: italic;
            background: #f9f9f9;
            padding: 12px;
            border-radius: 4px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <p class="name">${escapeHtml(personalInfo.fullName)}</p>
          <div class="contact">
            ${personalInfo.email ? `${escapeHtml(personalInfo.email)} • ` : ""}
            ${personalInfo.phone ? `${escapeHtml(personalInfo.phone)} • ` : ""}
            ${personalInfo.location ? escapeHtml(personalInfo.location) : ""}
          </div>
        </div>

        ${
          summary
            ? `
          <div class="section">
            <div class="section-title">Professional Summary</div>
            <p class="summary">${escapeHtml(summary)}</p>
          </div>
        `
            : ""
        }

        ${
          experience && experience.length > 0
            ? `
          <div class="section">
            <div class="section-title">Experience</div>
            ${experience
              .map(
                (exp) => `
              <div class="entry">
                <div class="entry-title">${escapeHtml(exp.title)}</div>
                <div class="entry-subtitle">${escapeHtml(exp.company)}</div>
                <div class="entry-date">${exp.startDate} – ${exp.endDate || "Present"}</div>
                ${
                  exp.description
                    ? `<div class="entry-description">${escapeHtml(exp.description)}</div>`
                    : ""
                }
              </div>
            `
              )
              .join("")}
          </div>
        `
            : ""
        }

        ${
          education && education.length > 0
            ? `
          <div class="section">
            <div class="section-title">Education</div>
            ${education
              .map(
                (edu) => `
              <div class="entry">
                <div class="entry-title">${escapeHtml(edu.degree)} in ${escapeHtml(edu.field)}</div>
                <div class="entry-subtitle">${escapeHtml(edu.institution)}</div>
                <div class="entry-date">${edu.graduationDate}</div>
                ${edu.gpa ? `<div class="entry-date">GPA: ${edu.gpa}</div>` : ""}
              </div>
            `
              )
              .join("")}
          </div>
        `
            : ""
        }

        ${
          skills && skills.length > 0
            ? `
          <div class="section">
            <div class="section-title">Skills</div>
            <div class="skills-list">
              ${skills.map((s) => `<span class="skill-tag">${escapeHtml(s.name)}</span>`).join("")}
            </div>
          </div>
        `
            : ""
        }

        ${
          languages && languages.length > 0
            ? `
          <div class="section">
            <div class="section-title">Languages</div>
            ${languages
              .map(
                (lang) => `
              <div class="entry">
                <span class="entry-title">${escapeHtml(lang.language)}</span>
                <span class="entry-subtitle">(${lang.proficiency})</span>
              </div>
            `
              )
              .join("")}
          </div>
        `
            : ""
        }
      </body>
    </html>
  `;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
