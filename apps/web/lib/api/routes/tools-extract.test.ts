// POST /api/tools/extract-text — every failure has to name what actually went
// wrong and what the user can do next, with its own status.
//
// Measured live before this existed (docs/qa-fixtures-2026-09-20/results-server-extract.json):
//   cv-photo.jpg / cv-photo-sw.png / photo.webp → 415 "Couldn't read that file type.
//       Send a PDF, a Word (.docx) file, a photo, or paste the text." (told the user
//       to send the photo they had just sent to the route that refused photos)
//   cv-corrupt.pdf → 500 "Couldn't read that file. Try a PDF or paste the text."
//   cv-protected.pdf → 500, the SAME message — never mentioned a password
//   cv-blank.pdf → 422 "…it's a scan. Send a clear photo of it instead." (a blank page
//       is not a scan, and there is nothing to photograph)
//   cv-zero.pdf / cv-zero.docx → 415 unsupported type
//
// The fixtures are committed under docs/qa-fixtures-2026-09-20/ so these assertions
// run against the same real bytes the live probe used.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { toolsRoutes } from "./tools";

const FIX = resolve(__dirname, "../../../../../docs/qa-fixtures-2026-09-20");
let ipSeed = 0;

interface ExtractResponse {
  status: number;
  ct: string | null;
  error: string | null;
  text: string | null;
  pages: number | null;
}

async function postFixture(file: string): Promise<ExtractResponse> {
  const bytes = readFileSync(resolve(FIX, file));
  const form = new FormData();
  form.append("file", new File([bytes], file));
  ipSeed += 1;
  const res = await toolsRoutes.request(
    new Request("http://localhost/extract-text", {
      method: "POST",
      body: form,
      // A distinct client per case: the route rate-limits by IP+route.
      headers: { "x-forwarded-for": `10.9.${ipSeed}.1` },
    }),
  );
  const body = (await res.json().catch(() => ({}))) as { error?: string; text?: string; pages?: number };
  return {
    status: res.status,
    ct: res.headers.get("content-type"),
    error: typeof body.error === "string" ? body.error : null,
    text: typeof body.text === "string" ? body.text : null,
    pages: typeof body.pages === "number" ? body.pages : null,
  };
}

describe("extract-text — photos are refused honestly, and point at the path that reads them", () => {
  it("names the real image type instead of the generic unsupported-type message", async () => {
    for (const [file, kind] of [["cv-photo.jpg", "JPEG"], ["cv-photo-sw.png", "PNG"], ["photo.webp", "WebP"]] as const) {
      const res = await postFixture(file);
      expect(res.status, `${file} status`).toBe(415);
      expect(res.error, `${file} message`).toContain(kind);
      // The old message's advice ("send a photo") must never come back.
      expect(res.error).not.toMatch(/send a photo, or paste/i);
      // …and it must send the user somewhere that genuinely reads photos.
      expect(res.error).toMatch(/AI Assistant/i);
      expect(res.text).toBeNull();
    }
  });
});

describe("extract-text — a damaged PDF and a password-protected PDF are different failures", () => {
  it("tells the user a damaged PDF is damaged (422, not a blank 500)", async () => {
    const res = await postFixture("cv-corrupt.pdf");
    expect(res.status).toBe(422);
    expect(res.error).toMatch(/damaged/i);
    expect(res.error).not.toMatch(/password/i);
    expect(res.error).not.toMatch(/Couldn't read that file\. Try a PDF or paste the text\./);
  });

  it("names the password on a password-protected PDF (422)", async () => {
    const res = await postFixture("cv-protected.pdf");
    expect(res.status).toBe(422);
    expect(res.error).toMatch(/password/i);
    expect(res.error).toMatch(/copy without the password/i);
  });
});

describe("extract-text — 'no text' is diagnosed per situation, never as 'a scan' by default", () => {
  it("calls a blank PDF blank, and does not tell the user to photograph nothing", async () => {
    const res = await postFixture("cv-blank.pdf");
    expect(res.status).toBe(422);
    expect(res.error).toMatch(/blank/i);
    expect(res.error).not.toMatch(/it's a scan/i);
    expect(res.error).not.toMatch(/send a clear photo/i);
  });

  it("calls an image-only PDF a scan, and points at a path that can read it", async () => {
    const res = await postFixture("cv-scanned.pdf");
    expect(res.status).toBe(422);
    expect(res.error).toMatch(/scan/i);
    expect(res.error).toMatch(/AI Assistant/i);
  });
});

describe("extract-text — an empty file is empty, not an unsupported type", () => {
  it("answers 400 and says the upload did not arrive", async () => {
    for (const file of ["cv-zero.pdf", "cv-zero.docx"]) {
      const res = await postFixture(file);
      expect(res.status, `${file} status`).toBe(400);
      expect(res.error, `${file} message`).toMatch(/empty \(0 bytes\)/i);
      expect(res.error).not.toMatch(/file type/i);
    }
  });
});

describe("extract-text — the happy paths are unchanged", () => {
  it("still extracts a text-layer PDF", async () => {
    const res = await postFixture("cv-text.pdf");
    expect(res.status).toBe(200);
    expect(res.pages).toBe(1);
    expect(res.text).toContain("Amina Joseph Mwakasege");
    expect(res.text).toContain("INTERESTS");
  });

  it("still extracts a real DOCX", async () => {
    const res = await postFixture("cv.docx");
    expect(res.status).toBe(200);
    expect(res.text).toContain("Amina Joseph Mwakasege");
  });
});
