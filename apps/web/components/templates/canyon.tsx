import React from "react";
import type { TemplateProps } from "./registry";
import { makeTokens } from "./engine/tokens";
import { HeaderLayout } from "./engine/layouts";
import { resolveDocument } from "./engine/document-engine";

export function CanyonTemplate({ data, primaryColor, fontFamily, lang }: TemplateProps) {
  const doc = resolveDocument(data, { density: "compact", experienceVariant: "default", skillDisplay: "dot", showTimeline: false, hobbiesDisplay: "chips" });
  const tokens = makeTokens(primaryColor, fontFamily, {}, doc.density);
  return (
    <HeaderLayout data={data} lang={lang} tokens={tokens} config={{
      headerBg: primaryColor, headerTextColor: "#FFFFFF", headerSubColor: "rgba(255,255,255,0.8)", headerContactColor: "rgba(255,255,255,0.75)",
      bodyBg: "#FFFFFF", headerPaddingV: 26,
      asideWidth: 190, asideSections: ["skills","languages"], asideSectionStyle: "dots",
      mainSectionStyle: "dots", photoSize: 76, photoOnLeft: true,
      skillDisplay: doc.skillDisplay, showTimeline: doc.showTimeline, hobbiesDisplay: doc.hobbiesDisplay, experienceVariant: doc.experienceVariant,
    }} />
  );
}
