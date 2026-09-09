import React from "react";
import type { TemplateProps } from "./registry";
import { makeTokens } from "./engine/tokens";
import { SidebarLayout } from "./engine/layouts";
import { resolveDocument } from "./engine/document-engine";

export function PlateauTemplate({ data, primaryColor, fontFamily, lang }: TemplateProps) {
  const doc = resolveDocument(data, { density: "normal", experienceVariant: "default", skillDisplay: "bar", showTimeline: true, hobbiesDisplay: "chips" });
  const tokens = makeTokens(primaryColor, fontFamily, { color: { sidebarBg: "#F8FAFC", onSidebar: "#1F2937", onSidebarMuted: "#6B7280" } }, doc.density);
  return (
    <SidebarLayout data={data} lang={lang} tokens={tokens} config={{
      sidebarWidth: 220, sidebarBg: tokens.color.sidebarBg,
      mainBg: "#FFFFFF", nameColor: "#1F2937", titleColor: primaryColor, contactIconColor: primaryColor,
      sidebarSectionStyle: "tag", mainSectionStyle: "underline", sidebarSections: ["skills","languages","certifications"],
      skillDisplay: doc.skillDisplay, photoSize: 80, photoRadius: 50,
      showTimeline: doc.showTimeline, hobbiesDisplay: doc.hobbiesDisplay, experienceVariant: doc.experienceVariant,
    }} />
  );
}
