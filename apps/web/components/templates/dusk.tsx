import React from "react";
import type { TemplateProps } from "./registry";
import { makeTokens } from "./engine/tokens";
import { TwoColumnLayout } from "./engine/layouts";
import { resolveDocument } from "./engine/document-engine";

export function DuskTemplate({ data, primaryColor, fontFamily, lang }: TemplateProps) {
  const doc = resolveDocument(data, { density: "normal", experienceVariant: "card", skillDisplay: "dot", showTimeline: false, hobbiesDisplay: "chips" });
  const tokens = makeTokens(primaryColor, fontFamily, {}, doc.density);
  return (
    <TwoColumnLayout data={data} lang={lang} tokens={tokens} config={{
      headerBg: "#1E293B", headerTextColor: "#F8FAFC", headerSubColor: primaryColor, headerContactColor: "#94A3B8",
      leftBg: "#1E293B", rightBg: "#FFFFFF", leftWidth: 200,
      leftSections: ["skills","languages"], rightSections: ["summary","experience","education","certifications"],
      leftSectionStyle: "tag", rightSectionStyle: "line-accent",
      dividerColor: "#334155",
      photoSize: 76, photoOnLeft: true,
      skillDisplay: doc.skillDisplay, hobbiesDisplay: doc.hobbiesDisplay,
      experienceVariant: doc.experienceVariant, showTimeline: doc.showTimeline,
    }} />
  );
}
