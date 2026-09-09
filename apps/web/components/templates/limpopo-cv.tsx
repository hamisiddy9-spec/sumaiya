import React from "react";
import type { TemplateProps } from "./registry";
import { makeTokens } from "./engine/tokens";
import { SidebarLayout } from "./engine/layouts";
import { resolveDocument } from "./engine/document-engine";

export function LimpopoCvTemplate({ data, primaryColor, fontFamily, lang }: TemplateProps) {
  const doc = resolveDocument(data, { density: "airy", experienceVariant: "default", skillDisplay: "bar", showTimeline: true, hobbiesDisplay: "chips" });
  const tokens = makeTokens(primaryColor, fontFamily, { color: { sidebarBg: primaryColor, onSidebar: "#FFFFFF", onSidebarMuted: "rgba(255,255,255,0.7)" } }, doc.density);
  return (
    <SidebarLayout data={data} lang={lang} tokens={tokens} config={{
      sidebarWidth: 235, sidebarBg: primaryColor,
      mainBg: "#FFFFFF", nameColor: "#FFFFFF", titleColor: "rgba(255,255,255,0.8)", contactIconColor: "rgba(255,255,255,0.85)",
      sidebarSectionStyle: "tag", mainSectionStyle: "dots", sidebarSections: ["skills","languages","certifications","hobbies"],
      skillDisplay: doc.skillDisplay, photoSize: 86, photoRadius: 50,
      showTimeline: doc.showTimeline, hobbiesDisplay: doc.hobbiesDisplay, experienceVariant: doc.experienceVariant,
    }} />
  );
}
