import React from "react";
import type { TemplateProps } from "./registry";
import { makeTokens } from "./engine/tokens";
import { HeaderLayout } from "./engine/layouts";
import { resolveDocument } from "./engine/document-engine";

export function RaleighTemplate({ data, primaryColor, fontFamily, lang }: TemplateProps) {
  const doc = resolveDocument(data, { density: "compact", experienceVariant: "compact", skillDisplay: "chip", showTimeline: false, hobbiesDisplay: "chips" });
  const tokens = makeTokens(primaryColor, fontFamily, {}, doc.density);
  return (
    <HeaderLayout data={data} lang={lang} tokens={tokens} config={{
      headerBg: "#0D1B2A", headerTextColor: "#F8FAFC", headerSubColor: primaryColor, headerContactColor: "#94A3B8",
      bodyBg: "#FFFFFF", headerPaddingV: 24,
      asideWidth: 185, asideSections: ["skills","languages"], asideSectionStyle: "tag",
      mainSectionStyle: "line-accent", photoSize: 78, photoOnLeft: true,
      skillDisplay: doc.skillDisplay, showTimeline: doc.showTimeline, hobbiesDisplay: doc.hobbiesDisplay, experienceVariant: doc.experienceVariant,
    }} />
  );
}
