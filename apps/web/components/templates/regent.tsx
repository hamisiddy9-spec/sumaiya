import React from "react";
import {
  IcoEmail, IcoPhone, IcoPin, IcoLinkedIn, IcoGlobe,
  fmtDate, dateRange, CVData,
  visibleSkills,
  CvPhoto,
} from "@/components/templates/template-utils";
import type { Lang } from "@/lib/i18n/translations";

interface Props {
  data: CVData;
  primaryColor: string;
  fontFamily: string;
  lang?: Lang;
}

const SERIF = "Georgia, 'Times New Roman', Times, serif";
const GOLD = "#B08D3B";

/**
 * Regent — an executive template. A filled colour header carries a serif name
 * over a thin gold rule, then a formal two-column body (experience left,
 * credentials right). Restrained, senior, boardroom-ready.
 */
export function RegentTemplate({ data, primaryColor, fontFamily, lang = "en" }: Props) {
  const { personal, summary, experience, education, skills, languages, certifications, referees, hobbies } = data;
  const hidden = (k: string) => data.hiddenSections?.includes(k) ?? false;
  const sw = lang === "sw";
  const body = fontFamily || "'Inter', 'Helvetica Neue', Arial, sans-serif";

  const MainHead = ({ children }: { children: React.ReactNode }) => (
    <div style={{ fontFamily: SERIF, fontSize: 13, fontWeight: 700, color: primaryColor, letterSpacing: "0.04em", textTransform: "uppercase", borderBottom: `1.5px solid ${primaryColor}`, paddingBottom: 5, marginBottom: 11 }}>{children}</div>
  );
  const SideHead = ({ children }: { children: React.ReactNode }) => (
    <div style={{ fontFamily: SERIF, fontSize: 11.5, fontWeight: 700, color: primaryColor, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 9 }}>{children}</div>
  );

  return (
    <div style={{ width: 794, minHeight: 1123, backgroundColor: "#ffffff", fontFamily: body, color: "#2a2a2a", boxSizing: "border-box" }}>
      {/* Header */}
      <div style={{ background: primaryColor, color: "#fff", padding: "34px 48px 26px", display: "flex", alignItems: "center", gap: 26 }}>
        <CvPhoto url={personal.photo} name={personal.fullName} size={96} radius={50} borderColor={GOLD} borderWidth={2} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: SERIF, fontSize: 38, fontWeight: 700, letterSpacing: "0.01em", lineHeight: 1.05 }}>{personal.fullName}</div>
          {personal.jobTitle && <div style={{ fontSize: 13, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.88)", marginTop: 8 }}>{personal.jobTitle}</div>}
          <div style={{ height: 2, width: 64, background: GOLD, margin: "16px 0 0" }} />
        </div>
      </div>

      {/* Contact strip */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "5px 22px", padding: "12px 48px", borderBottom: "1px solid #e5e7eb", background: "#fafafa" }}>
        {personal.email && <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 10, color: "#4b5563" }}><IcoEmail size={11} color={primaryColor} />{personal.email}</span>}
        {personal.phone && <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 10, color: "#4b5563" }}><IcoPhone size={11} color={primaryColor} />{personal.phone}</span>}
        {personal.location && <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 10, color: "#4b5563" }}><IcoPin size={11} color={primaryColor} />{personal.location}</span>}
        {personal.linkedin && <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 10, color: "#4b5563" }}><IcoLinkedIn size={11} color={primaryColor} />{personal.linkedin}</span>}
        {personal.website && <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 10, color: "#4b5563" }}><IcoGlobe size={11} color={primaryColor} />{personal.website}</span>}
      </div>

      <div style={{ display: "flex", padding: "26px 48px 40px", gap: 34 }}>
        {/* Main */}
        <div style={{ flex: 1.7, minWidth: 0 }}>
          {summary && !hidden("summary") && (
            <section style={{ marginBottom: 22 }}>
              <MainHead>{sw ? "Wasifu" : "Executive Summary"}</MainHead>
              <p style={{ fontSize: 11, lineHeight: 1.75, color: "#3f3f3f", margin: 0 }}>{summary}</p>
            </section>
          )}
          {experience?.length > 0 && !hidden("experience") && (
            <section>
              <MainHead>{sw ? "Uzoefu wa Kazi" : "Professional Experience"}</MainHead>
              <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
                {experience.map((exp) => (
                  <div key={exp.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                      <span style={{ fontFamily: SERIF, fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>{exp.position}</span>
                      <span style={{ fontSize: 9.5, color: "#8a8a8a", whiteSpace: "nowrap" }}>{dateRange(exp.startDate, exp.endDate, exp.current)}</span>
                    </div>
                    <div style={{ fontSize: 11, color: primaryColor, fontWeight: 600, fontStyle: "italic", margin: "1px 0 5px" }}>{exp.company}{exp.location && <span style={{ color: "#9a9a9a" }}> — {exp.location}</span>}</div>
                    {exp.description && exp.description.split("\n").filter(Boolean).map((l, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, marginBottom: 3 }}>
                        <span style={{ color: GOLD, fontSize: 10, flexShrink: 0 }}>◆</span>
                        <span style={{ fontSize: 10.5, color: "#3f3f3f", lineHeight: 1.6 }}>{l}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Side */}
        <div style={{ flex: 1, minWidth: 0, borderLeft: "1px solid #e5e7eb", paddingLeft: 28 }}>
          {education?.length > 0 && !hidden("education") && (
            <section style={{ marginBottom: 22 }}>
              <SideHead>{sw ? "Elimu" : "Education"}</SideHead>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {education.map((edu) => (
                  <div key={edu.id}>
                    <div style={{ fontFamily: SERIF, fontSize: 12, fontWeight: 700, color: "#1a1a1a" }}>{edu.institution}</div>
                    <div style={{ fontSize: 10.5, color: "#4b5563" }}>{edu.degree}{edu.field ? `, ${edu.field}` : ""}</div>
                    <div style={{ fontSize: 9.5, color: "#9a9a9a" }}>{dateRange(edu.startDate, edu.endDate, false)}{edu.grade ? ` · ${edu.grade}` : ""}</div>
                  </div>
                ))}
              </div>
            </section>
          )}
          {skills?.length > 0 && !hidden("skills") && (
            <section style={{ marginBottom: 22 }}>
              <SideHead>{sw ? "Ujuzi" : "Core Competencies"}</SideHead>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {visibleSkills(skills).map((s) => (
                  <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 10.5, color: "#3f3f3f" }}>
                    <span style={{ width: 4, height: 4, borderRadius: "50%", background: GOLD, flexShrink: 0 }} />{s.name}
                  </div>
                ))}
              </div>
            </section>
          )}
          {languages?.length > 0 && !hidden("languages") && (
            <section style={{ marginBottom: 22 }}>
              <SideHead>{sw ? "Lugha" : "Languages"}</SideHead>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {languages.map((l) => (
                  <div key={l.id} style={{ fontSize: 10.5, color: "#3f3f3f" }}><span style={{ fontWeight: 600 }}>{l.name}</span> <span style={{ color: "#9a9a9a" }}>· {l.proficiency}</span></div>
                ))}
              </div>
            </section>
          )}
          {certifications?.length > 0 && !hidden("certifications") && (
            <section style={{ marginBottom: 22 }}>
              <SideHead>{sw ? "Vyeti" : "Certifications"}</SideHead>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {certifications.map((c) => (
                  <div key={c.id}>
                    <div style={{ fontSize: 10.5, fontWeight: 600, color: "#1a1a1a" }}>{c.name}</div>
                    <div style={{ fontSize: 9.5, color: "#7a7a7a" }}>{c.issuer}{c.date ? ` · ${fmtDate(c.date)}` : ""}</div>
                  </div>
                ))}
              </div>
            </section>
          )}
          {referees?.length > 0 && !hidden("referees") && (
            <section style={{ marginBottom: 22 }}>
              <SideHead>{sw ? "Wadhamini" : "Referees"}</SideHead>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {referees.map((r) => (
                  <div key={r.id}>
                    <div style={{ fontSize: 10.5, fontWeight: 600, color: "#1a1a1a" }}>{r.name}</div>
                    {(r.title || r.company) && <div style={{ fontSize: 9.5, color: primaryColor }}>{r.title}{r.title && r.company ? " · " : ""}{r.company}</div>}
                    {r.email && <div style={{ fontSize: 9.5, color: "#7a7a7a" }}>{r.email}</div>}
                    {r.phone && <div style={{ fontSize: 9.5, color: "#7a7a7a" }}>{r.phone}</div>}
                  </div>
                ))}
              </div>
            </section>
          )}
          {hobbies && !hidden("hobbies") && (
            <section>
              <SideHead>{sw ? "Mapendeleo" : "Interests"}</SideHead>
              <p style={{ fontSize: 10.5, color: "#3f3f3f", lineHeight: 1.6, margin: 0 }}>{hobbies}</p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
