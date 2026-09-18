import React from "react";
import { cvHeadings } from "@/lib/i18n/cv-headings";
import type { Lang } from "@/lib/i18n/translations";
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
  lang?: Lang;
  }

function StationLabel({ title, primaryColor }: { title: string; primaryColor: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
      <div style={{
        backgroundColor: primaryColor,
        color: "#ffffff",
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        padding: "2px 8px",
        borderRadius: 10,
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}>
        {title}
      </div>
    </div>
  );
}

export function MetroTemplate({ data, primaryColor, fontFamily, lang = "en" }: Props) {
  const L = cvHeadings(lang);
  const { personal, summary, experience, education, skills, languages, certifications, referees, hobbies } = data;
  const hidden = (k: string) => data.hiddenSections?.includes(k) ?? false;

  const sidebarBg = "#1e293b";

  return (
    <div style={{
      width: 794,
      minHeight: 1123,
      backgroundColor: "#f8fafc",
      fontFamily: fontFamily || "'Inter', 'Helvetica Neue', Arial, sans-serif",
      color: "#1e293b",
      display: "flex",
      boxSizing: "border-box",
    }}>
      {/* Left Sidebar */}
      <div style={{
        width: 200,
        minHeight: 1123,
        backgroundColor: sidebarBg,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}>
        {/* Colored left stripe */}
        <div style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          backgroundColor: primaryColor,
        }} />

        <div style={{ padding: "32px 16px 32px 22px", display: "flex", flexDirection: "column", gap: 0 }}>
          {/* Name */}
          <div style={{
            fontSize: 16,
            fontWeight: 700,
            color: "#ffffff",
            lineHeight: 1.2,
            marginBottom: 4,
          }}>
            {personal.fullName}
          </div>
          {personal.jobTitle && (
            <div style={{
              fontSize: 10,
              color: primaryColor,
              fontWeight: 500,
              marginBottom: 20,
              lineHeight: 1.4,
            }}>
              {personal.jobTitle}
            </div>
          )}

          {/* Contact */}
          <div style={{ marginBottom: 24 }}>
            <div style={{
              fontSize: 8,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#94a3b8",
              marginBottom: 10,
            }}>
              {L.contact}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {personal.email && (
                <ContactItem icon={<IcoEmail size={9} color={primaryColor} />} text={personal.email} color="#cbd5e1" fontSize={9} />
              )}
              {personal.phone && (
                <ContactItem icon={<IcoPhone size={9} color={primaryColor} />} text={personal.phone} color="#cbd5e1" fontSize={9} />
              )}
              {personal.location && (
                <ContactItem icon={<IcoPin size={9} color={primaryColor} />} text={personal.location} color="#cbd5e1" fontSize={9} />
              )}
              {personal.linkedin && (
                <ContactItem icon={<IcoLinkedIn size={9} color={primaryColor} />} text={personal.linkedin} color="#cbd5e1" fontSize={9} />
              )}
              {personal.website && (
                <ContactItem icon={<IcoGlobe size={9} color={primaryColor} />} text={personal.website} color="#cbd5e1" fontSize={9} />
              )}
            </div>
          </div>

          {/* Skills */}
          {skills?.length > 0 && !hidden("skills") && (
            <div style={{ marginBottom: 24 }}>
              <div style={{
                fontSize: 8,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#94a3b8",
                marginBottom: 10,
              }}>
                {L.skills}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {visibleSkills(skills).map((skill) => (
                  <div key={skill.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 9.5, color: "#e2e8f0", flexShrink: 0, maxWidth: 100 }}>{skill.name}</span>
                    <SkillDots level={skill.level} color={primaryColor} emptyColor="rgba(255,255,255,0.15)" size={6} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {languages?.length > 0 && !hidden("languages") && (
            <div style={{ marginBottom: 24 }}>
              <div style={{
                fontSize: 8,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#94a3b8",
                marginBottom: 10,
              }}>
                {L.languages}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {languages.map((lang) => (
                  <div key={lang.id}>
                    <div style={{ fontSize: 9.5, color: "#e2e8f0", fontWeight: 600 }}>{lang.name}</div>
                    <div style={{ fontSize: 8.5, color: "#94a3b8" }}>{lang.proficiency}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hobbies */}
          {hobbies && !hidden("hobbies") && (
            <div>
              <div style={{
                fontSize: 8,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#94a3b8",
                marginBottom: 8,
              }}>
                {L.interests}
              </div>
              <p style={{ fontSize: 9, color: "#94a3b8", lineHeight: 1.6, margin: 0 }}>{hobbies}</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Main Content */}
      <div style={{ flex: 1, padding: "32px 32px 32px 28px", display: "flex", flexDirection: "column", gap: 0 }}>

        {/* Summary */}
        {summary && !hidden("summary") && (
          <div style={{ marginBottom: 22 }}>
            <StationLabel title={L.profile} primaryColor={primaryColor} />
            <p style={{ fontSize: 10, lineHeight: 1.7, color: "#334155", margin: 0 }}>{summary}</p>
          </div>
        )}

        {/* Experience */}
        {experience?.length > 0 && !hidden("experience") && (
          <div style={{ marginBottom: 22 }}>
            <StationLabel title={L.experience} primaryColor={primaryColor} />
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {experience.map((exp) => (
                <div key={exp.id} style={{ paddingLeft: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 1 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: primaryColor }}>{exp.company}</span>
                    <span style={{ fontSize: 9, color: "#94a3b8", whiteSpace: "nowrap", marginLeft: 10 }}>
                      {dateRange(exp.startDate, exp.endDate, exp.current)}
                    </span>
                  </div>
                  <div style={{ fontSize: 10, color: "#475569", fontWeight: 500, marginBottom: 4 }}>
                    {exp.position}
                    {exp.location && <span style={{ color: "#94a3b8", fontWeight: 400, marginLeft: 6 }}>· {exp.location}</span>}
                  </div>
                  {exp.description && (
                    <p style={{ fontSize: 9.5, color: "#64748b", lineHeight: 1.65, margin: 0 }}>
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
          <div style={{ marginBottom: 22 }}>
            <StationLabel title={L.education} primaryColor={primaryColor} />
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {education.map((edu) => (
                <div key={edu.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 1 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: primaryColor }}>{edu.institution}</span>
                    <span style={{ fontSize: 9, color: "#94a3b8", whiteSpace: "nowrap", marginLeft: 10 }}>
                      {dateRange(edu.startDate, edu.endDate, false)}
                    </span>
                  </div>
                  <div style={{ fontSize: 10, color: "#475569", marginBottom: 2 }}>
                    {edu.degree}{edu.field ? `, ${edu.field}` : ""}
                  </div>
                  {edu.grade && (
                    <div style={{ fontSize: 9.5, color: "#94a3b8" }}>Grade: {edu.grade}</div>
                  )}
                  {edu.description && (
                    <p style={{ fontSize: 9.5, color: "#64748b", lineHeight: 1.6, margin: "4px 0 0 0" }}>
                      {edu.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {certifications?.length > 0 && !hidden("certifications") && (
          <div>
            <StationLabel title={L.certifications} primaryColor={primaryColor} />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {certifications.map((cert) => (
                <div key={cert.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 600, color: "#1e293b" }}>{cert.name}</span>
                    <span style={{ fontSize: 9.5, color: "#64748b", marginLeft: 6 }}>{cert.issuer}</span>
                  </div>
                  <span style={{ fontSize: 9, color: "#94a3b8", whiteSpace: "nowrap", marginLeft: 10 }}>
                    {fmtDate(cert.date)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Referees */}
        {referees.length > 0 && !hidden("referees") && (
          <div>
            <StationLabel title="Referees / Wadhamini" primaryColor={primaryColor} />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {referees.map((ref) => (
                <div key={ref.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 600, color: "#1e293b" }}>{ref.name}</span>
                    <span style={{ fontSize: 9.5, color: "#64748b", marginLeft: 6 }}>{ref.title}{ref.company ? ` — ${ref.company}` : ""}</span>
                  </div>
                  <span style={{ fontSize: 9, color: "#94a3b8", whiteSpace: "nowrap", marginLeft: 10 }}>
                    {ref.email}{ref.phone ? ` · ${ref.phone}` : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
