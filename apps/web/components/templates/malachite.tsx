import React from "react";
import {
  IcoEmail, IcoPhone, IcoPin, IcoLinkedIn, IcoGlobe,
  PhotoCircle, fmtDate, dateRange, CVData,
  visibleSkills,
} from "@/components/templates/template-utils";
import type { Lang } from "@/lib/i18n/translations";

interface Props {
  data: CVData;
  primaryColor: string;
  fontFamily: string;
  lang?: Lang;
}

/**
 * Malachite — clean two-column with the name and a ring-framed portrait up top,
 * then a wide main column (experience, education) beside a rail of accent skill
 * chips, languages and interests. Skills-as-chips is the signature — the tidy,
 * tag-forward look people associate with modern résumé builders.
 */
export function MalachiteTemplate({ data, primaryColor, fontFamily, lang = "en" }: Props) {
  const { personal, summary, experience, education, skills, languages, certifications, referees, hobbies } = data;
  const hidden = (k: string) => data.hiddenSections?.includes(k) ?? false;
  const sw = lang === "sw";
  const body = fontFamily || "'Inter', 'Helvetica Neue', Arial, sans-serif";

  const Head = ({ children }: { children: React.ReactNode }) => (
    <div style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase", color: primaryColor, marginBottom: 12 }}>{children}</div>
  );
  const Chip = ({ children }: { children: React.ReactNode }) => (
    <span style={{ fontSize: 10, color: primaryColor, background: `${primaryColor}14`, border: `1px solid ${primaryColor}3a`, borderRadius: 20, padding: "4px 10px", display: "inline-block" }}>{children}</span>
  );

  return (
    <div style={{ width: 794, minHeight: 1123, backgroundColor: "#ffffff", fontFamily: body, color: "#1f2937", padding: "34px 40px", boxSizing: "border-box" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, paddingBottom: 18, borderBottom: `2px solid ${primaryColor}` }}>
        <div>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#111827", margin: 0, letterSpacing: "-0.01em", lineHeight: 1.05 }}>{personal.fullName}</div>
          {personal.jobTitle && <div style={{ fontSize: 14, color: primaryColor, fontWeight: 600, marginTop: 4 }}>{personal.jobTitle}</div>}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px", marginTop: 10 }}>
            {personal.email && <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 9.5, color: "#6b7280" }}><IcoEmail size={10} color={primaryColor} />{personal.email}</span>}
            {personal.phone && <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 9.5, color: "#6b7280" }}><IcoPhone size={10} color={primaryColor} />{personal.phone}</span>}
            {personal.location && <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 9.5, color: "#6b7280" }}><IcoPin size={10} color={primaryColor} />{personal.location}</span>}
            {personal.linkedin && <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 9.5, color: "#6b7280" }}><IcoLinkedIn size={10} color={primaryColor} />{personal.linkedin}</span>}
            {personal.website && <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 9.5, color: "#6b7280" }}><IcoGlobe size={10} color={primaryColor} />{personal.website}</span>}
          </div>
        </div>
        <div style={{ padding: 3, borderRadius: "50%", background: primaryColor, flexShrink: 0 }}>
          <PhotoCircle url={personal.photo} name={personal.fullName} size={92} bgColor={primaryColor} borderColor="#fff" borderWidth={2} />
        </div>
      </div>

      {/* Body */}
      <div style={{ display: "flex", gap: 32, marginTop: 22 }}>
        {/* Main */}
        <div style={{ flex: 1.7, minWidth: 0 }}>
          {summary && !hidden("summary") && (
            <div style={{ marginBottom: 22 }}>
              <Head>{sw ? "Muhtasari" : "Summary"}</Head>
              <p style={{ fontSize: 11, lineHeight: 1.7, color: "#4b5563", margin: 0 }}>{summary}</p>
            </div>
          )}
          {experience?.length > 0 && !hidden("experience") && (
            <div style={{ marginBottom: 22 }}>
              <Head>{sw ? "Uzoefu wa Kazi" : "Experience"}</Head>
              <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
                {experience.map((exp) => (
                  <div key={exp.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: "#111827" }}>{exp.position}</span>
                      <span style={{ fontSize: 9.5, color: "#9ca3af", whiteSpace: "nowrap" }}>{dateRange(exp.startDate, exp.endDate, exp.current)}</span>
                    </div>
                    <div style={{ fontSize: 11, color: primaryColor, fontWeight: 600, margin: "1px 0 5px" }}>{exp.company}{exp.location && <span style={{ color: "#9ca3af", fontWeight: 400 }}> · {exp.location}</span>}</div>
                    {exp.description && exp.description.split("\n").filter(Boolean).map((line, i) => (
                      <div key={i} style={{ display: "flex", gap: 7, marginBottom: 3 }}>
                        <span style={{ color: primaryColor, fontSize: 10, lineHeight: 1.6, flexShrink: 0 }}>•</span>
                        <span style={{ fontSize: 10.5, color: "#4b5563", lineHeight: 1.6 }}>{line}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
          {education?.length > 0 && !hidden("education") && (
            <div>
              <Head>{sw ? "Elimu" : "Education"}</Head>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {education.map((edu) => (
                  <div key={edu.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#111827" }}>{edu.institution}</span>
                      <span style={{ fontSize: 9.5, color: "#9ca3af", whiteSpace: "nowrap" }}>{dateRange(edu.startDate, edu.endDate, false)}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#4b5563" }}>{edu.degree}{edu.field ? `, ${edu.field}` : ""}{edu.grade ? ` · ${edu.grade}` : ""}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Rail */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {skills?.length > 0 && !hidden("skills") && (
            <div style={{ marginBottom: 22 }}>
              <Head>{sw ? "Ujuzi" : "Skills"}</Head>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {visibleSkills(skills).map((s) => <Chip key={s.id}>{s.name}</Chip>)}
              </div>
            </div>
          )}
          {languages?.length > 0 && !hidden("languages") && (
            <div style={{ marginBottom: 22 }}>
              <Head>{sw ? "Lugha" : "Languages"}</Head>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {languages.map((l) => (
                  <div key={l.id} style={{ fontSize: 11, color: "#4b5563" }}><span style={{ fontWeight: 600, color: "#111827" }}>{l.name}</span> — {l.proficiency}</div>
                ))}
              </div>
            </div>
          )}
          {certifications?.length > 0 && !hidden("certifications") && (
            <div style={{ marginBottom: 22 }}>
              <Head>{sw ? "Vyeti" : "Certifications"}</Head>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {certifications.map((c) => (
                  <div key={c.id}>
                    <div style={{ fontSize: 10.5, fontWeight: 600, color: "#111827" }}>{c.name}</div>
                    <div style={{ fontSize: 9.5, color: "#6b7280" }}>{c.issuer}{c.date ? ` · ${fmtDate(c.date)}` : ""}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {referees?.length > 0 && !hidden("referees") && (
            <div style={{ marginBottom: 22 }}>
              <Head>{sw ? "Wadhamini" : "Referees"}</Head>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {referees.map((r) => (
                  <div key={r.id}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#111827" }}>{r.name}</div>
                    {(r.title || r.company) && <div style={{ fontSize: 10, color: primaryColor, fontWeight: 600 }}>{r.title}{r.title && r.company ? " · " : ""}{r.company}</div>}
                    {r.email && <div style={{ fontSize: 9.5, color: "#6b7280" }}>{r.email}</div>}
                    {r.phone && <div style={{ fontSize: 9.5, color: "#6b7280" }}>{r.phone}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {hobbies && !hidden("hobbies") && (
            <div>
              <Head>{sw ? "Mapendeleo" : "Interests"}</Head>
              <p style={{ fontSize: 10.5, color: "#4b5563", lineHeight: 1.6, margin: 0 }}>{hobbies}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
