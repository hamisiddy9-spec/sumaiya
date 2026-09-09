// Pure date/skill helpers shared by CV templates.
// Kept in a .ts module (no JSX) so vitest can import them directly.

// ─── Date formatter ───────────────────────────────────────────────────────────

export function fmtDate(d: string): string {
  if (!d) return "";
  const [y, m] = d.split("-");
  if (!m) return y ?? "";
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[(parseInt(m, 10) - 1)] ?? ""} ${y}`;
}

export function dateRange(start: string, end: string, current: boolean): string {
  const s = fmtDate(start);
  const e = current ? "Present" : fmtDate(end);
  if (!s && !e) return "";
  if (!s) return e;
  if (!e) return s;
  return `${s} – ${e}`;
}

/**
 * Render-hardening: drop skill entries with blank/whitespace-only names so
 * templates never emit empty rows or stray separators (e.g. " · " from a
 * skills.join()) for a skill row the user left half-filled.
 */
export function visibleSkills<T extends { name?: string }>(skills: T[]): T[] {
  return skills.filter((s) => typeof s.name === "string" && s.name.trim().length > 0);
}
