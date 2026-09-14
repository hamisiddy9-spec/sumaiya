/**
 * Read-only audit: does every stored CV render its own name?
 *
 * The failure this exists for: `parseCVData` is the single reader behind the CV
 * list, the editor, ATS, job matching and every PDF export. When it silently
 * degrades to an empty CV, the user is told they have no CV while the row sits
 * in the column. Measured twice here — first for the JSON-string wrap, then for
 * the `personalInfo` / `personal` shape split.
 *
 * So the check is the reader itself, run over EVERY production row, not a
 * fixture. A fixture proves the fix you imagined; the stored rows prove the fix
 * that is actually needed.
 *
 *   node --env-file=.env.local scripts/verify-cv-shapes.ts      (add .env.local)
 *
 * Read-only: SELECT only. It never writes.
 */
import postgres from "postgres";
import { cvDataSchema, parseCVData } from "../types";
import { toStoredCvData } from "@sumaiya/utils/cv-shape";

// `?? ""` rather than leaving it `string | undefined`: some @types/node builds
// type `process.exit` as `void`, so the guard below does not narrow and every
// later use of `url` fails to compile.
const url = process.env.DATABASE_URL ?? "";
if (!url) {
  console.error("DATABASE_URL is required (use --env-file=.env.local).");
  process.exit(1);
}

/** The shape the app writes: is there a name in there at all, whichever key? */
function storedName(data: unknown): string {
  const d = (typeof data === "string" ? safeJson(data) : data) as Record<string, unknown> | null;
  if (!d || typeof d !== "object") return "";
  const pi = (d.personal ?? d.personalInfo ?? {}) as Record<string, unknown>;
  return String(pi.fullName ?? "").trim();
}

function safeJson(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

/** What the reader did BEFORE the normalisation was wired in. */
function legacyRenderedName(data: unknown): string {
  let candidate: unknown = data;
  for (let i = 0; i < 2 && typeof candidate === "string"; i++) {
    try {
      candidate = JSON.parse(candidate);
    } catch {
      break;
    }
  }
  const r = cvDataSchema.safeParse(candidate);
  return r.success ? String(r.data.personal.fullName ?? "").trim() : "";
}

// Wrapped rather than top-level-await: this repo runs scripts through tsx,
// which transpiles to CJS, where top-level await is a transform error.
async function main() {
const sql = postgres(url, { ssl: "require", prepare: false });

try {
  const rows = await sql<{ id: string; data: unknown; updated_at: Date | null }[]>`
    select id, data, updated_at from cv order by updated_at desc nulls last`;

  let withName = 0;
  let legacyOk = 0;
  let nowOk = 0;
  let regressions = 0;
  const broken: string[] = [];

  console.log("");
  console.log("id".padEnd(26), "stored name".padEnd(24), "before".padEnd(8), "after");
  console.log("-".repeat(74));

  for (const row of rows) {
    const name = storedName(row.data);
    const before = legacyRenderedName(row.data);
    const after = parseCVData(row.data).personal.fullName.trim();

    if (name) withName++;
    if (before) legacyOk++;
    if (after) nowOk++;
    if (before && !after) regressions++;

    const flag = name && !after ? "  <-- STILL BLANK" : "";
    if (name && !after) broken.push(row.id);
    console.log(
      row.id.padEnd(26),
      (name || "(none stored)").slice(0, 23).padEnd(24),
      (before ? "ok" : "BLANK").padEnd(8),
      after || "BLANK",
      flag,
    );
  }

  console.log("-".repeat(74));
  console.log(`rows                 : ${rows.length}`);
  console.log(`rows with a name     : ${withName}`);
  console.log(`rendered name BEFORE : ${legacyOk}`);
  console.log(`rendered name AFTER  : ${nowOk}`);
  console.log(`regressions          : ${regressions}`);

  // The only failing state: a name is stored and the reader still loses it.
  if (broken.length) {
    console.log(`\nFAIL — ${broken.length} row(s) store a name the reader drops: ${broken.join(", ")}`);
    process.exitCode = 1;
  } else {
    console.log("\nPASS — every row that stores a name renders one.");
  }
} catch (e) {
  console.error("AUDIT FAILED:", (e as Error).message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
}

main();
