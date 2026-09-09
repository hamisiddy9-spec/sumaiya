import type { CVData } from "@/types";
import {
  IcoEmail, IcoPhone, IcoPin, IcoLinkedIn, IcoGlobe,
  SkillDots, ContactItem, fmtDate, dateRange,
  visibleSkills,
} from "@/components/templates/template-utils";

interface Props { data: CVData; primaryColor: string; fontFamily: string }

export function NovaTemplate({ data, primaryColor, fontFamily }: Props) {
  const { personal, summary, experience, education, skills, languages, certifications, referees, hobbies } = data;
  const hidden = (k: string) => data.hiddenSections?.includes(k) ?? false;
  const dark = "#1e1b4b";
  const mid = "#374151";
  const muted = "#6b7280";
  // purple-200 equivalent
  const headerSubColor = "rgba(221,214,254,0.9)";

  const SectionHeader = ({ title }: { title: string }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
      <span style={{ fontSize: 11, color: primaryColor, lineHeight: 1 }}>■</span>
      <span style={{ fontSize: 11, fontWeight: 700, color: primaryColor, letterSpacing: "0.04em", textTransform: "uppercase" as const }}>
        {title}
      </span>
    </div>
  );

  return (
    <div style={{
      width: 794, minHeight: 1123, fontFamily, backgroundColor: "#fafafa",
      boxSizing: "border-box",
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: primaryColor,
        padding: "0 0",
        display: "flex",
        minHeight: 110,
      }}>
        {/* Left: name + title */}
        <div style={{
          flex: "0 0 62%", maxWidth: "62%",
          padding: "24px 28px 24px 36px",
          boxSizing: "border-box",
          display: "flex", flexDirection: "column" as const, justifyContent: "center",
        }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: "-0.01em", lineHeight: 1.15 }}>
            {personal.fullName}
          </div>
          <div style={{ fontSize: 12, fontWeight: 500, color: headerSubColor, marginTop: 6, letterSpacing: "0.03em" }}>
            {personal.jobTitle}
          </div>
        </div>

        {/* Right: contact stacked */}
        <div style={{
          flex: "0 0 38%", maxWidth: "38%",
          padding: "20px 36px 20px 16px",
          boxSizing: "border-box",
          display: "flex", flexDirection: "column" as const, justifyContent: "center", gap: 7,
          borderLeft: "1px solid rgba(255,255,255,0.15)",
        }}>
          {personal.email && (
            <ContactItem icon={<IcoEmail size={10} color={headerSubColor} />} text={personal.email} color="rgba(255,255,255,0.9)" fontSize={9.5} />
          )}
          {personal.phone && (
            <ContactItem icon={<IcoPhone size={10} color={headerSubColor} />} text={personal.phone} color="rgba(255,255,255,0.9)" fontSize={9.5} />
          )}
          {personal.location && (
            <ContactItem icon={<IcoPin size={10} color={headerSubColor} />} text={personal.location} color="rgba(255,255,255,0.9)" fontSize={9.5} />
          )}
          {personal.linkedin && (
            <ContactItem icon={<IcoLinkedIn size={10} color={headerSubColor} />} text={personal.linkedin} color="rgba(255,255,255,0.9)" fontSize={9.5} />
          )}
          {personal.website && (
            <ContactItem icon={<IcoGlobe size={10} color={headerSubColor} />} text={personal.website} color="rgba(255,255,255,0.9)" fontSize={9.5} />
          )}
        </div>
      </div>

      {/* Two-column body */}
      <div style={{ display: "flex", gap: 0 }}>
        {/* Left: 62% — experience + education */}
        <div style={{
          flex: "0 0 62%", maxWidth: "62%",
          padding: "24px 20px 28px 36px",
          boxSizing: "border-box",
          borderRight: "1px solid #e5e7eb",
        }}>
          {/* Experience */}
          {experience?.length > 0 && !hidden("experience") && (
            <div style={{ marginBottom: 24 }}>
              <SectionHeader title="Experience" />
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 16 }}>
                {experience.map((exp) => (
                  <div key={exp.id} style={{
                    paddingLeft: 10,
                    borderLeft: `2px solid ${primaryColor}33`,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: dark }}>{exp.position}</div>
                        <div style={{ fontSize: 10.5, color: primaryColor, fontWeight: 600, marginTop: 2 }}>
                          {exp.company}{exp.location ? ` · ${exp.location}` : ""}
                        </div>
                      </div>
                      <div style={{ fontSize: 9.5, color: muted, whiteSpace: "nowrap" as const, flexShrink: 0, marginTop: 2 }}>
                        {dateRange(exp.startDate, exp.endDate, exp.current)}
                      </div>
                    </div>
                    {exp.description && (
                      <p style={{ fontSize: 10.5, color: mid, lineHeight: 1.65, margin: "7px 0 0 0" }}>{exp.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {education?.length > 0 && !hidden("education") && (
            <div>
              <SectionHeader title="Education" />
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 14 }}>
                {education.map((edu) => (
                  <div key={edu.id} style={{
                    paddingLeft: 10,
                    borderLeft: `2px solid ${primaryColor}33`,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: dark }}>
                          {edu.degree}{edu.field ? ` in ${edu.field}` : ""}
                        </div>
                        <div style={{ fontSize: 10.5, color: primaryColor, fontWeight: 600, marginTop: 2 }}>{edu.institution}</div>
                      </div>
                      <div style={{ fontSize: 9.5, color: muted, whiteSpace: "nowrap" as const, flexShrink: 0, marginTop: 2 }}>
                        {dateRange(edu.startDate, edu.endDate, false)}
                      </div>
                    </div>
                    {(edu.grade || edu.description) && (
                      <p style={{ fontSize: 10.5, color: mid, lineHeight: 1.65, margin: "6px 0 0 0" }}>
                        {edu.grade ? `Grade: ${edu.grade}` : ""}{edu.grade && edu.description ? " — " : ""}{edu.description ?? ""}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: 38% — summary + skills + langs + certs */}
        <div style={{
          flex: "0 0 38%", maxWidth: "38%",
          padding: "24px 36px 28px 20px",
          boxSizing: "border-box",
          backgroundColor: "#fff",
        }}>
          {/* Summary */}
          {summary && !hidden("summary") && (
            <div style={{ marginBottom: 22 }}>
              <SectionHeader title="Profile" />
              <p style={{ fontSize: 10.5, color: mid, lineHeight: 1.7, margin: 0 }}>{summary}</p>
            </div>
          )}

          {/* Skills */}
          {skills?.length > 0 && !hidden("skills") && (
            <div style={{ marginBottom: 22 }}>
              <SectionHeader title="Skills" />
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 7 }}>
                {visibleSkills(skills).map((sk) => (
                  <div key={sk.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 10.5, color: dark }}>{sk.name}</span>
                    <SkillDots level={sk.level} color={primaryColor} emptyColor="#e5e7eb" size={6} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {languages?.length > 0 && !hidden("languages") && (
            <div style={{ marginBottom: 22 }}>
              <SectionHeader title="Languages" />
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
                {languages.map((lang) => (
                  <div key={lang.id} style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 10.5, color: dark, fontWeight: 600 }}>{lang.name}</span>
                    <span style={{ fontSize: 10, color: muted }}>{lang.proficiency}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {certifications?.length > 0 && !hidden("certifications") && (
            <div style={{ marginBottom: 22 }}>
              <SectionHeader title="Certifications" />
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
                {certifications.map((cert) => (
                  <div key={cert.id}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: dark }}>{cert.name}</div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 10, color: muted }}>{cert.issuer}</span>
                      <span style={{ fontSize: 10, color: "#9ca3af" }}>{fmtDate(cert.date)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Referees */}
          {referees?.length > 0 && !hidden("referees") && (
            <div style={{ marginBottom: 22 }}>
              <SectionHeader title="Referees / Wadhamini" />
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
                {referees.map((ref) => (
                  <div key={ref.id}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: dark }}>{ref.name}</div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 10, color: muted }}>{ref.title}</span>
                      <span style={{ fontSize: 10, color: "#9ca3af" }}>{ref.company}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hobbies */}
          {hobbies && !hidden("hobbies") && (
            <div>
              <SectionHeader title="Interests" />
              <p style={{ fontSize: 10.5, color: mid, lineHeight: 1.7, margin: 0 }}>{hobbies}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
