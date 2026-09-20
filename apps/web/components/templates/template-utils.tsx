// Shared utilities for all CV templates.
// No external icon library — all SVGs are inline so templates are self-contained.
import type { CVData } from "@/types";
export type { CVData };

// ─── Contact SVG icons ────────────────────────────────────────────────────────

export function IcoEmail({ size = 10, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill={color} style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0 }}>
      <path d="M3 4a2 2 0 0 0-2 2v1.161l8.441 4.221a1.25 1.25 0 0 0 1.118 0L19 7.162V6a2 2 0 0 0-2-2H3z"/>
      <path d="m19 8.839-7.77 3.885a2.75 2.75 0 0 1-2.46 0L1 8.839V14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.839z"/>
    </svg>
  );
}

export function IcoPhone({ size = 10, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill={color} style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0 }}>
      <path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 0 1 3.5 2h1.148a1.5 1.5 0 0 1 1.465 1.175l.716 3.223a1.5 1.5 0 0 1-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 0 0 6.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 0 1 1.767-1.052l3.223.716A1.5 1.5 0 0 1 18 16.352V17.5a1.5 1.5 0 0 1-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 0 1 2.43 8.326 13.019 13.019 0 0 1 2 5V3.5z" clipRule="evenodd"/>
    </svg>
  );
}

export function IcoPin({ size = 10, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill={color} style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0 }}>
      <path fillRule="evenodd" d="m9.69 18.933.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 0 0 .281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 1 0 3 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 0 0 2.273 1.765 11.842 11.842 0 0 0 .976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5z" clipRule="evenodd"/>
    </svg>
  );
}

export function IcoLinkedIn({ size = 10, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0 }}>
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
    </svg>
  );
}

export function IcoGlobe({ size = 10, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0 }}>
      <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-2.29-2.333A17.9 17.9 0 0 1 8.027 13H4.062a8.008 8.008 0 0 0 5.648 6.667zM10.03 13c.151 2.439.848 4.73 1.97 6.752A15.905 15.905 0 0 0 13.97 13h-3.94zm9.908 0h-3.965a17.9 17.9 0 0 1-1.683 6.667A8.008 8.008 0 0 0 19.938 13zM4.062 11h3.965A17.9 17.9 0 0 1 9.71 4.333 8.008 8.008 0 0 0 4.062 11zm5.969 0h3.938A15.905 15.905 0 0 0 12 4.248 15.905 15.905 0 0 0 10.03 11zm4.259-6.667A17.9 17.9 0 0 1 15.973 11h3.965a8.008 8.008 0 0 0-5.648-6.667z"/>
    </svg>
  );
}

export function IcoCalendar({ size = 9, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill={color} style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0 }}>
      <path fillRule="evenodd" d="M5.75 2a.75.75 0 0 1 .75.75V4h7V2.75a.75.75 0 0 1 1.5 0V4h.25A2.75 2.75 0 0 1 18 6.75v8.5A2.75 2.75 0 0 1 15.25 18H4.75A2.75 2.75 0 0 1 2 15.25v-8.5A2.75 2.75 0 0 1 4.75 4H5V2.75A.75.75 0 0 1 5.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z" clipRule="evenodd"/>
    </svg>
  );
}

// ─── Photo component ──────────────────────────────────────────────────────────

export function PhotoCircle({
  url, name, size = 80, bgColor = "#2563EB", borderColor = "#fff", borderWidth = 3,
}: {
  url?: string; name: string; size?: number;
  bgColor?: string; borderColor?: string; borderWidth?: number;
}) {
  const initials = name.trim().split(/\s+/).map((n) => n[0] ?? "").join("").slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", overflow: "hidden",
      border: `${borderWidth}px solid ${borderColor}`, flexShrink: 0,
      boxSizing: "border-box",
    }}>
      {url ? (
        <img src={url} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      ) : (
        <div style={{ width: "100%", height: "100%", backgroundColor: bgColor, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: "#fff", fontSize: size * 0.32, fontWeight: 700, letterSpacing: "0.02em" }}>{initials}</span>
        </div>
      )}
    </div>
  );
}

export function PhotoSquare({
  url, name, size = 80, radius = 8, bgColor = "#2563EB", borderColor = "rgba(255,255,255,0.4)", borderWidth = 2,
}: {
  url?: string; name: string; size?: number; radius?: number;
  bgColor?: string; borderColor?: string; borderWidth?: number;
}) {
  const initials = name.trim().split(/\s+/).map((n) => n[0] ?? "").join("").slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: radius, overflow: "hidden",
      border: `${borderWidth}px solid ${borderColor}`, flexShrink: 0,
      boxSizing: "border-box",
    }}>
      {url ? (
        <img src={url} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      ) : (
        <div style={{ width: "100%", height: "100%", backgroundColor: bgColor, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: "#fff", fontSize: size * 0.32, fontWeight: 700 }}>{initials}</span>
        </div>
      )}
    </div>
  );
}

// ─── CvPhoto — the opt-in header photo ───────────────────────────────────────
//
// PhotoCircle/PhotoSquare above always draw SOMETHING: with no photo they fall
// back to initials on a coloured disc. That is right for a template that has
// decided it wants a portrait slot, and wrong for the templates that reserve no
// space at all — a tinted initials disc appearing unbidden in a minimalist
// header is a visual lie about what the candidate supplied.
//
// CvPhoto is the opt-in variant: it renders the photo when there is one and
// NOTHING when there is not, so a template can offer a photo without leaving a
// hole or an invented placeholder when the user skips it.
//
// The frame is a fixed square and the image is objectFit:"cover", so the aspect
// ratio is preserved and the square is what gets cropped, never the face
// stretched. `radius: 50` gives a circle, `0` a square, anything else a px radius.
export function CvPhoto({
  url, name, size = 84, radius = 50, borderColor, borderWidth = 0, style,
}: {
  url?: string; name: string; size?: number; radius?: number;
  borderColor?: string; borderWidth?: number; style?: React.CSSProperties;
}): React.ReactElement | null {
  if (!url) return null;
  return (
    <div style={{
      width: size, height: size, flexShrink: 0, boxSizing: "border-box",
      borderRadius: radius === 50 ? "50%" : radius, overflow: "hidden",
      border: borderWidth > 0 ? `${borderWidth}px solid ${borderColor ?? "#fff"}` : undefined,
      ...style,
    }}>
      <img
        src={url}
        alt={name}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
    </div>
  );
}


export function SkillDots({
  level, color = "#2563EB", emptyColor = "rgba(255,255,255,0.25)", size = 7,
}: {
  level: number; color?: string; emptyColor?: string; size?: number;
}) {
  return (
    <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} style={{ width: size, height: size, borderRadius: "50%", backgroundColor: i <= level ? color : emptyColor, flexShrink: 0 }} />
      ))}
    </div>
  );
}

export function SkillBar({
  level, color = "#2563EB", bgColor = "#e5e7eb", width = 100, height = 4,
}: {
  level: number; color?: string; bgColor?: string; width?: number; height?: number;
}) {
  return (
    <div style={{ width, height, backgroundColor: bgColor, borderRadius: height / 2, overflow: "hidden" }}>
      <div style={{ width: `${(level / 5) * 100}%`, height: "100%", backgroundColor: color, borderRadius: height / 2 }} />
    </div>
  );
}

// ─── Contact row helper ────────────────────────────────────────────────────────

export function ContactItem({
  icon, text, color = "#6b7280", fontSize = 10,
}: {
  icon: React.ReactNode; text: string; color?: string; fontSize?: number;
}) {
  if (!text) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <span style={{ color, flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize, color, lineHeight: 1.3, wordBreak: "break-all" }}>{text}</span>
    </div>
  );
}

// ─── Date formatter (pure helpers live in format.ts so vitest can import them) ─

export { fmtDate, dateRange, visibleSkills } from "./format";
