import React from "react";
import type { TemplateProps } from "./registry";
import { makeTokens } from "./engine/tokens";
import { SidebarLayout } from "./engine/layouts";
import { resolveDocument } from "./engine/document-engine";

export function KageraTemplate({ data, primaryColor, fontFamily, lang }: TemplateProps) {
  const doc = resolveDocument(data, { density: "compact", experienceVariant: "compact", skillDisplay: "chip", showTimeline: false, hobbiesDisplay: "chips" });
  const tokens = makeTokens(primaryColor, fontFamily, { color: { sidebarBg: primaryColor, onSidebar: "#FFFFFF", onSidebarMuted: "rgba(255,255,255,0.7)" } }, doc.density);
  return (
    <SidebarLayout data={data} lang={lang} tokens={tokens} config={{
      sidebarWidth: 205, sidebarBg: primaryColor,
      mainBg: "#FFFFFF", nameColor: "#FFFFFF", titleColor: "rgba(255,255,255,0.8)", contactIconColor: "rgba(255,255,255,0.85)",
      sidebarSectionStyle: "none", mainSectionStyle: "dots", sidebarSections: ["skills","certifications"],
      skillDisplay: doc.skillDisplay, photoSize: 74, photoRadius: 8,
      showTimeline: doc.showTimeline, hobbiesDisplay: doc.hobbiesDisplay, experienceVariant: doc.experienceVariant,
    }} />
  );
}
