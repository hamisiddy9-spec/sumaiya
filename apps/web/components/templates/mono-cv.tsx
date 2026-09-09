import React from "react";
import type { TemplateProps } from "./registry";
import { makeTokens } from "./engine/tokens";
import { AccentBandLayout } from "./engine/layouts";
import { resolveDocument } from "./engine/document-engine";

export function MonoCvTemplate({ data, primaryColor, fontFamily, lang }: TemplateProps) {
  const doc = resolveDocument(data, { density: "compact", experienceVariant: "compact", skillDisplay: "chip", showTimeline: false, hobbiesDisplay: "chips" });
  const tokens = makeTokens(primaryColor, fontFamily, {}, doc.density);
  return (
    <AccentBandLayout data={data} lang={lang} tokens={tokens} config={{
      bandWidth: 8, bandColor: "#111827", bg: "#F9FAFB",
      nameColor: "#111827",
      sectionStyle: "none", skillDisplay: doc.skillDisplay,
      hobbiesDisplay: doc.hobbiesDisplay, experienceVariant: doc.experienceVariant,
      showTimeline: doc.showTimeline, photoSize: 0, photoRadius: 50,
      topRule: false,
    }} />
  );
}
