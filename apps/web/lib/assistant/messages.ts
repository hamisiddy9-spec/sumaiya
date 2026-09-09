// Card-only messages (confirmations, signals, jobs cards…) carry their payload
// in `card` and have empty `content` — they are UI artifacts, not conversational
// turns the model should see. Anything sent to the AI must be stripped of them
// (and of whitespace-only content), so an empty turn can never reach the zod
// schema (400) or pollute the transcript with blank "USER:"/"YOU:" lines.
//
// `toApiMessages` is the CLIENT-side filter (primary): it shapes the
// assistant-turn history payload.
// `nonEmptyMessages` is the SERVER-side twin (backstop): the route drops
// empty-content entries before building the transcript, so a stray empty
// message from any client can never 400 the whole turn again.

export type HistoryMessage = {
  role: "user" | "assistant";
  content: string;
  apiContent?: string;
  card?: unknown;
};

export type ApiMessage = { role: "user" | "assistant"; content: string };

/**
 * Shape an assistant-turn history payload: prefer `apiContent` over `content`
 * (attached-document text), and DROP card-only / empty / whitespace-only
 * messages entirely — order preserved.
 */
export function toApiMessages(history: HistoryMessage[]): ApiMessage[] {
  return history
    .filter((m) => (m.apiContent ?? m.content).trim().length > 0)
    .map((m) => ({ role: m.role, content: m.apiContent ?? m.content }));
}

/**
 * Server-side backstop: drop entries whose content is empty/whitespace.
 * Keeps the transcript builder (and JD-scanning helpers) free of blank turns.
 */
export function nonEmptyMessages<T extends { content: string }>(messages: T[]): T[] {
  return messages.filter((m) => m.content.trim().length > 0);
}
