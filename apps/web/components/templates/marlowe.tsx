import React from "react";
import { fmtDate, dateRange, visibleSkills, CVData, CvPhoto } from "@/components/templates/template-utils";
import type { Lang } from "@/lib/i18n/translations";

interface Props {
  data: CVData;
  primaryColor: string;
  fontFamily: string;
  lang?: Lang;
}

const SERIF = "Georgia, 'Times New Roman', Times, serif";

/**
 * Marlowe — elegant serif, single column. A centred name between thin rules,
 * a letter-spaced title, small-caps section headings, and generous whitespace.
 * The refined, understated look for law, consulting and the professions.
 */
export function MarloweTemplate({ data, primaryColor, fontFamily, lang = "en" }: Props) {
  const { personal, summary, experience, education, skills, languages, certifications, referees, hobbies } = data;
  const hidden = (k: string) => data.hiddenSections?.includes(k) ?? false;
  const sw = lang === "sw";
  const body = fontFamily || SERIF;

  const Head = ({ children }: { children: React.ReactNode }) => (
    <div style={{ textAlign: "center", margin: "26px 0 14px" }}>
      <span style={{ fontFamily: SERIF, fontSize: 12.5, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: primaryColor }}>{children}</span>
      <div style={{ height: 1, width: 40, background: primaryColor, opacity: 0.5, margin: "8px auto 0" }} />
    </div>
  );

  return (
    <div style={{ width: 794, minHeight: 1123, backgroundColor: "#ffffff", fontFamily: body, color: "#333", padding: "56px 74px", boxSizing: "border-box" }}>
      {/* Header */}
      <div style={{ textAlign: "center" }}>
        <div style={{ height: 1, background: "#d8d8d8", marginBottom: 18 }} />
        <div style={{ display: "flex", justifyContent: "center" }}>
          <CvPhoto url={personal.photo} name={personal.fullName} size={88} radius={50} borderColor="#d8d8d8" borderWidth={1} style={{ marginBottom: personal.photo ? 16 : 0 }} />
        </div>
        <div style={{ fontFamily: SERIF, fontSize: 38, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#1a1a1a", lineHeight: 1.1 }}>{personal.fullName}</div>
        {personal.jobTitle && <div style={{ fontSize: 12.5, letterSpacing: "0.28em", textTransform: "uppercase", color: primaryColor, marginTop: 10 }}>{personal.jobTitle}</div>}
        <div style={{ height: 1, background: "#d8d8d8", margin: "18px 0 12px" }} />
        <div style={{ fontSize: 10.5, color: "#6a6a6a", letterSpacing: "0.02em" }}>
          {[personal.email, personal.phone, personal.location, personal.linkedin, personal.website].filter(Boolean).join("  ·  ")}
        </div>
      </div>

      {summary && !hidden("summary") && (
        <>
          <Head>{sw ? "Wasifu" : "Profile"}</Head>
          <p style={{ fontSize: 11.5, lineHeight: 1.85, color: "#3a3a3a", margin: 0, textAlign: "center", maxWidth: 560, marginLeft: "auto", marginRight: "auto" }}>{summary}</p>
        </>
      )}

      {experience?.length > 0 && !hidden("experience") && (
        <>
          <Head>{sw ? "Uzoefu wa Kazi" : "Experience"}</Head>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {experience.map((exp) => (
              <div key={exp.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontFamily: SERIF, fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>{exp.position}</span>
                  <span style={{ fontSize: 9.5, color: "#9a9a9a", fontStyle: "italic", whiteSpace: "nowrap" }}>{dateRange(exp.startDate, exp.endDate, exp.current)}</span>
                </div>
                <div style={{ fontSize: 11, color: primaryColor, margin: "1px 0 6px", fontStyle: "italic" }}>{exp.company}{exp.location && <span style={{ color: "#9a9a9a" }}> · {exp.location}</span>}</div>
                {exp.description && exp.description.split("\n").filter(Boolean).map((l, i) => (
                  <p key={i} style={{ fontSize: 10.5, color: "#3a3a3a", lineHeight: 1.7, margin: "0 0 3px" }}>{l}</p>
                ))}
              </div>
            ))}
          </div>
        </>
      )}

      {education?.length > 0 && !hidden("education") && (
        <>
          <Head>{sw ? "Elimu" : "Education"}</Head>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {education.map((edu) => (
              <div key={edu.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                <div>
                  <span style={{ fontFamily: SERIF, fontSize: 12, fontWeight: 700, color: "#1a1a1a" }}>{edu.institution}</span>
                  <span style={{ fontSize: 11, color: "#4a4a4a" }}> — {edu.degree}{edu.field ? `, ${edu.field}` : ""}{edu.grade ? ` (${edu.grade})` : ""}</span>
                </div>
                <span style={{ fontSize: 9.5, color: "#9a9a9a", fontStyle: "italic", whiteSpace: "nowrap" }}>{dateRange(edu.startDate, edu.endDate, false)}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {skills?.length > 0 && !hidden("skills") && (
        <>
          <Head>{sw ? "Ujuzi" : "Skills"}</Head>
          <p style={{ fontSize: 11, color: "#3a3a3a", textAlign: "center", lineHeight: 1.9, margin: 0 }}>
            {visibleSkills(skills).map((s) => s.name).join("   ·   ")}
          </p>
        </>
      )}

      {(languages?.length > 0 || certifications?.length > 0 || hobbies) && (
        <>
          <Head>{sw ? "Zaidi" : "Additional"}</Head>
          <div style={{ textAlign: "center", fontSize: 10.5, color: "#3a3a3a", lineHeight: 1.9 }}>
            {languages?.length > 0 && !hidden("languages") && <div><span style={{ fontWeight: 700, color: "#1a1a1a" }}>{sw ? "Lugha: " : "Languages: "}</span>{languages.map((l) => `${l.name} (${l.proficiency})`).join(" · ")}</div>}
            {certifications?.length > 0 && !hidden("certifications") && <div><span style={{ fontWeight: 700, color: "#1a1a1a" }}>{sw ? "Vyeti: " : "Certifications: "}</span>{certifications.map((c) => `${c.name}${c.date ? ` (${fmtDate(c.date)})` : ""}`).join(" · ")}</div>}
            {hobbies && !hidden("hobbies") && <div><span style={{ fontWeight: 700, color: "#1a1a1a" }}>{sw ? "Mapendeleo: " : "Interests: "}</span>{hobbies}</div>}
          </div>
        </>
      )}

      {referees?.length > 0 && !hidden("referees") && (
        <>
          <Head>{sw ? "Wadhamini" : "Referees"}</Head>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "16px 40px" }}>
            {referees.map((r) => (
              <div key={r.id} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: SERIF, fontSize: 12, fontWeight: 700, color: "#1a1a1a" }}>{r.name}</div>
                {(r.title || r.company) && <div style={{ fontSize: 11, color: primaryColor, fontStyle: "italic" }}>{r.title}{r.title && r.company ? " · " : ""}{r.company}</div>}
                {(r.email || r.phone) && <div style={{ fontSize: 9.5, color: "#9a9a9a" }}>{[r.email, r.phone].filter(Boolean).join("  ·  ")}</div>}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
