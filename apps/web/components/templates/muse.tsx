import type { CVData } from "@/types";
import {
  IcoEmail, IcoPhone, IcoPin, IcoLinkedIn, IcoGlobe,
  PhotoSquare, SkillBar, ContactItem, fmtDate, dateRange,
  visibleSkills,
} from "@/components/templates/template-utils";

interface Props { data: CVData; primaryColor: string; fontFamily: string }

export function MuseTemplate({ data, primaryColor, fontFamily }: Props) {
  const { personal, summary, experience, education, skills, languages, certifications, referees, hobbies } = data;
  const hidden = (k: string) => data.hiddenSections?.includes(k) ?? false;
  const sidebarWidth = 210;
  const dark = "#1f2937";

  const SidebarSection = ({ title }: { title: string }) => (
    <div style={{ marginBottom: 6 }}>
      <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.1em", color: primaryColor, textTransform: "uppercase" as const, marginBottom: 8 }}>
        {title}
      </div>
    </div>
  );

  const Divider = () => (
    <div style={{ height: 1, backgroundColor: "#f3f4f6", margin: "14px 0" }} />
  );

  const MainSectionHeader = ({ title }: { title: string }) => (
    <div style={{ display: "inline-flex", alignItems: "center", marginBottom: 12 }}>
      <span style={{
        backgroundColor: primaryColor, color: "#fff",
        fontSize: 9, fontWeight: 700, letterSpacing: "0.09em",
        textTransform: "uppercase" as const,
        padding: "3px 10px", borderRadius: 20,
      }}>
        {title}
      </span>
    </div>
  );

  const Card = ({ children }: { children: React.ReactNode }) => (
    <div style={{
      backgroundColor: "#fff",
      borderRadius: 6,
      boxShadow: "0 1px 4px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)",
      padding: "12px 14px",
      marginBottom: 10,
    }}>
      {children}
    </div>
  );

  return (
    <div style={{
      width: 794, minHeight: 1123, fontFamily, backgroundColor: "#f9fafb",
      display: "flex", boxSizing: "border-box",
    }}>
      {/* Sidebar */}
      <div style={{
        width: sidebarWidth, flexShrink: 0,
        backgroundColor: "#fff",
        borderLeft: `6px solid ${primaryColor}`,
        padding: "28px 18px",
        boxSizing: "border-box",
        display: "flex", flexDirection: "column" as const, gap: 0,
      }}>
        {/* Photo */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
          <PhotoSquare
            url={personal.photo}
            name={personal.fullName}
            size={80}
            radius={8}
            bgColor={primaryColor}
            borderColor={`${primaryColor}33`}
            borderWidth={2}
          />
        </div>

        {/* Name + title */}
        <div style={{ textAlign: "center" as const, marginBottom: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: dark, lineHeight: 1.2 }}>{personal.fullName}</div>
          <div style={{ fontSize: 10.5, color: primaryColor, fontWeight: 600, marginTop: 4, letterSpacing: "0.02em" }}>{personal.jobTitle}</div>
        </div>

        <Divider />

        {/* Contact */}
        <SidebarSection title="Contact" />
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 7, marginBottom: 14 }}>
          {personal.email && (
            <ContactItem icon={<IcoEmail size={10} color={dark} />} text={personal.email} color={dark} fontSize={9.5} />
          )}
          {personal.phone && (
            <ContactItem icon={<IcoPhone size={10} color={dark} />} text={personal.phone} color={dark} fontSize={9.5} />
          )}
          {personal.location && (
            <ContactItem icon={<IcoPin size={10} color={dark} />} text={personal.location} color={dark} fontSize={9.5} />
          )}
          {personal.linkedin && (
            <ContactItem icon={<IcoLinkedIn size={10} color={dark} />} text={personal.linkedin} color={dark} fontSize={9.5} />
          )}
          {personal.website && (
            <ContactItem icon={<IcoGlobe size={10} color={dark} />} text={personal.website} color={dark} fontSize={9.5} />
          )}
        </div>

        {/* Skills */}
        {skills?.length > 0 && !hidden("skills") && (
          <>
            <Divider />
            <SidebarSection title="Skills" />
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 8, marginBottom: 14 }}>
              {visibleSkills(skills).map((sk) => (
                <div key={sk.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 10, color: dark }}>{sk.name}</span>
                  </div>
                  <SkillBar level={sk.level} color={primaryColor} bgColor="#f3f4f6" width={155} height={4} />
                </div>
              ))}
            </div>
          </>
        )}

        {/* Languages */}
        {languages?.length > 0 && !hidden("languages") && (
          <>
            <Divider />
            <SidebarSection title="Languages" />
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 6, marginBottom: 14 }}>
              {languages.map((lang) => (
                <div key={lang.id}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 10, color: dark, fontWeight: 600 }}>{lang.name}</span>
                    <span style={{ fontSize: 9, color: "#6b7280" }}>{lang.proficiency}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Hobbies */}
        {hobbies && !hidden("hobbies") && (
          <>
            <Divider />
            <SidebarSection title="Interests" />
            <p style={{ fontSize: 9.5, color: "#6b7280", lineHeight: 1.6, margin: 0 }}>{hobbies}</p>
          </>
        )}
      </div>

      {/* Main content */}
      <div style={{
        flex: 1,
        padding: "28px 24px 28px 20px",
        boxSizing: "border-box",
        display: "flex", flexDirection: "column" as const, gap: 0,
      }}>
        {/* Summary */}
        {summary && !hidden("summary") && (
          <div style={{ marginBottom: 20 }}>
            <MainSectionHeader title="Profile" />
            <Card>
              <p style={{ fontSize: 10.5, color: "#374151", lineHeight: 1.7, margin: 0 }}>{summary}</p>
            </Card>
          </div>
        )}

        {/* Experience */}
        {experience?.length > 0 && !hidden("experience") && (
          <div style={{ marginBottom: 20 }}>
            <MainSectionHeader title="Experience" />
            {experience.map((exp) => (
              <Card key={exp.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
                  <div>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: dark }}>{exp.position}</div>
                    <div style={{ fontSize: 10.5, color: primaryColor, fontWeight: 600, marginTop: 2 }}>
                      {exp.company}{exp.location ? ` · ${exp.location}` : ""}
                    </div>
                  </div>
                  <div style={{
                    fontSize: 9.5, color: "#6b7280",
                    backgroundColor: `${primaryColor}15`,
                    padding: "2px 7px", borderRadius: 10,
                    whiteSpace: "nowrap" as const, flexShrink: 0,
                    marginTop: 1,
                  }}>
                    {dateRange(exp.startDate, exp.endDate, exp.current)}
                  </div>
                </div>
                {exp.description && (
                  <p style={{ fontSize: 10, color: "#4b5563", lineHeight: 1.65, margin: "8px 0 0 0" }}>{exp.description}</p>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Education */}
        {education?.length > 0 && !hidden("education") && (
          <div style={{ marginBottom: 20 }}>
            <MainSectionHeader title="Education" />
            {education.map((edu) => (
              <Card key={edu.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
                  <div>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: dark }}>
                      {edu.degree}{edu.field ? ` in ${edu.field}` : ""}
                    </div>
                    <div style={{ fontSize: 10.5, color: primaryColor, fontWeight: 600, marginTop: 2 }}>{edu.institution}</div>
                  </div>
                  <div style={{
                    fontSize: 9.5, color: "#6b7280",
                    backgroundColor: `${primaryColor}15`,
                    padding: "2px 7px", borderRadius: 10,
                    whiteSpace: "nowrap" as const, flexShrink: 0,
                    marginTop: 1,
                  }}>
                    {dateRange(edu.startDate, edu.endDate, false)}
                  </div>
                </div>
                {(edu.grade || edu.description) && (
                  <p style={{ fontSize: 10, color: "#4b5563", lineHeight: 1.65, margin: "8px 0 0 0" }}>
                    {edu.grade ? `Grade: ${edu.grade}` : ""}{edu.grade && edu.description ? " — " : ""}{edu.description ?? ""}
                  </p>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Certifications */}
        {certifications?.length > 0 && !hidden("certifications") && (
          <div>
            <MainSectionHeader title="Certifications" />
            {certifications.map((cert) => (
              <Card key={cert.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: dark }}>{cert.name}</span>
                    <span style={{ fontSize: 10, color: "#6b7280" }}> · {cert.issuer}</span>
                  </div>
                  <span style={{ fontSize: 9.5, color: "#9ca3af", whiteSpace: "nowrap" as const }}>{fmtDate(cert.date)}</span>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Referees / Wadhamini */}
        {referees?.length > 0 && !hidden("referees") && (
          <div style={{ marginTop: 20 }}>
            <MainSectionHeader title="Referees / Wadhamini" />
            {referees.map((ref) => (
              <Card key={ref.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: dark }}>{ref.name}</span>
                    {(ref.title || ref.company) && (
                      <span style={{ fontSize: 10, color: "#6b7280" }}> · {ref.title}{ref.company ? ` at ${ref.company}` : ""}</span>
                    )}
                  </div>
                </div>
                {(ref.email || ref.phone) && (
                  <div style={{ fontSize: 9.5, color: "#9ca3af", marginTop: 4 }}>
                    {ref.email}{ref.phone ? ` · ${ref.phone}` : ""}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
