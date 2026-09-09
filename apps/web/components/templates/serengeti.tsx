import {
  IcoEmail, IcoPhone, IcoPin, IcoLinkedIn, IcoGlobe,
  PhotoCircle, ContactItem,
  fmtDate, dateRange,
  type CVData,
  visibleSkills,
} from "@/components/templates/template-utils";
import type { Lang } from "@/lib/i18n/translations";

const PROF: Record<string, number> = { Native: 5, Fluent: 4, Advanced: 3, Intermediate: 2, Basic: 1 };

function SectionHeader({ text, primaryColor }: { text: string; primaryColor: string }) {
  return (
    <p style={{
      fontSize: 11,
      fontWeight: 700,
      textTransform: "uppercase" as const,
      letterSpacing: "0.1em",
      color: primaryColor,
      margin: "0 0 12px",
    }}>
      {text}
    </p>
  );
}

export function SerengetiTemplate({ data, primaryColor, fontFamily, lang = "en" }: { data: CVData; primaryColor: string; fontFamily: string; lang?: Lang }) {
  const { personal, summary, experience, education, skills, languages, certifications, referees, hobbies } = data;
  const hidden = (k: string) => data.hiddenSections?.includes(k) ?? false;

  return (
    <div style={{
      width: 794,
      minHeight: 1123,
      fontFamily,
      backgroundColor: "#fff",
      padding: "44px 52px",
      boxSizing: "border-box" as const,
    }}>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 10 }}>
          {/* Optional small photo left of name */}
          {personal.photo && (
            <PhotoCircle
              url={personal.photo}
              name={personal.fullName || "CV"}
              size={48}
              bgColor={primaryColor}
              borderColor={primaryColor + "30"}
              borderWidth={2}
            />
          )}
          <div>
            <div style={{
              fontSize: 26,
              fontWeight: 600,
              color: "#111827",
              margin: "0 0 3px",
              letterSpacing: "-0.01em",
              lineHeight: 1.15,
            }}>
              {personal.fullName}
            </div>
            <p style={{ fontSize: 13, color: primaryColor, margin: 0, fontWeight: 500 }}>
              {personal.jobTitle}
            </p>
          </div>
        </div>

        {/* Contact row */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 14, marginBottom: 14 }}>
          {personal.email && (
            <ContactItem
              icon={<IcoEmail size={10} color="#9ca3af" />}
              text={personal.email}
              color="#6b7280"
              fontSize={10}
            />
          )}
          {personal.phone && (
            <ContactItem
              icon={<IcoPhone size={10} color="#9ca3af" />}
              text={personal.phone}
              color="#6b7280"
              fontSize={10}
            />
          )}
          {personal.location && (
            <ContactItem
              icon={<IcoPin size={10} color="#9ca3af" />}
              text={personal.location}
              color="#6b7280"
              fontSize={10}
            />
          )}
          {personal.linkedin && (
            <ContactItem
              icon={<IcoLinkedIn size={10} color="#9ca3af" />}
              text={personal.linkedin}
              color="#6b7280"
              fontSize={10}
            />
          )}
          {personal.website && (
            <ContactItem
              icon={<IcoGlobe size={10} color="#9ca3af" />}
              text={personal.website}
              color="#6b7280"
              fontSize={10}
            />
          )}
        </div>

        {/* Divider */}
        <div style={{ height: 1, backgroundColor: "#e5e7eb" }} />
      </div>

      {/* ── Summary ──────────────────────────────────────────────────────── */}
      {summary && !hidden("summary") && (
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 10.5, color: "#4b5563", lineHeight: 1.8, margin: 0 }}>{summary}</p>
        </div>
      )}

      {/* ── Experience ───────────────────────────────────────────────────── */}
      {experience.length > 0 && !hidden("experience") && (
        <div style={{ marginBottom: 24 }}>
          <SectionHeader text="Experience" primaryColor={primaryColor} />
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {experience.map((exp) => (
              <div key={exp.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "#111827", margin: 0, flex: 1, minWidth: 0 }}>
                    {exp.position}
                    {exp.company && (
                      <span style={{ color: "#6b7280", fontWeight: 400 }}> — {exp.company}</span>
                    )}
                    {exp.location && (
                      <span style={{ color: "#9ca3af", fontWeight: 400, fontSize: 10.5 }}> · {exp.location}</span>
                    )}
                  </p>
                  <span style={{ fontSize: 10, color: "#9ca3af", whiteSpace: "nowrap", marginLeft: 12, flexShrink: 0 }}>
                    {dateRange(exp.startDate, exp.endDate, exp.current)}
                  </span>
                </div>
                {exp.description && (
                  <div style={{ marginTop: 4 }}>
                    {exp.description.split("\n").filter(Boolean).map((line, i) => (
                      <div key={i} style={{ display: "flex", gap: 5, marginBottom: 3 }}>
                        <span style={{ color: primaryColor, fontSize: 9, flexShrink: 0, marginTop: 1.5 }}>▸</span>
                        <span style={{ fontSize: 10.5, color: "#475569", lineHeight: 1.65 }}>{line.replace(/^[-•▸]\s*/, "")}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Education ────────────────────────────────────────────────────── */}
      {education.length > 0 && !hidden("education") && (
        <div style={{ marginBottom: 24 }}>
          <SectionHeader text="Education" primaryColor={primaryColor} />
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {education.map((edu) => (
              <div key={edu.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "#111827", margin: 0, flex: 1, minWidth: 0 }}>
                    {edu.degree}{edu.field ? ` in ${edu.field}` : ""}
                    {edu.institution && (
                      <span style={{ color: "#6b7280", fontWeight: 400 }}> — {edu.institution}</span>
                    )}
                  </p>
                  <span style={{ fontSize: 10, color: "#9ca3af", whiteSpace: "nowrap", marginLeft: 12, flexShrink: 0 }}>
                    {dateRange(edu.startDate, edu.endDate, false)}
                  </span>
                </div>
                {edu.grade && <p style={{ fontSize: 10, color: "#9ca3af", margin: "2px 0 0" }}>Grade: {edu.grade}</p>}
                {edu.description && <p style={{ fontSize: 10, color: "#6b7280", margin: "3px 0 0", lineHeight: 1.6 }}>{edu.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Skills ───────────────────────────────────────────────────────── */}
      {skills.length > 0 && !hidden("skills") && (
        <div style={{ marginBottom: 24 }}>
          <SectionHeader text="Skills" primaryColor={primaryColor} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {visibleSkills(skills).map((skill) => (
              <span key={skill.id} style={{
                fontSize: 10,
                color: primaryColor,
                backgroundColor: primaryColor + "15",
                padding: "4px 12px",
                borderRadius: 99,
                fontWeight: 500,
              }}>
                {skill.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Languages ────────────────────────────────────────────────────── */}
      {languages.length > 0 && !hidden("languages") && (
        <div style={{ marginBottom: 24 }}>
          <SectionHeader text="Languages" primaryColor={primaryColor} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {languages.map((lang) => (
              <span key={lang.id} style={{
                fontSize: 10,
                color: primaryColor,
                backgroundColor: primaryColor + "15",
                padding: "4px 12px",
                borderRadius: 99,
                fontWeight: 500,
              }}>
                {lang.name} ({lang.proficiency})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Certifications ───────────────────────────────────────────────── */}
      {certifications.length > 0 && !hidden("certifications") && (
        <div style={{ marginBottom: 24 }}>
          <SectionHeader text="Certifications" primaryColor={primaryColor} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {certifications.map((cert) => (
              <div key={cert.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 11.5, fontWeight: 600, color: "#0f172a", margin: "0 0 1px" }}>{cert.name}</p>
                  {cert.issuer && <p style={{ fontSize: 10, color: "#6b7280", margin: 0 }}>{cert.issuer}</p>}
                </div>
                {cert.date && (
                  <span style={{ fontSize: 10, color: "#9ca3af", whiteSpace: "nowrap", marginLeft: 10, flexShrink: 0 }}>
                    {fmtDate(cert.date) || cert.date}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Referees ─────────────────────────────────────────────────────── */}
      {referees.length > 0 && !hidden("referees") && (
        <div style={{ marginBottom: 24 }}>
          <SectionHeader text="Referees" primaryColor={primaryColor} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {referees.map((ref) => (
              <div key={ref.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 11.5, fontWeight: 600, color: "#0f172a", margin: "0 0 1px" }}>{ref.name}</p>
                  {(ref.title || ref.company) && (
                    <p style={{ fontSize: 10, color: "#6b7280", margin: 0 }}>
                      {ref.title}{ref.company ? ` — ${ref.company}` : ""}
                    </p>
                  )}
                  {(ref.email || ref.phone) && (
                    <p style={{ fontSize: 10, color: "#9ca3af", margin: 0 }}>
                      {ref.email}{ref.phone ? ` · ${ref.phone}` : ""}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Interests ────────────────────────────────────────────────────── */}
      {hobbies && !hidden("hobbies") && (
        <div style={{ marginBottom: 24 }}>
          <SectionHeader text="Interests" primaryColor={primaryColor} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {hobbies.split(/[,\n]+/).filter((h) => h.trim()).map((h, i) => (
              <span key={i} style={{
                fontSize: 10,
                color: "#475569",
                backgroundColor: "#f1f5f9",
                padding: "3px 11px",
                borderRadius: 99,
              }}>
                {h.trim()}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!summary && experience.length === 0 && education.length === 0 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#d1d5db", fontSize: 13, padding: "60px 0" }}>
          {lang === "sw" ? "Jaza fomu ili uone onyesho la CV yako" : "Fill in the form to preview your CV"}
        </div>
      )}
    </div>
  );
}
