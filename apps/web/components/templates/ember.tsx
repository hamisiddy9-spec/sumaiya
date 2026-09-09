import React from "react";
import type { TemplateProps } from "./registry";
import { makeTokens } from "./engine/tokens";
import { TwoColumnLayout } from "./engine/layouts";
import { resolveDocument } from "./engine/document-engine";

export function EmberTemplate({ data, primaryColor, fontFamily, lang }: TemplateProps) {
  const doc = resolveDocument(data, { density: "normal", experienceVariant: "timeline-v2", skillDisplay: "bar", showTimeline: false, hobbiesDisplay: "chips" });
  const tokens = makeTokens(primaryColor, fontFamily, {}, doc.density);
  return (
    <TwoColumnLayout data={data} lang={lang} tokens={tokens} config={{
      headerBg: "#7C2D12", headerTextColor: "#FFFFFF", headerSubColor: "#FCA5A5", headerContactColor: "rgba(255,255,255,0.7)",
      leftBg: "#FFF7ED", rightBg: "#FFFFFF", leftWidth: 215,
      leftSections: ["skills","certifications"], rightSections: ["summary","experience","education","languages","hobbies"],
      leftSectionStyle: "tag", rightSectionStyle: "dots",
      dividerColor: "#FED7AA",
      photoSize: 72, photoOnLeft: true,
      skillDisplay: doc.skillDisplay, hobbiesDisplay: doc.hobbiesDisplay,
      experienceVariant: doc.experienceVariant, showTimeline: doc.showTimeline,
    }} />
  );
}
