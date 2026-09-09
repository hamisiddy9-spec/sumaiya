import React from "react";
import type { TemplateProps } from "./registry";
import { makeTokens } from "./engine/tokens";
import { MinimalLayout } from "./engine/layouts";
import { resolveDocument } from "./engine/document-engine";

export function StudioTemplate({ data, primaryColor, fontFamily, lang }: TemplateProps) {
  const doc = resolveDocument(data, {
    density: "normal",
    experienceVariant: "compact",
    skillDisplay: "chip",
    hobbiesDisplay: "chips",
  });

  const tokens = makeTokens(primaryColor, fontFamily, { font: { name: 24 } }, doc.density);

  return (
    <MinimalLayout data={data} lang={lang} tokens={tokens} config={{
      bg: "#FFFFFF",
      nameAlign: "left",
      dividerStyle: "solid",
      sectionStyle: "dots",
      skillDisplay: doc.skillDisplay,
      hobbiesDisplay: doc.hobbiesDisplay,
      accentOnName: true,
      experienceVariant: doc.experienceVariant,
    }} />
  );
}
