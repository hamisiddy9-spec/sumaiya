import React from "react";
import type { TemplateProps } from "./registry";
import { makeTokens } from "./engine/tokens";
import { HeaderLayout } from "./engine/layouts";
import { resolveDocument } from "./engine/document-engine";

export function ApexTemplate({ data, primaryColor, fontFamily, lang }: TemplateProps) {
  const doc = resolveDocument(data, {
    density: "normal",
    experienceVariant: "card",
    skillDisplay: "bar",
    showTimeline: true,
    hobbiesDisplay: "chips",
  });

  const tokens = makeTokens(primaryColor, fontFamily, { font: { name: 22 } }, doc.density);

  return (
    <HeaderLayout data={data} lang={lang} tokens={tokens} config={{
      headerBg: "#1E293B",
      headerTextColor: "#F8FAFC",
      headerSubColor: primaryColor,
      headerContactColor: "#94A3B8",
      bodyBg: "#FFFFFF",
      headerPaddingV: 26,
      asideWidth: 195,
      asideSections: ["skills", "languages", "certifications"],
      mainSectionStyle: "line-accent",
      asideSectionStyle: "tag",
      photoSize: 76,
      photoOnLeft: true,
      skillDisplay: doc.skillDisplay,
      showTimeline: doc.showTimeline,
      hobbiesDisplay: doc.hobbiesDisplay,
      experienceVariant: doc.experienceVariant,
    }} />
  );
}
