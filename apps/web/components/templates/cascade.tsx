import React from "react";
import type { TemplateProps } from "./registry";
import { makeTokens } from "./engine/tokens";
import { TwoColumnLayout } from "./engine/layouts";
import { resolveDocument } from "./engine/document-engine";

export function CascadeTemplate({ data, primaryColor, fontFamily, lang }: TemplateProps) {
  const doc = resolveDocument(data, { density: "normal", experienceVariant: "default", skillDisplay: "bar", showTimeline: false, hobbiesDisplay: "chips" });
  const tokens = makeTokens(primaryColor, fontFamily, {}, doc.density);
  return (
    <TwoColumnLayout data={data} lang={lang} tokens={tokens} config={{
      headerBg: "#0F172A", headerTextColor: "#F8FAFC", headerSubColor: primaryColor, headerContactColor: "#94A3B8",
      leftBg: "#F8FAFC", rightBg: "#FFFFFF", leftWidth: 220,
      leftSections: ["skills","languages","certifications"], rightSections: ["summary","experience","education","hobbies"],
      leftSectionStyle: "tag", rightSectionStyle: "underline",
      dividerColor: "#E2E8F0",
      photoSize: 72, photoOnLeft: true,
      skillDisplay: doc.skillDisplay, hobbiesDisplay: doc.hobbiesDisplay,
      experienceVariant: doc.experienceVariant, showTimeline: doc.showTimeline,
    }} />
  );
}
