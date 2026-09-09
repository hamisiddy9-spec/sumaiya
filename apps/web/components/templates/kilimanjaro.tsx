import {
  IcoEmail, IcoPhone, IcoPin, IcoLinkedIn, IcoGlobe,
  PhotoCircle, SkillBar, ContactItem,
  fmtDate, dateRange,
  type CVData,
  visibleSkills,
} from "@/components/templates/template-utils";
import type { Lang } from "@/lib/i18n/translations";

const PROF: Record<string, number> = { Native: 5, Fluent: 4, Advanced: 3, Intermediate: 2, Basic: 1 };

function SectionHeader({ text, primaryColor }: { text: string; primaryColor: string }) {
  return (
    <div style={{
      marginBottom: 12,
      paddingBottom: 6,
      borderBottom: "1.5px solid #e2e8f0",
    }}>
      <p style={{
        fontSize: 12,
        fontWeight: 700,
        textTransform: "uppercase" as const,
        letterSpacing: "0.1em",
        color: primaryColor,
        margin: 0,
      }}>
        {text}
      </p>
    </div>
  );
}

export function KilimanjaroTemplate({ data, primaryColor, fontFamily, lang = "en" }: { data: CVData; primaryColor: string; fontFamily: string; lang?: Lang }) {
  const { personal, summary, experience, education, skills, languages, certifications, referees, hobbies } = data;
  const hidden = (k: string) => data.hiddenSections?.includes(k) ?? false;
  const sw = lang === "sw";

  return (
    <div style={{
      width: 794,
      minHeight: 1123,
      fontFamily,
      backgroundColor: "#fff",
      boxSizing: "border-box" as const,
    }}>

      {/* ── Bold Dark Header ──────────────────────────────────────────────── */}
      <div style={{
        backgroundColor: "#0F172A",
        padding: "36px 48px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 24,
      }}>
        {/* Left: name + contact strip */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 30,
            fontWeight: 800,
            color: "#fff",
            margin: "0 0 5px",
            letterSpacing: "-0.02em",
            lineHeight: 1.15,
          }}>
            {personal.fullName}
          </div>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", margin: "0 0 18px", fontWeight: 400 }}>
            {personal.jobTitle}
          </p>
          {/* Contact strip */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
            {personal.email && (
              <ContactItem
                icon={<IcoEmail size={10} color="rgba(255,255,255,0.5)" />}
                text={personal.email}
                color="rgba(255,255,255,0.65)"
                fontSize={10}
              />
            )}
            {personal.phone && (
              <ContactItem
                icon={<IcoPhone size={10} color="rgba(255,255,255,0.5)" />}
                text={personal.phone}
                color="rgba(255,255,255,0.65)"
                fontSize={10}
              />
            )}
            {personal.location && (
              <ContactItem
                icon={<IcoPin size={10} color="rgba(255,255,255,0.5)" />}
                text={personal.location}
                color="rgba(255,255,255,0.65)"
                fontSize={10}
              />
            )}
            {personal.linkedin && (
              <ContactItem
                icon={<IcoLinkedIn size={10} color="rgba(255,255,255,0.5)" />}
                text={personal.linkedin}
                color="rgba(255,255,255,0.65)"
                fontSize={10}
              />
            )}
            {personal.website && (
              <ContactItem
                icon={<IcoGlobe size={10} color="rgba(255,255,255,0.5)" />}
                text={personal.website}
                color="rgba(255,255,255,0.65)"
                fontSize={10}
              />
            )}
          </div>
        </div>

        {/* Right: photo */}
        <PhotoCircle
          url={personal.photo}
          name={personal.fullName || "CV"}
          size={76}
          bgColor={primaryColor}
          borderColor="rgba(255,255,255,0.3)"
          borderWidth={2}
        />
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div style={{
        padding: "30px 48px",
        display: "flex",
        flexDirection: "column",
        gap: 22,
      }}>

        {/* Summary */}
        {summary && !hidden("summary") && (
          <div>
            <SectionHeader text={sw ? "Muhtasari" : "Professional Summary"} primaryColor={primaryColor} />
            <p style={{ fontSize: 10.5, color: "#4b5563", lineHeight: 1.75, margin: 0 }}>{summary}</p>
          </div>
        )}

        {/* Work Experience */}
        {experience.length > 0 && !hidden("experience") && (
          <div>
            <SectionHeader text={sw ? "Uzoefu wa Kazi" : "Work Experience"} primaryColor={primaryColor} />
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {experience.map((exp) => (
                <div key={exp.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", margin: "0 0 2px", lineHeight: 1.3 }}>
                        {exp.position}
                      </p>
                      <p style={{ fontSize: 11, color: "#6b7280", margin: 0, fontWeight: 500 }}>
                        {exp.company}{exp.location ? ` — ${exp.location}` : ""}
                      </p>
                    </div>
                    <span style={{ fontSize: 10, color: "#9ca3af", whiteSpace: "nowrap", marginLeft: 12, flexShrink: 0 }}>
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
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {education.map((edu) => (
                <div key={edu.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", margin: "0 0 2px" }}>
                        {edu.degree}{edu.field ? ` in ${edu.field}` : ""}
                      </p>
                      <p style={{ fontSize: 11, color: "#6b7280", margin: 0 }}>{edu.institution}</p>
                      {edu.grade && <p style={{ fontSize: 10, color: "#9ca3af", margin: "2px 0 0" }}>Grade: {edu.grade}</p>}
                    </div>
                    <span style={{ fontSize: 10, color: "#9ca3af", whiteSpace: "nowrap", marginLeft: 12, flexShrink: 0 }}>
                      {dateRange(edu.startDate, edu.endDate, false)}
                    </span>
                  </div>
                  {edu.description && (
                    <p style={{ fontSize: 10, color: "#6b7280", margin: "4px 0 0", lineHeight: 1.6 }}>{edu.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills + Languages — 2 column grid */}
        {(skills.length > 0 || languages.length > 0) && (
          <div style={{ display: "flex", gap: 32 }}>
            {skills.length > 0 && !hidden("skills") && (
              <div style={{ flex: 1 }}>
                <SectionHeader text={sw ? "Ujuzi" : "Skills"} primaryColor={primaryColor} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 24, rowGap: 8 }}>
                  {visibleSkills(skills).map((skill) => (
                    <div key={skill.id}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ fontSize: 10, color: "#374151" }}>{skill.name}</span>
                      </div>
                      <SkillBar level={skill.level} color={primaryColor} bgColor="#e5e7eb" width={120} height={4} />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {languages.length > 0 && !hidden("languages") && (
              <div style={{ flex: 1 }}>
                <SectionHeader text={sw ? "Lugha" : "Languages"} primaryColor={primaryColor} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 24, rowGap: 8 }}>
                  {languages.map((lang) => (
                    <div key={lang.id}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ fontSize: 10, color: "#374151" }}>{lang.name}</span>
                        <span style={{ fontSize: 9, color: "#9ca3af" }}>{lang.proficiency}</span>
                      </div>
                      <SkillBar level={PROF[lang.proficiency] ?? 2} color={primaryColor} bgColor="#e5e7eb" width={120} height={4} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Certifications */}
        {certifications.length > 0 && !hidden("certifications") && (
          <div>
            <SectionHeader text={sw ? "Vyeti" : "Certifications"} primaryColor={primaryColor} />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {certifications.map((cert) => (
                <div key={cert.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", margin: "0 0 1px" }}>{cert.name}</p>
                    {cert.issuer && <p style={{ fontSize: 10, color: "#64748b", margin: 0 }}>{cert.issuer}</p>}
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
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {referees.map((ref) => (
                <div key={ref.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", margin: "0 0 1px" }}>{ref.name}</p>
                    {(ref.title || ref.company) && (
                      <p style={{ fontSize: 10, color: "#64748b", margin: 0 }}>
                        {ref.title}{ref.company ? ` — ${ref.company}` : ""}
                      </p>
                    )}
                    {(ref.email || ref.phone) && (
                      <p style={{ fontSize: 10, color: "#94a3b8", margin: "2px 0 0" }}>
                        {ref.email}{ref.phone ? ` · ${ref.phone}` : ""}
                      </p>
                    )}
                  </div>
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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#d1d5db", fontSize: 13, padding: "60px 0" }}>
            {lang === "sw" ? "Jaza fomu ili uone onyesho la CV yako" : "Fill in the form to preview your CV"}
          </div>
        )}
      </div>
    </div>
  );
}
