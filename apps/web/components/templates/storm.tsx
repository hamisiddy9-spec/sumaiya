import React from "react";
import type { TemplateProps } from "./registry";
import { makeTokens } from "./engine/tokens";
import { TwoColumnLayout } from "./engine/layouts";
import { resolveDocument } from "./engine/document-engine";

export function StormTemplate({ data, primaryColor, fontFamily, lang }: TemplateProps) {
  const doc = resolveDocument(data, { density: "normal", experienceVariant: "default", skillDisplay: "tag-rated", showTimeline: false, hobbiesDisplay: "chips" });
  const tokens = makeTokens(primaryColor, fontFamily, {}, doc.density);
  return (
    <TwoColumnLayout data={data} lang={lang} tokens={tokens} config={{
      headerBg: "#1F2937", headerTextColor: "#F8FAFC", headerSubColor: "#9CA3AF", headerContactColor: "#6B7280",
      leftBg: "#F9FAFB", rightBg: "#FFFFFF", leftWidth: 210,
      leftSections: ["skills","languages"], rightSections: ["summary","experience","education","certifications","hobbies"],
      leftSectionStyle: "numbered", rightSectionStyle: "ruled",
      dividerColor: "#E5E7EB",
      photoSize: 76, photoOnLeft: true,
      skillDisplay: doc.skillDisplay, hobbiesDisplay: doc.hobbiesDisplay,
      experienceVariant: doc.experienceVariant, showTimeline: doc.showTimeline,
    }} />
  );
}
