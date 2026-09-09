import React from "react";
import type { TemplateProps } from "./registry";
import { makeTokens } from "./engine/tokens";
import { TwoColumnLayout } from "./engine/layouts";
import { resolveDocument } from "./engine/document-engine";

export function BloomTemplate({ data, primaryColor, fontFamily, lang }: TemplateProps) {
  const doc = resolveDocument(data, { density: "normal", experienceVariant: "card", skillDisplay: "chip", showTimeline: false, hobbiesDisplay: "chips" });
  const tokens = makeTokens(primaryColor, fontFamily, {}, doc.density);
  return (
    <TwoColumnLayout data={data} lang={lang} tokens={tokens} config={{
      headerBg: "#BE185D", headerTextColor: "#FFFFFF", headerSubColor: "#FBCFE8", headerContactColor: "rgba(255,255,255,0.75)",
      leftBg: "#FFF0F6", rightBg: "#FFFFFF", leftWidth: 205,
      leftSections: ["skills","certifications","hobbies"], rightSections: ["summary","experience","education","languages"],
      leftSectionStyle: "pill", rightSectionStyle: "line-accent",
      dividerColor: "#FBCFE8",
      photoSize: 72, photoOnLeft: true,
      skillDisplay: doc.skillDisplay, hobbiesDisplay: doc.hobbiesDisplay,
      experienceVariant: doc.experienceVariant, showTimeline: doc.showTimeline,
    }} />
  );
}
