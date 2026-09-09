import React from "react";
import type { TemplateProps } from "./registry";
import { makeTokens } from "./engine/tokens";
import { MinimalLayout } from "./engine/layouts";
import { resolveDocument } from "./engine/document-engine";

export function GridTemplate({ data, primaryColor, fontFamily, lang }: TemplateProps) {
  const doc = resolveDocument(data, {
    density: "compact",
    experienceVariant: "default",
    skillDisplay: "chip",
    hobbiesDisplay: "text",
  });

  // ATS mode: strip photo so the layout is machine-parseable
  const safeData = { ...data, personal: { ...data.personal, photo: undefined } };

  const tokens = makeTokens(primaryColor, fontFamily, {
    color: { text: "#0F172A", sub: "#334155", muted: "#64748B" },
  }, doc.density);

  return (
    <MinimalLayout data={safeData} lang={lang} tokens={tokens} config={{
      bg: "#FFFFFF",
      nameAlign: "left",
      dividerStyle: "solid",
      sectionStyle: "underline",
      skillDisplay: doc.skillDisplay,
      hobbiesDisplay: doc.hobbiesDisplay,
      accentOnName: false,
      experienceVariant: doc.experienceVariant,
    }} />
  );
}
