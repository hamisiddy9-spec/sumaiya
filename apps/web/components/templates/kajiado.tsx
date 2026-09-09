import React from "react";
import type { TemplateProps } from "./registry";
import { makeTokens } from "./engine/tokens";
import { SidebarLayout } from "./engine/layouts";
import { resolveDocument } from "./engine/document-engine";

export function KajiadoTemplate({ data, primaryColor, fontFamily, lang }: TemplateProps) {
  const doc = resolveDocument(data, { density: "compact", experienceVariant: "compact", skillDisplay: "chip", showTimeline: false, hobbiesDisplay: "chips" });
  const tokens = makeTokens(primaryColor, fontFamily, { color: { sidebarBg: "#111827", onSidebar: "#F8FAFC", onSidebarMuted: "#94A3B8" } }, doc.density);
  return (
    <SidebarLayout data={data} lang={lang} tokens={tokens} config={{
      sidebarWidth: 195, sidebarBg: tokens.color.sidebarBg, sidebarBorderColor: primaryColor,
      mainBg: "#FFFFFF", nameColor: tokens.color.onSidebar, titleColor: primaryColor, contactIconColor: primaryColor,
      sidebarSectionStyle: "tag", mainSectionStyle: "dots", sidebarSections: ["skills","certifications"],
      skillDisplay: doc.skillDisplay, photoSize: 68, photoRadius: 0,
      showTimeline: doc.showTimeline, hobbiesDisplay: doc.hobbiesDisplay, experienceVariant: doc.experienceVariant,
    }} />
  );
}
