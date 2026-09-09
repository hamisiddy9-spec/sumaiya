import {
  IcoEmail, IcoPhone, IcoPin, IcoLinkedIn, IcoGlobe,
  PhotoCircle, SkillBar, ContactItem,
  fmtDate, dateRange,
} from "@/components/templates/template-utils";
import { visibleSkills } from "@/components/templates/template-utils";
import type { CVData } from "@/components/templates/template-utils";
import type { Lang } from "@/lib/i18n/translations";

const PROF: Record<string, number> = { Native: 5, Fluent: 4, Advanced: 3, Intermediate: 2, Basic: 1 };

function SectionHeader({ title, primaryColor }: { title: string; primaryColor: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: 5, marginBottom: 11 }}>
      <div style={{
        width: 8, height: 8, backgroundColor: primaryColor,
        borderRadius: 2, marginRight: 8, flexShrink: 0,
      }} />
      <span style={{
        fontSize: 13, fontWeight: 700, textTransform: "uppercase",
        letterSpacing: "0.07em", color: "#0f172a",
      }}>
        {title}
      </span>
    </div>
  );
}

function BulletDesc({ desc, primaryColor }: { desc: string; primaryColor: string }) {
  return (
    <div style={{ marginTop: 5 }}>
      {desc.split("\n").filter(Boolean).map((line, i) => (
        <div key={i} style={{ display: "flex", gap: 5, marginBottom: 3 }}>
          <span style={{ color: primaryColor, fontSize: 9, flexShrink: 0, marginTop: 1.5 }}>▸</span>
          <span style={{ fontSize: 10.5, color: "#475569", lineHeight: 1.65 }}>
            {line.replace(/^[-•▸]\s*/, "")}
          </span>
        </div>
      ))}
    </div>
  );
}

export function NileTemplate({
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

  const contactPairs = [
    { icon: <IcoEmail size={10} color="rgba(255,255,255,0.7)" />, text: personal.email },
    { icon: <IcoPhone size={10} color="rgba(255,255,255,0.7)" />, text: personal.phone },
    { icon: <IcoPin size={10} color="rgba(255,255,255,0.7)" />, text: personal.location },
    { icon: <IcoLinkedIn size={10} color="rgba(255,255,255,0.7)" />, text: personal.linkedin ?? "" },
    { icon: <IcoGlobe size={10} color="rgba(255,255,255,0.7)" />, text: personal.website ?? "" },
  ].filter((c) => c.text);

  return (
    <div style={{
      width: 794,
      minHeight: 1123,
      backgroundColor: "#fff",
      fontFamily,
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
    }}>

      {/* ── Header ───────────────────────────────────────────────── */}
      <div style={{
        backgroundColor: primaryColor,
        padding: "32px 48px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 20,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 28, fontWeight: 800, color: "#fff",
            lineHeight: 1.15, marginBottom: 5,
          }}>
            {personal.fullName}
          </div>
          <div style={{
            fontSize: 13, color: "rgba(255,255,255,0.75)",
            letterSpacing: "0.02em", marginBottom: 14,
          }}>
            {personal.jobTitle}
          </div>
          {/* Contact row with dot separators */}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "5px 0" }}>
            {contactPairs.map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center" }}>
                {i > 0 && (
                  <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 14, margin: "0 10px", lineHeight: 1 }}>·</span>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  {c.icon}
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", lineHeight: 1.3 }}>
                    {c.text}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <PhotoCircle
          url={personal.photo}
          name={personal.fullName || "CV"}
          size={72}
          bgColor={primaryColor}
          borderColor="rgba(255,255,255,0.4)"
          borderWidth={3}
        />
      </div>

      {/* ── Body ─────────────────────────────────────────────────── */}
      <div style={{
        padding: "30px 48px",
        display: "flex",
        flexDirection: "column",
        gap: 20,
        flex: 1,
      }}>

        {/* Summary */}
        {show("summary") && summary && (
          <div>
            <SectionHeader title={sw ? "Muhtasari" : "Professional Summary"} primaryColor={primaryColor} />
            <div style={{
              fontSize: 11,
              fontStyle: "italic",
              color: "#4b5563",
              lineHeight: 1.8,
              borderLeft: `3px solid ${primaryColor}`,
              paddingLeft: 12,
            }}>
              {summary}
            </div>
          </div>
        )}

        {/* Experience */}
        {show("experience") && experience.length > 0 && (
          <div>
            <SectionHeader title={sw ? "Uzoefu wa Kazi" : "Work Experience"} primaryColor={primaryColor} />
            <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
              {experience.map((exp) => (
                <div key={exp.id}>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    marginBottom: 2,
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>
                      {exp.position}
                    </span>
                    <span style={{ fontSize: 10, color: "#94a3b8", flexShrink: 0, marginLeft: 10 }}>
                      {dateRange(exp.startDate, exp.endDate, exp.current)}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b", marginBottom: exp.description ? 2 : 0 }}>
                    {exp.company}{exp.location ? ` · ${exp.location}` : ""}
                  </div>
                  {exp.description && (
                    <BulletDesc desc={exp.description} primaryColor={primaryColor} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {show("education") && education.length > 0 && (
          <div>
            <SectionHeader title={sw ? "Elimu" : "Education"} primaryColor={primaryColor} />
            <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
              {education.map((edu) => (
                <div key={edu.id}>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    marginBottom: 2,
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>
                      {edu.degree}{edu.field ? ` in ${edu.field}` : ""}
                    </span>
                    <span style={{ fontSize: 10, color: "#94a3b8", flexShrink: 0, marginLeft: 10 }}>
                      {dateRange(edu.startDate, edu.endDate, false)}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>
                    {edu.institution}{edu.grade ? ` · Grade: ${edu.grade}` : ""}
                  </div>
                  {edu.description && (
                    <BulletDesc desc={edu.description} primaryColor={primaryColor} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills + Languages — two-column */}
        {((show("skills") && skills.length > 0) || (show("languages") && languages.length > 0)) && (
          <div style={{ display: "flex", gap: 32 }}>
            {show("skills") && skills.length > 0 && (
              <div style={{ flex: 1 }}>
                <SectionHeader title={sw ? "Ujuzi" : "Skills"} primaryColor={primaryColor} />
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {visibleSkills(skills).map((sk) => (
                    <div key={sk.id}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ fontSize: 10.5, color: "#374151" }}>{sk.name}</span>
                      </div>
                      <SkillBar
                        level={sk.level}
                        color={primaryColor}
                        bgColor="#e5e7eb"
                        width={270}
                        height={4}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {show("languages") && languages.length > 0 && (
              <div style={{ flex: 1 }}>
                <SectionHeader title={sw ? "Lugha" : "Languages"} primaryColor={primaryColor} />
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {languages.map((lang) => (
                    <div key={lang.id}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ fontSize: 10.5, color: "#374151" }}>{lang.name}</span>
                        <span style={{ fontSize: 9.5, color: "#94a3b8" }}>{lang.proficiency}</span>
                      </div>
                      <SkillBar
                        level={PROF[lang.proficiency] ?? 3}
                        color={primaryColor}
                        bgColor="#e5e7eb"
                        width={270}
                        height={4}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Certifications — two-column grid */}
        {show("certifications") && certifications.length > 0 && (
          <div>
            <SectionHeader title={sw ? "Vyeti" : "Certifications"} primaryColor={primaryColor} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {certifications.map((cert) => (
                <div key={cert.id} style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 6,
                  padding: "9px 12px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 10.5, fontWeight: 600, color: "#111827" }}>{cert.name}</div>
                    <div style={{ fontSize: 9.5, color: "#64748b", marginTop: 2 }}>{cert.issuer}</div>
                  </div>
                  <div style={{
                    fontSize: 9, color: "#94a3b8",
                    flexShrink: 0, marginLeft: 8, marginTop: 1,
                    whiteSpace: "nowrap",
                  }}>
                    {fmtDate(cert.date)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Referees — two-column grid */}
        {show("referees") && referees.length > 0 && (
          <div>
            <SectionHeader title={sw ? "Wadhamini" : "Referees"} primaryColor={primaryColor} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {referees.map((ref) => (
                <div key={ref.id} style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 6,
                  padding: "9px 12px",
                }}>
                  <div style={{ fontSize: 10.5, fontWeight: 600, color: "#111827" }}>{ref.name}</div>
                  {(ref.title || ref.company) && (
                    <div style={{ fontSize: 9.5, color: "#64748b", marginTop: 2 }}>
                      {ref.title}{ref.company ? ` — ${ref.company}` : ""}
                    </div>
                  )}
                  {(ref.email || ref.phone) && (
                    <div style={{ fontSize: 9, color: "#94a3b8", marginTop: 2 }}>
                      {ref.email}{ref.phone ? ` · ${ref.phone}` : ""}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Interests */}
        {show("hobbies") && hobbies && (
          <div>
            <SectionHeader title={sw ? "Mapendeleo" : "Interests"} primaryColor={primaryColor} />
            <p style={{ fontSize: 10.5, color: "#6b7280", lineHeight: 1.65, margin: 0 }}>
              {hobbies}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
