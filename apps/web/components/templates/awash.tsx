import React from "react";
import type { TemplateProps } from "./registry";
import { makeTokens } from "./engine/tokens";
import { SidebarLayout } from "./engine/layouts";
import { resolveDocument } from "./engine/document-engine";

export function AwashTemplate({ data, primaryColor, fontFamily, lang }: TemplateProps) {
  const doc = resolveDocument(data, { density: "airy", experienceVariant: "card", skillDisplay: "bar", showTimeline: false, hobbiesDisplay: "chips" });
  const tokens = makeTokens(primaryColor, fontFamily, { color: { sidebarBg: primaryColor, onSidebar: "#FFFFFF", onSidebarMuted: "rgba(255,255,255,0.7)" } }, doc.density);
  return (
    <SidebarLayout data={data} lang={lang} tokens={tokens} config={{
      sidebarWidth: 230, sidebarBg: primaryColor,
      mainBg: "#FFFFFF", nameColor: "#FFFFFF", titleColor: "rgba(255,255,255,0.8)", contactIconColor: "rgba(255,255,255,0.85)",
      sidebarSectionStyle: "none", mainSectionStyle: "underline", sidebarSections: ["skills","languages","certifications","hobbies"],
      skillDisplay: doc.skillDisplay, photoSize: 84, photoRadius: 50,
      showTimeline: doc.showTimeline, hobbiesDisplay: doc.hobbiesDisplay, experienceVariant: doc.experienceVariant,
    }} />
  );
}
