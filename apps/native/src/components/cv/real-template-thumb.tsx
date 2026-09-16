import React, { useMemo, useState } from "react";
import { View } from "react-native";
import { WebView } from "react-native-webview";
import { cvToHtml, type CvTemplateId } from "../../lib/cv-html";
import { SAMPLE_CV } from "../../lib/sample-cv";
import { TemplateThumb } from "./template-thumb";

/**
 * A real template preview — the actual rendered design (via the same WebView
 * HTML path the editor preview uses), filled with a sample persona.
 *
 * The schematic TemplateThumb sits underneath as the instant placeholder while
 * the WebView loads, so a grid of these never flashes empty.
 */
export function RealTemplateThumb({
  id,
  accent,
  width = 46,
}: {
  id: CvTemplateId;
  accent: string;
  width?: number;
}) {
  const [ready, setReady] = useState(false);
  // Match the editor's live-preview page ratio (A4 794×1123) so the page fits
  // the frame exactly — a mismatched ratio leaves the page taller than the
  // thumbnail and the WebView shows a scroll gutter.
  const h = Math.round(width * (1123 / 794));
  const html = useMemo(() => {
    const base = cvToHtml({ ...SAMPLE_CV, templateId: id }, { template: id, accent, lang: "en" });
    // Clip any overflow and hide the WebView's scrollbar entirely, so the
    // preview frame never shows a scroll indicator.
    const style = `<style>html,body{margin:0;padding:0;overflow:hidden!important}::-webkit-scrollbar{width:0;height:0;display:none}</style>`;
    return base.includes("</head>") ? base.replace("</head>", `${style}</head>`) : style + base;
  }, [id, accent]);

  return (
    <View style={{ width, height: h, borderRadius: 4, overflow: "hidden", backgroundColor: "#fff" }}>
      {!ready ? (
        <View style={{ position: "absolute", inset: 0 }}>
          <TemplateThumb id={id} accent={accent} width={width} />
        </View>
      ) : null}
      <WebView
        originWhitelist={["*"]}
        source={{ html }}
        scrollEnabled={false}
        pointerEvents="none"
        onLoadEnd={() => setReady(true)}
        style={{ width, height: h, backgroundColor: "#fff", opacity: ready ? 1 : 0 }}
        androidLayerType="software"
      />
    </View>
  );
}
