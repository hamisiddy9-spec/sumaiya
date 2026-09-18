import {
  IcoEmail, IcoPhone, IcoPin, IcoLinkedIn, IcoGlobe,
  ContactItem, SkillBar, dateRange, fmtDate,
  type CVData,
  visibleSkills,
} from "@/components/templates/template-utils";
import type { Lang } from "@/lib/i18n/translations";
import { cvHeadings } from "@/lib/i18n/cv-headings";

export function TokyoGridTemplate({ data, primaryColor, fontFamily, lang = "en" }: { data: CVData; primaryColor: string; fontFamily: string; lang?: Lang }) {
  const L = cvHeadings(lang);
  const { personal, summary, experience, education, skills, languages, certifications, referees, hobbies } = data;
  const hidden = (k: string) => data.hiddenSections?.includes(k) ?? false;

  const SIDEBAR_BG = "#111827";

  return (
    <div style={{ width: 794, minHeight: 1123, fontFamily, display: "flex", backgroundColor: "#fff", boxSizing: "border-box" }}>
      {/* Left sidebar — dark */}
      <div style={{ width: 180, minHeight: 1123, backgroundColor: SIDEBAR_BG, display: "flex", flexDirection: "column", flexShrink: 0, boxSizing: "border-box" }}>
        <div style={{ padding: "28px 16px", display: "flex", flexDirection: "column", gap: 22, flex: 1 }}>
          {/* Contact */}
          <div>
            <p style={{ fontSize: 8.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: primaryColor, margin: "0 0 10px" }}>{L.contact}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {personal.email && <ContactItem icon={<IcoEmail size={9} color="#9ca3af" />} text={personal.email} color="#d1d5db" fontSize={8.5} />}
              {personal.phone && <ContactItem icon={<IcoPhone size={9} color="#9ca3af" />} text={personal.phone} color="#d1d5db" fontSize={8.5} />}
              {personal.location && <ContactItem icon={<IcoPin size={9} color="#9ca3af" />} text={personal.location} color="#d1d5db" fontSize={8.5} />}
              {personal.linkedin && <ContactItem icon={<IcoLinkedIn size={9} color="#9ca3af" />} text={personal.linkedin} color="#d1d5db" fontSize={8.5} />}
              {personal.website && <ContactItem icon={<IcoGlobe size={9} color="#9ca3af" />} text={personal.website} color="#d1d5db" fontSize={8.5} />}
            </div>
          </div>

          {/* Languages */}
          {languages.length > 0 && !hidden("languages") && (
            <div>
              <p style={{ fontSize: 8.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: primaryColor, margin: "0 0 10px" }}>{L.languages}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {languages.map((l) => (
                  <div key={l.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                      <span style={{ fontSize: 9.5, color: "#e5e7eb", fontWeight: 500 }}>{l.name}</span>
                    </div>
                    <span style={{ fontSize: 8, color: "#6b7280", display: "block" }}>{l.proficiency}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {certifications.length > 0 && !hidden("certifications") && (
            <div>
              <p style={{ fontSize: 8.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: primaryColor, margin: "0 0 10px" }}>{L.certifications}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {certifications.map((c) => (
                  <div key={c.id}>
                    <p style={{ fontSize: 9, fontWeight: 600, color: "#e5e7eb", margin: "0 0 1px", lineHeight: 1.3 }}>{c.name}</p>
                    <p style={{ fontSize: 8, color: "#6b7280", margin: 0 }}>{c.issuer}</p>
                    {c.date && <p style={{ fontSize: 7.5, color: "#4b5563", margin: "1px 0 0" }}>{fmtDate(c.date) || c.date}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Referees */}
          {referees.length > 0 && !hidden("referees") && (
            <div>
              <p style={{ fontSize: 8.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: primaryColor, margin: "0 0 10px" }}>Referees / Wadhamini</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {referees.map((ref) => (
                  <div key={ref.id}>
                    <p style={{ fontSize: 9, fontWeight: 600, color: "#e5e7eb", margin: "0 0 1px", lineHeight: 1.3 }}>{ref.name}</p>
                    {(ref.title || ref.company) && (
                      <p style={{ fontSize: 8, color: "#6b7280", margin: 0 }}>{[ref.title, ref.company].filter(Boolean).join(" — ")}</p>
                    )}
                    {(ref.email || ref.phone) && (
                      <p style={{ fontSize: 7.5, color: "#4b5563", margin: "1px 0 0" }}>{[ref.email, ref.phone].filter(Boolean).join(" · ")}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, boxSizing: "border-box" }}>
        {/* Red name header */}
        <div style={{ backgroundColor: primaryColor, padding: "24px 28px 20px" }}>
          <div style={{ fontSize: 26, fontWeight: 900, color: "#fff", margin: "0 0 3px", letterSpacing: "-0.01em", lineHeight: 1.1 }}>
            {personal.fullName}
          </div>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", margin: 0, letterSpacing: "0.06em", fontWeight: 500, textTransform: "uppercase" }}>
            {personal.jobTitle}
          </p>
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Summary pills */}
          {summary && !hidden("summary") && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{ width: 4, height: 16, backgroundColor: primaryColor, borderRadius: 2, flexShrink: 0 }} />
                <p style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "#111827", margin: 0 }}>{L.profile}</p>
              </div>
              <p style={{ fontSize: 10.5, color: "#374151", lineHeight: 1.75, margin: 0 }}>{summary}</p>
            </div>
          )}

          {/* Experience — timeline with red left border */}
          {experience.length > 0 && !hidden("experience") && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{ width: 4, height: 16, backgroundColor: primaryColor, borderRadius: 2, flexShrink: 0 }} />
                <p style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "#111827", margin: 0 }}>{L.experience}</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {experience.map((exp) => (
                  <div key={exp.id} style={{ borderLeft: `3px solid ${primaryColor}`, paddingLeft: 12, paddingBottom: 2 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 2 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 11.5, fontWeight: 700, color: "#111827", margin: "0 0 1px" }}>{exp.position}</p>
                        <p style={{ fontSize: 10, color: "#6b7280", margin: 0, fontWeight: 500 }}>{exp.company}{exp.location ? ` · ${exp.location}` : ""}</p>
                      </div>
                      <span style={{ fontSize: 8.5, color: "#9ca3af", whiteSpace: "nowrap", marginLeft: 8, flexShrink: 0, backgroundColor: "#f3f4f6", padding: "2px 6px", borderRadius: 3 }}>{dateRange(exp.startDate, exp.endDate, exp.current)}</span>
                    </div>
                    {exp.description && (
                      <div style={{ marginTop: 5 }}>
                        {exp.description.split("\n").filter(Boolean).map((line, i) => (
                          <div key={i} style={{ display: "flex", gap: 5, marginBottom: 3 }}>
                            <span style={{ color: primaryColor, fontSize: 8, flexShrink: 0, marginTop: 3, fontWeight: 700 }}>▸</span>
                            <span style={{ fontSize: 10, color: "#374151", lineHeight: 1.6 }}>{line.replace(/^[-•▸]\s*/, "")}</span>
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
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{ width: 4, height: 16, backgroundColor: primaryColor, borderRadius: 2, flexShrink: 0 }} />
                <p style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "#111827", margin: 0 }}>{L.education}</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {education.map((edu) => (
                  <div key={edu.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 11.5, fontWeight: 700, color: "#111827", margin: "0 0 1px" }}>{edu.degree}{edu.field ? ` in ${edu.field}` : ""}</p>
                      <p style={{ fontSize: 10, color: "#6b7280", margin: 0 }}>{edu.institution}</p>
                      {edu.grade && <p style={{ fontSize: 9, color: "#9ca3af", margin: "2px 0 0" }}>Grade: {edu.grade}</p>}
                    </div>
                    <span style={{ fontSize: 8.5, color: "#9ca3af", whiteSpace: "nowrap", marginLeft: 8, flexShrink: 0 }}>{dateRange(edu.startDate, edu.endDate, false)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills as bars */}
          {skills.length > 0 && !hidden("skills") && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{ width: 4, height: 16, backgroundColor: primaryColor, borderRadius: 2, flexShrink: 0 }} />
                <p style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "#111827", margin: 0 }}>{L.skills}</p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 20px" }}>
                {visibleSkills(skills).map((s) => (
                  <div key={s.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 10, color: "#374151", fontWeight: 500 }}>{s.name}</span>
                    </div>
                    <SkillBar level={s.level} color={primaryColor} bgColor="#f3f4f6" width={180} height={4} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interests */}
          {hobbies && !hidden("hobbies") && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{ width: 4, height: 16, backgroundColor: primaryColor, borderRadius: 2, flexShrink: 0 }} />
                <p style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "#111827", margin: 0 }}>{L.interests}</p>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {hobbies.split(/[,\n]+/).filter((h) => h.trim()).map((h, i) => (
                  <span key={i} style={{ fontSize: 9.5, color: "#374151", backgroundColor: "#f9fafb", border: `1px solid ${primaryColor}33`, padding: "3px 10px", borderRadius: 3, fontWeight: 500 }}>{h.trim()}</span>
                ))}
              </div>
            </div>
          )}

          {!summary && experience.length === 0 && education.length === 0 && (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#d1d5db", fontSize: 13 }}>
              {lang === "sw" ? "Jaza fomu ili uone onyesho la CV yako" : "Fill in the form to preview your CV"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
