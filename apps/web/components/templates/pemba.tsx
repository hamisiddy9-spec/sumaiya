import React from "react";
import { fmtDate, dateRange, CVData, visibleSkills } from "@/components/templates/template-utils";
import type { Lang } from "@/lib/i18n/translations";

interface Props {
  data: CVData;
  primaryColor: string;
  fontFamily: string;
  lang?: Lang;
}

const SERIF = "Georgia, 'Times New Roman', Times, serif";

/**
 * Pemba — editorial, for people whose taste is part of the pitch. Reads like a
 * magazine opening spread: an oversized serif name, an accent masthead rule, a
 * drop-cap lead, and a disciplined two-column grid. Colour is used sparingly
 * and confidently rather than everywhere.
 */
export function PembaTemplate({ data, primaryColor, fontFamily, lang = "en" }: Props) {
  const { personal, summary, experience, education, skills, languages, certifications, referees, hobbies } = data;
  const hidden = (k: string) => data.hiddenSections?.includes(k) ?? false;
  const sw = lang === "sw";
  const bodyFont = fontFamily || SERIF;

  const Kicker = ({ children }: { children: React.ReactNode }) => (
    <div style={{ fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: primaryColor, marginBottom: 12 }}>{children}</div>
  );

  const lead = summary || "";
  const firstCh = lead.charAt(0);
  const rest = lead.slice(1);

  return (
    <div style={{ width: 794, minHeight: 1123, backgroundColor: "#ffffff", fontFamily: bodyFont, color: "#26201b", padding: "48px 52px", boxSizing: "border-box" }}>
      {/* Masthead */}
      <div style={{ borderTop: "3px solid #211A15", paddingTop: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "ui-monospace, monospace", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#9a8f80" }}>
          <span>{sw ? "Wasifu" : "Curriculum Vitæ"}</span>
          <span>{personal.location || ""}</span>
        </div>
      </div>
      <div style={{ fontFamily: SERIF, fontSize: 54, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1, margin: "18px 0 6px", color: "#211A15" }}>{personal.fullName}</div>
      {personal.jobTitle && (
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 4 }}>
          <span style={{ height: 2, width: 54, background: primaryColor }} />
          <span style={{ fontStyle: "italic", fontSize: 16, color: primaryColor }}>{personal.jobTitle}</span>
        </div>
      )}
      <div style={{ borderBottom: "1px solid #d8cdbb", marginTop: 16 }} />

      {/* Lead with drop cap */}
      {lead && (
        <p style={{ fontSize: 13, lineHeight: 1.75, color: "#4a4038", marginTop: 20 }}>
          <span style={{ float: "left", fontSize: 52, lineHeight: 0.82, fontWeight: 700, color: primaryColor, padding: "4px 10px 0 0", fontFamily: SERIF }}>{firstCh}</span>
          {rest}
        </p>
      )}

      {/* Two columns */}
      <div style={{ display: "flex", gap: 38, marginTop: 26 }}>
        {/* Left — experience */}
        <div style={{ flex: 1.6, minWidth: 0 }}>
          {experience?.length > 0 && !hidden("experience") && (
            <div>
              <Kicker>{sw ? "Uzoefu wa Kazi" : "Experience"}</Kicker>
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {experience.map((exp) => (
                  <div key={exp.id}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#211A15" }}>{exp.company}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontStyle: "italic", fontSize: 12, color: "#7a6f60", margin: "1px 0 6px", gap: 8 }}>
                      <span>{exp.position}{exp.location ? `, ${exp.location}` : ""}</span>
                      <span style={{ whiteSpace: "nowrap" }}>{dateRange(exp.startDate, exp.endDate, exp.current)}</span>
                    </div>
                    {exp.description && exp.description.split("\n").filter(Boolean).map((line, i) => (
                      <p key={i} style={{ fontSize: 11.5, lineHeight: 1.65, color: "#4a4038", marginBottom: 3 }}>{line}</p>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {certifications?.length > 0 && !hidden("certifications") && (
            <div style={{ marginTop: 22 }}>
              <Kicker>{sw ? "Vyeti" : "Certifications"}</Kicker>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {certifications.map((c) => (
                  <div key={c.id} style={{ fontSize: 12, color: "#3f362e" }}>
                    <span style={{ fontWeight: 700 }}>{c.name}</span>{c.issuer ? ` — ${c.issuer}` : ""}{c.date ? <span style={{ color: "#9a8f80" }}> ({fmtDate(c.date)})</span> : null}
                  </div>
                ))}
              </div>
            </div>
          )}

          {referees?.length > 0 && !hidden("referees") && (
            <div style={{ marginTop: 22 }}>
              <Kicker>{sw ? "Wadhamini" : "Referees"}</Kicker>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "14px 32px" }}>
                {referees.map((r) => (
                  <div key={r.id} style={{ minWidth: 180 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#211A15" }}>{r.name}</div>
                    {(r.title || r.company) && <div style={{ fontStyle: "italic", fontSize: 11.5, color: "#7a6f60" }}>{r.title}{r.title && r.company ? " · " : ""}{r.company}</div>}
                    {(r.email || r.phone) && <div style={{ fontSize: 11, color: "#9a8f80" }}>{[r.email, r.phone].filter(Boolean).join(" · ")}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right — education / expertise / contact / languages */}
        <div style={{ flex: 1, minWidth: 0, borderLeft: "1px solid #e2d8c8", paddingLeft: 30 }}>
          {education?.length > 0 && !hidden("education") && (
            <div style={{ marginBottom: 22 }}>
              <Kicker>{sw ? "Elimu" : "Education"}</Kicker>
              {education.map((edu) => (
                <div key={edu.id} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: "#211A15" }}>{edu.institution}</div>
                  <div style={{ fontStyle: "italic", fontSize: 11.5, color: "#7a6f60" }}>{edu.degree}{edu.field ? `, ${edu.field}` : ""}</div>
                  <div style={{ fontSize: 11, color: "#7a6f60", marginTop: 2 }}>{dateRange(edu.startDate, edu.endDate, false)}{edu.grade ? ` · ${edu.grade}` : ""}</div>
                </div>
              ))}
            </div>
          )}

          {skills?.length > 0 && !hidden("skills") && (
            <div style={{ marginBottom: 22 }}>
              <Kicker>{sw ? "Ujuzi" : "Expertise"}</Kicker>
              <div style={{ fontSize: 12, lineHeight: 1.9, color: "#3f362e" }}>
                {visibleSkills(skills).map((s, i) => (
                  <span key={s.id}>{s.name}{i < skills.length - 1 ? " · " : ""}</span>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginBottom: 22 }}>
            <Kicker>{sw ? "Mawasiliano" : "Contact"}</Kicker>
            <div style={{ fontSize: 11.5, lineHeight: 1.85, color: "#3f362e", wordBreak: "break-word" }}>
              {personal.email && <div>{personal.email}</div>}
              {personal.phone && <div>{personal.phone}</div>}
              {personal.linkedin && <div>{personal.linkedin}</div>}
              {personal.website && <div>{personal.website}</div>}
            </div>
          </div>

          {languages?.length > 0 && !hidden("languages") && (
            <div style={{ marginBottom: 22 }}>
              <Kicker>{sw ? "Lugha" : "Languages"}</Kicker>
              <div style={{ fontSize: 12, lineHeight: 1.8, color: "#3f362e" }}>
                {languages.map((l) => (
                  <div key={l.id}>{l.name} — {l.proficiency}</div>
                ))}
              </div>
            </div>
          )}

          {hobbies && !hidden("hobbies") && (
            <div>
              <Kicker>{sw ? "Mapendeleo" : "Interests"}</Kicker>
              <p style={{ fontSize: 11.5, lineHeight: 1.7, color: "#3f362e", margin: 0 }}>{hobbies}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
