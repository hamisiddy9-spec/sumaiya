import React from "react";
import type { TemplateProps } from "./registry";
import { makeTokens } from "./engine/tokens";
import { AccentBandLayout } from "./engine/layouts";
import { resolveDocument } from "./engine/document-engine";

export function HeraldTemplate({ data, primaryColor, fontFamily, lang }: TemplateProps) {
  const doc = resolveDocument(data, { density: "normal", experienceVariant: "table", skillDisplay: "bar", showTimeline: false, hobbiesDisplay: "chips" });
  const tokens = makeTokens(primaryColor, fontFamily, {}, doc.density);
  return (
    <AccentBandLayout data={data} lang={lang} tokens={tokens} config={{
      bandWidth: 12, bandColor: "#0F172A", bg: "#FAFAFA",
      nameColor: "#0F172A",
      sectionStyle: "ruled", skillDisplay: doc.skillDisplay,
      hobbiesDisplay: doc.hobbiesDisplay, experienceVariant: doc.experienceVariant,
      showTimeline: doc.showTimeline, photoSize: 78, photoRadius: 8,
      topRule: true,
    }} />
  );
}
