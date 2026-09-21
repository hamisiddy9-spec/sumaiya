// Renders the REAL KiooTemplate to static markup, once per version.
//   before = git HEAD (raw <img object-fit:cover>)
//   after  = working tree (CoverImg / background-size:cover)
import { execFileSync } from "node:child_process";
import fs from "node:fs";

const which = process.argv[2];
const entry = `.qa-io/kioo-${which}-entry.tsx`;
const bundleOut = `.qa-io/kioo-${which}.cjs`;
const htmlOut = `.qa-io/kioo-${which}.html`;

const disc = fs.readFileSync(".qa-io/disc-600.png").toString("base64");
const photo = "data:image/png;base64," + disc;
const kiooImport = which === "before" ? "../.qa-io/head/kioo.tsx" : "@/components/templates/kioo";

fs.writeFileSync(entry, `
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { KiooTemplate } from "${kiooImport}";

const photo = ${JSON.stringify(photo)};
const cv = {
  personal: { fullName: "Amina Joseph Mwakasege", jobTitle: "Software Engineer", email: "a@b.co", phone: "0712", location: "Dar es Salaam", photo },
  summary: "Software engineer.",
  experience: [{ id: "e1", company: "Acme", position: "Engineer", startDate: "2020", endDate: "2024", current: false, description: "Built things." }],
  education: [], skills: [], languages: [], certifications: [], referees: [], hobbies: "",
};
const markup = renderToStaticMarkup(createElement(KiooTemplate, { data: cv, primaryColor: "#2563EB", fontFamily: "Arial, sans-serif", lang: "en" }));
console.log(JSON.stringify({ markup }));
`, "utf8");

const { build } = await import("esbuild");
await build({
  entryPoints: [entry],
  bundle: true,
  format: "cjs",
  platform: "node",
  outfile: bundleOut,
  alias: { "@": "./apps/web" },
  jsx: "automatic",
  logLevel: "warning",
});

const out = execFileSync("node", [bundleOut]).toString();
fs.writeFileSync(htmlOut, JSON.parse(out).markup);
console.log("wrote", htmlOut, JSON.parse(out).markup.length, "chars");
