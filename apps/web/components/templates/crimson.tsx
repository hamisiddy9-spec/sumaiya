import React from "react";
import type { TemplateProps } from "./registry";
import { makeTokens } from "./engine/tokens";
import { TwoColumnLayout } from "./engine/layouts";
import { resolveDocument } from "./engine/document-engine";

export function CrimsonTemplate({ data, primaryColor, fontFamily, lang }: TemplateProps) {
  const doc = resolveDocument(data, { density: "normal", experienceVariant: "card", skillDisplay: "bar", showTimeline: false, hobbiesDisplay: "chips" });
  const tokens = makeTokens(primaryColor, fontFamily, {}, doc.density);
  return (
    <TwoColumnLayout data={data} lang={lang} tokens={tokens} config={{
      headerBg: "#991B1B", headerTextColor: "#FFFFFF", headerSubColor: "#FCA5A5", headerContactColor: "rgba(255,255,255,0.7)",
      leftBg: "#FFF5F5", rightBg: "#FFFFFF", leftWidth: 205,
      leftSections: ["skills","languages"], rightSections: ["summary","experience","education","certifications"],
      leftSectionStyle: "tag", rightSectionStyle: "box",
      dividerColor: "#FEE2E2",
      photoSize: 74, photoOnLeft: true,
      skillDisplay: doc.skillDisplay, hobbiesDisplay: doc.hobbiesDisplay,
      experienceVariant: doc.experienceVariant, showTimeline: doc.showTimeline,
    }} />
  );
}
