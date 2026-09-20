import React, { useMemo, useState } from "react";
import { View } from "react-native";
import { WebView } from "react-native-webview";
import { cvToHtml, type CvTemplateId } from "../../lib/cv-html";
import { sampleCv } from "../../lib/sample-cv";
import { TemplateThumb } from "./template-thumb";

/**
 * A real template preview — the actual rendered design (via the same WebView
 * HTML path the editor preview uses), filled with a sample persona.
 *
 * The schematic TemplateThumb sits underneath as the instant placeholder while
 * the WebView loads, so a grid of these never flashes empty.
 *
 * The sample follows the reader's language, because the thumbnail is a
 * promise about what THEIR CV will look like.
 */
export function RealTemplateThumb({
  id,
  accent,
  lang,
  width = 46,
}: {
  id: CvTemplateId;
  accent: string;
  lang: "en" | "sw";
  width?: number;
}) {
  const [ready, setReady] = useState(false);
  // Ceil (never round down) + a 2px buffer so the 794px page scaled to a tiny
  // thumbnail never overflows the frame by a sub-pixel — that overflow is what
  // draws the thin WebView scroll gutter. The container clips the buffer.
  const h = Math.ceil(width * (1123 / 794)) + 2;
  const html = useMemo(() => {
    // fitWidth is the frame width: cvToHtml wraps the page so it is SCALED to
    // fill exactly this frame. Without it the sheet's fit was whatever the
    // Android WebView decided to do with the viewport meta, and a thumbnail was
    // a left-hand slice of an unscaled A4 page.
    const base = cvToHtml(
      { ...sampleCv(lang), templateId: id },
      { template: id, accent, lang, fitWidth: width },
    );
    const style = `<style>html,body{margin:0;padding:0;overflow:hidden!important}*::-webkit-scrollbar{display:none!important;width:0!important;height:0!important}</style>`;
    return base.includes("</head>") ? base.replace("</head>", `${style}</head>`) : style + base;
  }, [id, accent, lang, width]);

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
        nestedScrollEnabled={false}
        setBuiltInZoomControls={false}
        pointerEvents="none"
        onLoadEnd={() => setReady(true)}
        style={{ width, height: h, backgroundColor: "#fff", opacity: ready ? 1 : 0 }}
        androidLayerType="software"
      />
    </View>
  );
}
