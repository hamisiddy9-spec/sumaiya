import React from "react";
import type { TemplateProps } from "./registry";
import { makeTokens } from "./engine/tokens";
import { SidebarLayout } from "./engine/layouts";
import { resolveDocument } from "./engine/document-engine";

export function EstuaryTemplate({ data, primaryColor, fontFamily, lang }: TemplateProps) {
  const doc = resolveDocument(data, { density: "normal", experienceVariant: "default", skillDisplay: "chip", showTimeline: false, hobbiesDisplay: "chips" });
  const tokens = makeTokens(primaryColor, fontFamily, { color: { sidebarBg: "#EFF6FF", onSidebar: "#1F2937", onSidebarMuted: "#6B7280" } }, doc.density);
  return (
    <SidebarLayout data={data} lang={lang} tokens={tokens} config={{
      sidebarWidth: 200, sidebarBg: tokens.color.sidebarBg,
      mainBg: "#FFFFFF", nameColor: "#1F2937", titleColor: primaryColor, contactIconColor: primaryColor,
      sidebarSectionStyle: "none", mainSectionStyle: "underline", sidebarSections: ["skills","languages"],
      skillDisplay: doc.skillDisplay, photoSize: 70, photoRadius: 50,
      showTimeline: doc.showTimeline, hobbiesDisplay: doc.hobbiesDisplay, experienceVariant: doc.experienceVariant,
    }} />
  );
}
