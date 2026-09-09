import React from "react";
import {
  IcoEmail, IcoPhone, IcoPin, IcoLinkedIn, IcoGlobe,
  fmtDate, dateRange, CVData,
  visibleSkills,
} from "@/components/templates/template-utils";
import type { Lang } from "@/lib/i18n/translations";

interface Props {
  data: CVData;
  primaryColor: string;
  fontFamily: string;
  lang?: Lang;
}

const PROF: Record<string, number> = { Native: 5, Fluent: 4, Advanced: 4, Intermediate: 3, Basic: 2 };

/**
 * Haven — clean, calm and approachable. A soft tinted header, rounded accent
 * chips and gentle spacing. Made for caring and people-facing roles — nursing,
 * teaching, administration, hospitality — where warmth reads better than edge.
 */
export function HavenTemplate({ data, primaryColor, fontFamily, lang = "en" }: Props) {
  const { personal, summary, experience, education, skills, languages, certifications, referees, hobbies } = data;
  const hidden = (k: string) => data.hiddenSections?.includes(k) ?? false;
  const sw = lang === "sw";
  const body = fontFamily || "'Inter', 'Helvetica Neue', Arial, sans-serif";
  const tint = `${primaryColor}12`;

  const Head = ({ children }: { children: React.ReactNode }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: primaryColor }} />
      <span style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: "0.03em", color: primaryColor }}>{children}</span>
    </div>
  );

  return (
    <div style={{ width: 794, minHeight: 1123, backgroundColor: "#ffffff", fontFamily: body, color: "#3d3d3d", padding: 30, boxSizing: "border-box" }}>
      {/* Soft header */}
      <div style={{ background: tint, borderRadius: 20, padding: "26px 30px", marginBottom: 22 }}>
        <div style={{ fontSize: 30, fontWeight: 700, color: "#2a2a2a", letterSpacing: "-0.01em", lineHeight: 1.1 }}>{personal.fullName}</div>
        {personal.jobTitle && <div style={{ fontSize: 13, color: primaryColor, fontWeight: 600, marginTop: 5 }}>{personal.jobTitle}</div>}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "5px 18px", marginTop: 12 }}>
          {personal.email && <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 10, color: "#5a5a5a" }}><IcoEmail size={11} color={primaryColor} />{personal.email}</span>}
          {personal.phone && <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 10, color: "#5a5a5a" }}><IcoPhone size={11} color={primaryColor} />{personal.phone}</span>}
          {personal.location && <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 10, color: "#5a5a5a" }}><IcoPin size={11} color={primaryColor} />{personal.location}</span>}
          {personal.linkedin && <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 10, color: "#5a5a5a" }}><IcoLinkedIn size={11} color={primaryColor} />{personal.linkedin}</span>}
          {personal.website && <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 10, color: "#5a5a5a" }}><IcoGlobe size={11} color={primaryColor} />{personal.website}</span>}
        </div>
      </div>

      <div style={{ display: "flex", gap: 30 }}>
        <div style={{ flex: 1.7, minWidth: 0 }}>
          {summary && !hidden("summary") && (
            <section style={{ marginBottom: 22 }}>
              <Head>{sw ? "Kuhusu Mimi" : "About Me"}</Head>
              <p style={{ fontSize: 11, lineHeight: 1.75, color: "#4d4d4d", margin: 0 }}>{summary}</p>
            </section>
          )}
          {experience?.length > 0 && !hidden("experience") && (
            <section style={{ marginBottom: 22 }}>
              <Head>{sw ? "Uzoefu wa Kazi" : "Experience"}</Head>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {experience.map((exp) => (
                  <div key={exp.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: "#2a2a2a" }}>{exp.position}</span>
                      <span style={{ fontSize: 9.5, color: primaryColor, background: tint, padding: "2px 9px", borderRadius: 20, whiteSpace: "nowrap" }}>{dateRange(exp.startDate, exp.endDate, exp.current)}</span>
                    </div>
                    <div style={{ fontSize: 11, color: primaryColor, fontWeight: 600, margin: "1px 0 5px" }}>{exp.company}{exp.location && <span style={{ color: "#9a9a9a", fontWeight: 400 }}> · {exp.location}</span>}</div>
                    {exp.description && exp.description.split("\n").filter(Boolean).map((l, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, marginBottom: 3 }}>
                        <span style={{ color: primaryColor, fontSize: 12, lineHeight: 1.4, flexShrink: 0 }}>·</span>
                        <span style={{ fontSize: 10.5, color: "#4d4d4d", lineHeight: 1.6 }}>{l}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </section>
          )}
          {education?.length > 0 && !hidden("education") && (
            <section>
              <Head>{sw ? "Elimu" : "Education"}</Head>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {education.map((edu) => (
                  <div key={edu.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#2a2a2a" }}>{edu.institution}</span>
                      <span style={{ fontSize: 9.5, color: "#9a9a9a", whiteSpace: "nowrap" }}>{dateRange(edu.startDate, edu.endDate, false)}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#4d4d4d" }}>{edu.degree}{edu.field ? `, ${edu.field}` : ""}{edu.grade ? ` · ${edu.grade}` : ""}</div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {skills?.length > 0 && !hidden("skills") && (
            <section style={{ marginBottom: 22 }}>
              <Head>{sw ? "Ujuzi" : "Skills"}</Head>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {visibleSkills(skills).map((s) => (
                  <span key={s.id} style={{ fontSize: 10, color: primaryColor, background: tint, borderRadius: 20, padding: "4px 11px" }}>{s.name}</span>
                ))}
              </div>
            </section>
          )}
          {languages?.length > 0 && !hidden("languages") && (
            <section style={{ marginBottom: 22 }}>
              <Head>{sw ? "Lugha" : "Languages"}</Head>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {languages.map((l) => (
                  <div key={l.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "#4d4d4d", marginBottom: 4 }}><span>{l.name}</span><span style={{ color: "#9a9a9a" }}>{l.proficiency}</span></div>
                    <div style={{ height: 5, borderRadius: 3, background: tint }}>
                      <div style={{ width: `${((PROF[l.proficiency] ?? 3) / 5) * 100}%`, height: "100%", borderRadius: 3, background: primaryColor }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
          {certifications?.length > 0 && !hidden("certifications") && (
            <section style={{ marginBottom: 22 }}>
              <Head>{sw ? "Vyeti" : "Certifications"}</Head>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {certifications.map((c) => (
                  <div key={c.id}>
                    <div style={{ fontSize: 10.5, fontWeight: 600, color: "#2a2a2a" }}>{c.name}</div>
                    <div style={{ fontSize: 9.5, color: "#7a7a7a" }}>{c.issuer}{c.date ? ` · ${fmtDate(c.date)}` : ""}</div>
                  </div>
                ))}
              </div>
            </section>
          )}
          {referees?.length > 0 && !hidden("referees") && (
            <section style={{ marginBottom: 22 }}>
              <Head>{sw ? "Wadhamini" : "Referees"}</Head>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {referees.map((r) => (
                  <div key={r.id}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#2a2a2a" }}>{r.name}</div>
                    {(r.title || r.company) && <div style={{ fontSize: 10, color: primaryColor, fontWeight: 600 }}>{r.title}{r.title && r.company ? " · " : ""}{r.company}</div>}
                    {r.email && <div style={{ fontSize: 9.5, color: "#7a7a7a" }}>{r.email}</div>}
                    {r.phone && <div style={{ fontSize: 9.5, color: "#7a7a7a" }}>{r.phone}</div>}
                  </div>
                ))}
              </div>
            </section>
          )}
          {hobbies && !hidden("hobbies") && (
            <section>
              <Head>{sw ? "Mapendeleo" : "Interests"}</Head>
              <p style={{ fontSize: 10.5, color: "#4d4d4d", lineHeight: 1.6, margin: 0 }}>{hobbies}</p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
