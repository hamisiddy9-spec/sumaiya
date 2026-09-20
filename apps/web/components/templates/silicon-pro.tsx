import {
  IcoEmail, IcoPhone, IcoPin, IcoLinkedIn, IcoGlobe,
  ContactItem, SkillBar, fmtDate, dateRange,
  type CVData,
  visibleSkills,
} from "@/components/templates/template-utils";
import type { Lang } from "@/lib/i18n/translations";

export function SiliconProTemplate({ data, primaryColor, fontFamily, lang = "en" }: { data: CVData; primaryColor: string; fontFamily: string; lang?: Lang }) {
  const { personal, summary, experience, education, skills, languages, certifications, referees, hobbies } = data;
  const hidden = (k: string) => data.hiddenSections?.includes(k) ?? false;

  const SectionHeader = ({ title }: { title: string }) => (
    <div style={{ marginBottom: 12 }}>
      <p style={{
        fontSize: 9.5,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.12em",
        color: primaryColor,
        margin: "0 0 6px",
      }}>{title}</p>
      <div style={{ borderBottom: `2px solid ${primaryColor}` }} />
    </div>
  );

  return (
    <div style={{ width: 794, minHeight: 1123, fontFamily, backgroundColor: "#fff", boxSizing: "border-box" }}>
      {/* Header band */}
      <div style={{ backgroundColor: primaryColor, height: 80, padding: "0 40px", display: "flex", alignItems: "center", justifyContent: "space-between", boxSizing: "border-box" }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#fff", margin: "0 0 2px", letterSpacing: "-0.01em" }}>
            {personal.fullName}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", margin: 0, fontWeight: 400 }}>
            {personal.jobTitle}
          </p>
        </div>
      </div>

      {/* Contact row */}
      <div style={{ backgroundColor: "#fff", borderBottom: "2px solid #e2e8f0", padding: "10px 40px", display: "flex", flexWrap: "wrap", gap: "4px 20px", alignItems: "center" }}>
        {personal.email && <ContactItem icon={<IcoEmail size={10} color={primaryColor} />} text={personal.email} color="#475569" fontSize={9.5} />}
        {personal.phone && <ContactItem icon={<IcoPhone size={10} color={primaryColor} />} text={personal.phone} color="#475569" fontSize={9.5} />}
        {personal.location && <ContactItem icon={<IcoPin size={10} color={primaryColor} />} text={personal.location} color="#475569" fontSize={9.5} />}
        {personal.linkedin && <ContactItem icon={<IcoLinkedIn size={10} color={primaryColor} />} text={personal.linkedin} color="#475569" fontSize={9.5} />}
        {personal.website && <ContactItem icon={<IcoGlobe size={10} color={primaryColor} />} text={personal.website} color="#475569" fontSize={9.5} />}
      </div>

      {/* Two-column body */}
      <div style={{ display: "flex", minHeight: "calc(1123px - 116px)" }}>
        {/* Left — 65% */}
        <div style={{ flex: "0 0 65%", padding: "24px 24px 24px 40px", boxSizing: "border-box", borderRight: "1px solid #e2e8f0" }}>
          {/* Summary */}
          {summary && !hidden("summary") && (
            <div style={{ marginBottom: 24 }}>
              <SectionHeader title="Summary" />
              <p style={{ fontSize: 10.5, color: "#475569", lineHeight: 1.8, margin: 0 }}>{summary}</p>
            </div>
          )}

          {/* Experience */}
          {experience.length > 0 && !hidden("experience") && (
            <div style={{ marginBottom: 24 }}>
              <SectionHeader title="Experience" />
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {experience.map((exp) => (
                  <div key={exp.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 2 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 11.5, fontWeight: 700, color: "#0f172a", margin: "0 0 1px" }}>{exp.position}</p>
                        <p style={{ fontSize: 10, color: "#64748b", margin: 0, fontWeight: 500 }}>{exp.company}{exp.location ? ` · ${exp.location}` : ""}</p>
                      </div>
                      <span style={{ fontSize: 9, whiteSpace: "nowrap", marginLeft: 10, flexShrink: 0, backgroundColor: `${primaryColor}15`, color: primaryColor, padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>{dateRange(exp.startDate, exp.endDate, exp.current)}</span>
                    </div>
                    {exp.description && (
                      <div style={{ marginTop: 6 }}>
                        {exp.description.split("\n").filter(Boolean).map((line, i) => (
                          <div key={i} style={{ display: "flex", gap: 6, marginBottom: 3 }}>
                            <span style={{ color: primaryColor, fontSize: 8, flexShrink: 0, marginTop: 3 }}>▸</span>
                            <span style={{ fontSize: 10, color: "#475569", lineHeight: 1.65 }}>{line.replace(/^[-•▸]\s*/, "")}</span>
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
            <div style={{ marginBottom: 24 }}>
              <SectionHeader title="Education" />
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {education.map((edu) => (
                  <div key={edu.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 11.5, fontWeight: 700, color: "#0f172a", margin: "0 0 1px" }}>{edu.degree}{edu.field ? ` in ${edu.field}` : ""}</p>
                        <p style={{ fontSize: 10, color: "#64748b", margin: 0 }}>{edu.institution}</p>
                        {edu.grade && <p style={{ fontSize: 9.5, color: "#94a3b8", margin: "2px 0 0" }}>Grade: {edu.grade}</p>}
                      </div>
                      <span style={{ fontSize: 9, color: "#94a3b8", whiteSpace: "nowrap", marginLeft: 10, flexShrink: 0 }}>{dateRange(edu.startDate, edu.endDate, false)}</span>
                    </div>
                    {edu.description && (
                      <p style={{ fontSize: 10, color: "#64748b", margin: "4px 0 0", lineHeight: 1.6 }}>{edu.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interests */}
          {hobbies && !hidden("hobbies") && (
            <div>
              <SectionHeader title="Interests" />
              <p style={{ fontSize: 10.5, color: "#475569", margin: 0, lineHeight: 1.7 }}>{hobbies}</p>
            </div>
          )}
        </div>

        {/* Right — 35% */}
        <div style={{ flex: "0 0 35%", padding: "24px 40px 24px 24px", boxSizing: "border-box" }}>
          {/* Skills with bars */}
          {skills.length > 0 && !hidden("skills") && (
            <div style={{ marginBottom: 24 }}>
              <SectionHeader title="Skills" />
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {visibleSkills(skills).map((s) => (
                  <div key={s.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: 10, color: "#334155", fontWeight: 500 }}>{s.name}</span>
                    </div>
                    <SkillBar level={s.level} color={primaryColor} bgColor="#e2e8f0" width={220} height={5} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {languages.length > 0 && !hidden("languages") && (
            <div style={{ marginBottom: 24 }}>
              <SectionHeader title="Languages" />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {languages.map((l) => (
                  <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{flex: 1, minWidth: 0, borderBottom: "1px dotted currentColor", paddingBottom: 2, fontSize: 10.5, color: "#334155", fontWeight: 500}}>{l.name}</span><span style={{flexShrink: 0, whiteSpace: "nowrap", fontSize: 9, color: "#94a3b8", backgroundColor: "#f1f5f9", padding: "2px 7px", borderRadius: 4}}>{l.proficiency}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {certifications.length > 0 && !hidden("certifications") && (
            <div style={{ marginBottom: 24 }}>
              <SectionHeader title="Certifications" />
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {certifications.map((c) => (
                  <div key={c.id} style={{ borderLeft: `2px solid ${primaryColor}`, paddingLeft: 8 }}>
                    <p style={{ fontSize: 10, fontWeight: 600, color: "#334155", margin: "0 0 2px" }}>{c.name}</p>
                    <p style={{ fontSize: 9.5, color: "#64748b", margin: "0 0 1px" }}>{c.issuer}</p>
                    {c.date && <p style={{ fontSize: 9, color: "#94a3b8", margin: 0 }}>{fmtDate(c.date) || c.date}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Referees / Wadhamini */}
          {referees.length > 0 && !hidden("referees") && (
            <div style={{ marginBottom: 24 }}>
              <SectionHeader title="Referees" />
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {referees.map((r) => (
                  <div key={r.id} style={{ borderLeft: `2px solid ${primaryColor}`, paddingLeft: 8 }}>
                    <p style={{ fontSize: 10, fontWeight: 600, color: "#334155", margin: "0 0 2px" }}>{r.name}</p>
                    <p style={{ fontSize: 9.5, color: "#64748b", margin: "0 0 1px" }}>{r.title}{r.company ? ` · ${r.company}` : ""}</p>
                    {r.email && <p style={{ fontSize: 9, color: "#94a3b8", margin: 0 }}>{r.email}</p>}
                    {r.phone && <p style={{ fontSize: 9, color: "#94a3b8", margin: 0 }}>{r.phone}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {!summary && experience.length === 0 && education.length === 0 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0", color: "#cbd5e1", fontSize: 13 }}>
          {lang === "sw" ? "Jaza fomu ili uone onyesho la CV yako" : "Fill in the form to preview your CV"}
        </div>
      )}
    </div>
  );
}
