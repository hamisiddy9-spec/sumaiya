import {
  IcoEmail, IcoPhone, IcoPin, IcoLinkedIn, IcoGlobe,
  SkillDots, ContactItem,
  fmtDate, dateRange,
  CvPhoto,
} from "@/components/templates/template-utils";
import { visibleSkills } from "@/components/templates/template-utils";
import type { CVData } from "@/components/templates/template-utils";
import { cvHeadings } from "@/lib/i18n/cv-headings";
import type { Lang } from "@/lib/i18n/translations";

export function VertexTemplate({
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

  function DiamondHeader({ title }: { title: string }) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 7,
        marginBottom: 11,
      }}>
        <span style={{ color: primaryColor, fontSize: 10, lineHeight: 1 }}>◆</span>
        <span style={{
          fontSize: 10,
          fontWeight: 700,
          textTransform: "uppercase" as const,
          letterSpacing: "0.12em",
          color: "#111827",
        }}>
          {title}
        </span>
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

      {/* ── Angled header ── */}
      <div style={{
        position: "relative",
        height: 130,
        flexShrink: 0,
        overflow: "hidden",
        backgroundColor: "#fff",
      }}>
        {/* White left section (name + title) */}
        <div style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          right: 240,
          padding: "24px 0 24px 32px",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 18,
          zIndex: 2,
        }}>
          <CvPhoto url={personal.photo} name={personal.fullName} size={72} radius={8} borderColor={primaryColor} borderWidth={2} />
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 0 }}>
            <div style={{
              fontSize: 26,
              fontWeight: 800,
              color: "#111827",
              lineHeight: 1.15,
              letterSpacing: "-0.01em",
            }}>
              {personal.fullName}
            </div>
            <div style={{
              fontSize: 11,
              color: "#6b7280",
              fontWeight: 500,
              marginTop: 5,
              textTransform: "uppercase" as const,
              letterSpacing: "0.1em",
            }}>
              {personal.jobTitle}
            </div>
          </div>
        </div>

        {/* Teal right panel with clip-path diagonal cut */}
        <div style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: 300,
          backgroundColor: primaryColor,
          clipPath: "polygon(60px 0%, 100% 0%, 100% 100%, 0% 100%)",
          zIndex: 1,
        }}>
          <div style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: 240,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "18px 28px 18px 16px",
            gap: 5,
          }}>
            {personal.email && (
              <ContactItem
                icon={<IcoEmail size={9} color="rgba(255,255,255,0.7)" />}
                text={personal.email}
                color="rgba(255,255,255,0.9)"
                fontSize={9}
              />
            )}
            {personal.phone && (
              <ContactItem
                icon={<IcoPhone size={9} color="rgba(255,255,255,0.7)" />}
                text={personal.phone}
                color="rgba(255,255,255,0.9)"
                fontSize={9}
              />
            )}
            {personal.location && (
              <ContactItem
                icon={<IcoPin size={9} color="rgba(255,255,255,0.7)" />}
                text={personal.location}
                color="rgba(255,255,255,0.9)"
                fontSize={9}
              />
            )}
            {personal.linkedin && (
              <ContactItem
                icon={<IcoLinkedIn size={9} color="rgba(255,255,255,0.7)" />}
                text={personal.linkedin}
                color="rgba(255,255,255,0.9)"
                fontSize={9}
              />
            )}
            {personal.website && (
              <ContactItem
                icon={<IcoGlobe size={9} color="rgba(255,255,255,0.7)" />}
                text={personal.website}
                color="rgba(255,255,255,0.9)"
                fontSize={9}
              />
            )}
          </div>
        </div>
      </div>

      {/* Accent line under header */}
      <div style={{ height: 3, backgroundColor: primaryColor, flexShrink: 0 }} />

      {/* ── Two-column body ── */}
      <div style={{
        display: "flex",
        flex: 1,
        padding: "20px 32px 28px 32px",
        gap: 24,
      }}>

        {/* Left: 58% — Summary + Experience */}
        <div style={{ flex: "0 0 58%", display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Summary */}
          {show("summary") && summary && (
            <div>
              <DiamondHeader title={L.profile} />
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

          {/* Experience */}
          {show("experience") && experience.length > 0 && (
            <div>
              <DiamondHeader title={L.experience} />
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {experience.map((exp) => (
                  <div key={exp.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <div>
                        <div style={{ fontSize: 11.5, fontWeight: 700, color: "#111827", lineHeight: 1.25 }}>
                          {exp.position}
                        </div>
                        <div style={{ fontSize: 10, color: primaryColor, fontWeight: 600, marginTop: 1 }}>
                          {exp.company}{exp.location ? ` · ${exp.location}` : ""}
                        </div>
                      </div>
                      <div style={{
                        fontSize: 9,
                        color: "#9ca3af",
                        whiteSpace: "nowrap" as const,
                        flexShrink: 0,
                        marginTop: 2,
                      }}>
                        {dateRange(exp.startDate, exp.endDate, exp.current)}
                      </div>
                    </div>
                    {exp.description && (
                      <div style={{ marginTop: 5 }}>
                        {exp.description.split("\n").filter(Boolean).map((line, i) => (
                          <div key={i} style={{ display: "flex", gap: 5, marginBottom: 3 }}>
                            <span style={{ color: primaryColor, fontSize: 9, flexShrink: 0, marginTop: 2 }}>◆</span>
                            <span style={{ fontSize: 10, color: "#475569", lineHeight: 1.65 }}>
                              {line.replace(/^[-•▸◆]\s*/, "")}
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

        {/* Vertical divider */}
        <div style={{ width: 1, backgroundColor: "#e5e7eb", flexShrink: 0 }} />

        {/* Right: 42% — Skills, Education, Certs, Languages */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 18, minWidth: 0 }}>

          {/* Skills */}
          {show("skills") && skills.length > 0 && (
            <div>
              <DiamondHeader title={L.skills} />
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {visibleSkills(skills).map((skill) => (
                  <div key={skill.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 10, color: "#374151" }}>{skill.name}</span>
                    <SkillDots level={skill.level} color={primaryColor} emptyColor="#e5e7eb" size={6} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {show("education") && education.length > 0 && (
            <div>
              <DiamondHeader title={L.education} />
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {education.map((edu) => (
                  <div key={edu.id}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: "#111827", lineHeight: 1.3 }}>
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
                    {edu.description && (
                      <div style={{ fontSize: 9.5, color: "#6b7280", lineHeight: 1.6, marginTop: 3 }}>{edu.description}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {show("certifications") && certifications.length > 0 && (
            <div>
              <DiamondHeader title={L.certifications} />
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {certifications.map((cert) => (
                  <div key={cert.id}>
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

          {/* Referees */}
          {show("referees") && referees.length > 0 && (
            <div>
              <DiamondHeader title={L.referees} />
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {referees.map((ref) => (
                  <div key={ref.id}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: "#111827", lineHeight: 1.3 }}>{ref.name}</div>
                    {(ref.title || ref.company) && (
                      <div style={{ fontSize: 9, color: "#64748b", marginTop: 1 }}>
                        {ref.title}{ref.company ? ` — ${ref.company}` : ""}
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

          {/* Languages */}
          {show("languages") && languages.length > 0 && (
            <div>
              <DiamondHeader title={L.languages} />
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {languages.map((lang) => (
                  <div key={lang.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 10, color: "#374151", fontWeight: 500 }}>{lang.name}</span>
                    <span style={{
                      fontSize: 8.5,
                      color: "#fff",
                      backgroundColor: primaryColor,
                      padding: "1px 6px",
                      borderRadius: 8,
                      fontWeight: 600,
                    }}>
                      {lang.proficiency}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hobbies */}
          {show("hobbies") && hobbies && (
            <div>
              <DiamondHeader title={L.interests} />
              <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 5 }}>
                {hobbies.split(/[,\n]+/).filter((h) => h.trim()).map((h, i) => (
                  <span key={i} style={{
                    fontSize: 9,
                    color: primaryColor,
                    border: `1px solid ${primaryColor}`,
                    padding: "2px 8px",
                    borderRadius: 10,
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
