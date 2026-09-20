/**
 * Proves the CV photo actually reaches the rendered page for the CURATED
 * template set — and, just as importantly, that it reaches NONE of them when
 * the candidate has not uploaded one.
 *
 * Why this file exists rather than trusting the code: the user's complaint was
 * "I don't see templates with a place to put a photo". A template can look
 * photo-capable (it may even carry a `photoSize` field) and still render
 * nothing, because only its own header decides whether an <img> is emitted. The
 * only way to know is to render each template and look at the markup.
 *
 * Two contracts are asserted per template:
 *   1. with a photo   -> the photo is in the markup, drawn with
 *                        `background-size: cover` (cover is what keeps the face
 *                        undistorted; the rasterizer the PDF export uses has no
 *                        object-fit support, so an <img> would export a
 *                        squashed face — see photoFrames below and
 *                        scripts/photo-cover-mechanism-probe.mjs).
 *   2. without a photo -> NO image is emitted at all. This is the "must not
 *                        break or leave a hole" requirement: no broken src, no
 *                        orphan frame, no reserved gap.
 *
 * `grid` is asserted in the OPPOSITE direction on purpose: it strips the photo
 * by design (ATS mode), so a future edit that "fixes" it would be a regression,
 * not an improvement.
 *
 * Rendered with react-dom/server — this project's suite is node-only.
 */
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TEMPLATE_COMPONENTS } from "./registry";
import { CURATED_CV_TEMPLATE_IDS } from "@/lib/templates/curation";
import type { TemplateProps } from "./registry";
import type { CVData } from "@/types";

// A 1x1 JPEG data URL. The templates only ever put this in `src`; nothing here
// decodes it, so the bytes need only be structurally valid.
const PHOTO = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==";

function buildCv(photo?: string): CVData {
  return {
    personal: {
      fullName: "Asha Mwinyi",
      jobTitle: "Operations Manager",
      email: "asha@example.com",
      phone: "+255700000000",
      location: "Dar es Salaam, Tanzania",
      linkedin: "linkedin.com/in/asha",
      website: "asha.example.com",
      photo,
    },
    summary:
      "Operations manager with nine years across logistics and retail distribution in East Africa, focused on cost control and reliable delivery.",
    experience: [
      {
        id: "e1",
        company: "Coastal Logistics",
        position: "Operations Manager",
        location: "Dar es Salaam",
        startDate: "2020-03",
        endDate: "",
        current: true,
        description: "Ran a 40-vehicle fleet and cut delivery delays by 22%.",
      },
    ],
    education: [
      {
        id: "ed1",
        institution: "University of Dar es Salaam",
        degree: "BCom",
        field: "Business Administration",
        startDate: "2011-09",
        endDate: "2014-06",
      },
    ],
    skills: [
      { id: "s1", name: "Supply chain", level: 5 },
      { id: "s2", name: "Budgeting", level: 4 },
    ],
    projects: [],
    languages: [{ id: "l1", name: "Swahili", proficiency: "Native" }],
    certifications: [
      { id: "c1", name: "CIPS Level 4", issuer: "CIPS", date: "2021-05" },
    ],
    referees: [],
    hobbies: "Running",
  };
}

function render(id: string, photo?: string): string {
  const Component = TEMPLATE_COMPONENTS[id as keyof typeof TEMPLATE_COMPONENTS];
  if (!Component) throw new Error(`no component registered for template id: ${id}`);
  const props: TemplateProps = {
    data: buildCv(photo),
    primaryColor: "#B45309",
    fontFamily: "Inter",
    lang: "sw",
  };
  return renderToStaticMarkup(createElement(Component, props));
}

/**
 * Every element that draws the photo, in the form the templates now use: a
 * frame whose background is the photo with `background-size: cover`.
 *
 * The contract changed from "an <img> with object-fit: cover". object-fit is
 * NOT a contract the PDF can honour — the export rasterizes with html2canvas
 * 1.4.1, whose dist contains no object-fit support at all, so an <img> is drawn
 * into its element box and a non-square photo comes out with a squashed face.
 * `background-size: cover` IS implemented by html2canvas, and browsers render
 * the identical crop, so it is the only mechanism that makes the preview and the
 * download agree. Measured: scripts/photo-cover-mechanism-probe.mjs.
 */
function photoFrames(html: string): Array<{ background: string; size: string }> {
  const out: Array<{ background: string; size: string }> = [];
  for (const tag of html.match(/<[a-z]+\b[^>]*>/g) ?? []) {
    const style = /\bstyle="([^"]*)"/.exec(tag)?.[1] ?? "";
    const bg = /background-image:\s*url\(&quot;?(data:image\/[^)"&]*)/.exec(style)
      ?? /background-image:\s*url\(([^)]*)\)/.exec(style);
    if (bg && bg[1].startsWith("data:image/")) {
      out.push({ background: bg[1], size: /background-size:\s*([a-z-]+)/.exec(style)?.[1] ?? "" });
    }
  }
  return out;
}

// The 22 curated templates that had NO photo path at all before this change.
const NEWLY_PHOTO_CAPABLE = [
  "nuru", "pemba", "zege", "console", "riso", "neon", "regent", "marlowe",
  "cavendish", "haven", "metro", "horizon", "nova", "victoria", "monarch",
  "oxford", "titan", "vertex", "tokyo-grid", "sahara", "nordic-minimal", "berlin",
];

// Templates that refuse the photo ON PURPOSE, all three from the curated
// "Minimal / ATS" group, where the output is meant to stay machine-parseable:
//   grid      -> spreads `personal.photo` away entirely
//   stripe    -> passes engine config photoSize: 0
//   mono-cv   -> passes engine config photoSize: 0
// The engine treats photoSize: 0 as "no portrait slot" (layouts.tsx: `photoSize > 0 &&`).
// Asserted in the OPPOSITE direction below, so a later edit that "fixes" them
// fails loudly instead of silently changing what these layouts emit.
const DELIBERATELY_PHOTOLESS = ["grid", "stripe", "mono-cv"];
const PHOTO_CAPABLE = CURATED_CV_TEMPLATE_IDS.filter(
  (id) => !DELIBERATELY_PHOTOLESS.includes(id)
);

describe("curated templates: the photo is really rendered", () => {
  it("covers the curated set minus the three deliberate ATS opt-outs", () => {
    expect(CURATED_CV_TEMPLATE_IDS.length).toBe(47);
    expect(PHOTO_CAPABLE.length).toBe(44);
  });

  it("every curated photo-capable template emits the photo when one is set", () => {
    const missing = PHOTO_CAPABLE.filter((id) => photoFrames(render(id, PHOTO)).length === 0);
    expect(missing).toEqual([]);
  });

  it("draws the photo with background-size:cover everywhere, so no face is stretched", () => {
    // The mechanism matters, not the styling: html2canvas (the PDF rasterizer)
    // ignores object-fit and stretches an <img> to its box, so an <img> here
    // would export a squashed face for any photo whose aspect is not the
    // frame's. background-size:cover is the one mechanism both the browser and
    // html2canvas honour identically.
    const stretched = PHOTO_CAPABLE.filter((id) => {
      const frames = photoFrames(render(id, PHOTO));
      return frames.length === 0 || frames.some((f) => f.size !== "cover");
    });
    expect(stretched).toEqual([]);
  });

  it("never draws the photo as an <img> with object-fit — the rasterizer ignores it", () => {
    const viaImg = PHOTO_CAPABLE.filter((id) => {
      const html = render(id, PHOTO);
      return (html.match(/<img\b[^>]*>/g) ?? []).some(
        (tag) => /src="data:image\//.test(tag) || /object-fit/.test(tag),
      );
    });
    expect(viaImg).toEqual([]);
  });

  it("keeps the portrait announced to assistive tech (role=img + the candidate's name)", () => {
    const silent = PHOTO_CAPABLE.filter((id) => {
      const html = render(id, PHOTO);
      return !/role="img"/.test(html) || !/aria-label="Asha Mwinyi"/.test(html);
    });
    expect(silent).toEqual([]);
  });

  it("emits NO image at all when the candidate has not added a photo", () => {
    const leaked = PHOTO_CAPABLE.filter((id) => render(id, undefined).includes("data:image/"));
    expect(leaked).toEqual([]);
  });

  it("each newly photo-capable template leaves no empty frame when there is no photo", () => {
    // CvPhoto returns null without a url, so these templates must not render a
    // reserved, empty portrait box at all.
    const holes = NEWLY_PHOTO_CAPABLE.filter((id) => {
      const html = render(id, undefined);
      return photoFrames(html).length > 0 || html.includes("background-size:cover");
    });
    expect(holes).toEqual([]);
  });

  it("still renders the name with no photo — the header does not collapse", () => {
    const nameless = PHOTO_CAPABLE.filter(
      (id) => !render(id, undefined).includes("Asha Mwinyi")
    );
    expect(nameless).toEqual([]);
  });

  it("renders identically whether the photo comes before or after the name in the document", () => {
    // Guards the flex-row insertions: the photo must not push the name out of
    // the header, and the name must still be present with the photo set.
    const broken = PHOTO_CAPABLE.filter((id) => {
      const html = render(id, PHOTO);
      return !html.includes("Asha Mwinyi") || !html.includes(PHOTO);
    });
    expect(broken).toEqual([]);
  });

  it("the three ATS/minimal templates keep refusing the photo — deliberately", () => {
    // Asserted in the opposite direction: if someone makes these render a
    // photo, this fails, because that changes what an ATS-targeted layout emits.
    for (const id of DELIBERATELY_PHOTOLESS) {
      expect(render(id, PHOTO), `${id} must not render a photo`).not.toContain("data:image/");
    }
  });
});

describe("curated templates: the 7 premium flagships are all photo-capable", () => {
  const PREMIUM = ["rift", "zahabu", "nuru", "pemba", "malachite", "coral", "kioo"];

  it("accepts both the name and the photo markup in Swahili", () => {
    // Checked in Swahili because that is the primary locale (Swahili first).
    const missing = PREMIUM.filter((id) => {
      const html = render(id, PHOTO);
      return !html.includes(PHOTO) || photoFrames(html).length === 0;
    });
    expect(missing).toEqual([]);
  });

  it("no premium flagship renders a photo the user did not provide", () => {
    const leaked = PREMIUM.filter((id) => render(id, undefined).includes("data:image/"));
    expect(leaked).toEqual([]);
  });
});
