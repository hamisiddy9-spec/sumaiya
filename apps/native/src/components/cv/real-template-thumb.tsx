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
  const h = Math.round(width * 1.33);
  const html = useMemo(
    () => cvToHtml({ ...SAMPLE_CV, templateId: id }, { template: id, accent, lang: "en" }),
    [id, accent],
  );

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
