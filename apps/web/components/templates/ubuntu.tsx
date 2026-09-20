import {
  IcoEmail, IcoPhone, IcoPin, IcoLinkedIn, IcoGlobe,
  PhotoCircle,
  fmtDate, dateRange,
} from "@/components/templates/template-utils";
import type { CVData } from "@/components/templates/template-utils";
import type { Lang } from "@/lib/i18n/translations";

const PROF: Record<string, number> = { Native: 5, Fluent: 4, Advanced: 3, Intermediate: 2, Basic: 1 };

// Square bullet section label
function SectionLabel({ title, primaryColor }: { title: string; primaryColor: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 11 }}>
      <span style={{ color: primaryColor, fontSize: 8, lineHeight: 1 }}>■</span>
      <p style={{
        fontSize: 9.5,
        fontWeight: 700,
        textTransform: "uppercase" as const,
        letterSpacing: "0.14em",
        color: primaryColor,
        margin: 0,
      }}>
        {title}
      </p>
    </div>
  );
}


export function UbuntuTemplate({
  data, primaryColor, fontFamily, lang = "en",
}: {
  data: CVData; primaryColor: string; fontFamily: string; lang?: Lang;
}) {
  const {
    personal, summary, experience, education,
    skills, languages, certifications, referees, hobbies,
    hiddenSections = [],
  } = data;

  const sw = lang === "sw";
  const show = (key: string) => !hiddenSections.includes(key);
  // Top 5 skills for the header strip
  const topSkills = skills.slice(0, 5);

  return (
    <div style={{
      width: 794,
      minHeight: 1123,
      fontFamily,
      backgroundColor: "#fff",
      display: "flex",
      flexDirection: "column",
      boxSizing: "border-box" as const,
    }}>

      {/* ── SECTION 1: TOP HEADER BAR ───────────────────────────────────── */}
      <div style={{
        backgroundColor: primaryColor,
        padding: "20px 32px",
        boxSizing: "border-box" as const,
        flexShrink: 0,
      }}>

        {/* Name + job title row */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: topSkills.length > 0 ? 14 : 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {personal.photo && (
              <PhotoCircle
                url={personal.photo}
                name={personal.fullName || "CV"}
                size={44}
                bgColor="rgba(255,255,255,0.2)"
                borderColor="rgba(255,255,255,0.5)"
                borderWidth={2}
              />
            )}
            <p style={{
              fontSize: 22,
              fontWeight: 800,
              color: "#fff",
              margin: 0,
              letterSpacing: "-0.5px",
              lineHeight: 1,
            }}>
              {personal.fullName}
            </p>
          </div>
          <p style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.7)",
            margin: 0,
            letterSpacing: "0.04em",
            fontWeight: 400,
          }}>
            {personal.jobTitle}
          </p>
        </div>

        {/* Contact sub-row */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" as const, marginBottom: topSkills.length > 0 ? 14 : 0 }}>
          {personal.email && (
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <IcoEmail size={8} color="rgba(255,255,255,0.6)" />
              <span style={{ fontSize: 8.5, color: "rgba(255,255,255,0.7)" }}>{personal.email}</span>
            </div>
          )}
          {personal.phone && (
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <IcoPhone size={8} color="rgba(255,255,255,0.6)" />
              <span style={{ fontSize: 8.5, color: "rgba(255,255,255,0.7)" }}>{personal.phone}</span>
            </div>
          )}
          {personal.location && (
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <IcoPin size={8} color="rgba(255,255,255,0.6)" />
              <span style={{ fontSize: 8.5, color: "rgba(255,255,255,0.7)" }}>{personal.location}</span>
            </div>
          )}
          {personal.linkedin && (
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <IcoLinkedIn size={8} color="rgba(255,255,255,0.6)" />
              <span style={{ fontSize: 8.5, color: "rgba(255,255,255,0.7)" }}>{personal.linkedin}</span>
            </div>
          )}
          {personal.website && (
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <IcoGlobe size={8} color="rgba(255,255,255,0.6)" />
              <span style={{ fontSize: 8.5, color: "rgba(255,255,255,0.7)" }}>{personal.website}</span>
            </div>
          )}
        </div>

        {/* Skill strip row — top 5 skills as horizontal bars filling full width */}
        {show("skills") && topSkills.length > 0 && (
          <div style={{
            display: "flex",
            gap: 14,
            paddingTop: 10,
            borderTop: "1px solid rgba(255,255,255,0.2)",
          }}>
            {topSkills.map((sk) => {
              const pct = Math.max(10, (sk.level / 5) * 100);
              return (
                <div key={sk.id} style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 8, fontWeight: 700, color: "rgba(255,255,255,0.85)", margin: "0 0 3px", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>
                    {sk.name}
                  </p>
                  <div style={{ height: 5, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", backgroundColor: "#fff", borderRadius: 3 }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── SECTION 2: SUMMARY BAR (if present) ─────────────────────────── */}
      {show("summary") && summary && (
        <div style={{
          backgroundColor: "#f8fafc",
          borderBottom: "1px solid #e2e8f0",
          padding: "14px 32px",
          boxSizing: "border-box" as const,
          flexShrink: 0,
        }}>
          <p style={{
            fontSize: 10.5,
            color: "#374151",
            lineHeight: 1.75,
            margin: 0,
            fontStyle: "italic",
          }}>
            {summary}
          </p>
        </div>
      )}

      {/* ── SECTION 3: TWO-COLUMN BODY ───────────────────────────────────── */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "row",
        gap: 0,
      }}>

        {/* Left column: Work Experience */}
        <div style={{
          flex: 1,
          minWidth: 0,
          padding: "24px 24px 24px 32px",
          borderRight: "1px solid #e2e8f0",
          boxSizing: "border-box" as const,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}>

          {show("experience") && experience.length > 0 && (
            <div>
              <SectionLabel title={sw ? "Uzoefu wa Kazi" : "Work Experience"} primaryColor={primaryColor} />
              <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
                {experience.map((exp) => (
                  <div key={exp.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 2 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", margin: "0 0 1px", lineHeight: 1.3 }}>
                          {exp.position}
                        </p>
                        <p style={{ fontSize: 10, color: "#64748b", margin: 0 }}>
                          {exp.company}{exp.location ? ` · ${exp.location}` : ""}
                        </p>
                      </div>
                      <span style={{ fontSize: 9, color: "#94a3b8", whiteSpace: "nowrap" as const, marginLeft: 8, flexShrink: 0 }}>
                        {dateRange(exp.startDate, exp.endDate, exp.current)}
                      </span>
                    </div>
                    {exp.description && (
                      <div style={{ marginTop: 5 }}>
                        {exp.description.split("\n").filter(Boolean).map((line, i) => (
                          <div key={i} style={{ display: "flex", gap: 5, marginBottom: 3 }}>
                            <span style={{ color: primaryColor, fontSize: 8, flexShrink: 0, marginTop: 2 }}>■</span>
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

          {/* Remaining skills (beyond the top 5) shown in left column */}
          {show("skills") && skills.length > 5 && (
            <div>
              <SectionLabel title={sw ? "Ujuzi Zaidi" : "More Skills"} primaryColor={primaryColor} />
              <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 5 }}>
                {skills.slice(5).map((sk) => (
                  <span key={sk.id} style={{
                    fontSize: 9,
                    color: primaryColor,
                    backgroundColor: primaryColor + "12",
                    border: `1px solid ${primaryColor}30`,
                    padding: "3px 8px",
                    borderRadius: 3,
                    fontWeight: 600,
                  }}>
                    {sk.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column: Education, Certs, Languages */}
        <div style={{
          width: 280,
          flexShrink: 0,
          padding: "24px 32px 24px 24px",
          boxSizing: "border-box" as const,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}>

          {show("education") && education.length > 0 && (
            <div>
              <SectionLabel title={sw ? "Elimu" : "Education"} primaryColor={primaryColor} />
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {education.map((edu) => (
                  <div key={edu.id}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#0f172a", margin: "0 0 1px", lineHeight: 1.3 }}>
                      {edu.degree}{edu.field ? ` in ${edu.field}` : ""}
                    </p>
                    <p style={{ fontSize: 9.5, color: "#64748b", margin: "0 0 1px" }}>{edu.institution}</p>
                    <p style={{ fontSize: 9, color: "#94a3b8", margin: 0 }}>
                      {dateRange(edu.startDate, edu.endDate, false)}
                      {edu.grade ? ` · ${edu.grade}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {show("certifications") && certifications.length > 0 && (
            <div>
              <SectionLabel title={sw ? "Vyeti" : "Certifications"} primaryColor={primaryColor} />
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {certifications.map((cert) => (
                  <div key={cert.id}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: "#0f172a", margin: "0 0 1px" }}>{cert.name}</p>
                    {cert.issuer && <p style={{ fontSize: 9, color: "#64748b", margin: "0 0 1px" }}>{cert.issuer}</p>}
                    {cert.date && <p style={{ fontSize: 8.5, color: "#94a3b8", margin: 0 }}>{fmtDate(cert.date)}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {show("referees") && referees.length > 0 && (
            <div>
              <SectionLabel title={sw ? "Wadhamini" : "Referees"} primaryColor={primaryColor} />
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {referees.map((ref) => (
                  <div key={ref.id}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: "#0f172a", margin: "0 0 1px" }}>{ref.name}</p>
                    {(ref.title || ref.company) && (
                      <p style={{ fontSize: 9, color: "#64748b", margin: "0 0 1px" }}>
                        {ref.title}{ref.company ? ` — ${ref.company}` : ""}
                      </p>
                    )}
                    {(ref.email || ref.phone) && (
                      <p style={{ fontSize: 8.5, color: "#94a3b8", margin: 0 }}>
                        {ref.email}{ref.phone ? ` · ${ref.phone}` : ""}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {show("languages") && languages.length > 0 && (
            <div>
              <SectionLabel title={sw ? "Lugha" : "Languages"} primaryColor={primaryColor} />
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {languages.map((lang) => (
                  <div key={lang.id}>
                    <div style={{ display: "flex", marginBottom: 3, gap: 8 }}>
                      <span style={{flex: 1, minWidth: 0, borderBottom: "1px dotted currentColor", paddingBottom: 2, fontSize: 9.5, color: "#374151", fontWeight: 600}}>{lang.name}</span><span style={{flexShrink: 0, whiteSpace: "nowrap", fontSize: 8.5, color: "#94a3b8"}}>{lang.proficiency}</span>
                    </div>
                    <div style={{ height: 3, backgroundColor: "#e5e7eb", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{
                        width: `${((PROF[lang.proficiency] ?? 2) / 5) * 100}%`,
                        height: "100%",
                        backgroundColor: primaryColor,
                        borderRadius: 2,
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {show("hobbies") && hobbies && (
            <div>
              <SectionLabel title={sw ? "Mapendeleo" : "Interests"} primaryColor={primaryColor} />
              <p style={{ fontSize: 10, color: "#6b7280", lineHeight: 1.7, margin: 0 }}>{hobbies}</p>
            </div>
          )}
        </div>
      </div>

      {/* Empty state */}
      {!summary && experience.length === 0 && education.length === 0 && (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#d1d5db", fontSize: 13 }}>
          {lang === "sw" ? "Jaza fomu ili uone onyesho la CV yako" : "Fill in the form to preview your CV"}
        </div>
      )}
    </div>
  );
}
