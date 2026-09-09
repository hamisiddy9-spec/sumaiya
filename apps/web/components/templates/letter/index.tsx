import React from "react";
import type { LetterTemplateId, LetterData } from "@/types";

// ─── Shared types ─────────────────────────────────────────────────────────────

export interface LetterProps {
  data: LetterData;
  primaryColor: string;
  fontFamily?: string;
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function d(value: string | undefined): string {
  return value?.trim() || "—";
}

function splitBody(body: string): string[] {
  const paras = body.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  return paras.length > 0 ? paras : ["Your letter content will appear here."];
}

// ─── FormalLetter ─────────────────────────────────────────────────────────────

export function FormalLetter({ data, primaryColor }: LetterProps) {
  const paragraphs = splitBody(data.body);

  return (
    <div
      style={{
        width: 794,
        minHeight: 1123,
        padding: "60px 70px",
        backgroundColor: "#ffffff",
        fontFamily: "'Times New Roman', Georgia, serif",
        color: "#1a1a1a",
        boxSizing: "border-box",
        position: "relative",
        borderTop: `3px solid ${primaryColor}`,
      }}
    >
      {/* Top row: sender left, date right */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        {/* Sender block */}
        <div>
          <p style={{ fontSize: 15, fontWeight: 700, margin: "0 0 2px", color: "#111111" }}>
            {d(data.from.name)}
          </p>
          {data.from.title && (
            <p style={{ fontSize: 12, margin: "0 0 1px", color: "#444444" }}>{data.from.title}</p>
          )}
          {data.from.company && (
            <p style={{ fontSize: 11, margin: "0 0 1px", color: "#555555" }}>{data.from.company}</p>
          )}
          {data.from.address && (
            <p style={{ fontSize: 11, margin: "0 0 1px", color: "#555555", whiteSpace: "pre-line" }}>
              {data.from.address}
            </p>
          )}
          {data.from.email && (
            <p style={{ fontSize: 11, margin: "0 0 1px", color: "#555555" }}>{data.from.email}</p>
          )}
          {data.from.phone && (
            <p style={{ fontSize: 11, margin: 0, color: "#555555" }}>{data.from.phone}</p>
          )}
        </div>

        {/* Date */}
        <p style={{ fontSize: 12, color: "#444444", margin: 0, textAlign: "right" }}>
          {d(data.date)}
        </p>
      </div>

      {/* Recipient block */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 2px", color: "#111111" }}>
          {d(data.to.name)}
        </p>
        {data.to.title && (
          <p style={{ fontSize: 12, margin: "0 0 1px", color: "#444444" }}>{data.to.title}</p>
        )}
        {data.to.company && (
          <p style={{ fontSize: 11, margin: "0 0 1px", color: "#555555" }}>{data.to.company}</p>
        )}
        {data.to.address && (
          <p style={{ fontSize: 11, margin: 0, color: "#555555", whiteSpace: "pre-line" }}>
            {data.to.address}
          </p>
        )}
      </div>

      {/* Salutation */}
      <p style={{ fontSize: 13, margin: "0 0 8px", color: "#1a1a1a" }}>
        Dear {d(data.to.name)},
      </p>

      {/* Subject line */}
      <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 20px", color: primaryColor }}>
        Re: {d(data.subject)}
      </p>

      {/* Body paragraphs */}
      <div style={{ marginBottom: 32 }}>
        {paragraphs.map((para, i) => (
          <p
            key={i}
            style={{
              fontSize: 12,
              lineHeight: 1.75,
              color: "#222222",
              margin: i < paragraphs.length - 1 ? "0 0 14px" : 0,
              textAlign: "justify",
            }}
          >
            {para}
          </p>
        ))}
      </div>

      {/* Closing */}
      <div style={{ marginTop: 40 }}>
        <p style={{ fontSize: 12, margin: "0 0 48px", color: "#1a1a1a" }}>
          {data.closing || "Yours sincerely"},
        </p>
        <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 2px", color: "#111111" }}>
          {d(data.from.name)}
        </p>
        {data.from.title && (
          <p style={{ fontSize: 12, margin: 0, color: "#444444" }}>{data.from.title}</p>
        )}
      </div>
    </div>
  );
}

// ─── ModernLetter ─────────────────────────────────────────────────────────────

export function ModernLetter({ data, primaryColor }: LetterProps) {
  const paragraphs = splitBody(data.body);

  return (
    <div
      style={{
        width: 794,
        minHeight: 1123,
        padding: 0,
        backgroundColor: "#ffffff",
        fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
        color: "#1a1a1a",
        boxSizing: "border-box",
      }}
    >
      {/* Full-width header accent bar */}
      <div style={{ height: 40, backgroundColor: primaryColor, width: "100%" }} />

      {/* Content area */}
      <div style={{ padding: "40px 70px 60px" }}>

        {/* Sender + date row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          {/* Sender info */}
          <div>
            <p style={{ fontSize: 16, fontWeight: 700, margin: "0 0 3px", color: "#0f172a" }}>
              {d(data.from.name)}
            </p>
            {data.from.title && (
              <p style={{ fontSize: 12, margin: "0 0 1px", color: "#475569" }}>{data.from.title}</p>
            )}
            {data.from.company && (
              <p style={{ fontSize: 11, margin: "0 0 1px", color: "#64748b" }}>{data.from.company}</p>
            )}
            {data.from.address && (
              <p style={{ fontSize: 11, margin: "0 0 1px", color: "#64748b", whiteSpace: "pre-line" }}>
                {data.from.address}
              </p>
            )}
            {data.from.email && (
              <p style={{ fontSize: 11, margin: "0 0 1px", color: "#64748b" }}>{data.from.email}</p>
            )}
            {data.from.phone && (
              <p style={{ fontSize: 11, margin: 0, color: "#64748b" }}>{data.from.phone}</p>
            )}
          </div>

          {/* Date */}
          <p style={{ fontSize: 12, color: "#64748b", margin: 0, textAlign: "right" }}>
            {d(data.date)}
          </p>
        </div>

        {/* Thin gray divider */}
        <div style={{ height: 1, backgroundColor: "#e2e8f0", marginBottom: 24 }} />

        {/* Recipient block */}
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 2px", color: "#0f172a" }}>
            {d(data.to.name)}
          </p>
          {data.to.title && (
            <p style={{ fontSize: 12, margin: "0 0 1px", color: "#475569" }}>{data.to.title}</p>
          )}
          {data.to.company && (
            <p style={{ fontSize: 11, margin: "0 0 1px", color: "#64748b" }}>{data.to.company}</p>
          )}
          {data.to.address && (
            <p style={{ fontSize: 11, margin: 0, color: "#64748b", whiteSpace: "pre-line" }}>
              {data.to.address}
            </p>
          )}
        </div>

        {/* Salutation */}
        <p style={{ fontSize: 13, margin: "0 0 8px", color: "#1e293b" }}>
          Dear {d(data.to.name)},
        </p>

        {/* Subject line */}
        <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 22px", color: primaryColor }}>
          {d(data.subject)}
        </p>

        {/* Body paragraphs */}
        <div style={{ marginBottom: 36 }}>
          {paragraphs.map((para, i) => (
            <p
              key={i}
              style={{
                fontSize: 12,
                lineHeight: 1.8,
                color: "#334155",
                margin: i < paragraphs.length - 1 ? "0 0 14px" : 0,
              }}
            >
              {para}
            </p>
          ))}
        </div>

        {/* Closing */}
        <div style={{ marginTop: 44 }}>
          <p style={{ fontSize: 12, margin: "0 0 44px", color: "#1e293b" }}>
            {data.closing || "Yours sincerely"},
          </p>
          {/* Signature line */}
          <div style={{ width: 120, height: 1, backgroundColor: "#cbd5e1", marginBottom: 8 }} />
          <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 2px", color: "#0f172a" }}>
            {d(data.from.name)}
          </p>
          {data.from.title && (
            <p style={{ fontSize: 11, margin: "0 0 1px", color: primaryColor, fontWeight: 600 }}>
              {data.from.title}
            </p>
          )}
          {data.from.company && (
            <p style={{ fontSize: 11, margin: 0, color: "#64748b" }}>{data.from.company}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ExecutiveLetter ──────────────────────────────────────────────────────────

export function ExecutiveLetter({ data, primaryColor }: LetterProps) {
  const paragraphs = splitBody(data.body);

  return (
    <div
      style={{
        width: 794,
        minHeight: 1123,
        padding: "60px 80px",
        backgroundColor: "#ffffff",
        fontFamily: "'Georgia', 'Times New Roman', serif",
        color: "#1a1a1a",
        boxSizing: "border-box",
      }}
    >
      {/* Sender centered at top */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <p style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px", color: "#111111", letterSpacing: "0.02em" }}>
          {d(data.from.name)}
        </p>
        {data.from.title && (
          <p style={{ fontSize: 12, margin: "0 0 2px", color: "#555555" }}>{data.from.title}</p>
        )}
        {data.from.company && (
          <p style={{ fontSize: 11, margin: "0 0 2px", color: "#777777", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {data.from.company}
          </p>
        )}
        {data.from.address && (
          <p style={{ fontSize: 11, margin: "0 0 2px", color: "#777777" }}>{data.from.address}</p>
        )}
        {(data.from.email || data.from.phone) && (
          <p style={{ fontSize: 11, margin: 0, color: "#777777" }}>
            {[data.from.email, data.from.phone].filter(Boolean).join("  ·  ")}
          </p>
        )}
      </div>

      {/* Thick rule */}
      <div style={{ height: 3, backgroundColor: primaryColor, marginBottom: 28 }} />

      {/* Date right-aligned */}
      <p style={{ fontSize: 12, color: "#444444", textAlign: "right", margin: "0 0 24px" }}>
        {d(data.date)}
      </p>

      {/* Recipient block */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 2px", color: "#111111" }}>
          {d(data.to.name)}
        </p>
        {data.to.title && (
          <p style={{ fontSize: 12, margin: "0 0 1px", color: "#444444" }}>{data.to.title}</p>
        )}
        {data.to.company && (
          <p style={{ fontSize: 11, margin: "0 0 1px", color: "#555555" }}>{data.to.company}</p>
        )}
        {data.to.address && (
          <p style={{ fontSize: 11, margin: 0, color: "#555555", whiteSpace: "pre-line" }}>
            {data.to.address}
          </p>
        )}
      </div>

      {/* Salutation */}
      <p style={{ fontSize: 13, margin: "0 0 8px", color: "#1a1a1a" }}>
        Dear {d(data.to.name)},
      </p>

      {/* Subject bold */}
      <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 22px", color: "#111111" }}>
        {d(data.subject)}
      </p>

      {/* Body paragraphs */}
      <div style={{ marginBottom: 36 }}>
        {paragraphs.map((para, i) => (
          <p
            key={i}
            style={{
              fontSize: 14,
              lineHeight: 1.9,
              color: "#222222",
              margin: i < paragraphs.length - 1 ? "0 0 16px" : 0,
              textAlign: "justify",
            }}
          >
            {para}
          </p>
        ))}
      </div>

      {/* Closing */}
      <div style={{ marginTop: 44 }}>
        <p style={{ fontSize: 13, margin: "0 0 48px", color: "#1a1a1a" }}>
          {data.closing || "Yours faithfully"},
        </p>
        <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 2px", color: "#111111" }}>
          {d(data.from.name)}
        </p>
        {data.from.title && (
          <p style={{ fontSize: 12, margin: 0, color: "#555555" }}>{data.from.title}</p>
        )}
      </div>
    </div>
  );
}

// ─── CleanLetter ──────────────────────────────────────────────────────────────

export function CleanLetter({ data, primaryColor }: LetterProps) {
  const paragraphs = splitBody(data.body);

  return (
    <div
      style={{
        width: 794,
        minHeight: 1123,
        padding: "56px 64px",
        backgroundColor: "#ffffff",
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        color: "#1a1a1a",
        boxSizing: "border-box",
        borderTop: `4px solid ${primaryColor}`,
      }}
    >
      {/* Sender left, date right on same row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 2px", color: "#111111" }}>
            {d(data.from.name)}
          </p>
          {data.from.title && (
            <p style={{ fontSize: 11, margin: "0 0 1px", color: "#555555" }}>{data.from.title}</p>
          )}
          {data.from.company && (
            <p style={{ fontSize: 11, margin: "0 0 1px", color: "#555555" }}>{data.from.company}</p>
          )}
          {data.from.address && (
            <p style={{ fontSize: 11, margin: "0 0 1px", color: "#777777", whiteSpace: "pre-line" }}>
              {data.from.address}
            </p>
          )}
          {data.from.email && (
            <p style={{ fontSize: 11, margin: "0 0 1px", color: "#777777" }}>{data.from.email}</p>
          )}
          {data.from.phone && (
            <p style={{ fontSize: 11, margin: 0, color: "#777777" }}>{data.from.phone}</p>
          )}
        </div>
        <p style={{ fontSize: 11, color: "#777777", margin: 0 }}>{d(data.date)}</p>
      </div>

      {/* Thin divider */}
      <div style={{ height: 1, backgroundColor: "#e5e5e5", marginBottom: 24 }} />

      {/* Recipient block */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 2px", color: "#111111" }}>
          {d(data.to.name)}
        </p>
        {data.to.title && (
          <p style={{ fontSize: 11, margin: "0 0 1px", color: "#555555" }}>{data.to.title}</p>
        )}
        {data.to.company && (
          <p style={{ fontSize: 11, margin: "0 0 1px", color: "#777777" }}>{data.to.company}</p>
        )}
        {data.to.address && (
          <p style={{ fontSize: 11, margin: 0, color: "#777777", whiteSpace: "pre-line" }}>
            {data.to.address}
          </p>
        )}
      </div>

      {/* Salutation */}
      <p style={{ fontSize: 13, margin: "0 0 6px", color: "#1a1a1a" }}>
        Dear {d(data.to.name)},
      </p>

      {/* Subject underlined */}
      <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 20px", color: "#111111", textDecoration: "underline" }}>
        {d(data.subject)}
      </p>

      {/* Body paragraphs */}
      <div style={{ marginBottom: 32 }}>
        {paragraphs.map((para, i) => (
          <p
            key={i}
            style={{
              fontSize: 13,
              lineHeight: 1.7,
              color: "#333333",
              margin: i < paragraphs.length - 1 ? "0 0 13px" : 0,
            }}
          >
            {para}
          </p>
        ))}
      </div>

      {/* Closing */}
      <div style={{ marginTop: 40 }}>
        <p style={{ fontSize: 12, margin: "0 0 44px", color: "#1a1a1a" }}>
          {data.closing || "Yours sincerely"},
        </p>
        <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 2px", color: "#111111" }}>
          {d(data.from.name)}
        </p>
        {data.from.title && (
          <p style={{ fontSize: 11, margin: 0, color: "#555555" }}>{data.from.title}</p>
        )}
      </div>
    </div>
  );
}

// ─── MinimalLetter ────────────────────────────────────────────────────────────

export function MinimalLetter({ data, primaryColor }: LetterProps) {
  const paragraphs = splitBody(data.body);

  return (
    <div
      style={{
        width: 794,
        minHeight: 1123,
        padding: "72px 80px",
        backgroundColor: "#ffffff",
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        color: "#1a1a1a",
        boxSizing: "border-box",
      }}
    >
      {/* Sender name */}
      <p style={{ fontSize: 18, fontWeight: 700, margin: "0 0 4px", color: "#111111" }}>
        {d(data.from.name)}
      </p>
      {data.from.title && (
        <p style={{ fontSize: 12, margin: "0 0 1px", color: "#888888" }}>{data.from.title}</p>
      )}
      {data.from.company && (
        <p style={{ fontSize: 11, margin: "0 0 1px", color: "#aaaaaa" }}>{data.from.company}</p>
      )}
      {data.from.address && (
        <p style={{ fontSize: 11, margin: "0 0 1px", color: "#aaaaaa", whiteSpace: "pre-line" }}>
          {data.from.address}
        </p>
      )}
      {data.from.email && (
        <p style={{ fontSize: 11, margin: "0 0 1px", color: "#aaaaaa" }}>{data.from.email}</p>
      )}
      {data.from.phone && (
        <p style={{ fontSize: 11, margin: "0 0 28px", color: "#aaaaaa" }}>{data.from.phone}</p>
      )}
      {!data.from.phone && <div style={{ marginBottom: 28 }} />}

      {/* Date */}
      <p style={{ fontSize: 11, color: "#aaaaaa", margin: "0 0 32px" }}>{d(data.date)}</p>

      {/* Recipient block */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 2px", color: "#111111" }}>
          {d(data.to.name)}
        </p>
        {data.to.title && (
          <p style={{ fontSize: 11, margin: "0 0 1px", color: "#666666" }}>{data.to.title}</p>
        )}
        {data.to.company && (
          <p style={{ fontSize: 11, margin: "0 0 1px", color: "#888888" }}>{data.to.company}</p>
        )}
        {data.to.address && (
          <p style={{ fontSize: 11, margin: 0, color: "#888888", whiteSpace: "pre-line" }}>
            {data.to.address}
          </p>
        )}
      </div>

      {/* Salutation */}
      <p style={{ fontSize: 13, margin: "0 0 6px", color: "#1a1a1a" }}>
        Dear {d(data.to.name)},
      </p>

      {/* Subject */}
      <p style={{ fontSize: 12, fontWeight: 600, margin: "0 0 22px", color: primaryColor }}>
        {d(data.subject)}
      </p>

      {/* Body paragraphs */}
      <div style={{ marginBottom: 36 }}>
        {paragraphs.map((para, i) => (
          <p
            key={i}
            style={{
              fontSize: 13,
              lineHeight: 2,
              color: "#444444",
              margin: i < paragraphs.length - 1 ? "0 0 16px" : 0,
            }}
          >
            {para}
          </p>
        ))}
      </div>

      {/* Closing */}
      <div style={{ marginTop: 48 }}>
        <p style={{ fontSize: 12, margin: "0 0 48px", color: "#1a1a1a" }}>
          {data.closing || "Yours sincerely"},
        </p>
        <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 2px", color: "#111111" }}>
          {d(data.from.name)}
        </p>
        {data.from.title && (
          <p style={{ fontSize: 11, margin: 0, color: "#888888" }}>{data.from.title}</p>
        )}
      </div>
    </div>
  );
}

// ─── ClassicLetter ────────────────────────────────────────────────────────────

export function ClassicLetter({ data, primaryColor }: LetterProps) {
  const paragraphs = splitBody(data.body);

  return (
    <div
      style={{
        width: 794,
        minHeight: 1123,
        padding: "60px 70px",
        backgroundColor: "#ffffff",
        fontFamily: "'Times New Roman', Georgia, serif",
        color: "#1a1a1a",
        boxSizing: "border-box",
      }}
    >
      {/* Sender top-right */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 2px", color: "#111111" }}>
            {d(data.from.name)}
          </p>
          {data.from.title && (
            <p style={{ fontSize: 11, margin: "0 0 1px", color: "#555555" }}>{data.from.title}</p>
          )}
          {data.from.company && (
            <p style={{ fontSize: 11, margin: "0 0 1px", color: "#555555" }}>{data.from.company}</p>
          )}
          {data.from.address && (
            <p style={{ fontSize: 11, margin: "0 0 1px", color: "#777777", whiteSpace: "pre-line" }}>
              {data.from.address}
            </p>
          )}
          {data.from.email && (
            <p style={{ fontSize: 11, margin: "0 0 1px", color: "#777777" }}>{data.from.email}</p>
          )}
          {data.from.phone && (
            <p style={{ fontSize: 11, margin: 0, color: "#777777" }}>{data.from.phone}</p>
          )}
          {/* Date below sender */}
          <p style={{ fontSize: 12, color: "#444444", margin: "10px 0 0" }}>{d(data.date)}</p>
        </div>
      </div>

      {/* Recipient block left */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 2px", color: "#111111" }}>
          {d(data.to.name)}
        </p>
        {data.to.title && (
          <p style={{ fontSize: 11, margin: "0 0 1px", color: "#555555" }}>{data.to.title}</p>
        )}
        {data.to.company && (
          <p style={{ fontSize: 11, margin: "0 0 1px", color: "#777777" }}>{data.to.company}</p>
        )}
        {data.to.address && (
          <p style={{ fontSize: 11, margin: 0, color: "#777777", whiteSpace: "pre-line" }}>
            {data.to.address}
          </p>
        )}
      </div>

      {/* Dear salutation */}
      <p style={{ fontSize: 13, margin: "0 0 6px", color: "#1a1a1a" }}>
        Dear {d(data.to.name)},
      </p>

      {/* Subject */}
      <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 20px", color: primaryColor, textDecoration: "underline" }}>
        {d(data.subject)}
      </p>

      {/* Body full-width */}
      <div style={{ marginBottom: 32 }}>
        {paragraphs.map((para, i) => (
          <p
            key={i}
            style={{
              fontSize: 13,
              lineHeight: 1.8,
              color: "#222222",
              margin: i < paragraphs.length - 1 ? "0 0 14px" : 0,
              textAlign: "justify",
            }}
          >
            {para}
          </p>
        ))}
      </div>

      {/* Yours faithfully closing */}
      <div style={{ marginTop: 40 }}>
        <p style={{ fontSize: 13, margin: "0 0 48px", color: "#1a1a1a" }}>
          {data.closing || "Yours faithfully"},
        </p>
        <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 2px", color: "#111111" }}>
          {d(data.from.name)}
        </p>
        {data.from.title && (
          <p style={{ fontSize: 12, margin: 0, color: "#555555" }}>{data.from.title}</p>
        )}
      </div>
    </div>
  );
}

// ─── BoldLetter ───────────────────────────────────────────────────────────────

export function BoldLetter({ data, primaryColor }: LetterProps) {
  const paragraphs = splitBody(data.body);

  return (
    <div
      style={{
        width: 794,
        minHeight: 1123,
        padding: 0,
        backgroundColor: "#ffffff",
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        color: "#1a1a1a",
        boxSizing: "border-box",
      }}
    >
      {/* Full-width primaryColor header 100px */}
      <div
        style={{
          height: 100,
          backgroundColor: primaryColor,
          display: "flex",
          alignItems: "center",
          padding: "0 60px",
          justifyContent: "space-between",
        }}
      >
        <div>
          <p style={{ fontSize: 22, fontWeight: 700, margin: "0 0 3px", color: "#ffffff", letterSpacing: "0.01em" }}>
            {d(data.from.name)}
          </p>
          {data.from.title && (
            <p style={{ fontSize: 11, margin: 0, color: "rgba(255,255,255,0.8)" }}>{data.from.title}</p>
          )}
          {data.from.company && (
            <p style={{ fontSize: 11, margin: "1px 0 0", color: "rgba(255,255,255,0.7)" }}>{data.from.company}</p>
          )}
        </div>
        <div style={{ textAlign: "right" }}>
          {data.from.email && (
            <p style={{ fontSize: 10, margin: "0 0 1px", color: "rgba(255,255,255,0.8)" }}>{data.from.email}</p>
          )}
          {data.from.phone && (
            <p style={{ fontSize: 10, margin: "0 0 1px", color: "rgba(255,255,255,0.8)" }}>{data.from.phone}</p>
          )}
          {data.from.address && (
            <p style={{ fontSize: 10, margin: 0, color: "rgba(255,255,255,0.7)" }}>{data.from.address}</p>
          )}
        </div>
      </div>

      {/* Content area */}
      <div style={{ padding: "40px 60px 60px" }}>
        {/* Date + recipient row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 2px", color: "#111111" }}>
              {d(data.to.name)}
            </p>
            {data.to.title && (
              <p style={{ fontSize: 11, margin: "0 0 1px", color: "#555555" }}>{data.to.title}</p>
            )}
            {data.to.company && (
              <p style={{ fontSize: 11, margin: "0 0 1px", color: "#777777" }}>{data.to.company}</p>
            )}
            {data.to.address && (
              <p style={{ fontSize: 11, margin: 0, color: "#777777", whiteSpace: "pre-line" }}>
                {data.to.address}
              </p>
            )}
          </div>
          <p style={{ fontSize: 11, color: "#777777", margin: 0 }}>{d(data.date)}</p>
        </div>

        {/* Salutation */}
        <p style={{ fontSize: 13, margin: "0 0 8px", color: "#1a1a1a" }}>
          Dear {d(data.to.name)},
        </p>

        {/* Subject bold 16px */}
        <p style={{ fontSize: 16, fontWeight: 700, margin: "0 0 22px", color: "#111111" }}>
          {d(data.subject)}
        </p>

        {/* Body */}
        <div style={{ marginBottom: 36 }}>
          {paragraphs.map((para, i) => (
            <p
              key={i}
              style={{
                fontSize: 13,
                lineHeight: 1.8,
                color: "#333333",
                margin: i < paragraphs.length - 1 ? "0 0 14px" : 0,
              }}
            >
              {para}
            </p>
          ))}
        </div>

        {/* Closing */}
        <div style={{ marginTop: 44 }}>
          <p style={{ fontSize: 12, margin: "0 0 44px", color: "#1a1a1a" }}>
            {data.closing || "Yours sincerely"},
          </p>
          <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 2px", color: "#111111" }}>
            {d(data.from.name)}
          </p>
          {data.from.title && (
            <p style={{ fontSize: 11, margin: 0, color: primaryColor, fontWeight: 600 }}>{data.from.title}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ContemporaryLetter ───────────────────────────────────────────────────────

export function ContemporaryLetter({ data, primaryColor }: LetterProps) {
  const paragraphs = splitBody(data.body);

  return (
    <div
      style={{
        width: 794,
        minHeight: 1123,
        padding: "56px 68px",
        backgroundColor: "#ffffff",
        fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
        color: "#1a1a1a",
        boxSizing: "border-box",
      }}
    >
      {/* Two-column header: sender left | date right */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <p style={{ fontSize: 15, fontWeight: 700, margin: "0 0 3px", color: "#0f172a" }}>
            {d(data.from.name)}
          </p>
          {data.from.title && (
            <p style={{ fontSize: 11, margin: "0 0 1px", color: "#64748b" }}>{data.from.title}</p>
          )}
          {data.from.company && (
            <p style={{ fontSize: 11, margin: "0 0 1px", color: "#94a3b8" }}>{data.from.company}</p>
          )}
          {data.from.address && (
            <p style={{ fontSize: 10, margin: "0 0 1px", color: "#94a3b8", whiteSpace: "pre-line" }}>
              {data.from.address}
            </p>
          )}
          {data.from.email && (
            <p style={{ fontSize: 10, margin: "0 0 1px", color: "#94a3b8" }}>{data.from.email}</p>
          )}
          {data.from.phone && (
            <p style={{ fontSize: 10, margin: 0, color: "#94a3b8" }}>{data.from.phone}</p>
          )}
        </div>
        <p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>{d(data.date)}</p>
      </div>

      {/* Thin accent rule */}
      <div style={{ height: 2, backgroundColor: primaryColor, marginBottom: 28 }} />

      {/* Recipient block */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 2px", color: "#0f172a" }}>
          {d(data.to.name)}
        </p>
        {data.to.title && (
          <p style={{ fontSize: 11, margin: "0 0 1px", color: "#475569" }}>{data.to.title}</p>
        )}
        {data.to.company && (
          <p style={{ fontSize: 11, margin: "0 0 1px", color: "#64748b" }}>{data.to.company}</p>
        )}
        {data.to.address && (
          <p style={{ fontSize: 11, margin: 0, color: "#64748b", whiteSpace: "pre-line" }}>
            {data.to.address}
          </p>
        )}
      </div>

      {/* Salutation */}
      <p style={{ fontSize: 13, margin: "0 0 6px", color: "#1e293b" }}>
        Dear {d(data.to.name)},
      </p>

      {/* Bold subject */}
      <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 22px", color: primaryColor }}>
        {d(data.subject)}
      </p>

      {/* Body */}
      <div style={{ marginBottom: 36 }}>
        {paragraphs.map((para, i) => (
          <p
            key={i}
            style={{
              fontSize: 13,
              lineHeight: 1.75,
              color: "#334155",
              margin: i < paragraphs.length - 1 ? "0 0 14px" : 0,
            }}
          >
            {para}
          </p>
        ))}
      </div>

      {/* Closing */}
      <div style={{ marginTop: 44 }}>
        <p style={{ fontSize: 12, margin: "0 0 44px", color: "#1e293b" }}>
          {data.closing || "Yours sincerely"},
        </p>
        <div style={{ width: 100, height: 1, backgroundColor: primaryColor, marginBottom: 8 }} />
        <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 2px", color: "#0f172a" }}>
          {d(data.from.name)}
        </p>
        {data.from.title && (
          <p style={{ fontSize: 11, margin: 0, color: "#64748b" }}>{data.from.title}</p>
        )}
      </div>
    </div>
  );
}

// ─── ProfessionalLetter ───────────────────────────────────────────────────────

export function ProfessionalLetter({ data, primaryColor }: LetterProps) {
  const paragraphs = splitBody(data.body);

  return (
    <div
      style={{
        width: 794,
        minHeight: 1123,
        padding: "60px 70px",
        backgroundColor: "#ffffff",
        fontFamily: "'Georgia', 'Times New Roman', serif",
        color: "#1a1a1a",
        boxSizing: "border-box",
      }}
    >
      {/* Sender in top-right block */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <div style={{ textAlign: "right", borderRight: `3px solid ${primaryColor}`, paddingRight: 16 }}>
          <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 2px", color: "#111111" }}>
            {d(data.from.name)}
          </p>
          {data.from.title && (
            <p style={{ fontSize: 11, margin: "0 0 1px", color: "#555555" }}>{data.from.title}</p>
          )}
          {data.from.company && (
            <p style={{ fontSize: 11, margin: "0 0 1px", color: "#777777" }}>{data.from.company}</p>
          )}
          {data.from.address && (
            <p style={{ fontSize: 10, margin: "0 0 1px", color: "#777777", whiteSpace: "pre-line" }}>
              {data.from.address}
            </p>
          )}
          {data.from.email && (
            <p style={{ fontSize: 10, margin: "0 0 1px", color: "#777777" }}>{data.from.email}</p>
          )}
          {data.from.phone && (
            <p style={{ fontSize: 10, margin: 0, color: "#777777" }}>{data.from.phone}</p>
          )}
        </div>
      </div>

      {/* Date left */}
      <p style={{ fontSize: 12, color: "#555555", margin: "0 0 20px" }}>{d(data.date)}</p>

      {/* Horizontal rule */}
      <div style={{ height: 1, backgroundColor: "#d1d5db", marginBottom: 24 }} />

      {/* Recipient block */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 2px", color: "#111111" }}>
          {d(data.to.name)}
        </p>
        {data.to.title && (
          <p style={{ fontSize: 11, margin: "0 0 1px", color: "#555555" }}>{data.to.title}</p>
        )}
        {data.to.company && (
          <p style={{ fontSize: 11, margin: "0 0 1px", color: "#777777" }}>{data.to.company}</p>
        )}
        {data.to.address && (
          <p style={{ fontSize: 11, margin: 0, color: "#777777", whiteSpace: "pre-line" }}>
            {data.to.address}
          </p>
        )}
      </div>

      {/* Salutation */}
      <p style={{ fontSize: 13, margin: "0 0 6px", color: "#1a1a1a" }}>
        Dear {d(data.to.name)},
      </p>

      {/* Subject */}
      <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 20px", color: primaryColor }}>
        Re: {d(data.subject)}
      </p>

      {/* Body */}
      <div style={{ marginBottom: 32 }}>
        {paragraphs.map((para, i) => (
          <p
            key={i}
            style={{
              fontSize: 13,
              lineHeight: 1.8,
              color: "#222222",
              margin: i < paragraphs.length - 1 ? "0 0 13px" : 0,
              textAlign: "justify",
            }}
          >
            {para}
          </p>
        ))}
      </div>

      {/* Professional closing */}
      <div style={{ marginTop: 40 }}>
        <p style={{ fontSize: 12, margin: "0 0 48px", color: "#1a1a1a" }}>
          {data.closing || "Yours faithfully"},
        </p>
        <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 2px", color: "#111111" }}>
          {d(data.from.name)}
        </p>
        {data.from.title && (
          <p style={{ fontSize: 11, margin: "0 0 1px", color: "#555555" }}>{data.from.title}</p>
        )}
        {data.from.company && (
          <p style={{ fontSize: 11, margin: 0, color: "#777777" }}>{data.from.company}</p>
        )}
      </div>
    </div>
  );
}

// ─── ElegantLetter ────────────────────────────────────────────────────────────

export function ElegantLetter({ data, primaryColor }: LetterProps) {
  const paragraphs = splitBody(data.body);

  return (
    <div
      style={{
        width: 794,
        minHeight: 1123,
        padding: "64px 76px",
        backgroundColor: "#fafaf9",
        fontFamily: "'Georgia', 'Times New Roman', serif",
        color: "#1a1a1a",
        boxSizing: "border-box",
      }}
    >
      {/* Name in large italic */}
      <p
        style={{
          fontSize: 24,
          fontStyle: "italic",
          fontWeight: 400,
          margin: "0 0 4px",
          color: "#111111",
          letterSpacing: "0.01em",
        }}
      >
        {d(data.from.name)}
      </p>
      {data.from.title && (
        <p style={{ fontSize: 11, margin: "0 0 1px", color: "#999999", letterSpacing: "0.06em", textTransform: "uppercase" }}>
          {data.from.title}
        </p>
      )}
      {data.from.company && (
        <p style={{ fontSize: 11, margin: "0 0 2px", color: "#bbbbbb" }}>{data.from.company}</p>
      )}
      {(data.from.email || data.from.phone) && (
        <p style={{ fontSize: 10, margin: "0 0 2px", color: "#bbbbbb" }}>
          {[data.from.email, data.from.phone].filter(Boolean).join("  ·  ")}
        </p>
      )}

      {/* Double rule: 1px + 3px gap + 1px */}
      <div style={{ marginTop: 18, marginBottom: 18 }}>
        <div style={{ height: 1, backgroundColor: primaryColor }} />
        <div style={{ height: 3 }} />
        <div style={{ height: 1, backgroundColor: primaryColor }} />
      </div>

      {/* Date */}
      <p style={{ fontSize: 11, color: "#aaaaaa", margin: "0 0 24px", textAlign: "right" }}>{d(data.date)}</p>

      {/* Recipient */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 2px", color: "#111111" }}>
          {d(data.to.name)}
        </p>
        {data.to.title && (
          <p style={{ fontSize: 11, margin: "0 0 1px", color: "#666666" }}>{data.to.title}</p>
        )}
        {data.to.company && (
          <p style={{ fontSize: 11, margin: "0 0 1px", color: "#888888" }}>{data.to.company}</p>
        )}
        {data.to.address && (
          <p style={{ fontSize: 11, margin: 0, color: "#888888", whiteSpace: "pre-line" }}>
            {data.to.address}
          </p>
        )}
      </div>

      {/* Salutation */}
      <p style={{ fontSize: 13, margin: "0 0 6px", color: "#1a1a1a" }}>
        Dear {d(data.to.name)},
      </p>

      {/* Subject */}
      <p style={{ fontSize: 13, fontWeight: 600, fontStyle: "italic", margin: "0 0 22px", color: primaryColor }}>
        {d(data.subject)}
      </p>

      {/* Body */}
      <div style={{ marginBottom: 36 }}>
        {paragraphs.map((para, i) => (
          <p
            key={i}
            style={{
              fontSize: 13,
              lineHeight: 1.85,
              color: "#333333",
              margin: i < paragraphs.length - 1 ? "0 0 16px" : 0,
              textAlign: "justify",
            }}
          >
            {para}
          </p>
        ))}
      </div>

      {/* Closing */}
      <div style={{ marginTop: 44 }}>
        <p style={{ fontSize: 13, fontStyle: "italic", margin: "0 0 48px", color: "#1a1a1a" }}>
          {data.closing || "Yours sincerely"},
        </p>
        <p style={{ fontSize: 15, fontStyle: "italic", margin: "0 0 2px", color: "#111111" }}>
          {d(data.from.name)}
        </p>
        {data.from.title && (
          <p style={{ fontSize: 11, margin: 0, color: "#999999" }}>{data.from.title}</p>
        )}
      </div>
    </div>
  );
}

// ─── CompactLetter ────────────────────────────────────────────────────────────

export function CompactLetter({ data, primaryColor }: LetterProps) {
  const paragraphs = splitBody(data.body);

  return (
    <div
      style={{
        width: 794,
        minHeight: 1123,
        padding: "40px 40px",
        backgroundColor: "#ffffff",
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        color: "#1a1a1a",
        boxSizing: "border-box",
        borderTop: `2px solid ${primaryColor}`,
      }}
    >
      {/* Sender + date same row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 1px", color: "#111111" }}>
            {d(data.from.name)}
          </p>
          {data.from.title && (
            <p style={{ fontSize: 10, margin: "0 0 1px", color: "#555555" }}>{data.from.title}</p>
          )}
          {data.from.company && (
            <p style={{ fontSize: 10, margin: "0 0 1px", color: "#777777" }}>{data.from.company}</p>
          )}
          {data.from.address && (
            <p style={{ fontSize: 10, margin: "0 0 1px", color: "#777777", whiteSpace: "pre-line" }}>
              {data.from.address}
            </p>
          )}
          {(data.from.email || data.from.phone) && (
            <p style={{ fontSize: 10, margin: 0, color: "#777777" }}>
              {[data.from.email, data.from.phone].filter(Boolean).join("  ·  ")}
            </p>
          )}
        </div>
        <p style={{ fontSize: 10, color: "#777777", margin: 0 }}>{d(data.date)}</p>
      </div>

      <div style={{ height: 1, backgroundColor: "#e5e5e5", marginBottom: 12 }} />

      {/* Recipient block */}
      <div style={{ marginBottom: 14 }}>
        <p style={{ fontSize: 12, fontWeight: 700, margin: "0 0 1px", color: "#111111" }}>
          {d(data.to.name)}
        </p>
        {data.to.title && (
          <p style={{ fontSize: 10, margin: "0 0 1px", color: "#555555" }}>{data.to.title}</p>
        )}
        {data.to.company && (
          <p style={{ fontSize: 10, margin: "0 0 1px", color: "#777777" }}>{data.to.company}</p>
        )}
        {data.to.address && (
          <p style={{ fontSize: 10, margin: 0, color: "#777777", whiteSpace: "pre-line" }}>
            {data.to.address}
          </p>
        )}
      </div>

      {/* Salutation */}
      <p style={{ fontSize: 12, margin: "0 0 4px", color: "#1a1a1a" }}>
        Dear {d(data.to.name)},
      </p>

      {/* Subject */}
      <p style={{ fontSize: 12, fontWeight: 700, margin: "0 0 14px", color: primaryColor }}>
        {d(data.subject)}
      </p>

      {/* Body — compact */}
      <div style={{ marginBottom: 24 }}>
        {paragraphs.map((para, i) => (
          <p
            key={i}
            style={{
              fontSize: 12,
              lineHeight: 1.6,
              color: "#333333",
              margin: i < paragraphs.length - 1 ? "0 0 10px" : 0,
            }}
          >
            {para}
          </p>
        ))}
      </div>

      {/* Closing */}
      <div style={{ marginTop: 28 }}>
        <p style={{ fontSize: 11, margin: "0 0 32px", color: "#1a1a1a" }}>
          {data.closing || "Yours sincerely"},
        </p>
        <p style={{ fontSize: 12, fontWeight: 700, margin: "0 0 1px", color: "#111111" }}>
          {d(data.from.name)}
        </p>
        {data.from.title && (
          <p style={{ fontSize: 10, margin: 0, color: "#555555" }}>{data.from.title}</p>
        )}
      </div>
    </div>
  );
}

// ─── AcademicLetter ───────────────────────────────────────────────────────────

export function AcademicLetter({ data, primaryColor }: LetterProps) {
  const paragraphs = splitBody(data.body);

  return (
    <div
      style={{
        width: 794,
        minHeight: 1123,
        padding: "60px 72px",
        backgroundColor: "#ffffff",
        fontFamily: "'Times New Roman', Georgia, serif",
        color: "#1a1a1a",
        boxSizing: "border-box",
      }}
    >
      {/* Centered sender block */}
      <div style={{ textAlign: "center", marginBottom: 12 }}>
        <p style={{ fontSize: 16, fontWeight: 700, margin: "0 0 3px", color: "#111111", letterSpacing: "0.03em" }}>
          {d(data.from.name)}
        </p>
        {data.from.title && (
          <p style={{ fontSize: 12, margin: "0 0 2px", color: "#444444", fontStyle: "italic" }}>
            {data.from.title}
          </p>
        )}
        {data.from.company && (
          <p style={{ fontSize: 12, margin: "0 0 2px", color: "#444444" }}>{data.from.company}</p>
        )}
        {data.from.address && (
          <p style={{ fontSize: 11, margin: "0 0 2px", color: "#666666", whiteSpace: "pre-line" }}>
            {data.from.address}
          </p>
        )}
        {(data.from.email || data.from.phone) && (
          <p style={{ fontSize: 11, margin: 0, color: "#666666" }}>
            {[data.from.email, data.from.phone].filter(Boolean).join("  |  ")}
          </p>
        )}
      </div>

      {/* Thin rule */}
      <div style={{ height: 1, backgroundColor: primaryColor, marginBottom: 20 }} />

      {/* Date right */}
      <p style={{ fontSize: 12, color: "#555555", textAlign: "right", margin: "0 0 24px" }}>{d(data.date)}</p>

      {/* Recipient formal address */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 2px", color: "#111111" }}>
          {d(data.to.name)}
        </p>
        {data.to.title && (
          <p style={{ fontSize: 12, margin: "0 0 1px", color: "#444444", fontStyle: "italic" }}>
            {data.to.title}
          </p>
        )}
        {data.to.company && (
          <p style={{ fontSize: 11, margin: "0 0 1px", color: "#666666" }}>{data.to.company}</p>
        )}
        {data.to.address && (
          <p style={{ fontSize: 11, margin: 0, color: "#666666", whiteSpace: "pre-line" }}>
            {data.to.address}
          </p>
        )}
      </div>

      {/* Salutation */}
      <p style={{ fontSize: 13, margin: "0 0 6px", color: "#1a1a1a" }}>
        Dear {d(data.to.name)},
      </p>

      {/* Subject */}
      <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 20px", color: primaryColor }}>
        Re: {d(data.subject)}
      </p>

      {/* Body indented */}
      <div style={{ marginBottom: 32 }}>
        {paragraphs.map((para, i) => (
          <p
            key={i}
            style={{
              fontSize: 13,
              lineHeight: 1.8,
              color: "#222222",
              margin: i < paragraphs.length - 1 ? "0 0 14px" : 0,
              textIndent: "2em",
              textAlign: "justify",
            }}
          >
            {para}
          </p>
        ))}
      </div>

      {/* Closing */}
      <div style={{ marginTop: 40 }}>
        <p style={{ fontSize: 13, margin: "0 0 48px", color: "#1a1a1a" }}>
          {data.closing || "Yours sincerely"},
        </p>
        <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 2px", color: "#111111" }}>
          {d(data.from.name)}
        </p>
        {data.from.title && (
          <p style={{ fontSize: 12, margin: "0 0 1px", color: "#444444", fontStyle: "italic" }}>{data.from.title}</p>
        )}
        {data.from.company && (
          <p style={{ fontSize: 11, margin: 0, color: "#666666" }}>{data.from.company}</p>
        )}
      </div>
    </div>
  );
}

// ─── OfficialLetter ───────────────────────────────────────────────────────────

export function OfficialLetter({ data, primaryColor }: LetterProps) {
  const paragraphs = splitBody(data.body);

  return (
    <div
      style={{
        width: 794,
        minHeight: 1123,
        padding: "60px 70px",
        backgroundColor: "#ffffff",
        fontFamily: "'Times New Roman', Georgia, serif",
        color: "#1a1a1a",
        boxSizing: "border-box",
        borderBottom: `3px solid ${primaryColor}`,
      }}
    >
      {/* Sender address top-left */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 2px", color: "#111111" }}>
          {d(data.from.name)}
        </p>
        {data.from.title && (
          <p style={{ fontSize: 12, margin: "0 0 1px", color: "#444444" }}>{data.from.title}</p>
        )}
        {data.from.company && (
          <p style={{ fontSize: 11, margin: "0 0 1px", color: "#555555" }}>{data.from.company}</p>
        )}
        {data.from.address && (
          <p style={{ fontSize: 11, margin: "0 0 1px", color: "#666666", whiteSpace: "pre-line" }}>
            {data.from.address}
          </p>
        )}
        {data.from.email && (
          <p style={{ fontSize: 11, margin: "0 0 1px", color: "#666666" }}>{data.from.email}</p>
        )}
        {data.from.phone && (
          <p style={{ fontSize: 11, margin: 0, color: "#666666" }}>{data.from.phone}</p>
        )}
      </div>

      {/* Date */}
      <p style={{ fontSize: 12, color: "#444444", margin: "0 0 20px" }}>{d(data.date)}</p>

      {/* Horizontal rule */}
      <div style={{ height: 2, backgroundColor: primaryColor, marginBottom: 24 }} />

      {/* Recipient block */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 2px", color: "#111111" }}>
          {d(data.to.name)}
        </p>
        {data.to.title && (
          <p style={{ fontSize: 12, margin: "0 0 1px", color: "#444444" }}>{data.to.title}</p>
        )}
        {data.to.company && (
          <p style={{ fontSize: 11, margin: "0 0 1px", color: "#666666" }}>{data.to.company}</p>
        )}
        {data.to.address && (
          <p style={{ fontSize: 11, margin: 0, color: "#666666", whiteSpace: "pre-line" }}>
            {data.to.address}
          </p>
        )}
      </div>

      {/* Ref number line */}
      <p style={{ fontSize: 11, margin: "0 0 16px", color: "#555555" }}>
        Ref: {d(data.subject).replace(/\s+/g, "-").toUpperCase().slice(0, 30)}
      </p>

      {/* Subject: in bold */}
      <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 20px", color: "#111111" }}>
        Subject: {d(data.subject)}
      </p>

      {/* Salutation */}
      <p style={{ fontSize: 13, margin: "0 0 20px", color: "#1a1a1a" }}>
        Dear {d(data.to.name)},
      </p>

      {/* Body formal */}
      <div style={{ marginBottom: 32 }}>
        {paragraphs.map((para, i) => (
          <p
            key={i}
            style={{
              fontSize: 13,
              lineHeight: 1.85,
              color: "#222222",
              margin: i < paragraphs.length - 1 ? "0 0 14px" : 0,
              textAlign: "justify",
            }}
          >
            {para}
          </p>
        ))}
      </div>

      {/* Closing */}
      <div style={{ marginTop: 40 }}>
        <p style={{ fontSize: 13, margin: "0 0 48px", color: "#1a1a1a" }}>
          {data.closing || "Yours faithfully"},
        </p>
        <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 2px", color: "#111111" }}>
          {d(data.from.name)}
        </p>
        {data.from.title && (
          <p style={{ fontSize: 12, margin: 0, color: "#444444" }}>{data.from.title}</p>
        )}
      </div>
    </div>
  );
}

// ─── DiplomaticLetter ─────────────────────────────────────────────────────────

export function DiplomaticLetter({ data, primaryColor }: LetterProps) {
  const paragraphs = splitBody(data.body);

  return (
    <div
      style={{
        width: 794,
        minHeight: 1123,
        padding: "64px 90px",
        backgroundColor: "#fdfcfb",
        fontFamily: "'Times New Roman', Georgia, serif",
        color: "#1a1a1a",
        boxSizing: "border-box",
      }}
    >
      {/* Name in small-caps style */}
      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <p
          style={{
            fontSize: 16,
            fontWeight: 700,
            margin: "0 0 2px",
            color: "#111111",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          {d(data.from.name)}
        </p>
        {data.from.title && (
          <p style={{ fontSize: 11, margin: "0 0 1px", color: "#666666", letterSpacing: "0.06em" }}>
            {data.from.title}
          </p>
        )}
        {data.from.company && (
          <p style={{ fontSize: 11, margin: "0 0 1px", color: "#888888", letterSpacing: "0.04em" }}>
            {data.from.company}
          </p>
        )}
        {data.from.address && (
          <p style={{ fontSize: 10, margin: "0 0 1px", color: "#888888" }}>{data.from.address}</p>
        )}
        {(data.from.email || data.from.phone) && (
          <p style={{ fontSize: 10, margin: 0, color: "#888888" }}>
            {[data.from.email, data.from.phone].filter(Boolean).join("  ·  ")}
          </p>
        )}
      </div>

      {/* Ornamental divider */}
      <div style={{ display: "flex", alignItems: "center", margin: "16px 0 24px" }}>
        <div style={{ flex: 1, height: 1, backgroundColor: primaryColor }} />
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            backgroundColor: primaryColor,
            margin: "0 8px",
          }}
        />
        <div style={{ flex: 1, height: 1, backgroundColor: primaryColor }} />
      </div>

      {/* Date centered */}
      <p style={{ fontSize: 12, color: "#666666", textAlign: "center", margin: "0 0 28px" }}>{d(data.date)}</p>

      {/* Recipient */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 2px", color: "#111111" }}>
          {d(data.to.name)}
        </p>
        {data.to.title && (
          <p style={{ fontSize: 11, margin: "0 0 1px", color: "#555555" }}>{data.to.title}</p>
        )}
        {data.to.company && (
          <p style={{ fontSize: 11, margin: "0 0 1px", color: "#777777" }}>{data.to.company}</p>
        )}
        {data.to.address && (
          <p style={{ fontSize: 11, margin: 0, color: "#777777", whiteSpace: "pre-line" }}>
            {data.to.address}
          </p>
        )}
      </div>

      {/* Salutation */}
      <p style={{ fontSize: 13, margin: "0 0 6px", color: "#1a1a1a" }}>
        Dear {d(data.to.name)},
      </p>

      {/* Subject */}
      <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 22px", color: primaryColor, textAlign: "center" }}>
        {d(data.subject)}
      </p>

      {/* Body paragraphs centered on page */}
      <div style={{ marginBottom: 36 }}>
        {paragraphs.map((para, i) => (
          <p
            key={i}
            style={{
              fontSize: 13,
              lineHeight: 1.9,
              color: "#222222",
              margin: i < paragraphs.length - 1 ? "0 0 16px" : 0,
              textAlign: "justify",
            }}
          >
            {para}
          </p>
        ))}
      </div>

      {/* Closing */}
      <div style={{ marginTop: 44, textAlign: "center" }}>
        <p style={{ fontSize: 13, margin: "0 0 48px", color: "#1a1a1a" }}>
          {data.closing || "Yours faithfully"},
        </p>
        <p
          style={{
            fontSize: 14,
            fontWeight: 700,
            margin: "0 0 2px",
            color: "#111111",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          {d(data.from.name)}
        </p>
        {data.from.title && (
          <p style={{ fontSize: 11, margin: 0, color: "#666666" }}>{data.from.title}</p>
        )}
      </div>
    </div>
  );
}

// ─── CorporateLetter ──────────────────────────────────────────────────────────

export function CorporateLetter({ data, primaryColor }: LetterProps) {
  const paragraphs = splitBody(data.body);

  return (
    <div
      style={{
        width: 794,
        minHeight: 1123,
        padding: "0",
        backgroundColor: "#ffffff",
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        color: "#1a1a1a",
        boxSizing: "border-box",
      }}
    >
      {/* Company letterhead feel */}
      <div
        style={{
          padding: "28px 60px",
          borderBottom: `3px solid ${primaryColor}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* Name + company left */}
        <div>
          <p style={{ fontSize: 16, fontWeight: 700, margin: "0 0 2px", color: "#111111", letterSpacing: "0.02em" }}>
            {d(data.from.name)}
          </p>
          {data.from.company && (
            <p style={{ fontSize: 11, margin: "0 0 1px", color: primaryColor, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {data.from.company}
            </p>
          )}
          {data.from.title && (
            <p style={{ fontSize: 11, margin: 0, color: "#777777" }}>{data.from.title}</p>
          )}
        </div>

        {/* Logo placeholder right — grey rect 60x40 */}
        <div
          style={{
            width: 60,
            height: 40,
            backgroundColor: "#e5e7eb",
            borderRadius: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: 9, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.04em" }}>LOGO</span>
        </div>
      </div>

      {/* Full-width rule */}
      <div style={{ height: 1, backgroundColor: "#e5e7eb" }} />

      {/* Content area */}
      <div style={{ padding: "36px 60px 60px" }}>
        {/* Date */}
        <p style={{ fontSize: 12, color: "#555555", margin: "0 0 20px" }}>{d(data.date)}</p>

        {/* Contact details sub-row */}
        {(data.from.address || data.from.email || data.from.phone) && (
          <p style={{ fontSize: 10, color: "#999999", margin: "0 0 24px" }}>
            {[data.from.address?.replace(/\n/g, ", "), data.from.email, data.from.phone].filter(Boolean).join("  ·  ")}
          </p>
        )}

        {/* Recipient */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 2px", color: "#111111" }}>
            {d(data.to.name)}
          </p>
          {data.to.title && (
            <p style={{ fontSize: 11, margin: "0 0 1px", color: "#555555" }}>{data.to.title}</p>
          )}
          {data.to.company && (
            <p style={{ fontSize: 11, margin: "0 0 1px", color: "#777777" }}>{data.to.company}</p>
          )}
          {data.to.address && (
            <p style={{ fontSize: 11, margin: 0, color: "#777777", whiteSpace: "pre-line" }}>
              {data.to.address}
            </p>
          )}
        </div>

        {/* Salutation */}
        <p style={{ fontSize: 13, margin: "0 0 6px", color: "#1a1a1a" }}>
          Dear {d(data.to.name)},
        </p>

        {/* Subject */}
        <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 20px", color: primaryColor }}>
          {d(data.subject)}
        </p>

        {/* Body */}
        <div style={{ marginBottom: 32 }}>
          {paragraphs.map((para, i) => (
            <p
              key={i}
              style={{
                fontSize: 13,
                lineHeight: 1.75,
                color: "#333333",
                margin: i < paragraphs.length - 1 ? "0 0 13px" : 0,
              }}
            >
              {para}
            </p>
          ))}
        </div>

        {/* Closing */}
        <div style={{ marginTop: 40 }}>
          <p style={{ fontSize: 12, margin: "0 0 44px", color: "#1a1a1a" }}>
            {data.closing || "Yours sincerely"},
          </p>
          <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 2px", color: "#111111" }}>
            {d(data.from.name)}
          </p>
          {data.from.title && (
            <p style={{ fontSize: 11, margin: "0 0 1px", color: "#555555" }}>{data.from.title}</p>
          )}
          {data.from.company && (
            <p style={{ fontSize: 11, margin: 0, color: primaryColor, fontWeight: 600 }}>
              {data.from.company}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── LegalLetter ──────────────────────────────────────────────────────────────

export function LegalLetter({ data, primaryColor }: LetterProps) {
  const paragraphs = splitBody(data.body);

  return (
    <div
      style={{
        width: 794,
        minHeight: 1123,
        padding: "56px 72px",
        backgroundColor: "#ffffff",
        fontFamily: "'Times New Roman', Georgia, serif",
        color: "#1a1a1a",
        boxSizing: "border-box",
        borderTop: `4px double ${primaryColor}`,
      }}
    >
      {/* Sender top-right */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 2px", color: "#111111" }}>
            {d(data.from.name)}
          </p>
          {data.from.title && (
            <p style={{ fontSize: 11, margin: "0 0 1px", color: "#444444" }}>{data.from.title}</p>
          )}
          {data.from.company && (
            <p style={{ fontSize: 11, margin: "0 0 1px", color: "#555555" }}>{data.from.company}</p>
          )}
          {data.from.address && (
            <p style={{ fontSize: 10, margin: "0 0 1px", color: "#666666", whiteSpace: "pre-line" }}>
              {data.from.address}
            </p>
          )}
          {data.from.email && (
            <p style={{ fontSize: 10, margin: "0 0 1px", color: "#666666" }}>{data.from.email}</p>
          )}
          {data.from.phone && (
            <p style={{ fontSize: 10, margin: 0, color: "#666666" }}>{data.from.phone}</p>
          )}
        </div>
        <p style={{ fontSize: 12, color: "#444444", margin: 0 }}>{d(data.date)}</p>
      </div>

      <div style={{ height: 1, backgroundColor: "#cccccc", marginBottom: 20 }} />

      {/* Recipient */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 2px", color: "#111111" }}>
          {d(data.to.name)}
        </p>
        {data.to.title && (
          <p style={{ fontSize: 11, margin: "0 0 1px", color: "#444444" }}>{data.to.title}</p>
        )}
        {data.to.company && (
          <p style={{ fontSize: 11, margin: "0 0 1px", color: "#666666" }}>{data.to.company}</p>
        )}
        {data.to.address && (
          <p style={{ fontSize: 11, margin: 0, color: "#666666", whiteSpace: "pre-line" }}>
            {data.to.address}
          </p>
        )}
      </div>

      {/* Re: subject line */}
      <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 16px", color: "#111111" }}>
        Re: {d(data.subject)}
      </p>

      {/* Formal salutation */}
      <p style={{ fontSize: 12, margin: "0 0 16px", color: "#1a1a1a" }}>
        Dear {d(data.to.name)},
      </p>

      {/* Dense body text, numbered paragraphs */}
      <div style={{ marginBottom: 28 }}>
        {paragraphs.map((para, i) => (
          <p
            key={i}
            style={{
              fontSize: 12,
              lineHeight: 1.7,
              color: "#222222",
              margin: i < paragraphs.length - 1 ? "0 0 10px" : 0,
              textAlign: "justify",
            }}
          >
            <span style={{ fontWeight: 700, marginRight: 4 }}>{i + 1}.</span>
            {para}
          </p>
        ))}
      </div>

      {/* Closing */}
      <div style={{ marginTop: 36 }}>
        <p style={{ fontSize: 12, margin: "0 0 44px", color: "#1a1a1a" }}>
          {data.closing || "Yours faithfully"},
        </p>
        <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 2px", color: "#111111" }}>
          {d(data.from.name)}
        </p>
        {data.from.title && (
          <p style={{ fontSize: 11, margin: "0 0 1px", color: "#444444" }}>{data.from.title}</p>
        )}
        {data.from.company && (
          <p style={{ fontSize: 11, margin: 0, color: "#666666" }}>{data.from.company}</p>
        )}
      </div>
    </div>
  );
}

// ─── NonprofitLetter ──────────────────────────────────────────────────────────

export function NonprofitLetter({ data, primaryColor }: LetterProps) {
  const paragraphs = splitBody(data.body);

  return (
    <div
      style={{
        width: 794,
        minHeight: 1123,
        padding: 0,
        backgroundColor: "#ffffff",
        fontFamily: "'Georgia', 'Times New Roman', serif",
        color: "#1a1a1a",
        boxSizing: "border-box",
        display: "flex",
      }}
    >
      {/* Accent left strip 6px */}
      <div style={{ width: 6, backgroundColor: primaryColor, flexShrink: 0 }} />

      {/* Main content */}
      <div style={{ flex: 1, padding: "56px 60px 56px 30px" }}>
        {/* Name + org */}
        <p style={{ fontSize: 16, fontWeight: 700, margin: "0 0 2px", color: "#111111" }}>
          {d(data.from.name)}
        </p>
        {data.from.title && (
          <p style={{ fontSize: 12, margin: "0 0 1px", color: "#555555" }}>{data.from.title}</p>
        )}
        {data.from.company && (
          <p style={{ fontSize: 12, margin: "0 0 1px", color: primaryColor, fontWeight: 600 }}>
            {data.from.company}
          </p>
        )}
        {data.from.address && (
          <p style={{ fontSize: 11, margin: "0 0 1px", color: "#777777", whiteSpace: "pre-line" }}>
            {data.from.address}
          </p>
        )}
        {(data.from.email || data.from.phone) && (
          <p style={{ fontSize: 11, margin: "0 0 28px", color: "#777777" }}>
            {[data.from.email, data.from.phone].filter(Boolean).join("  ·  ")}
          </p>
        )}
        {!data.from.email && !data.from.phone && <div style={{ marginBottom: 28 }} />}

        {/* Date */}
        <p style={{ fontSize: 12, color: "#777777", margin: "0 0 24px" }}>{d(data.date)}</p>

        {/* Recipient */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 2px", color: "#111111" }}>
            {d(data.to.name)}
          </p>
          {data.to.title && (
            <p style={{ fontSize: 11, margin: "0 0 1px", color: "#555555" }}>{data.to.title}</p>
          )}
          {data.to.company && (
            <p style={{ fontSize: 11, margin: "0 0 1px", color: "#777777" }}>{data.to.company}</p>
          )}
          {data.to.address && (
            <p style={{ fontSize: 11, margin: 0, color: "#777777", whiteSpace: "pre-line" }}>
              {data.to.address}
            </p>
          )}
        </div>

        {/* Salutation */}
        <p style={{ fontSize: 13, margin: "0 0 6px", color: "#1a1a1a" }}>
          Dear {d(data.to.name)},
        </p>

        {/* Subject */}
        <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 20px", color: primaryColor }}>
          {d(data.subject)}
        </p>

        {/* Mission-statement style body */}
        <div style={{ marginBottom: 32 }}>
          {paragraphs.map((para, i) => (
            <p
              key={i}
              style={{
                fontSize: 13,
                lineHeight: 1.85,
                color: "#333333",
                margin: i < paragraphs.length - 1 ? "0 0 14px" : 0,
              }}
            >
              {para}
            </p>
          ))}
        </div>

        {/* Closing */}
        <div style={{ marginTop: 40 }}>
          <p style={{ fontSize: 13, margin: "0 0 44px", color: "#1a1a1a" }}>
            {data.closing || "With warm regards"},
          </p>
          <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 2px", color: "#111111" }}>
            {d(data.from.name)}
          </p>
          {data.from.title && (
            <p style={{ fontSize: 11, margin: "0 0 1px", color: "#555555" }}>{data.from.title}</p>
          )}
          {data.from.company && (
            <p style={{ fontSize: 11, margin: 0, color: primaryColor, fontWeight: 600 }}>
              {data.from.company}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Registry ─────────────────────────────────────────────────────────────────

export const LETTER_COMPONENTS: Record<LetterTemplateId, React.ComponentType<LetterProps>> = {
  "formal": FormalLetter,
  "modern-letter": ModernLetter,
  "executive-letter": ExecutiveLetter,
  "clean-letter": CleanLetter,
  "minimal-letter": MinimalLetter,
  "classic-letter": ClassicLetter,
  "bold-letter": BoldLetter,
  "contemporary-letter": ContemporaryLetter,
  "professional-letter": ProfessionalLetter,
  "elegant-letter": ElegantLetter,
  "compact-letter": CompactLetter,
  "academic-letter": AcademicLetter,
  "official-letter": OfficialLetter,
  "diplomatic-letter": DiplomaticLetter,
  "corporate-letter": CorporateLetter,
  "legal-letter": LegalLetter,
  "nonprofit-letter": NonprofitLetter,
};
