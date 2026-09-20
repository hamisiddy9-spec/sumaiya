import {
  IcoEmail, IcoPhone, IcoPin, IcoLinkedIn, IcoGlobe,
  PhotoCircle, SkillBar, ContactItem,
  fmtDate, dateRange,
} from "@/components/templates/template-utils";
import { visibleSkills } from "@/components/templates/template-utils";
import type { CVData } from "@/components/templates/template-utils";
import { cvHeadings } from "@/lib/i18n/cv-headings";
import type { Lang } from "@/lib/i18n/translations";

export function AtlasTemplate({
  data,
  primaryColor,
  fontFamily,
  lang = "en",
}: {
  data: CVData;
  primaryColor: string;
  fontFamily: string;
  lang?: Lang;
}) {
  const L = cvHeadings(lang);
  const {
    personal, summary, experience, education,
    skills, languages, certifications, referees, hobbies,
    hiddenSections = [],
  } = data;

  const show = (key: string) => !hiddenSections.includes(key);

  function SectionHeader({ title }: { title: string }) {
    return (
      <div style={{
        fontSize: 11,
        fontWeight: 700,
        textTransform: "uppercase" as const,
        letterSpacing: "0.1em",
        color: primaryColor,
        borderBottom: `2px solid ${primaryColor}`,
        paddingBottom: 5,
        marginBottom: 14,
      }}>
        {title}
      </div>
    );
  }

  return (
    <div style={{
      width: 794,
      minHeight: 1123,
      fontFamily,
      backgroundColor: "#fff",
      display: "flex",
      flexDirection: "column",
      boxSizing: "border-box",
    }}>

      {/* ── Dark header band ── */}
      <div style={{
        backgroundColor: "#1e293b",
        padding: "22px 32px",
        display: "flex",
        alignItems: "center",
        gap: 20,
        flexShrink: 0,
      }}>
        {/* Photo circle */}
        <PhotoCircle
          url={personal.photo}
          name={personal.fullName || "CV"}
          size={70}
          bgColor={primaryColor}
          borderColor="rgba(255,255,255,0.25)"
          borderWidth={2}
        />

        {/* Name, title, contact */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 22,
            fontWeight: 800,
            color: "#ffffff",
            lineHeight: 1.15,
            letterSpacing: "-0.01em",
          }}>
            {personal.fullName}
          </div>
          <div style={{
            fontSize: 11,
            color: `${primaryColor}cc`,
            fontWeight: 500,
            marginTop: 3,
            marginBottom: 10,
            textTransform: "uppercase" as const,
            letterSpacing: "0.1em",
          }}>
            {personal.jobTitle}
          </div>

          {/* Contact icons row */}
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 14, alignItems: "center" }}>
            {personal.email && (
              <ContactItem
                icon={<IcoEmail size={10} color="rgba(255,255,255,0.5)" />}
                text={personal.email}
                color="rgba(255,255,255,0.8)"
                fontSize={9.5}
              />
            )}
            {personal.phone && (
              <ContactItem
                icon={<IcoPhone size={10} color="rgba(255,255,255,0.5)" />}
                text={personal.phone}
                color="rgba(255,255,255,0.8)"
                fontSize={9.5}
              />
            )}
            {personal.location && (
              <ContactItem
                icon={<IcoPin size={10} color="rgba(255,255,255,0.5)" />}
                text={personal.location}
                color="rgba(255,255,255,0.8)"
                fontSize={9.5}
              />
            )}
            {personal.linkedin && (
              <ContactItem
                icon={<IcoLinkedIn size={10} color="rgba(255,255,255,0.5)" />}
                text={personal.linkedin}
                color="rgba(255,255,255,0.8)"
                fontSize={9.5}
              />
            )}
            {personal.website && (
              <ContactItem
                icon={<IcoGlobe size={10} color="rgba(255,255,255,0.5)" />}
                text={personal.website}
                color="rgba(255,255,255,0.8)"
                fontSize={9.5}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Single-column content ── */}
      <div style={{
        flex: 1,
        padding: "24px 32px 32px 32px",
        display: "flex",
        flexDirection: "column",
        gap: 22,
      }}>

        {/* Summary */}
        {show("summary") && summary && (
          <div>
            <SectionHeader title={L.profile} />
            <p style={{
              fontSize: 10.5,
              color: "#4b5563",
              lineHeight: 1.8,
              margin: 0,
            }}>
              {summary}
            </p>
          </div>
        )}

        {/* Experience — card style */}
        {show("experience") && experience.length > 0 && (
          <div>
            <SectionHeader title={L.experience} />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {experience.map((exp) => (
                <div key={exp.id} style={{
                  backgroundColor: "#f8fafc",
                  borderRadius: 8,
                  padding: "12px 16px",
                  borderLeft: `3px solid ${primaryColor}`,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#111827", lineHeight: 1.25 }}>
                        {exp.position}
                      </div>
                      <div style={{ fontSize: 10, color: "#64748b", fontWeight: 500, marginTop: 2 }}>
                        {exp.company}{exp.location ? ` · ${exp.location}` : ""}
                      </div>
                    </div>
                    <div style={{
                      fontSize: 9,
                      color: "#fff",
                      backgroundColor: primaryColor,
                      padding: "2px 8px",
                      borderRadius: 10,
                      whiteSpace: "nowrap" as const,
                      flexShrink: 0,
                      fontWeight: 500,
                    }}>
                      {dateRange(exp.startDate, exp.endDate, exp.current)}
                    </div>
                  </div>
                  {exp.description && (
                    <div style={{ marginTop: 7 }}>
                      {exp.description.split("\n").filter(Boolean).map((line, i) => (
                        <div key={i} style={{ display: "flex", gap: 5, marginBottom: 3 }}>
                          <span style={{ color: primaryColor, fontSize: 9, flexShrink: 0, marginTop: 2 }}>▸</span>
                          <span style={{ fontSize: 10, color: "#475569", lineHeight: 1.65 }}>
                            {line.replace(/^[-•▸]\s*/, "")}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education — side-by-side if multiple */}
        {show("education") && education.length > 0 && (
          <div>
            <SectionHeader title={L.education} />
            <div style={{
              display: "flex",
              flexWrap: "wrap" as const,
              gap: 10,
            }}>
              {education.map((edu) => (
                <div key={edu.id} style={{
                  flex: education.length > 1 ? "1 1 calc(50% - 5px)" : "1 1 100%",
                  backgroundColor: "#f8fafc",
                  borderRadius: 8,
                  padding: "12px 16px",
                  boxSizing: "border-box",
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#111827", lineHeight: 1.3 }}>
                    {edu.degree}{edu.field ? ` in ${edu.field}` : ""}
                  </div>
                  <div style={{ fontSize: 10, color: primaryColor, fontWeight: 500, marginTop: 2 }}>
                    {edu.institution}
                  </div>
                  <div style={{ fontSize: 9, color: "#9ca3af", marginTop: 2 }}>
                    {fmtDate(edu.startDate)}{edu.startDate && edu.endDate ? " – " : ""}{fmtDate(edu.endDate)}
                  </div>
                  {edu.grade && (
                    <div style={{ fontSize: 9, color: "#6b7280", marginTop: 2 }}>Grade: {edu.grade}</div>
                  )}
                  {edu.description && (
                    <div style={{ fontSize: 9.5, color: "#6b7280", lineHeight: 1.6, marginTop: 4 }}>{edu.description}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills — horizontal pill row */}
        {show("skills") && skills.length > 0 && (
          <div>
            <SectionHeader title={L.skills} />
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {visibleSkills(skills).map((skill) => (
                <div key={skill.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 10, color: "#374151", width: 130, flexShrink: 0 }}>{skill.name}</span>
                  <SkillBar
                    level={skill.level}
                    color={primaryColor}
                    bgColor="#e5e7eb"
                    width={200}
                    height={5}
                  />
                  <span style={{ fontSize: 9, color: "#9ca3af" }}>{["", "Beginner", "Basic", "Intermediate", "Advanced", "Expert"][skill.level]}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom row: Certifications, Languages, Hobbies */}
        {((show("certifications") && certifications.length > 0) ||
          (show("referees") && referees.length > 0) ||
          (show("languages") && languages.length > 0) ||
          (show("hobbies") && hobbies)) && (
          <div style={{ display: "flex", gap: 20 }}>
            {show("certifications") && certifications.length > 0 && (
              <div style={{ flex: 1 }}>
                <SectionHeader title={L.certifications} />
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {certifications.map((cert) => (
                    <div key={cert.id} style={{
                      backgroundColor: "#f8fafc",
                      borderRadius: 8,
                      padding: "8px 12px",
                    }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: "#111827", lineHeight: 1.3 }}>{cert.name}</div>
                      {cert.issuer && (
                        <div style={{ fontSize: 9, color: "#64748b", marginTop: 1 }}>{cert.issuer}</div>
                      )}
                      {cert.date && (
                        <div style={{ fontSize: 8.5, color: "#9ca3af", marginTop: 1 }}>{fmtDate(cert.date)}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {show("referees") && referees.length > 0 && (
              <div style={{ flex: 1 }}>
                <SectionHeader title="Referees · Wadhamini" />
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {referees.map((ref) => (
                    <div key={ref.id} style={{
                      backgroundColor: "#f8fafc",
                      borderRadius: 8,
                      padding: "8px 12px",
                    }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: "#111827", lineHeight: 1.3 }}>{ref.name}</div>
                      {(ref.title || ref.company) && (
                        <div style={{ fontSize: 9, color: "#64748b", marginTop: 1 }}>
                          {ref.title}{ref.company ? ` at ${ref.company}` : ""}
                        </div>
                      )}
                      {(ref.email || ref.phone) && (
                        <div style={{ fontSize: 8.5, color: "#9ca3af", marginTop: 1 }}>
                          {ref.email}{ref.phone ? ` · ${ref.phone}` : ""}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {show("languages") && languages.length > 0 && (
              <div style={{ flex: 1 }}>
                <SectionHeader title={L.languages} />
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {languages.map((lang) => (
                    <div key={lang.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{flex: 1, minWidth: 0, borderBottom: "1px dotted currentColor", paddingBottom: 2, fontSize: 10, color: "#374151", fontWeight: 500}}>{lang.name}</span><span style={{flexShrink: 0, whiteSpace: "nowrap", fontSize: 8.5,
                        color: primaryColor,
                        backgroundColor: `${primaryColor}18`,
                        padding: "2px 8px",
                        borderRadius: 10,
                        fontWeight: 600,}}>
                        {lang.proficiency}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {show("hobbies") && hobbies && (
              <div style={{ flex: 1 }}>
                <SectionHeader title={L.interests} />
                <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 5 }}>
                  {hobbies.split(/[,\n]+/).filter((h) => h.trim()).map((h, i) => (
                    <span key={i} style={{
                      fontSize: 9.5,
                      color: "#475569",
                      backgroundColor: "#f1f5f9",
                      padding: "3px 10px",
                      borderRadius: 12,
                      fontWeight: 500,
                    }}>
                      {h.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
