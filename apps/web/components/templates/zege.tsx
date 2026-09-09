import React from "react";
import { dateRange, fmtDate, CVData, visibleSkills } from "@/components/templates/template-utils";
import type { Lang } from "@/lib/i18n/translations";

interface Props {
  data: CVData;
  primaryColor: string;
  fontFamily: string;
  lang?: Lang;
}

const INK = "#111111";
const MONO = "ui-monospace, 'SF Mono', Menlo, Consolas, monospace";

/**
 * Zege ("concrete") — neo-brutalist. Thick black borders, oversized type, and
 * one loud accent. The hard offset "shadow" is drawn as a real solid rectangle
 * behind each block (not a CSS box-shadow, which the html2canvas exporter
 * mis-renders and bleeds into neighbours) — so it survives the PDF export
 * cleanly with no overlapping boxes.
 */
export function ZegeTemplate({ data, primaryColor, fontFamily, lang = "en" }: Props) {
  const { personal, summary, experience, education, skills, languages, certifications, referees, hobbies } = data;
  const hidden = (k: string) => data.hiddenSections?.includes(k) ?? false;
  const sw = lang === "sw";
  const body = fontFamily || "'Inter', 'Helvetica Neue', Arial, sans-serif";

  // A bordered block sitting on a solid offset shadow-rect. The wrapper reserves
  // the 6px the shadow peeks to the bottom-right so neighbours never collide.
  const Shadowed = ({ children }: { children: React.ReactNode }) => (
    <div style={{ position: "relative", paddingRight: 6, paddingBottom: 6, boxSizing: "border-box" }}>
      <div style={{ position: "absolute", top: 6, left: 6, right: 0, bottom: 0, background: INK }} />
      <div style={{ position: "relative", border: `2.5px solid ${INK}`, background: "#fff", padding: 16, boxSizing: "border-box" }}>{children}</div>
    </div>
  );

  const Tag = ({ children }: { children: React.ReactNode }) => (
    <div style={{ display: "inline-block", background: primaryColor, color: "#fff", border: `2.5px solid ${INK}`, padding: "5px 12px", fontFamily: MONO, fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>{children}</div>
  );

  return (
    <div style={{ width: 794, minHeight: 1123, backgroundColor: "#FBFAF7", fontFamily: body, color: INK, padding: 30, boxSizing: "border-box" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 42, fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.0, textTransform: "uppercase", overflowWrap: "anywhere" }}>{personal.fullName}</div>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, marginTop: 12 }}>
          {personal.jobTitle && (
            <span style={{ background: primaryColor, color: "#fff", border: `2.5px solid ${INK}`, padding: "6px 14px", fontWeight: 800, fontSize: 13.5, letterSpacing: "0.02em" }}>{personal.jobTitle}</span>
          )}
          <span style={{ fontFamily: MONO, fontSize: 10, lineHeight: 1.6, overflowWrap: "anywhere", flex: 1, minWidth: 0 }}>
            {[personal.email, personal.phone, personal.location, personal.linkedin, personal.website].filter(Boolean).join("  ·  ")}
          </span>
        </div>
      </div>

      {summary && !hidden("summary") && (
        <div style={{ marginBottom: 20 }}>
          <Shadowed>
            <p style={{ fontSize: 11.5, lineHeight: 1.65, margin: 0 }}>{summary}</p>
          </Shadowed>
        </div>
      )}

      {experience?.length > 0 && !hidden("experience") && (
        <div style={{ marginBottom: 22 }}>
          <Tag>{sw ? "Uzoefu wa Kazi" : "Experience"}</Tag>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {experience.map((exp) => (
              <Shadowed key={exp.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ fontSize: 14, fontWeight: 800 }}>{exp.position}</div>
                  <div style={{ fontFamily: MONO, fontSize: 9.5, background: INK, color: "#fff", padding: "3px 8px", whiteSpace: "nowrap", flexShrink: 0 }}>{dateRange(exp.startDate, exp.endDate, exp.current)}</div>
                </div>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: primaryColor, margin: "2px 0 6px" }}>{exp.company}{exp.location && <span style={{ color: "#555", fontWeight: 400 }}> / {exp.location}</span>}</div>
                {exp.description && exp.description.split("\n").filter(Boolean).map((l, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: 3 }}>
                    <span style={{ color: primaryColor, fontWeight: 900, flexShrink: 0 }}>■</span>
                    <span style={{ fontSize: 10.5, lineHeight: 1.55, color: "#222" }}>{l}</span>
                  </div>
                ))}
              </Shadowed>
            ))}
          </div>
        </div>
      )}

      {/* Two columns: education + skills */}
      <div style={{ display: "flex", gap: 18, alignItems: "flex-start", marginBottom: 22 }}>
        {education?.length > 0 && !hidden("education") && (
          <div style={{ flex: 1.2, minWidth: 0 }}>
            <Tag>{sw ? "Elimu" : "Education"}</Tag>
            <Shadowed>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {education.map((edu) => (
                  <div key={edu.id}>
                    <div style={{ fontSize: 12.5, fontWeight: 800 }}>{edu.institution}</div>
                    <div style={{ fontSize: 11, color: "#222" }}>{edu.degree}{edu.field ? `, ${edu.field}` : ""}</div>
                    <div style={{ fontFamily: MONO, fontSize: 9.5, color: "#555" }}>{dateRange(edu.startDate, edu.endDate, false)}{edu.grade ? ` · ${edu.grade}` : ""}</div>
                  </div>
                ))}
              </div>
            </Shadowed>
          </div>
        )}
        {skills?.length > 0 && !hidden("skills") && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <Tag>{sw ? "Ujuzi" : "Skills"}</Tag>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {visibleSkills(skills).map((s) => (
                <span key={s.id} style={{ border: `2px solid ${INK}`, background: `${primaryColor}1f`, padding: "4px 10px", fontSize: 10.5, fontWeight: 700 }}>{s.name}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Languages / certs / interests */}
      <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
        {languages?.length > 0 && !hidden("languages") && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <Tag>{sw ? "Lugha" : "Languages"}</Tag>
            <div style={{ fontFamily: MONO, fontSize: 11, lineHeight: 1.8 }}>
              {languages.map((l) => (
                <div key={l.id}><span style={{ fontWeight: 700 }}>{l.name}</span> = {l.proficiency}</div>
              ))}
            </div>
          </div>
        )}
        {(certifications?.length > 0 || hobbies) && (
          <div style={{ flex: 1.2, minWidth: 0 }}>
            <Tag>{sw ? "Vyeti" : "Certifications"}</Tag>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {certifications.map((c) => (
                <div key={c.id} style={{ fontSize: 10.5 }}><span style={{ fontWeight: 700 }}>{c.name}</span>{c.issuer ? ` / ${c.issuer}` : ""}{c.date ? <span style={{ fontFamily: MONO, color: "#555" }}> {fmtDate(c.date)}</span> : null}</div>
              ))}
              {hobbies && !hidden("hobbies") && <div style={{ fontSize: 10.5, color: "#222", marginTop: certifications?.length ? 6 : 0 }}>{hobbies}</div>}
            </div>
          </div>
        )}
      </div>

      {referees?.length > 0 && !hidden("referees") && (
        <div style={{ marginTop: 22 }}>
          <Tag>{sw ? "Wadhamini" : "Referees"}</Tag>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 18 }}>
            {referees.map((r) => (
              <div key={r.id} style={{ flex: 1, minWidth: 220 }}>
                <Shadowed>
                  <div style={{ fontSize: 12.5, fontWeight: 800 }}>{r.name}</div>
                  {(r.title || r.company) && <div style={{ fontSize: 11, fontWeight: 700, color: primaryColor }}>{r.title}{r.title && r.company ? " · " : ""}{r.company}</div>}
                  {r.email && <div style={{ fontFamily: MONO, fontSize: 9.5, color: "#555" }}>{r.email}</div>}
                  {r.phone && <div style={{ fontFamily: MONO, fontSize: 9.5, color: "#555" }}>{r.phone}</div>}
                </Shadowed>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
