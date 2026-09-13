import React from "react";
import { View, type DimensionValue, type ViewStyle } from "react-native";
import { templateLayout, type CvTemplateId } from "../../lib/cv-html";

/**
 * A schematic thumbnail of a CV template — the *shape* of the layout, not real
 * content (like the pickers in Canva / Enhancv). Pure views, no WebView, so a
 * whole grid of them is cheap.
 *
 * The original six ids have bespoke sketches; every mirrored template draws by
 * its engine layout family, so a picker of 200+ templates stays truthful
 * without 200 hand-drawn thumbnails.
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

  // ── Engine layouts (every mirrored template) ────────────────────────────────
  // Drawn by family, so the thumbnail tells the truth about what the renderer
  // will actually do.
  const layout = templateLayout(id);

  if (layout === "SidebarLayout") {
    return (
      <View style={[paper, { flexDirection: "row" }]}>
        <View style={{ width: "34%", backgroundColor: accent + "1f", padding: pad }}>
          <View style={{ width: "70%", height: 2.5, borderRadius: 1, backgroundColor: "#8f8a82" }} />
          <View style={{ width: "50%", height: 2, borderRadius: 1, backgroundColor: accent, marginTop: 3 }} />
          <View style={{ width: "80%", height: 1.5, borderRadius: 1, backgroundColor: "#cfcac2", marginTop: 4 }} />
          <View style={{ width: "60%", height: 1.5, borderRadius: 1, backgroundColor: "#cfcac2", marginTop: 2 }} />
          <View style={{ width: "70%", height: 1.5, borderRadius: 1, backgroundColor: "#cfcac2", marginTop: 2 }} />
        </View>
        <View style={{ flex: 1, padding: pad }}>
          <View style={{ width: "45%", height: 2.5, borderRadius: 1, backgroundColor: accent }} />
          {line("95%", 4)}
          {line("88%", 2)}
          {line("70%", 2)}
          {line("40%", 6, accent)}
          {line("90%", 3)}
          {line("82%", 2)}
        </View>
      </View>
    );
  }

  if (layout === "HeaderLayout") {
    return (
      <View style={paper}>
        <View style={{ height: h * 0.24, backgroundColor: accent, padding: pad, justifyContent: "flex-end" }}>
          <View style={{ width: "55%", height: 3, borderRadius: 1.5, backgroundColor: "#fff" }} />
          <View style={{ width: "38%", height: 2, borderRadius: 1, backgroundColor: "#ffffffcc", marginTop: 2 }} />
        </View>
        <View style={{ flexDirection: "row", flex: 1, padding: pad }}>
          <View style={{ flex: 1 }}>
            <View style={{ width: "50%", height: 2.5, borderRadius: 1, backgroundColor: accent }} />
            {line("95%", 4)}
            {line("88%", 2)}
            {line("60%", 6, accent)}
            {line("90%", 3)}
          </View>
          <View style={{ width: "30%", marginLeft: pad, backgroundColor: "#f2f0ec", borderRadius: 2, padding: 2 }}>
            {line("80%", 1, accent)}
            {line("70%", 2)}
            {line("60%", 2)}
          </View>
        </View>
      </View>
    );
  }

  if (layout === "MinimalLayout") {
    return (
      <View style={[paper, { padding: pad, alignItems: "center" }]}>
        <View style={{ width: "52%", height: 3, borderRadius: 1.5, backgroundColor: "#5a554e" }} />
        <View style={{ width: "34%", height: 2, borderRadius: 1, backgroundColor: "#a8a29a", marginTop: 2 }} />
        <View style={{ width: "100%", height: 1.5, backgroundColor: accent, marginTop: 4, opacity: 0.75 }} />
        <View style={{ width: "100%", alignItems: "flex-start", marginTop: 4 }}>
          {line("28%", 0, "#b3ada4")}
          {line("94%", 3)}
          {line("86%", 2)}
          {line("28%", 5, "#b3ada4")}
          {line("90%", 3)}
        </View>
      </View>
    );
  }

  if (layout === "TwoColumnLayout") {
    return (
      <View style={paper}>
        <View style={{ height: h * 0.2, backgroundColor: accent, padding: pad, justifyContent: "center" }}>
          <View style={{ width: "50%", height: 2.5, borderRadius: 1, backgroundColor: "#fff" }} />
        </View>
        <View style={{ flexDirection: "row", flex: 1, padding: pad }}>
          <View style={{ width: "38%", borderRightWidth: 1, borderRightColor: "#e0dcd5", paddingRight: 2 }}>
            {line("80%", 0, accent)}
            {line("70%", 2)}
            {line("60%", 2)}
            {line("75%", 2)}
          </View>
          <View style={{ flex: 1, paddingLeft: pad }}>
            {line("55%", 0, accent)}
            {line("92%", 3)}
            {line("84%", 2)}
            {line("60%", 5, accent)}
            {line("88%", 3)}
          </View>
        </View>
      </View>
    );
  }

  if (layout === "AccentBandLayout") {
    return (
      <View style={[paper, { flexDirection: "row" }]}>
        <View style={{ width: Math.max(3, Math.round(width * 0.06)), backgroundColor: accent }} />
        <View style={{ flex: 1, padding: pad }}>
          <View style={{ width: "58%", height: 3, borderRadius: 1.5, backgroundColor: "#4b463f" }} />
          <View style={{ width: "36%", height: 2, borderRadius: 1, backgroundColor: "#a8a29a", marginTop: 2 }} />
          <View style={{ width: "100%", height: 1.5, backgroundColor: accent, marginTop: 4, opacity: 0.5 }} />
          {line("45%", 5, accent)}
          {line("92%", 3)}
          {line("84%", 2)}
          {line("45%", 5, accent)}
          {line("86%", 3)}
        </View>
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
