import {
  IcoEmail, IcoPhone, IcoPin, IcoLinkedIn, IcoGlobe,
  ContactItem, SkillDots, fmtDate, dateRange,
  type CVData,
  visibleSkills,
} from "@/components/templates/template-utils";
import type { Lang } from "@/lib/i18n/translations";

export function ExecutiveOneTemplate({ data, primaryColor, fontFamily, lang = "en" }: { data: CVData; primaryColor: string; fontFamily: string; lang?: Lang }) {
  const { personal, summary, experience, education, skills, languages, certifications, referees, hobbies } = data;
  const hidden = (k: string) => data.hiddenSections?.includes(k) ?? false;

  const SectionHeader = ({ title }: { title: string }) => (
    <div style={{ marginBottom: 12 }}>
      <p style={{
        fontSize: 10,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.12em",
        color: primaryColor,
        margin: "0 0 5px",
      }}>{title}</p>
      <div style={{ borderTop: `2px solid ${primaryColor}`, marginBottom: 2 }} />
      <div style={{ borderTop: "1px solid #e2e8f0" }} />
    </div>
  );

  return (
    <div style={{ width: 794, minHeight: 1123, fontFamily, backgroundColor: "#fff", boxSizing: "border-box" }}>
      {/* Header — centered name */}
      <div style={{ padding: "40px 48px 24px", textAlign: "center", borderBottom: "2px solid #1e293b" }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: "#1e293b", margin: "0 0 4px", letterSpacing: "0.02em", fontFamily: "Georgia, serif" }}>
          {personal.fullName}
        </div>
        <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 16px", fontWeight: 400, fontStyle: "italic", fontFamily: "Georgia, serif" }}>
          {personal.jobTitle}
        </p>

        {/* Contact icons row centered */}
        <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "4px 18px" }}>
          {personal.email && <ContactItem icon={<IcoEmail size={10} color="#64748b" />} text={personal.email} color="#475569" fontSize={9.5} />}
          {personal.phone && <ContactItem icon={<IcoPhone size={10} color="#64748b" />} text={personal.phone} color="#475569" fontSize={9.5} />}
          {personal.location && <ContactItem icon={<IcoPin size={10} color="#64748b" />} text={personal.location} color="#475569" fontSize={9.5} />}
          {personal.linkedin && <ContactItem icon={<IcoLinkedIn size={10} color="#64748b" />} text={personal.linkedin} color="#475569" fontSize={9.5} />}
          {personal.website && <ContactItem icon={<IcoGlobe size={10} color="#64748b" />} text={personal.website} color="#475569" fontSize={9.5} />}
        </div>
      </div>

      {/* Two-column body */}
      <div style={{ display: "flex", gap: 0, minHeight: "calc(1123px - 110px)" }}>
        {/* Left column — 60% */}
        <div style={{ flex: "0 0 60%", padding: "28px 28px 28px 48px", boxSizing: "border-box", borderRight: "1px solid #e2e8f0" }}>
          {/* Experience */}
          {experience.length > 0 && !hidden("experience") && (
            <div style={{ marginBottom: 28 }}>
              <SectionHeader title="Professional Experience" />
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {experience.map((exp) => (
                  <div key={exp.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 2 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 11.5, fontWeight: 700, color: "#1e293b", margin: "0 0 1px", fontFamily: "Georgia, serif" }}>{exp.position}</p>
                        <p style={{ fontSize: 10, color: "#64748b", margin: 0, fontStyle: "italic" }}>{exp.company}{exp.location ? `, ${exp.location}` : ""}</p>
                      </div>
                      <span style={{ fontSize: 9, color: "#94a3b8", whiteSpace: "nowrap", marginLeft: 8, flexShrink: 0 }}>{dateRange(exp.startDate, exp.endDate, exp.current)}</span>
                    </div>
                    {exp.description && (
                      <div style={{ marginTop: 5 }}>
                        {exp.description.split("\n").filter(Boolean).map((line, i) => (
                          <div key={i} style={{ display: "flex", gap: 6, marginBottom: 3 }}>
                            <span style={{ color: primaryColor, fontSize: 8, flexShrink: 0, marginTop: 3 }}>◆</span>
                            <span style={{ fontSize: 10, color: "#475569", lineHeight: 1.65 }}>{line.replace(/^[-•▸◆]\s*/, "")}</span>
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
            <div style={{ marginBottom: 28 }}>
              <SectionHeader title="Education" />
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {education.map((edu) => (
                  <div key={edu.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 11.5, fontWeight: 700, color: "#1e293b", margin: "0 0 1px", fontFamily: "Georgia, serif" }}>{edu.degree}{edu.field ? ` in ${edu.field}` : ""}</p>
                        <p style={{ fontSize: 10, color: "#64748b", margin: 0, fontStyle: "italic" }}>{edu.institution}</p>
                        {edu.grade && <p style={{ fontSize: 9.5, color: "#94a3b8", margin: "2px 0 0" }}>Grade: {edu.grade}</p>}
                      </div>
                      <span style={{ fontSize: 9, color: "#94a3b8", whiteSpace: "nowrap", marginLeft: 8, flexShrink: 0 }}>{dateRange(edu.startDate, edu.endDate, false)}</span>
                    </div>
                    {edu.description && (
                      <p style={{ fontSize: 10, color: "#64748b", margin: "4px 0 0", lineHeight: 1.6 }}>{edu.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interests */}
          {hobbies && !hidden("hobbies") && (
            <div>
              <SectionHeader title="Interests" />
              <p style={{ fontSize: 10.5, color: "#475569", margin: 0, lineHeight: 1.7 }}>{hobbies}</p>
            </div>
          )}
        </div>

        {/* Right column — 40% */}
        <div style={{ flex: "0 0 40%", padding: "28px 48px 28px 28px", boxSizing: "border-box" }}>
          {/* Summary */}
          {summary && !hidden("summary") && (
            <div style={{ marginBottom: 28 }}>
              <SectionHeader title="Profile" />
              <p style={{ fontSize: 10.5, color: "#475569", lineHeight: 1.75, margin: 0 }}>{summary}</p>
            </div>
          )}

          {/* Skills */}
          {skills.length > 0 && !hidden("skills") && (
            <div style={{ marginBottom: 28 }}>
              <SectionHeader title="Core Skills" />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {visibleSkills(skills).map((s) => (
                  <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 10.5, color: "#334155" }}>{s.name}</span>
                    <SkillDots level={s.level} color={primaryColor} emptyColor="#e2e8f0" size={7} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {languages.length > 0 && !hidden("languages") && (
            <div style={{ marginBottom: 28 }}>
              <SectionHeader title="Languages" />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {languages.map((l) => (
                  <div key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 10.5, color: "#334155" }}>{l.name}</span>
                    <span style={{ fontSize: 9.5, color: "#94a3b8", fontStyle: "italic" }}>{l.proficiency}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {certifications.length > 0 && !hidden("certifications") && (
            <div style={{ marginBottom: 28 }}>
              <SectionHeader title="Certifications" />
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {certifications.map((c) => (
                  <div key={c.id}>
                    <p style={{ fontSize: 10.5, fontWeight: 600, color: "#334155", margin: "0 0 1px" }}>{c.name}</p>
                    <p style={{ fontSize: 9.5, color: "#94a3b8", margin: 0, fontStyle: "italic" }}>{c.issuer}{c.date ? ` · ${fmtDate(c.date) || c.date}` : ""}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Referees */}
          {referees.length > 0 && !hidden("referees") && (
            <div style={{ marginBottom: 28 }}>
              <SectionHeader title="Referees" />
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {referees.map((ref) => (
                  <div key={ref.id}>
                    <p style={{ fontSize: 10.5, fontWeight: 600, color: "#334155", margin: "0 0 1px" }}>{ref.name}</p>
                    {(ref.title || ref.company) && (
                      <p style={{ fontSize: 9.5, color: "#94a3b8", margin: 0, fontStyle: "italic" }}>
                        {ref.title}{ref.company ? ` — ${ref.company}` : ""}
                      </p>
                    )}
                    {(ref.email || ref.phone) && (
                      <p style={{ fontSize: 9.5, color: "#94a3b8", margin: "2px 0 0" }}>
                        {ref.email}{ref.phone ? ` · ${ref.phone}` : ""}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {!summary && experience.length === 0 && education.length === 0 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0", color: "#cbd5e1", fontSize: 13 }}>
          {lang === "sw" ? "Jaza fomu ili uone onyesho la CV yako" : "Fill in the form to preview your CV"}
        </div>
      )}
    </div>
  );
}
