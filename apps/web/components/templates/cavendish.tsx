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
 * Cavendish — an academic / long-form CV. Serif throughout, left-aligned name,
 * ruled section headers, and dense, hanging-style entries (institution + right-
 * aligned dates) built for researchers, lecturers and postgraduates who need
 * publications, certifications and a full record to breathe.
 */
export function CavendishTemplate({ data, primaryColor, fontFamily, lang = "en" }: Props) {
  const { personal, summary, experience, education, skills, languages, certifications, referees, hobbies } = data;
  const hidden = (k: string) => data.hiddenSections?.includes(k) ?? false;
  const sw = lang === "sw";
  const body = fontFamily || SERIF;

  const Head = ({ children }: { children: React.ReactNode }) => (
    <div style={{ fontFamily: SERIF, fontSize: 13.5, fontWeight: 700, color: primaryColor, borderBottom: `1px solid ${primaryColor}`, paddingBottom: 4, margin: "22px 0 11px", letterSpacing: "0.02em" }}>{children}</div>
  );
  const Row = ({ left, right, children }: { left: React.ReactNode; right: React.ReactNode; children?: React.ReactNode }) => (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
        <span style={{ fontSize: 12, color: "#1a1a1a" }}>{left}</span>
        <span style={{ fontSize: 10, color: "#8a8a8a", whiteSpace: "nowrap", fontStyle: "italic" }}>{right}</span>
      </div>
      {children}
    </div>
  );

  return (
    <div style={{ width: 794, minHeight: 1123, backgroundColor: "#ffffff", fontFamily: body, color: "#2a2a2a", padding: "48px 56px", boxSizing: "border-box" }}>
      {/* Header */}
      <div style={{ borderBottom: `2px solid ${primaryColor}`, paddingBottom: 12, marginBottom: 4, display: "flex", alignItems: "center", gap: 18 }}>
        <CvPhoto url={personal.photo} name={personal.fullName} size={72} radius={50} borderColor={primaryColor} borderWidth={1} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: SERIF, fontSize: 32, fontWeight: 700, color: "#111", letterSpacing: "0.01em" }}>{personal.fullName}</div>
          {personal.jobTitle && <div style={{ fontSize: 12.5, color: primaryColor, marginTop: 3, fontStyle: "italic" }}>{personal.jobTitle}</div>}
          <div style={{ fontSize: 10, color: "#6a6a6a", marginTop: 7 }}>
            {[personal.email, personal.phone, personal.location, personal.linkedin, personal.website].filter(Boolean).join("  |  ")}
          </div>
        </div>
      </div>

      {summary && !hidden("summary") && (
        <>
          <Head>{sw ? "Muhtasari" : "Profile"}</Head>
          <p style={{ fontSize: 11, lineHeight: 1.7, color: "#333", margin: 0, textAlign: "justify" }}>{summary}</p>
        </>
      )}

      {education?.length > 0 && !hidden("education") && (
        <>
          <Head>{sw ? "Elimu" : "Education"}</Head>
          {education.map((edu) => (
            <Row key={edu.id}
              left={<><span style={{ fontWeight: 700 }}>{edu.degree}{edu.field ? `, ${edu.field}` : ""}</span> — {edu.institution}</>}
              right={dateRange(edu.startDate, edu.endDate, false)}>
              {(edu.grade || edu.description) && <p style={{ fontSize: 10, color: "#5a5a5a", lineHeight: 1.55, margin: "2px 0 0" }}>{[edu.grade, edu.description].filter(Boolean).join(" · ")}</p>}
            </Row>
          ))}
        </>
      )}

      {experience?.length > 0 && !hidden("experience") && (
        <>
          <Head>{sw ? "Uzoefu wa Kazi" : "Appointments & Experience"}</Head>
          {experience.map((exp) => (
            <Row key={exp.id}
              left={<><span style={{ fontWeight: 700 }}>{exp.position}</span>, {exp.company}{exp.location ? `, ${exp.location}` : ""}</>}
              right={dateRange(exp.startDate, exp.endDate, exp.current)}>
              {exp.description && exp.description.split("\n").filter(Boolean).map((l, i) => (
                <div key={i} style={{ display: "flex", gap: 7, marginTop: 2 }}>
                  <span style={{ color: primaryColor, fontSize: 10, flexShrink: 0 }}>–</span>
                  <span style={{ fontSize: 10.5, color: "#333", lineHeight: 1.6 }}>{l}</span>
                </div>
              ))}
            </Row>
          ))}
        </>
      )}

      {certifications?.length > 0 && !hidden("certifications") && (
        <>
          <Head>{sw ? "Vyeti & Machapisho" : "Certifications & Publications"}</Head>
          {certifications.map((c) => (
            <Row key={c.id} left={<><span style={{ fontWeight: 700 }}>{c.name}</span>{c.issuer ? `, ${c.issuer}` : ""}</>} right={c.date ? fmtDate(c.date) : ""} />
          ))}
        </>
      )}

      {referees?.length > 0 && !hidden("referees") && (
        <>
          <Head>{sw ? "Wadhamini" : "Referees"}</Head>
          {referees.map((r) => (
            <Row key={r.id}
              left={<span style={{ fontWeight: 700 }}>{r.name}</span>}
              right={(r.title || r.company) ? [r.title, r.company].filter(Boolean).join(" · ") : ""}>
              {(r.email || r.phone) && <p style={{ fontSize: 10, color: "#5a5a5a", lineHeight: 1.55, margin: "2px 0 0" }}>{[r.email, r.phone].filter(Boolean).join(" · ")}</p>}
            </Row>
          ))}
        </>
      )}

      {skills?.length > 0 && !hidden("skills") && (
        <>
          <Head>{sw ? "Ujuzi & Utaalamu" : "Skills & Expertise"}</Head>
          <p style={{ fontSize: 11, color: "#333", lineHeight: 1.8, margin: 0 }}>{visibleSkills(skills).map((s) => s.name).join(" · ")}</p>
        </>
      )}

      {languages?.length > 0 && !hidden("languages") && (
        <>
          <Head>{sw ? "Lugha" : "Languages"}</Head>
          <p style={{ fontSize: 11, color: "#333", lineHeight: 1.8, margin: 0 }}>{languages.map((l) => `${l.name} (${l.proficiency})`).join(" · ")}</p>
        </>
      )}

      {hobbies && !hidden("hobbies") && (
        <>
          <Head>{sw ? "Mapendeleo" : "Interests"}</Head>
          <p style={{ fontSize: 11, color: "#333", lineHeight: 1.7, margin: 0 }}>{hobbies}</p>
        </>
      )}
    </div>
  );
}
