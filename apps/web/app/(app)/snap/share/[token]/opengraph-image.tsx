import { ImageResponse } from "next/og";
import { parseSnapShareToken } from "@/lib/api/snap-share";

// D4 — premium link-preview card for a shared snap result. This is what shows
// in WhatsApp, LinkedIn, X etc. when someone pastes their /snap/share/<token>
// link, so it has to look sharp. Renders ONLY what the PII-free token carries:
// the ATS score + sanitized job title. nodejs runtime for node:crypto.
export const runtime = "nodejs";
export const alt = "Tailored CV on Sumaiya";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const ESPRESSO = "#211A15";
const CREAM = "#F7EFE3";
const GOLD = "#F2A93B";
const MUTED = "#B9A992";
const EMBER = "#DA4A1C";

export default async function Image({ params }: { params: { token: string } }) {
  const payload = parseSnapShareToken(params.token);
  const score = payload ? payload.s : null;
  const title = payload?.j ?? "";

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
          alignItems: "center",
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
            background: EMBER,
            opacity: 0.22,
            display: "flex",
          }}
        />

        {/* Score block */}
        <div style={{ display: "flex", flexDirection: "column", zIndex: 1, maxWidth: 760 }}>
          <div style={{ color: GOLD, fontSize: 26, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", display: "flex" }}>
            ATS Match
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", marginTop: 12 }}>
            <div style={{ color: CREAM, fontSize: 168, fontWeight: 800, letterSpacing: -4, lineHeight: 0.95, display: "flex" }}>
              {score != null ? score : "—"}
            </div>
            <div style={{ color: CREAM, fontSize: 64, fontWeight: 800, marginLeft: 8, display: "flex" }}>%</div>
          </div>
          <div style={{ color: MUTED, fontSize: 40, marginTop: 28, lineHeight: 1.15, display: "flex" }}>
            {title || "My tailored CV"}
          </div>
          <div style={{ display: "flex", alignItems: "center", marginTop: 48 }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, backgroundColor: EMBER, display: "flex" }} />
            <div style={{ marginLeft: 12, color: CREAM, fontSize: 26, fontWeight: 700, letterSpacing: -0.5, display: "flex" }}>
              Made with Sumaiya
            </div>
            <div style={{ marginLeft: 16, color: MUTED, fontSize: 24, display: "flex" }}>· templatehub.pro</div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
