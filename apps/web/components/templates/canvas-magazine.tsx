import {
  IcoEmail, IcoPhone, IcoPin, IcoLinkedIn, IcoGlobe,
  PhotoSquare, SkillDots, ContactItem,
  fmtDate, dateRange,
} from "@/components/templates/template-utils";
import { visibleSkills } from "@/components/templates/template-utils";
import type { CVData } from "@/components/templates/template-utils";
import { cvHeadings } from "@/lib/i18n/cv-headings";
import type { Lang } from "@/lib/i18n/translations";

export function CanvasMagazineTemplate({
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

  function SectionLabel({ title }: { title: string }) {
    return (
      <div style={{
        fontSize: 8.5,
        fontWeight: 700,
        textTransform: "uppercase" as const,
        letterSpacing: "0.18em",
        color: primaryColor,
        fontVariant: "small-caps",
        marginBottom: 8,
        paddingBottom: 3,
        borderBottom: `1px solid ${primaryColor}33`,
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

      {/* ── Masthead ── */}
      <div style={{ padding: "28px 32px 0 32px" }}>
        <div style={{
          fontSize: 38,
          fontWeight: 900,
          color: "#111827",
          lineHeight: 1.05,
          letterSpacing: "-0.02em",
          textAlign: "left",
        }}>
          {personal.fullName}
        </div>

        {/* Rule with job title */}
        <div style={{
          marginTop: 8,
          borderTop: `2.5px solid ${primaryColor}`,
          display: "flex",
          alignItems: "center",
          gap: 0,
          paddingTop: 5,
          paddingBottom: 10,
        }}>
          <span style={{
            fontSize: 12,
            fontWeight: 600,
            color: primaryColor,
            textTransform: "uppercase" as const,
            letterSpacing: "0.12em",
          }}>
            {personal.jobTitle}
          </span>
        </div>
      </div>

      {/* ── Three-column body ── */}
      <div style={{
        display: "flex",
        flex: 1,
        padding: "0 32px 28px 32px",
        gap: 20,
      }}>

        {/* Left column: 200px */}
        <div style={{
          width: 200,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}>
          {/* Photo */}
          <PhotoSquare
            url={personal.photo}
            name={personal.fullName || "CV"}
            size={160}
            radius={4}
            bgColor={primaryColor}
            borderColor={`${primaryColor}33`}
            borderWidth={1}
          />

          {/* Contact */}
          <div>
            <SectionLabel title={L.contact} />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {personal.email && (
                <ContactItem
                  icon={<IcoEmail size={9} color={primaryColor} />}
                  text={personal.email}
                  color="#374151"
                  fontSize={9}
                />
              )}
              {personal.phone && (
                <ContactItem
                  icon={<IcoPhone size={9} color={primaryColor} />}
                  text={personal.phone}
                  color="#374151"
                  fontSize={9}
                />
              )}
              {personal.location && (
                <ContactItem
                  icon={<IcoPin size={9} color={primaryColor} />}
                  text={personal.location}
                  color="#374151"
                  fontSize={9}
                />
              )}
              {personal.linkedin && (
                <ContactItem
                  icon={<IcoLinkedIn size={9} color={primaryColor} />}
                  text={personal.linkedin}
                  color="#374151"
                  fontSize={9}
                />
              )}
              {personal.website && (
                <ContactItem
                  icon={<IcoGlobe size={9} color={primaryColor} />}
                  text={personal.website}
                  color="#374151"
                  fontSize={9}
                />
              )}
            </div>
          </div>

          {/* Skills */}
          {show("skills") && skills.length > 0 && (
            <div>
              <SectionLabel title={L.skills} />
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {visibleSkills(skills).map((skill) => (
                  <div key={skill.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                      <span style={{ fontSize: 9.5, color: "#374151", fontWeight: 500 }}>{skill.name}</span>
                      <SkillDots level={skill.level} color={primaryColor} emptyColor="#e5e7eb" size={6} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Middle column: flex 1 */}
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 18,
          minWidth: 0,
        }}>
          {/* Summary */}
          {show("summary") && summary && (
            <div>
              <SectionLabel title={L.profile} />
              <p style={{
                fontSize: 10.5,
                color: "#4b5563",
                lineHeight: 1.8,
                margin: 0,
                fontStyle: "italic",
              }}>
                {summary}
              </p>
            </div>
          )}

          {/* Experience */}
          {show("experience") && experience.length > 0 && (
            <div>
              <SectionLabel title={L.experience} />
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {experience.map((exp) => (
                  <div key={exp.id} style={{
                    borderLeft: `2px solid ${primaryColor}`,
                    paddingLeft: 10,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#111827", lineHeight: 1.25 }}>
                          {exp.position}
                        </div>
                        <div style={{ fontSize: 10, color: primaryColor, fontWeight: 600, marginTop: 1 }}>
                          {exp.company}{exp.location ? ` · ${exp.location}` : ""}
                        </div>
                      </div>
                      <div style={{ fontSize: 9, color: "#9ca3af", whiteSpace: "nowrap" as const, flexShrink: 0, marginTop: 2 }}>
                        {dateRange(exp.startDate, exp.endDate, exp.current)}
                      </div>
                    </div>
                    {exp.description && (
                      <div style={{ marginTop: 5 }}>
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
        </div>

        {/* Right column: 170px */}
        <div style={{
          width: 170,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}>
          {/* Education */}
          {show("education") && education.length > 0 && (
            <div>
              <SectionLabel title={L.education} />
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {education.map((edu) => (
                  <div key={edu.id}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#111827", lineHeight: 1.3 }}>
                      {edu.degree}{edu.field ? ` in ${edu.field}` : ""}
                    </div>
                    <div style={{ fontSize: 9.5, color: primaryColor, fontWeight: 500, marginTop: 1 }}>
                      {edu.institution}
                    </div>
                    <div style={{ fontSize: 9, color: "#9ca3af", marginTop: 1 }}>
                      {fmtDate(edu.startDate)}{edu.startDate && edu.endDate ? " – " : ""}{fmtDate(edu.endDate)}
                    </div>
                    {edu.grade && (
                      <div style={{ fontSize: 9, color: "#6b7280", marginTop: 1 }}>Grade: {edu.grade}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {show("certifications") && certifications.length > 0 && (
            <div>
              <SectionLabel title={L.certifications} />
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {certifications.map((cert) => (
                  <div key={cert.id}>
                    <div style={{ fontSize: 9.5, fontWeight: 600, color: "#111827", lineHeight: 1.3 }}>
                      {cert.name}
                    </div>
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

          {/* Referees */}
          {show("referees") && referees.length > 0 && (
            <div>
              <SectionLabel title={L.referees} />
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {referees.map((ref) => (
                  <div key={ref.id}>
                    <div style={{ fontSize: 9.5, fontWeight: 600, color: "#111827", lineHeight: 1.3 }}>
                      {ref.name}
                    </div>
                    <div style={{ fontSize: 9, color: "#64748b", marginTop: 1 }}>
                      {ref.title}{ref.company ? ` · ${ref.company}` : ""}
                    </div>
                    <div style={{ fontSize: 8.5, color: "#9ca3af", marginTop: 1 }}>{ref.email}</div>
                    {ref.phone && (
                      <div style={{ fontSize: 8.5, color: "#9ca3af", marginTop: 0.5 }}>{ref.phone}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {show("languages") && languages.length > 0 && (
            <div>
              <SectionLabel title={L.languages} />
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {languages.map((lang) => (
                  <div key={lang.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{flex: 1, minWidth: 0, borderBottom: "1px dotted currentColor", paddingBottom: 2, fontSize: 9.5, color: "#374151", fontWeight: 500}}>{lang.name}</span><span style={{flexShrink: 0, whiteSpace: "nowrap", fontSize: 8.5, color: primaryColor, fontWeight: 600}}>{lang.proficiency}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hobbies */}
          {show("hobbies") && hobbies && (
            <div>
              <SectionLabel title={L.interests} />
              <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 4 }}>
                {hobbies.split(/[,\n]+/).filter((h) => h.trim()).map((h, i) => (
                  <span key={i} style={{
                    fontSize: 8.5,
                    color: primaryColor,
                    backgroundColor: `${primaryColor}15`,
                    padding: "2px 7px",
                    borderRadius: 10,
                    fontWeight: 500,
                  }}>
                    {h.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
