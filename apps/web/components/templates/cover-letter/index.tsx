import React from "react";

// ─── Shared types ─────────────────────────────────────────────────────────────

export interface CoverLetterTemplateProps {
  senderName: string;
  senderTitle?: string;
  recipientName?: string;
  recipientTitle?: string;
  recipientCompany?: string;
  jobTitle?: string;
  companyName?: string;
  date: string;
  content: string; // body text, paragraphs separated by \n\n
  primaryColor: string;
  fontFamily: string;
}

export type CoverLetterTemplateId =
  | "zege-cl"
  | "rift-cl"
  | "zahabu-cl"
  | "vibe-cl"
  | "riso-cl"
  | "classic"
  | "modern"
  | "sidebar-cl"
  | "executive-cl"
  | "minimal-cl"
  | "bold-cl"
  | "creative-cl"
  | "startup-cl"
  | "academic-cl"
  | "tech-cl"
  | "clean-cl"
  | "contemporary-cl"
  | "traditional-cl"
  | "magazine-cl"
  | "compact-cl"
  | "color-block-cl"
  | "stripe-cl"
  | "elegant-cl"
  | "gradient-cl"
  | "signature-cl"
  | "timeline-cl"
  | "header-split-cl";

// ─── Utility ──────────────────────────────────────────────────────────────────

function splitContent(content: string): string[] {
  const paras = content.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  return paras.length > 0 ? paras : ["Your cover letter content will appear here."];
}

// ─── ClassicCoverLetter ───────────────────────────────────────────────────────

export function ClassicCoverLetter({
  senderName,
  senderTitle,
  recipientName,
  recipientTitle,
  recipientCompany,
  date,
  content,
  primaryColor,
  fontFamily,
}: CoverLetterTemplateProps) {
  const paragraphs = splitContent(content);
  const salutation = recipientName ? `Dear ${recipientName},` : "Dear Hiring Manager,";

  return (
    <div
      style={{
        width: 794,
        minHeight: 1123,
        backgroundColor: "#ffffff",
        fontFamily,
        boxSizing: "border-box",
        position: "relative",
        borderTop: `4px solid ${primaryColor}`,
        padding: "60px 70px",
      }}
    >
      {/* Sender block */}
      <div>
        <p style={{ fontSize: 18, fontWeight: 700, margin: "0 0 4px", color: "#111827" }}>
          {senderName}
        </p>
        {senderTitle && (
          <p style={{ fontSize: 13, margin: "0 0 16px", color: primaryColor }}>
            {senderTitle}
          </p>
        )}
        <p style={{ fontSize: 12, margin: 0, color: "#6b7280" }}>{date}</p>
      </div>

      {/* Recipient block */}
      <div style={{ marginTop: 28 }}>
        {recipientName && (
          <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 2px", color: "#111827" }}>
            {recipientName}
          </p>
        )}
        {recipientTitle && (
          <p style={{ fontSize: 12, margin: "0 0 2px", color: "#4b5563" }}>
            {recipientTitle}
          </p>
        )}
        {recipientCompany && (
          <p style={{ fontSize: 12, margin: 0, color: "#4b5563", fontStyle: "italic" }}>
            {recipientCompany}
          </p>
        )}
      </div>

      {/* Salutation */}
      <p style={{ fontSize: 13, margin: "24px 0 0", color: "#374151" }}>
        {salutation}
      </p>

      {/* Body paragraphs */}
      <div style={{ marginTop: 16 }}>
        {paragraphs.map((para, i) => (
          <p
            key={i}
            style={{
              fontSize: 13,
              lineHeight: 1.8,
              color: "#374151",
              margin: 0,
              marginBottom: 16,
            }}
          >
            {para}
          </p>
        ))}
      </div>

      {/* Closing block */}
      <div style={{ marginTop: 32 }}>
        <p style={{ fontSize: 13, margin: 0, color: "#374151" }}>Sincerely,</p>
        <div style={{ height: 48 }} />
        <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 4px", color: "#111827" }}>
          {senderName}
        </p>
        {senderTitle && (
          <p style={{ fontSize: 12, margin: 0, color: primaryColor }}>
            {senderTitle}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── ModernCoverLetter ────────────────────────────────────────────────────────

export function ModernCoverLetter({
  senderName,
  senderTitle,
  recipientName,
  recipientTitle,
  recipientCompany,
  date,
  content,
  primaryColor,
  fontFamily,
}: CoverLetterTemplateProps) {
  const paragraphs = splitContent(content);
  const salutation = recipientName ? `Dear ${recipientName},` : "Dear Hiring Manager,";

  return (
    <div
      style={{
        width: 794,
        minHeight: 1123,
        backgroundColor: "#ffffff",
        fontFamily,
        boxSizing: "border-box",
      }}
    >
      {/* Full-width colored header */}
      <div
        style={{
          height: 90,
          backgroundColor: primaryColor,
          display: "flex",
          alignItems: "center",
          padding: "0 70px",
        }}
      >
        {/* Left: sender info */}
        <div>
          <p style={{ fontSize: 22, fontWeight: 700, margin: "0 0 4px", color: "#ffffff" }}>
            {senderName}
          </p>
          {senderTitle && (
            <p style={{ fontSize: 13, margin: 0, color: "rgba(255,255,255,0.8)" }}>
              {senderTitle}
            </p>
          )}
        </div>

        {/* Right: date */}
        <p
          style={{
            fontSize: 12,
            margin: "0 0 0 auto",
            color: "rgba(255,255,255,0.8)",
          }}
        >
          {date}
        </p>
      </div>

      {/* White body */}
      <div style={{ padding: "48px 70px" }}>
        {/* Recipient block */}
        {(recipientName || recipientTitle || recipientCompany) && (
          <div style={{ marginBottom: 20 }}>
            <p
              style={{
                fontSize: 10,
                fontWeight: 700,
                margin: "0 0 6px",
                color: "#9ca3af",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              To:
            </p>
            {recipientName && (
              <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 2px", color: "#111827" }}>
                {recipientName}
              </p>
            )}
            {(recipientTitle || recipientCompany) && (
              <p style={{ fontSize: 12, margin: 0, color: "#6b7280" }}>
                {[recipientTitle, recipientCompany].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
        )}

        {/* Divider */}
        <div style={{ height: 1, backgroundColor: "#e5e7eb", margin: "20px 0" }} />

        {/* Salutation */}
        <p style={{ fontSize: 13, margin: "0 0 16px", color: "#374151" }}>
          {salutation}
        </p>

        {/* Body paragraphs */}
        <div>
          {paragraphs.map((para, i) => (
            <p
              key={i}
              style={{
                fontSize: 13,
                lineHeight: 1.8,
                color: "#374151",
                margin: 0,
                marginBottom: 16,
              }}
            >
              {para}
            </p>
          ))}
        </div>

        {/* Closing block */}
        <div style={{ marginTop: 28 }}>
          <p style={{ fontSize: 13, margin: 0, color: "#374151" }}>Sincerely,</p>
          <div style={{ height: 48 }} />
          <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 4px", color: "#111827" }}>
            {senderName}
          </p>
          {senderTitle && (
            <p style={{ fontSize: 12, margin: 0, color: primaryColor }}>
              {senderTitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── SidebarCoverLetter ───────────────────────────────────────────────────────

export function SidebarCoverLetter({
  senderName,
  senderTitle,
  recipientName,
  recipientTitle,
  recipientCompany,
  date,
  content,
  primaryColor,
  fontFamily,
}: CoverLetterTemplateProps) {
  const paragraphs = splitContent(content);
  const salutation = recipientName ? `Dear ${recipientName},` : "Dear Hiring Manager,";

  return (
    <div
      style={{
        width: 794,
        minHeight: 1123,
        backgroundColor: "#ffffff",
        fontFamily,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "row",
      }}
    >
      {/* Narrow sidebar */}
      <div
        style={{
          width: 80,
          minHeight: 1123,
          backgroundColor: primaryColor,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "40px 0",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            writingMode: "vertical-rl",
            transform: "rotate(180deg)",
            color: "#ffffff",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginTop: 16,
          }}
        >
          {senderName}
        </div>
        {senderTitle && (
          <div
            style={{
              writingMode: "vertical-rl",
              transform: "rotate(180deg)",
              color: "rgba(255,255,255,0.7)",
              fontSize: 10,
              marginTop: 12,
              letterSpacing: "0.08em",
            }}
          >
            {senderTitle}
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ flex: 1, padding: "60px 60px 60px 48px" }}>
        {/* Date */}
        <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 24px" }}>{date}</p>

        {/* Recipient */}
        {(recipientName || recipientTitle || recipientCompany) && (
          <div style={{ marginBottom: 24 }}>
            {recipientName && (
              <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 2px", color: "#111827" }}>
                {recipientName}
              </p>
            )}
            {recipientTitle && (
              <p style={{ fontSize: 12, margin: "0 0 2px", color: "#4b5563" }}>{recipientTitle}</p>
            )}
            {recipientCompany && (
              <p style={{ fontSize: 12, margin: 0, color: "#4b5563", fontStyle: "italic" }}>
                {recipientCompany}
              </p>
            )}
          </div>
        )}

        <p style={{ fontSize: 13, margin: "0 0 16px", color: "#374151" }}>{salutation}</p>

        <div>
          {paragraphs.map((para, i) => (
            <p
              key={i}
              style={{ fontSize: 13, lineHeight: 1.8, color: "#374151", margin: "0 0 16px" }}
            >
              {para}
            </p>
          ))}
        </div>

        <div style={{ marginTop: 32 }}>
          <p style={{ fontSize: 13, margin: 0, color: "#374151" }}>Sincerely,</p>
          <div style={{ height: 48 }} />
          <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 4px", color: "#111827" }}>
            {senderName}
          </p>
          {senderTitle && (
            <p style={{ fontSize: 12, margin: 0, color: primaryColor }}>{senderTitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ExecutiveCoverLetter ─────────────────────────────────────────────────────

export function ExecutiveCoverLetter({
  senderName,
  senderTitle,
  recipientName,
  recipientTitle,
  recipientCompany,
  date,
  content,
  primaryColor,
  fontFamily,
}: CoverLetterTemplateProps) {
  const paragraphs = splitContent(content);
  const salutation = recipientName ? `Dear ${recipientName},` : "Dear Hiring Manager,";

  return (
    <div
      style={{
        width: 794,
        minHeight: 1123,
        backgroundColor: "#ffffff",
        fontFamily,
        boxSizing: "border-box",
        padding: "72px 80px",
      }}
    >
      {/* Centered name header */}
      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <p style={{ fontSize: 26, fontWeight: 700, margin: 0, color: "#111827", letterSpacing: "0.04em" }}>
          {senderName}
        </p>
        {senderTitle && (
          <p style={{ fontSize: 13, margin: "6px 0 0", color: "#6b7280", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            {senderTitle}
          </p>
        )}
      </div>

      {/* Double rule underline */}
      <div style={{ textAlign: "center", margin: "16px 0 32px" }}>
        <div style={{ height: 2, backgroundColor: primaryColor, marginBottom: 3 }} />
        <div style={{ height: 1, backgroundColor: primaryColor, opacity: 0.4 }} />
      </div>

      {/* Date */}
      <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 28px" }}>{date}</p>

      {/* Recipient */}
      {(recipientName || recipientTitle || recipientCompany) && (
        <div style={{ marginBottom: 28 }}>
          {recipientName && (
            <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 2px", color: "#111827" }}>
              {recipientName}
            </p>
          )}
          {recipientTitle && (
            <p style={{ fontSize: 12, margin: "0 0 2px", color: "#4b5563" }}>{recipientTitle}</p>
          )}
          {recipientCompany && (
            <p style={{ fontSize: 12, margin: 0, color: "#4b5563", fontStyle: "italic" }}>
              {recipientCompany}
            </p>
          )}
        </div>
      )}

      <p style={{ fontSize: 13, margin: "0 0 20px", color: "#374151", lineHeight: 2 }}>{salutation}</p>

      <div>
        {paragraphs.map((para, i) => (
          <p
            key={i}
            style={{ fontSize: 13, lineHeight: 2, color: "#374151", margin: "0 0 20px" }}
          >
            {para}
          </p>
        ))}
      </div>

      <div style={{ marginTop: 36 }}>
        <p style={{ fontSize: 13, margin: 0, color: "#374151" }}>Respectfully yours,</p>
        <div style={{ height: 52 }} />
        <p style={{ fontSize: 15, fontWeight: 700, margin: "0 0 4px", color: "#111827", letterSpacing: "0.02em" }}>
          {senderName}
        </p>
        {senderTitle && (
          <p style={{ fontSize: 12, margin: 0, color: primaryColor }}>{senderTitle}</p>
        )}
      </div>
    </div>
  );
}

// ─── MinimalCoverLetter ───────────────────────────────────────────────────────

export function MinimalCoverLetter({
  senderName,
  senderTitle,
  recipientName,
  recipientTitle,
  recipientCompany,
  date,
  content,
  primaryColor,
  fontFamily,
}: CoverLetterTemplateProps) {
  const paragraphs = splitContent(content);
  const salutation = recipientName ? `Dear ${recipientName},` : "Dear Hiring Manager,";

  return (
    <div
      style={{
        width: 794,
        minHeight: 1123,
        backgroundColor: "#ffffff",
        fontFamily,
        boxSizing: "border-box",
        padding: "80px 90px",
      }}
    >
      {/* Large sender name top-left */}
      <p style={{ fontSize: 28, fontWeight: 700, margin: 0, color: "#111827" }}>{senderName}</p>
      {senderTitle && (
        <p style={{ fontSize: 13, margin: "4px 0 0", color: "#9ca3af" }}>{senderTitle}</p>
      )}

      {/* Thin rule */}
      <div style={{ height: 1, backgroundColor: "#e5e7eb", margin: "24px 0" }} />

      {/* Date */}
      <p style={{ fontSize: 12, color: "#9ca3af", margin: "0 0 20px" }}>{date}</p>

      {/* Recipient */}
      {(recipientName || recipientTitle || recipientCompany) && (
        <div style={{ marginBottom: 20 }}>
          {recipientName && (
            <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 2px", color: "#374151" }}>
              {recipientName}
            </p>
          )}
          {recipientTitle && (
            <p style={{ fontSize: 12, margin: "0 0 2px", color: "#6b7280" }}>{recipientTitle}</p>
          )}
          {recipientCompany && (
            <p style={{ fontSize: 12, margin: 0, color: "#6b7280" }}>{recipientCompany}</p>
          )}
        </div>
      )}

      <p style={{ fontSize: 13, margin: "0 0 16px", color: "#374151" }}>{salutation}</p>

      <div>
        {paragraphs.map((para, i) => (
          <p key={i} style={{ fontSize: 13, lineHeight: 1.85, color: "#374151", margin: "0 0 16px" }}>
            {para}
          </p>
        ))}
      </div>

      <div style={{ marginTop: 32 }}>
        <p style={{ fontSize: 13, margin: 0, color: "#374151" }}>Best regards,</p>
        <div style={{ height: 48 }} />
        <p style={{ fontSize: 14, fontWeight: 700, margin: 0, color: "#111827" }}>{senderName}</p>
      </div>
    </div>
  );
}

// ─── BoldCoverLetter ──────────────────────────────────────────────────────────

export function BoldCoverLetter({
  senderName,
  senderTitle,
  recipientName,
  recipientTitle,
  recipientCompany,
  date,
  content,
  primaryColor,
  fontFamily,
}: CoverLetterTemplateProps) {
  const paragraphs = splitContent(content);
  const salutation = recipientName ? `Dear ${recipientName},` : "Dear Hiring Manager,";

  return (
    <div
      style={{
        width: 794,
        minHeight: 1123,
        backgroundColor: "#ffffff",
        fontFamily,
        boxSizing: "border-box",
      }}
    >
      {/* Full-width accent header 120px */}
      <div
        style={{
          height: 120,
          backgroundColor: primaryColor,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 70px",
        }}
      >
        <p style={{ fontSize: 26, fontWeight: 800, margin: 0, color: "#ffffff", letterSpacing: "0.01em" }}>
          {senderName}
        </p>
        {senderTitle && (
          <p style={{ fontSize: 13, margin: "6px 0 0", color: "rgba(255,255,255,0.8)", fontWeight: 400 }}>
            {senderTitle}
          </p>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: "52px 70px" }}>
        <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 24px" }}>{date}</p>

        {(recipientName || recipientTitle || recipientCompany) && (
          <div style={{ marginBottom: 24 }}>
            {recipientName && (
              <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 2px", color: "#111827" }}>
                {recipientName}
              </p>
            )}
            {recipientTitle && (
              <p style={{ fontSize: 12, margin: "0 0 2px", color: "#4b5563" }}>{recipientTitle}</p>
            )}
            {recipientCompany && (
              <p style={{ fontSize: 12, margin: 0, color: "#4b5563", fontStyle: "italic" }}>
                {recipientCompany}
              </p>
            )}
          </div>
        )}

        <p style={{ fontSize: 13, margin: "0 0 16px", color: "#374151" }}>{salutation}</p>

        <div style={{ marginLeft: 0 }}>
          {paragraphs.map((para, i) => (
            <p key={i} style={{ fontSize: 13, lineHeight: 1.8, color: "#1f2937", margin: "0 0 16px" }}>
              {para}
            </p>
          ))}
        </div>

        <div style={{ marginTop: 32 }}>
          <p style={{ fontSize: 13, margin: 0, color: "#374151" }}>Sincerely,</p>
          <div style={{ height: 48 }} />
          <p style={{ fontSize: 15, fontWeight: 800, margin: "0 0 4px", color: "#111827" }}>
            {senderName}
          </p>
          {senderTitle && (
            <p style={{ fontSize: 12, margin: 0, color: primaryColor }}>{senderTitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── CreativeCoverLetter ──────────────────────────────────────────────────────

export function CreativeCoverLetter({
  senderName,
  senderTitle,
  recipientName,
  recipientTitle,
  recipientCompany,
  date,
  content,
  primaryColor,
  fontFamily,
}: CoverLetterTemplateProps) {
  const paragraphs = splitContent(content);
  const salutation = recipientName ? `Dear ${recipientName},` : "Dear Hiring Manager,";

  return (
    <div
      style={{
        width: 794,
        minHeight: 1123,
        backgroundColor: "#ffffff",
        fontFamily,
        boxSizing: "border-box",
        padding: "64px 72px",
      }}
    >
      {/* Name in large accent color */}
      <p style={{ fontSize: 30, fontWeight: 700, margin: 0, color: primaryColor }}>
        {senderName}
      </p>
      {senderTitle && (
        <p style={{ fontSize: 13, margin: "4px 0 0", color: "#6b7280" }}>{senderTitle}</p>
      )}

      {/* Diagonal rule accent — simulated with a skewed box */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "20px 0" }}>
        <div style={{ width: 40, height: 3, backgroundColor: primaryColor }} />
        <div style={{ width: 20, height: 3, backgroundColor: primaryColor, opacity: 0.4 }} />
        <div style={{ width: 8, height: 3, backgroundColor: primaryColor, opacity: 0.2 }} />
      </div>

      <p style={{ fontSize: 12, color: "#9ca3af", margin: "0 0 22px" }}>{date}</p>

      {(recipientName || recipientTitle || recipientCompany) && (
        <div style={{ marginBottom: 22 }}>
          {recipientName && (
            <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 2px", color: "#111827" }}>
              {recipientName}
            </p>
          )}
          {recipientTitle && (
            <p style={{ fontSize: 12, margin: "0 0 2px", color: "#4b5563" }}>{recipientTitle}</p>
          )}
          {recipientCompany && (
            <p style={{ fontSize: 12, margin: 0, color: "#4b5563" }}>{recipientCompany}</p>
          )}
        </div>
      )}

      <p style={{ fontSize: 13, margin: "0 0 16px", color: "#374151" }}>{salutation}</p>

      {/* Body with hanging indent */}
      <div>
        {paragraphs.map((para, i) => (
          <p
            key={i}
            style={{
              fontSize: 13,
              lineHeight: 1.8,
              color: "#374151",
              margin: "0 0 16px",
              paddingLeft: 20,
              textIndent: -20,
            }}
          >
            {para}
          </p>
        ))}
      </div>

      <div style={{ marginTop: 32 }}>
        <p style={{ fontSize: 13, margin: 0, color: "#374151" }}>With enthusiasm,</p>
        <div style={{ height: 48 }} />
        <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 4px", color: primaryColor }}>
          {senderName}
        </p>
        {senderTitle && (
          <p style={{ fontSize: 12, margin: 0, color: "#6b7280" }}>{senderTitle}</p>
        )}
      </div>
    </div>
  );
}

// ─── StartupCoverLetter ───────────────────────────────────────────────────────

export function StartupCoverLetter({
  senderName,
  senderTitle,
  recipientName,
  recipientTitle,
  recipientCompany,
  date,
  content,
  primaryColor,
  fontFamily,
}: CoverLetterTemplateProps) {
  const paragraphs = splitContent(content);
  const salutation = recipientName ? `Hey ${recipientName},` : "Hey there,";

  return (
    <div
      style={{
        width: 794,
        minHeight: 1123,
        backgroundColor: "#ffffff",
        fontFamily,
        boxSizing: "border-box",
        padding: "64px 72px",
      }}
    >
      {/* Tight header row */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 24,
          marginBottom: 40,
          borderBottom: `2px solid ${primaryColor}`,
          paddingBottom: 16,
        }}
      >
        <p style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#111827" }}>{senderName}</p>
        {senderTitle && (
          <p style={{ fontSize: 12, margin: 0, color: "#6b7280" }}>{senderTitle}</p>
        )}
        <p style={{ fontSize: 12, margin: "0 0 0 auto", color: "#9ca3af" }}>{date}</p>
      </div>

      {(recipientName || recipientTitle || recipientCompany) && (
        <div style={{ marginBottom: 24 }}>
          {recipientName && (
            <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 2px", color: "#111827" }}>
              {recipientName}
            </p>
          )}
          {(recipientTitle || recipientCompany) && (
            <p style={{ fontSize: 12, margin: 0, color: "#6b7280" }}>
              {[recipientTitle, recipientCompany].filter(Boolean).join(", ")}
            </p>
          )}
        </div>
      )}

      <p style={{ fontSize: 14, fontWeight: 600, margin: "0 0 20px", color: "#111827" }}>{salutation}</p>

      <div>
        {paragraphs.map((para, i) => (
          <p key={i} style={{ fontSize: 13, lineHeight: 1.75, color: "#374151", margin: "0 0 16px" }}>
            {para}
          </p>
        ))}
      </div>

      <div style={{ marginTop: 32 }}>
        <p style={{ fontSize: 13, margin: 0, color: "#374151" }}>Cheers,</p>
        <div style={{ height: 40 }} />
        <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 2px", color: "#111827" }}>
          {senderName}
        </p>
        {senderTitle && (
          <p style={{ fontSize: 12, margin: 0, color: primaryColor }}>{senderTitle}</p>
        )}
      </div>
    </div>
  );
}

// ─── AcademicCoverLetter ──────────────────────────────────────────────────────

export function AcademicCoverLetter({
  senderName,
  senderTitle,
  recipientName,
  recipientTitle,
  recipientCompany,
  date,
  content,
  primaryColor,
  fontFamily,
}: CoverLetterTemplateProps) {
  const paragraphs = splitContent(content);
  const salutation = recipientName
    ? `Dear ${recipientTitle ? `${recipientTitle} ` : ""}${recipientName},`
    : "Dear Members of the Search Committee,";

  return (
    <div
      style={{
        width: 794,
        minHeight: 1123,
        backgroundColor: "#ffffff",
        fontFamily,
        boxSizing: "border-box",
        padding: "64px 80px",
      }}
    >
      {/* Centered institution-style header block */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <p style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "#111827" }}>{senderName}</p>
        {senderTitle && (
          <p style={{ fontSize: 12, margin: "6px 0 0", color: primaryColor, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            {senderTitle}
          </p>
        )}
        <div style={{ width: 60, height: 2, backgroundColor: primaryColor, margin: "16px auto 0" }} />
      </div>

      <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 24px" }}>{date}</p>

      {(recipientName || recipientTitle || recipientCompany) && (
        <div style={{ marginBottom: 24 }}>
          {recipientName && (
            <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 2px", color: "#111827" }}>
              {recipientTitle ? `${recipientTitle} ${recipientName}` : recipientName}
            </p>
          )}
          {recipientCompany && (
            <p style={{ fontSize: 12, margin: 0, color: "#4b5563" }}>{recipientCompany}</p>
          )}
        </div>
      )}

      <p style={{ fontSize: 13, margin: "0 0 20px", color: "#374151" }}>{salutation}</p>

      <div>
        {paragraphs.map((para, i) => (
          <p
            key={i}
            style={{ fontSize: 13, lineHeight: 1.9, color: "#374151", margin: "0 0 18px" }}
          >
            {para}
          </p>
        ))}
      </div>

      <div style={{ marginTop: 36 }}>
        <p style={{ fontSize: 13, margin: 0, color: "#374151" }}>Respectfully submitted,</p>
        <div style={{ height: 52 }} />
        <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 4px", color: "#111827" }}>
          {senderName}
        </p>
        {senderTitle && (
          <p style={{ fontSize: 12, margin: 0, color: "#6b7280" }}>{senderTitle}</p>
        )}
      </div>
    </div>
  );
}

// ─── TechCoverLetter ──────────────────────────────────────────────────────────

export function TechCoverLetter({
  senderName,
  senderTitle,
  recipientName,
  recipientTitle,
  recipientCompany,
  date,
  content,
  primaryColor,
  fontFamily,
}: CoverLetterTemplateProps) {
  const paragraphs = splitContent(content);
  const salutation = recipientName ? `Dear ${recipientName},` : "Dear Hiring Manager,";
  const monoFont = `"Courier New", Courier, monospace`;

  return (
    <div
      style={{
        width: 794,
        minHeight: 1123,
        backgroundColor: "#fafafa",
        fontFamily: monoFont,
        boxSizing: "border-box",
        padding: "56px 72px",
      }}
    >
      {/* Right-aligned sender block */}
      <div style={{ textAlign: "right", marginBottom: 32 }}>
        <p style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#111827" }}>{senderName}</p>
        {senderTitle && (
          <p style={{ fontSize: 11, margin: "4px 0 0", color: primaryColor }}>{senderTitle}</p>
        )}
        <p style={{ fontSize: 11, margin: "8px 0 0", color: "#9ca3af" }}>{date}</p>
      </div>

      {/* Thin horizontal rule */}
      <div style={{ height: 1, backgroundColor: primaryColor, opacity: 0.3, marginBottom: 28 }} />

      {(recipientName || recipientTitle || recipientCompany) && (
        <div style={{ marginBottom: 24 }}>
          {recipientName && (
            <p style={{ fontSize: 12, fontWeight: 700, margin: "0 0 2px", color: "#111827" }}>
              {recipientName}
            </p>
          )}
          {recipientTitle && (
            <p style={{ fontSize: 11, margin: "0 0 2px", color: "#4b5563" }}>{recipientTitle}</p>
          )}
          {recipientCompany && (
            <p style={{ fontSize: 11, margin: 0, color: "#4b5563" }}>{recipientCompany}</p>
          )}
        </div>
      )}

      <p style={{ fontSize: 12, margin: "0 0 14px", color: "#374151" }}>{salutation}</p>

      <div>
        {paragraphs.map((para, i) => (
          <p key={i} style={{ fontSize: 12, lineHeight: 1.6, color: "#374151", margin: "0 0 14px" }}>
            {para}
          </p>
        ))}
      </div>

      <div style={{ marginTop: 28 }}>
        <p style={{ fontSize: 12, margin: 0, color: "#374151" }}>Best,</p>
        <div style={{ height: 40 }} />
        <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 2px", color: "#111827" }}>
          {senderName}
        </p>
        {senderTitle && (
          <p style={{ fontSize: 11, margin: 0, color: primaryColor }}>{senderTitle}</p>
        )}
      </div>
    </div>
  );
}

// ─── CleanCoverLetter ─────────────────────────────────────────────────────────

export function CleanCoverLetter({
  senderName,
  senderTitle,
  recipientName,
  recipientTitle,
  recipientCompany,
  date,
  content,
  primaryColor,
  fontFamily,
}: CoverLetterTemplateProps) {
  const paragraphs = splitContent(content);
  const salutation = recipientName ? `Dear ${recipientName},` : "Dear Hiring Manager,";

  return (
    <div
      style={{
        width: 794,
        minHeight: 1123,
        backgroundColor: "#ffffff",
        fontFamily,
        boxSizing: "border-box",
        borderTop: `3px solid ${primaryColor}`,
        padding: "56px 72px",
      }}
    >
      <p style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px", color: "#111827" }}>{senderName}</p>
      {senderTitle && (
        <p style={{ fontSize: 12, margin: "0 0 20px", color: primaryColor }}>{senderTitle}</p>
      )}
      <p style={{ fontSize: 12, color: "#9ca3af", margin: "0 0 24px" }}>{date}</p>

      {(recipientName || recipientTitle || recipientCompany) && (
        <div style={{ marginBottom: 24 }}>
          {recipientName && (
            <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 2px", color: "#111827" }}>
              {recipientName}
            </p>
          )}
          {recipientTitle && (
            <p style={{ fontSize: 12, margin: "0 0 2px", color: "#6b7280" }}>{recipientTitle}</p>
          )}
          {recipientCompany && (
            <p style={{ fontSize: 12, margin: 0, color: "#6b7280" }}>{recipientCompany}</p>
          )}
        </div>
      )}

      <p style={{ fontSize: 13, margin: "0 0 16px", color: "#374151" }}>{salutation}</p>

      <div>
        {paragraphs.map((para, i) => (
          <p key={i} style={{ fontSize: 13, lineHeight: 1.9, color: "#374151", margin: "0 0 16px" }}>
            {para}
          </p>
        ))}
      </div>

      <div style={{ marginTop: 32 }}>
        <p style={{ fontSize: 13, margin: 0, color: "#374151" }}>Kind regards,</p>
        <div style={{ height: 48 }} />
        <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 4px", color: "#111827" }}>{senderName}</p>
        {senderTitle && (
          <p style={{ fontSize: 12, margin: 0, color: primaryColor }}>{senderTitle}</p>
        )}
      </div>
    </div>
  );
}

// ─── ContemporaryCoverLetter ──────────────────────────────────────────────────

export function ContemporaryCoverLetter({
  senderName,
  senderTitle,
  recipientName,
  recipientTitle,
  recipientCompany,
  date,
  content,
  primaryColor,
  fontFamily,
}: CoverLetterTemplateProps) {
  const paragraphs = splitContent(content);
  const salutation = recipientName ? `Dear ${recipientName},` : "Dear Hiring Manager,";

  return (
    <div
      style={{
        width: 794,
        minHeight: 1123,
        backgroundColor: "#ffffff",
        fontFamily,
        boxSizing: "border-box",
        padding: "56px 72px",
      }}
    >
      {/* Two-column header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <p style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "#111827" }}>{senderName}</p>
          {senderTitle && (
            <p style={{ fontSize: 12, margin: "4px 0 0", color: primaryColor }}>{senderTitle}</p>
          )}
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 12, margin: 0, color: "#6b7280" }}>{date}</p>
          {recipientCompany && (
            <p style={{ fontSize: 12, margin: "4px 0 0", color: "#6b7280" }}>{recipientCompany}</p>
          )}
        </div>
      </div>

      {/* Single rule */}
      <div style={{ height: 1, backgroundColor: primaryColor, marginBottom: 28 }} />

      {(recipientName || recipientTitle) && (
        <div style={{ marginBottom: 22 }}>
          {recipientName && (
            <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 2px", color: "#111827" }}>
              {recipientName}
            </p>
          )}
          {recipientTitle && (
            <p style={{ fontSize: 12, margin: 0, color: "#6b7280" }}>{recipientTitle}</p>
          )}
        </div>
      )}

      <p style={{ fontSize: 13, margin: "0 0 16px", color: "#374151" }}>{salutation}</p>

      <div>
        {paragraphs.map((para, i) => (
          <p key={i} style={{ fontSize: 13, lineHeight: 1.8, color: "#374151", margin: "0 0 16px" }}>
            {para}
          </p>
        ))}
      </div>

      <div style={{ marginTop: 32 }}>
        <p style={{ fontSize: 13, margin: 0, color: "#374151" }}>Sincerely,</p>
        <div style={{ height: 48 }} />
        <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 4px", color: "#111827" }}>{senderName}</p>
        {senderTitle && (
          <p style={{ fontSize: 12, margin: 0, color: primaryColor }}>{senderTitle}</p>
        )}
      </div>
    </div>
  );
}

// ─── TraditionalCoverLetter ───────────────────────────────────────────────────

export function TraditionalCoverLetter({
  senderName,
  senderTitle,
  recipientName,
  recipientTitle,
  recipientCompany,
  date,
  content,
  primaryColor,
  fontFamily,
}: CoverLetterTemplateProps) {
  const paragraphs = splitContent(content);
  const salutation = recipientName ? `Dear ${recipientName}:` : "Dear Hiring Manager:";

  return (
    <div
      style={{
        width: 794,
        minHeight: 1123,
        backgroundColor: "#ffffff",
        fontFamily,
        boxSizing: "border-box",
        padding: "72px 80px",
      }}
    >
      {/* Sender address — full block letter format */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 13, fontWeight: 700, margin: 0, color: "#111827" }}>{senderName}</p>
        {senderTitle && (
          <p style={{ fontSize: 12, margin: "2px 0 0", color: "#4b5563" }}>{senderTitle}</p>
        )}
      </div>

      <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 24px" }}>{date}</p>

      {/* Recipient address */}
      {(recipientName || recipientTitle || recipientCompany) && (
        <div style={{ marginBottom: 24 }}>
          {recipientName && (
            <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 2px", color: "#111827" }}>
              {recipientName}
            </p>
          )}
          {recipientTitle && (
            <p style={{ fontSize: 12, margin: "0 0 2px", color: "#4b5563" }}>{recipientTitle}</p>
          )}
          {recipientCompany && (
            <p style={{ fontSize: 12, margin: 0, color: "#4b5563" }}>{recipientCompany}</p>
          )}
        </div>
      )}

      <p style={{ fontSize: 13, margin: "0 0 20px", color: "#374151" }}>{salutation}</p>

      {/* Body with indented paragraphs */}
      <div>
        {paragraphs.map((para, i) => (
          <p
            key={i}
            style={{
              fontSize: 13,
              lineHeight: 1.85,
              color: "#374151",
              margin: "0 0 16px",
              textIndent: 32,
            }}
          >
            {para}
          </p>
        ))}
      </div>

      <div style={{ marginTop: 32 }}>
        <p style={{ fontSize: 13, margin: 0, color: "#374151" }}>Sincerely,</p>
        <div style={{ height: 56 }} />
        <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 2px", color: "#111827" }}>{senderName}</p>
        {senderTitle && (
          <p style={{ fontSize: 12, margin: 0, color: primaryColor }}>{senderTitle}</p>
        )}
      </div>
    </div>
  );
}

// ─── MagazineCoverLetter ──────────────────────────────────────────────────────

export function MagazineCoverLetter({
  senderName,
  senderTitle,
  recipientName,
  recipientTitle,
  recipientCompany,
  date,
  content,
  primaryColor,
  fontFamily,
}: CoverLetterTemplateProps) {
  const paragraphs = splitContent(content);
  const salutation = recipientName ? `Dear ${recipientName},` : "Dear Hiring Manager,";

  return (
    <div
      style={{
        width: 794,
        minHeight: 1123,
        backgroundColor: "#ffffff",
        fontFamily,
        boxSizing: "border-box",
        padding: "64px 72px",
      }}
    >
      {/* Oversized name in accent color */}
      <p style={{ fontSize: 32, fontWeight: 800, margin: 0, color: primaryColor, lineHeight: 1.1 }}>
        {senderName}
      </p>
      {senderTitle && (
        <p style={{ fontSize: 12, margin: "8px 0 0", color: "#9ca3af", letterSpacing: "0.08em" }}>
          {senderTitle}
        </p>
      )}

      {/* Thin rule */}
      <div style={{ height: 1, backgroundColor: "#e5e7eb", margin: "20px 0" }} />

      <p style={{ fontSize: 12, color: "#9ca3af", margin: "0 0 24px" }}>{date}</p>

      {(recipientName || recipientTitle || recipientCompany) && (
        <div style={{ marginBottom: 22 }}>
          {recipientName && (
            <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 2px", color: "#374151" }}>
              {recipientName}
            </p>
          )}
          {(recipientTitle || recipientCompany) && (
            <p style={{ fontSize: 12, margin: 0, color: "#9ca3af" }}>
              {[recipientTitle, recipientCompany].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
      )}

      <p style={{ fontSize: 13, margin: "0 0 16px", color: "#374151" }}>{salutation}</p>

      <div>
        {paragraphs.map((para, i) => (
          <p key={i} style={{ fontSize: 13, lineHeight: 1.8, color: "#374151", margin: "0 0 16px" }}>
            {para}
          </p>
        ))}
      </div>

      <div style={{ marginTop: 32 }}>
        <p style={{ fontSize: 13, margin: 0, color: "#374151" }}>Best regards,</p>
        <div style={{ height: 48 }} />
        <p style={{ fontSize: 15, fontWeight: 800, margin: "0 0 4px", color: primaryColor }}>
          {senderName}
        </p>
        {senderTitle && (
          <p style={{ fontSize: 12, margin: 0, color: "#9ca3af" }}>{senderTitle}</p>
        )}
      </div>
    </div>
  );
}

// ─── CompactCoverLetter ───────────────────────────────────────────────────────

export function CompactCoverLetter({
  senderName,
  senderTitle,
  recipientName,
  recipientTitle,
  recipientCompany,
  date,
  content,
  primaryColor,
  fontFamily,
}: CoverLetterTemplateProps) {
  const paragraphs = splitContent(content);
  const salutation = recipientName ? `Dear ${recipientName},` : "Dear Hiring Manager,";

  return (
    <div
      style={{
        width: 794,
        minHeight: 1123,
        backgroundColor: "#ffffff",
        fontFamily,
        boxSizing: "border-box",
        padding: "50px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div>
          <p style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#111827" }}>{senderName}</p>
          {senderTitle && (
            <p style={{ fontSize: 11, margin: "2px 0 0", color: primaryColor }}>{senderTitle}</p>
          )}
        </div>
        <p style={{ fontSize: 11, margin: 0, color: "#9ca3af" }}>{date}</p>
      </div>

      <div style={{ height: 1, backgroundColor: "#e5e7eb", marginBottom: 14 }} />

      {(recipientName || recipientTitle || recipientCompany) && (
        <div style={{ marginBottom: 14 }}>
          {recipientName && (
            <p style={{ fontSize: 12, fontWeight: 600, margin: "0 0 2px", color: "#111827" }}>
              {recipientName}
            </p>
          )}
          {(recipientTitle || recipientCompany) && (
            <p style={{ fontSize: 11, margin: 0, color: "#6b7280" }}>
              {[recipientTitle, recipientCompany].filter(Boolean).join(", ")}
            </p>
          )}
        </div>
      )}

      <p style={{ fontSize: 12, margin: "0 0 12px", color: "#374151" }}>{salutation}</p>

      <div>
        {paragraphs.map((para, i) => (
          <p key={i} style={{ fontSize: 12, lineHeight: 1.6, color: "#374151", margin: "0 0 12px" }}>
            {para}
          </p>
        ))}
      </div>

      <div style={{ marginTop: 20 }}>
        <p style={{ fontSize: 12, margin: 0, color: "#374151" }}>Sincerely,</p>
        <div style={{ height: 36 }} />
        <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 2px", color: "#111827" }}>{senderName}</p>
        {senderTitle && (
          <p style={{ fontSize: 11, margin: 0, color: primaryColor }}>{senderTitle}</p>
        )}
      </div>
    </div>
  );
}

// ─── ColorBlockCoverLetter ────────────────────────────────────────────────────

export function ColorBlockCoverLetter({
  senderName,
  senderTitle,
  recipientName,
  recipientTitle,
  recipientCompany,
  date,
  content,
  primaryColor,
  fontFamily,
}: CoverLetterTemplateProps) {
  const paragraphs = splitContent(content);
  const salutation = recipientName ? `Dear ${recipientName},` : "Dear Hiring Manager,";

  return (
    <div
      style={{
        width: 794,
        minHeight: 1123,
        backgroundColor: "#ffffff",
        fontFamily,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "row",
      }}
    >
      {/* Left accent strip */}
      <div
        style={{
          width: 18,
          minHeight: 1123,
          backgroundColor: primaryColor,
          flexShrink: 0,
        }}
      />

      {/* Content */}
      <div style={{ flex: 1, padding: "60px 60px 60px 48px" }}>
        <p style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "#111827" }}>{senderName}</p>
        {senderTitle && (
          <p style={{ fontSize: 12, margin: "4px 0 0", color: primaryColor }}>{senderTitle}</p>
        )}
        <p style={{ fontSize: 12, color: "#9ca3af", margin: "8px 0 24px" }}>{date}</p>

        {(recipientName || recipientTitle || recipientCompany) && (
          <div style={{ marginBottom: 22 }}>
            {recipientName && (
              <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 2px", color: "#111827" }}>
                {recipientName}
              </p>
            )}
            {recipientTitle && (
              <p style={{ fontSize: 12, margin: "0 0 2px", color: "#4b5563" }}>{recipientTitle}</p>
            )}
            {recipientCompany && (
              <p style={{ fontSize: 12, margin: 0, color: "#4b5563" }}>{recipientCompany}</p>
            )}
          </div>
        )}

        <p style={{ fontSize: 13, margin: "0 0 16px", color: "#374151" }}>{salutation}</p>

        <div>
          {paragraphs.map((para, i) => (
            <p key={i} style={{ fontSize: 13, lineHeight: 1.8, color: "#374151", margin: "0 0 16px" }}>
              {para}
            </p>
          ))}
        </div>

        <div style={{ marginTop: 32 }}>
          <p style={{ fontSize: 13, margin: 0, color: "#374151" }}>Sincerely,</p>
          <div style={{ height: 48 }} />
          <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 4px", color: "#111827" }}>{senderName}</p>
          {senderTitle && (
            <p style={{ fontSize: 12, margin: 0, color: primaryColor }}>{senderTitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── StripeCoverLetter ────────────────────────────────────────────────────────

export function StripeCoverLetter({
  senderName,
  senderTitle,
  recipientName,
  recipientTitle,
  recipientCompany,
  date,
  content,
  primaryColor,
  fontFamily,
}: CoverLetterTemplateProps) {
  const paragraphs = splitContent(content);
  const salutation = recipientName ? `Dear ${recipientName},` : "Dear Hiring Manager,";

  return (
    <div
      style={{
        width: 794,
        minHeight: 1123,
        backgroundColor: "#ffffff",
        fontFamily,
        boxSizing: "border-box",
      }}
    >
      {/* Three stacked accent stripes */}
      <div style={{ height: 4, backgroundColor: primaryColor }} />
      <div style={{ height: 4, backgroundColor: primaryColor, opacity: 0.5, marginTop: 3 }} />
      <div style={{ height: 4, backgroundColor: primaryColor, opacity: 0.2, marginTop: 3 }} />

      <div style={{ padding: "48px 72px" }}>
        {/* Sender info */}
        <p style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#111827" }}>{senderName}</p>
        {senderTitle && (
          <p style={{ fontSize: 12, margin: "4px 0 0", color: primaryColor }}>{senderTitle}</p>
        )}
        <p style={{ fontSize: 12, color: "#9ca3af", margin: "8px 0 28px" }}>{date}</p>

        {(recipientName || recipientTitle || recipientCompany) && (
          <div style={{ marginBottom: 24 }}>
            {recipientName && (
              <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 2px", color: "#111827" }}>
                {recipientName}
              </p>
            )}
            {recipientTitle && (
              <p style={{ fontSize: 12, margin: "0 0 2px", color: "#4b5563" }}>{recipientTitle}</p>
            )}
            {recipientCompany && (
              <p style={{ fontSize: 12, margin: 0, color: "#4b5563" }}>{recipientCompany}</p>
            )}
          </div>
        )}

        <p style={{ fontSize: 13, margin: "0 0 16px", color: "#374151" }}>{salutation}</p>

        <div>
          {paragraphs.map((para, i) => (
            <p key={i} style={{ fontSize: 13, lineHeight: 1.8, color: "#374151", margin: "0 0 16px" }}>
              {para}
            </p>
          ))}
        </div>

        <div style={{ marginTop: 32 }}>
          <p style={{ fontSize: 13, margin: 0, color: "#374151" }}>Sincerely,</p>
          <div style={{ height: 48 }} />
          <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 4px", color: "#111827" }}>{senderName}</p>
          {senderTitle && (
            <p style={{ fontSize: 12, margin: 0, color: primaryColor }}>{senderTitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ElegantCoverLetter ───────────────────────────────────────────────────────

export function ElegantCoverLetter({
  senderName,
  senderTitle,
  recipientName,
  recipientTitle,
  recipientCompany,
  date,
  content,
  primaryColor,
  fontFamily,
}: CoverLetterTemplateProps) {
  const paragraphs = splitContent(content);
  const salutation = recipientName ? `Dear ${recipientName},` : "Dear Hiring Manager,";

  return (
    <div
      style={{
        width: 794,
        minHeight: 1123,
        backgroundColor: "#ffffff",
        fontFamily,
        boxSizing: "border-box",
        padding: "68px 80px",
      }}
    >
      {/* Italic sender name */}
      <p
        style={{
          fontSize: 24,
          fontStyle: "italic",
          fontWeight: 700,
          margin: 0,
          color: "#111827",
        }}
      >
        {senderName}
      </p>
      {senderTitle && (
        <p
          style={{
            fontSize: 11,
            margin: "6px 0 0",
            color: "#6b7280",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            fontVariant: "small-caps",
          }}
        >
          {senderTitle}
        </p>
      )}

      {/* 2px bottom border in accent */}
      <div style={{ height: 2, backgroundColor: primaryColor, margin: "18px 0 28px" }} />

      <p style={{ fontSize: 12, color: "#9ca3af", margin: "0 0 22px" }}>{date}</p>

      {(recipientName || recipientTitle || recipientCompany) && (
        <div style={{ marginBottom: 22 }}>
          {recipientName && (
            <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 2px", color: "#374151" }}>
              {recipientName}
            </p>
          )}
          {recipientTitle && (
            <p style={{ fontSize: 12, margin: "0 0 2px", color: "#6b7280" }}>{recipientTitle}</p>
          )}
          {recipientCompany && (
            <p style={{ fontSize: 12, fontStyle: "italic", margin: 0, color: "#6b7280" }}>
              {recipientCompany}
            </p>
          )}
        </div>
      )}

      <p style={{ fontSize: 13, margin: "0 0 18px", color: "#374151" }}>{salutation}</p>

      <div>
        {paragraphs.map((para, i) => (
          <p key={i} style={{ fontSize: 13, lineHeight: 1.9, color: "#374151", margin: "0 0 18px" }}>
            {para}
          </p>
        ))}
      </div>

      <div style={{ marginTop: 36 }}>
        <p style={{ fontSize: 13, fontStyle: "italic", margin: 0, color: "#374151" }}>With regards,</p>
        <div style={{ height: 52 }} />
        <p style={{ fontSize: 15, fontStyle: "italic", fontWeight: 700, margin: "0 0 4px", color: "#111827" }}>
          {senderName}
        </p>
        {senderTitle && (
          <p style={{ fontSize: 11, margin: 0, color: primaryColor, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            {senderTitle}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── GradientCoverLetter ──────────────────────────────────────────────────────

export function GradientCoverLetter({
  senderName,
  senderTitle,
  recipientName,
  recipientTitle,
  recipientCompany,
  date,
  content,
  primaryColor,
  fontFamily,
}: CoverLetterTemplateProps) {
  const paragraphs = splitContent(content);
  const salutation = recipientName ? `Dear ${recipientName},` : "Dear Hiring Manager,";

  return (
    <div
      style={{
        width: 794,
        minHeight: 1123,
        backgroundColor: "#ffffff",
        fontFamily,
        boxSizing: "border-box",
      }}
    >
      {/* Header with solid accent bg + overlay for depth effect */}
      <div
        style={{
          backgroundColor: primaryColor,
          padding: "52px 72px 40px",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.18)",
          }}
        />
        <div style={{ position: "relative", zIndex: 1 }}>
          <p style={{ fontSize: 24, fontWeight: 700, margin: 0, color: "#ffffff" }}>{senderName}</p>
          {senderTitle && (
            <p style={{ fontSize: 13, margin: "6px 0 0", color: "rgba(255,255,255,0.8)" }}>
              {senderTitle}
            </p>
          )}
          <p style={{ fontSize: 12, margin: "12px 0 0", color: "rgba(255,255,255,0.7)" }}>{date}</p>
        </div>
      </div>

      <div style={{ padding: "44px 72px" }}>
        {(recipientName || recipientTitle || recipientCompany) && (
          <div style={{ marginBottom: 22 }}>
            {recipientName && (
              <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 2px", color: "#111827" }}>
                {recipientName}
              </p>
            )}
            {recipientTitle && (
              <p style={{ fontSize: 12, margin: "0 0 2px", color: "#4b5563" }}>{recipientTitle}</p>
            )}
            {recipientCompany && (
              <p style={{ fontSize: 12, margin: 0, color: "#4b5563" }}>{recipientCompany}</p>
            )}
          </div>
        )}

        <p style={{ fontSize: 13, margin: "0 0 16px", color: "#374151" }}>{salutation}</p>

        <div>
          {paragraphs.map((para, i) => (
            <p key={i} style={{ fontSize: 13, lineHeight: 1.8, color: "#374151", margin: "0 0 16px" }}>
              {para}
            </p>
          ))}
        </div>

        <div style={{ marginTop: 32 }}>
          <p style={{ fontSize: 13, margin: 0, color: "#374151" }}>Sincerely,</p>
          <div style={{ height: 48 }} />
          <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 4px", color: "#111827" }}>{senderName}</p>
          {senderTitle && (
            <p style={{ fontSize: 12, margin: 0, color: primaryColor }}>{senderTitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── SignatureCoverLetter ─────────────────────────────────────────────────────

export function SignatureCoverLetter({
  senderName,
  senderTitle,
  recipientName,
  recipientTitle,
  recipientCompany,
  date,
  content,
  primaryColor,
  fontFamily,
}: CoverLetterTemplateProps) {
  const paragraphs = splitContent(content);
  const salutation = recipientName ? `Dear ${recipientName},` : "Dear Hiring Manager,";

  return (
    <div
      style={{
        width: 794,
        minHeight: 1123,
        backgroundColor: "#ffffff",
        fontFamily,
        boxSizing: "border-box",
        padding: "64px 80px",
      }}
    >
      {/* Signature-style italic name */}
      <p
        style={{
          fontSize: 28,
          fontStyle: "italic",
          fontWeight: 700,
          margin: 0,
          color: "#111827",
          lineHeight: 1.2,
        }}
      >
        {senderName}
      </p>
      {senderTitle && (
        <p style={{ fontSize: 12, margin: "4px 0 0", color: "#6b7280" }}>{senderTitle}</p>
      )}

      {/* Accent dash underline */}
      <div style={{ display: "flex", alignItems: "center", gap: 0, margin: "14px 0 28px" }}>
        <div style={{ width: 60, height: 2, backgroundColor: primaryColor }} />
        <div style={{ flex: 1, height: 1, backgroundColor: "#e5e7eb" }} />
      </div>

      <p style={{ fontSize: 12, color: "#9ca3af", margin: "0 0 22px" }}>{date}</p>

      {(recipientName || recipientTitle || recipientCompany) && (
        <div style={{ marginBottom: 22 }}>
          {recipientName && (
            <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 2px", color: "#111827" }}>
              {recipientName}
            </p>
          )}
          {recipientTitle && (
            <p style={{ fontSize: 12, margin: "0 0 2px", color: "#6b7280" }}>{recipientTitle}</p>
          )}
          {recipientCompany && (
            <p style={{ fontSize: 12, margin: 0, color: "#6b7280" }}>{recipientCompany}</p>
          )}
        </div>
      )}

      <p style={{ fontSize: 13, margin: "0 0 16px", color: "#374151" }}>{salutation}</p>

      <div>
        {paragraphs.map((para, i) => (
          <p key={i} style={{ fontSize: 13, lineHeight: 1.8, color: "#374151", margin: "0 0 16px" }}>
            {para}
          </p>
        ))}
      </div>

      <div style={{ marginTop: 32 }}>
        <p style={{ fontSize: 13, margin: 0, color: "#374151" }}>Warm regards,</p>
        <div style={{ height: 48 }} />
        <p
          style={{
            fontSize: 22,
            fontStyle: "italic",
            fontWeight: 700,
            margin: "0 0 4px",
            color: "#111827",
          }}
        >
          {senderName}
        </p>
        {senderTitle && (
          <p style={{ fontSize: 12, margin: 0, color: primaryColor }}>{senderTitle}</p>
        )}
      </div>
    </div>
  );
}

// ─── TimelineCoverLetter ──────────────────────────────────────────────────────

export function TimelineCoverLetter({
  senderName,
  senderTitle,
  recipientName,
  recipientTitle,
  recipientCompany,
  date,
  content,
  primaryColor,
  fontFamily,
}: CoverLetterTemplateProps) {
  const paragraphs = splitContent(content);
  const salutation = recipientName ? `Dear ${recipientName},` : "Dear Hiring Manager,";

  return (
    <div
      style={{
        width: 794,
        minHeight: 1123,
        backgroundColor: "#ffffff",
        fontFamily,
        boxSizing: "border-box",
        padding: "60px 64px",
      }}
    >
      {/* Content indented from left accent stripe */}
      <div
        style={{
          borderLeft: `4px solid ${primaryColor}`,
          paddingLeft: 24,
        }}
      >
        {/* Sender */}
        <p style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "#111827" }}>{senderName}</p>
        {senderTitle && (
          <p style={{ fontSize: 12, margin: "4px 0 0", color: primaryColor }}>{senderTitle}</p>
        )}
        <p style={{ fontSize: 12, color: "#9ca3af", margin: "8px 0 28px" }}>{date}</p>

        {/* Recipient */}
        {(recipientName || recipientTitle || recipientCompany) && (
          <div style={{ marginBottom: 22 }}>
            {recipientName && (
              <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 2px", color: "#111827" }}>
                {recipientName}
              </p>
            )}
            {recipientTitle && (
              <p style={{ fontSize: 12, margin: "0 0 2px", color: "#4b5563" }}>{recipientTitle}</p>
            )}
            {recipientCompany && (
              <p style={{ fontSize: 12, margin: 0, color: "#4b5563" }}>{recipientCompany}</p>
            )}
          </div>
        )}

        <p style={{ fontSize: 13, margin: "0 0 16px", color: "#374151" }}>{salutation}</p>

        <div>
          {paragraphs.map((para, i) => (
            <p key={i} style={{ fontSize: 13, lineHeight: 1.8, color: "#374151", margin: "0 0 16px" }}>
              {para}
            </p>
          ))}
        </div>

        <div style={{ marginTop: 32 }}>
          <p style={{ fontSize: 13, margin: 0, color: "#374151" }}>Sincerely,</p>
          <div style={{ height: 48 }} />
          <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 4px", color: "#111827" }}>{senderName}</p>
          {senderTitle && (
            <p style={{ fontSize: 12, margin: 0, color: primaryColor }}>{senderTitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── HeaderSplitCoverLetter ───────────────────────────────────────────────────

export function HeaderSplitCoverLetter({
  senderName,
  senderTitle,
  recipientName,
  recipientTitle,
  recipientCompany,
  date,
  content,
  primaryColor,
  fontFamily,
}: CoverLetterTemplateProps) {
  const paragraphs = splitContent(content);
  const salutation = recipientName ? `Dear ${recipientName},` : "Dear Hiring Manager,";

  return (
    <div
      style={{
        width: 794,
        minHeight: 1123,
        backgroundColor: "#ffffff",
        fontFamily,
        boxSizing: "border-box",
      }}
    >
      {/* Split header 60/40 */}
      <div style={{ display: "flex", height: 110 }}>
        {/* Left 60% — accent bg, name + title */}
        <div
          style={{
            width: "60%",
            backgroundColor: primaryColor,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "0 40px",
          }}
        >
          <p style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "#ffffff" }}>{senderName}</p>
          {senderTitle && (
            <p style={{ fontSize: 12, margin: "4px 0 0", color: "rgba(255,255,255,0.8)" }}>
              {senderTitle}
            </p>
          )}
        </div>

        {/* Right 40% — white, date + recipient */}
        <div
          style={{
            width: "40%",
            backgroundColor: "#f9fafb",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "0 32px",
          }}
        >
          <p style={{ fontSize: 12, margin: 0, color: "#6b7280" }}>{date}</p>
          {recipientCompany && (
            <p style={{ fontSize: 12, margin: "4px 0 0", color: "#4b5563", fontWeight: 600 }}>
              {recipientCompany}
            </p>
          )}
          {recipientName && (
            <p style={{ fontSize: 11, margin: "2px 0 0", color: "#6b7280" }}>{recipientName}</p>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "44px 64px" }}>
        {(recipientName || recipientTitle) && (
          <div style={{ marginBottom: 20 }}>
            {recipientName && (
              <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 2px", color: "#111827" }}>
                {recipientName}
              </p>
            )}
            {recipientTitle && (
              <p style={{ fontSize: 12, margin: 0, color: "#6b7280" }}>{recipientTitle}</p>
            )}
          </div>
        )}

        <p style={{ fontSize: 13, margin: "0 0 16px", color: "#374151" }}>{salutation}</p>

        <div>
          {paragraphs.map((para, i) => (
            <p key={i} style={{ fontSize: 13, lineHeight: 1.8, color: "#374151", margin: "0 0 16px" }}>
              {para}
            </p>
          ))}
        </div>

        <div style={{ marginTop: 32 }}>
          <p style={{ fontSize: 13, margin: 0, color: "#374151" }}>Sincerely,</p>
          <div style={{ height: 48 }} />
          <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 4px", color: "#111827" }}>{senderName}</p>
          {senderTitle && (
            <p style={{ fontSize: 12, margin: 0, color: primaryColor }}>{senderTitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Registry ─────────────────────────────────────────────────────────────────

export const COVER_LETTER_TEMPLATES = [
  {
    id: "zege-cl" as const,
    name: "Zege Letter",
    description: "Neo-brutalist · pairs with Zege CV",
    popular: true,
    previewColor: "#3D5AFE",
  },
  {
    id: "rift-cl" as const,
    name: "Rift Letter",
    description: "Colour sidebar · pairs with Rift CV",
    popular: true,
    previewColor: "#12433D",
  },
  {
    id: "zahabu-cl" as const,
    name: "Zahabu Letter",
    description: "Charcoal header · pairs with Zahabu CV",
    popular: true,
    previewColor: "#F2A93B",
  },
  {
    id: "vibe-cl" as const,
    name: "Vibe Letter",
    description: "Gradient header · pairs with Vibe CV",
    popular: true,
    previewColor: "#6366F1",
  },
  {
    id: "riso-cl" as const,
    name: "Riso Letter",
    description: "Risograph poster · pairs with Riso CV",
    popular: true,
    previewColor: "#F0466E",
  },
  {
    id: "classic" as const,
    name: "Nakuru Letter",
    description: "Pairs with Nakuru CV · confident tone",
    popular: true,
    previewColor: "#DA4A1C",
  },
  {
    id: "modern" as const,
    name: "Kilimanjaro Letter",
    description: "Pairs with Kilimanjaro CV · formal tone",
    previewColor: "#211A15",
  },
  {
    id: "sidebar-cl" as const,
    name: "Serengeti Letter",
    description: "Pairs with Serengeti CV · professional tone",
    previewColor: "#12433D",
  },
  {
    id: "executive-cl" as const,
    name: "Zanzibar Letter",
    description: "Pairs with Zanzibar CV · creative tone",
    previewColor: "#7C3AED",
  },
  {
    id: "minimal-cl" as const,
    name: "Savanna Letter",
    description: "Pairs with Savanna CV · concise tone",
    previewColor: "#B57A18",
  },
  {
    id: "bold-cl" as const,
    name: "Ubuntu Letter",
    description: "Pairs with Ubuntu CV · executive tone",
    previewColor: "#F2A93B",
  },
  {
    id: "creative-cl" as const,
    name: "Meru Letter",
    description: "Pairs with Meru CV · confident tone",
    previewColor: "#DA4A1C",
  },
  {
    id: "startup-cl" as const,
    name: "Tsavo Letter",
    description: "Pairs with Tsavo CV · enthusiastic tone",
    previewColor: "#DA4A1C",
  },
  {
    id: "academic-cl" as const,
    name: "Lamu Letter",
    description: "Pairs with Lamu CV · warm tone",
    previewColor: "#12433D",
  },
  {
    id: "tech-cl" as const,
    name: "Nairobi Letter",
    description: "Pairs with Nairobi CV · formal tone",
    previewColor: "#1E3A5F",
  },
  {
    id: "clean-cl" as const,
    name: "Kisumu Letter",
    description: "Pairs with Kisumu CV · academic tone",
    previewColor: "#211A15",
  },
  {
    id: "contemporary-cl" as const,
    name: "Eldoret Letter",
    description: "Pairs with Eldoret CV · enthusiastic tone",
    previewColor: "#F2A93B",
  },
  {
    id: "traditional-cl" as const,
    name: "Mombasa Letter",
    description: "Pairs with Mombasa CV · warm tone",
    previewColor: "#0E7490",
  },
  {
    id: "magazine-cl" as const,
    name: "Arusha Letter",
    description: "Pairs with Arusha CV · concise tone",
    previewColor: "#DA4A1C",
  },
  {
    id: "compact-cl" as const,
    name: "Kigali Letter",
    description: "Pairs with Kigali CV · creative tone",
    previewColor: "#BE185D",
  },
  {
    id: "color-block-cl" as const,
    name: "Dodoma Letter",
    description: "Pairs with Dodoma CV · formal tone",
    previewColor: "#1E3A5F",
  },
  {
    id: "stripe-cl" as const,
    name: "Kitale Letter",
    description: "Pairs with Kitale CV · direct tone",
    previewColor: "#B45309",
  },
  {
    id: "elegant-cl" as const,
    name: "Rift Letter",
    description: "Pairs with Rift CV · executive tone",
    previewColor: "#211A15",
  },
  {
    id: "gradient-cl" as const,
    name: "Bahari Letter",
    description: "Pairs with Bahari CV · warm tone",
    previewColor: "#0E7490",
  },
  {
    id: "signature-cl" as const,
    name: "Victoria Letter",
    description: "Pairs with Victoria CV · executive tone",
    previewColor: "#7A5410",
  },
  {
    id: "timeline-cl" as const,
    name: "Turkana Letter",
    description: "Pairs with Turkana CV · direct tone",
    previewColor: "#211A15",
  },
  {
    id: "header-split-cl" as const,
    name: "Kampala Letter",
    description: "Pairs with Kampala CV · professional tone",
    previewColor: "#12433D",
  },
];

// ─── Premium / contemporary cover letters (pair with CV flagships) ────────────

function clLighten(hex: string, amt: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const h = m[1];
  const up = (c: number) => Math.round(c + (255 - c) * amt);
  return `rgb(${up(parseInt(h.slice(0, 2), 16))}, ${up(parseInt(h.slice(2, 4), 16))}, ${up(parseInt(h.slice(4, 6), 16))})`;
}

const CL_MONO = "ui-monospace, 'SF Mono', Menlo, Consolas, monospace";

/** Shared recipient + salutation + body + sign-off column for the new letters. */
function CLBody({
  recipientName, recipientTitle, recipientCompany, date, paragraphs, senderName, senderTitle, primaryColor, showDate = true,
}: {
  recipientName?: string; recipientTitle?: string; recipientCompany?: string; date: string;
  paragraphs: string[]; senderName: string; senderTitle?: string; primaryColor: string; showDate?: boolean;
}) {
  const salutation = recipientName ? `Dear ${recipientName},` : "Dear Hiring Manager,";
  return (
    <>
      {showDate && <p style={{ fontSize: 12, margin: "0 0 20px", color: "#6b7280" }}>{date}</p>}
      {(recipientName || recipientTitle || recipientCompany) && (
        <div style={{ marginBottom: 22 }}>
          {recipientName && <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 2px", color: "#111827" }}>{recipientName}</p>}
          {recipientTitle && <p style={{ fontSize: 12, margin: "0 0 2px", color: "#4b5563" }}>{recipientTitle}</p>}
          {recipientCompany && <p style={{ fontSize: 12, margin: 0, color: "#4b5563", fontStyle: "italic" }}>{recipientCompany}</p>}
        </div>
      )}
      <p style={{ fontSize: 13, margin: "0 0 16px", color: "#374151" }}>{salutation}</p>
      {paragraphs.map((para, i) => (
        <p key={i} style={{ fontSize: 12.5, lineHeight: 1.8, color: "#374151", margin: "0 0 15px" }}>{para}</p>
      ))}
      <div style={{ marginTop: 28 }}>
        <p style={{ fontSize: 13, margin: 0, color: "#374151" }}>Sincerely,</p>
        <div style={{ height: 40 }} />
        <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 3px", color: "#111827" }}>{senderName}</p>
        {senderTitle && <p style={{ fontSize: 12, margin: 0, color: primaryColor }}>{senderTitle}</p>}
      </div>
    </>
  );
}

export function RiftCoverLetter(p: CoverLetterTemplateProps) {
  const paragraphs = splitContent(p.content);
  return (
    <div style={{ width: 794, minHeight: 1123, backgroundColor: "#ffffff", fontFamily: p.fontFamily, boxSizing: "border-box", display: "flex" }}>
      <aside style={{ width: 240, flexShrink: 0, position: "relative", background: p.primaryColor, color: "#fff", padding: "56px 26px" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(0,0,0,0.25))" }} />
        <div style={{ position: "relative" }}>
          <p style={{ fontSize: 24, fontWeight: 800, margin: 0, lineHeight: 1.1, letterSpacing: "-0.01em" }}>{p.senderName}</p>
          {p.senderTitle && <p style={{ fontSize: 12, margin: "8px 0 0", color: "rgba(255,255,255,0.9)", letterSpacing: "0.04em", textTransform: "uppercase" }}>{p.senderTitle}</p>}
          <div style={{ height: 3, width: 40, background: "rgba(255,255,255,0.6)", marginTop: 18 }} />
        </div>
      </aside>
      <main style={{ flex: 1, minWidth: 0, padding: "56px 56px 56px 44px" }}>
        <CLBody {...p} paragraphs={paragraphs} />
      </main>
    </div>
  );
}

export function ZahabuCoverLetter(p: CoverLetterTemplateProps) {
  const paragraphs = splitContent(p.content);
  return (
    <div style={{ width: 794, minHeight: 1123, backgroundColor: "#ffffff", fontFamily: p.fontFamily, boxSizing: "border-box" }}>
      <div style={{ background: "#1E1A16", padding: "34px 70px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div>
          <p style={{ fontSize: 24, fontWeight: 800, margin: 0, color: "#fff" }}>{p.senderName}</p>
          {p.senderTitle && <p style={{ fontSize: 12, margin: "5px 0 0", color: p.primaryColor, letterSpacing: "0.1em", textTransform: "uppercase" }}>{p.senderTitle}</p>}
        </div>
        <p style={{ fontSize: 11, color: "#B9AE9F", margin: 0, whiteSpace: "nowrap" }}>{p.date}</p>
      </div>
      <div style={{ height: 4, background: p.primaryColor }} />
      <main style={{ padding: "40px 70px 56px" }}>
        <CLBody {...p} paragraphs={paragraphs} showDate={false} />
      </main>
    </div>
  );
}

export function VibeCoverLetter(p: CoverLetterTemplateProps) {
  const paragraphs = splitContent(p.content);
  const grad = `linear-gradient(120deg, ${p.primaryColor} 0%, ${clLighten(p.primaryColor, 0.42)} 100%)`;
  return (
    <div style={{ width: 794, minHeight: 1123, backgroundColor: "#ffffff", fontFamily: p.fontFamily, boxSizing: "border-box" }}>
      <div style={{ background: grad, padding: "36px 70px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, color: "#fff" }}>
        <div>
          <p style={{ fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: "-0.01em" }}>{p.senderName}</p>
          {p.senderTitle && <p style={{ fontSize: 13, margin: "6px 0 0", opacity: 0.95 }}>{p.senderTitle}</p>}
        </div>
        <p style={{ fontSize: 11, margin: 0, opacity: 0.9, whiteSpace: "nowrap" }}>{p.date}</p>
      </div>
      <main style={{ padding: "40px 70px 56px" }}>
        <CLBody {...p} paragraphs={paragraphs} showDate={false} />
      </main>
    </div>
  );
}

export function RisoCoverLetter(p: CoverLetterTemplateProps) {
  const paragraphs = splitContent(p.content);
  return (
    <div style={{ width: 794, minHeight: 1123, backgroundColor: "#FAF6EC", fontFamily: p.fontFamily, boxSizing: "border-box", padding: "48px 60px 56px" }}>
      <div style={{ position: "relative", marginBottom: 30 }}>
        <div style={{ position: "absolute", left: 6, top: 8, width: 300, height: 40, background: p.primaryColor, opacity: 0.26 }} />
        <p style={{ position: "relative", display: "inline-block", background: p.primaryColor, color: "#FAF6EC", fontSize: 30, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", padding: "6px 14px", margin: 0, lineHeight: 1 }}>{p.senderName}</p>
        <p style={{ margin: "12px 0 0", fontFamily: CL_MONO, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#1A1815" }}>
          {[p.senderTitle, p.date].filter(Boolean).join("  /  ")}
        </p>
      </div>
      <CLBody {...p} paragraphs={paragraphs} showDate={false} />
    </div>
  );
}

export function ZegeCoverLetter(p: CoverLetterTemplateProps) {
  const paragraphs = splitContent(p.content);
  const INK = "#111111";
  return (
    <div style={{ width: 794, minHeight: 1123, backgroundColor: "#FBFAF7", fontFamily: p.fontFamily, color: INK, boxSizing: "border-box", padding: "48px 60px 56px" }}>
      <div style={{ marginBottom: 30 }}>
        <p style={{ fontSize: 40, fontWeight: 900, margin: 0, textTransform: "uppercase", letterSpacing: "-0.03em", lineHeight: 0.95 }}>{p.senderName}</p>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, marginTop: 12 }}>
          {p.senderTitle && (
            <span style={{ background: p.primaryColor, color: "#fff", border: `2.5px solid ${INK}`, boxShadow: `4px 4px 0 ${INK}`, padding: "5px 12px", fontWeight: 800, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.04em" }}>{p.senderTitle}</span>
          )}
          <span style={{ fontFamily: CL_MONO, fontSize: 10.5 }}>{p.date}</span>
        </div>
      </div>
      <div style={{ border: `2.5px solid ${INK}`, boxShadow: `5px 5px 0 ${INK}`, background: "#fff", padding: 22 }}>
        {(p.recipientName || p.recipientCompany) && (
          <div style={{ marginBottom: 16 }}>
            {p.recipientName && <p style={{ fontSize: 13, fontWeight: 800, margin: "0 0 2px" }}>{p.recipientName}</p>}
            {p.recipientTitle && <p style={{ fontSize: 12, margin: "0 0 2px", color: "#333" }}>{p.recipientTitle}</p>}
            {p.recipientCompany && <p style={{ fontSize: 12, margin: 0, color: "#333" }}>{p.recipientCompany}</p>}
          </div>
        )}
        <p style={{ fontSize: 13, margin: "0 0 14px", fontWeight: 700 }}>{p.recipientName ? `Dear ${p.recipientName},` : "Dear Hiring Manager,"}</p>
        {paragraphs.map((para, i) => (
          <p key={i} style={{ fontSize: 12.5, lineHeight: 1.75, color: "#222", margin: "0 0 14px" }}>{para}</p>
        ))}
        <div style={{ marginTop: 24, borderTop: `2px solid ${INK}`, paddingTop: 14 }}>
          <p style={{ fontFamily: CL_MONO, fontSize: 11, margin: "0 0 6px", color: "#333" }}>{"// sincerely"}</p>
          <p style={{ fontSize: 15, fontWeight: 900, margin: 0, textTransform: "uppercase" }}>{p.senderName}</p>
        </div>
      </div>
    </div>
  );
}

export const COVER_LETTER_COMPONENTS: Record<
  CoverLetterTemplateId,
  React.ComponentType<CoverLetterTemplateProps>
> = {
  "zege-cl": ZegeCoverLetter,
  "rift-cl": RiftCoverLetter,
  "zahabu-cl": ZahabuCoverLetter,
  "vibe-cl": VibeCoverLetter,
  "riso-cl": RisoCoverLetter,
  classic: ClassicCoverLetter,
  modern: ModernCoverLetter,
  "sidebar-cl": SidebarCoverLetter,
  "executive-cl": ExecutiveCoverLetter,
  "minimal-cl": MinimalCoverLetter,
  "bold-cl": BoldCoverLetter,
  "creative-cl": CreativeCoverLetter,
  "startup-cl": StartupCoverLetter,
  "academic-cl": AcademicCoverLetter,
  "tech-cl": TechCoverLetter,
  "clean-cl": CleanCoverLetter,
  "contemporary-cl": ContemporaryCoverLetter,
  "traditional-cl": TraditionalCoverLetter,
  "magazine-cl": MagazineCoverLetter,
  "compact-cl": CompactCoverLetter,
  "color-block-cl": ColorBlockCoverLetter,
  "stripe-cl": StripeCoverLetter,
  "elegant-cl": ElegantCoverLetter,
  "gradient-cl": GradientCoverLetter,
  "signature-cl": SignatureCoverLetter,
  "timeline-cl": TimelineCoverLetter,
  "header-split-cl": HeaderSplitCoverLetter,
};
