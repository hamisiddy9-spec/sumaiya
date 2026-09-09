import React from "react";
import type { TemplateProps } from "./registry";
import { makeTokens } from "./engine/tokens";
import { TwoColumnLayout } from "./engine/layouts";
import { resolveDocument } from "./engine/document-engine";

export function AuroraTwoTemplate({ data, primaryColor, fontFamily, lang }: TemplateProps) {
  const doc = resolveDocument(data, { density: "airy", experienceVariant: "default", skillDisplay: "chip", showTimeline: false, hobbiesDisplay: "chips" });
  const tokens = makeTokens(primaryColor, fontFamily, {}, doc.density);
  return (
    <TwoColumnLayout data={data} lang={lang} tokens={tokens} config={{
      headerBg: "#6D28D9", headerTextColor: "#FFFFFF", headerSubColor: "rgba(255,255,255,0.8)", headerContactColor: "rgba(255,255,255,0.65)",
      leftBg: "#F5F3FF", rightBg: "#FFFFFF", leftWidth: 210,
      leftSections: ["skills","certifications","hobbies"], rightSections: ["summary","experience","education","languages"],
      leftSectionStyle: "pill", rightSectionStyle: "underline",
      dividerColor: "#DDD6FE",
      photoSize: 72, photoOnLeft: true,
      skillDisplay: doc.skillDisplay, hobbiesDisplay: doc.hobbiesDisplay,
      experienceVariant: doc.experienceVariant, showTimeline: doc.showTimeline,
    }} />
  );
}
