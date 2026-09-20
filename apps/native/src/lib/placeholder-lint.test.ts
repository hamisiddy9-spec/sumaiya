/**
 * Static guard against placeholders that look like real, already-filled-in
 * data. A placeholder that reads like a plausible answer never gets edited —
 * it gets saved as the user's own data, silently, because nothing in the UI
 * distinguishes "example text" from "your text". Every example must be
 * unmistakably an example (start with "e.g. " / "Example:" / "Mfano:") AND
 * plausible for Tanzania, where this product is used — a Nairobi example
 * ("Nairobi", "Brookside") reads as "this app is not for me" to a Tanzanian
 * jobseeker.
 */
import { readFileSync, readdirSync, statSync } from "fs";
import { join, extname } from "path";

const SRC_ROOT = join(__dirname, "..");
const SKIP_DIRS = new Set(["node_modules", "__tests__"]);

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full, out);
    else if (extname(entry) === ".tsx") out.push(full);
  }
  return out;
}

const PLACEHOLDER = /placeholder=(?:"([^"]*)"|\{t\(\s*"((?:[^"\\]|\\.)*)"\s*,\s*"((?:[^"\\]|\\.)*)")/g;

interface Hit {
  file: string;
  value: string;
}

const files = walk(SRC_ROOT);
const hits: Hit[] = [];
for (const file of files) {
  const text = readFileSync(file, "utf8");
  for (const m of text.matchAll(PLACEHOLDER)) {
    if (m[1] !== undefined) hits.push({ file, value: m[1] });
    if (m[2] !== undefined) hits.push({ file, value: m[2] });
    if (m[3] !== undefined) hits.push({ file, value: m[3] });
  }
}

describe("placeholder lint (no fake-looking data, Tanzania-first)", () => {
  it("found a real corpus to scan", () => {
    // A broken walker or regex would make every check below a false pass.
    expect(files.length).toBeGreaterThan(10);
    expect(hits.length).toBeGreaterThan(20);
  });

  it("never uses a Kenyan example (Nairobi, Brookside) in a Tanzania-first product", () => {
    const offenders = hits.filter((h) => /\bNairobi\b|\bBrookside\b/i.test(h.value));
    expect(offenders).toEqual([]);
  });

  it("marks every job/company/place example as unmistakably an example", () => {
    const NAMED = /(Warehouse Supervisor|Mfanyakazi wa Ghala|Storekeeper|Software Engineer|Mhandisi|Dar es Salaam|Ubungo|Kariakoo|Kilimanjaro|Distributors)/;
    const MARKER = /^(e\.g\. |Example:|Mfano:)/;
    const offenders = hits
      .filter((h) => NAMED.test(h.value))
      .filter((h) => !MARKER.test(h.value.trim()))
      .map((h) => `${h.file}: "${h.value}"`);
    expect(offenders).toEqual([]);
  });
});
