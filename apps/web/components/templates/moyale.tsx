import React from "react";
import type { TemplateProps } from "./registry";
import { makeTokens } from "./engine/tokens";
import { SidebarLayout } from "./engine/layouts";
import { resolveDocument } from "./engine/document-engine";

export function MoyaleTemplate({ data, primaryColor, fontFamily, lang }: TemplateProps) {
  const doc = resolveDocument(data, { density: "airy", experienceVariant: "default", skillDisplay: "dot", showTimeline: true, hobbiesDisplay: "chips" });
  const tokens = makeTokens(primaryColor, fontFamily, { color: { sidebarBg: "#0D1B2A", onSidebar: "#F8FAFC", onSidebarMuted: "#94A3B8" } }, doc.density);
  return (
    <SidebarLayout data={data} lang={lang} tokens={tokens} config={{
      sidebarWidth: 225, sidebarBg: tokens.color.sidebarBg, sidebarBorderColor: primaryColor,
      mainBg: "#FFFFFF", nameColor: tokens.color.onSidebar, titleColor: primaryColor, contactIconColor: primaryColor,
      sidebarSectionStyle: "none", mainSectionStyle: "dots", sidebarSections: ["skills","languages","certifications","hobbies"],
      skillDisplay: doc.skillDisplay, photoSize: 82, photoRadius: 50,
      showTimeline: doc.showTimeline, hobbiesDisplay: doc.hobbiesDisplay, experienceVariant: doc.experienceVariant,
    }} />
  );
}
