import React from "react";
import type { TemplateProps } from "./registry";
import { makeTokens } from "./engine/tokens";
import { HeaderLayout } from "./engine/layouts";
import { resolveDocument } from "./engine/document-engine";

export function NarrativeTemplate({ data, primaryColor, fontFamily, lang }: TemplateProps) {
  const doc = resolveDocument(data, {
    density: "airy",
    experienceVariant: "card",
    skillDisplay: "chip",
    showTimeline: true,
    hobbiesDisplay: "chips",
  });

  const tokens = makeTokens(primaryColor, fontFamily, {
    font: { name: 26, nameTitle: 13 },
    color: { faint: "#F8F4EF", text: "#1A1108", sub: "#3D2E1A", muted: "#7C6848" },
  }, doc.density);

  return (
    <HeaderLayout data={data} lang={lang} tokens={tokens} config={{
      headerBg: primaryColor,
      headerTextColor: "#FFFFFF",
      headerSubColor: "rgba(255,255,255,0.82)",
      headerContactColor: "rgba(255,255,255,0.68)",
      bodyBg: "#FFFBF5",
      headerPaddingV: 30,
      mainSectionStyle: "line-accent",
      photoSize: 88,
      photoOnLeft: true,
      skillDisplay: doc.skillDisplay,
      showTimeline: doc.showTimeline,
      hobbiesDisplay: doc.hobbiesDisplay,
      experienceVariant: doc.experienceVariant,
    }} />
  );
}
