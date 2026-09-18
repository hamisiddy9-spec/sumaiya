import {
  fmtDate, dateRange,
} from "@/components/templates/template-utils";
import { visibleSkills } from "@/components/templates/template-utils";
import type { CVData } from "@/components/templates/template-utils";
import { cvHeadings } from "@/lib/i18n/cv-headings";
import type { Lang } from "@/lib/i18n/translations";

export function BerlinTemplate({
  data,
  primaryColor,
  fontFamily,
  lang = "en",
}: {
  data: CVData;
  primaryColor: string;
  fontFamily: string;
  lang?: Lang;
}) {
  const L = cvHeadings(lang);
  const {
    personal, summary, experience, education,
    skills, languages, certifications, referees, hobbies,
    hiddenSections = [],
  } = data;

  const show = (key: string) => !hiddenSections.includes(key);

  function SectionLabel({ title }: { title: string }) {
    return (
      <div style={{
        fontSize: 9,
        fontWeight: 700,
        textTransform: "uppercase" as const,
        letterSpacing: "0.22em",
        color: primaryColor,
        borderTop: `1px solid ${primaryColor}`,
        paddingTop: 5,
        marginBottom: 10,
      }}>
        {title}
      </div>
    );
  }

  const contactParts: string[] = [];
  if (personal.email) contactParts.push(personal.email);
  if (personal.phone) contactParts.push(personal.phone);
  if (personal.location) contactParts.push(personal.location);
  if (personal.linkedin) contactParts.push(personal.linkedin);
  if (personal.website) contactParts.push(personal.website);

  return (
    <div style={{
      width: 794,
      minHeight: 1123,
      fontFamily,
      backgroundColor: "#fff",
      display: "flex",
      flexDirection: "column",
      padding: "36px 44px",
      boxSizing: "border-box",
      color: "#111827",
    }}>

      {/* ── Name ── */}
      <div style={{
        fontSize: 24,
        fontWeight: 900,
        color: "#111827",
        textTransform: "uppercase" as const,
        letterSpacing: "0.1em",
        lineHeight: 1.1,
        marginBottom: 4,
      }}>
        {personal.fullName}
      </div>

      {/* Job title */}
      <div style={{
        fontSize: 10.5,
        color: "#6b7280",
        fontWeight: 400,
        letterSpacing: "0.06em",
        marginBottom: 10,
      }}>
        {personal.jobTitle}
      </div>

      {/* Single horizontal rule */}
      <div style={{ borderTop: `2px solid #111827`, marginBottom: 8 }} />

      {/* Contact row — pipe-separated */}
      {contactParts.length > 0 && (
        <div style={{
          fontSize: 9,
          color: "#6b7280",
          letterSpacing: "0.03em",
          marginBottom: 18,
          lineHeight: 1.4,
        }}>
          {contactParts.join("  |  ")}
        </div>
      )}

      {/* ── Body: sections in tight single-column-ish layout ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16, flex: 1 }}>

        {/* Summary */}
        {show("summary") && summary && (
          <div>
            <SectionLabel title={L.profile} />
            <p style={{ fontSize: 10, color: "#374151", lineHeight: 1.75, margin: 0 }}>
              {summary}
            </p>
          </div>
        )}

        {/* Experience */}
        {show("experience") && experience.length > 0 && (
          <div>
            <SectionLabel title={L.experience} />
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {experience.map((exp) => (
                <div key={exp.id} style={{ display: "flex", gap: 0 }}>
                  {/* Date column — right-aligned, fixed width */}
                  <div style={{
                    width: 110,
                    flexShrink: 0,
                    textAlign: "right" as const,
                    paddingRight: 16,
                  }}>
                    <div style={{ fontSize: 9, color: "#9ca3af", lineHeight: 1.4, marginTop: 1 }}>
                      {dateRange(exp.startDate, exp.endDate, exp.current)}
                    </div>
                  </div>
                  {/* Content */}
                  <div style={{ flex: 1, borderLeft: `1px solid #e5e7eb`, paddingLeft: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#111827", lineHeight: 1.25 }}>
                      {exp.position}
                    </div>
                    <div style={{ fontSize: 9.5, color: "#6b7280", marginTop: 1, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>
                      {exp.company}{exp.location ? ` · ${exp.location}` : ""}
                    </div>
                    {exp.description && (
                      <div style={{ marginTop: 4 }}>
                        {exp.description.split("\n").filter(Boolean).map((line, i) => (
                          <div key={i} style={{ display: "flex", gap: 5, marginBottom: 2 }}>
                            <span style={{ color: "#9ca3af", fontSize: 8.5, flexShrink: 0, marginTop: 2 }}>–</span>
                            <span style={{ fontSize: 9.5, color: "#4b5563", lineHeight: 1.6 }}>
                              {line.replace(/^[-•▸]\s*/, "")}
                            </span>
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
        {show("education") && education.length > 0 && (
          <div>
            <SectionLabel title={L.education} />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {education.map((edu) => (
                <div key={edu.id} style={{ display: "flex", gap: 0 }}>
                  <div style={{
                    width: 110,
                    flexShrink: 0,
                    textAlign: "right" as const,
                    paddingRight: 16,
                  }}>
                    <div style={{ fontSize: 9, color: "#9ca3af", lineHeight: 1.4, marginTop: 1 }}>
                      {fmtDate(edu.startDate)}{edu.startDate && edu.endDate ? " – " : ""}{fmtDate(edu.endDate)}
                    </div>
                  </div>
                  <div style={{ flex: 1, borderLeft: `1px solid #e5e7eb`, paddingLeft: 14 }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: "#111827", lineHeight: 1.25 }}>
                      {edu.degree}{edu.field ? ` in ${edu.field}` : ""}
                    </div>
                    <div style={{ fontSize: 9.5, color: "#6b7280", marginTop: 1, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>
                      {edu.institution}
                    </div>
                    {edu.grade && (
                      <div style={{ fontSize: 9, color: "#9ca3af", marginTop: 1 }}>Grade: {edu.grade}</div>
                    )}
                    {edu.description && (
                      <div style={{ fontSize: 9.5, color: "#6b7280", lineHeight: 1.6, marginTop: 2 }}>{edu.description}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills — comma-separated text */}
        {show("skills") && skills.length > 0 && (
          <div>
            <SectionLabel title={L.skills} />
            <p style={{ fontSize: 10, color: "#374151", lineHeight: 1.7, margin: 0 }}>
              {visibleSkills(skills).map((skill, i) => (
                <span key={skill.id}>
                  {i > 0 && <span style={{ color: "#d1d5db" }}>,  </span>}
                  <span style={{ fontWeight: skill.level >= 4 ? 700 : 400 }}>{skill.name}</span>
                </span>
              ))}
            </p>
          </div>
        )}

        {/* Two-column: Languages + Certifications */}
        {(show("languages") && languages.length > 0) || (show("certifications") && certifications.length > 0) ? (
          <div style={{ display: "flex", gap: 28 }}>
            {show("languages") && languages.length > 0 && (
              <div style={{ flex: 1 }}>
                <SectionLabel title={L.languages} />
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {languages.map((lang) => (
                    <div key={lang.id} style={{ fontSize: 10, color: "#374151" }}>
                      <span style={{ fontWeight: 700 }}>{lang.name}</span>
                      <span style={{ color: "#9ca3af", fontSize: 9 }}> — {lang.proficiency}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {show("certifications") && certifications.length > 0 && (
              <div style={{ flex: 1 }}>
                <SectionLabel title={L.certifications} />
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {certifications.map((cert) => (
                    <div key={cert.id}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#111827", lineHeight: 1.3 }}>{cert.name}</div>
                      {cert.issuer && (
                        <div style={{ fontSize: 9, color: "#6b7280" }}>{cert.issuer}{cert.date ? `, ${fmtDate(cert.date)}` : ""}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* Referees */}
        {show("referees") && referees.length > 0 && (
          <div>
            <SectionLabel title="Referees / Wadhamini" />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {referees.map((ref) => (
                <div key={ref.id}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#111827", lineHeight: 1.3 }}>{ref.name}</div>
                  {(ref.title || ref.company) && (
                    <div style={{ fontSize: 9, color: "#6b7280" }}>{[ref.title, ref.company].filter(Boolean).join(" — ")}</div>
                  )}
                  {(ref.email || ref.phone) && (
                    <div style={{ fontSize: 9, color: "#9ca3af", marginTop: 1 }}>{[ref.email, ref.phone].filter(Boolean).join(" · ")}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hobbies */}
        {show("hobbies") && hobbies && (
          <div>
            <SectionLabel title={L.interests} />
            <p style={{ fontSize: 10, color: "#6b7280", lineHeight: 1.7, margin: 0 }}>
              {hobbies.split(/[,\n]+/).filter((h) => h.trim()).join("  ·  ")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
