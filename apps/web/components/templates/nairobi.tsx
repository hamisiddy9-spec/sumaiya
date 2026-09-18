import {
  IcoEmail, IcoPhone, IcoPin, IcoLinkedIn, IcoGlobe,
  PhotoCircle, SkillDots, ContactItem,
  fmtDate, dateRange,
} from "@/components/templates/template-utils";
import { visibleSkills } from "@/components/templates/template-utils";
import type { CVData } from "@/components/templates/template-utils";
import type { Lang } from "@/lib/i18n/translations";
import { cvHeadings } from "@/lib/i18n/cv-headings";

const PROF: Record<string, number> = { Native: 5, Fluent: 4, Advanced: 3, Intermediate: 2, Basic: 1 };

export function NairobiTemplate({ data, primaryColor, fontFamily, lang = "en" }: { data: CVData; primaryColor: string; fontFamily: string; lang?: Lang }) {
  const L = cvHeadings(lang);
  const { personal, summary, experience, education, skills, languages, certifications, referees, hobbies } = data;
  const hidden = data.hiddenSections ?? [];

  function SectionHeader({ title }: { title: string }) {
    return (
      <div style={{
        fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const,
        letterSpacing: "0.08em", color: primaryColor,
        paddingBottom: 4, marginBottom: 10,
        borderBottom: "2px solid #e2e8f0",
      }}>
        {title}
      </div>
    );
  }

  return (
    <div style={{ width: 794, minHeight: 1123, fontFamily, backgroundColor: "#fff", display: "flex", flexDirection: "column" }}>

      {/* ── Header band ── */}
      <div style={{
        backgroundColor: primaryColor,
        padding: "28px 36px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexShrink: 0,
      }}>
        <div style={{ flex: 1, marginRight: 20 }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#fff", lineHeight: 1.2, marginBottom: 4 }}>
            {personal.fullName}
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginBottom: 12, fontWeight: 400 }}>
            {personal.jobTitle}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 14, alignItems: "center" }}>
            {personal.email && (
              <ContactItem icon={<IcoEmail size={10} color="rgba(255,255,255,0.6)" />} text={personal.email} color="rgba(255,255,255,0.85)" fontSize={10} />
            )}
            {personal.phone && (
              <ContactItem icon={<IcoPhone size={10} color="rgba(255,255,255,0.6)" />} text={personal.phone} color="rgba(255,255,255,0.85)" fontSize={10} />
            )}
            {personal.location && (
              <ContactItem icon={<IcoPin size={10} color="rgba(255,255,255,0.6)" />} text={personal.location} color="rgba(255,255,255,0.85)" fontSize={10} />
            )}
            {personal.linkedin && (
              <ContactItem icon={<IcoLinkedIn size={10} color="rgba(255,255,255,0.6)" />} text={personal.linkedin} color="rgba(255,255,255,0.85)" fontSize={10} />
            )}
            {personal.website && (
              <ContactItem icon={<IcoGlobe size={10} color="rgba(255,255,255,0.6)" />} text={personal.website} color="rgba(255,255,255,0.85)" fontSize={10} />
            )}
          </div>
        </div>
        <PhotoCircle
          url={personal.photo}
          name={personal.fullName || "CV"}
          size={78}
          bgColor={primaryColor + "cc"}
          borderColor="rgba(255,255,255,0.5)"
          borderWidth={2}
        />
      </div>

      {/* ── Body: two columns ── */}
      <div style={{ display: "flex", flex: 1 }}>

        {/* Left main column */}
        <div style={{ flex: 1, padding: "24px 24px 24px 36px", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Summary */}
          {!hidden.includes("summary") && summary && (
            <div style={{
              fontSize: 10.5, color: "#4b5563", lineHeight: 1.75, fontStyle: "italic" as const,
              paddingLeft: 10, borderLeft: `3px solid ${primaryColor}`,
              marginBottom: 4,
            }}>
              {summary}
            </div>
          )}

          {/* Experience */}
          {!hidden.includes("experience") && experience.length > 0 && (
            <div>
              <SectionHeader title={L.experience} />
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {experience.map((exp) => (
                  <div key={exp.id} style={{ display: "flex", gap: 10 }}>
                    <div style={{ paddingTop: 3, flexShrink: 0 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: primaryColor }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#111827", lineHeight: 1.3 }}>
                            {exp.position}
                          </div>
                          <div style={{ fontSize: 10.5, color: "#64748b", marginTop: 1 }}>
                            {exp.company}{exp.location ? ` · ${exp.location}` : ""}
                          </div>
                        </div>
                        <div style={{ fontSize: 10, color: "#94a3b8", whiteSpace: "nowrap" as const, flexShrink: 0, marginTop: 1 }}>
                          {dateRange(exp.startDate, exp.endDate, exp.current)}
                        </div>
                      </div>
                      {exp.description && (
                        <div style={{ marginTop: 5 }}>
                          {exp.description.split("\n").filter(Boolean).map((line, i) => (
                            <div key={i} style={{ display: "flex", gap: 5, marginBottom: 3 }}>
                              <span style={{ color: primaryColor, fontSize: 9, flexShrink: 0, marginTop: 1.5 }}>▸</span>
                              <span style={{ fontSize: 10.5, color: "#475569", lineHeight: 1.65 }}>{line.replace(/^[-•▸]\s*/, "")}</span>
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
          {!hidden.includes("education") && education.length > 0 && (
            <div>
              <SectionHeader title={L.education} />
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {education.map((edu) => (
                  <div key={edu.id} style={{ display: "flex", gap: 10 }}>
                    <div style={{ paddingTop: 3, flexShrink: 0 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: primaryColor }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#111827", lineHeight: 1.3 }}>
                            {edu.degree}{edu.field ? ` in ${edu.field}` : ""}
                          </div>
                          <div style={{ fontSize: 10.5, color: "#64748b", marginTop: 1 }}>{edu.institution}</div>
                          {edu.grade && (
                            <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>Grade: {edu.grade}</div>
                          )}
                        </div>
                        <div style={{ fontSize: 10, color: "#94a3b8", whiteSpace: "nowrap" as const, flexShrink: 0, marginTop: 1 }}>
                          {fmtDate(edu.startDate)}{edu.startDate && edu.endDate ? " – " : ""}{fmtDate(edu.endDate)}
                        </div>
                      </div>
                      {edu.description && (
                        <div style={{ fontSize: 10.5, color: "#475569", lineHeight: 1.65, marginTop: 4 }}>{edu.description}</div>
                      )}
                    </div>
                  </div>
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

        {/* Right sidebar */}
        <div style={{ width: 210, padding: "24px 36px 24px 0", display: "flex", flexDirection: "column", gap: 20, flexShrink: 0 }}>

          {/* Skills */}
          {!hidden.includes("skills") && skills.length > 0 && (
            <div>
              <SectionHeader title={L.skills} />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {visibleSkills(skills).map((skill) => (
                  <div key={skill.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 10, color: "#374151", lineHeight: 1.4 }}>{skill.name}</span>
                    <SkillDots level={skill.level} color={primaryColor} emptyColor="#e5e7eb" size={6} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {!hidden.includes("languages") && languages.length > 0 && (
            <div>
              <SectionHeader title={L.languages} />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {languages.map((lang) => (
                  <div key={lang.id}>
                    <div style={{ fontSize: 10, color: "#374151", fontWeight: 500, marginBottom: 1 }}>{lang.name}</div>
                    <div style={{ fontSize: 9, color: "#9ca3af" }}>{lang.proficiency}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {!hidden.includes("certifications") && certifications.length > 0 && (
            <div>
              <SectionHeader title={L.certifications} />
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {certifications.map((cert) => (
                  <div key={cert.id}>
                    <div style={{ fontSize: 10.5, fontWeight: 600, color: "#111827", lineHeight: 1.35 }}>{cert.name}</div>
                    {cert.issuer && <div style={{ fontSize: 9.5, color: "#64748b", marginTop: 1 }}>{cert.issuer}</div>}
                    {cert.date && <div style={{ fontSize: 9, color: "#9ca3af", marginTop: 1 }}>{fmtDate(cert.date)}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Referees */}
          {!hidden.includes("referees") && referees.length > 0 && (
            <div>
              <SectionHeader title="Referees / Wadhamini" />
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {referees.map((ref) => (
                  <div key={ref.id}>
                    <div style={{ fontSize: 10.5, fontWeight: 600, color: "#111827", lineHeight: 1.35 }}>{ref.name}</div>
                    {(ref.title || ref.company) && (
                      <div style={{ fontSize: 9.5, color: "#64748b", marginTop: 1 }}>
                        {[ref.title, ref.company].filter(Boolean).join(" — ")}
                      </div>
                    )}
                    {(ref.email || ref.phone) && (
                      <div style={{ fontSize: 9, color: "#9ca3af", marginTop: 1 }}>
                        {[ref.email, ref.phone].filter(Boolean).join(" · ")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interests */}
          {!hidden.includes("hobbies") && hobbies && (
            <div>
              <SectionHeader title={L.interests} />
              <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 5 }}>
                {hobbies.split(/[,\n]+/).filter((h) => h.trim()).map((h, i) => (
                  <span key={i} style={{
                    fontSize: 9.5, color: "#475569",
                    backgroundColor: "#f1f5f9",
                    padding: "3px 8px", borderRadius: 10,
                  }}>
                    {h.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
