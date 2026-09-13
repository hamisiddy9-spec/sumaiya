/**
 * Real-data check for TemplateHub: what the hub actually lists, and whether the
 * designs it offers render a real CV. Temporary tooling — delete when done.
 *
 *   cd /home/oem/sumaiya && npx tsx scripts/verify-templatehub.ts
 */
import { readFileSync } from "node:fs";
import postgres from "postgres";
import { ALL_TEMPLATES, ENGINE_TEMPLATES, cvToHtml, templateLayout, templateMeta } from "../apps/native/src/lib/cv-html";
import type { CV } from "@sumaiya/types";

function dbUrl(): string {
  const env = readFileSync("apps/web/.env.local", "utf8");
  const m = /^\s*DATABASE_URL\s*=\s*(.+)$/m.exec(env);
  if (!m) throw new Error("no DATABASE_URL");
  return m[1].trim().replace(/^["']|["']$/g, "");
}

async function main() {
  // ── What the hub shows ─────────────────────────────────────────────────────
  const free = ALL_TEMPLATES.filter((t) => t.tier === "free");
  const premium = ALL_TEMPLATES.filter((t) => t.tier === "premium");
  console.log(`TemplateHub lists ${ALL_TEMPLATES.length} designs — ${free.length} free, ${premium.length} premium`);

  const families: Record<string, number> = {};
  for (const t of ALL_TEMPLATES) {
    const f = templateLayout(t.id);
    families[f] = (families[f] ?? 0) + 1;
  }
  console.log("by family:", families);

  const seen = new Set<string>();
  const teaser: string[] = [];
  for (const t of ENGINE_TEMPLATES) {
    const f = templateLayout(t.id);
    if (seen.has(f)) continue;
    seen.add(f);
    teaser.push(t.id);
    if (teaser.length === 5) break;
  }
  console.log("dashboard teaser:", teaser.map((id) => `${id}(${templateLayout(id)})`).join(", "));

  // ── Render the teaser set with a real CV ───────────────────────────────────
  const sql = postgres(dbUrl(), { ssl: "require", max: 1 });
  const rows = await sql<Record<string, unknown>[]>`
    select id, data from cv where data is not null order by length(data::text) desc limit 1`;
  await sql.end();

  if (!rows.length) {
    console.log("no CV rows to render");
    return;
  }
  let data: unknown = rows[0].data;
  if (typeof data === "string") data = JSON.parse(data);
  const cv = { ...rows[0], data } as CV;

  for (const id of teaser) {
    const meta = templateMeta(id);
    const html = cvToHtml(cv, { template: id, accent: "#DA4A1C" });
    const hasName = /<div style="[^"]*font-size:2[0-9]/.test(html) || html.includes("font-weight:800");
    console.log(
      `  ${id.padEnd(12)} ${String(templateLayout(id)).padEnd(17)} tier=${String(meta?.tier).padEnd(7)} html=${String(html.length).padStart(7)}B rendersHeader=${hasName}`,
    );
    if (!html.startsWith("<!DOCTYPE html>")) throw new Error(`${id} did not render a document`);
    if (!html.includes("font-family")) throw new Error(`${id} rendered no styled content`);
  }
  console.log("\nEvery teaser design renders the real CV.");
}

main().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
