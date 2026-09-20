import {
  IcoEmail, IcoPhone, IcoPin, IcoLinkedIn, IcoGlobe,
  PhotoCircle, SkillBar, SkillDots, ContactItem,
  fmtDate, dateRange,
} from "@/components/templates/template-utils";
import { visibleSkills } from "@/components/templates/template-utils";
import type { CVData } from "@/components/templates/template-utils";
import type { Lang } from "@/lib/i18n/translations";
import { cvHeadings } from "@/lib/i18n/cv-headings";

const PROF: Record<string, number> = { Native: 5, Fluent: 4, Advanced: 3, Intermediate: 2, Basic: 1 };

// Right-sidebar section label
function SideHeader({ title, primaryColor }: { title: string; primaryColor: string }) {
  return (
    <p style={{
      fontSize: 9,
      fontWeight: 700,
      textTransform: "uppercase" as const,
      letterSpacing: "0.14em",
      color: primaryColor,
      margin: "0 0 9px",
      paddingBottom: 5,
      borderBottom: `1px solid ${primaryColor}30`,
    }}>
      {title}
    </p>
  );
}

// Main content section label
function MainHeader({ title, primaryColor }: { title: string; primaryColor: string }) {
  return (
    <div style={{ marginBottom: 13 }}>
      <p style={{
        fontSize: 11,
        fontWeight: 700,
        textTransform: "uppercase" as const,
        letterSpacing: "0.08em",
        color: "#0f172a",
        margin: "0 0 6px",
      }}>
        {title}
      </p>
      <div style={{ height: 2, backgroundColor: primaryColor, width: "100%" }} />
    </div>
  );
}

export function MombasaTemplate({ data, primaryColor, fontFamily, lang = "en" }: { data: CVData; primaryColor: string; fontFamily: string; lang?: Lang }) {
  const L = cvHeadings(lang);
  const { personal, summary, experience, education, skills, languages, certifications, referees, hobbies } = data;
  const hidden = data.hiddenSections ?? [];
  // Was a hardcoded stack ("'Inter', 'Segoe UI', Arial, sans-serif"), so this
  // template ignored `fontFamily` — with no Inter installed it fell through to
  // Segoe UI and the requested family never reached the page.
  const interFont = fontFamily || "'Inter', 'Segoe UI', Arial, sans-serif";

  return (
    <div style={{
      width: 794,
      minHeight: 1123,
      fontFamily: interFont,
      backgroundColor: "#fff",
      display: "flex",
      flexDirection: "row",
      boxSizing: "border-box" as const,
    }}>

      {/* ── LEFT MAIN CONTENT (65%) ─────────────────────────────────────── */}
      <div style={{
        flex: 1,
        minWidth: 0,
        padding: "36px 32px 36px 36px",
        display: "flex",
        flexDirection: "column",
        gap: 22,
        boxSizing: "border-box" as const,
      }}>

        {/* Name + title header */}
        <div style={{ marginBottom: 4 }}>
          <p style={{
            fontSize: 30,
            fontWeight: 800,
            color: "#0f172a",
            margin: "0 0 4px",
            letterSpacing: "-0.5px",
            lineHeight: 1.1,
          }}>
            {personal.fullName}
          </p>
          <p style={{
            fontSize: 12,
            fontWeight: 500,
            color: primaryColor,
            margin: "0 0 14px",
            letterSpacing: "0.04em",
          }}>
            {personal.jobTitle}
          </p>
          <div style={{ height: 2, backgroundColor: "#e2e8f0" }} />
        </div>

        {/* Summary */}
        {!hidden.includes("summary") && summary && (
          <div>
            <MainHeader title={L.profile} primaryColor={primaryColor} />
            <p style={{ fontSize: 10.5, color: "#4b5563", lineHeight: 1.8, margin: 0 }}>{summary}</p>
          </div>
        )}

        {/* Experience */}
        {!hidden.includes("experience") && experience.length > 0 && (
          <div>
            <MainHeader title={L.experience} primaryColor={primaryColor} />
            <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
              {experience.map((exp) => (
                <div key={exp.id} style={{ paddingLeft: 12, borderLeft: `2px solid ${primaryColor}25` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 2 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", margin: "0 0 1px", lineHeight: 1.3 }}>
                        {exp.position}
                      </p>
                      <p style={{ fontSize: 10, color: "#64748b", margin: 0, fontWeight: 500 }}>
                        {exp.company}{exp.location ? ` · ${exp.location}` : ""}
                      </p>
                    </div>
                    <span style={{
                      fontSize: 9.5,
                      color: "#94a3b8",
                      whiteSpace: "nowrap" as const,
                      marginLeft: 8,
                      flexShrink: 0,
                      fontStyle: "italic",
                    }}>
                      {dateRange(exp.startDate, exp.endDate, exp.current)}
                    </span>
                  </div>
                  {exp.description && (
                    <div style={{ marginTop: 5 }}>
                      {exp.description.split("\n").filter(Boolean).map((line, i) => (
                        <div key={i} style={{ display: "flex", gap: 6, marginBottom: 3 }}>
                          <span style={{ color: primaryColor, fontSize: 9, flexShrink: 0, marginTop: 1.5 }}>▸</span>
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

        {/* Education */}
        {!hidden.includes("education") && education.length > 0 && (
          <div>
            <MainHeader title={L.education} primaryColor={primaryColor} />
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {education.map((edu) => (
                <div key={edu.id} style={{ paddingLeft: 12, borderLeft: `2px solid ${primaryColor}25` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 11.5, fontWeight: 700, color: "#0f172a", margin: "0 0 1px" }}>
                        {edu.degree}{edu.field ? ` in ${edu.field}` : ""}
                      </p>
                      <p style={{ fontSize: 10, color: "#64748b", margin: 0 }}>{edu.institution}</p>
                      {edu.grade && <p style={{ fontSize: 9.5, color: "#94a3b8", margin: "2px 0 0" }}>Grade: {edu.grade}</p>}
                    </div>
                    <span style={{ fontSize: 9.5, color: "#94a3b8", whiteSpace: "nowrap" as const, marginLeft: 8, flexShrink: 0 }}>
                      {dateRange(edu.startDate, edu.endDate, false)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Interests */}
        {!hidden.includes("hobbies") && hobbies && (
          <div>
            <MainHeader title={L.interests} primaryColor={primaryColor} />
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
              {hobbies.split(/[,\n]+/).filter((h) => h.trim()).map((h, i) => (
                <span key={i} style={{
                  fontSize: 9.5,
                  color: primaryColor,
                  backgroundColor: primaryColor + "12",
                  border: `1px solid ${primaryColor}30`,
                  padding: "3px 10px",
                  borderRadius: 99,
                  fontWeight: 500,
                }}>
                  {h.trim()}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!summary && experience.length === 0 && education.length === 0 && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#d1d5db", fontSize: 13 }}>
            {lang === "sw" ? "Jaza fomu upande wa kushoto ili uone onyesho la CV yako" : "Fill in the form on the left to see your CV preview"}
          </div>
        )}
      </div>

      {/* ── RIGHT SIDEBAR (35%) — white with left accent border ─────────── */}
      <div style={{
        width: 252,
        minHeight: 1123,
        flexShrink: 0,
        backgroundColor: "#f8fafc",
        borderLeft: `3px solid ${primaryColor}`,
        padding: "36px 20px 36px 22px",
        display: "flex",
        flexDirection: "column",
        gap: 24,
        boxSizing: "border-box" as const,
      }}>

        {/* Photo */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <PhotoCircle
            url={personal.photo}
            name={personal.fullName || "CV"}
            size={84}
            bgColor={primaryColor}
            borderColor={primaryColor}
            borderWidth={3}
          />
        </div>

        {/* Contact */}
        <div>
          <SideHeader title={L.contact} primaryColor={primaryColor} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {personal.email && (
              <ContactItem icon={<IcoEmail size={9} color={primaryColor} />} text={personal.email} color="#374151" fontSize={9.5} />
            )}
            {personal.phone && (
              <ContactItem icon={<IcoPhone size={9} color={primaryColor} />} text={personal.phone} color="#374151" fontSize={9.5} />
            )}
            {personal.location && (
              <ContactItem icon={<IcoPin size={9} color={primaryColor} />} text={personal.location} color="#374151" fontSize={9.5} />
            )}
            {personal.linkedin && (
              <ContactItem icon={<IcoLinkedIn size={9} color={primaryColor} />} text={personal.linkedin} color="#374151" fontSize={9.5} />
            )}
            {personal.website && (
              <ContactItem icon={<IcoGlobe size={9} color={primaryColor} />} text={personal.website} color="#374151" fontSize={9.5} />
            )}
          </div>
        </div>

        {/* Skills */}
        {!hidden.includes("skills") && skills.length > 0 && (
          <div>
            <SideHeader title={L.skills} primaryColor={primaryColor} />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {visibleSkills(skills).map((skill) => (
                <div key={skill.id}>
                  <p style={{ fontSize: 9.5, color: "#374151", margin: "0 0 3px", fontWeight: 500 }}>{skill.name}</p>
                  <SkillBar
                    level={skill.level}
                    color={primaryColor}
                    bgColor={primaryColor + "20"}
                    width={190}
                    height={4}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Languages */}
        {!hidden.includes("languages") && languages.length > 0 && (
          <div>
            <SideHeader title={L.languages} primaryColor={primaryColor} />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {languages.map((lang) => (
                <div key={lang.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ flex: 1, minWidth: 0, borderBottom: "1px dotted currentColor", paddingBottom: 2, fontSize: 9.5, color: "#374151", fontWeight: 500 }}>{lang.name}</span>
                  <SkillDots
                    level={PROF[lang.proficiency] ?? 3}
                    color={primaryColor}
                    emptyColor={primaryColor + "25"}
                    size={6}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {!hidden.includes("certifications") && certifications.length > 0 && (
          <div>
            <SideHeader title={L.certifications} primaryColor={primaryColor} />
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {certifications.map((cert) => (
                <div key={cert.id}>
                  <p style={{ fontSize: 9.5, fontWeight: 700, color: "#0f172a", margin: "0 0 1px" }}>{cert.name}</p>
                  {cert.issuer && <p style={{ fontSize: 9, color: "#64748b", margin: "0 0 1px" }}>{cert.issuer}</p>}
                  {cert.date && <p style={{ fontSize: 8.5, color: "#94a3b8", margin: 0 }}>{fmtDate(cert.date)}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Referees */}
        {!hidden.includes("referees") && referees.length > 0 && (
          <div>
            <SideHeader title="Referees / Wadhamini" primaryColor={primaryColor} />
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {referees.map((ref) => (
                <div key={ref.id}>
                  <p style={{ fontSize: 9.5, fontWeight: 700, color: "#0f172a", margin: "0 0 1px" }}>{ref.name}</p>
                  {(ref.title || ref.company) && (
                    <p style={{ fontSize: 9, color: "#64748b", margin: "0 0 1px" }}>
                      {[ref.title, ref.company].filter(Boolean).join(" — ")}
                    </p>
                  )}
                  {(ref.email || ref.phone) && (
                    <p style={{ fontSize: 8.5, color: "#94a3b8", margin: 0 }}>
                      {[ref.email, ref.phone].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
