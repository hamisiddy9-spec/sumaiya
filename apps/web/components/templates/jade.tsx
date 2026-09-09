import React from "react";
import type { TemplateProps } from "./registry";
import { makeTokens } from "./engine/tokens";
import { TwoColumnLayout } from "./engine/layouts";
import { resolveDocument } from "./engine/document-engine";

export function JadeTemplate({ data, primaryColor, fontFamily, lang }: TemplateProps) {
  const doc = resolveDocument(data, { density: "normal", experienceVariant: "default", skillDisplay: "chip", showTimeline: false, hobbiesDisplay: "chips" });
  const tokens = makeTokens(primaryColor, fontFamily, {}, doc.density);
  return (
    <TwoColumnLayout data={data} lang={lang} tokens={tokens} config={{
      headerBg: "#065F46", headerTextColor: "#FFFFFF", headerSubColor: "#6EE7B7", headerContactColor: "rgba(255,255,255,0.75)",
      leftBg: "#ECFDF5", rightBg: "#FFFFFF", leftWidth: 210,
      leftSections: ["skills","languages","hobbies"], rightSections: ["summary","experience","education","certifications"],
      leftSectionStyle: "pill", rightSectionStyle: "line-accent",
      dividerColor: "#A7F3D0",
      photoSize: 76, photoOnLeft: true,
      skillDisplay: doc.skillDisplay, hobbiesDisplay: doc.hobbiesDisplay,
      experienceVariant: doc.experienceVariant, showTimeline: doc.showTimeline,
    }} />
  );
}
