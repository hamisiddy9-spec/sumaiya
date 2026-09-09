import {
  IcoEmail, IcoPhone, IcoPin, IcoLinkedIn, IcoGlobe,
  PhotoCircle, ContactItem,
  fmtDate, dateRange,
  type CVData,
  visibleSkills,
} from "@/components/templates/template-utils";
import type { Lang } from "@/lib/i18n/translations";

const PROF: Record<string, number> = { Native: 5, Fluent: 4, Advanced: 3, Intermediate: 2, Basic: 1 };

// Skill chip tag — colored pill
function SkillChip({ name, primaryColor }: { name: string; primaryColor: string }) {
  return (
    <span style={{
      display: "inline-block",
      fontSize: 9,
      fontWeight: 600,
      color: primaryColor,
      backgroundColor: primaryColor + "18",
      border: `1px solid ${primaryColor}40`,
      borderRadius: 3,
      padding: "3px 8px",
      letterSpacing: "0.02em",
    }}>
      {name}
    </span>
  );
}

function RightSectionHeader({ text }: { text: string }) {
  return (
    <div style={{ marginBottom: 13 }}>
      <p style={{
        fontSize: 10,
        fontWeight: 800,
        textTransform: "uppercase" as const,
        letterSpacing: "0.12em",
        color: "#0f172a",
        margin: "0 0 6px",
      }}>
        {text}
      </p>
      <div style={{ height: 2, width: 28, backgroundColor: "#0f172a", borderRadius: 1 }} />
    </div>
  );
}

export function ZanzibarTemplate({ data, primaryColor, fontFamily, lang = "en" }: { data: CVData; primaryColor: string; fontFamily: string; lang?: Lang }) {
  const { personal, summary, experience, education, skills, languages, certifications, referees } = data;
  const hidden = (k: string) => data.hiddenSections?.includes(k) ?? false;
  const font = "'Helvetica Neue', Arial, sans-serif";

  return (
    <div style={{
      width: 794,
      minHeight: 1123,
      fontFamily: font,
      backgroundColor: "#fff",
      boxSizing: "border-box" as const,
      display: "flex",
      flexDirection: "column",
    }}>

      {/* ── BOLD COLOR HEADER BAND ─────────────────────────────────────── */}
      <div style={{
        backgroundColor: primaryColor,
        padding: "44px 48px 36px",
        position: "relative" as const,
        overflow: "hidden",
        flexShrink: 0,
      }}>
        {/* Decorative geometric accent — large circle clipped in corner */}
        <div style={{
          position: "absolute" as const,
          top: -40,
          right: -40,
          width: 180,
          height: 180,
          borderRadius: "50%",
          border: "28px solid rgba(255,255,255,0.08)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute" as const,
          bottom: -20,
          right: 60,
          width: 80,
          height: 80,
          borderRadius: "50%",
          border: "16px solid rgba(255,255,255,0.06)",
          pointerEvents: "none",
        }} />

        <p style={{
          fontSize: 46,
          fontWeight: 900,
          color: "#fff",
          margin: "0 0 6px",
          letterSpacing: "-2px",
          lineHeight: 1,
        }}>
          {personal.fullName}
        </p>
        <p style={{
          fontSize: 14,
          fontWeight: 400,
          color: "rgba(255,255,255,0.78)",
          margin: 0,
          letterSpacing: "0.06em",
          textTransform: "uppercase" as const,
        }}>
          {personal.jobTitle}
        </p>
      </div>

      {/* ── BODY: 2 ASYMMETRIC COLUMNS ──────────────────────────────────── */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "row",
      }}>

        {/* Left column — 38% */}
        <div style={{
          width: 300,
          flexShrink: 0,
          backgroundColor: "#f8fafc",
          borderRight: "1px solid #e8edf3",
          padding: "28px 22px",
          display: "flex",
          flexDirection: "column",
          gap: 24,
          boxSizing: "border-box" as const,
        }}>

          {/* Photo */}
          {personal.photo && (
            <div style={{ display: "flex", justifyContent: "center" }}>
              <PhotoCircle
                url={personal.photo}
                name={personal.fullName || "CV"}
                size={100}
                bgColor={primaryColor}
                borderColor={primaryColor}
                borderWidth={3}
              />
            </div>
          )}

          {/* Contact */}
          <div>
            <p style={{
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: "0.14em",
              textTransform: "uppercase" as const,
              color: "#64748b",
              margin: "0 0 10px",
            }}>
              Contact
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {personal.email && (
                <ContactItem icon={<IcoEmail size={10} color={primaryColor} />} text={personal.email} color="#374151" fontSize={9.5} />
              )}
              {personal.phone && (
                <ContactItem icon={<IcoPhone size={10} color={primaryColor} />} text={personal.phone} color="#374151" fontSize={9.5} />
              )}
              {personal.location && (
                <ContactItem icon={<IcoPin size={10} color={primaryColor} />} text={personal.location} color="#374151" fontSize={9.5} />
              )}
              {personal.linkedin && (
                <ContactItem icon={<IcoLinkedIn size={10} color={primaryColor} />} text={personal.linkedin} color="#374151" fontSize={9.5} />
              )}
              {personal.website && (
                <ContactItem icon={<IcoGlobe size={10} color={primaryColor} />} text={personal.website} color="#374151" fontSize={9.5} />
              )}
            </div>
          </div>

          {/* Skills as chips */}
          {skills.length > 0 && !hidden("skills") && (
            <div>
              <p style={{
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: "0.14em",
                textTransform: "uppercase" as const,
                color: "#64748b",
                margin: "0 0 10px",
              }}>
                Skills
              </p>
              <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 5 }}>
                {visibleSkills(skills).map((skill) => (
                  <span key={skill.id} style={{
                    display: "inline-block",
                    fontSize: 9,
                    fontWeight: 600,
                    color: primaryColor,
                    backgroundColor: primaryColor + "18",
                    border: `1px solid ${primaryColor}40`,
                    borderRadius: 3,
                    padding: "3px 8px",
                    letterSpacing: "0.02em",
                  }}>
                    {skill.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {languages.length > 0 && !hidden("languages") && (
            <div>
              <p style={{
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: "0.14em",
                textTransform: "uppercase" as const,
                color: "#64748b",
                margin: "0 0 10px",
              }}>
                Languages
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {languages.map((lang) => (
                  <div key={lang.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 10, color: "#1e293b", fontWeight: 600 }}>{lang.name}</span>
                    <span style={{
                      fontSize: 8.5,
                      color: primaryColor,
                      fontWeight: 700,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase" as const,
                    }}>
                      {lang.proficiency}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column — 62% */}
        <div style={{
          flex: 1,
          padding: "28px 30px",
          display: "flex",
          flexDirection: "column",
          gap: 22,
          boxSizing: "border-box" as const,
          minWidth: 0,
        }}>

          {/* Summary */}
          {summary && !hidden("summary") && (
            <div>
              <RightSectionHeader text="Profile" />
              <p style={{ fontSize: 10.5, color: "#374151", lineHeight: 1.8, margin: 0 }}>{summary}</p>
            </div>
          )}

          {/* Experience */}
          {experience.length > 0 && !hidden("experience") && (
            <div>
              <RightSectionHeader text="Experience" />
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {experience.map((exp) => (
                  <div key={exp.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 2 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 12, fontWeight: 800, color: "#0f172a", margin: "0 0 1px", lineHeight: 1.3 }}>
                          {exp.position}
                        </p>
                        <p style={{ fontSize: 10, color: "#64748b", margin: 0, fontWeight: 500 }}>
                          {exp.company}{exp.location ? ` · ${exp.location}` : ""}
                        </p>
                      </div>
                      <span style={{
                        fontSize: 9,
                        color: "#fff",
                        backgroundColor: primaryColor,
                        padding: "2px 7px",
                        borderRadius: 3,
                        whiteSpace: "nowrap" as const,
                        marginLeft: 8,
                        flexShrink: 0,
                        fontWeight: 600,
                      }}>
                        {dateRange(exp.startDate, exp.endDate, exp.current)}
                      </span>
                    </div>
                    {exp.description && (
                      <div style={{ marginTop: 5 }}>
                        {exp.description.split("\n").filter(Boolean).map((line, i) => (
                          <div key={i} style={{ display: "flex", gap: 6, marginBottom: 3 }}>
                            <span style={{ color: primaryColor, fontSize: 10, flexShrink: 0, marginTop: 1, fontWeight: 900 }}>—</span>
                            <span style={{ fontSize: 10, color: "#475569", lineHeight: 1.65 }}>{line.replace(/^[-•▸]\s*/, "")}</span>
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
          {education.length > 0 && !hidden("education") && (
            <div>
              <RightSectionHeader text="Education" />
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {education.map((edu) => (
                  <div key={edu.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 11, fontWeight: 800, color: "#0f172a", margin: "0 0 1px" }}>
                          {edu.degree}{edu.field ? ` in ${edu.field}` : ""}
                        </p>
                        <p style={{ fontSize: 10, color: "#64748b", margin: 0 }}>{edu.institution}</p>
                        {edu.grade && <p style={{ fontSize: 9, color: "#94a3b8", margin: "2px 0 0" }}>Grade: {edu.grade}</p>}
                      </div>
                      <span style={{ fontSize: 9, color: "#94a3b8", whiteSpace: "nowrap" as const, marginLeft: 8, flexShrink: 0 }}>
                        {dateRange(edu.startDate, edu.endDate, false)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {certifications.length > 0 && !hidden("certifications") && (
            <div>
              <RightSectionHeader text="Certifications" />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {certifications.map((cert) => (
                  <div key={cert.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 10.5, fontWeight: 700, color: "#0f172a", margin: "0 0 1px" }}>{cert.name}</p>
                      {cert.issuer && <p style={{ fontSize: 9.5, color: "#64748b", margin: 0 }}>{cert.issuer}</p>}
                    </div>
                    {cert.date && (
                      <span style={{ fontSize: 9, color: "#94a3b8", whiteSpace: "nowrap" as const, marginLeft: 8, flexShrink: 0 }}>
                        {fmtDate(cert.date) || cert.date}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Referees */}
          {referees.length > 0 && !hidden("referees") && (
            <div>
              <RightSectionHeader text="Referees / Wadhamini" />
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {referees.map((ref) => (
                  <div key={ref.id}>
                    <p style={{ fontSize: 10.5, fontWeight: 700, color: "#0f172a", margin: "0 0 1px" }}>{ref.name}</p>
                    {ref.title && <p style={{ fontSize: 9.5, color: "#64748b", margin: 0 }}>{ref.title}{ref.company ? ` · ${ref.company}` : ""}</p>}
                    <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "4px 12px", marginTop: 3 }}>
                      {ref.email && <span style={{ fontSize: 8.5, color: "#94a3b8" }}>{ref.email}</span>}
                      {ref.phone && <span style={{ fontSize: 8.5, color: "#94a3b8" }}>{ref.phone}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!summary && experience.length === 0 && education.length === 0 && (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#d1d5db", fontSize: 13 }}>
              {lang === "sw" ? "Jaza fomu ili uone onyesho la CV yako" : "Fill in the form to preview your CV"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
