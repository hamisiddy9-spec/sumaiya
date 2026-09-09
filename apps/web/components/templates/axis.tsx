import React from "react";
import type { TemplateProps } from "./registry";
import { makeTokens } from "./engine/tokens";
import { AccentBandLayout } from "./engine/layouts";
import { resolveDocument } from "./engine/document-engine";

export function AxisTemplate({ data, primaryColor, fontFamily, lang }: TemplateProps) {
  const doc = resolveDocument(data, { density: "normal", experienceVariant: "timeline-v2", skillDisplay: "bar", showTimeline: true, hobbiesDisplay: "chips" });
  const tokens = makeTokens(primaryColor, fontFamily, {}, doc.density);
  return (
    <AccentBandLayout data={data} lang={lang} tokens={tokens} config={{
      bandWidth: 8, bandColor: "#0F172A", bg: "#FFFFFF",
      nameColor: tokens.color.text,
      sectionStyle: "underline", skillDisplay: doc.skillDisplay,
      hobbiesDisplay: doc.hobbiesDisplay, experienceVariant: doc.experienceVariant,
      showTimeline: doc.showTimeline, photoSize: 78, photoRadius: 50,
      topRule: true,
    }} />
  );
}
