import React from "react";
import type { TemplateProps } from "./registry";
import { makeTokens } from "./engine/tokens";
import { TwoColumnLayout } from "./engine/layouts";
import { resolveDocument } from "./engine/document-engine";

export function CobaltTemplate({ data, primaryColor, fontFamily, lang }: TemplateProps) {
  const doc = resolveDocument(data, { density: "airy", experienceVariant: "default", skillDisplay: "dot", showTimeline: false, hobbiesDisplay: "chips" });
  const tokens = makeTokens(primaryColor, fontFamily, {}, doc.density);
  return (
    <TwoColumnLayout data={data} lang={lang} tokens={tokens} config={{
      headerBg: "#1E3A8A", headerTextColor: "#FFFFFF", headerSubColor: "#93C5FD", headerContactColor: "rgba(255,255,255,0.75)",
      leftBg: "#EFF6FF", rightBg: "#FFFFFF", leftWidth: 205,
      leftSections: ["skills","languages","certifications"], rightSections: ["summary","experience","education","hobbies"],
      leftSectionStyle: "dots", rightSectionStyle: "underline",
      dividerColor: "#BFDBFE",
      photoSize: 74, photoOnLeft: true,
      skillDisplay: doc.skillDisplay, hobbiesDisplay: doc.hobbiesDisplay,
      experienceVariant: doc.experienceVariant, showTimeline: doc.showTimeline,
    }} />
  );
}
