import { attachmentsContext, extractFailureMessage } from "./attachment-extract";
import { UPLOAD_BUDGETS } from "@sumaiya/api-client";
import type { Attachment, ExtractFailure } from "../components/chat/chat-types";

const doc = (over: Partial<Attachment> = {}): Attachment =>
  ({ id: "1", kind: "document", uri: "file:///x.pdf", name: "resume.pdf", status: "ready", ...over }) as Attachment;

describe("attachmentsContext", () => {
  it("is empty when there are no attachments", () => {
    expect(attachmentsContext([])).toBe("");
  });

  it("includes the extracted text when we have it", () => {
    const out = attachmentsContext([doc({ extractedText: "Asha Mwangi — Storekeeper, 5 years" })]);
    expect(out).toContain("Asha Mwangi — Storekeeper");
    expect(out).toContain('document named "resume.pdf"');
  });

  it("tells the model NOT to invent contents when extraction failed", () => {
    const out = attachmentsContext([doc({ extractError: "scanned PDF, no text" })]);
    expect(out).toContain("NO TEXT FROM THIS FILE");
    expect(out).toContain("scanned PDF, no text");
    expect(out.toLowerCase()).toContain("do not invent");
  });

  // The reason used to be one generic English sentence for every cause, and the
  // model was left to explain it — it invented "muunganisho ulikataa" (the
  // connection refused) for what was actually a local timeout. The context must
  // now carry the REAL cause and forbid guessing at it.
  it("states the real cause and forbids inventing one", () => {
    const out = attachmentsContext([doc({ extractErrorCode: "timeout" })]);
    expect(out).toContain("took too long");
    expect(out.toLowerCase()).toContain("do not invent a cause");
    expect(out.toLowerCase()).not.toContain("connection and try again");
  });

  it("warns the model that a photo's text came from OCR and may be wrong", () => {
    // A misread digit or name from OCR used to be relayed with the same
    // confidence as text the user actually typed.
    const out = attachmentsContext([
      { id: "3", kind: "image", uri: "file:///x.jpg", name: "cv.jpg", status: "ready", extractedText: "Juma — 2019" } as Attachment,
    ]);
    expect(out.toLowerCase()).toContain("ocr");
    expect(out.toLowerCase()).toContain("confirm");
  });

  it("does not add the OCR caveat to a document's text-layer extraction", () => {
    const out = attachmentsContext([doc({ extractedText: "Asha Mwangi — Storekeeper, 5 years" })]);
    expect(out.toLowerCase()).not.toContain("ocr");
  });

  it("passes a job link straight through without a text block", () => {
    const out = attachmentsContext([
      { id: "2", kind: "link", uri: "https://jobs.example/123", name: "link", status: "ready" } as Attachment,
    ]);
    expect(out).toContain("job link: https://jobs.example/123");
    expect(out).not.toContain("NO TEXT");
  });

  it("counts every attached item", () => {
    const out = attachmentsContext([doc(), doc({ id: "9", name: "cert.pdf" })]);
    expect(out).toContain("attached 2 item(s)");
  });
});

describe("extractFailureMessage", () => {
  const CODES: ExtractFailure[] = [
    "too_big",
    "timeout",
    "network",
    "auth",
    "server",
    "scanned_pdf",
    "unsupported",
    "empty",
    "unreadable",
    "device_file",
  ];

  it("has copy for every failure code in both languages", () => {
    for (const code of CODES) {
      expect(extractFailureMessage(code, "en").length).toBeGreaterThan(20);
      expect(extractFailureMessage(code, "sw").length).toBeGreaterThan(20);
      // A Swahili user must not be shown the English sentence.
      expect(extractFailureMessage(code, "sw")).not.toBe(extractFailureMessage(code, "en"));
    }
  });

  it("keeps a timeout from being reported as a connection problem", () => {
    // The regression that started this: a client-side abort was told to the
    // user as "check your connection", which was both wrong and unactionable.
    const timeout = extractFailureMessage("timeout", "en").toLowerCase();
    expect(timeout).toContain("took too long");
    expect(timeout).not.toContain("check your connection");
  });

  it("tells a scanned-PDF user to send a photo, not to retry the same file", () => {
    const sw = extractFailureMessage("scanned_pdf", "sw").toLowerCase();
    expect(sw).toContain("picha");
  });
});

describe("upload budgets", () => {
  // The root cause of "every upload can't be read": the client gave up at 30s
  // while the server's own OCR budget is 60s, so a read in progress was killed
  // locally and reported as a network failure. These must stay above the server.
  const SERVER_OCR_BUDGET_MS = 60_000;

  it("outlasts the server's own OCR budget", () => {
    expect(UPLOAD_BUDGETS.ocr).toBeGreaterThan(SERVER_OCR_BUDGET_MS);
    expect(UPLOAD_BUDGETS.upload).toBeGreaterThan(SERVER_OCR_BUDGET_MS);
  });
});
