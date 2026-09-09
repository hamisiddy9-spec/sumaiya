import React from "react";
import type { TemplateProps } from "./registry";
import { makeTokens } from "./engine/tokens";
import { TwoColumnLayout } from "./engine/layouts";
import { resolveDocument } from "./engine/document-engine";

export function SlateTwoTemplate({ data, primaryColor, fontFamily, lang }: TemplateProps) {
  const doc = resolveDocument(data, { density: "normal", experienceVariant: "default", skillDisplay: "grid", showTimeline: false, hobbiesDisplay: "chips" });
  const tokens = makeTokens(primaryColor, fontFamily, {}, doc.density);
  return (
    <TwoColumnLayout data={data} lang={lang} tokens={tokens} config={{
      headerBg: "#334155", headerTextColor: "#F8FAFC", headerSubColor: "#CBD5E1", headerContactColor: "#94A3B8",
      leftBg: "#F1F5F9", rightBg: "#FFFFFF", leftWidth: 205,
      leftSections: ["skills","languages"], rightSections: ["summary","experience","education","certifications","hobbies"],
      leftSectionStyle: "dots", rightSectionStyle: "underline",
      dividerColor: "#CBD5E1",
      photoSize: 70, photoOnLeft: true,
      skillDisplay: doc.skillDisplay, hobbiesDisplay: doc.hobbiesDisplay,
      experienceVariant: doc.experienceVariant, showTimeline: doc.showTimeline,
    }} />
  );
}
