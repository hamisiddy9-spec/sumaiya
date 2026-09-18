import React from "react";
import { cvHeadings } from "@/lib/i18n/cv-headings";
import type { Lang } from "@/lib/i18n/translations";
import {
  IcoEmail, IcoPhone, IcoPin, IcoLinkedIn, IcoGlobe,
  ContactItem, SkillBar,
  fmtDate, dateRange,
  CVData,
  visibleSkills,
} from "@/components/templates/template-utils";

interface Props {
  data: CVData;
  primaryColor: string;
  fontFamily: string;
  lang?: Lang;
  }

function SectionTitle({ title, color }: { title: string; color: string }) {
  return (
    <div style={{
      fontSize: 9.5,
      fontWeight: 700,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      color,
      borderBottom: `2px solid ${color}`,
      paddingBottom: 4,
      marginBottom: 10,
    }}>
      {title}
    </div>
  );
}

export function HorizonTemplate({ data, primaryColor, fontFamily, lang = "en" }: Props) {
  const L = cvHeadings(lang);
  const { personal, summary, experience, education, skills, languages, certifications, referees, hobbies } = data;
  const hidden = (k: string) => data.hiddenSections?.includes(k) ?? false;

  return (
    <div style={{
      width: 794,
      minHeight: 1123,
      backgroundColor: "#ffffff",
      fontFamily: fontFamily || "'Inter', 'Helvetica Neue', Arial, sans-serif",
      color: "#1f2937",
      boxSizing: "border-box",
    }}>
      {/* Full-width orange header banner — the horizon */}
      <div style={{
        width: "100%",
        height: 90,
        backgroundColor: primaryColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 32px",
        boxSizing: "border-box",
      }}>
        <div>
          <div style={{
            fontSize: 26,
            fontWeight: 700,
            color: "#ffffff",
            lineHeight: 1.15,
            letterSpacing: "0.01em",
          }}>
            {personal.fullName}
          </div>
        </div>
        {personal.jobTitle && (
          <div style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.92)",
            textAlign: "right",
            maxWidth: 260,
            lineHeight: 1.4,
            fontWeight: 400,
          }}>
            {personal.jobTitle}
          </div>
        )}
      </div>

      {/* Three-column body */}
      <div style={{ display: "flex", alignItems: "flex-start", minHeight: 1033 }}>

        {/* Left column: Contact + Skills + Languages + Hobbies */}
        <div style={{
          width: 180,
          flexShrink: 0,
          padding: "20px 16px 20px 20px",
          backgroundColor: "#fff7ed",
          minHeight: 1033,
          boxSizing: "border-box",
        }}>
          {/* Contact */}
          <div style={{ marginBottom: 20 }}>
            <SectionTitle title={L.contact} color={primaryColor} />
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
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
          </div>

          {/* Skills with bar */}
          {skills?.length > 0 && !hidden("skills") && (
            <div style={{ marginBottom: 20 }}>
              <SectionTitle title={L.skills} color={primaryColor} />
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {visibleSkills(skills).map((skill) => (
                  <div key={skill.id}>
                    <div style={{ fontSize: 9.5, color: "#374151", marginBottom: 3 }}>{skill.name}</div>
                    <SkillBar level={skill.level} color={primaryColor} bgColor="#fed7aa" width={128} height={4} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {languages?.length > 0 && !hidden("languages") && (
            <div style={{ marginBottom: 20 }}>
              <SectionTitle title={L.languages} color={primaryColor} />
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {languages.map((lang) => (
                  <div key={lang.id}>
                    <div style={{ fontSize: 9.5, color: "#374151", fontWeight: 600 }}>{lang.name}</div>
                    <div style={{ fontSize: 8.5, color: "#9ca3af" }}>{lang.proficiency}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hobbies */}
          {hobbies && !hidden("hobbies") && (
            <div>
              <SectionTitle title={L.interests} color={primaryColor} />
              <p style={{ fontSize: 9, color: "#374151", lineHeight: 1.6, margin: 0 }}>{hobbies}</p>
            </div>
          )}
        </div>

        {/* Middle column: Summary + Experience */}
        <div style={{ flex: 1, padding: "20px 20px 20px 22px", boxSizing: "border-box" }}>
          {summary && !hidden("summary") && (
            <div style={{ marginBottom: 20 }}>
              <SectionTitle title={L.profile} color={primaryColor} />
              <p style={{ fontSize: 10, lineHeight: 1.7, color: "#4b5563", margin: 0 }}>{summary}</p>
            </div>
          )}

          {experience?.length > 0 && !hidden("experience") && (
            <div>
              <SectionTitle title={L.experience} color={primaryColor} />
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {experience.map((exp) => (
                  <div key={exp.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 1 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#111827" }}>{exp.company}</span>
                      <span style={{ fontSize: 9, color: "#9ca3af", whiteSpace: "nowrap", marginLeft: 8 }}>
                        {dateRange(exp.startDate, exp.endDate, exp.current)}
                      </span>
                    </div>
                    <div style={{ fontSize: 10, color: "#6b7280", fontWeight: 500, marginBottom: 5 }}>
                      {exp.position}
                      {exp.location && <span style={{ color: "#9ca3af", marginLeft: 6 }}>· {exp.location}</span>}
                    </div>
                    {exp.description && (
                      <div>
                        {exp.description.split("\n").filter(Boolean).map((line, i) => (
                          <div key={i} style={{ display: "flex", gap: 6, marginBottom: 3 }}>
                            <span style={{ color: primaryColor, fontSize: 10, lineHeight: 1.6, flexShrink: 0, marginTop: 1 }}>▸</span>
                            <span style={{ fontSize: 9.5, color: "#4b5563", lineHeight: 1.6 }}>{line}</span>
                          </div>
                        ))}
                        {!exp.description.includes("\n") && (
                          <div style={{ display: "flex", gap: 6 }}>
                            <span style={{ color: primaryColor, fontSize: 10, lineHeight: 1.6, flexShrink: 0, marginTop: 1 }}>▸</span>
                            <span style={{ fontSize: 9.5, color: "#4b5563", lineHeight: 1.6 }}>{exp.description}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column: Education + Certifications + Languages overflow */}
        <div style={{
          width: 200,
          flexShrink: 0,
          padding: "20px 20px 20px 12px",
          boxSizing: "border-box",
        }}>
          {education?.length > 0 && !hidden("education") && (
            <div style={{ marginBottom: 20 }}>
              <SectionTitle title={L.education} color={primaryColor} />
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {education.map((edu) => (
                  <div key={edu.id}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: "#111827", marginBottom: 1 }}>{edu.institution}</div>
                    <div style={{ fontSize: 9.5, color: "#6b7280", marginBottom: 1 }}>
                      {edu.degree}{edu.field ? `, ${edu.field}` : ""}
                    </div>
                    <div style={{ fontSize: 9, color: "#9ca3af" }}>
                      {dateRange(edu.startDate, edu.endDate, false)}
                    </div>
                    {edu.grade && (
                      <div style={{ fontSize: 9, color: "#9ca3af" }}>Grade: {edu.grade}</div>
                    )}
                    {edu.description && (
                      <p style={{ fontSize: 9, color: "#6b7280", lineHeight: 1.5, margin: "4px 0 0 0" }}>{edu.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {certifications?.length > 0 && !hidden("certifications") && (
            <div>
              <SectionTitle title={L.certifications} color={primaryColor} />
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

          {referees?.length > 0 && !hidden("referees") && (
            <div>
              <SectionTitle title="Referees / Wadhamini" color={primaryColor} />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {referees.map((ref) => (
                  <div key={ref.id}>
                    <div style={{ fontSize: 9.5, fontWeight: 600, color: "#111827" }}>{ref.name}</div>
                    {(ref.title || ref.company) && (
                      <div style={{ fontSize: 9, color: "#6b7280" }}>
                        {ref.title}{ref.company ? `, ${ref.company}` : ""}
                      </div>
                    )}
                    {(ref.email || ref.phone) && (
                      <div style={{ fontSize: 8.5, color: "#9ca3af" }}>
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
