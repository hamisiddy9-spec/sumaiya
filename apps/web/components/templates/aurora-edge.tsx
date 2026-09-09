import {
  IcoEmail, IcoPhone, IcoPin, IcoLinkedIn, IcoGlobe,
  PhotoCircle, ContactItem, fmtDate, dateRange,
  type CVData,
  visibleSkills,
} from "@/components/templates/template-utils";
import type { Lang } from "@/lib/i18n/translations";

const PROF: Record<string, number> = { Native: 5, Fluent: 4, Advanced: 3, Intermediate: 2, Basic: 1 };

export function AuroraEdgeTemplate({ data, primaryColor, fontFamily, lang = "en" }: { data: CVData; primaryColor: string; fontFamily: string; lang?: Lang }) {
  const { personal, summary, experience, education, skills, languages, certifications, referees, hobbies } = data;
  const hidden = (k: string) => data.hiddenSections?.includes(k) ?? false;

  return (
    <div style={{ width: 794, minHeight: 1123, fontFamily, display: "flex", backgroundColor: "#fff", boxSizing: "border-box" }}>
      {/* Sidebar */}
      <div style={{ width: 220, minHeight: 1123, backgroundColor: primaryColor, display: "flex", flexDirection: "column", flexShrink: 0, boxSizing: "border-box", position: "relative" }}>
        {/* Top accent stripe */}
        <div style={{ height: 8, backgroundColor: "rgba(0,0,0,0.2)", flexShrink: 0 }} />
        <div style={{ padding: "24px 18px", display: "flex", flexDirection: "column", gap: 20, flex: 1 }}>
          {/* Photo + Name */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <PhotoCircle url={personal.photo} name={personal.fullName || "CV"} size={80} bgColor="rgba(255,255,255,0.2)" borderColor="rgba(255,255,255,0.6)" borderWidth={2} />
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 15, fontWeight: 800, color: "#fff", margin: "0 0 3px", lineHeight: 1.2 }}>{personal.fullName}</p>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", margin: 0 }}>{personal.jobTitle}</p>
            </div>
          </div>

          {/* Contact */}
          <div>
            <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.5)", margin: "0 0 8px" }}>Contact</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {personal.email && <ContactItem icon={<IcoEmail size={9} color="rgba(255,255,255,0.8)" />} text={personal.email} color="rgba(255,255,255,0.8)" fontSize={9} />}
              {personal.phone && <ContactItem icon={<IcoPhone size={9} color="rgba(255,255,255,0.8)" />} text={personal.phone} color="rgba(255,255,255,0.8)" fontSize={9} />}
              {personal.location && <ContactItem icon={<IcoPin size={9} color="rgba(255,255,255,0.8)" />} text={personal.location} color="rgba(255,255,255,0.8)" fontSize={9} />}
              {personal.linkedin && <ContactItem icon={<IcoLinkedIn size={9} color="rgba(255,255,255,0.8)" />} text={personal.linkedin} color="rgba(255,255,255,0.8)" fontSize={9} />}
              {personal.website && <ContactItem icon={<IcoGlobe size={9} color="rgba(255,255,255,0.8)" />} text={personal.website} color="rgba(255,255,255,0.8)" fontSize={9} />}
            </div>
          </div>

          {/* Skills as pills */}
          {skills.length > 0 && !hidden("skills") && (
            <div>
              <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.5)", margin: "0 0 8px" }}>Skills</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {visibleSkills(skills).map((s) => (
                  <span key={s.id} style={{ fontSize: 9, color: "#fff", backgroundColor: "rgba(255,255,255,0.18)", padding: "3px 8px", borderRadius: 99, border: "1px solid rgba(255,255,255,0.25)" }}>{s.name}</span>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {languages.length > 0 && !hidden("languages") && (
            <div>
              <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.5)", margin: "0 0 8px" }}>Languages</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {languages.map((l) => (
                  <div key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 9.5, color: "rgba(255,255,255,0.9)" }}>{l.name}</span>
                    <span style={{ fontSize: 8, color: "rgba(255,255,255,0.55)", backgroundColor: "rgba(255,255,255,0.12)", padding: "1px 6px", borderRadius: 4 }}>{l.proficiency}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {certifications.length > 0 && !hidden("certifications") && (
            <div>
              <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.5)", margin: "0 0 8px" }}>Certifications</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {certifications.map((c) => (
                  <div key={c.id}>
                    <p style={{ fontSize: 9.5, fontWeight: 600, color: "#fff", margin: "0 0 1px" }}>{c.name}</p>
                    <p style={{ fontSize: 8.5, color: "rgba(255,255,255,0.6)", margin: 0 }}>{c.issuer}{c.date ? ` · ${fmtDate(c.date) || c.date}` : ""}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: "32px 28px", display: "flex", flexDirection: "column", gap: 18, boxSizing: "border-box", minWidth: 0 }}>
        {summary && !hidden("summary") && (
          <div>
            <div style={{ borderLeft: `3px solid ${primaryColor}`, paddingLeft: 10, marginBottom: 10 }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#1e293b", margin: 0 }}>Profile</p>
            </div>
            <p style={{ fontSize: 10.5, color: "#475569", lineHeight: 1.75, margin: 0 }}>{summary}</p>
          </div>
        )}

        {experience.length > 0 && !hidden("experience") && (
          <div>
            <div style={{ borderLeft: `3px solid ${primaryColor}`, paddingLeft: 10, marginBottom: 12 }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#1e293b", margin: 0 }}>Experience</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
              {experience.map((exp) => (
                <div key={exp.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 2 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", margin: "0 0 1px" }}>{exp.position}</p>
                      <p style={{ fontSize: 10.5, color: "#64748b", margin: 0 }}>{exp.company}{exp.location ? ` · ${exp.location}` : ""}</p>
                    </div>
                    <span style={{ fontSize: 9.5, color: "#94a3b8", whiteSpace: "nowrap", marginLeft: 8, flexShrink: 0, backgroundColor: "#f1f5f9", padding: "2px 8px", borderRadius: 4 }}>{dateRange(exp.startDate, exp.endDate, exp.current)}</span>
                  </div>
                  {exp.description && (
                    <div style={{ marginTop: 5 }}>
                      {exp.description.split("\n").filter(Boolean).map((line, i) => (
                        <div key={i} style={{ display: "flex", gap: 5, marginBottom: 3 }}>
                          <span style={{ color: primaryColor, fontSize: 9, flexShrink: 0, marginTop: 2 }}>▸</span>
                          <span style={{ fontSize: 10, color: "#475569", lineHeight: 1.6 }}>{line.replace(/^[-•▸]\s*/, "")}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {education.length > 0 && !hidden("education") && (
          <div>
            <div style={{ borderLeft: `3px solid ${primaryColor}`, paddingLeft: 10, marginBottom: 12 }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#1e293b", margin: 0 }}>Education</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {education.map((edu) => (
                <div key={edu.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", margin: "0 0 1px" }}>{edu.degree}{edu.field ? ` in ${edu.field}` : ""}</p>
                    <p style={{ fontSize: 10.5, color: "#64748b", margin: 0 }}>{edu.institution}</p>
                    {edu.grade && <p style={{ fontSize: 9.5, color: "#94a3b8", margin: "2px 0 0" }}>Grade: {edu.grade}</p>}
                  </div>
                  <span style={{ fontSize: 9.5, color: "#94a3b8", whiteSpace: "nowrap", marginLeft: 8, flexShrink: 0 }}>{dateRange(edu.startDate, edu.endDate, false)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {referees.length > 0 && !hidden("referees") && (
          <div>
            <div style={{ borderLeft: `3px solid ${primaryColor}`, paddingLeft: 10, marginBottom: 12 }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#1e293b", margin: 0 }}>Referees <span style={{ fontWeight: 400, opacity: 0.5 }}>/ Wadhamini</span></p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {referees.map((ref) => (
                <div key={ref.id}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", margin: "0 0 1px" }}>{ref.name}</p>
                  {(ref.title || ref.company) && (
                    <p style={{ fontSize: 10, color: "#64748b", margin: 0 }}>
                      {[ref.title, ref.company].filter(Boolean).join(" \u2014 ")}
                    </p>
                  )}
                  {(ref.email || ref.phone) && (
                    <p style={{ fontSize: 10, color: "#94a3b8", margin: "1px 0 0" }}>
                      {[ref.email, ref.phone].filter(Boolean).join(" \u00b7 ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {hobbies && !hidden("hobbies") && (
          <div>
            <div style={{ borderLeft: `3px solid ${primaryColor}`, paddingLeft: 10, marginBottom: 10 }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#1e293b", margin: 0 }}>Interests</p>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {hobbies.split(/[,\n]+/).filter((h) => h.trim()).map((h, i) => (
                <span key={i} style={{ fontSize: 9.5, color: "#475569", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", padding: "3px 10px", borderRadius: 99 }}>{h.trim()}</span>
              ))}
            </div>
          </div>
        )}

        {!summary && experience.length === 0 && education.length === 0 && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#cbd5e1", fontSize: 13 }}>{lang === "sw" ? "Jaza fomu ili uone onyesho la CV yako" : "Fill in the form to preview your CV"}</div>
        )}
      </div>
    </div>
  );
}
