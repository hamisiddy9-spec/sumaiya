/**
 * The Skills section must reach the PDF's ATS text layer.
 *
 * This is the most user-visible half of D8 (docs/QA-IO-MATRIX-2026-09-20.md): a
 * CV whose skills were written without a numeric `level` — by the mobile writer,
 * an import, or an older build — rendered with NO Skills section at all, and the
 * exported PDF's invisible ATS text layer, the only part of a rasterized export
 * a résumé parser can read, contained no skill name whatsoever. The candidate's
 * PDF looked right to a human and was blank to the machine screening it.
 *
 * `buildCvText` IS that text layer: `lib/pdf.ts` hands its output to jsPDF and
 * draws it invisibly over the rasterized sheet (`renderPdfDoc`, `opts.textLayer`),
 * and the .txt export uses the same string. So this pins the whole chain that
 * failed — parseCVData -> buildCvText -> the names an ATS actually reads — not
 * just the parser in isolation.
 */
import { describe, expect, it } from "vitest";
import { buildCvText, type CvTextInput } from "@/lib/pdf";
import { parseCVData } from "@/types";

/** The nine skills of the D8 fixture (docs/qa-fixtures-2026-09-20/
 *  parsecvdata-proof.txt), written the way they really were: id + name, no
 *  `level`. Measured before the fix: 9 in, **0 out**. */
const NINE_SKILLS = [
  "TypeScript", "Node.js", "PostgreSQL", "AWS", "Docker",
  "Terraform", "Kafka", "React", "Go",
];

const D8_ROW: CvTextInput = {
  personal: {
    fullName: "Asha Mwinyi",
    jobTitle: "Software Engineer",
    email: "asha@example.co.tz",
    phone: "+255 700 000 000",
    location: "Dar es Salaam",
  },
  summary: "Mhandisi wa programu mwenye uzoefu wa miaka sita katika timu za bidhaa.",
  skills: NINE_SKILLS.map((name, i) => ({ id: `s${i + 1}`, name })),
};

describe("the ATS text layer keeps the Skills section", () => {
  it("keeps all nine skills when not one of them carries a level", () => {
    const cv = parseCVData(D8_ROW);
    expect(cv.skills.map((s) => s.name)).toEqual(NINE_SKILLS);

    const text = buildCvText(cv, "sw");
    expect(text).toContain("UJUZI"); // the Swahili heading the page renders
    expect(text).toContain(NINE_SKILLS.join(", "));
    for (const name of NINE_SKILLS) expect(text).toContain(name);
  });

  it("writes the same section into the English text layer", () => {
    const text = buildCvText(parseCVData(D8_ROW), "en");
    expect(text).toContain("SKILLS");
    expect(text).toContain(NINE_SKILLS.join(", "));
  });

  it("is exactly the string that vanished: an empty skills array loses the section", () => {
    // The pre-fix parse result, reproduced deliberately. The PDF the candidate
    // downloaded held this and nothing else about their skills — no heading, no
    // name — which is what made D8 silent rather than merely wrong.
    const before = buildCvText({ ...D8_ROW, skills: [] }, "sw");
    expect(before).not.toContain("UJUZI");
    for (const name of NINE_SKILLS) expect(before).not.toContain(name);
  });

  it("gives a hidden Skills section no text layer either (the user hid it)", () => {
    // `hiddenSections` mirrors the page: a section the candidate removed must not
    // reappear in the machine copy. Same code path, opposite expectation.
    const text = buildCvText({ ...D8_ROW, hiddenSections: ["skills"] }, "sw");
    expect(text).not.toContain("UJUZI");
  });
});
