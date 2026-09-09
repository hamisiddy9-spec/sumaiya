import React from "react";
import type { TemplateProps } from "./registry";
import { makeTokens } from "./engine/tokens";
import { TwoColumnLayout } from "./engine/layouts";
import { resolveDocument } from "./engine/document-engine";

export function CarbonTemplate({ data, primaryColor, fontFamily, lang }: TemplateProps) {
  const doc = resolveDocument(data, { density: "normal", experienceVariant: "timeline-v2", skillDisplay: "bar", showTimeline: true, hobbiesDisplay: "chips" });
  const tokens = makeTokens(primaryColor, fontFamily, {}, doc.density);
  return (
    <TwoColumnLayout data={data} lang={lang} tokens={tokens} config={{
      headerBg: "#111827", headerTextColor: "#F9FAFB", headerSubColor: "#6EE7B7", headerContactColor: "#9CA3AF",
      leftBg: "#18181B", rightBg: "#FFFFFF", leftWidth: 215,
      leftSections: ["skills","languages","certifications"], rightSections: ["summary","experience","education","hobbies"],
      leftSectionStyle: "tag", rightSectionStyle: "line-accent",
      dividerColor: "#374151",
      photoSize: 76, photoOnLeft: true,
      skillDisplay: doc.skillDisplay, hobbiesDisplay: doc.hobbiesDisplay,
      experienceVariant: doc.experienceVariant, showTimeline: doc.showTimeline,
    }} />
  );
}
