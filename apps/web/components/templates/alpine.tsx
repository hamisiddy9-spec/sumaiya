import type { CVData } from "@/types";
import {
  IcoEmail, IcoPhone, IcoPin, IcoLinkedIn, IcoGlobe,
  ContactItem, fmtDate, dateRange,
  visibleSkills,
} from "@/components/templates/template-utils";

interface Props { data: CVData; primaryColor: string; fontFamily: string }

export function AlpineTemplate({ data, primaryColor, fontFamily }: Props) {
  const { personal, summary, experience, education, skills, languages, certifications, referees, hobbies } = data;
  const hidden = (k: string) => data.hiddenSections?.includes(k) ?? false;
  const dark = "#111827";
  const mid = "#374151";
  const muted = "#6b7280";

  const SectionHeader = ({ title }: { title: string }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
      <span style={{ fontSize: 14, color: primaryColor, lineHeight: 1 }}>●</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: dark, letterSpacing: "0.02em" }}>{title}</span>
    </div>
  );

  const TimelineDot = () => (
    <div style={{
      width: 8, height: 8, borderRadius: "50%",
      backgroundColor: primaryColor,
      flexShrink: 0, marginTop: 4,
    }} />
  );

  return (
    <div style={{
      width: 794, minHeight: 1123, fontFamily, backgroundColor: "#fff",
      boxSizing: "border-box", padding: "48px 56px",
    }}>
      {/* Header */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 24, fontWeight: 700, color: dark, letterSpacing: "-0.01em" }}>
          {personal.fullName}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
          <div style={{ height: 1.5, width: 32, backgroundColor: primaryColor }} />
          <div style={{ fontSize: 12, color: primaryColor, fontWeight: 600, letterSpacing: "0.03em" }}>
            {personal.jobTitle}
          </div>
        </div>
      </div>

      {/* Contact row */}
      <div style={{ display: "flex", gap: 18, flexWrap: "wrap" as const, margin: "16px 0 36px 0" }}>
        {personal.email && (
          <ContactItem icon={<IcoEmail size={10} color={primaryColor} />} text={personal.email} color={mid} fontSize={10} />
        )}
        {personal.phone && (
          <ContactItem icon={<IcoPhone size={10} color={primaryColor} />} text={personal.phone} color={mid} fontSize={10} />
        )}
        {personal.location && (
          <ContactItem icon={<IcoPin size={10} color={primaryColor} />} text={personal.location} color={mid} fontSize={10} />
        )}
        {personal.linkedin && (
          <ContactItem icon={<IcoLinkedIn size={10} color={primaryColor} />} text={personal.linkedin} color={mid} fontSize={10} />
        )}
        {personal.website && (
          <ContactItem icon={<IcoGlobe size={10} color={primaryColor} />} text={personal.website} color={mid} fontSize={10} />
        )}
      </div>

      {/* Summary */}
      {summary && !hidden("summary") && (
        <div style={{ marginBottom: 36 }}>
          <SectionHeader title="Profile" />
          <p style={{ fontSize: 11, color: mid, lineHeight: 1.75, margin: 0, maxWidth: 640 }}>{summary}</p>
        </div>
      )}

      {/* Experience */}
      {experience?.length > 0 && !hidden("experience") && (
        <div style={{ marginBottom: 36 }}>
          <SectionHeader title="Experience" />
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 20 }}>
            {experience.map((exp) => (
              <div key={exp.id} style={{ display: "flex", gap: 14 }}>
                <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "center", paddingTop: 2 }}>
                  <TimelineDot />
                  <div style={{ flex: 1, width: 1, backgroundColor: "#e5e7eb", marginTop: 4 }} />
                </div>
                <div style={{ flex: 1, paddingBottom: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: dark }}>{exp.position}</div>
                      <div style={{ fontSize: 11, color: primaryColor, fontWeight: 600, marginTop: 2 }}>
                        {exp.company}{exp.location ? ` · ${exp.location}` : ""}
                      </div>
                    </div>
                    <div style={{ fontSize: 10, color: muted, whiteSpace: "nowrap" as const, flexShrink: 0 }}>
                      {dateRange(exp.startDate, exp.endDate, exp.current)}
                    </div>
                  </div>
                  {exp.description && (
                    <p style={{ fontSize: 10.5, color: mid, lineHeight: 1.65, margin: "7px 0 0 0" }}>{exp.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {education?.length > 0 && !hidden("education") && (
        <div style={{ marginBottom: 36 }}>
          <SectionHeader title="Education" />
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 14 }}>
            {education.map((edu) => (
              <div key={edu.id} style={{ display: "flex", gap: 14 }}>
                <div style={{ paddingTop: 4 }}>
                  <TimelineDot />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: dark }}>
                        {edu.degree}{edu.field ? ` in ${edu.field}` : ""}
                      </div>
                      <div style={{ fontSize: 11, color: primaryColor, fontWeight: 600, marginTop: 2 }}>{edu.institution}</div>
                    </div>
                    <div style={{ fontSize: 10, color: muted, whiteSpace: "nowrap" as const, flexShrink: 0 }}>
                      {dateRange(edu.startDate, edu.endDate, false)}
                    </div>
                  </div>
                  {(edu.grade || edu.description) && (
                    <p style={{ fontSize: 10.5, color: mid, lineHeight: 1.65, margin: "6px 0 0 0" }}>
                      {edu.grade ? `Grade: ${edu.grade}` : ""}{edu.grade && edu.description ? " — " : ""}{edu.description ?? ""}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills as pill tags */}
      {skills?.length > 0 && !hidden("skills") && (
        <div style={{ marginBottom: 36 }}>
          <SectionHeader title="Skills" />
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}>
            {visibleSkills(skills).map((sk) => (
              <div key={sk.id} style={{
                border: `1.5px solid ${primaryColor}`,
                borderRadius: 20, padding: "4px 12px",
                fontSize: 10.5, color: dark, fontWeight: 500,
              }}>
                {sk.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom row: languages + certs + hobbies */}
      <div style={{ display: "flex", gap: 40, flexWrap: "wrap" as const }}>
        {languages?.length > 0 && !hidden("languages") && (
          <div style={{ minWidth: 150 }}>
            <SectionHeader title="Languages" />
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 5 }}>
              {languages.map((lang) => (
                <div key={lang.id} style={{ display: "flex", gap: 6, alignItems: "baseline" }}>
                  <span style={{ fontSize: 11, color: dark, fontWeight: 600 }}>{lang.name}</span>
                  <span style={{ fontSize: 9.5, color: muted }}>— {lang.proficiency}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {certifications?.length > 0 && !hidden("certifications") && (
          <div style={{ flex: 1 }}>
            <SectionHeader title="Certifications" />
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
              {certifications.map((cert) => (
                <div key={cert.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: dark }}>{cert.name}</span>
                    <span style={{ fontSize: 10, color: muted }}> · {cert.issuer}</span>
                  </div>
                  <span style={{ fontSize: 10, color: muted, whiteSpace: "nowrap" as const }}>{fmtDate(cert.date)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {referees?.length > 0 && !hidden("referees") && (
          <div style={{ flex: 1 }}>
            <SectionHeader title="Referees / Wadhamini" />
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
              {referees.map((ref) => (
                <div key={ref.id}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: dark }}>{ref.name}</span>
                    {(ref.title || ref.company) && (
                      <span style={{ fontSize: 10, color: muted }}> · {ref.title}{ref.company ? ` at ${ref.company}` : ""}</span>
                    )}
                  </div>
                  {(ref.email || ref.phone) && (
                    <div style={{ fontSize: 9.5, color: muted, marginTop: 2 }}>
                      {ref.email}{ref.phone ? ` · ${ref.phone}` : ""}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {hobbies && !hidden("hobbies") && (
          <div style={{ flex: 1 }}>
            <SectionHeader title="Interests" />
            <p style={{ fontSize: 10.5, color: mid, lineHeight: 1.7, margin: 0 }}>{hobbies}</p>
          </div>
        )}
      </div>
    </div>
  );
}
