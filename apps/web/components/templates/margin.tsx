import React from "react";
import type { TemplateProps } from "./registry";
import { makeTokens } from "./engine/tokens";
import { AccentBandLayout } from "./engine/layouts";
import { resolveDocument } from "./engine/document-engine";

export function MarginTemplate({ data, primaryColor, fontFamily, lang }: TemplateProps) {
  const doc = resolveDocument(data, { density: "normal", experienceVariant: "default", skillDisplay: "tag-rated", showTimeline: false, hobbiesDisplay: "chips" });
  const tokens = makeTokens(primaryColor, fontFamily, {}, doc.density);
  return (
    <AccentBandLayout data={data} lang={lang} tokens={tokens} config={{
      bandWidth: 14, bandColor: "#374151", bg: "#FFFFFF",
      nameColor: "#111827",
      sectionStyle: "underline", skillDisplay: doc.skillDisplay,
      hobbiesDisplay: doc.hobbiesDisplay, experienceVariant: doc.experienceVariant,
      showTimeline: doc.showTimeline, photoSize: 80, photoRadius: 0,
      topRule: true,
    }} />
  );
}
