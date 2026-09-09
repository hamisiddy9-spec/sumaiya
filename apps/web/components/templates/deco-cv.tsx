import React from "react";
import type { TemplateProps } from "./registry";
import { makeTokens } from "./engine/tokens";
import { MinimalLayout } from "./engine/layouts";
import { resolveDocument } from "./engine/document-engine";

export function DecoCvTemplate({ data, primaryColor, fontFamily, lang }: TemplateProps) {
  const doc = resolveDocument(data, { density: "airy", experienceVariant: "default", skillDisplay: "bar", showTimeline: false, hobbiesDisplay: "chips" });
  const tokens = makeTokens(primaryColor, fontFamily, {}, doc.density);
  return (
    <MinimalLayout data={data} lang={lang} tokens={tokens} config={{
      bg: "#FFFFFF", nameAlign: "left", dividerStyle: "none", sectionStyle: "line-accent",
      skillDisplay: doc.skillDisplay, hobbiesDisplay: doc.hobbiesDisplay, accentOnName: true, experienceVariant: doc.experienceVariant,
    }} />
  );
}
