import React from "react";
import type { TemplateProps } from "./registry";
import { makeTokens } from "./engine/tokens";
import { HeaderLayout } from "./engine/layouts";
import { resolveDocument } from "./engine/document-engine";

export function VancouverTemplate({ data, primaryColor, fontFamily, lang }: TemplateProps) {
  const doc = resolveDocument(data, { density: "airy", experienceVariant: "default", skillDisplay: "bar", showTimeline: false, hobbiesDisplay: "chips" });
  const tokens = makeTokens(primaryColor, fontFamily, {}, doc.density);
  return (
    <HeaderLayout data={data} lang={lang} tokens={tokens} config={{
      headerBg: "#1E293B", headerTextColor: "#F8FAFC", headerSubColor: "#FDA4AF", headerContactColor: "#94A3B8",
      bodyBg: "#FFFFFF", headerPaddingV: 24, mainSectionStyle: "dots",
      photoSize: 76, photoOnLeft: false,
      skillDisplay: doc.skillDisplay, showTimeline: doc.showTimeline, hobbiesDisplay: doc.hobbiesDisplay, experienceVariant: doc.experienceVariant,
    }} />
  );
}
