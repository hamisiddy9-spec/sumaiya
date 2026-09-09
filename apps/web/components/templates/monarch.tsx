import {
  fmtDate, dateRange,
} from "@/components/templates/template-utils";
import { visibleSkills } from "@/components/templates/template-utils";
import type { CVData } from "@/components/templates/template-utils";

export function MonarchTemplate({
  data,
  primaryColor,
  fontFamily,
}: {
  data: CVData;
  primaryColor: string;
  fontFamily: string;
}) {
  const {
    personal, summary, experience, education,
    skills, languages, certifications, referees, hobbies,
    hiddenSections = [],
  } = data;

  const show = (key: string) => !hiddenSections.includes(key);

  function DoubleBorderHeader({ title }: { title: string }) {
    return (
      <div style={{ marginBottom: 12 }}>
        <div style={{ borderTop: `2px solid ${primaryColor}`, marginBottom: 5 }} />
        <div style={{
          fontSize: 10,
          fontWeight: 700,
          textTransform: "uppercase" as const,
          letterSpacing: "0.14em",
          color: "#1f2937",
        }}>
          {title}
        </div>
        <div style={{ borderTop: `0.75px solid ${primaryColor}99`, marginTop: 5 }} />
      </div>
    );
  }

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
      fontFamily,
      backgroundColor: "#fff",
      display: "flex",
      flexDirection: "column",
      boxSizing: "border-box",
    }}>

      {/* ── Centered header ── */}
      <div style={{ padding: "36px 48px 20px 48px", textAlign: "center" }}>
        <div style={{
          fontSize: 28,
          fontWeight: 800,
          color: "#1f2937",
          lineHeight: 1.15,
          letterSpacing: "0.02em",
          marginBottom: 8,
        }}>
          {personal.fullName}
        </div>

        {/* Thin gold line */}
        <div style={{ borderTop: `1.5px solid ${primaryColor}`, marginBottom: 8 }} />

        {/* Job title in italic */}
        <div style={{
          fontSize: 13,
          fontStyle: "italic",
          color: "#6b7280",
          fontWeight: 400,
          marginBottom: 12,
        }}>
          {personal.jobTitle}
        </div>

        {/* Contact row — text-only, centered */}
        {contactParts.length > 0 && (
          <div style={{
            fontSize: 9.5,
            color: "#6b7280",
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap" as const,
            gap: 0,
          }}>
            {contactParts.map((part, i) => (
              <span key={i} style={{ display: "inline-flex", alignItems: "center" }}>
                {i > 0 && (
                  <span style={{ margin: "0 8px", color: primaryColor, fontSize: 10 }}>·</span>
                )}
                {part}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Two-column body ── */}
      <div style={{
        display: "flex",
        flex: 1,
        padding: "4px 48px 36px 48px",
        gap: 28,
      }}>

        {/* Left: 58% — Experience + Education */}
        <div style={{ flex: "0 0 58%", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Summary */}
          {show("summary") && summary && (
            <div>
              <DoubleBorderHeader title="Profile" />
              <p style={{
                fontSize: 10.5,
                color: "#374151",
                lineHeight: 1.75,
                margin: 0,
                fontStyle: "italic",
              }}>
                {summary}
              </p>
            </div>
          )}

          {/* Experience */}
          {show("experience") && experience.length > 0 && (
            <div>
              <DoubleBorderHeader title="Professional Experience" />
              <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
                {experience.map((exp) => (
                  <div key={exp.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <div>
                        <div style={{ fontSize: 11.5, fontWeight: 700, color: "#111827", lineHeight: 1.3 }}>
                          {exp.position}
                        </div>
                        <div style={{ fontSize: 10, color: primaryColor, fontWeight: 600, fontStyle: "italic", marginTop: 1 }}>
                          {exp.company}{exp.location ? `, ${exp.location}` : ""}
                        </div>
                      </div>
                      <div style={{
                        fontSize: 9.5,
                        color: "#6b7280",
                        whiteSpace: "nowrap" as const,
                        flexShrink: 0,
                        marginTop: 2,
                        fontStyle: "italic",
                      }}>
                        {dateRange(exp.startDate, exp.endDate, exp.current)}
                      </div>
                    </div>
                    {exp.description && (
                      <div style={{ marginTop: 5 }}>
                        {exp.description.split("\n").filter(Boolean).map((line, i) => (
                          <div key={i} style={{ display: "flex", gap: 6, marginBottom: 3 }}>
                            <span style={{ color: primaryColor, fontSize: 9, flexShrink: 0, marginTop: 2 }}>–</span>
                            <span style={{ fontSize: 10, color: "#475569", lineHeight: 1.65 }}>
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
          {show("education") && education.length > 0 && (
            <div>
              <DoubleBorderHeader title="Education" />
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {education.map((edu) => (
                  <div key={edu.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#111827", lineHeight: 1.3 }}>
                          {edu.degree}{edu.field ? ` in ${edu.field}` : ""}
                        </div>
                        <div style={{ fontSize: 10, color: primaryColor, fontStyle: "italic", marginTop: 1 }}>
                          {edu.institution}
                        </div>
                        {edu.grade && (
                          <div style={{ fontSize: 9.5, color: "#6b7280", marginTop: 1 }}>Grade: {edu.grade}</div>
                        )}
                      </div>
                      <div style={{ fontSize: 9.5, color: "#6b7280", whiteSpace: "nowrap" as const, flexShrink: 0, marginTop: 2, fontStyle: "italic" }}>
                        {fmtDate(edu.startDate)}{edu.startDate && edu.endDate ? " – " : ""}{fmtDate(edu.endDate)}
                      </div>
                    </div>
                    {edu.description && (
                      <div style={{ fontSize: 10, color: "#6b7280", lineHeight: 1.6, marginTop: 4 }}>{edu.description}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Vertical divider */}
        <div style={{ width: 1, backgroundColor: `${primaryColor}33`, flexShrink: 0 }} />

        {/* Right: 42% — Skills, Certs, Languages, Hobbies */}
        <div style={{ flex: "0 0 calc(42% - 29px)", display: "flex", flexDirection: "column", gap: 20, minWidth: 0 }}>

          {/* Skills */}
          {show("skills") && skills.length > 0 && (
            <div>
              <DoubleBorderHeader title="Skills" />
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {visibleSkills(skills).map((skill) => (
                  <div key={skill.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 10, color: "#374151" }}>{skill.name}</span>
                    <div style={{ display: "flex", gap: 3 }}>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          backgroundColor: i <= skill.level ? primaryColor : `${primaryColor}33`,
                        }} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {show("certifications") && certifications.length > 0 && (
            <div>
              <DoubleBorderHeader title="Certifications" />
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {certifications.map((cert) => (
                  <div key={cert.id}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: "#111827", lineHeight: 1.3 }}>
                      {cert.name}
                    </div>
                    {cert.issuer && (
                      <div style={{ fontSize: 9.5, color: "#6b7280", fontStyle: "italic", marginTop: 1 }}>{cert.issuer}</div>
                    )}
                    {cert.date && (
                      <div style={{ fontSize: 9, color: "#9ca3af", marginTop: 1 }}>{fmtDate(cert.date)}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Referees */}
          {show("referees") && referees.length > 0 && (
            <div>
              <DoubleBorderHeader title="Referees" />
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {referees.map((ref) => (
                  <div key={ref.id}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: "#111827", lineHeight: 1.3 }}>
                      {ref.name}
                    </div>
                    <div style={{ fontSize: 9.5, color: "#6b7280", fontStyle: "italic", marginTop: 1 }}>
                      {ref.title}{ref.company ? ` — ${ref.company}` : ""}
                    </div>
                    <div style={{ fontSize: 9, color: "#9ca3af", marginTop: 1 }}>
                      {ref.email}{ref.phone ? ` · ${ref.phone}` : ""}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {show("languages") && languages.length > 0 && (
            <div>
              <DoubleBorderHeader title="Languages" />
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {languages.map((lang) => (
                  <div key={lang.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 10, color: "#374151", fontWeight: 500 }}>{lang.name}</span>
                    <span style={{ fontSize: 9, color: "#6b7280", fontStyle: "italic" }}>{lang.proficiency}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hobbies */}
          {show("hobbies") && hobbies && (
            <div>
              <DoubleBorderHeader title="Interests" />
              <p style={{ fontSize: 10, color: "#6b7280", lineHeight: 1.7, margin: 0 }}>
                {hobbies.split(/[,\n]+/).filter((h) => h.trim()).join(" · ")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
