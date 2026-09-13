import { ImageResponse } from "next/og";
import { PDF_TOOLS } from "@/lib/pdf-tools";

// Per-tool social-share card, matching the template OG cards. Generated on
// demand and edge-cached.
export const runtime = "edge";
export const alt = "Free online PDF tool on Sumaiya";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const ESPRESSO = "#211A15";
const CREAM = "#F7EFE3";
const GOLD = "#F2A93B";
const MUTED = "#B9A992";
const EMBER = "#C8451D";

export default function Image({ params }: { params: { slug: string } }) {
  const t = PDF_TOOLS.find((x) => x.slug === params.slug);
  // Static edge-cached card with no request language available — use the English
  // name, matching the English social-share copy below.
  const name = t?.name.en ?? "PDF Tool";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: ESPRESSO,
          padding: "72px 80px",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -160,
            right: -120,
            width: 520,
            height: 520,
            borderRadius: "9999px",
            background: GOLD,
            opacity: 0.14,
            display: "flex",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", zIndex: 1 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: EMBER, display: "flex" }} />
          <div style={{ marginLeft: 14, color: CREAM, fontSize: 26, fontWeight: 700, letterSpacing: -0.5 }}>
            Sumaiya
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", zIndex: 1 }}>
          <div style={{ color: GOLD, fontSize: 24, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase" }}>
            Free PDF Tool
          </div>
          <div style={{ color: CREAM, fontSize: 92, fontWeight: 800, letterSpacing: -2, marginTop: 10, lineHeight: 1.02 }}>
            {name}
          </div>
          <div style={{ color: MUTED, fontSize: 30, marginTop: 20, display: "flex" }}>
            No sign-up · No watermark · Files never stored
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", zIndex: 1 }}>
          <div style={{ backgroundColor: EMBER, color: "#fff", fontSize: 24, fontWeight: 700, padding: "12px 26px", borderRadius: 10, display: "flex" }}>
            Try it free →
          </div>
          <div style={{ color: MUTED, fontSize: 22, marginLeft: 22, display: "flex" }}>
            templatehub.pro/tools
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
