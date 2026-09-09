import React from "react";
import type { TemplateProps } from "./registry";
import { makeTokens } from "./engine/tokens";
import { MinimalLayout } from "./engine/layouts";
import { resolveDocument } from "./engine/document-engine";

export function PhotonTemplate({ data, primaryColor, fontFamily, lang }: TemplateProps) {
  const doc = resolveDocument(data, { density: "airy", experienceVariant: "default", skillDisplay: "chip", showTimeline: false, hobbiesDisplay: "chips" });
  const tokens = makeTokens(primaryColor, fontFamily, {}, doc.density);
  return (
    <MinimalLayout data={data} lang={lang} tokens={tokens} config={{
      bg: "#FFFFFF", nameAlign: "center", dividerStyle: "none", sectionStyle: "underline",
      skillDisplay: doc.skillDisplay, hobbiesDisplay: doc.hobbiesDisplay, accentOnName: true, experienceVariant: doc.experienceVariant,
    }} />
  );
}
