/**
 * The cover letter as a printable document.
 *
 * Extracted from job-apply-screen.tsx for one reason: this is where the bug was.
 * The letter was built inline, and when the letter body came back empty the
 * screen happily printed a page containing nothing but the job title and the
 * company name — a PDF that looks like a real file, opens fine, and says
 * nothing. Nobody would notice until an employer did.
 *
 * So the rule here is explicit and testable: a letter that is not a letter must
 * be refused, not rendered. `letterIsEmpty` is the guard, and the screen asks it
 * before it writes any file.
 */

/** A body shorter than this is not a letter — it is a blank page waiting to happen. */
export const MIN_LETTER_CHARS = 80;

/** Escapes every character that could break out of HTML text or an attribute. */
function esc(text: unknown): string {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function letterIsEmpty(content: string | null | undefined): boolean {
  return (content ?? "").trim().length < MIN_LETTER_CHARS;
}

export interface LetterHtmlInput {
  jobTitle?: string | null;
  company?: string | null;
  content: string;
}

/**
 * One paragraph per blank-line-separated block, single newlines kept as breaks.
 * Throws when the body is empty — a caller that ignores the guard should fail
 * loudly rather than hand someone a blank page.
 */
export function letterToHtml({ jobTitle, company, content }: LetterHtmlInput): string {
  if (letterIsEmpty(content)) {
    throw new Error("letterToHtml: refusing to render an empty letter body");
  }

  const body = content
    .split(/\n{2,}/)
    .map((para) => para.trim())
    .filter(Boolean)
    .map((para) => `<p>${esc(para).replace(/\n/g, "<br/>")}</p>`)
    .join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      body{font-family:Georgia,'Times New Roman',serif;line-height:1.6;color:#222;padding:56px 60px;font-size:12pt}
      h1{font-size:15pt;margin:0 0 4px}.sub{color:#666;font-size:10.5pt;margin-bottom:28px}p{margin:0 0 14px}
    </style></head><body>
      <h1>${esc(jobTitle || "Cover letter")}</h1>
      <div class="sub">${esc(company || "")}</div>
      ${body}
    </body></html>`;
}
