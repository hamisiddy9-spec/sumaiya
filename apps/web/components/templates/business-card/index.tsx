import React from "react";
import type { BusinessCardData, BusinessCardTemplateId } from "@/types";
import { IcoEmail, IcoPhone, IcoGlobe, IcoPin } from "@/components/templates/template-utils";

export interface BusinessCardProps {
  data: BusinessCardData;
  primaryColor: string;
}

const BASE: React.CSSProperties = {
  width: 350,
  height: 200,
  fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
  position: "relative",
  overflow: "hidden",
  boxSizing: "border-box",
};

const CARD_MONO = "ui-monospace, 'SF Mono', Menlo, Consolas, monospace";

function cardLighten(hex: string, amt: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const h = m[1];
  const up = (c: number) => Math.round(c + (255 - c) * amt);
  return `rgb(${up(parseInt(h.slice(0, 2), 16))}, ${up(parseInt(h.slice(2, 4), 16))}, ${up(parseInt(h.slice(4, 6), 16))})`;
}

/** Icon contact rows for the new (no-emoji) cards. */
function CardContact({ data, iconColor, textColor }: { data: BusinessCardData; iconColor: string; textColor: string }) {
  const rows = [
    data.email && { icon: <IcoEmail size={9} color={iconColor} />, value: data.email },
    data.phone && { icon: <IcoPhone size={9} color={iconColor} />, value: data.phone },
    data.website && { icon: <IcoGlobe size={9} color={iconColor} />, value: data.website },
    data.address && { icon: <IcoPin size={9} color={iconColor} />, value: data.address },
  ].filter(Boolean) as { icon: React.ReactNode; value: string }[];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {rows.map((r, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ flexShrink: 0, display: "flex" }}>{r.icon}</span>
          <span style={{ fontSize: 8.5, color: textColor, lineHeight: 1.3, wordBreak: "break-all" }}>{r.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── ClassicCard ──────────────────────────────────────────────────────────────

export function ClassicCard({ data, primaryColor }: BusinessCardProps) {
  return (
    <div
      style={{
        ...BASE,
        backgroundColor: "#ffffff",
        display: "flex",
        borderLeft: `4px solid ${primaryColor}`,
      }}
    >
      {/* Left: name + title + company */}
      <div
        style={{
          flex: "0 0 190px",
          padding: "24px 16px 24px 20px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 15,
            fontWeight: 700,
            color: "#111827",
            lineHeight: 1.2,
            letterSpacing: "-0.01em",
          }}
        >
          {data.name}
        </p>
        <p
          style={{
            margin: "4px 0 0",
            fontSize: 10,
            fontWeight: 500,
            color: primaryColor,
            letterSpacing: "0.03em",
            textTransform: "uppercase",
          }}
        >
          {data.title}
        </p>
        {data.company && (
          <p
            style={{
              margin: "10px 0 0",
              fontSize: 10,
              fontWeight: 600,
              color: "#374151",
              letterSpacing: "0.01em",
            }}
          >
            {data.company}
          </p>
        )}
        {data.tagline && (
          <p
            style={{
              margin: "6px 0 0",
              fontSize: 8.5,
              color: "#9CA3AF",
              fontStyle: "italic",
              lineHeight: 1.3,
            }}
          >
            {data.tagline}
          </p>
        )}
      </div>

      {/* Divider */}
      <div
        style={{
          width: 1,
          backgroundColor: "#E5E7EB",
          margin: "20px 0",
          flexShrink: 0,
        }}
      />

      {/* Right: contact details */}
      <div
        style={{
          flex: 1,
          padding: "24px 18px 24px 16px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 0,
        }}
      >
        {[
          { label: "✉", value: data.email },
          { label: "📞", value: data.phone },
          { label: "🌐", value: data.website },
          { label: "📍", value: data.address },
        ]
          .filter((r) => r.value)
          .map((row) => (
            <div
              key={row.label}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 5,
                marginBottom: 6,
              }}
            >
              <span style={{ fontSize: 8, marginTop: 1, flexShrink: 0 }}>{row.label}</span>
              <span
                style={{
                  fontSize: 9,
                  color: "#374151",
                  lineHeight: 1.4,
                  wordBreak: "break-all",
                }}
              >
                {row.value}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}

// ─── ModernCard ───────────────────────────────────────────────────────────────

export function ModernCard({ data, primaryColor }: BusinessCardProps) {
  return (
    <div
      style={{
        ...BASE,
        backgroundColor: "#ffffff",
        display: "flex",
      }}
    >
      {/* Left color stripe — 40% */}
      <div
        style={{
          width: 140,
          backgroundColor: primaryColor,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "20px 16px",
          flexShrink: 0,
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 700,
            color: "#ffffff",
            lineHeight: 1.2,
            letterSpacing: "-0.01em",
          }}
        >
          {data.name}
        </p>
        <p
          style={{
            margin: "6px 0 0",
            fontSize: 9,
            fontWeight: 500,
            color: "rgba(255,255,255,0.8)",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            lineHeight: 1.3,
          }}
        >
          {data.title}
        </p>
        {data.tagline && (
          <p
            style={{
              margin: "10px 0 0",
              fontSize: 8,
              color: "rgba(255,255,255,0.65)",
              fontStyle: "italic",
              lineHeight: 1.3,
            }}
          >
            {data.tagline}
          </p>
        )}
      </div>

      {/* Right white section — 60% */}
      <div
        style={{
          flex: 1,
          padding: "20px 18px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        {/* Company top */}
        <p
          style={{
            margin: 0,
            fontSize: 11,
            fontWeight: 700,
            color: "#111827",
            letterSpacing: "0.01em",
          }}
        >
          {data.company}
        </p>

        {/* Contact details */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {[
            { value: data.email, prefix: "✉ " },
            { value: data.phone, prefix: "📞 " },
            { value: data.website, prefix: "🌐 " },
            { value: data.address, prefix: "📍 " },
          ]
            .filter((r) => r.value)
            .map((row) => (
              <p
                key={row.prefix}
                style={{
                  margin: 0,
                  fontSize: 9,
                  color: "#4B5563",
                  lineHeight: 1.3,
                  wordBreak: "break-all",
                }}
              >
                {row.prefix}
                {row.value}
              </p>
            ))}
        </div>
      </div>
    </div>
  );
}

// ─── BoldCard ─────────────────────────────────────────────────────────────────

export function BoldCard({ data, primaryColor }: BusinessCardProps) {
  return (
    <div
      style={{
        ...BASE,
        backgroundColor: "#0F172A",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "22px 24px 18px",
      }}
    >
      {/* Top: name + accent underline + title */}
      <div>
        <p
          style={{
            margin: 0,
            fontSize: 20,
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
          }}
        >
          {data.name}
        </p>
        {/* Accent underline */}
        <div
          style={{
            width: 40,
            height: 3,
            backgroundColor: primaryColor,
            borderRadius: 2,
            margin: "8px 0 8px",
          }}
        />
        <p
          style={{
            margin: 0,
            fontSize: 10,
            fontWeight: 500,
            color: "#D1D5DB",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          {data.title}
        </p>
        {data.company && (
          <p
            style={{
              margin: "4px 0 0",
              fontSize: 9.5,
              color: "#9CA3AF",
              fontWeight: 400,
            }}
          >
            {data.company}
          </p>
        )}
      </div>

      {/* Bottom contact grid */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "6px 20px",
        }}
      >
        {[data.email, data.phone, data.website, data.address]
          .filter(Boolean)
          .map((val) => (
            <span
              key={val}
              style={{
                fontSize: 8.5,
                color: "#9CA3AF",
                lineHeight: 1.3,
              }}
            >
              {val}
            </span>
          ))}
      </div>
    </div>
  );
}

// ─── MinimalCard ──────────────────────────────────────────────────────────────

export function MinimalCard({ data, primaryColor: _primaryColor }: BusinessCardProps) {
  return (
    <div
      style={{
        ...BASE,
        backgroundColor: "#ffffff",
        border: "1px solid #E5E7EB",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "28px 28px 22px",
      }}
    >
      {/* Top: name + title */}
      <div>
        <p
          style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 300,
            color: "#111827",
            letterSpacing: "-0.01em",
            lineHeight: 1.2,
          }}
        >
          {data.name}
        </p>
        <p
          style={{
            margin: "6px 0 0",
            fontSize: 7.5,
            fontWeight: 400,
            color: "#6B7280",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          {data.title}
        </p>
        {data.company && (
          <p
            style={{
              margin: "4px 0 0",
              fontSize: 9,
              color: "#374151",
              fontWeight: 400,
            }}
          >
            {data.company}
          </p>
        )}
      </div>

      {/* Bottom: contact in tiny gray */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 3,
        }}
      >
        {[data.email, data.phone, data.website, data.address]
          .filter(Boolean)
          .map((val) => (
            <p
              key={val}
              style={{
                margin: 0,
                fontSize: 8,
                color: "#9CA3AF",
                lineHeight: 1.4,
              }}
            >
              {val}
            </p>
          ))}
      </div>
    </div>
  );
}

// ─── CorporateCard ────────────────────────────────────────────────────────────

export function CorporateCard({ data, primaryColor }: BusinessCardProps) {
  const headerHeight = 70; // 35% of 200

  return (
    <div
      style={{
        ...BASE,
        backgroundColor: "#ffffff",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header strip */}
      <div
        style={{
          height: headerHeight,
          backgroundColor: primaryColor,
          padding: "12px 20px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 700,
            color: "#ffffff",
            letterSpacing: "-0.01em",
            lineHeight: 1.2,
          }}
        >
          {data.name}
        </p>
        {data.company && (
          <p
            style={{
              margin: "3px 0 0",
              fontSize: 9,
              fontWeight: 500,
              color: "rgba(255,255,255,0.8)",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            {data.company}
          </p>
        )}
      </div>

      {/* Body */}
      <div
        style={{
          flex: 1,
          padding: "14px 20px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        {/* Title */}
        <p
          style={{
            margin: 0,
            fontSize: 10,
            fontWeight: 600,
            color: "#1F2937",
            letterSpacing: "0.02em",
          }}
        >
          {data.title}
        </p>

        {/* Contact two-column grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "4px 10px",
          }}
        >
          {[
            { value: data.email, label: "Email" },
            { value: data.phone, label: "Phone" },
            { value: data.website, label: "Web" },
            { value: data.address, label: "Address" },
          ]
            .filter((r) => r.value)
            .map((row) => (
              <div key={row.label}>
                <p
                  style={{
                    margin: 0,
                    fontSize: 7,
                    color: "#9CA3AF",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    fontWeight: 600,
                  }}
                >
                  {row.label}
                </p>
                <p
                  style={{
                    margin: "1px 0 0",
                    fontSize: 8.5,
                    color: "#374151",
                    lineHeight: 1.3,
                    wordBreak: "break-all",
                  }}
                >
                  {row.value}
                </p>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

// ─── GradientCard ─────────────────────────────────────────────────────────────

export function GradientCard({ data, primaryColor }: BusinessCardProps) {
  return (
    <div style={{ ...BASE, display: "flex" }}>
      {/* Left half — solid primaryColor */}
      <div
        style={{
          width: 175,
          backgroundColor: primaryColor,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "20px 18px",
        }}
      >
        <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>
          {data.name}
        </p>
        <p style={{ margin: "5px 0 0", fontSize: 9, color: "rgba(255,255,255,0.85)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
          {data.title}
        </p>
        {data.company && (
          <p style={{ margin: "8px 0 0", fontSize: 9, color: "rgba(255,255,255,0.7)" }}>
            {data.company}
          </p>
        )}
      </div>
      {/* Right half — white */}
      <div
        style={{
          flex: 1,
          backgroundColor: "#ffffff",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "20px 16px",
          gap: 5,
        }}
      >
        {[data.email, data.phone, data.website, data.address].filter(Boolean).map((v) => (
          <p key={v} style={{ margin: 0, fontSize: 8.5, color: "#374151", lineHeight: 1.4, wordBreak: "break-all" }}>{v}</p>
        ))}
      </div>
    </div>
  );
}

// ─── DarkProCard ──────────────────────────────────────────────────────────────

export function DarkProCard({ data, primaryColor }: BusinessCardProps) {
  return (
    <div
      style={{
        ...BASE,
        backgroundColor: "#0F172A",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "24px 28px",
        gap: 0,
      }}
    >
      <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#ffffff", lineHeight: 1.2 }}>
        {data.name}
      </p>
      <p style={{ margin: "5px 0 10px", fontSize: 9.5, fontWeight: 500, color: primaryColor, letterSpacing: "0.05em", textTransform: "uppercase" }}>
        {data.title}
      </p>
      {data.company && (
        <p style={{ margin: "0 0 10px", fontSize: 9, color: "#94A3B8" }}>{data.company}</p>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {[data.email, data.phone, data.website, data.address].filter(Boolean).map((v) => (
          <p key={v} style={{ margin: 0, fontSize: 8.5, color: "#CBD5E1", lineHeight: 1.4, wordBreak: "break-all" }}>{v}</p>
        ))}
      </div>
    </div>
  );
}

// ─── NeonCard ─────────────────────────────────────────────────────────────────

export function NeonCard({ data, primaryColor }: BusinessCardProps) {
  return (
    <div
      style={{
        ...BASE,
        backgroundColor: "#ffffff",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "24px 28px",
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 18,
          fontWeight: 700,
          color: primaryColor,
          textShadow: `0 0 8px ${primaryColor}88, 0 0 16px ${primaryColor}44`,
          lineHeight: 1.2,
        }}
      >
        {data.name}
      </p>
      <p style={{ margin: "4px 0 0", fontSize: 9, color: "#6B7280", letterSpacing: "0.05em", textTransform: "uppercase" }}>
        {data.title}
      </p>
      {data.company && (
        <p style={{ margin: "4px 0 0", fontSize: 9, color: "#374151", fontWeight: 600 }}>{data.company}</p>
      )}
      <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: "5px 14px" }}>
        {[data.email, data.phone, data.website, data.address].filter(Boolean).map((v) => (
          <span key={v} style={{ fontSize: 8.5, color: "#4B5563", lineHeight: 1.4, wordBreak: "break-all" }}>{v}</span>
        ))}
      </div>
    </div>
  );
}

// ─── EarthyCard ───────────────────────────────────────────────────────────────

export function EarthyCard({ data, primaryColor }: BusinessCardProps) {
  return (
    <div
      style={{
        ...BASE,
        backgroundColor: "#FEF3C7",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "24px 28px",
      }}
    >
      <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#78350F", lineHeight: 1.2 }}>
        {data.name}
      </p>
      <p style={{ margin: "5px 0 0", fontSize: 9.5, fontWeight: 500, color: primaryColor, letterSpacing: "0.04em", textTransform: "uppercase" }}>
        {data.title}
      </p>
      {data.company && (
        <p style={{ margin: "4px 0 0", fontSize: 9, color: "#92400E", fontWeight: 600 }}>{data.company}</p>
      )}
      {data.tagline && (
        <p style={{ margin: "6px 0 0", fontSize: 8.5, color: "#A16207", fontStyle: "italic" }}>{data.tagline}</p>
      )}
      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 4 }}>
        {[data.email, data.phone, data.website, data.address].filter(Boolean).map((v) => (
          <p key={v} style={{ margin: 0, fontSize: 8.5, color: "#78350F", lineHeight: 1.4, wordBreak: "break-all" }}>{v}</p>
        ))}
      </div>
    </div>
  );
}

// ─── LuxuryCard ───────────────────────────────────────────────────────────────

export function LuxuryCard({ data, primaryColor: _primaryColor }: BusinessCardProps) {
  return (
    <div
      style={{
        ...BASE,
        backgroundColor: "#000000",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "26px 30px",
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 16,
          fontWeight: 600,
          color: "#D97706",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          lineHeight: 1.2,
        }}
      >
        {data.name}
      </p>
      {/* Gold divider */}
      <div style={{ width: 40, height: 1, backgroundColor: "#D97706", margin: "8px 0" }} />
      <p style={{ margin: 0, fontSize: 9, fontVariant: "small-caps", color: "#ffffff", letterSpacing: "0.08em" }}>
        {data.title}
      </p>
      {data.company && (
        <p style={{ margin: "4px 0 0", fontSize: 9, color: "#9CA3AF", letterSpacing: "0.03em" }}>{data.company}</p>
      )}
      <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 4 }}>
        {[data.email, data.phone, data.website, data.address].filter(Boolean).map((v) => (
          <p key={v} style={{ margin: 0, fontSize: 8, color: "#9CA3AF", lineHeight: 1.4, wordBreak: "break-all" }}>{v}</p>
        ))}
      </div>
    </div>
  );
}

// ─── CreativeCard ─────────────────────────────────────────────────────────────

export function CreativeCard({ data, primaryColor }: BusinessCardProps) {
  return (
    <div
      style={{
        ...BASE,
        backgroundColor: "#ffffff",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "24px 28px",
      }}
    >
      {/* Diagonal accent strip */}
      <div
        style={{
          position: "absolute",
          top: -30,
          right: 30,
          width: 6,
          height: 300,
          backgroundColor: primaryColor,
          transform: "rotate(45deg)",
          opacity: 0.18,
        }}
      />
      <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#111827", lineHeight: 1.1 }}>
        {data.name}
      </p>
      <p style={{ margin: "5px 0 0", fontSize: 10, color: primaryColor, fontWeight: 600, letterSpacing: "0.03em" }}>
        {data.title}
      </p>
      {data.company && (
        <p style={{ margin: "3px 0 0", fontSize: 9, color: "#6B7280" }}>{data.company}</p>
      )}
      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 4 }}>
        {[data.email, data.phone, data.website, data.address].filter(Boolean).map((v) => (
          <p key={v} style={{ margin: 0, fontSize: 8.5, color: "#374151", lineHeight: 1.4, wordBreak: "break-all" }}>{v}</p>
        ))}
      </div>
    </div>
  );
}

// ─── TechCard ─────────────────────────────────────────────────────────────────

export function TechCard({ data, primaryColor }: BusinessCardProps) {
  return (
    <div
      style={{
        ...BASE,
        backgroundColor: "#0F172A",
        fontFamily: "'Courier New', 'Courier', monospace",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "22px 26px",
      }}
    >
      <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: primaryColor, lineHeight: 1.2 }}>
        {data.name}
      </p>
      <p style={{ margin: "4px 0 0", fontSize: 9, color: "#64748B", letterSpacing: "0.06em" }}>
        {"// "}{data.title}
      </p>
      {data.company && (
        <p style={{ margin: "3px 0 0", fontSize: 9, color: "#475569" }}>{data.company}</p>
      )}
      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 4 }}>
        {[data.email, data.phone, data.website, data.address].filter(Boolean).map((v) => (
          <p key={v} style={{ margin: 0, fontSize: 8, color: "#94A3B8", lineHeight: 1.5, wordBreak: "break-all" }}>
            {"→ "}{v}
          </p>
        ))}
      </div>
    </div>
  );
}

// ─── NatureCard ───────────────────────────────────────────────────────────────

export function NatureCard({ data, primaryColor }: BusinessCardProps) {
  return (
    <div
      style={{
        ...BASE,
        backgroundColor: "#F0FDF4",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "22px 26px 0",
      }}
    >
      <div>
        <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#166534", lineHeight: 1.2 }}>
          {data.name}
        </p>
        <p style={{ margin: "4px 0 0", fontSize: 9.5, color: primaryColor, fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>
          {data.title}
        </p>
        {data.company && (
          <p style={{ margin: "4px 0 0", fontSize: 9, color: "#15803D" }}>{data.company}</p>
        )}
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 4 }}>
          {[data.email, data.phone, data.website, data.address].filter(Boolean).map((v) => (
            <p key={v} style={{ margin: 0, fontSize: 8.5, color: "#374151", lineHeight: 1.4, wordBreak: "break-all" }}>{v}</p>
          ))}
        </div>
      </div>
      {/* Organic bottom strip */}
      <div style={{ height: 8, backgroundColor: primaryColor, width: "100%", marginTop: 14 }} />
    </div>
  );
}

// ─── ArtisticCard ─────────────────────────────────────────────────────────────

export function ArtisticCard({ data, primaryColor }: BusinessCardProps) {
  return (
    <div
      style={{
        ...BASE,
        backgroundColor: "#ffffff",
        borderLeft: `6px solid ${primaryColor}`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "22px 24px",
      }}
    >
      <p style={{ margin: 0, fontSize: 20, fontStyle: "italic", fontWeight: 400, color: "#111827", lineHeight: 1.2 }}>
        {data.name}
      </p>
      <p style={{ margin: "5px 0 0", fontSize: 9.5, color: "#9CA3AF", letterSpacing: "0.04em", textTransform: "uppercase" }}>
        {data.title}
      </p>
      {data.company && (
        <p style={{ margin: "3px 0 0", fontSize: 9, color: "#6B7280" }}>{data.company}</p>
      )}
      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 4 }}>
        {[data.email, data.phone, data.website, data.address].filter(Boolean).map((v) => (
          <p key={v} style={{ margin: 0, fontSize: 8.5, color: "#4B5563", lineHeight: 1.4, wordBreak: "break-all" }}>{v}</p>
        ))}
      </div>
    </div>
  );
}

// ─── RetroCard ────────────────────────────────────────────────────────────────

export function RetroCard({ data, primaryColor: _primaryColor }: BusinessCardProps) {
  return (
    <div
      style={{
        ...BASE,
        backgroundColor: "#FEF9C3",
        border: "2px solid #374151",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "22px 26px",
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 15,
          fontWeight: 700,
          color: "#111827",
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          lineHeight: 1.2,
        }}
      >
        {data.name}
      </p>
      <p style={{ margin: "5px 0 0", fontSize: 9, color: "#374151", letterSpacing: "0.06em", textTransform: "uppercase" }}>
        {data.title}
      </p>
      {data.company && (
        <p style={{ margin: "4px 0 0", fontSize: 9, color: "#4B5563", fontWeight: 600 }}>{data.company}</p>
      )}
      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 4 }}>
        {[data.email, data.phone, data.website, data.address].filter(Boolean).map((v) => (
          <p key={v} style={{ margin: 0, fontSize: 8.5, color: "#374151", lineHeight: 1.4, wordBreak: "break-all" }}>{v}</p>
        ))}
      </div>
    </div>
  );
}

// ─── GeometricCard ────────────────────────────────────────────────────────────

export function GeometricCard({ data, primaryColor }: BusinessCardProps) {
  return (
    <div
      style={{
        ...BASE,
        backgroundColor: "#ffffff",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "22px 26px",
      }}
    >
      {/* Corner triangle using border trick */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 0,
          height: 0,
          borderStyle: "solid",
          borderWidth: "0 60px 60px 0",
          borderColor: `transparent ${primaryColor} transparent transparent`,
        }}
      />
      <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#111827", lineHeight: 1.2 }}>
        {data.name}
      </p>
      <p style={{ margin: "5px 0 0", fontSize: 9.5, color: "#6B7280", letterSpacing: "0.04em", textTransform: "uppercase" }}>
        {data.title}
      </p>
      {data.company && (
        <p style={{ margin: "3px 0 0", fontSize: 9, color: "#374151", fontWeight: 600 }}>{data.company}</p>
      )}
      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 4 }}>
        {[data.email, data.phone, data.website, data.address].filter(Boolean).map((v) => (
          <p key={v} style={{ margin: 0, fontSize: 8.5, color: "#4B5563", lineHeight: 1.4, wordBreak: "break-all" }}>{v}</p>
        ))}
      </div>
    </div>
  );
}

// ─── OrganicCard ──────────────────────────────────────────────────────────────

export function OrganicCard({ data, primaryColor }: BusinessCardProps) {
  return (
    <div
      style={{
        ...BASE,
        backgroundColor: "#ffffff",
        borderRadius: 16,
        boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "22px 26px",
      }}
    >
      <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#111827", lineHeight: 1.2 }}>
        {data.name}
      </p>
      <p style={{ margin: "5px 0 0", fontSize: 9.5, color: primaryColor, fontWeight: 500, letterSpacing: "0.03em" }}>
        {data.title}
      </p>
      {data.company && (
        <p style={{ margin: "3px 0 0", fontSize: 9, color: "#9CA3AF" }}>{data.company}</p>
      )}
      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 5 }}>
        {[data.email, data.phone, data.website, data.address].filter(Boolean).map((v) => (
          <p key={v} style={{ margin: 0, fontSize: 8.5, color: "#6B7280", lineHeight: 1.4, wordBreak: "break-all" }}>{v}</p>
        ))}
      </div>
    </div>
  );
}

// ─── MarbleCard ───────────────────────────────────────────────────────────────

export function MarbleCard({ data, primaryColor }: BusinessCardProps) {
  return (
    <div
      style={{
        ...BASE,
        backgroundColor: "#F8FAFC",
        borderTop: `3px solid ${primaryColor}`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "22px 26px",
        textAlign: "center",
      }}
    >
      <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#1E293B", lineHeight: 1.2 }}>
        {data.name}
      </p>
      <p style={{ margin: "5px 0 0", fontSize: 9.5, color: "#64748B", letterSpacing: "0.05em", textTransform: "uppercase" }}>
        {data.title}
      </p>
      {data.company && (
        <p style={{ margin: "4px 0 0", fontSize: 9, color: "#94A3B8" }}>{data.company}</p>
      )}
      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 4, alignItems: "center" }}>
        {[data.email, data.phone, data.website, data.address].filter(Boolean).map((v) => (
          <p key={v} style={{ margin: 0, fontSize: 8.5, color: "#475569", lineHeight: 1.4, wordBreak: "break-all" }}>{v}</p>
        ))}
      </div>
    </div>
  );
}

// ─── DuoToneCard ──────────────────────────────────────────────────────────────

export function DuoToneCard({ data, primaryColor }: BusinessCardProps) {
  return (
    <div style={{ ...BASE, display: "flex" }}>
      {/* Left panel */}
      <div
        style={{
          width: 140,
          backgroundColor: primaryColor,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "18px 14px",
        }}
      >
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#ffffff", lineHeight: 1.2 }}>
          {data.name}
        </p>
        <p style={{ margin: "5px 0 0", fontSize: 8.5, color: "rgba(255,255,255,0.85)", letterSpacing: "0.04em", textTransform: "uppercase", lineHeight: 1.3 }}>
          {data.title}
        </p>
        {data.company && (
          <p style={{ margin: "6px 0 0", fontSize: 8.5, color: "rgba(255,255,255,0.7)" }}>{data.company}</p>
        )}
      </div>
      {/* Right panel */}
      <div
        style={{
          flex: 1,
          backgroundColor: "#ffffff",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "18px 16px",
          gap: 5,
        }}
      >
        {[data.email, data.phone, data.website, data.address].filter(Boolean).map((v) => (
          <p key={v} style={{ margin: 0, fontSize: 8.5, color: primaryColor, lineHeight: 1.4, wordBreak: "break-all" }}>{v}</p>
        ))}
      </div>
    </div>
  );
}

// ─── WatercolorCard ───────────────────────────────────────────────────────────

export function WatercolorCard({ data, primaryColor }: BusinessCardProps) {
  return (
    <div
      style={{
        ...BASE,
        backgroundColor: "#FAFAFA",
        borderBottom: `2px dashed ${primaryColor}`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "22px 28px",
      }}
    >
      <p style={{ margin: 0, fontSize: 18, fontWeight: 300, color: "#111827", lineHeight: 1.2 }}>
        {data.name}
      </p>
      <p style={{ margin: "5px 0 0", fontSize: 9.5, fontStyle: "italic", color: "#9CA3AF", letterSpacing: "0.03em" }}>
        {data.title}
      </p>
      {data.company && (
        <p style={{ margin: "3px 0 0", fontSize: 9, color: "#6B7280" }}>{data.company}</p>
      )}
      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 4 }}>
        {[data.email, data.phone, data.website, data.address].filter(Boolean).map((v) => (
          <p key={v} style={{ margin: 0, fontSize: 8.5, color: "#4B5563", lineHeight: 1.4, wordBreak: "break-all" }}>{v}</p>
        ))}
      </div>
    </div>
  );
}

// ─── PremiumCard ──────────────────────────────────────────────────────────────

export function PremiumCard({ data, primaryColor: _primaryColor }: BusinessCardProps) {
  return (
    <div
      style={{
        ...BASE,
        backgroundColor: "#000000",
        borderTop: "3px solid #D97706",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "22px 28px",
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 15,
          fontWeight: 600,
          color: "#ffffff",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          lineHeight: 1.2,
        }}
      >
        {data.name}
      </p>
      <p style={{ margin: "5px 0 0", fontSize: 9.5, color: "#D97706", letterSpacing: "0.05em", textTransform: "uppercase" }}>
        {data.title}
      </p>
      {data.company && (
        <p style={{ margin: "4px 0 0", fontSize: 9, color: "#9CA3AF" }}>{data.company}</p>
      )}
      <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 4 }}>
        {[data.email, data.phone, data.website, data.address].filter(Boolean).map((v) => (
          <p key={v} style={{ margin: 0, fontSize: 8.5, color: "#6B7280", lineHeight: 1.4, wordBreak: "break-all" }}>{v}</p>
        ))}
      </div>
    </div>
  );
}

// ─── GlassCard ────────────────────────────────────────────────────────────────

export function GlassCard({ data, primaryColor }: BusinessCardProps) {
  return (
    <div
      style={{
        ...BASE,
        backgroundColor: "rgba(255,255,255,0.95)",
        border: `1px solid ${primaryColor}33`,
        boxShadow: `0 8px 32px ${primaryColor}1A`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "22px 28px",
      }}
    >
      <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#1E293B", lineHeight: 1.2 }}>
        {data.name}
      </p>
      <p style={{ margin: "5px 0 0", fontSize: 9.5, color: primaryColor, fontWeight: 500, letterSpacing: "0.03em", textTransform: "uppercase" }}>
        {data.title}
      </p>
      {data.company && (
        <p style={{ margin: "3px 0 0", fontSize: 9, color: "#64748B" }}>{data.company}</p>
      )}
      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 5 }}>
        {[data.email, data.phone, data.website, data.address].filter(Boolean).map((v) => (
          <p key={v} style={{ margin: 0, fontSize: 8.5, color: "#475569", lineHeight: 1.4, wordBreak: "break-all" }}>{v}</p>
        ))}
      </div>
    </div>
  );
}

// ─── NordicCard ───────────────────────────────────────────────────────────────

export function NordicCard({ data, primaryColor }: BusinessCardProps) {
  return (
    <div style={{ ...BASE, backgroundColor: "#ffffff", display: "flex" }}>
      {/* Left section — name + title + company */}
      <div
        style={{
          flex: "0 0 190px",
          padding: "22px 16px 22px 20px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#111827", lineHeight: 1.2, letterSpacing: "-0.01em" }}>
          {data.name}
        </p>
        <p style={{ margin: "5px 0 0", fontSize: 9, color: primaryColor, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>
          {data.title}
        </p>
        {data.company && (
          <p style={{ margin: "4px 0 0", fontSize: 9, color: "#6B7280" }}>{data.company}</p>
        )}
      </div>
      {/* Hairline divider */}
      <div style={{ width: 1, backgroundColor: "#E5E7EB", margin: "18px 0", flexShrink: 0 }} />
      {/* Right section — contact */}
      <div
        style={{
          flex: 1,
          padding: "22px 18px 22px 16px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 5,
        }}
      >
        {[data.email, data.phone, data.website, data.address].filter(Boolean).map((v) => (
          <p key={v} style={{ margin: 0, fontSize: 8.5, color: "#374151", lineHeight: 1.4, wordBreak: "break-all" }}>{v}</p>
        ))}
      </div>
    </div>
  );
}

// ─── TropicalCard ─────────────────────────────────────────────────────────────

export function TropicalCard({ data, primaryColor }: BusinessCardProps) {
  return (
    <div
      style={{
        ...BASE,
        backgroundColor: primaryColor,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "22px 28px",
      }}
    >
      <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#ffffff", lineHeight: 1.2 }}>
        {data.name}
      </p>
      <p style={{ margin: "5px 0 0", fontSize: 9.5, color: "rgba(255,255,255,0.85)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
        {data.title}
      </p>
      {data.company && (
        <p style={{ margin: "3px 0 0", fontSize: 9, color: "rgba(255,255,255,0.75)" }}>{data.company}</p>
      )}
      {/* White divider */}
      <div style={{ width: "100%", height: 1, backgroundColor: "rgba(255,255,255,0.4)", margin: "10px 0" }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {[data.email, data.phone, data.website, data.address].filter(Boolean).map((v) => (
          <p key={v} style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.9)", lineHeight: 1.4, wordBreak: "break-all" }}>{v}</p>
        ))}
      </div>
    </div>
  );
}

// ─── UrbanCard ────────────────────────────────────────────────────────────────

export function UrbanCard({ data, primaryColor }: BusinessCardProps) {
  return (
    <div
      style={{
        ...BASE,
        backgroundColor: "#111827",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "0 0 20px",
      }}
    >
      {/* Top color strip */}
      <div style={{ height: 8, backgroundColor: primaryColor, width: "100%", flexShrink: 0 }} />
      <div style={{ padding: "16px 24px 0" }}>
        <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#ffffff", lineHeight: 1.2 }}>
          {data.name}
        </p>
        <p style={{ margin: "5px 0 0", fontSize: 9.5, color: primaryColor, fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>
          {data.title}
        </p>
        {data.company && (
          <p style={{ margin: "3px 0 0", fontSize: 9, color: "#6B7280" }}>{data.company}</p>
        )}
      </div>
      <div style={{ padding: "0 24px", display: "flex", flexWrap: "wrap", gap: "4px 16px" }}>
        {[data.email, data.phone, data.website, data.address].filter(Boolean).map((v) => (
          <span key={v} style={{ fontSize: 8.5, color: "#9CA3AF", lineHeight: 1.4, wordBreak: "break-all" }}>{v}</span>
        ))}
      </div>
    </div>
  );
}

// ─── Registry ─────────────────────────────────────────────────────────────────

// ─── ZegeCard (neo-brutalist) ─────────────────────────────────────────────────

export function ZegeCard({ data, primaryColor }: BusinessCardProps) {
  return (
    <div style={{ ...BASE, backgroundColor: "#FBFAF7", padding: 16, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      <div>
        <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#111", textTransform: "uppercase", letterSpacing: "-0.02em", lineHeight: 0.95 }}>{data.name}</p>
        {data.title && (
          <span style={{ display: "inline-block", marginTop: 9, background: primaryColor, color: "#fff", border: "2px solid #111", boxShadow: "3px 3px 0 #111", padding: "3px 9px", fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>{data.title}</span>
        )}
        {data.company && <p style={{ margin: "9px 0 0", fontSize: 10, fontWeight: 700, color: "#111" }}>{data.company}</p>}
      </div>
      <div style={{ fontFamily: CARD_MONO, fontSize: 8.5, color: "#111", lineHeight: 1.7, borderTop: "2px solid #111", paddingTop: 7 }}>
        {[data.email, data.phone, data.website].filter(Boolean).join("  /  ")}
      </div>
    </div>
  );
}

// ─── NeonDarkCard (dark, sleek) ───────────────────────────────────────────────

export function NeonDarkCard({ data, primaryColor }: BusinessCardProps) {
  const grad = `linear-gradient(90deg, ${primaryColor}, ${cardLighten(primaryColor, 0.4)})`;
  return (
    <div style={{ ...BASE, background: "#0B0B14", padding: 18, color: "#D7D8E0", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      <div>
        <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: "-0.01em" }}>{data.name}</p>
        {data.title && <p style={{ margin: "4px 0 0", fontSize: 9.5, color: cardLighten(primaryColor, 0.2), letterSpacing: "0.08em", textTransform: "uppercase" }}>{data.title}</p>}
        <div style={{ width: 58, height: 3, borderRadius: 2, background: grad, marginTop: 10 }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 10 }}>
        <CardContact data={data} iconColor={cardLighten(primaryColor, 0.2)} textColor="#8A8B99" />
        {data.company && <span style={{ fontSize: 9, fontWeight: 700, color: "#fff", textAlign: "right", flexShrink: 0 }}>{data.company}</span>}
      </div>
    </div>
  );
}

// ─── BentoCard (rounded, contemporary) ────────────────────────────────────────

export function BentoCard({ data, primaryColor }: BusinessCardProps) {
  const tint = `${primaryColor}12`;
  return (
    <div style={{ ...BASE, backgroundColor: "#F6F5F3", padding: 10, display: "flex", gap: 8 }}>
      <div style={{ width: 108, flexShrink: 0, borderRadius: 14, background: primaryColor, color: "#fff", padding: 14, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <p style={{ margin: 0, fontSize: 15, fontWeight: 800, lineHeight: 1.1 }}>{data.name}</p>
        {data.title && <p style={{ margin: 0, fontSize: 8.5, opacity: 0.9, letterSpacing: "0.04em", textTransform: "uppercase" }}>{data.title}</p>}
      </div>
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
        {data.company && (
          <div style={{ borderRadius: 12, background: tint, border: `1px solid ${primaryColor}2e`, padding: "8px 12px" }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#111827" }}>{data.company}</p>
            {data.tagline && <p style={{ margin: "2px 0 0", fontSize: 8.5, color: "#6b7280" }}>{data.tagline}</p>}
          </div>
        )}
        <div style={{ flex: 1, borderRadius: 12, background: "#fff", border: "1px solid #e6e4e0", padding: "10px 12px", display: "flex", alignItems: "center" }}>
          <CardContact data={data} iconColor={primaryColor} textColor="#374151" />
        </div>
      </div>
    </div>
  );
}

// ─── RisoCard (risograph poster) ──────────────────────────────────────────────

export function RisoCard({ data, primaryColor }: BusinessCardProps) {
  return (
    <div style={{ ...BASE, backgroundColor: "#FAF6EC", padding: 16, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", left: 5, top: 6, width: 150, height: 30, background: primaryColor, opacity: 0.26 }} />
        <p style={{ position: "relative", margin: 0, display: "inline-block", background: primaryColor, color: "#FAF6EC", fontSize: 19, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", padding: "4px 10px", lineHeight: 1 }}>{data.name}</p>
        {data.title && <p style={{ margin: "10px 0 0", fontFamily: CARD_MONO, fontSize: 9, color: "#1A1815", letterSpacing: "0.1em", textTransform: "uppercase" }}>{data.title}{data.company ? ` · ${data.company}` : ""}</p>}
      </div>
      <div style={{ fontFamily: CARD_MONO, fontSize: 8.5, color: "#1A1815", lineHeight: 1.7 }}>
        {[data.email, data.phone, data.website].filter(Boolean).join("  /  ")}
      </div>
    </div>
  );
}

export const BUSINESS_CARD_COMPONENTS: Record<
  BusinessCardTemplateId,
  React.ComponentType<BusinessCardProps>
> = {
  "zege-card": ZegeCard,
  "neon-card": NeonDarkCard,
  "bento-card": BentoCard,
  "riso-card": RisoCard,
  classic: ClassicCard,
  modern: ModernCard,
  bold: BoldCard,
  minimal: MinimalCard,
  corporate: CorporateCard,
  "gradient-bc": GradientCard,
  "dark-pro-bc": DarkProCard,
  "neon-bc": NeonCard,
  "earthy-bc": EarthyCard,
  "luxury-bc": LuxuryCard,
  "creative-bc": CreativeCard,
  "tech-bc": TechCard,
  "nature-bc": NatureCard,
  "artistic-bc": ArtisticCard,
  "retro-bc": RetroCard,
  "geometric-bc": GeometricCard,
  "organic-bc": OrganicCard,
  "marble-bc": MarbleCard,
  "duo-tone-bc": DuoToneCard,
  "watercolor-bc": WatercolorCard,
  "premium-bc": PremiumCard,
  "glass-bc": GlassCard,
  "nordic-bc": NordicCard,
  "tropical-bc": TropicalCard,
  "urban-bc": UrbanCard,
};
