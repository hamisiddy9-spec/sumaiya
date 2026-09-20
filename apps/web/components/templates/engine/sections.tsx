// Universal section renderers — shared by all engine-backed templates.
// Each renderer is pure: tokens + data in, JSX out.
// The sectionStyle prop controls the header's visual treatment.

import React from "react";
import type { CVData } from "@/types";
import type { Lang } from "@/lib/i18n/translations";
import type { DesignTokens } from "./tokens";
import {
  IcoEmail, IcoPhone, IcoPin, IcoLinkedIn, IcoGlobe,
  PhotoCircle, SkillBar, SkillDots, ContactItem, fmtDate, dateRange,
} from "@/components/templates/template-utils";

// Localized section headings — matches the wording the hand-authored templates
// already use, so a Swahili-first user gets Swahili headings on engine templates
// too (previously every engine template hardcoded English). Defaults to English
// so any render site that omits `lang` is unchanged.
const HEADINGS: Record<string, { en: string; sw: string }> = {
  summary:        { en: "Professional Summary", sw: "Muhtasari" },
  experience:     { en: "Work Experience",      sw: "Uzoefu wa Kazi" },
  education:      { en: "Education",            sw: "Elimu" },
  skills:         { en: "Skills",               sw: "Ujuzi" },
  projects:       { en: "Projects",             sw: "Miradi" },
  languages:      { en: "Languages",            sw: "Lugha" },
  certifications: { en: "Certifications",       sw: "Vyeti" },
  referees:       { en: "Referees",             sw: "Wadhamini" },
  hobbies:        { en: "Interests",            sw: "Mapendeleo" },
  contact:        { en: "Contact",              sw: "Mawasiliano" },
};
export function heading(key: string, lang: Lang = "en"): string {
  const h = HEADINGS[key];
  return h ? (lang === "sw" ? h.sw : h.en) : key;
}

export type SectionStyle = "underline" | "tag" | "box" | "line-accent" | "dots" | "none" | "pill" | "ruled" | "numbered";
export type SkillDisplay = "bar" | "dot" | "chip" | "grid" | "tag-rated";
export type ExperienceVariant = "default" | "card" | "compact" | "timeline-v2" | "table";

// ─── Section header label ──────────────────────────────────────────────────────

export function SectionLabel({
  label, tokens, style = "underline",
}: { label: string; tokens: DesignTokens; style?: SectionStyle }) {
  const base: React.CSSProperties = {
    fontSize: tokens.font.sectionLabel,
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    fontFamily: tokens.fontFamily,
  };

  if (style === "none") return null;

  if (style === "underline") return (
    <div style={{ marginBottom: 9 }}>
      <span style={{ ...base, color: tokens.color.text }}>{label}</span>
      <div style={{ height: 1, backgroundColor: tokens.color.accent, opacity: 0.5, marginTop: 3 }} />
    </div>
  );

  if (style === "tag") return (
    <div style={{ ...base, color: tokens.color.accent, marginBottom: 8 }}>{label}</div>
  );

  if (style === "box") return (
    <div style={{ marginBottom: 9 }}>
      <span style={{
        ...base, color: tokens.color.onAccent,
        backgroundColor: tokens.color.accent,
        padding: "2px 8px", borderRadius: 3, display: "inline-block",
      }}>{label}</span>
    </div>
  );

  if (style === "line-accent") return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 9 }}>
      <div style={{ width: 3, height: 13, backgroundColor: tokens.color.accent, borderRadius: 2, flexShrink: 0 }} />
      <span style={{ ...base, color: tokens.color.text }}>{label}</span>
    </div>
  );

  if (style === "dots") return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 9 }}>
      <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: tokens.color.accent, flexShrink: 0 }} />
      <span style={{ ...base, color: tokens.color.muted }}>{label}</span>
    </div>
  );

  if (style === "pill") return (
    <div style={{ marginBottom: 10 }}>
      <span style={{
        ...base, color: tokens.color.accent,
        border: `1.5px solid ${tokens.color.accent}`,
        borderRadius: 99, padding: "2px 12px", display: "inline-block",
        letterSpacing: "0.1em",
      }}>{label}</span>
    </div>
  );

  if (style === "ruled") return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ height: 1, backgroundColor: tokens.color.faint, marginBottom: 5 }} />
      <span style={{ ...base, color: tokens.color.muted }}>{label}</span>
      <div style={{ height: 1, backgroundColor: tokens.color.accent, marginTop: 4, opacity: 0.6 }} />
    </div>
  );

  if (style === "numbered") return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9 }}>
      <div style={{
        width: 18, height: 18, borderRadius: "50%",
        backgroundColor: tokens.color.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <span style={{ fontSize: 8, fontWeight: 800, color: tokens.color.onAccent, fontFamily: tokens.fontFamily }}>§</span>
      </div>
      <span style={{ ...base, color: tokens.color.text }}>{label}</span>
    </div>
  );

  return null;
}

// ─── Contact block (used in sidebar and headers) ──────────────────────────────

export function ContactBlock({
  personal, tokens, iconColor, vertical = true,
}: {
  personal: CVData["personal"]; tokens: DesignTokens; iconColor: string; vertical?: boolean;
}) {
  const items = [
    { Icon: IcoEmail,    val: personal.email },
    { Icon: IcoPhone,    val: personal.phone },
    { Icon: IcoPin,      val: personal.location },
    { Icon: IcoLinkedIn, val: personal.linkedin },
    { Icon: IcoGlobe,    val: personal.website },
  ].filter(i => i.val);

  if (vertical) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {items.map(({ Icon, val }) => (
        <ContactItem key={val} icon={<Icon size={9} color={iconColor} />} text={val!} color={iconColor} fontSize={tokens.font.meta} />
      ))}
    </div>
  );

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "3px 14px" }}>
      {items.map(({ Icon, val }) => (
        <ContactItem key={val} icon={<Icon size={9} color={iconColor} />} text={val!} color={iconColor} fontSize={tokens.font.meta} />
      ))}
    </div>
  );
}

// ─── Summary ──────────────────────────────────────────────────────────────────

export function SummarySection({
  data, tokens, style, lang = "en",
}: { data: CVData; tokens: DesignTokens; style: SectionStyle; lang?: Lang }) {
  if (!data.summary || data.hiddenSections?.includes("summary")) return null;
  return (
    <div>
      <SectionLabel label={heading("summary", lang)} tokens={tokens} style={style} />
      <p style={{
        fontSize: tokens.font.body, color: tokens.color.sub,
        lineHeight: tokens.space.line, margin: 0, fontFamily: tokens.fontFamily,
      }}>
        {data.summary}
      </p>
    </div>
  );
}

// ─── Experience ───────────────────────────────────────────────────────────────

export function ExperienceSection({
  data, tokens, style, lang = "en", showTimeline = false, variant = "default",
}: {
  data: CVData; tokens: DesignTokens; style: SectionStyle; lang?: Lang;
  showTimeline?: boolean; variant?: ExperienceVariant;
}) {
  const items = data.hiddenSections?.includes("experience") ? [] : data.experience;
  if (!items.length) return null;

  // ── card variant — each entry in an accent-bordered box ────────────────────
  if (variant === "card") return (
    <div>
      <SectionLabel label={heading("experience", lang)} tokens={tokens} style={style} />
      <div style={{ display: "flex", flexDirection: "column", gap: tokens.space.entry + 3 }}>
        {items.map(exp => (
          <div key={exp.id} style={{
            padding: "8px 10px 8px 13px",
            backgroundColor: tokens.color.faint,
            borderRadius: 5,
            borderLeft: `3px solid ${tokens.color.accent}`,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: tokens.font.roleTitle, fontWeight: 700, color: tokens.color.text, fontFamily: tokens.fontFamily }}>
                  {exp.position}
                </div>
                <div style={{ fontSize: tokens.font.orgName, color: tokens.color.sub, marginTop: 1, fontFamily: tokens.fontFamily }}>
                  {exp.company}{exp.location ? ` · ${exp.location}` : ""}
                </div>
              </div>
              <div style={{ fontSize: tokens.font.meta, color: tokens.color.muted, whiteSpace: "nowrap", fontFamily: tokens.fontFamily, flexShrink: 0 }}>
                {dateRange(exp.startDate, exp.endDate, exp.current)}
              </div>
            </div>
            {exp.description && (
              <p style={{
                fontSize: tokens.font.body, color: tokens.color.muted, margin: "4px 0 0",
                lineHeight: tokens.space.line, fontFamily: tokens.fontFamily,
                display: "-webkit-box", WebkitLineClamp: 4,
                WebkitBoxOrient: "vertical", overflow: "hidden",
              }}>
                {exp.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  // ── compact variant — role · company inline, tight spacing ─────────────────
  if (variant === "compact") return (
    <div>
      <SectionLabel label={heading("experience", lang)} tokens={tokens} style={style} />
      <div style={{ display: "flex", flexDirection: "column", gap: tokens.space.entry - 2 }}>
        {items.map(exp => (
          <div key={exp.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontSize: tokens.font.roleTitle, fontWeight: 700, color: tokens.color.text, fontFamily: tokens.fontFamily }}>
                {exp.position}
                {exp.company && (
                  <span style={{ fontWeight: 400, color: tokens.color.sub }}> · {exp.company}</span>
                )}
              </span>
              <span style={{ fontSize: tokens.font.meta, color: tokens.color.muted, whiteSpace: "nowrap", fontFamily: tokens.fontFamily, flexShrink: 0 }}>
                {dateRange(exp.startDate, exp.endDate, exp.current)}
              </span>
            </div>
            {exp.description && (
              <p style={{
                fontSize: tokens.font.body - 0.5, color: tokens.color.muted, margin: "2px 0 0",
                lineHeight: 1.4, fontFamily: tokens.fontFamily,
                display: "-webkit-box", WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical", overflow: "hidden",
              }}>
                {exp.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  // ── timeline-v2 variant — full left gutter with date, bold dots ────────────
  if (variant === "timeline-v2") return (
    <div>
      <SectionLabel label={heading("experience", lang)} tokens={tokens} style={style} />
      <div style={{ display: "flex", flexDirection: "column", gap: tokens.space.entry + 2 }}>
        {items.map((exp, idx) => (
          <div key={exp.id} style={{ display: "flex", gap: 0 }}>
            {/* Date column */}
            <div style={{ width: 60, flexShrink: 0, paddingTop: 2, textAlign: "right", paddingRight: 10 }}>
              <span style={{ fontSize: tokens.font.meta - 0.5, color: tokens.color.accent, fontFamily: tokens.fontFamily, lineHeight: 1.3, display: "block" }}>
                {exp.current ? "Present" : fmtDate(exp.endDate)}
              </span>
              <span style={{ fontSize: tokens.font.meta - 1, color: tokens.color.muted, fontFamily: tokens.fontFamily }}>
                {fmtDate(exp.startDate)}
              </span>
            </div>
            {/* Timeline track */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: 14 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: tokens.color.accent, flexShrink: 0, border: `2px solid ${tokens.color.accent}`, marginTop: 2 }} />
              {idx < items.length - 1 && (
                <div style={{ width: 2, flex: 1, backgroundColor: tokens.color.accent + "25", minHeight: 24, borderRadius: 1 }} />
              )}
            </div>
            {/* Content */}
            <div style={{ flex: 1, minWidth: 0, paddingLeft: 10 }}>
              <div style={{ fontSize: tokens.font.roleTitle, fontWeight: 700, color: tokens.color.text, fontFamily: tokens.fontFamily }}>{exp.position}</div>
              <div style={{ fontSize: tokens.font.orgName, color: tokens.color.sub, marginTop: 1, fontFamily: tokens.fontFamily }}>{exp.company}{exp.location ? ` · ${exp.location}` : ""}</div>
              {exp.description && (
                <p style={{ fontSize: tokens.font.body, color: tokens.color.muted, margin: "4px 0 0", lineHeight: tokens.space.line, fontFamily: tokens.fontFamily }}>
                  {exp.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── table variant — grid rows, alternating faint bg ─────────────────────────
  if (variant === "table") return (
    <div>
      <SectionLabel label={heading("experience", lang)} tokens={tokens} style={style} />
      <div style={{ borderRadius: 4, overflow: "hidden", border: `1px solid ${tokens.color.faint}` }}>
        {items.map((exp, idx) => (
          <div key={exp.id} style={{
            display: "grid", gridTemplateColumns: "1fr auto",
            padding: "7px 10px",
            backgroundColor: idx % 2 === 0 ? "#fff" : tokens.color.faint,
            gap: 8,
          }}>
            <div>
              <span style={{ fontSize: tokens.font.roleTitle, fontWeight: 700, color: tokens.color.text, fontFamily: tokens.fontFamily }}>{exp.position}</span>
              <span style={{ fontSize: tokens.font.orgName, color: tokens.color.sub, fontFamily: tokens.fontFamily }}>{exp.company ? ` @ ${exp.company}` : ""}</span>
              {exp.description && (
                <p style={{ fontSize: tokens.font.body - 0.5, color: tokens.color.muted, margin: "2px 0 0", lineHeight: 1.4, fontFamily: tokens.fontFamily }}>
                  {exp.description.split("\n")[0].replace(/^[-•▸]\s*/, "")}
                </p>
              )}
            </div>
            <div style={{ fontSize: tokens.font.meta, color: tokens.color.muted, whiteSpace: "nowrap", fontFamily: tokens.fontFamily, paddingTop: 2 }}>
              {dateRange(exp.startDate, exp.endDate, exp.current)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── default variant — with optional left timeline ───────────────────────────
  return (
    <div>
      <SectionLabel label={heading("experience", lang)} tokens={tokens} style={style} />
      <div style={{ display: "flex", flexDirection: "column", gap: tokens.space.entry }}>
        {items.map((exp, idx) => (
          <div key={exp.id} style={{ display: "flex", gap: showTimeline ? 10 : 0 }}>
            {showTimeline && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: tokens.color.accent, flexShrink: 0, marginTop: 3 }} />
                {idx < items.length - 1 && (
                  <div style={{ width: 1, flex: 1, backgroundColor: tokens.color.accent + "30", minHeight: 20 }} />
                )}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: tokens.font.roleTitle, fontWeight: 700, color: tokens.color.text, fontFamily: tokens.fontFamily }}>
                    {exp.position}
                  </div>
                  <div style={{ fontSize: tokens.font.orgName, color: tokens.color.sub, marginTop: 1, fontFamily: tokens.fontFamily }}>
                    {exp.company}{exp.location ? ` · ${exp.location}` : ""}
                  </div>
                </div>
                <div style={{ fontSize: tokens.font.meta, color: tokens.color.muted, whiteSpace: "nowrap", fontFamily: tokens.fontFamily, flexShrink: 0 }}>
                  {dateRange(exp.startDate, exp.endDate, exp.current)}
                </div>
              </div>
              {exp.description && (
                <p style={{
                  fontSize: tokens.font.body, color: tokens.color.muted, margin: "4px 0 0",
                  lineHeight: tokens.space.line, fontFamily: tokens.fontFamily,
                  display: "-webkit-box", WebkitLineClamp: 4,
                  WebkitBoxOrient: "vertical", overflow: "hidden",
                }}>
                  {exp.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Education ────────────────────────────────────────────────────────────────

export function EducationSection({
  data, tokens, style, lang = "en",
}: { data: CVData; tokens: DesignTokens; style: SectionStyle; lang?: Lang }) {
  const items = data.hiddenSections?.includes("education") ? [] : data.education;
  if (!items.length) return null;
  return (
    <div>
      <SectionLabel label={heading("education", lang)} tokens={tokens} style={style} />
      <div style={{ display: "flex", flexDirection: "column", gap: tokens.space.entry }}>
        {items.map(edu => (
          <div key={edu.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: tokens.font.roleTitle, fontWeight: 700, color: tokens.color.text, fontFamily: tokens.fontFamily }}>
                {edu.degree}{edu.field ? ` in ${edu.field}` : ""}
              </div>
              <div style={{ fontSize: tokens.font.orgName, color: tokens.color.sub, fontFamily: tokens.fontFamily }}>{edu.institution}</div>
              {edu.grade && (
                <div style={{ fontSize: tokens.font.meta, color: tokens.color.muted, fontFamily: tokens.fontFamily }}>{edu.grade}</div>
              )}
            </div>
            <div style={{ fontSize: tokens.font.meta, color: tokens.color.muted, whiteSpace: "nowrap", fontFamily: tokens.fontFamily, flexShrink: 0 }}>
              {dateRange(edu.startDate, edu.endDate, false)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Skills ───────────────────────────────────────────────────────────────────

export function SkillsSection({
  data, tokens, style, lang = "en", display = "bar",
}: { data: CVData; tokens: DesignTokens; style: SectionStyle; lang?: Lang; display?: SkillDisplay }) {
  const items = (data.hiddenSections?.includes("skills") ? [] : data.skills).filter(
    (s) => typeof s.name === "string" && s.name.trim().length > 0,
  );
  if (!items.length) return null;

  if (display === "chip") return (
    <div>
      <SectionLabel label={heading("skills", lang)} tokens={tokens} style={style} />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
        {items.map(skill => (
          <span key={skill.id} style={{
            fontSize: tokens.font.tag, color: tokens.color.accent,
            backgroundColor: tokens.color.accent + "18",
            border: `1px solid ${tokens.color.accent}35`,
            borderRadius: 99, padding: "2px 8px", fontFamily: tokens.fontFamily,
          }}>
            {skill.name}
          </span>
        ))}
      </div>
    </div>
  );

  if (display === "grid") return (
    <div>
      <SectionLabel label={heading("skills", lang)} tokens={tokens} style={style} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 8px" }}>
        {items.map(skill => (
          <div key={skill.id} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 4, height: 4, borderRadius: "50%", backgroundColor: tokens.color.accent, flexShrink: 0 }} />
            <span style={{ fontSize: tokens.font.body, color: tokens.color.text, fontFamily: tokens.fontFamily }}>{skill.name}</span>
          </div>
        ))}
      </div>
    </div>
  );

  if (display === "tag-rated") return (
    <div>
      <SectionLabel label={heading("skills", lang)} tokens={tokens} style={style} />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
        {items.map(skill => (
          <span key={skill.id} style={{
            fontSize: tokens.font.tag, color: tokens.color.text,
            backgroundColor: tokens.color.faint,
            border: `1px solid ${tokens.color.accent}40`,
            borderRadius: 4, padding: "2px 8px", fontFamily: tokens.fontFamily,
            display: "inline-flex", alignItems: "center", gap: 4,
          }}>
            {skill.name}
            <span style={{
              width: (skill.level / 5) * 20, height: 3, backgroundColor: tokens.color.accent,
              borderRadius: 2, display: "inline-block",
            }} />
          </span>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <SectionLabel label={heading("skills", lang)} tokens={tokens} style={style} />
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {items.map(skill => (
          <div key={skill.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <span style={{ fontSize: tokens.font.body, color: tokens.color.text, fontFamily: tokens.fontFamily, flex: 1, minWidth: 0 }}>{skill.name}</span>
            {display === "bar"
              ? <SkillBar level={skill.level} color={tokens.color.accent} bgColor={tokens.color.faint} width={70} height={3} />
              : <SkillDots level={skill.level} color={tokens.color.accent} emptyColor={tokens.color.faint} size={7} />
            }
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Languages ────────────────────────────────────────────────────────────────

/**
 * Languages — a label/level PAIR per row.
 *
 * `justify-content: space-between` on that pair is wrong, and it is wrong in a
 * way the rendered geometry can prove: the two halves are only associated by
 * the row they share, so as the row's width grows the level drifts away from
 * the language it belongs to. Measured on the live apex template before this
 * change: the row was 103.4px wide and `Kiswahili` → `Native` sat 58.9px apart —
 * 57% of the row was void, and in a full-width main column (the aside layouts
 * are 195–300px; a header layout's main column is 560px+) the void is several
 * times the label's own width. That reads as "language far left, level far
 * right" rather than "Swahili — Native".
 *
 * The fix keeps the level right-aligned (levels must line up as a column, which
 * is why space-between was there in the first place) but CONNECTS the pair with
 * a dotted leader: the label takes the free space and draws the dots under
 * itself, so the eye follows the leader across any gap. That is the standard
 * typographic treatment for exactly this pair, and it works at every width —
 * narrow aside, wide main column, or a magnified SmartFit sheet.
 */
export function LanguagesSection({
  data, tokens, style, lang = "en",
}: { data: CVData; tokens: DesignTokens; style: SectionStyle; lang?: Lang }) {
  const items = data.hiddenSections?.includes("languages") ? [] : data.languages;
  if (!items.length) return null;
  return (
    <div>
      <SectionLabel label={heading("languages", lang)} tokens={tokens} style={style} />
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {items.map(lang => (
          <div key={lang.id} style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{
              flex: 1, minWidth: 0,
              borderBottom: "1px dotted currentColor", paddingBottom: 2,
              fontSize: tokens.font.body, color: tokens.color.text, fontFamily: tokens.fontFamily,
            }}>{lang.name}</span>
            <span style={{ flexShrink: 0, whiteSpace: "nowrap", fontSize: tokens.font.meta, color: tokens.color.muted, fontFamily: tokens.fontFamily }}>{lang.proficiency}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Certifications ────────────────────────────────────────────────────────────

export function CertificationsSection({
  data, tokens, style, lang = "en",
}: { data: CVData; tokens: DesignTokens; style: SectionStyle; lang?: Lang }) {
  const items = data.hiddenSections?.includes("certifications") ? [] : data.certifications;
  if (!items.length) return null;
  return (
    <div>
      <SectionLabel label={heading("certifications", lang)} tokens={tokens} style={style} />
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {items.map(cert => (
          <div key={cert.id}>
            <div style={{ fontSize: tokens.font.body, fontWeight: 600, color: tokens.color.text, fontFamily: tokens.fontFamily }}>{cert.name}</div>
            <div style={{ fontSize: tokens.font.meta, color: tokens.color.muted, fontFamily: tokens.fontFamily }}>
              {cert.issuer}{cert.date ? ` · ${fmtDate(cert.date)}` : ""}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export function ProjectsSection({
  data, tokens, style, lang = "en",
}: { data: CVData; tokens: DesignTokens; style: SectionStyle; lang?: Lang }) {
  const items = data.hiddenSections?.includes("projects") ? [] : (data.projects ?? []);
  if (!items.length) return null;
  return (
    <div>
      <SectionLabel label={heading("projects", lang)} tokens={tokens} style={style} />
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map(proj => {
          const meta = [proj.role, proj.date ? fmtDate(proj.date) : ""].filter(Boolean).join(" · ");
          const lines = (proj.description || "").split(/\n+/).map(l => l.replace(/^[-•]\s*/, "").trim()).filter(Boolean);
          return (
            <div key={proj.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                <div style={{ fontSize: tokens.font.body, fontWeight: 600, color: tokens.color.text, fontFamily: tokens.fontFamily }}>{proj.name}</div>
                {meta && <div style={{ fontSize: tokens.font.meta, color: tokens.color.muted, fontFamily: tokens.fontFamily, whiteSpace: "nowrap" }}>{meta}</div>}
              </div>
              {lines.length > 0 && (
                <div style={{ marginTop: 2 }}>
                  {lines.map((line, i) => (
                    <div key={i} style={{ fontSize: tokens.font.body, color: tokens.color.sub, fontFamily: tokens.fontFamily, lineHeight: tokens.space.line }}>
                      {lines.length > 1 ? `• ${line}` : line}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Referees ─────────────────────────────────────────────────────────────────

export function RefereesSection({
  data, tokens, style, lang = "en",
}: { data: CVData; tokens: DesignTokens; style: SectionStyle; lang?: Lang }) {
  const items = data.hiddenSections?.includes("referees") ? [] : data.referees;
  if (!items.length) return null;
  return (
    <div>
      <SectionLabel label={heading("referees", lang)} tokens={tokens} style={style} />
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {items.map(ref => (
          <div key={ref.id}
            style={{
              padding: "6px 8px",
              backgroundColor: tokens.color.faint,
              borderRadius: 4,
              borderLeft: `2px solid ${tokens.color.accent}50`,
            }}
          >
            <div style={{ fontSize: tokens.font.body, fontWeight: 600, color: tokens.color.text, fontFamily: tokens.fontFamily }}>
              {ref.name}
            </div>
            <div style={{ fontSize: tokens.font.meta, color: tokens.color.sub, fontFamily: tokens.fontFamily }}>
              {ref.title}{ref.company ? ` — ${ref.company}` : ""}
            </div>
            <div style={{ fontSize: tokens.font.tag, color: tokens.color.muted, fontFamily: tokens.fontFamily, marginTop: 2 }}>
              {ref.email}{ref.phone ? ` · ${ref.phone}` : ""}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Hobbies ──────────────────────────────────────────────────────────────────

export function HobbiesSection({
  data, tokens, style, lang = "en", display = "chips",
}: { data: CVData; tokens: DesignTokens; style: SectionStyle; lang?: Lang; display?: "chips" | "text" }) {
  if (!data.hobbies || data.hiddenSections?.includes("hobbies")) return null;
  const items = data.hobbies.split(/[,\n]+/).map(h => h.trim()).filter(Boolean);
  return (
    <div>
      <SectionLabel label={heading("hobbies", lang)} tokens={tokens} style={style} />
      {display === "chips" ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {items.map(h => (
            <span key={h} style={{
              fontSize: tokens.font.tag, color: tokens.color.sub,
              backgroundColor: tokens.color.faint,
              borderRadius: 99, padding: "2px 8px", fontFamily: tokens.fontFamily,
            }}>
              {h}
            </span>
          ))}
        </div>
      ) : (
        <p style={{ fontSize: tokens.font.body, color: tokens.color.sub, margin: 0, fontFamily: tokens.fontFamily, lineHeight: tokens.space.line }}>
          {data.hobbies}
        </p>
      )}
    </div>
  );
}

// ─── Section dispatcher ────────────────────────────────────────────────────────
// Given a section key from sectionOrder, renders the correct section.

export interface SectionRendererOptions {
  sectionStyle: SectionStyle;
  skillDisplay?: SkillDisplay;
  hobbiesDisplay?: "chips" | "text";
  showTimeline?: boolean;
  experienceVariant?: ExperienceVariant;
  lang?: Lang;
}

export function renderSection(
  key: string,
  data: CVData,
  tokens: DesignTokens,
  opts: SectionRendererOptions
): React.ReactNode {
  const s = opts.sectionStyle;
  const l = opts.lang ?? "en";
  switch (key) {
    case "summary":       return <SummarySection data={data} tokens={tokens} style={s} lang={l} />;
    case "experience":    return <ExperienceSection data={data} tokens={tokens} style={s} lang={l} showTimeline={opts.showTimeline} variant={opts.experienceVariant} />;
    case "education":     return <EducationSection data={data} tokens={tokens} style={s} lang={l} />;
    case "skills":        return <SkillsSection data={data} tokens={tokens} style={s} lang={l} display={opts.skillDisplay} />;
    case "projects":      return <ProjectsSection data={data} tokens={tokens} style={s} lang={l} />;
    case "languages":     return <LanguagesSection data={data} tokens={tokens} style={s} lang={l} />;
    case "certifications":return <CertificationsSection data={data} tokens={tokens} style={s} lang={l} />;
    case "referees":       return <RefereesSection data={data} tokens={tokens} style={s} lang={l} />;
    case "hobbies":       return <HobbiesSection data={data} tokens={tokens} style={s} lang={l} display={opts.hobbiesDisplay} />;
    default:              return null;
  }
}

// Re-export utils so templates can import from one place
export { PhotoCircle, ContactBlock as _ContactBlock };
