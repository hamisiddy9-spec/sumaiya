import type { CVData } from "@/types";
import {
  IcoEmail, IcoPhone, IcoPin, IcoLinkedIn, IcoGlobe,
  PhotoCircle, SkillDots, ContactItem, fmtDate, dateRange,
  visibleSkills,
} from "@/components/templates/template-utils";

interface Props { data: CVData; primaryColor: string; fontFamily: string }

export function EclipseTemplate({ data, primaryColor, fontFamily }: Props) {
  const { personal, summary, experience, education, skills, languages, certifications, referees, hobbies } = data;
  const hidden = (k: string) => data.hiddenSections?.includes(k) ?? false;
  const headerBg = "#0F172A";

  const SectionHeader = ({ title }: { title: string }) => (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", color: "#1e293b", textTransform: "uppercase" as const }}>
        {title}
      </div>
      <div style={{ height: 2, width: 36, backgroundColor: primaryColor, marginTop: 4 }} />
    </div>
  );

  return (
    <div style={{
      width: 794, minHeight: 1123, fontFamily, backgroundColor: "#fff",
      boxSizing: "border-box", position: "relative" as const,
    }}>
      {/* Dark header */}
      <div style={{
        backgroundColor: headerBg, height: 120,
        display: "flex", alignItems: "center",
        justifyContent: "space-between", padding: "0 40px",
        boxSizing: "border-box",
      }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#fff", letterSpacing: "0.01em", lineHeight: 1.15 }}>
            {personal.fullName}
          </div>
          <div style={{ fontSize: 12, fontWeight: 500, color: primaryColor, marginTop: 5, letterSpacing: "0.04em" }}>
            {personal.jobTitle}
          </div>
        </div>
        <PhotoCircle
          url={personal.photo}
          name={personal.fullName}
          size={80}
          bgColor={primaryColor}
          borderColor="rgba(255,255,255,0.25)"
          borderWidth={3}
        />
      </div>

      {/* Contact band */}
      <div style={{
        backgroundColor: `${primaryColor}1A`,
        padding: "10px 40px",
        display: "flex", gap: 20, flexWrap: "wrap" as const, alignItems: "center",
        boxSizing: "border-box",
      }}>
        {personal.email && (
          <ContactItem icon={<IcoEmail size={10} color={primaryColor} />} text={personal.email} color="#374151" fontSize={10} />
        )}
        {personal.phone && (
          <ContactItem icon={<IcoPhone size={10} color={primaryColor} />} text={personal.phone} color="#374151" fontSize={10} />
        )}
        {personal.location && (
          <ContactItem icon={<IcoPin size={10} color={primaryColor} />} text={personal.location} color="#374151" fontSize={10} />
        )}
        {personal.linkedin && (
          <ContactItem icon={<IcoLinkedIn size={10} color={primaryColor} />} text={personal.linkedin} color="#374151" fontSize={10} />
        )}
        {personal.website && (
          <ContactItem icon={<IcoGlobe size={10} color={primaryColor} />} text={personal.website} color="#374151" fontSize={10} />
        )}
      </div>

      {/* Body */}
      <div style={{ padding: "28px 40px", boxSizing: "border-box" }}>

        {/* Summary */}
        {summary && !hidden("summary") && (
          <div style={{ marginBottom: 24 }}>
            <SectionHeader title="Profile" />
            <p style={{ fontSize: 11, color: "#374151", lineHeight: 1.65, margin: 0 }}>{summary}</p>
          </div>
        )}

        {/* Experience */}
        {experience?.length > 0 && !hidden("experience") && (
          <div style={{ marginBottom: 24 }}>
            <SectionHeader title="Experience" />
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 16 }}>
              {experience.map((exp) => (
                <div key={exp.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{exp.position}</div>
                      <div style={{ fontSize: 11, color: primaryColor, fontWeight: 600, marginTop: 1 }}>{exp.company}{exp.location ? ` · ${exp.location}` : ""}</div>
                    </div>
                    <div style={{ fontSize: 10, color: "#6b7280", whiteSpace: "nowrap" as const, flexShrink: 0 }}>
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
          <div style={{ marginBottom: 24 }}>
            <SectionHeader title="Education" />
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 14 }}>
              {education.map((edu) => (
                <div key={edu.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{edu.degree}{edu.field ? ` in ${edu.field}` : ""}</div>
                      <div style={{ fontSize: 11, color: primaryColor, fontWeight: 600, marginTop: 1 }}>{edu.institution}</div>
                    </div>
                    <div style={{ fontSize: 10, color: "#6b7280", whiteSpace: "nowrap" as const, flexShrink: 0 }}>
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

        {/* Skills */}
        {skills?.length > 0 && !hidden("skills") && (
          <div style={{ marginBottom: 24 }}>
            <SectionHeader title="Skills" />
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "8px 24px" }}>
              {visibleSkills(skills).map((sk) => (
                <div key={sk.id} style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 160 }}>
                  <span style={{ fontSize: 11, color: "#374151", flex: 1 }}>{sk.name}</span>
                  <SkillDots level={sk.level} color={primaryColor} emptyColor="#e5e7eb" size={7} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Languages + Certifications + Hobbies row */}
        <div style={{ display: "flex", gap: 32 }}>
          {languages?.length > 0 && !hidden("languages") && (
            <div style={{ flex: 1 }}>
              <SectionHeader title="Languages" />
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 5 }}>
                {languages.map((lang) => (
                  <div key={lang.id} style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11, color: "#374151" }}>{lang.name}</span>
                    <span style={{ fontSize: 10, color: "#6b7280" }}>{lang.proficiency}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {certifications?.length > 0 && !hidden("certifications") && (
            <div style={{ flex: 2 }}>
              <SectionHeader title="Certifications" />
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 5 }}>
                {certifications.map((cert) => (
                  <div key={cert.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#1e293b" }}>{cert.name}</span>
                      <span style={{ fontSize: 10, color: "#6b7280" }}> · {cert.issuer}</span>
                    </div>
                    <span style={{ fontSize: 10, color: "#9ca3af", whiteSpace: "nowrap" as const, marginLeft: 8 }}>{fmtDate(cert.date)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Referees */}
        {referees?.length > 0 && !hidden("referees") && (
          <div style={{ marginBottom: 24 }}>
            <SectionHeader title="Referees / Wadhamini" />
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 5 }}>
              {referees.map((ref) => (
                <div key={ref.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#1e293b" }}>{ref.name}</span>
                    <span style={{ fontSize: 10, color: "#6b7280" }}> · {ref.title}{ref.company ? ` at ${ref.company}` : ""}</span>
                  </div>
                  {ref.email && (
                    <span style={{ fontSize: 10, color: "#9ca3af", whiteSpace: "nowrap" as const, marginLeft: 8 }}>{ref.email}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {hobbies && !hidden("hobbies") && (
          <div style={{ marginTop: 20 }}>
            <SectionHeader title="Interests" />
            <p style={{ fontSize: 11, color: "#4b5563", lineHeight: 1.6, margin: 0 }}>{hobbies}</p>
          </div>
        )}
      </div>
    </div>
  );
}
