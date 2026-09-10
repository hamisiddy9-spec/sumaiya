import { attachmentsContext } from "./attachment-extract";
import type { Attachment } from "../components/chat/chat-types";

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
    expect(out.toLowerCase()).toContain("do not guess or invent");
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
