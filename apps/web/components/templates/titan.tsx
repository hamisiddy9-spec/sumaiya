import type { CVData } from "@/types";
import { cvHeadings } from "@/lib/i18n/cv-headings";
import type { Lang } from "@/lib/i18n/translations";
import {
  IcoEmail, IcoPhone, IcoPin, IcoLinkedIn, IcoGlobe,
  SkillDots, ContactItem, fmtDate, dateRange,
  visibleSkills,
  CvPhoto,
} from "@/components/templates/template-utils";

interface Props { data: CVData; primaryColor: string; fontFamily: string; lang?: Lang;
  }

export function TitanTemplate({ data, primaryColor, fontFamily, lang = "en" }: Props) {
  const L = cvHeadings(lang);
  const { personal, summary, experience, education, skills, languages, certifications, referees, hobbies } = data;
  const hidden = (k: string) => data.hiddenSections?.includes(k) ?? false;
  const navy = primaryColor;
  const dark = "#0f172a";

  const SectionHeader = ({ title }: { title: string }) => (
    <div style={{ marginBottom: 10 }}>
      <div style={{
        fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
        color: navy, textTransform: "uppercase" as const,
        paddingBottom: 4,
        borderBottom: `3px solid ${navy}`,
        display: "inline-block",
      }}>
        {title}
      </div>
    </div>
  );

  return (
    <div style={{
      width: 794, minHeight: 1123, fontFamily, backgroundColor: "#fff",
      boxSizing: "border-box",
    }}>
      {/* Top navy bar */}
      <div style={{
        backgroundColor: navy, height: 60,
        display: "flex", alignItems: "center",
        justifyContent: "space-between", padding: "0 36px",
        boxSizing: "border-box",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, minWidth: 0 }}>
          <CvPhoto url={personal.photo} name={personal.fullName} size={44} radius={50} borderColor={primaryColor} borderWidth={2} />
          <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "0.01em" }}>
            {personal.fullName}
          </div>
        </div>
        <div style={{ fontSize: 11.5, fontWeight: 500, color: "rgba(255,255,255,0.85)", letterSpacing: "0.04em" }}>
          {personal.jobTitle}
        </div>
      </div>

      {/* Contact row */}
      <div style={{
        backgroundColor: "#f8fafc",
        borderBottom: "1px solid #e2e8f0",
        padding: "10px 36px",
        display: "flex", gap: 20, flexWrap: "wrap" as const, alignItems: "center",
        boxSizing: "border-box",
      }}>
        {personal.email && (
          <ContactItem icon={<IcoEmail size={10} color={navy} />} text={personal.email} color="#374151" fontSize={10} />
        )}
        {personal.phone && (
          <ContactItem icon={<IcoPhone size={10} color={navy} />} text={personal.phone} color="#374151" fontSize={10} />
        )}
        {personal.location && (
          <ContactItem icon={<IcoPin size={10} color={navy} />} text={personal.location} color="#374151" fontSize={10} />
        )}
        {personal.linkedin && (
          <ContactItem icon={<IcoLinkedIn size={10} color={navy} />} text={personal.linkedin} color="#374151" fontSize={10} />
        )}
        {personal.website && (
          <ContactItem icon={<IcoGlobe size={10} color={navy} />} text={personal.website} color="#374151" fontSize={10} />
        )}
      </div>

      {/* Two-column body */}
      <div style={{
        display: "flex", gap: 0, padding: "24px 0",
        boxSizing: "border-box",
      }}>
        {/* Left column: 60% — experience + education */}
        <div style={{
          flex: "0 0 60%", maxWidth: "60%",
          padding: "0 24px 0 36px",
          borderRight: "1px solid #e2e8f0",
          boxSizing: "border-box",
        }}>
          {/* Experience */}
          {experience?.length > 0 && !hidden("experience") && (
            <div style={{ marginBottom: 24 }}>
              <SectionHeader title={L.experience} />
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 16 }}>
                {experience.map((exp) => (
                  <div key={exp.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: navy }}>{exp.company}</div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: dark, marginTop: 1 }}>{exp.position}{exp.location ? ` — ${exp.location}` : ""}</div>
                      </div>
                      <div style={{
                        fontSize: 9.5, color: "#6b7280",
                        whiteSpace: "nowrap" as const, flexShrink: 0,
                        marginTop: 2,
                      }}>
                        {dateRange(exp.startDate, exp.endDate, exp.current)}
                      </div>
                    </div>
                    {exp.description && (
                      <p style={{ fontSize: 10.5, color: "#4b5563", lineHeight: 1.6, margin: "6px 0 0 0" }}>{exp.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {education?.length > 0 && !hidden("education") && (
            <div>
              <SectionHeader title={L.education} />
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 14 }}>
                {education.map((edu) => (
                  <div key={edu.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: navy }}>{edu.institution}</div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: dark, marginTop: 1 }}>
                          {edu.degree}{edu.field ? ` in ${edu.field}` : ""}
                        </div>
                      </div>
                      <div style={{ fontSize: 9.5, color: "#6b7280", whiteSpace: "nowrap" as const, flexShrink: 0, marginTop: 2 }}>
                        {dateRange(edu.startDate, edu.endDate, false)}
                      </div>
                    </div>
                    {(edu.grade || edu.description) && (
                      <p style={{ fontSize: 10.5, color: "#4b5563", lineHeight: 1.6, margin: "5px 0 0 0" }}>
                        {edu.grade ? `Grade: ${edu.grade}` : ""}{edu.grade && edu.description ? " — " : ""}{edu.description ?? ""}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column: 40% — summary + skills + certs + langs */}
        <div style={{
          flex: "0 0 40%", maxWidth: "40%",
          padding: "0 36px 0 24px",
          boxSizing: "border-box",
        }}>
          {/* Summary */}
          {summary && !hidden("summary") && (
            <div style={{ marginBottom: 22 }}>
              <SectionHeader title={L.profile} />
              <p style={{ fontSize: 10.5, color: "#374151", lineHeight: 1.65, margin: 0 }}>{summary}</p>
            </div>
          )}

          {/* Skills */}
          {skills?.length > 0 && !hidden("skills") && (
            <div style={{ marginBottom: 22 }}>
              <SectionHeader title={L.skills} />
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 7 }}>
                {visibleSkills(skills).map((sk) => (
                  <div key={sk.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 10.5, color: dark }}>{sk.name}</span>
                    <SkillDots level={sk.level} color={navy} emptyColor="#dbeafe" size={7} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {certifications?.length > 0 && !hidden("certifications") && (
            <div style={{ marginBottom: 22 }}>
              <SectionHeader title={L.certifications} />
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
                {certifications.map((cert) => (
                  <div key={cert.id}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: dark }}>{cert.name}</div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 10, color: "#6b7280" }}>{cert.issuer}</span>
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
                    <div style={{ fontSize: 10, color: "#6b7280" }}>
                      {ref.title}{ref.company ? ` at ${ref.company}` : ""}
                      {ref.email ? ` · ${ref.email}` : ""}
                      {ref.phone ? ` · ${ref.phone}` : ""}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {languages?.length > 0 && !hidden("languages") && (
            <div style={{ marginBottom: 22 }}>
              <SectionHeader title={L.languages} />
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
                {languages.map((lang) => (
                  <div key={lang.id} style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 10.5, color: dark, fontWeight: 600 }}>{lang.name}</span>
                    <span style={{ fontSize: 10, color: "#6b7280" }}>{lang.proficiency}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hobbies */}
          {hobbies && !hidden("hobbies") && (
            <div>
              <SectionHeader title={L.interests} />
              <p style={{ fontSize: 10.5, color: "#374151", lineHeight: 1.65, margin: 0 }}>{hobbies}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
