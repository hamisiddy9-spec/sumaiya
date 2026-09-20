import {
  IcoEmail, IcoPhone, IcoPin, IcoLinkedIn, IcoGlobe,
  SkillDots,
  fmtDate, dateRange,
  CvPhoto,
} from "@/components/templates/template-utils";
import { visibleSkills } from "@/components/templates/template-utils";
import type { CVData } from "@/components/templates/template-utils";
import type { Lang } from "@/lib/i18n/translations";

const PROF: Record<string, number> = { Native: 5, Fluent: 4, Advanced: 3, Intermediate: 2, Basic: 1 };

// Serif section label — small caps, spaced, with full-width underline
function SectionHeader({ title, primaryColor }: { title: string; primaryColor: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <p style={{
        fontSize: 10,
        fontWeight: 400,
        fontVariant: "small-caps",
        letterSpacing: "0.28em",
        textTransform: "uppercase" as const,
        color: primaryColor,
        margin: "0 0 5px",
        fontFamily: "Georgia, 'Times New Roman', Times, serif",
      }}>
        {title}
      </p>
      <div style={{ height: 1, backgroundColor: primaryColor, opacity: 0.35 }} />
    </div>
  );
}

export function VictoriaTemplate({ data, primaryColor, fontFamily, lang = "en" }: { data: CVData; primaryColor: string; fontFamily: string; lang?: Lang }) {
  const { personal, summary, experience, education, skills, languages, certifications, referees, hobbies } = data;
  const sw = lang === "sw";
  const hidden = data.hiddenSections ?? [];
  const serifFont = "Georgia, 'Times New Roman', Times, serif";

  // Contact items as inline text fragments
  const contactParts: string[] = [];
  if (personal.email) contactParts.push(personal.email);
  if (personal.phone) contactParts.push(personal.phone);
  if (personal.location) contactParts.push(personal.location);
  if (personal.linkedin) contactParts.push(personal.linkedin);
  if (personal.website) contactParts.push(personal.website);

  return (
    <div style={{
      width: 794,
      minHeight: 1123,
      fontFamily: serifFont,
      backgroundColor: "#fff",
      boxSizing: "border-box" as const,
    }}>

      {/* ── PRESTIGE HEADER ─────────────────────────────────────────────── */}
      <div style={{ padding: "52px 72px 28px", textAlign: "center" as const }}>

        {/* Thin rule above name */}
        <div style={{ height: 1, backgroundColor: "#1e293b", marginBottom: 20 }} />

        {/* Name */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <CvPhoto url={personal.photo} name={personal.fullName} size={92} radius={50} borderColor={primaryColor} borderWidth={2} style={{ marginBottom: personal.photo ? 16 : 0 }} />
        </div>
        <p style={{
          fontSize: 36,
          fontWeight: 400,
          color: "#0f172a",
          fontVariant: "small-caps",
          letterSpacing: "0.06em",
          margin: "0 0 8px",
          lineHeight: 1.1,
          fontFamily: serifFont,
        }}>
          {personal.fullName}
        </p>

        {/* Job title */}
        <p style={{
          fontSize: 11,
          fontWeight: 400,
          color: primaryColor,
          letterSpacing: "0.32em",
          textTransform: "uppercase" as const,
          margin: "0 0 18px",
          fontFamily: serifFont,
        }}>
          {personal.jobTitle}
        </p>

        {/* Thin rule below name */}
        <div style={{ height: 1, backgroundColor: "#1e293b", marginBottom: 14 }} />

        {/* Contact details — one line, centered, bullet-separated */}
        {contactParts.length > 0 && (
          <p style={{
            fontSize: 9.5,
            color: "#6b7280",
            margin: 0,
            letterSpacing: "0.02em",
            lineHeight: 1.5,
            fontFamily: serifFont,
          }}>
            {contactParts.map((part, i) => (
              <span key={i}>
                {i > 0 && <span style={{ margin: "0 8px", color: "#d1d5db" }}>·</span>}
                {part}
              </span>
            ))}
          </p>
        )}
      </div>

      {/* ── BODY ─────────────────────────────────────────────────────────── */}
      <div style={{ padding: "0 72px 52px", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Summary */}
        {!hidden.includes("summary") && summary && (
          <div>
            <SectionHeader title={sw ? "Muhtasari" : "Professional Summary"} primaryColor={primaryColor} />
            <p style={{
              fontSize: 11,
              color: "#374151",
              lineHeight: 1.85,
              margin: 0,
              fontFamily: serifFont,
              textAlign: "justify" as const,
            }}>
              {summary}
            </p>
          </div>
        )}

        {/* Experience */}
        {!hidden.includes("experience") && experience.length > 0 && (
          <div>
            <SectionHeader title={sw ? "Uzoefu wa Kazi" : "Professional Experience"} primaryColor={primaryColor} />
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {experience.map((exp) => (
                <div key={exp.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
                    <p style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#0f172a",
                      margin: 0,
                      fontFamily: serifFont,
                    }}>
                      {exp.company}
                      {exp.location ? <span style={{ fontWeight: 400, color: "#6b7280", fontSize: 10.5 }}> — {exp.location}</span> : null}
                    </p>
                    <span style={{
                      fontSize: 9.5,
                      color: "#6b7280",
                      fontStyle: "italic",
                      fontVariant: "small-caps",
                      letterSpacing: "0.04em",
                      whiteSpace: "nowrap" as const,
                      marginLeft: 12,
                      flexShrink: 0,
                      fontFamily: serifFont,
                    }}>
                      {dateRange(exp.startDate, exp.endDate, exp.current)}
                    </span>
                  </div>
                  <p style={{
                    fontSize: 10.5,
                    color: primaryColor,
                    margin: "0 0 6px",
                    fontStyle: "italic",
                    fontFamily: serifFont,
                  }}>
                    {exp.position}
                  </p>
                  {exp.description && (
                    <div>
                      {exp.description.split("\n").filter(Boolean).map((line, i) => (
                        <div key={i} style={{ display: "flex", gap: 8, marginBottom: 3 }}>
                          <span style={{ color: "#9ca3af", fontSize: 9, flexShrink: 0, marginTop: 2, fontFamily: serifFont }}>◆</span>
                          <span style={{ fontSize: 11, color: "#374151", lineHeight: 1.75, fontFamily: serifFont }}>
                            {line.replace(/^[-•▸]\s*/, "")}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {!hidden.includes("education") && education.length > 0 && (
          <div>
            <SectionHeader title={sw ? "Elimu" : "Education"} primaryColor={primaryColor} />
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {education.map((edu) => (
                <div key={edu.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", margin: "0 0 2px", fontFamily: serifFont }}>
                        {edu.degree}{edu.field ? ` in ${edu.field}` : ""}
                      </p>
                      <p style={{ fontSize: 10.5, color: "#6b7280", margin: 0, fontStyle: "italic", fontFamily: serifFont }}>
                        {edu.institution}
                      </p>
                      {edu.grade && (
                        <p style={{ fontSize: 10, color: "#9ca3af", margin: "2px 0 0", fontFamily: serifFont }}>Grade: {edu.grade}</p>
                      )}
                    </div>
                    <span style={{
                      fontSize: 9.5,
                      color: "#6b7280",
                      fontStyle: "italic",
                      whiteSpace: "nowrap" as const,
                      marginLeft: 12,
                      flexShrink: 0,
                      fontFamily: serifFont,
                    }}>
                      {dateRange(edu.startDate, edu.endDate, false)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills — 3-column grid */}
        {!hidden.includes("skills") && skills.length > 0 && (
          <div>
            <SectionHeader title={sw ? "Ujuzi Muhimu" : "Core Competencies"} primaryColor={primaryColor} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "9px 20px" }}>
              {visibleSkills(skills).map((skill) => (
                <div key={skill.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 10, color: "#374151", fontFamily: serifFont }}>{skill.name}</span>
                  <SkillDots level={skill.level} color={primaryColor} emptyColor="#e5e7eb" size={5.5} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Languages */}
        {!hidden.includes("languages") && languages.length > 0 && (
          <div>
            <SectionHeader title={sw ? "Lugha" : "Languages"} primaryColor={primaryColor} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "9px 20px" }}>
              {languages.map((lang) => (
                <div key={lang.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{flex: 1, minWidth: 0, borderBottom: "1px dotted currentColor", paddingBottom: 2, fontSize: 10, color: "#374151", fontFamily: serifFont}}>{lang.name}</span><span style={{flexShrink: 0, whiteSpace: "nowrap", fontSize: 9, color: "#6b7280", fontStyle: "italic", fontFamily: serifFont}}>
                    {lang.proficiency}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {!hidden.includes("certifications") && certifications.length > 0 && (
          <div>
            <SectionHeader title={sw ? "Vyeti na Leseni" : "Certifications & Licences"} primaryColor={primaryColor} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 28px" }}>
              {certifications.map((cert) => (
                <div key={cert.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <p style={{ fontSize: 10.5, fontWeight: 700, color: "#0f172a", margin: "0 0 1px", fontFamily: serifFont }}>{cert.name}</p>
                    {cert.issuer && (
                      <p style={{ fontSize: 9.5, color: "#64748b", margin: 0, fontStyle: "italic", fontFamily: serifFont }}>{cert.issuer}</p>
                    )}
                  </div>
                  {cert.date && (
                    <span style={{ fontSize: 9, color: "#9ca3af", whiteSpace: "nowrap" as const, marginLeft: 8, flexShrink: 0, fontFamily: serifFont }}>
                      {fmtDate(cert.date)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Referees — two-column grid, same style as certifications */}
        {!hidden.includes("referees") && referees.length > 0 && (
          <div>
            <SectionHeader title={sw ? "Wadhamini" : "Referees"} primaryColor={primaryColor} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 28px" }}>
              {referees.map((ref) => (
                <div key={ref.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <p style={{ fontSize: 10.5, fontWeight: 700, color: "#0f172a", margin: "0 0 1px", fontFamily: serifFont }}>{ref.name}</p>
                    {(ref.title || ref.company) && (
                      <p style={{ fontSize: 9.5, color: "#64748b", margin: 0, fontStyle: "italic", fontFamily: serifFont }}>
                        {ref.title}{ref.company ? ` — ${ref.company}` : ""}
                      </p>
                    )}
                    {(ref.email || ref.phone) && (
                      <p style={{ fontSize: 9, color: "#9ca3af", margin: "2px 0 0", fontFamily: serifFont }}>
                        {ref.email}{ref.phone ? ` · ${ref.phone}` : ""}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Interests */}
        {!hidden.includes("hobbies") && hobbies && (
          <div>
            <SectionHeader title={sw ? "Mapendeleo" : "Interests"} primaryColor={primaryColor} />
            <p style={{ fontSize: 10.5, color: "#6b7280", lineHeight: 1.75, margin: 0, fontStyle: "italic", fontFamily: serifFont }}>
              {hobbies}
            </p>
          </div>
        )}

        {/* Empty state */}
        {!summary && experience.length === 0 && education.length === 0 && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#d1d5db", fontSize: 13 }}>
            {lang === "sw" ? "Jaza fomu upande wa kushoto ili uone onyesho la CV yako" : "Fill in the form on the left to see your CV preview"}
          </div>
        )}
      </div>
    </div>
  );
}
