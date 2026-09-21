// Prompt registry — versioned identifiers for every distinct AI prompt.
//
// Why: when a model or prompt change causes a Swahili-quality regression, you
// need to know *which* prompt version produced a bad output. Every generative
// tool call records its `promptId` + `promptVersion` on the eval_sample and the
// ai_call event, so a regression is bisectable.
//
// Bump the version string whenever you change a prompt's wording or structure.
// The prompt *text* still lives next to the code that builds it (it interpolates
// runtime state) — this module is the version ledger + a place to attach notes.

export interface PromptEntry {
  /** Bump on any wording/structure change. Format: v<major>.<minor>. */
  version: string;
  /** What this prompt is for — shown in eval dashboards. */
  purpose: string;
  /** Where the prompt text is built. */
  builtIn: string;
}

export const PROMPTS = {
  "enhance.section": {
    version: "v1.0",
    purpose: "Rewrite one CV section (summary / experience / skills / letter-body) for clarity, truthfully.",
    builtIn: "lib/api/routes/ai.ts buildEnhancementPrompt()",
  },
  "tailor.summary": {
    version: "v1.0",
    purpose: "Rewrite a professional summary to target a specific job, strictly truthful.",
    builtIn: "lib/api/routes/ai.ts POST /tailor",
  },
  "tailor.cv": {
    version: "v1.0",
    purpose: "Rewrite summary + all experience entries to a job, JSON out, evidence-checked.",
    builtIn: "lib/api/routes/ai.ts POST /tailor-cv",
  },
  "coverLetter.generate": {
    version: "v1.0",
    purpose: "Draft a cover letter body from the CV + job, in EN/SW.",
    builtIn: "lib/api/routes/ai.ts POST /cover-letter",
  },
  "assistant.system": {
    version: "v2.2",
    purpose: "The conversational Sumaiya system prompt (web assistant-turn route).",
    builtIn: "lib/api/routes/ai.ts POST /assistant-turn",
  },
  "assistant.mobile": {
    version: "v1.3",
    purpose: "The mobile chat system prompt (mid-conversation, no greeting, <120 words).",
    builtIn: "lib/api/routes/mobile.ts POST /chat",
  },
  "assistant.whatsapp": {
    version: "v1.1",
    purpose: "The WhatsApp conversational system prompt (plain text, <90 words, EN/SW).",
    builtIn: "lib/api/routes/whatsapp.ts POST /api/whatsapp/turn",
  },
  "skillGap.plan": {
    version: "v1.0",
    purpose: "AI learning plan built only from deterministic skill gaps.",
    builtIn: "lib/api/routes/ai.ts skill-gap",
  },
} as const satisfies Record<string, PromptEntry>;

export type PromptId = keyof typeof PROMPTS;

export function promptVersion(id: PromptId): string {
  return PROMPTS[id].version;
}

/** "enhance.section@v1.0" — the string stored on events + eval samples. */
export function promptTag(id: PromptId): string {
  return `${id}@${PROMPTS[id].version}`;
}
