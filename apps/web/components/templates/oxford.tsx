import React from "react";
import {
  IcoEmail, IcoPhone, IcoPin, IcoLinkedIn, IcoGlobe,
  fmtDate, dateRange,
  CVData,
  visibleSkills,
} from "@/components/templates/template-utils";

interface Props {
  data: CVData;
  primaryColor: string;
  fontFamily: string;
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.12em",
        color: "#374151",
        textTransform: "uppercase",
        marginBottom: 4,
      }}>
        {title}
      </div>
      <div style={{ borderBottom: "1px solid #9ca3af", width: "100%" }} />
    </div>
  );
}

export function OxfordTemplate({ data, primaryColor, fontFamily }: Props) {
  const { personal, summary, experience, education, skills, languages, certifications, referees, hobbies } = data;
  const hidden = (k: string) => data.hiddenSections?.includes(k) ?? false;

  const contactItems = [
    personal.email,
    personal.phone,
    personal.location,
    personal.linkedin,
    personal.website,
  ].filter(Boolean);

  return (
    <div style={{
      width: 794,
      minHeight: 1123,
      backgroundColor: "#ffffff",
      fontFamily: fontFamily || "Georgia, 'Times New Roman', serif",
      color: "#374151",
      boxSizing: "border-box",
      padding: "52px 60px",
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{
          fontSize: 30,
          fontWeight: 800,
          color: "#111827",
          letterSpacing: "0.02em",
          lineHeight: 1.15,
          marginBottom: 8,
        }}>
          {personal.fullName}
        </div>

        {/* Thin decorative line */}
        <div style={{ borderBottom: "1px solid #d1d5db", margin: "8px auto", width: "60%" }} />

        {personal.jobTitle && (
          <div style={{
            fontSize: 12,
            color: "#6b7280",
            fontStyle: "italic",
            marginBottom: 10,
            letterSpacing: "0.04em",
          }}>
            {personal.jobTitle}
          </div>
        )}

        {/* Contact row centered with dot separators */}
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "center",
          gap: 0,
          fontSize: 10,
          color: "#6b7280",
        }}>
          {contactItems.map((item, idx) => {
            let icon: React.ReactNode = null;
            if (item === personal.email) icon = <IcoEmail size={9} color="#9ca3af" />;
            else if (item === personal.phone) icon = <IcoPhone size={9} color="#9ca3af" />;
            else if (item === personal.location) icon = <IcoPin size={9} color="#9ca3af" />;
            else if (item === personal.linkedin) icon = <IcoLinkedIn size={9} color="#9ca3af" />;
            else if (item === personal.website) icon = <IcoGlobe size={9} color="#9ca3af" />;

            return (
              <React.Fragment key={idx}>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  {icon}
                  <span>{item}</span>
                </span>
                {idx < contactItems.length - 1 && (
                  <span style={{ margin: "0 8px", color: "#d1d5db" }}>·</span>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      {summary && !hidden("summary") && (
        <div style={{ marginBottom: 20 }}>
          <SectionHeader title="Profile" />
          <p style={{ fontSize: 10.5, lineHeight: 1.7, color: "#4b5563", margin: 0, textAlign: "justify" }}>
            {summary}
          </p>
        </div>
      )}

      {/* Experience */}
      {experience?.length > 0 && !hidden("experience") && (
        <div style={{ marginBottom: 20 }}>
          <SectionHeader title="Experience" />
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {experience.map((exp) => (
              <div key={exp.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#111827" }}>{exp.company}</span>
                    {exp.location && (
                      <span style={{ fontSize: 10, color: "#9ca3af", marginLeft: 8 }}>{exp.location}</span>
                    )}
                  </div>
                  <span style={{ fontSize: 9.5, color: "#6b7280", whiteSpace: "nowrap", marginLeft: 12 }}>
                    {dateRange(exp.startDate, exp.endDate, exp.current)}
                  </span>
                </div>
                <div style={{ fontSize: 10.5, fontStyle: "italic", color: "#4b5563", marginBottom: 4 }}>
                  {exp.position}
                </div>
                {exp.description && (
                  <p style={{ fontSize: 10, color: "#4b5563", lineHeight: 1.6, margin: 0, textAlign: "justify" }}>
                    {exp.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {education?.length > 0 && !hidden("education") && (
        <div style={{ marginBottom: 20 }}>
          <SectionHeader title="Education" />
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {education.map((edu) => (
              <div key={edu.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#111827" }}>{edu.institution}</span>
                  <span style={{ fontSize: 9.5, color: "#6b7280", whiteSpace: "nowrap", marginLeft: 12 }}>
                    {dateRange(edu.startDate, edu.endDate, false)}
                  </span>
                </div>
                <div style={{ fontSize: 10.5, fontStyle: "italic", color: "#4b5563", marginBottom: 2 }}>
                  {edu.degree}{edu.field ? `, ${edu.field}` : ""}
                </div>
                {edu.grade && (
                  <div style={{ fontSize: 10, color: "#6b7280" }}>Grade: {edu.grade}</div>
                )}
                {edu.description && (
                  <p style={{ fontSize: 10, color: "#4b5563", lineHeight: 1.6, margin: "4px 0 0 0" }}>
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
          <SectionHeader title="Skills" />
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 24px" }}>
            {visibleSkills(skills).map((skill) => (
              <span key={skill.id} style={{ fontSize: 10, color: "#374151" }}>
                {skill.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Languages */}
      {languages?.length > 0 && !hidden("languages") && (
        <div style={{ marginBottom: 20 }}>
          <SectionHeader title="Languages" />
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 24px" }}>
            {languages.map((lang) => (
              <span key={lang.id} style={{ fontSize: 10, color: "#374151" }}>
                <span style={{ fontWeight: 600 }}>{lang.name}</span>
                <span style={{ color: "#9ca3af", marginLeft: 4 }}>({lang.proficiency})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Certifications */}
      {certifications?.length > 0 && !hidden("certifications") && (
        <div style={{ marginBottom: 20 }}>
          <SectionHeader title="Certifications" />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {certifications.map((cert) => (
              <div key={cert.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div>
                  <span style={{ fontSize: 10.5, fontWeight: 600, color: "#111827" }}>{cert.name}</span>
                  <span style={{ fontSize: 10, color: "#6b7280", marginLeft: 8 }}>{cert.issuer}</span>
                </div>
                <span style={{ fontSize: 9.5, color: "#9ca3af", whiteSpace: "nowrap", marginLeft: 12 }}>
                  {fmtDate(cert.date)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Referees */}
      {referees?.length > 0 && !hidden("referees") && (
        <div style={{ marginBottom: 20 }}>
          <SectionHeader title="Referees" />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {referees.map((ref) => (
              <div key={ref.id}>
                <div style={{ fontSize: 10.5, fontWeight: 600, color: "#111827", marginBottom: 1 }}>
                  {ref.name}
                </div>
                {(ref.title || ref.company) && (
                  <div style={{ fontSize: 10, color: "#6b7280", marginBottom: 1 }}>
                    {ref.title}{ref.company ? `, ${ref.company}` : ""}
                  </div>
                )}
                {(ref.email || ref.phone) && (
                  <div style={{ fontSize: 10, color: "#9ca3af" }}>
                    {ref.email}{ref.phone ? ` · ${ref.phone}` : ""}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hobbies */}
      {hobbies && !hidden("hobbies") && (
        <div>
          <SectionHeader title="Interests" />
          <p style={{ fontSize: 10, color: "#4b5563", lineHeight: 1.6, margin: 0 }}>{hobbies}</p>
        </div>
      )}
    </div>
  );
}
