// Pins the client and server PDF upload caps together so they cannot drift
// apart again (they did once: the ATS checker's client accepted 15 MB while
// the server rejected anything over 4 MB, so every upload between 4 and 15 MB
// failed after a full upload+wait instead of being caught up front).
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { MAX_PDF_UPLOAD_BYTES, MAX_PDF_UPLOAD_MB, MAX_LOCAL_PARSE_BYTES, MAX_LOCAL_PARSE_MB, attachmentSizeVerdict, maySendToServer } from "./upload-limits";

const WEB_ROOT = resolve(__dirname, "..");
const VERCEL_EDGE_BODY_LIMIT_BYTES = 4.5 * 1024 * 1024;

function readSource(relPath: string): string {
  return readFileSync(resolve(WEB_ROOT, relPath), "utf8");
}

describe("upload-limits (shared source of truth)", () => {
  it("is 4 MB", () => {
    expect(MAX_PDF_UPLOAD_BYTES).toBe(4 * 1024 * 1024);
    expect(MAX_PDF_UPLOAD_MB).toBe(4);
  });

  it("stays safely under Vercel's ~4.5 MB serverless request-body limit", () => {
    expect(MAX_PDF_UPLOAD_BYTES).toBeLessThan(VERCEL_EDGE_BODY_LIMIT_BYTES);
  });

  it("tools.ts references the shared constant instead of a local literal cap", () => {
    const src = readSource("lib/api/routes/tools.ts");
    expect(
      src.includes('from "@/lib/upload-limits"') && src.includes("MAX_PDF_UPLOAD_BYTES"),
      "tools.ts must import MAX_PDF_UPLOAD_BYTES from @/lib/upload-limits instead of defining its own cap"
    ).toBe(true);
    expect(
      /const\s+MAX_PDF_BYTES\s*=\s*4\s*\*\s*1024\s*\*\s*1024/.test(src),
      "tools.ts has re-introduced a local numeric literal for MAX_PDF_BYTES — it must read from the shared MAX_PDF_UPLOAD_BYTES constant so it cannot drift from the client cap again"
    ).toBe(false);
  });

  it("ats-checker-client.tsx imports the shared constant and carries no stale 15 MB literal", () => {
    const src = readSource("app/[locale]/(marketing)/ats-checker/ats-checker-client.tsx");
    expect(
      src.includes('from "@/lib/upload-limits"') && src.includes("MAX_PDF_UPLOAD_BYTES"),
      "ats-checker-client.tsx must import MAX_PDF_UPLOAD_BYTES from @/lib/upload-limits instead of defining its own cap"
    ).toBe(true);
    expect(
      /15\s*\*\s*1024\s*\*\s*1024/.test(src),
      "ats-checker-client.tsx still hardcodes a 15 MB byte literal — the server only accepts 4 MB, so this drifted again. Import MAX_PDF_UPLOAD_BYTES instead"
    ).toBe(false);
    expect(
      /15\s*MB/i.test(src),
      "ats-checker-client.tsx still shows the user a stale '15 MB' label — the real server cap is 4 MB. Derive the label from MAX_PDF_UPLOAD_MB"
    ).toBe(false);
  });

  it("tools-client.tsx references the shared constant instead of a local literal cap", () => {
    const src = readSource("app/[locale]/(marketing)/tools/tools-client.tsx");
    expect(
      src.includes('from "@/lib/upload-limits"') && src.includes("MAX_PDF_UPLOAD_BYTES"),
      "tools-client.tsx must import MAX_PDF_UPLOAD_BYTES from @/lib/upload-limits instead of defining its own cap"
    ).toBe(true);
    expect(
      /const\s+MAX_BYTES\s*=\s*4\s*\*\s*1024\s*\*\s*1024/.test(src),
      "tools-client.tsx has re-introduced a local numeric literal for MAX_BYTES — it must read from the shared MAX_PDF_UPLOAD_BYTES constant so it cannot drift from the server cap again"
    ).toBe(false);
  });
});

// The 27 MB PDF that hung the import offers (docs/qa-fixtures-2026-09-20/
// results-recheck-huge.json): the client knew the file was too large and still
// POSTed it, and a body over the platform's limit never gets a response — the
// chip read "· inasoma…" for 177 s with no error and no way out. These are the
// numbers that decision now turns on.
describe("attachmentSizeVerdict — no file may be sent that cannot be answered", () => {
  it("refuses to even read the 27 MB fixture, and forbids sending it", () => {
    const bytes = 27001436; // docs/qa-fixtures-2026-09-20/cv-huge.pdf, measured
    const v = attachmentSizeVerdict(bytes);
    expect(v.kind).toBe("too-large-to-read");
    expect(maySendToServer(bytes)).toBe(false);
  });

  it("a file between the caps is readable locally but never sendable (no fallback)", () => {
    const bytes = 8 * 1024 * 1024;
    expect(attachmentSizeVerdict(bytes).kind).toBe("too-large-to-send");
    expect(maySendToServer(bytes)).toBe(false);
  });

  it("the caps are ordered: sending is stricter than reading", () => {
    expect(MAX_PDF_UPLOAD_BYTES).toBeLessThan(MAX_LOCAL_PARSE_BYTES);
    expect(MAX_LOCAL_PARSE_MB).toBe(25);
  });

  it("a normal CV passes both gates", () => {
    expect(attachmentSizeVerdict(378773).kind).toBe("ok"); // cv-photo.jpg
    expect(maySendToServer(MAX_PDF_UPLOAD_BYTES)).toBe(true);
  });

  it("the assistant's import path consults the shared verdict, not a bare size compare", () => {
    const src = readSource("components/assistant/cv-assistant-client.tsx");
    expect(
      src.includes("attachmentSizeVerdict(") &&
        src.includes("maySendToServer(") &&
        src.includes('from "@/lib/upload-limits"'),
      "cv-assistant-client.tsx must gate on the shared verdict: the size guard and the server-fallback guard have to agree"
    ).toBe(true);
  });
});
