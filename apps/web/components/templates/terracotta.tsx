import React from "react";
import type { TemplateProps } from "./registry";
import { makeTokens } from "./engine/tokens";
import { TwoColumnLayout } from "./engine/layouts";
import { resolveDocument } from "./engine/document-engine";

export function TerracottaTemplate({ data, primaryColor, fontFamily, lang }: TemplateProps) {
  const doc = resolveDocument(data, { density: "normal", experienceVariant: "default", skillDisplay: "bar", showTimeline: false, hobbiesDisplay: "chips" });
  const tokens = makeTokens(primaryColor, fontFamily, {}, doc.density);
  return (
    <TwoColumnLayout data={data} lang={lang} tokens={tokens} config={{
      headerBg: "#B45309", headerTextColor: "#FFFFFF", headerSubColor: "#FEF3C7", headerContactColor: "rgba(255,255,255,0.75)",
      leftBg: "#FEF9F0", rightBg: "#FFFFFF", leftWidth: 215,
      leftSections: ["skills","languages","certifications"], rightSections: ["summary","experience","education","hobbies"],
      leftSectionStyle: "tag", rightSectionStyle: "ruled",
      dividerColor: "#F5DEB3",
      photoSize: 74, photoOnLeft: true,
      skillDisplay: doc.skillDisplay, hobbiesDisplay: doc.hobbiesDisplay,
      experienceVariant: doc.experienceVariant, showTimeline: doc.showTimeline,
    }} />
  );
}
