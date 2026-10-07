/**
 * The caller's language, for API routes that must write user-facing PROSE (not
 * keywords) back to the client.
 *
 * WHY THIS EXISTS
 * A body field is the reliable signal when the client sends one, but not every
 * client does: the jobs drawer's `/api/jobs/targeted-cv` request carries no
 * `lang`, so the "why it moved" bullets came back in English inside a Swahili
 * UI (docs/QA-WEB-JOURNEYS-2026-09-20.md D3). Reading the same `lang` cookie the
 * middleware already uses (middleware.ts: Swahili unless the visitor explicitly
 * chose English) gives the route the right answer with no client change, and
 * keeps the fallback consistent with the rest of the product instead of
 * defaulting a Swahili-first product to English.
 */
import type { Context } from "hono";

export type UiLang = "en" | "sw";

/** `lang` cookie wins when the body is silent — same rule as middleware.ts. */
export function requestLang(c: Context, bodyLang?: UiLang | null): UiLang {
  if (bodyLang === "en" || bodyLang === "sw") return bodyLang;
  const cookie = c.req.header("cookie") ?? "";
  return /(?:^|;\s*)lang=en(?:;|$)/.test(cookie) ? "en" : "sw";
}
