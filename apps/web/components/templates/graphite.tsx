import React from "react";
import type { TemplateProps } from "./registry";
import { makeTokens } from "./engine/tokens";
import { TwoColumnLayout } from "./engine/layouts";
import { resolveDocument } from "./engine/document-engine";

export function GraphiteTemplate({ data, primaryColor, fontFamily, lang }: TemplateProps) {
  const doc = resolveDocument(data, { density: "compact", experienceVariant: "compact", skillDisplay: "grid", showTimeline: false, hobbiesDisplay: "chips" });
  const tokens = makeTokens(primaryColor, fontFamily, {}, doc.density);
  return (
    <TwoColumnLayout data={data} lang={lang} tokens={tokens} config={{
      headerBg: "#1C1C1C", headerTextColor: "#F9FAFB", headerSubColor: "#A3A3A3", headerContactColor: "#737373",
      leftBg: "#F5F5F5", rightBg: "#FFFFFF", leftWidth: 200,
      leftSections: ["skills","certifications"], rightSections: ["summary","experience","education","languages","hobbies"],
      leftSectionStyle: "ruled", rightSectionStyle: "underline",
      dividerColor: "#D4D4D4",
      photoSize: 70, photoOnLeft: true,
      skillDisplay: doc.skillDisplay, hobbiesDisplay: doc.hobbiesDisplay,
      experienceVariant: doc.experienceVariant, showTimeline: doc.showTimeline,
    }} />
  );
}
