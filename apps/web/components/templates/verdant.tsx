import React from "react";
import type { TemplateProps } from "./registry";
import { makeTokens } from "./engine/tokens";
import { TwoColumnLayout } from "./engine/layouts";
import { resolveDocument } from "./engine/document-engine";

export function VerdantTemplate({ data, primaryColor, fontFamily, lang }: TemplateProps) {
  const doc = resolveDocument(data, { density: "normal", experienceVariant: "default", skillDisplay: "chip", showTimeline: false, hobbiesDisplay: "chips" });
  const tokens = makeTokens(primaryColor, fontFamily, {}, doc.density);
  return (
    <TwoColumnLayout data={data} lang={lang} tokens={tokens} config={{
      headerBg: "#059669", headerTextColor: "#FFFFFF", headerSubColor: "#ECFDF5", headerContactColor: "rgba(255,255,255,0.75)",
      leftBg: "#F0FDF4", rightBg: "#FFFFFF", leftWidth: 210,
      leftSections: ["skills","certifications","hobbies"], rightSections: ["summary","experience","education","languages"],
      leftSectionStyle: "pill", rightSectionStyle: "dots",
      dividerColor: "#D1FAE5",
      photoSize: 72, photoOnLeft: true,
      skillDisplay: doc.skillDisplay, hobbiesDisplay: doc.hobbiesDisplay,
      experienceVariant: doc.experienceVariant, showTimeline: doc.showTimeline,
    }} />
  );
}
