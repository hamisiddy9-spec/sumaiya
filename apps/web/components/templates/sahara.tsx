import {
  fmtDate, dateRange,
} from "@/components/templates/template-utils";
import { visibleSkills } from "@/components/templates/template-utils";
import type { CVData } from "@/components/templates/template-utils";
import type { Lang } from "@/lib/i18n/translations";
import { cvHeadings } from "@/lib/i18n/cv-headings";

// Ultra-minimal typographic section header — no bold, just letterspace + left accent
function SectionHeader({ title, primaryColor }: { title: string; primaryColor: string }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "stretch",
      gap: 10,
      marginBottom: 16,
    }}>
      <div style={{ width: 2, backgroundColor: primaryColor, borderRadius: 1, flexShrink: 0 }} />
      <p style={{
        fontSize: 9.5,
        fontWeight: 400,
        textTransform: "uppercase" as const,
        letterSpacing: "0.28em",
        color: "#9ca3af",
        margin: 0,
        alignSelf: "center",
      }}>
        {title}
      </p>
    </div>
  );
}

export function SaharaTemplate({
  data, primaryColor, fontFamily, lang = "en",
}: {
  data: CVData; primaryColor: string; fontFamily: string; lang?: Lang;
}) {
  const L = cvHeadings(lang);
  const {
    personal, summary, experience, education,
    skills, languages, certifications, referees, hobbies,
    hiddenSections = [],
  } = data;

  const show = (key: string) => !hiddenSections.includes(key);

  // Build contact items as text-only pairs for inline display
  const contactItems: { text: string; key: string }[] = [
    personal.email ? { text: personal.email, key: "email" } : null,
    personal.phone ? { text: personal.phone, key: "phone" } : null,
    personal.location ? { text: personal.location, key: "location" } : null,
    personal.linkedin ? { text: personal.linkedin, key: "linkedin" } : null,
    personal.website ? { text: personal.website, key: "website" } : null,
  ].filter((x): x is { text: string; key: string } => x !== null);

  return (
    <div style={{
      width: 794,
      minHeight: 1123,
      backgroundColor: "#fff",
      fontFamily,
      boxSizing: "border-box" as const,
      padding: "80px 90px",
      display: "flex",
      flexDirection: "column",
    }}>

      {/* ── TYPOGRAPHIC HEADER ─────────────────────────────────────────── */}
      <div style={{ marginBottom: 44, textAlign: "center" as const }}>

        {/* Name — ultra light, huge letter-spacing */}
        <p style={{
          fontSize: 42,
          fontWeight: 300,
          color: "#111827",
          letterSpacing: "8px",
          margin: "0 0 12px",
          lineHeight: 1.1,
          textTransform: "uppercase" as const,
        }}>
          {personal.fullName}
        </p>

        {/* Thin decorative line between name and title */}
        <div style={{
          width: 40,
          height: 1,
          backgroundColor: "#111827",
          margin: "0 auto 12px",
        }} />

        {/* Job title */}
        <p style={{
          fontSize: 10,
          fontWeight: 400,
          color: "#9ca3af",
          letterSpacing: "6px",
          textTransform: "uppercase" as const,
          margin: "0 0 20px",
        }}>
          {personal.jobTitle}
        </p>

        {/* Contact — inline with · separators */}
        {contactItems.length > 0 && (
          <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexWrap: "wrap" as const,
            gap: "4px 0",
          }}>
            {contactItems.map((item, i) => (
              <span key={item.key} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                {i > 0 && (
                  <span style={{ color: "#d1d5db", fontSize: 9, margin: "0 8px" }}>·</span>
                )}
                <span style={{ fontSize: 9, color: "#6b7280", letterSpacing: "0.03em" }}>{item.text}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── BODY ─────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 32, flex: 1 }}>

        {/* Summary */}
        {show("summary") && summary && (
          <div>
            <SectionHeader title={L.summary} primaryColor={primaryColor} />
            <p style={{
              fontSize: 10.5,
              color: "#374151",
              lineHeight: 1.95,
              margin: 0,
              textAlign: "justify" as const,
            }}>
              {summary}
            </p>
          </div>
        )}

        {/* Experience */}
        {show("experience") && experience.length > 0 && (
          <div>
            <SectionHeader title={L.experience} primaryColor={primaryColor} />
            <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              {experience.map((exp) => (
                <div key={exp.id}>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    marginBottom: 3,
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 11.5, fontWeight: 600, color: "#111827", letterSpacing: "0.01em" }}>
                        {exp.position}
                      </span>
                      {exp.company && (
                        <span style={{ fontSize: 10.5, color: "#9ca3af", fontWeight: 300 }}>
                          {"  ·  "}{exp.company}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 9, color: "#c4c9d4", flexShrink: 0, marginLeft: 16, letterSpacing: "0.04em" }}>
                      {dateRange(exp.startDate, exp.endDate, exp.current)}
                    </span>
                  </div>
                  {exp.location && (
                    <p style={{ fontSize: 9.5, color: "#9ca3af", margin: "0 0 6px", letterSpacing: "0.02em" }}>
                      {exp.location}
                    </p>
                  )}
                  {exp.description && (
                    <p style={{
                      fontSize: 10.5,
                      color: "#374151",
                      lineHeight: 1.9,
                      margin: 0,
                    }}>
                      {exp.description.split("\n").filter(Boolean).map((line) => line.replace(/^[-•▸]\s*/, "")).join("  ·  ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {show("education") && education.length > 0 && (
          <div>
            <SectionHeader title={L.education} primaryColor={primaryColor} />
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {education.map((edu) => (
                <div key={edu.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#111827" }}>
                        {edu.degree}{edu.field ? ` in ${edu.field}` : ""}
                      </span>
                      {edu.institution && (
                        <span style={{ fontSize: 10.5, color: "#9ca3af", fontWeight: 300 }}>
                          {"  ·  "}{edu.institution}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 9, color: "#c4c9d4", flexShrink: 0, marginLeft: 16 }}>
                      {dateRange(edu.startDate, edu.endDate, false)}
                    </span>
                  </div>
                  {edu.grade && (
                    <p style={{ fontSize: 9.5, color: "#9ca3af", margin: 0 }}>Grade: {edu.grade}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills — horizontal flat list, no bars */}
        {show("skills") && skills.length > 0 && (
          <div>
            <SectionHeader title={L.skills} primaryColor={primaryColor} />
            <p style={{ fontSize: 10.5, color: "#374151", lineHeight: 1.9, margin: 0, letterSpacing: "0.01em" }}>
              {visibleSkills(skills).map((sk, i) => (
                <span key={sk.id}>
                  {i > 0 && <span style={{ color: "#d1d5db" }}>  ·  </span>}
                  <span style={{
                    color: sk.level >= 4 ? "#0f172a" : "#6b7280",
                    fontWeight: sk.level >= 4 ? 500 : 400,
                  }}>
                    {sk.name}
                  </span>
                </span>
              ))}
            </p>
          </div>
        )}

        {/* Languages */}
        {show("languages") && languages.length > 0 && (
          <div>
            <SectionHeader title={L.languages} primaryColor={primaryColor} />
            <p style={{ fontSize: 10.5, color: "#374151", lineHeight: 1.9, margin: 0 }}>
              {languages.map((lang, i) => (
                <span key={lang.id}>
                  {i > 0 && <span style={{ color: "#d1d5db" }}>  ·  </span>}
                  {lang.name}
                  <span style={{ color: "#9ca3af", fontSize: 9.5 }}> ({lang.proficiency})</span>
                </span>
              ))}
            </p>
          </div>
        )}

        {/* Certifications */}
        {show("certifications") && certifications.length > 0 && (
          <div>
            <SectionHeader title={L.certifications} primaryColor={primaryColor} />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {certifications.map((cert) => (
                <div key={cert.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 10.5, fontWeight: 500, color: "#374151" }}>{cert.name}</span>
                    {cert.issuer && (
                      <span style={{ fontSize: 9.5, color: "#9ca3af", fontWeight: 300 }}>{"  ·  "}{cert.issuer}</span>
                    )}
                  </div>
                  <span style={{ fontSize: 9, color: "#c4c9d4", flexShrink: 0, marginLeft: 16 }}>
                    {fmtDate(cert.date)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Referees */}
        {show("referees") && referees.length > 0 && (
          <div>
            <SectionHeader title={L.referees} primaryColor={primaryColor} />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {referees.map((ref) => (
                <div key={ref.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 10.5, fontWeight: 500, color: "#374151" }}>{ref.name}</span>
                      {(ref.title || ref.company) && (
                        <span style={{ fontSize: 9.5, color: "#9ca3af", fontWeight: 300 }}>
                          {"  ·  "}{ref.title}{ref.company ? ` at ${ref.company}` : ""}
                        </span>
                      )}
                    </div>
                  </div>
                  {(ref.email || ref.phone) && (
                    <p style={{ fontSize: 9, color: "#c4c9d4", margin: "2px 0 0" }}>
                      {ref.email}{ref.phone ? ` · ${ref.phone}` : ""}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Interests */}
        {show("hobbies") && hobbies && (
          <div>
            <SectionHeader title={L.interests} primaryColor={primaryColor} />
            <p style={{
              fontSize: 10.5,
              color: "#6b7280",
              lineHeight: 1.9,
              margin: 0,
              fontStyle: "italic",
              letterSpacing: "0.02em",
            }}>
              {hobbies}
            </p>
          </div>
        )}

        {/* Empty state */}
        {!summary && experience.length === 0 && education.length === 0 && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#d1d5db", fontSize: 13 }}>
            {lang === "sw" ? "Jaza fomu ili uone onyesho la CV yako" : "Fill in the form to preview your CV"}
          </div>
        )}
      </div>
    </div>
  );
}
