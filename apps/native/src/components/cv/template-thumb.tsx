import React from "react";
import { View, type DimensionValue, type ViewStyle } from "react-native";
import type { CvTemplateId } from "../../lib/cv-html";

/**
 * A schematic thumbnail of a CV template — the *shape* of the layout, not real
 * content (like the pickers in Canva / Enhancv). Pure views, no WebView, so a
 * whole row of them is cheap.
 */
export function TemplateThumb({
  id,
  accent,
  width = 46,
}: {
  id: CvTemplateId;
  accent: string;
  width?: number;
}) {
  const h = Math.round(width * 1.33);
  const pad = Math.max(3, Math.round(width * 0.09));
  const line = (w: DimensionValue, mt = 3, col = "#c9c4bd") => (
    <View style={{ width: w, height: 2, borderRadius: 1, backgroundColor: col, marginTop: mt }} />
  );

  const paper: ViewStyle = {
    width,
    height: h,
    borderRadius: 4,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e6e1d9",
    overflow: "hidden",
  };

  if (id === "modern") {
    return (
      <View style={paper}>
        <View style={{ height: h * 0.26, backgroundColor: accent, padding: pad, justifyContent: "flex-end" }}>
          <View style={{ width: "60%", height: 3, borderRadius: 1.5, backgroundColor: "#fff" }} />
          <View style={{ width: "40%", height: 2, borderRadius: 1, backgroundColor: "#ffffffcc", marginTop: 2 }} />
        </View>
        <View style={{ padding: pad }}>
          <View style={{ width: "35%", height: 2.5, borderRadius: 1, backgroundColor: accent }} />
          {line("90%")}
          {line("80%")}
          <View style={{ width: "35%", height: 2.5, borderRadius: 1, backgroundColor: accent, marginTop: 6 }} />
          {line("85%")}
        </View>
      </View>
    );
  }

  if (id === "sidebar") {
    return (
      <View style={[paper, { flexDirection: "row" }]}>
        <View style={{ width: "36%", backgroundColor: accent + "22", padding: pad }}>
          <View style={{ width: "80%", height: 3, borderRadius: 1.5, backgroundColor: "#8f8a82" }} />
          {line("70%", 4, accent)}
          {line("60%", 2)}
          {line("60%", 2)}
        </View>
        <View style={{ flex: 1, padding: pad }}>
          <View style={{ width: "40%", height: 2.5, borderRadius: 1, backgroundColor: accent }} />
          {line("95%")}
          {line("85%")}
          {line("90%", 6)}
          {line("70%")}
        </View>
      </View>
    );
  }

  if (id === "executive") {
    return (
      <View style={[paper, { padding: pad, alignItems: "center" }]}>
        <View style={{ width: "55%", height: 3, borderRadius: 1.5, backgroundColor: "#6b665f" }} />
        <View style={{ width: "30%", height: 2, borderRadius: 1, backgroundColor: accent, marginTop: 2 }} />
        <View style={{ width: "100%", height: 1, backgroundColor: accent, marginTop: 4 }} />
        <View style={{ width: "40%", height: 2.5, borderRadius: 1, backgroundColor: accent, marginTop: 6, alignSelf: "center" }} />
        {line("90%")}
        {line("80%")}
      </View>
    );
  }

  if (id === "minimal") {
    return (
      <View style={[paper, { padding: pad }]}>
        <View style={{ width: "50%", height: 3, borderRadius: 1.5, backgroundColor: "#5a554e" }} />
        <View style={{ width: "100%", height: 1, backgroundColor: "#ddd", marginTop: 4 }} />
        {line("30%", 6, "#aaa")}
        {line("92%")}
        {line("82%")}
        {line("30%", 6, "#aaa")}
        {line("88%")}
      </View>
    );
  }

  if (id === "compact") {
    return (
      <View style={[paper, { padding: pad - 1 }]}>
        <View style={{ width: "45%", height: 2.5, borderRadius: 1, backgroundColor: "#5a554e" }} />
        <View style={{ width: "100%", height: 1.5, backgroundColor: accent, marginTop: 2 }} />
        {line("95%", 2)}
        {line("90%", 1.5)}
        {line("92%", 1.5)}
        {line("30%", 3, accent)}
        {line("95%", 1.5)}
        {line("88%", 1.5)}
      </View>
    );
  }

  // classic
  return (
    <View style={[paper, { padding: pad }]}>
      <View style={{ width: "55%", height: 3, borderRadius: 1.5, backgroundColor: "#5a554e" }} />
      <View style={{ width: "35%", height: 2, borderRadius: 1, backgroundColor: accent, marginTop: 2 }} />
      <View style={{ width: "100%", height: 2, backgroundColor: accent, marginTop: 3 }} />
      <View style={{ width: "40%", height: 2.5, borderRadius: 1, backgroundColor: accent, marginTop: 5 }} />
      {line("92%")}
      {line("84%")}
      <View style={{ width: "40%", height: 2.5, borderRadius: 1, backgroundColor: accent, marginTop: 5 }} />
      {line("88%")}
    </View>
  );
}
