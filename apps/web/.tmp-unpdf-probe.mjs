import fs from "node:fs";
const { getDocumentProxy, extractText } = await import("unpdf");
const { PDFDocument, PDFName } = await import("pdf-lib");
const dir = "C:/Users/hamis/projects/sumaiya/docs/qa-fixtures-2026-09-20/";
for (const f of ["cv-blank.pdf","cv-scanned.pdf","cv-protected.pdf","cv-corrupt.pdf","cv-text.pdf","cv-huge.pdf"]) {
  const buf = new Uint8Array(fs.readFileSync(dir + f));
  let imgs = 0, pdfLibErr = null;
  try {
    const doc = await PDFDocument.load(buf, { ignoreEncryption: true, updateMetadata: false });
    for (const p of doc.getPages()) {
      const res = p.node.Resources();
      const xo = res ? res.lookup(PDFName.of("XObject")) : undefined;
      if (xo && xo.keys) imgs += xo.keys().length;
    }
  } catch (e) { pdfLibErr = String(e.message).slice(0,80); }
  try {
    const pdf = await getDocumentProxy(buf);
    const { totalPages, text } = await extractText(pdf, { mergePages: true });
    console.log(f, "pages:", totalPages, "textLen:", String(text).trim().length, "xobjs:", imgs, "pdfLibErr:", pdfLibErr);
  } catch (e) {
    console.log(f, "unpdfTHREW name=", e?.name, "msg=", String(e?.message).slice(0,160), "xobjs:", imgs, "pdfLibErr:", pdfLibErr);
  }
}
