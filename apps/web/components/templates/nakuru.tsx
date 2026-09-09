import {
  IcoEmail, IcoPhone, IcoPin, IcoLinkedIn, IcoGlobe,
  PhotoCircle, SkillDots, ContactItem,
  fmtDate, dateRange,
  type CVData,
  visibleSkills,
} from "@/components/templates/template-utils";
import type { Lang } from "@/lib/i18n/translations";

const PROF: Record<string, number> = { Native: 5, Fluent: 4, Advanced: 3, Intermediate: 2, Basic: 1 };

function SideLabel({ text }: { text: string }) {
  return (
    <p style={{
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: "0.08em",
      textTransform: "uppercase" as const,
      color: "rgba(255,255,255,0.5)",
      margin: "0 0 8px",
      paddingBottom: 5,
      borderBottom: "1px solid rgba(255,255,255,0.15)",
    }}>
      {text}
    </p>
  );
}

function SectionHeader({ text, primaryColor }: { text: string; primaryColor: string }) {
  return (
    <div style={{ marginBottom: 12, paddingBottom: 6, borderBottom: `2px solid ${primaryColor}` }}>
      <p style={{
        fontSize: 11,
        fontWeight: 700,
        textTransform: "uppercase" as const,
        letterSpacing: "0.08em",
        color: primaryColor,
        margin: 0,
      }}>
        {text}
      </p>
    </div>
  );
}

export function NakuruTemplate({ data, primaryColor, fontFamily, lang = "en" }: { data: CVData; primaryColor: string; fontFamily: string; lang?: Lang }) {
  const { personal, summary, experience, education, skills, languages, certifications, referees, hobbies } = data;
  const sw = lang === "sw";
  const hidden = (k: string) => data.hiddenSections?.includes(k) ?? false;

  return (
    <div style={{
      width: 794,
      minHeight: 1123,
      fontFamily,
      display: "flex",
      flexDirection: "row",
      backgroundColor: "#fff",
      boxSizing: "border-box" as const,
    }}>

      {/* ── Left Sidebar ─────────────────────────────────────────────────── */}
      <div style={{
        width: 230,
        minHeight: 1123,
        backgroundColor: primaryColor,
        padding: "32px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 22,
        flexShrink: 0,
        boxSizing: "border-box" as const,
      }}>

        {/* Photo + Name */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <PhotoCircle
            url={personal.photo}
            name={personal.fullName || "CV"}
            size={90}
            bgColor="rgba(255,255,255,0.2)"
            borderColor="#fff"
            borderWidth={3}
          />
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: "0 0 4px", lineHeight: 1.2 }}>
              {personal.fullName}
            </p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", margin: 0, lineHeight: 1.4 }}>
              {personal.jobTitle}
            </p>
          </div>
        </div>

        {/* Contact */}
        <div>
          <SideLabel text={sw ? "Mawasiliano" : "Contact"} />
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {personal.email && (
              <ContactItem
                icon={<IcoEmail size={10} color="rgba(255,255,255,0.85)" />}
                text={personal.email}
                color="rgba(255,255,255,0.85)"
                fontSize={10}
              />
            )}
            {personal.phone && (
              <ContactItem
                icon={<IcoPhone size={10} color="rgba(255,255,255,0.85)" />}
                text={personal.phone}
                color="rgba(255,255,255,0.85)"
                fontSize={10}
              />
            )}
            {personal.location && (
              <ContactItem
                icon={<IcoPin size={10} color="rgba(255,255,255,0.85)" />}
                text={personal.location}
                color="rgba(255,255,255,0.85)"
                fontSize={10}
              />
            )}
            {personal.linkedin && (
              <ContactItem
                icon={<IcoLinkedIn size={10} color="rgba(255,255,255,0.85)" />}
                text={personal.linkedin}
                color="rgba(255,255,255,0.85)"
                fontSize={10}
              />
            )}
            {personal.website && (
              <ContactItem
                icon={<IcoGlobe size={10} color="rgba(255,255,255,0.85)" />}
                text={personal.website}
                color="rgba(255,255,255,0.85)"
                fontSize={10}
              />
            )}
          </div>
        </div>

        {/* Skills */}
        {skills.length > 0 && !hidden("skills") && (
          <div>
            <SideLabel text={sw ? "Ujuzi" : "Skills"} />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {visibleSkills(skills).map((skill) => (
                <div key={skill.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 9.5, color: "rgba(255,255,255,0.9)", lineHeight: 1.3, marginRight: 6, flex: 1, minWidth: 0 }}>
                    {skill.name}
                  </span>
                  <SkillDots
                    level={skill.level}
                    color="rgba(255,255,255,0.9)"
                    emptyColor="rgba(255,255,255,0.25)"
                    size={6}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Languages */}
        {languages.length > 0 && !hidden("languages") && (
          <div>
            <SideLabel text={sw ? "Lugha" : "Languages"} />
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {languages.map((lang) => (
                <div key={lang.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 9.5, color: "rgba(255,255,255,0.9)" }}>{lang.name}</span>
                    <span style={{ fontSize: 8.5, color: "rgba(255,255,255,0.55)" }}>{lang.proficiency}</span>
                  </div>
                  <SkillDots
                    level={PROF[lang.proficiency] ?? 2}
                    color="rgba(255,255,255,0.9)"
                    emptyColor="rgba(255,255,255,0.22)"
                    size={6}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Right Main ───────────────────────────────────────────────────── */}
      <div style={{
        flex: 1,
        padding: "28px",
        display: "flex",
        flexDirection: "column",
        gap: 20,
        boxSizing: "border-box" as const,
        minWidth: 0,
      }}>

        {/* Summary */}
        {summary && !hidden("summary") && (
          <div>
            <SectionHeader text={sw ? "Muhtasari" : "Professional Summary"} primaryColor={primaryColor} />
            <p style={{ fontSize: 10.5, color: "#475569", lineHeight: 1.75, margin: 0 }}>{summary}</p>
          </div>
        )}

        {/* Work Experience */}
        {experience.length > 0 && !hidden("experience") && (
          <div>
            <SectionHeader text={sw ? "Uzoefu wa Kazi" : "Work Experience"} primaryColor={primaryColor} />
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {experience.map((exp) => (
                <div key={exp.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 2 }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", margin: "0 0 2px", lineHeight: 1.3 }}>
                        {exp.position}
                      </p>
                      <p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>
                        {exp.company}{exp.location ? ` · ${exp.location}` : ""}
                      </p>
                    </div>
                    <span style={{ fontSize: 10, color: "#94a3b8", whiteSpace: "nowrap", marginLeft: 10, flexShrink: 0 }}>
                      {dateRange(exp.startDate, exp.endDate, exp.current)}
                    </span>
                  </div>
                  {exp.description && (
                    <div style={{ marginTop: 6 }}>
                      {exp.description.split("\n").filter(Boolean).map((line, i) => (
                        <div key={i} style={{ display: "flex", gap: 5, marginBottom: 3 }}>
                          <span style={{ color: primaryColor, fontSize: 9, flexShrink: 0, marginTop: 1.5 }}>▸</span>
                          <span style={{ fontSize: 10.5, color: "#475569", lineHeight: 1.65 }}>{line.replace(/^[-•▸]\s*/, "")}</span>
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
        {education.length > 0 && !hidden("education") && (
          <div>
            <SectionHeader text={sw ? "Elimu" : "Education"} primaryColor={primaryColor} />
            <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
              {education.map((edu) => (
                <div key={edu.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", margin: "0 0 2px" }}>
                        {edu.degree}{edu.field ? ` in ${edu.field}` : ""}
                      </p>
                      <p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>{edu.institution}</p>
                      {edu.grade && (
                        <p style={{ fontSize: 10, color: "#94a3b8", margin: "2px 0 0" }}>Grade: {edu.grade}</p>
                      )}
                    </div>
                    <span style={{ fontSize: 10, color: "#94a3b8", whiteSpace: "nowrap", marginLeft: 10, flexShrink: 0 }}>
                      {dateRange(edu.startDate, edu.endDate, false)}
                    </span>
                  </div>
                  {edu.description && (
                    <p style={{ fontSize: 10, color: "#64748b", margin: "4px 0 0", lineHeight: 1.6 }}>{edu.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {certifications.length > 0 && !hidden("certifications") && (
          <div>
            <SectionHeader text={sw ? "Vyeti" : "Certifications"} primaryColor={primaryColor} />
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {certifications.map((cert) => (
                <div key={cert.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", margin: "0 0 1px" }}>{cert.name}</p>
                    {cert.issuer && (
                      <p style={{ fontSize: 10, color: "#64748b", margin: 0 }}>{cert.issuer}</p>
                    )}
                  </div>
                  {cert.date && (
                    <span style={{ fontSize: 10, color: "#94a3b8", whiteSpace: "nowrap", marginLeft: 10, flexShrink: 0 }}>
                      {fmtDate(cert.date) || cert.date}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Referees */}
        {referees.length > 0 && !hidden("referees") && (
          <div>
            <SectionHeader text={sw ? "Wadhamini" : "Referees"} primaryColor={primaryColor} />
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {referees.map((ref) => (
                <div key={ref.id}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", margin: "0 0 1px" }}>{ref.name}</p>
                  {(ref.title || ref.company) && (
                    <p style={{ fontSize: 10, color: "#64748b", margin: 0 }}>
                      {[ref.title, ref.company].filter(Boolean).join(" — ")}
                    </p>
                  )}
                  {(ref.email || ref.phone) && (
                    <p style={{ fontSize: 10, color: "#94a3b8", margin: "1px 0 0" }}>
                      {[ref.email, ref.phone].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Interests */}
        {hobbies && !hidden("hobbies") && (
          <div>
            <SectionHeader text={sw ? "Mapendeleo" : "Interests"} primaryColor={primaryColor} />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {hobbies.split(/[,\n]+/).filter((h) => h.trim()).map((h, i) => (
                <span key={i} style={{
                  fontSize: 10,
                  color: "#475569",
                  backgroundColor: "#f1f5f9",
                  padding: "3px 11px",
                  borderRadius: 99,
                }}>
                  {h.trim()}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!summary && experience.length === 0 && education.length === 0 && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#cbd5e1", fontSize: 13 }}>
            {lang === "sw" ? "Jaza fomu ili uone onyesho la CV yako" : "Fill in the form to preview your CV"}
          </div>
        )}
      </div>
    </div>
  );
}
