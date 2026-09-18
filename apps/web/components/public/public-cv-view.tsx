"use client";

// Renders a shared CV on its public page. Reuses the real A4 template components
// (so a shared CV looks identical to the PDF), scaled responsively to fit any
// screen — the same fit-to-width approach the editor preview uses.

import { useEffect, useRef, useState } from "react";
import { TEMPLATE_COMPONENTS } from "@/components/templates/registry";
import { TemplateCanvas } from "@/components/templates/template-canvas";
import { resolveFontStack } from "@/lib/fonts";
import { NakuruTemplate } from "@/components/templates/nakuru";
import { isTemplateId, type CVData } from "@/types";
import type { Lang } from "@/lib/i18n/translations";

export function PublicCvView({
  data, templateId, primaryColor, fontFamily, lang,
}: {
  data: CVData;
  templateId: string;
  primaryColor: string;
  fontFamily: string;
  lang: Lang;
}) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [{ scale, height }, setDims] = useState({ scale: 1, height: 1123 });

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;
    const update = () => {
      const s = Math.min(1, outer.offsetWidth / 794);
      setDims({ scale: s, height: inner.scrollHeight * s });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(outer);
    ro.observe(inner);
    return () => ro.disconnect();
  }, []);

  const Template = TEMPLATE_COMPONENTS[isTemplateId(templateId) ? templateId : "nakuru"] ?? NakuruTemplate;

  return (
    <div ref={outerRef} className="w-full mx-auto" style={{ maxWidth: 794 }}>
      <div
        className="bg-white shadow-[0_10px_50px_rgba(0,0,0,0.14)] rounded-[3px] overflow-hidden mx-auto max-w-full"
        style={{ height, position: "relative", width: "100%" }}
      >
        <div
          ref={innerRef}
          style={{ width: 794, transform: `scale(${scale})`, transformOrigin: "top left", position: "absolute", top: 0, left: 0 }}
        >
          <TemplateCanvas>
            <Template data={data} primaryColor={primaryColor} fontFamily={resolveFontStack(fontFamily)} lang={lang} />
          </TemplateCanvas>
        </div>
      </div>
    </div>
  );
}
