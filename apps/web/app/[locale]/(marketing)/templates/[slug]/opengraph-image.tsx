import { ImageResponse } from "next/og";
import { TEMPLATES } from "@/types";

// A live, per-template social-share card (WhatsApp, X, LinkedIn — the channels
// East African job seekers actually share on). Generated on demand and cached
// at the edge, so it never bloats the build the way 260+ static PNGs would.
export const runtime = "edge";
export const alt = "Free ATS-friendly CV template on Sumaiya";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Brand palette (Warm Confidence).
const ESPRESSO = "#211A15";
const CREAM = "#F7EFE3";
const GOLD = "#F2A93B";
const MUTED = "#B9A992";

export default function Image({ params }: { params: { slug: string } }) {
  const t = TEMPLATES.find((x) => x.id === params.slug);
  const name = t?.name ?? "CV";
  const accent = t?.previewColor ?? "#C8451D";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundColor: ESPRESSO,
          padding: "72px 80px",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Accent glow */}
        <div
          style={{
            position: "absolute",
            top: -160,
            right: -120,
            width: 520,
            height: 520,
            borderRadius: "9999px",
            background: accent,
            opacity: 0.18,
            display: "flex",
          }}
        />

        {/* Left: copy */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: accent, display: "flex" }} />
            <div style={{ marginLeft: 14, color: CREAM, fontSize: 26, fontWeight: 700, letterSpacing: -0.5 }}>
              Sumaiya
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ color: GOLD, fontSize: 24, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase" }}>
              CV Template
            </div>
            <div style={{ color: CREAM, fontSize: 88, fontWeight: 800, letterSpacing: -2, marginTop: 8, lineHeight: 1.02 }}>
              {name}
            </div>
            <div style={{ color: MUTED, fontSize: 30, marginTop: 20, display: "flex" }}>
              Free · ATS-friendly · AI assistant
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ backgroundColor: accent, color: "#fff", fontSize: 24, fontWeight: 700, padding: "12px 26px", borderRadius: 10, display: "flex" }}>
              Build yours free →
            </div>
            <div style={{ color: MUTED, fontSize: 22, marginLeft: 22, display: "flex" }}>
              sumaiya.app
            </div>
          </div>
        </div>

        {/* Right: a hint of a CV document in the template's accent */}
        <div style={{ display: "flex", alignItems: "center", marginLeft: 48, zIndex: 1 }}>
          <div
            style={{
              width: 300,
              height: 400,
              backgroundColor: "#fff",
              borderRadius: 14,
              display: "flex",
              flexDirection: "column",
              padding: 26,
              boxShadow: "0 30px 60px rgba(0,0,0,0.35)",
            }}
          >
            <div style={{ width: "100%", height: 66, backgroundColor: accent, borderRadius: 8, display: "flex" }} />
            <div style={{ display: "flex", flexDirection: "column", marginTop: 20 }}>
              {[92, 78, 85, 60].map((w, i) => (
                <div key={i} style={{ width: `${w}%`, height: 12, backgroundColor: "#E7DED2", borderRadius: 6, marginBottom: 12, display: "flex" }} />
              ))}
            </div>
            <div style={{ width: 120, height: 14, backgroundColor: accent, opacity: 0.85, borderRadius: 6, marginTop: 14, display: "flex" }} />
            <div style={{ display: "flex", flexDirection: "column", marginTop: 16 }}>
              {[88, 70, 80].map((w, i) => (
                <div key={i} style={{ width: `${w}%`, height: 11, backgroundColor: "#EDE6DB", borderRadius: 6, marginBottom: 11, display: "flex" }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
