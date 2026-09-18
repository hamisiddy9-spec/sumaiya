import {
  fmtDate, dateRange, visibleSkills,
  type CVData,
} from "@/components/templates/template-utils";
import type { Lang } from "@/lib/i18n/translations";
import { cvHeadings } from "@/lib/i18n/cv-headings";

export function NordicMinimalTemplate({ data, primaryColor, fontFamily, lang = "en" }: { data: CVData; primaryColor: string; fontFamily: string; lang?: Lang }) {
  const L = cvHeadings(lang);
  const { personal, summary, experience, education, skills, languages, certifications, referees, hobbies } = data;
  const hidden = (k: string) => data.hiddenSections?.includes(k) ?? false;

  const sectionLabel: React.CSSProperties = {
    fontSize: 9,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.14em",
    color: primaryColor,
    margin: "0 0 10px",
  };

  const hr: React.CSSProperties = {
    border: "none",
    borderTop: "1px solid #e2e8f0",
    margin: "0 0 18px",
  };

  return (
    <div style={{ width: 794, minHeight: 1123, fontFamily, backgroundColor: "#fff", boxSizing: "border-box", padding: "64px 72px" }}>
      {/* Name */}
      <div style={{ fontSize: 32, fontWeight: 800, color: "#0f172a", margin: "0 0 4px", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
        {personal.fullName}
      </div>
      <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 20px", fontWeight: 400, letterSpacing: "0.04em" }}>
        {personal.jobTitle}
      </p>

      {/* Thin rule */}
      <div style={{ borderTop: "2px solid #0f172a", marginBottom: 16 }} />

      {/* Contact row */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 20px", marginBottom: 40 }}>
        {personal.email && (
          <span style={{ fontSize: 9.5, color: "#475569" }}>{personal.email}</span>
        )}
        {personal.phone && (
          <>
            <span style={{ fontSize: 9.5, color: "#cbd5e1" }}>·</span>
            <span style={{ fontSize: 9.5, color: "#475569" }}>{personal.phone}</span>
          </>
        )}
        {personal.location && (
          <>
            <span style={{ fontSize: 9.5, color: "#cbd5e1" }}>·</span>
            <span style={{ fontSize: 9.5, color: "#475569" }}>{personal.location}</span>
          </>
        )}
        {personal.linkedin && (
          <>
            <span style={{ fontSize: 9.5, color: "#cbd5e1" }}>·</span>
            <span style={{ fontSize: 9.5, color: "#475569" }}>{personal.linkedin}</span>
          </>
        )}
        {personal.website && (
          <>
            <span style={{ fontSize: 9.5, color: "#cbd5e1" }}>·</span>
            <span style={{ fontSize: 9.5, color: "#475569" }}>{personal.website}</span>
          </>
        )}
      </div>

      {/* Summary */}
      {summary && !hidden("summary") && (
        <div style={{ marginBottom: 36 }}>
          <p style={sectionLabel}>{L.profile}</p>
          <hr style={hr} />
          <p style={{ fontSize: 10.5, color: "#334155", lineHeight: 1.85, margin: 0 }}>{summary}</p>
        </div>
      )}

      {/* Experience */}
      {experience.length > 0 && !hidden("experience") && (
        <div style={{ marginBottom: 36 }}>
          <p style={sectionLabel}>{L.experience}</p>
          <hr style={hr} />
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            {experience.map((exp) => (
              <div key={exp.id} style={{ display: "flex", gap: 20 }}>
                <div style={{ width: 120, flexShrink: 0 }}>
                  <p style={{ fontSize: 9, color: "#94a3b8", margin: 0, lineHeight: 1.5 }}>{dateRange(exp.startDate, exp.endDate, exp.current)}</p>
                  {exp.location && <p style={{ fontSize: 9, color: "#94a3b8", margin: "2px 0 0" }}>{exp.location}</p>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", margin: "0 0 2px" }}>{exp.position}</p>
                  <p style={{ fontSize: 10, color: "#64748b", margin: "0 0 6px", fontWeight: 500 }}>{exp.company}</p>
                  {exp.description && (
                    <div>
                      {exp.description.split("\n").filter(Boolean).map((line, i) => (
                        <div key={i} style={{ display: "flex", gap: 6, marginBottom: 3 }}>
                          <span style={{ color: "#94a3b8", fontSize: 9, flexShrink: 0, marginTop: 2 }}>—</span>
                          <span style={{ fontSize: 10, color: "#475569", lineHeight: 1.65 }}>{line.replace(/^[-•▸]\s*/, "")}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {education.length > 0 && !hidden("education") && (
        <div style={{ marginBottom: 36 }}>
          <p style={sectionLabel}>{L.education}</p>
          <hr style={hr} />
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {education.map((edu) => (
              <div key={edu.id} style={{ display: "flex", gap: 20 }}>
                <div style={{ width: 120, flexShrink: 0 }}>
                  <p style={{ fontSize: 9, color: "#94a3b8", margin: 0 }}>{dateRange(edu.startDate, edu.endDate, false)}</p>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", margin: "0 0 2px" }}>{edu.degree}{edu.field ? ` in ${edu.field}` : ""}</p>
                  <p style={{ fontSize: 10, color: "#64748b", margin: 0 }}>{edu.institution}</p>
                  {edu.grade && <p style={{ fontSize: 9.5, color: "#94a3b8", margin: "3px 0 0" }}>Grade: {edu.grade}</p>}
                  {edu.description && <p style={{ fontSize: 9.5, color: "#64748b", margin: "4px 0 0", lineHeight: 1.6 }}>{edu.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {skills.length > 0 && !hidden("skills") && (
        <div style={{ marginBottom: 36 }}>
          <p style={sectionLabel}>{L.skills}</p>
          <hr style={hr} />
          <p style={{ fontSize: 10.5, color: "#475569", margin: 0, lineHeight: 1.8 }}>
            {visibleSkills(skills).map((s) => s.name).join(", ")}
          </p>
        </div>
      )}

      {/* Languages + Certifications in a row */}
      {(languages.length > 0 || certifications.length > 0) && (
        <div style={{ display: "flex", gap: 40, marginBottom: 36 }}>
          {languages.length > 0 && !hidden("languages") && (
            <div style={{ flex: 1 }}>
              <p style={sectionLabel}>{L.languages}</p>
              <hr style={hr} />
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {languages.map((l) => (
                  <div key={l.id} style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 10.5, color: "#334155" }}>{l.name}</span>
                    <span style={{ fontSize: 9.5, color: "#94a3b8" }}>{l.proficiency}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {certifications.length > 0 && !hidden("certifications") && (
            <div style={{ flex: 1 }}>
              <p style={sectionLabel}>{L.certifications}</p>
              <hr style={hr} />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {certifications.map((c) => (
                  <div key={c.id}>
                    <p style={{ fontSize: 10.5, fontWeight: 600, color: "#334155", margin: "0 0 1px" }}>{c.name}</p>
                    <p style={{ fontSize: 9.5, color: "#94a3b8", margin: 0 }}>{c.issuer}{c.date ? ` · ${fmtDate(c.date) || c.date}` : ""}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Referees */}
      {referees.length > 0 && !hidden("referees") && (
        <div style={{ marginBottom: 36 }}>
          <p style={sectionLabel}>Referees / Wadhamini</p>
          <hr style={hr} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {referees.map((ref) => (
              <div key={ref.id}>
                <p style={{ fontSize: 10.5, fontWeight: 600, color: "#334155", margin: "0 0 1px" }}>{ref.name}</p>
                <p style={{ fontSize: 9.5, color: "#94a3b8", margin: 0 }}>
                  {ref.title}{ref.company ? ` — ${ref.company}` : ""}
                  {ref.email || ref.phone ? " · " : ""}
                  {ref.email}{ref.email && ref.phone ? " · " : ""}{ref.phone}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interests */}
      {hobbies && !hidden("hobbies") && (
        <div style={{ marginBottom: 36 }}>
          <p style={sectionLabel}>{L.interests}</p>
          <hr style={hr} />
          <p style={{ fontSize: 10.5, color: "#475569", margin: 0, lineHeight: 1.8 }}>
            {hobbies.split(/[,\n]+/).filter((h) => h.trim()).map((h) => h.trim()).join("  ·  ")}
          </p>
        </div>
      )}

      {!summary && experience.length === 0 && education.length === 0 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0", color: "#cbd5e1", fontSize: 13 }}>
          {lang === "sw" ? "Jaza fomu ili uone onyesho la CV yako" : "Fill in the form to preview your CV"}
        </div>
      )}
    </div>
  );
}
