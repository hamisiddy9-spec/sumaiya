/**
 * Real-data verification for the native template engine.
 *
 * Pulls actual CV rows out of production, renders them through the engine for
 * one template per layout family, and screenshots the result so the output can
 * be LOOKED at rather than asserted about. Temporary tooling — delete when done.
 *
 *   cd /home/oem/sumaiya && npx tsx scripts/verify-real-templates.ts
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import postgres from "postgres";
import { chromium } from "playwright";
import { cvToHtml } from "../apps/native/src/lib/cv-html";
import { TEMPLATE_REGISTRY } from "../apps/native/src/lib/templates/registry";
import type { CV } from "@sumaiya/types";

const OUT = "/tmp/tplverify";
mkdirSync(OUT, { recursive: true });

function dbUrl(): string {
  for (const f of ["apps/web/.env.local", "apps/web/.env.vercel-prod"]) {
    try {
      const env = readFileSync(f, "utf8");
      const m = /^\s*DATABASE_URL\s*=\s*(.+)$/m.exec(env);
      if (m) return m[1].trim().replace(/^["']|["']$/g, "");
    } catch {}
  }
  throw new Error("no DATABASE_URL");
}

async function main() {
  const sql = postgres(dbUrl(), { ssl: "require", max: 1 });

  const t = await sql<{ table_name: string }[]>`
    select table_name from information_schema.tables
    where table_schema='public' and table_name in ('cv','cvs','resumes','cv_documents')`;
  console.log("CV tables:", t.map((r) => r.table_name).join(", ") || "(none of the guesses)");
  const table = t[0]?.table_name;
  if (!table) {
    const all = await sql<{ table_name: string }[]>`
      select table_name from information_schema.tables where table_schema='public' order by table_name`;
    console.log("all tables:", all.map((r) => r.table_name).join(", "));
    await sql.end();
    return;
  }

  const cols = await sql<{ column_name: string; data_type: string }[]>`
    select column_name, data_type from information_schema.columns
    where table_schema='public' and table_name=${table} order by ordinal_position`;
  console.log(`\n${table} columns:`, cols.map((r) => `${r.column_name}:${r.data_type}`).join(", "));

  const rows = await sql<Record<string, unknown>[]>`
    select *, length(data::text) as data_len, jsonb_typeof(data) as data_kind
    from ${sql(table)} where data is not null order by length(data::text) desc limit 5`;

  console.log(`\nTop ${rows.length} richest CV rows:`);
  for (const r of rows) {
    console.log(
      `  id=${String(r.id).slice(0, 8)} kind=${r.data_kind} len=${r.data_len} title=${JSON.stringify(r.title ?? r.name ?? "")}`,
    );
  }

  if (!rows.length) {
    console.log("no CV rows");
    await sql.end();
    return;
  }

  // Production rows may be double-encoded (data is a JSON *string* inside
  // jsonb). Normalise and report which rows needed it — that is itself a
  // finding about the data path, not a detail.
  const normalised = rows.map((r) => {
    let data = r.data;
    let decoded = false;
    if (typeof data === "string") {
      try {
        data = JSON.parse(data);
        decoded = true;
      } catch {}
    }
    return { row: r, cv: { ...r, data } as CV, decoded };
  });

  console.log(
    "\nDecode needed:",
    normalised.map((n) => `${String(n.row.id).slice(0, 8)}=${n.decoded}`).join(" "),
  );

  const want = ["SidebarLayout", "HeaderLayout", "MinimalLayout", "TwoColumnLayout", "AccentBandLayout"];
  const picks = want
    .map((layout) => Object.values(TEMPLATE_REGISTRY).find((tpl) => tpl.layout === layout))
    .filter(Boolean) as typeof TEMPLATE_REGISTRY[string][];
  console.log("Templates under test:", picks.map((p) => `${p.id}(${p.layout})`).join(", "));

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 794, height: 1123 } });

  for (const { cv, decoded, row } of normalised.slice(0, 2)) {
    for (const tpl of picks) {
      const html = cvToHtml(cv, { template: tpl.id, accent: "#DA4A1C" });
      const base = `${String(row.id).slice(0, 8)}-${tpl.id}`;
      writeFileSync(`${OUT}/${base}.html`, html);
      await page.setContent(html, { waitUntil: "load" });
      await page.screenshot({ path: `${OUT}/${base}.png`, fullPage: true });
      const text = await page.evaluate(() => document.body.innerText.replace(/\s+/g, " ").trim());
      console.log(
        `  ${base}: html=${html.length}B text=${text.length}c decoded=${decoded} :: ${text.slice(0, 100)}`,
      );
    }
  }

  await browser.close();
  await sql.end();
  console.log(`\nWrote screenshots to ${OUT}`);
}

main().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
