import React from "react";
import type { TemplateProps } from "./registry";
import { makeTokens } from "./engine/tokens";
import { MinimalLayout } from "./engine/layouts";
import { resolveDocument } from "./engine/document-engine";

export function RockwellCvTemplate({ data, primaryColor, fontFamily, lang }: TemplateProps) {
  const doc = resolveDocument(data, { density: "compact", experienceVariant: "compact", skillDisplay: "bar", showTimeline: false, hobbiesDisplay: "chips" });
  const tokens = makeTokens(primaryColor, fontFamily, {}, doc.density);
  return (
    <MinimalLayout data={data} lang={lang} tokens={tokens} config={{
      bg: "#FFFFFF", nameAlign: "left", dividerStyle: "solid", sectionStyle: "dots",
      skillDisplay: doc.skillDisplay, hobbiesDisplay: doc.hobbiesDisplay, accentOnName: false, experienceVariant: doc.experienceVariant,
    }} />
  );
}
