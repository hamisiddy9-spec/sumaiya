import React from "react";
import {
  IcoEmail, IcoPhone, IcoPin, IcoLinkedIn, IcoGlobe,
  ContactItem, SkillDots,
  fmtDate, dateRange,
  CVData,
  visibleSkills,
} from "@/components/templates/template-utils";

interface Props {
  data: CVData;
  primaryColor: string;
  fontFamily: string;
}

function SectionTitle({ title, color }: { title: string; color: string }) {
  return (
    <div style={{
      fontSize: 9.5,
      fontWeight: 700,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      color,
      marginBottom: 10,
      paddingBottom: 4,
      borderBottom: `1px solid ${color}`,
    }}>
      {title}
    </div>
  );
}

export function AscentTemplate({ data, primaryColor, fontFamily }: Props) {
  const { personal, summary, experience, education, skills, languages, certifications, referees, hobbies } = data;
  const hidden = (k: string) => data.hiddenSections?.includes(k) ?? false;

  const lightBg = "#ecfdf5";
  const textMain = "#111827";

  return (
    <div style={{
      width: 794,
      minHeight: 1123,
      backgroundColor: "#ffffff",
      fontFamily: fontFamily || "'Inter', 'Helvetica Neue', Arial, sans-serif",
      color: textMain,
      boxSizing: "border-box",
    }}>
      {/* Green header band */}
      <div style={{
        width: "100%",
        backgroundColor: primaryColor,
        padding: "20px 32px 18px",
        boxSizing: "border-box",
      }}>
        <div style={{
          fontSize: 24,
          fontWeight: 700,
          color: "#ffffff",
          lineHeight: 1.2,
          marginBottom: 4,
        }}>
          {personal.fullName}
        </div>
        {personal.jobTitle && (
          <div style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.82)",
            fontWeight: 400,
            letterSpacing: "0.02em",
          }}>
            {personal.jobTitle}
          </div>
        )}
      </div>

      {/* Contact row on light green bg */}
      <div style={{
        backgroundColor: lightBg,
        padding: "9px 32px",
        display: "flex",
        flexWrap: "wrap",
        gap: "6px 20px",
        boxSizing: "border-box",
      }}>
        {personal.email && (
          <ContactItem icon={<IcoEmail size={9} color={primaryColor} />} text={personal.email} color="#374151" fontSize={9} />
        )}
        {personal.phone && (
          <ContactItem icon={<IcoPhone size={9} color={primaryColor} />} text={personal.phone} color="#374151" fontSize={9} />
        )}
        {personal.location && (
          <ContactItem icon={<IcoPin size={9} color={primaryColor} />} text={personal.location} color="#374151" fontSize={9} />
        )}
        {personal.linkedin && (
          <ContactItem icon={<IcoLinkedIn size={9} color={primaryColor} />} text={personal.linkedin} color="#374151" fontSize={9} />
        )}
        {personal.website && (
          <ContactItem icon={<IcoGlobe size={9} color={primaryColor} />} text={personal.website} color="#374151" fontSize={9} />
        )}
      </div>

      {/* Two-column body */}
      <div style={{ display: "flex", alignItems: "flex-start" }}>

        {/* Left column: Experience + Education (65%) */}
        <div style={{
          flex: "0 0 65%",
          padding: "22px 20px 24px 32px",
          boxSizing: "border-box",
        }}>
          {/* Experience */}
          {experience?.length > 0 && !hidden("experience") && (
            <div style={{ marginBottom: 24 }}>
              <SectionTitle title="Experience" color={primaryColor} />
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {experience.map((exp, idx) => (
                  <div key={exp.id} style={{ display: "flex", gap: 0 }}>
                    {/* Timeline bar */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginRight: 12, flexShrink: 0 }}>
                      {/* Circle bullet */}
                      <div style={{
                        width: 9,
                        height: 9,
                        borderRadius: "50%",
                        backgroundColor: primaryColor,
                        flexShrink: 0,
                        marginTop: 3,
                      }} />
                      {/* Vertical line — hide for last item */}
                      {idx < experience.length - 1 && (
                        <div style={{
                          width: 2,
                          flex: 1,
                          backgroundColor: primaryColor,
                          opacity: 0.3,
                          marginTop: 3,
                          minHeight: 24,
                        }} />
                      )}
                    </div>

                    {/* Content */}
                    <div style={{ paddingBottom: 16, flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 1 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#111827" }}>{exp.company}</span>
                        <span style={{ fontSize: 9, color: "#9ca3af", whiteSpace: "nowrap", marginLeft: 8 }}>
                          {dateRange(exp.startDate, exp.endDate, exp.current)}
                        </span>
                      </div>
                      <div style={{ fontSize: 10, color: "#6b7280", fontWeight: 500, marginBottom: 4 }}>
                        {exp.position}
                        {exp.location && <span style={{ color: "#9ca3af", fontWeight: 400, marginLeft: 6 }}>· {exp.location}</span>}
                      </div>
                      {exp.description && (
                        <p style={{ fontSize: 9.5, color: "#4b5563", lineHeight: 1.65, margin: 0 }}>
                          {exp.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {education?.length > 0 && !hidden("education") && (
            <div>
              <SectionTitle title="Education" color={primaryColor} />
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {education.map((edu) => (
                  <div key={edu.id} style={{
                    paddingLeft: 12,
                    borderLeft: `2px solid ${primaryColor}`,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#111827" }}>{edu.institution}</span>
                      <span style={{ fontSize: 9, color: "#9ca3af", whiteSpace: "nowrap", marginLeft: 8 }}>
                        {dateRange(edu.startDate, edu.endDate, false)}
                      </span>
                    </div>
                    <div style={{ fontSize: 10, color: "#6b7280", marginBottom: 2 }}>
                      {edu.degree}{edu.field ? `, ${edu.field}` : ""}
                    </div>
                    {edu.grade && (
                      <div style={{ fontSize: 9.5, color: "#9ca3af" }}>Grade: {edu.grade}</div>
                    )}
                    {edu.description && (
                      <p style={{ fontSize: 9.5, color: "#4b5563", lineHeight: 1.6, margin: "4px 0 0 0" }}>{edu.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column: Summary + Skills + Certs + Languages + Hobbies (35%) */}
        <div style={{
          flex: "0 0 35%",
          padding: "22px 24px 24px 16px",
          boxSizing: "border-box",
          borderLeft: "1px solid #e5e7eb",
        }}>
          {/* Summary */}
          {summary && !hidden("summary") && (
            <div style={{ marginBottom: 20 }}>
              <SectionTitle title="Profile" color={primaryColor} />
              <p style={{ fontSize: 9.5, lineHeight: 1.7, color: "#4b5563", margin: 0 }}>{summary}</p>
            </div>
          )}

          {/* Skills */}
          {skills?.length > 0 && !hidden("skills") && (
            <div style={{ marginBottom: 20 }}>
              <SectionTitle title="Skills" color={primaryColor} />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {visibleSkills(skills).map((skill) => (
                  <div key={skill.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 9.5, color: "#374151", flex: 1 }}>{skill.name}</span>
                    <SkillDots level={skill.level} color={primaryColor} emptyColor="#d1fae5" size={6} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {certifications?.length > 0 && !hidden("certifications") && (
            <div style={{ marginBottom: 20 }}>
              <SectionTitle title="Certifications" color={primaryColor} />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {certifications.map((cert) => (
                  <div key={cert.id}>
                    <div style={{ fontSize: 9.5, fontWeight: 600, color: "#111827" }}>{cert.name}</div>
                    <div style={{ fontSize: 9, color: "#6b7280" }}>{cert.issuer}</div>
                    <div style={{ fontSize: 8.5, color: "#9ca3af" }}>{fmtDate(cert.date)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Referees */}
          {referees?.length > 0 && !hidden("referees") && (
            <div style={{ marginBottom: 20 }}>
              <SectionTitle title="Referees / Wadhamini" color={primaryColor} />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {referees.map((ref) => (
                  <div key={ref.id}>
                    <div style={{ fontSize: 9.5, fontWeight: 600, color: "#111827" }}>{ref.name}</div>
                    <div style={{ fontSize: 9, color: "#6b7280" }}>{ref.title}{ref.company ? ` at ${ref.company}` : ""}</div>
                    <div style={{ fontSize: 8.5, color: "#9ca3af" }}>{ref.email}{ref.phone ? ` · ${ref.phone}` : ""}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {languages?.length > 0 && !hidden("languages") && (
            <div style={{ marginBottom: 20 }}>
              <SectionTitle title="Languages" color={primaryColor} />
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {languages.map((lang) => (
                  <div key={lang.id} style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 9.5, fontWeight: 600, color: "#374151" }}>{lang.name}</span>
                    <span style={{ fontSize: 9, color: "#9ca3af" }}>{lang.proficiency}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hobbies */}
          {hobbies && !hidden("hobbies") && (
            <div>
              <SectionTitle title="Interests" color={primaryColor} />
              <p style={{ fontSize: 9, color: "#4b5563", lineHeight: 1.6, margin: 0 }}>{hobbies}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
