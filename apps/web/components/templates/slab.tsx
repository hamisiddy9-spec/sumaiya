import React from "react";
import type { TemplateProps } from "./registry";
import { makeTokens } from "./engine/tokens";
import { MinimalLayout } from "./engine/layouts";
import { resolveDocument } from "./engine/document-engine";

export function SlabTemplate({ data, primaryColor, fontFamily, lang }: TemplateProps) {
  const doc = resolveDocument(data, { density: "compact", experienceVariant: "table", skillDisplay: "tag-rated", showTimeline: false, hobbiesDisplay: "chips" });
  const tokens = makeTokens(primaryColor, fontFamily, {}, doc.density);
  return (
    <MinimalLayout data={data} lang={lang} tokens={tokens} config={{
      bg: "#FFFFFF", nameAlign: "left", dividerStyle: "solid", sectionStyle: "numbered",
      skillDisplay: doc.skillDisplay, hobbiesDisplay: doc.hobbiesDisplay, accentOnName: false, experienceVariant: doc.experienceVariant,
    }} />
  );
}
