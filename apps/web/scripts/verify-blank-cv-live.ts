/**
 * Proves the blank-CV fix against EVERY real CV in the live database.
 *
 * Run: npx tsx@4.19.2 scripts/verify-blank-cv-live.ts
 *
 * "Old" reproduces what shipped before the fix: the raw jsonb value is handed
 * straight to the schema, and any failure silently becomes an empty CV.
 * "New" is the shipped parseCVData(). If a row has content under New but not
 * Old, that user's CV was invisible on the web and now is not.
 */
import postgres from "postgres";
import fs from "node:fs";
import { parseCVData, cvDataSchema, createEmptyCVData } from "../types";

// Minimal .env reader — the app has no dotenv dependency and this script only
// needs one key out of the file.
for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (!m) continue;
  const v = m[2].trim().replace(/^["']|["']$/g, "");
  if (!process.env[m[1]]) process.env[m[1]] = v;
}

const sql = postgres(process.env.DATABASE_URL!, { ssl: "require", max: 2 });

function hasContent(d: unknown): boolean {
  const c = d as Record<string, any>;
  if (!c) return false;
  const p = c.personal ?? c.personalInfo ?? {};
  if ((p.fullName ?? "").trim()) return true;
  for (const k of ["experience", "education", "skills", "languages", "certifications", "referees", "projects", "hobbies"]) {
    if (Array.isArray(c[k]) && c[k].length > 0) return true;
  }
  if ((c.summary ?? "").trim()) return true;
  if ((c.careerGoals ?? "").trim()) return true;
  return false;
}

async function main() {
const rows = await sql<{ id: string; title: string | null; t: string; data: unknown }[]>`
  select id, title, jsonb_typeof(data) as t, data from cv order by id
`;

let oldOk = 0, newOk = 0, recovered = 0;
const report: string[] = [];

for (const r of rows) {
  const oldParsed = cvDataSchema.safeParse(r.data);
  const oldData = oldParsed.success ? oldParsed.data : createEmptyCVData();
  const newData = parseCVData(r.data);

  const o = hasContent(oldData);
  const n = hasContent(newData);
  if (o) oldOk++;
  if (n) newOk++;
  if (!o && n) recovered++;

  const name = (newData as any)?.personal?.fullName || (newData as any)?.personalInfo?.fullName || "";
  report.push(
    `${r.id.slice(0, 8)}  jsonb=${r.t.padEnd(6)} old=${o ? "content" : "BLANK  "} new=${n ? "content" : "blank  "}  name="${name}"`,
  );
}

console.log(report.join("\n"));
console.log("");
console.log(`total CVs in production : ${rows.length}`);
console.log(`rendered content BEFORE  : ${oldOk}`);
console.log(`rendered content AFTER   : ${newOk}   (+${recovered} recovered)`);
console.log(`still blank after fix    : ${rows.length - newOk}`);

await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
