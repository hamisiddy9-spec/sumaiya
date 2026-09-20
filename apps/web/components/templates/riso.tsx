import React from "react";
import { dateRange, fmtDate, CVData, visibleSkills, CvPhoto } from "@/components/templates/template-utils";
import type { Lang } from "@/lib/i18n/translations";

interface Props {
  data: CVData;
  primaryColor: string;
  fontFamily: string;
  lang?: Lang;
}

const PAPER = "#FAF6EC";
const INK = "#1A1815";
const MONO = "ui-monospace, 'SF Mono', Menlo, Consolas, monospace";

/**
 * Riso — a risograph-style colour-field poster. A misregistered offset colour
 * block behind the header, an oversized name, and big numbered section markers.
 * Built from flat solid blocks (no blend modes — which the html2canvas exporter
 * drops), so the print-poster energy survives export. Loud and editorial.
 */
export function RisoTemplate({ data, primaryColor, fontFamily, lang = "en" }: Props) {
  const { personal, summary, experience, education, skills, languages, certifications, referees, hobbies } = data;
  const hidden = (k: string) => data.hiddenSections?.includes(k) ?? false;
  const sw = lang === "sw";
  const body = fontFamily || "'Inter', 'Helvetica Neue', Arial, sans-serif";

  let n = 0;
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => {
    n += 1;
    return (
      <div style={{ display: "flex", gap: 16, marginBottom: 22 }}>
        <div style={{ width: 52, flexShrink: 0 }}>
          <div style={{ fontSize: 40, fontWeight: 900, color: primaryColor, lineHeight: 0.9, letterSpacing: "-0.04em" }}>{String(n).padStart(2, "0")}</div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: INK, marginBottom: 9, paddingBottom: 6, borderBottom: `2px solid ${INK}` }}>{title}</div>
          {children}
        </div>
      </div>
    );
  };

  return (
    <div style={{ width: 794, minHeight: 1123, backgroundColor: PAPER, fontFamily: body, color: INK, padding: "34px 40px 40px", boxSizing: "border-box" }}>
      {/* Poster header with misregistered offset block */}
      <div style={{ position: "relative", marginBottom: 30, paddingTop: 6 }}>
        <div style={{ position: "absolute", left: 8, top: 14, right: -4, height: 118, background: primaryColor, opacity: 0.28 }} />
        <div style={{ position: "relative", background: primaryColor, padding: "20px 24px", minHeight: 104, boxSizing: "border-box", display: "flex", alignItems: "center", gap: 20 }}>
          <CvPhoto url={personal.photo} name={personal.fullName} size={78} radius={0} borderColor={PAPER} borderWidth={3} />
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 0 }}>
            <div style={{ fontSize: 46, fontWeight: 900, color: PAPER, lineHeight: 0.95, letterSpacing: "-0.03em", textTransform: "uppercase" }}>{personal.fullName}</div>
            {personal.jobTitle && <div style={{ fontFamily: MONO, fontSize: 12, color: PAPER, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 8, opacity: 0.95 }}>{personal.jobTitle}</div>}
          </div>
        </div>
      </div>

      <div style={{ fontFamily: MONO, fontSize: 10.5, color: INK, marginBottom: 26, lineHeight: 1.8 }}>
        {[personal.email, personal.phone, personal.location, personal.linkedin, personal.website].filter(Boolean).join("   /   ")}
      </div>

      {summary && !hidden("summary") && (
        <Section title={sw ? "Muhtasari" : "Profile"}>
          <p style={{ fontSize: 11.5, lineHeight: 1.7, color: "#333", margin: 0 }}>{summary}</p>
        </Section>
      )}

      {experience?.length > 0 && !hidden("experience") && (
        <Section title={sw ? "Uzoefu wa Kazi" : "Experience"}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {experience.map((exp) => (
              <div key={exp.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: INK }}>{exp.position}</span>
                  <span style={{ fontFamily: MONO, fontSize: 9.5, color: "#666", whiteSpace: "nowrap" }}>{dateRange(exp.startDate, exp.endDate, exp.current)}</span>
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: primaryColor, margin: "1px 0 5px" }}>{exp.company}{exp.location && <span style={{ color: "#888", fontWeight: 400 }}> — {exp.location}</span>}</div>
                {exp.description && exp.description.split("\n").filter(Boolean).map((l, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: 3 }}>
                    <span style={{ color: primaryColor, fontWeight: 900, flexShrink: 0 }}>+</span>
                    <span style={{ fontSize: 10.5, color: "#333", lineHeight: 1.55 }}>{l}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Section>
      )}

      {education?.length > 0 && !hidden("education") && (
        <Section title={sw ? "Elimu" : "Education"}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {education.map((edu) => (
              <div key={edu.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: INK }}>{edu.institution}</span>
                  <span style={{ fontFamily: MONO, fontSize: 9.5, color: "#666", whiteSpace: "nowrap" }}>{dateRange(edu.startDate, edu.endDate, false)}</span>
                </div>
                <div style={{ fontSize: 11, color: "#333" }}>{edu.degree}{edu.field ? `, ${edu.field}` : ""}{edu.grade ? ` · ${edu.grade}` : ""}</div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {skills?.length > 0 && !hidden("skills") && (
        <Section title={sw ? "Ujuzi" : "Skills"}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 8px" }}>
            {visibleSkills(skills).map((s) => (
              <span key={s.id} style={{ fontFamily: MONO, fontSize: 10, color: INK, border: `1.5px solid ${INK}`, padding: "3px 9px" }}>{s.name}</span>
            ))}
          </div>
        </Section>
      )}

      {(languages?.length > 0 || certifications?.length > 0 || hobbies) && (
        <Section title={sw ? "Zaidi" : "More"}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {languages?.length > 0 && !hidden("languages") && (
              <div style={{ fontSize: 10.5, color: "#333" }}><span style={{ fontFamily: MONO, fontWeight: 700, color: INK }}>{sw ? "LUGHA" : "LANGUAGES"} </span>{languages.map((l) => `${l.name} (${l.proficiency})`).join(" · ")}</div>
            )}
            {certifications?.length > 0 && !hidden("certifications") && (
              <div style={{ fontSize: 10.5, color: "#333" }}><span style={{ fontFamily: MONO, fontWeight: 700, color: INK }}>{sw ? "VYETI" : "CERTS"} </span>{certifications.map((c) => `${c.name}${c.date ? ` (${fmtDate(c.date)})` : ""}`).join(" · ")}</div>
            )}
            {hobbies && !hidden("hobbies") && (
              <div style={{ fontSize: 10.5, color: "#333" }}><span style={{ fontFamily: MONO, fontWeight: 700, color: INK }}>{sw ? "MAPENDELEO" : "INTERESTS"} </span>{hobbies}</div>
            )}
          </div>
        </Section>
      )}

      {referees?.length > 0 && !hidden("referees") && (
        <Section title={sw ? "Wadhamini" : "Referees"}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px 20px" }}>
            {referees.map((r) => (
              <div key={r.id} style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: INK }}>{r.name}</div>
                {(r.title || r.company) && <div style={{ fontSize: 10.5, fontWeight: 700, color: primaryColor }}>{r.title}{r.title && r.company ? " · " : ""}{r.company}</div>}
                {r.email && <div style={{ fontFamily: MONO, fontSize: 9.5, color: "#666" }}>{r.email}</div>}
                {r.phone && <div style={{ fontFamily: MONO, fontSize: 9.5, color: "#666" }}>{r.phone}</div>}
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
