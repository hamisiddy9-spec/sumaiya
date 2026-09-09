import React from "react";
import type { TemplateProps } from "./registry";
import { makeTokens } from "./engine/tokens";
import { TwoColumnLayout } from "./engine/layouts";
import { resolveDocument } from "./engine/document-engine";

export function OceanTemplate({ data, primaryColor, fontFamily, lang }: TemplateProps) {
  const doc = resolveDocument(data, { density: "normal", experienceVariant: "default", skillDisplay: "dot", showTimeline: true, hobbiesDisplay: "chips" });
  const tokens = makeTokens(primaryColor, fontFamily, {}, doc.density);
  return (
    <TwoColumnLayout data={data} lang={lang} tokens={tokens} config={{
      headerBg: "#0369A1", headerTextColor: "#FFFFFF", headerSubColor: "#BAE6FD", headerContactColor: "rgba(255,255,255,0.75)",
      leftBg: "#EFF6FF", rightBg: "#FFFFFF", leftWidth: 215,
      leftSections: ["skills","languages","certifications"], rightSections: ["summary","experience","education","hobbies"],
      leftSectionStyle: "dots", rightSectionStyle: "numbered",
      dividerColor: "#BFDBFE",
      photoSize: 72, photoOnLeft: true,
      skillDisplay: doc.skillDisplay, hobbiesDisplay: doc.hobbiesDisplay,
      experienceVariant: doc.experienceVariant, showTimeline: doc.showTimeline,
    }} />
  );
}
