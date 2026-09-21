// Does the guest-downloaded PDF carry REAL TEXT (ATS-readable) or is it an
// image? pdfjs-dist extract of the actual downloaded file.
import fs from "fs";
import { createRequire } from "module";
const require = createRequire("C:/Users/hamis/projects/sumaiya/package.json");
const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs").catch(() =>
  import("file:///C:/Users/hamis/projects/sumaiya/node_modules/pdfjs-dist/legacy/build/pdf.mjs"),
);

const file = process.argv[2];
const doc = await pdfjs.getDocument({
  data: new Uint8Array(fs.readFileSync(file)),
  useSystemFonts: true,
}).promise;
console.log("pages:", doc.numPages);
let all = "";
for (let i = 1; i <= doc.numPages; i++) {
  const page = await doc.getPage(i);
  const tc = await page.getTextContent();
  all += tc.items.map((it) => it.str).join(" ") + "\n";
}
console.log("TEXT LENGTH:", all.length);
console.log("---- first 800 chars ----");
console.log(all.slice(0, 800));
console.log("---- contains 'Juma'? ----", all.includes("Juma"), "| 'Mwangi'?", all.includes("Mwangi"));
