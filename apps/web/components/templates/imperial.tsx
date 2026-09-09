import React from "react";
import {
  IcoEmail, IcoPhone, IcoPin, IcoLinkedIn, IcoGlobe,
  SkillDots,
  fmtDate, dateRange,
  CVData,
  visibleSkills,
} from "@/components/templates/template-utils";

interface Props {
  data: CVData;
  primaryColor: string;
  fontFamily: string;
}

function OrnamentalRule({ color }: { color: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, margin: "8px 0" }}>
      <div style={{ borderTop: `1px solid ${color}`, opacity: 0.4 }} />
      <div style={{ borderTop: `2px solid ${color}` }} />
      <div style={{ borderTop: `1px solid ${color}`, opacity: 0.4 }} />
    </div>
  );
}

function SectionHeader({ title, color }: { title: string; color: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color,
      }}>
        {title}
      </div>
      <div style={{
        borderBottom: `2px solid ${color}`,
        marginTop: 3,
      }} />
    </div>
  );
}

export function ImperialTemplate({ data, primaryColor, fontFamily }: Props) {
  const { personal, summary, experience, education, skills, languages, certifications, referees, hobbies } = data;
  const hidden = (k: string) => data.hiddenSections?.includes(k) ?? false;

  const crimson = primaryColor;
  const textDark = "#1a0a06";
  const textMid = "#44261a";
  const textLight = "#7c4a33";

  const contactItems = [
    personal.email ? { icon: <IcoEmail size={9} color={crimson} />, text: personal.email } : null,
    personal.phone ? { icon: <IcoPhone size={9} color={crimson} />, text: personal.phone } : null,
    personal.location ? { icon: <IcoPin size={9} color={crimson} />, text: personal.location } : null,
    personal.linkedin ? { icon: <IcoLinkedIn size={9} color={crimson} />, text: personal.linkedin } : null,
    personal.website ? { icon: <IcoGlobe size={9} color={crimson} />, text: personal.website } : null,
  ].filter(Boolean) as { icon: React.ReactNode; text: string }[];

  return (
    <div style={{
      width: 794,
      minHeight: 1123,
      backgroundColor: "#fffdf9",
      fontFamily: fontFamily || "Georgia, 'Times New Roman', serif",
      color: textDark,
      boxSizing: "border-box",
      padding: "44px 52px 44px 52px",
    }}>
      {/* Header — centered, prestigious */}
      <div style={{ textAlign: "center", marginBottom: 6 }}>
        <div style={{
          fontSize: 30,
          fontWeight: 800,
          color: crimson,
          letterSpacing: "0.04em",
          lineHeight: 1.15,
        }}>
          {personal.fullName}
        </div>
      </div>

      {/* Ornamental double rule */}
      <OrnamentalRule color={crimson} />

      {/* Job title centered */}
      {personal.jobTitle && (
        <div style={{
          textAlign: "center",
          fontSize: 12,
          fontStyle: "italic",
          color: "#6b7280",
          marginBottom: 10,
          letterSpacing: "0.04em",
        }}>
          {personal.jobTitle}
        </div>
      )}

      {/* Contact row centered with crimson icons */}
      {contactItems.length > 0 && (
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "center",
          gap: 0,
          marginBottom: 10,
        }}>
          {contactItems.map((item, idx) => (
            <React.Fragment key={idx}>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {item.icon}
                <span style={{ fontSize: 9.5, color: textMid }}>{item.text}</span>
              </span>
              {idx < contactItems.length - 1 && (
                <span style={{ margin: "0 10px", color: crimson, fontSize: 9, opacity: 0.6 }}>✦</span>
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Second ornamental rule under header area */}
      <OrnamentalRule color={crimson} />

      {/* Two-column body */}
      <div style={{ display: "flex", gap: 0, alignItems: "flex-start", marginTop: 14 }}>

        {/* Left column — 58%: Experience */}
        <div style={{ flex: "0 0 58%", paddingRight: 24, boxSizing: "border-box" }}>

          {experience?.length > 0 && !hidden("experience") && (
            <div style={{ marginBottom: 20 }}>
              <SectionHeader title="Professional Experience" color={crimson} />
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {experience.map((exp) => (
                  <div key={exp.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 1 }}>
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: textDark }}>{exp.company}</span>
                      <span style={{ fontSize: 9, color: textLight, whiteSpace: "nowrap", marginLeft: 8 }}>
                        {dateRange(exp.startDate, exp.endDate, exp.current)}
                      </span>
                    </div>
                    <div style={{ fontSize: 10, fontStyle: "italic", color: textMid, marginBottom: 3 }}>
                      {exp.position}
                      {exp.location && <span style={{ fontStyle: "normal", color: textLight, marginLeft: 6 }}>· {exp.location}</span>}
                    </div>
                    {exp.description && (
                      <p style={{ fontSize: 9.5, color: "#374151", lineHeight: 1.65, margin: 0, textAlign: "justify" }}>
                        {exp.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {languages?.length > 0 && !hidden("languages") && (
            <div style={{ marginBottom: 20 }}>
              <SectionHeader title="Languages" color={crimson} />
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 20px" }}>
                {languages.map((lang) => (
                  <span key={lang.id} style={{ fontSize: 9.5, color: textDark }}>
                    <span style={{ fontWeight: 700 }}>{lang.name}</span>
                    <span style={{ color: textLight, marginLeft: 4 }}>({lang.proficiency})</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Hobbies */}
          {hobbies && !hidden("hobbies") && (
            <div>
              <SectionHeader title="Interests" color={crimson} />
              <p style={{ fontSize: 9.5, color: "#374151", lineHeight: 1.65, margin: 0 }}>{hobbies}</p>
            </div>
          )}
        </div>

        {/* Vertical divider */}
        <div style={{
          width: 1,
          alignSelf: "stretch",
          backgroundColor: crimson,
          opacity: 0.2,
          flexShrink: 0,
          minHeight: 800,
        }} />

        {/* Right column — 42%: Education + Skills + Certs + Summary */}
        <div style={{ flex: "0 0 42%", paddingLeft: 24, boxSizing: "border-box" }}>

          {/* Summary */}
          {summary && !hidden("summary") && (
            <div style={{ marginBottom: 20 }}>
              <SectionHeader title="Profile" color={crimson} />
              <p style={{ fontSize: 9.5, color: "#374151", lineHeight: 1.7, margin: 0, textAlign: "justify" }}>
                {summary}
              </p>
            </div>
          )}

          {/* Education */}
          {education?.length > 0 && !hidden("education") && (
            <div style={{ marginBottom: 20 }}>
              <SectionHeader title="Education" color={crimson} />
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {education.map((edu) => (
                  <div key={edu.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 1 }}>
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: textDark }}>{edu.institution}</span>
                      <span style={{ fontSize: 9, color: textLight, whiteSpace: "nowrap", marginLeft: 6 }}>
                        {dateRange(edu.startDate, edu.endDate, false)}
                      </span>
                    </div>
                    <div style={{ fontSize: 10, fontStyle: "italic", color: textMid, marginBottom: 2 }}>
                      {edu.degree}{edu.field ? `, ${edu.field}` : ""}
                    </div>
                    {edu.grade && (
                      <div style={{ fontSize: 9, color: textLight }}>Grade: {edu.grade}</div>
                    )}
                    {edu.description && (
                      <p style={{ fontSize: 9.5, color: "#374151", lineHeight: 1.6, margin: "4px 0 0 0", textAlign: "justify" }}>
                        {edu.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {skills?.length > 0 && !hidden("skills") && (
            <div style={{ marginBottom: 20 }}>
              <SectionHeader title="Skills" color={crimson} />
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {visibleSkills(skills).map((skill) => (
                  <div key={skill.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 9.5, color: textDark }}>{skill.name}</span>
                    <SkillDots level={skill.level} color={crimson} emptyColor="#f3e8e0" size={6} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {certifications?.length > 0 && !hidden("certifications") && (
            <div>
              <SectionHeader title="Certifications" color={crimson} />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {certifications.map((cert) => (
                  <div key={cert.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <span style={{ fontSize: 9.5, fontWeight: 700, color: textDark }}>{cert.name}</span>
                      <span style={{ fontSize: 8.5, color: textLight, whiteSpace: "nowrap", marginLeft: 6 }}>
                        {fmtDate(cert.date)}
                      </span>
                    </div>
                    <div style={{ fontSize: 9, color: textMid }}>{cert.issuer}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Referees */}
          {referees.length > 0 && !hidden("referees") && (
            <div>
              <SectionHeader title="Referees / Wadhamini" color={crimson} />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {referees.map((ref) => (
                  <div key={ref.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <span style={{ fontSize: 9.5, fontWeight: 700, color: textDark }}>{ref.name}</span>
                    </div>
                    {(ref.title || ref.company) && (
                      <div style={{ fontSize: 9, color: textMid }}>
                        {ref.title}{ref.company ? ` — ${ref.company}` : ""}
                      </div>
                    )}
                    {(ref.email || ref.phone) && (
                      <div style={{ fontSize: 9, color: textLight }}>
                        {ref.email}{ref.phone ? ` · ${ref.phone}` : ""}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
