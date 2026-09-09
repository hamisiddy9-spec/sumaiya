import React from "react";
import type { TemplateProps } from "./registry";
import { makeTokens } from "./engine/tokens";
import { SidebarLayout } from "./engine/layouts";
import { resolveDocument } from "./engine/document-engine";

export function RufijiTemplate({ data, primaryColor, fontFamily, lang }: TemplateProps) {
  const doc = resolveDocument(data, { density: "normal", experienceVariant: "default", skillDisplay: "dot", showTimeline: true, hobbiesDisplay: "chips" });
  const tokens = makeTokens(primaryColor, fontFamily, { color: { sidebarBg: primaryColor, onSidebar: "#FFFFFF", onSidebarMuted: "rgba(255,255,255,0.7)" } }, doc.density);
  return (
    <SidebarLayout data={data} lang={lang} tokens={tokens} config={{
      sidebarWidth: 240, sidebarBg: primaryColor,
      mainBg: "#FFFFFF", nameColor: "#FFFFFF", titleColor: "rgba(255,255,255,0.8)", contactIconColor: "rgba(255,255,255,0.85)",
      sidebarSectionStyle: "dots", mainSectionStyle: "underline", sidebarSections: ["skills","languages","certifications"],
      skillDisplay: doc.skillDisplay, photoSize: 88, photoRadius: 50,
      showTimeline: doc.showTimeline, hobbiesDisplay: doc.hobbiesDisplay, experienceVariant: doc.experienceVariant,
    }} />
  );
}
