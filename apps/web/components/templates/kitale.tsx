import React from "react";
import type { TemplateProps } from "./registry";
import { makeTokens } from "./engine/tokens";
import { SidebarLayout } from "./engine/layouts";
import { resolveDocument } from "./engine/document-engine";

export function KitaleTemplate({ data, primaryColor, fontFamily, lang }: TemplateProps) {
  const doc = resolveDocument(data, { density: "airy", experienceVariant: "default", skillDisplay: "dot", showTimeline: false, hobbiesDisplay: "chips" });
  const tokens = makeTokens(primaryColor, fontFamily, { color: { sidebarBg: "#1E293B", onSidebar: "#F8FAFC", onSidebarMuted: "#94A3B8" } }, doc.density);
  return (
    <SidebarLayout data={data} lang={lang} tokens={tokens} config={{
      sidebarWidth: 220, sidebarBg: tokens.color.sidebarBg, sidebarBorderColor: primaryColor,
      mainBg: "#FFFFFF", nameColor: tokens.color.onSidebar, titleColor: primaryColor, contactIconColor: primaryColor,
      sidebarSectionStyle: "tag", mainSectionStyle: "line-accent", sidebarSections: ["skills","languages","certifications"],
      skillDisplay: doc.skillDisplay, photoSize: 80, photoRadius: 8,
      showTimeline: doc.showTimeline, hobbiesDisplay: doc.hobbiesDisplay, experienceVariant: doc.experienceVariant,
    }} />
  );
}
