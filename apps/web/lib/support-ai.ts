import { callAi, hasAiProvider } from "@/lib/api/ai-provider";

// Knowledge the assistant is allowed to rely on. Kept deliberately factual and
// conservative — the model is told NOT to invent anything beyond this.
const KNOWLEDGE = `
Sumaiya (sumaiya.app) is a free tool for job seekers everywhere to build professional documents, with an AI assistant that helps them get hired.

FACTS:
- You can build a CV/resume, cover letter, business card and formal letter, and download a polished PDF — for free, with no credit card.
- CVs can also be downloaded as an editable Word (DOCX) file.
- All templates are ATS-friendly (single column, clear headings, real text-layer PDF) so they pass recruiter screening software.
- There is a free ATS checker at /ats-checker: upload a PDF or paste your CV text and get an instant score with fixes.
- There are free PDF tools at /tools: merge, split, image-to-PDF, rotate, watermark, add page numbers, delete pages, extract text. Files are never stored.
- The whole app works in English and Swahili — a language toggle switches any time.
- Sign in with Google, or with an email "magic link" (we email you a one-tap sign-in link). No password.
- There are 250+ templates at /templates.
- Support email: support@templatehub.pro.
`;

const GUARDRAILS = `
RULES:
- Only answer using the FACTS above. Do NOT invent features, prices, refund policies, dates, or promises.
- If the user asks about pricing/billing/refunds, account-specific issues, a bug, a partnership, or anything not covered by the FACTS, briefly acknowledge it and say a team member will personally follow up within 24 hours. Do NOT guess.
- Be warm, concise and genuinely helpful. Under 170 words.
- Reply in the SAME language the user wrote in (Swahili or English). If mixed, use whichever dominates.
- You may greet the person by their first name. Do NOT include a subject line or an email header — write only the message body.
- End with "— Timu ya Sumaiya" if replying in Swahili, or "— The Sumaiya Team" if in English.
`;

/**
 * Generates a first-response support reply to a user's contact message using the
 * app's existing AI provider. Returns null if no provider is configured or the
 * model call fails, so the caller can fall back to a static auto-reply.
 */
export async function generateSupportReply(name: string, message: string): Promise<string | null> {
  if (!hasAiProvider()) return null;

  const prompt = `You are the friendly customer-support assistant for Sumaiya.
${KNOWLEDGE}
${GUARDRAILS}

The person's name is: ${name || "there"}
Their message:
"""
${message.slice(0, 3000)}
"""

Write only the body of the reply email now:`;

  const reply = await callAi(prompt, { temperature: 0.5, maxTokens: 500, timeoutMs: 45_000 });
  const trimmed = reply?.trim();
  if (!trimmed || trimmed.length < 15) return null;
  return trimmed;
}
