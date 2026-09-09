import {
  IcoEmail, IcoPhone, IcoPin, IcoLinkedIn, IcoGlobe,
  PhotoCircle, SkillBar,
  fmtDate, dateRange,
} from "@/components/templates/template-utils";
import { visibleSkills } from "@/components/templates/template-utils";
import type { CVData } from "@/components/templates/template-utils";
import type { Lang } from "@/lib/i18n/translations";

const PROF: Record<string, number> = { Native: 5, Fluent: 4, Advanced: 3, Intermediate: 2, Basic: 1 };

function SectionHeader({ title, primaryColor }: { title: string; primaryColor: string }) {
  return (
    <div style={{
      fontSize: 11,
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "0.1em",
      color: primaryColor,
      borderBottom: `2px solid ${primaryColor}`,
      paddingBottom: 5,
      marginBottom: 12,
    }}>
      {title}
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

/** Timeline entry: left border + circle dot */
function TimelineEntry({
  children, primaryColor,
}: {
  children: React.ReactNode; primaryColor: string;
}) {
  return (
    <div style={{ display: "flex", gap: 0 }}>
      {/* Left rail */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginRight: 14 }}>
        <div style={{
          width: 9, height: 9, borderRadius: "50%",
          backgroundColor: primaryColor, flexShrink: 0, marginTop: 3,
        }} />
        <div style={{ width: 2, flex: 1, backgroundColor: `${primaryColor}33`, marginTop: 2 }} />
      </div>
      <div style={{ flex: 1, paddingBottom: 4 }}>
        {children}
      </div>
    </div>
  );
}

export function SavannaTemplate({
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
    { icon: <IcoEmail size={10} color="#fed7aa" />, text: personal.email },
    { icon: <IcoPhone size={10} color="#fed7aa" />, text: personal.phone },
    { icon: <IcoPin size={10} color="#fed7aa" />, text: personal.location },
    { icon: <IcoLinkedIn size={10} color="#fed7aa" />, text: personal.linkedin ?? "" },
    { icon: <IcoGlobe size={10} color="#fed7aa" />, text: personal.website ?? "" },
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
        padding: "32px 44px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 20,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 26, fontWeight: 700, color: "#fff",
            lineHeight: 1.2, marginBottom: 4,
          }}>
            {personal.fullName}
          </div>
          <div style={{ fontSize: 12, color: "#fed7aa", marginBottom: 14, letterSpacing: "0.01em" }}>
            {personal.jobTitle}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "5px 16px" }}>
            {contactPairs.map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                {c.icon}
                <span style={{ fontSize: 10, color: "#fed7aa", lineHeight: 1.3 }}>{c.text}</span>
              </div>
            ))}
          </div>
        </div>
        <PhotoCircle
          url={personal.photo}
          name={personal.fullName || "CV"}
          size={80}
          bgColor={primaryColor}
          borderColor="#fed7aa"
          borderWidth={3}
        />
      </div>

      {/* ── Body ─────────────────────────────────────────────────── */}
      <div style={{
        padding: "28px 44px",
        display: "flex",
        flexDirection: "column",
        gap: 20,
        flex: 1,
      }}>

        {/* Summary */}
        {show("summary") && summary && (
          <div>
            <SectionHeader title={sw ? "Wasifu" : "Profile"} primaryColor={primaryColor} />
            <p style={{ fontSize: 10.5, color: "#4b5563", lineHeight: 1.75, margin: 0 }}>
              {summary}
            </p>
          </div>
        )}

        {/* Experience — timeline */}
        {show("experience") && experience.length > 0 && (
          <div>
            <SectionHeader title={sw ? "Uzoefu wa Kazi" : "Work Experience"} primaryColor={primaryColor} />
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {experience.map((exp) => (
                <TimelineEntry key={exp.id} primaryColor={primaryColor}>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    marginBottom: 2,
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#111827" }}>
                      {exp.position}
                    </span>
                    <span style={{ fontSize: 10, color: "#9ca3af", flexShrink: 0, marginLeft: 10 }}>
                      {dateRange(exp.startDate, exp.endDate, exp.current)}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b", marginBottom: exp.description ? 2 : 6 }}>
                    {exp.company}{exp.location ? ` · ${exp.location}` : ""}
                  </div>
                  {exp.description && (
                    <div style={{ marginBottom: 8 }}>
                      <BulletDesc desc={exp.description} primaryColor={primaryColor} />
                    </div>
                  )}
                </TimelineEntry>
              ))}
            </div>
          </div>
        )}

        {/* Education — timeline */}
        {show("education") && education.length > 0 && (
          <div>
            <SectionHeader title={sw ? "Elimu" : "Education"} primaryColor={primaryColor} />
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {education.map((edu) => (
                <TimelineEntry key={edu.id} primaryColor={primaryColor}>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    marginBottom: 2,
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#111827" }}>
                      {edu.degree}{edu.field ? ` in ${edu.field}` : ""}
                    </span>
                    <span style={{ fontSize: 10, color: "#9ca3af", flexShrink: 0, marginLeft: 10 }}>
                      {dateRange(edu.startDate, edu.endDate, false)}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b", marginBottom: edu.description ? 2 : 8 }}>
                    {edu.institution}{edu.grade ? ` · Grade: ${edu.grade}` : ""}
                  </div>
                  {edu.description && (
                    <div style={{ marginBottom: 8 }}>
                      <BulletDesc desc={edu.description} primaryColor={primaryColor} />
                    </div>
                  )}
                </TimelineEntry>
              ))}
            </div>
          </div>
        )}

        {/* Skills + Languages — 2-column */}
        {((show("skills") && skills.length > 0) || (show("languages") && languages.length > 0)) && (
          <div style={{ display: "flex", gap: 32 }}>
            {show("skills") && skills.length > 0 && (
              <div style={{ flex: 1 }}>
                <SectionHeader title={sw ? "Ujuzi" : "Skills"} primaryColor={primaryColor} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "7px 14px" }}>
                  {visibleSkills(skills).map((sk) => (
                    <div key={sk.id}>
                      <div style={{ fontSize: 10, color: "#374151", marginBottom: 3 }}>{sk.name}</div>
                      <SkillBar level={sk.level} color={primaryColor} bgColor="#e5e7eb" width={130} height={4} />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {show("languages") && languages.length > 0 && (
              <div style={{ flex: 1 }}>
                <SectionHeader title={sw ? "Lugha" : "Languages"} primaryColor={primaryColor} />
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {languages.map((lang) => (
                    <div key={lang.id} style={{
                      fontSize: 9.5,
                      color: primaryColor,
                      backgroundColor: `${primaryColor}20`,
                      border: `1px solid ${primaryColor}40`,
                      padding: "3px 9px",
                      borderRadius: 20,
                      fontWeight: 500,
                    }}>
                      {lang.name}
                      <span style={{ color: `${primaryColor}99`, fontWeight: 400 }}>
                        {" · "}{lang.proficiency}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Certifications */}
        {show("certifications") && certifications.length > 0 && (
          <div>
            <SectionHeader title={sw ? "Vyeti" : "Certifications"} primaryColor={primaryColor} />
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {certifications.map((cert) => (
                <div key={cert.id} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                }}>
                  <div>
                    <div style={{ fontSize: 10.5, fontWeight: 600, color: "#111827" }}>{cert.name}</div>
                    <div style={{ fontSize: 9.5, color: "#64748b", marginTop: 1 }}>{cert.issuer}</div>
                  </div>
                  <div style={{ fontSize: 9.5, color: "#9ca3af", flexShrink: 0, marginLeft: 8 }}>
                    {fmtDate(cert.date)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Referees */}
        {show("referees") && referees.length > 0 && (
          <div>
            <SectionHeader title={sw ? "Wadhamini" : "Referees"} primaryColor={primaryColor} />
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {referees.map((ref) => (
                <div key={ref.id} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                }}>
                  <div>
                    <div style={{ fontSize: 10.5, fontWeight: 600, color: "#111827" }}>{ref.name}</div>
                    <div style={{ fontSize: 9.5, color: "#64748b", marginTop: 1 }}>
                      {ref.title}{ref.company ? ` — ${ref.company}` : ""}
                    </div>
                    <div style={{ fontSize: 9, color: "#94a3b8", marginTop: 1 }}>
                      {ref.email}{ref.phone ? ` · ${ref.phone}` : ""}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Interests */}
        {show("hobbies") && hobbies && (
          <div>
            <SectionHeader title={sw ? "Mapendeleo" : "Interests"} primaryColor={primaryColor} />
            <p style={{ fontSize: 10.5, color: "#6b7280", lineHeight: 1.65, margin: 0 }}>{hobbies}</p>
          </div>
        )}
      </div>
    </div>
  );
}
