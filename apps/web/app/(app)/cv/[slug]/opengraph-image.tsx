import { ImageResponse } from "next/og";
import { and, eq } from "drizzle-orm";
import { db, cv } from "@/lib/db";

// Premium link-preview card for a shared CV — this is what shows in WhatsApp,
// LinkedIn, X etc. when someone pastes their CV link, so it has to look sharp.
// nodejs runtime so it can read the owner's name from the DB.
export const runtime = "nodejs";
export const alt = "CV on Sumaiya";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const ESPRESSO = "#211A15";
const CREAM = "#F7EFE3";
const GOLD = "#F2A93B";
const MUTED = "#B9A992";

const HEX = /^#[0-9A-Fa-f]{6}$/;

export default async function Image({ params }: { params: { slug: string } }) {
  let name = "CV";
  let jobTitle = "";
  let accent = "#DA4A1C";
  try {
    const [row] = await db
      .select({ data: cv.data, primaryColor: cv.primaryColor })
      .from(cv)
      .where(and(eq(cv.publicSlug, params.slug), eq(cv.isPublic, true)))
      .limit(1);
    if (row) {
      const personal = (row.data as { personal?: { fullName?: string; jobTitle?: string } })?.personal;
      name = personal?.fullName?.trim() || "CV";
      jobTitle = personal?.jobTitle?.trim() || "";
      if (HEX.test(row.primaryColor)) accent = row.primaryColor;
    }
  } catch { /* fall back to defaults */ }

  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "CV";

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", backgroundColor: ESPRESSO, padding: "72px 80px", fontFamily: "sans-serif", position: "relative", alignItems: "center" }}>
        <div style={{ position: "absolute", top: -160, right: -120, width: 520, height: 520, borderRadius: "9999px", background: accent, opacity: 0.2, display: "flex" }} />

        {/* Monogram */}
        <div style={{ width: 200, height: 200, borderRadius: "9999px", background: accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 24px 60px rgba(0,0,0,0.35)" }}>
          <div style={{ color: "#fff", fontSize: 84, fontWeight: 800, letterSpacing: -2 }}>{initials}</div>
        </div>

        {/* Copy */}
        <div style={{ display: "flex", flexDirection: "column", marginLeft: 56, flex: 1, zIndex: 1 }}>
          <div style={{ color: GOLD, fontSize: 26, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", display: "flex" }}>
            Curriculum Vitae
          </div>
          <div style={{ color: CREAM, fontSize: 76, fontWeight: 800, letterSpacing: -2, marginTop: 10, lineHeight: 1.03 }}>
            {name}
          </div>
          {jobTitle ? (
            <div style={{ color: MUTED, fontSize: 34, marginTop: 16, display: "flex" }}>{jobTitle}</div>
          ) : null}
          <div style={{ display: "flex", alignItems: "center", marginTop: 40 }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, backgroundColor: accent, display: "flex" }} />
            <div style={{ marginLeft: 12, color: CREAM, fontSize: 26, fontWeight: 700, letterSpacing: -0.5, display: "flex" }}>Sumaiya</div>
            <div style={{ marginLeft: 16, color: MUTED, fontSize: 24, display: "flex" }}>· templatehub.pro</div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
