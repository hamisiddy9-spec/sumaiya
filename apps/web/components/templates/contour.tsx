import React from "react";
import type { TemplateProps } from "./registry";
import { makeTokens } from "./engine/tokens";
import { SidebarLayout } from "./engine/layouts";
import { resolveDocument } from "./engine/document-engine";

export function ContourTemplate({ data, primaryColor, fontFamily, lang }: TemplateProps) {
  const doc = resolveDocument(data, { density: "normal", experienceVariant: "card", skillDisplay: "dot", showTimeline: false, hobbiesDisplay: "chips" });
  const tokens = makeTokens(primaryColor, fontFamily, { color: { sidebarBg: "#F1F5F9", onSidebar: "#1F2937", onSidebarMuted: "#6B7280" } }, doc.density);
  return (
    <SidebarLayout data={data} lang={lang} tokens={tokens} config={{
      sidebarWidth: 220, sidebarBg: tokens.color.sidebarBg,
      mainBg: "#FFFFFF", nameColor: "#1F2937", titleColor: primaryColor, contactIconColor: primaryColor,
      sidebarSectionStyle: "none", mainSectionStyle: "box", sidebarSections: ["skills","languages","certifications"],
      skillDisplay: doc.skillDisplay, photoSize: 80, photoRadius: 50,
      showTimeline: doc.showTimeline, hobbiesDisplay: doc.hobbiesDisplay, experienceVariant: doc.experienceVariant,
    }} />
  );
}
