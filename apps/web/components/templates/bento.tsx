import React from "react";
import {
  IcoEmail, IcoPhone, IcoPin, IcoGlobe,
  PhotoCircle, dateRange, fmtDate, CVData,
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
 * Bento — a bento-grid résumé. Content lives in rounded cards of varying
 * weights (a solid accent hero, tinted panels, white blocks), laid out with
 * nested flex rows (not CSS grid, which the html2canvas exporter mishandles).
 * The contemporary "bento" look — modular, breezy, unmistakably now.
 */
export function BentoTemplate({ data, primaryColor, fontFamily, lang = "en" }: Props) {
  const { personal, summary, experience, education, skills, languages, certifications, referees, hobbies } = data;
  const sw = lang === "sw";
  const body = fontFamily || "'Inter', 'Helvetica Neue', Arial, sans-serif";
  const tint = `${primaryColor}0f`;
  const line = `${primaryColor}2e`;
  const hidden = (k: string) => data.hiddenSections?.includes(k) ?? false;

  const Card = ({ children, flex, bg }: { children: React.ReactNode; flex?: number; bg?: string }) => (
    <div style={{ flex, background: bg || "#ffffff", border: `1.5px solid ${line}`, borderRadius: 18, padding: 18, boxSizing: "border-box", minWidth: 0 }}>{children}</div>
  );
  const Label = ({ children }: { children: React.ReactNode }) => (
    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: primaryColor, marginBottom: 10 }}>{children}</div>
  );

  return (
    <div style={{ width: 794, minHeight: 1123, backgroundColor: "#F6F5F3", fontFamily: body, color: "#1f2937", padding: 24, boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Hero card */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18, background: primaryColor, borderRadius: 20, padding: "24px 26px", color: "#fff" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.05 }}>{personal.fullName}</div>
          {personal.jobTitle && <div style={{ fontSize: 13, fontWeight: 500, opacity: 0.92, marginTop: 5 }}>{personal.jobTitle}</div>}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px", marginTop: 12 }}>
            {personal.email && <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 9.5, color: "rgba(255,255,255,0.9)" }}><IcoEmail size={10} color="#fff" />{personal.email}</span>}
            {personal.phone && <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 9.5, color: "rgba(255,255,255,0.9)" }}><IcoPhone size={10} color="#fff" />{personal.phone}</span>}
            {personal.location && <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 9.5, color: "rgba(255,255,255,0.9)" }}><IcoPin size={10} color="#fff" />{personal.location}</span>}
            {personal.website && <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 9.5, color: "rgba(255,255,255,0.9)" }}><IcoGlobe size={10} color="#fff" />{personal.website}</span>}
          </div>
        </div>
        <div style={{ padding: 3, borderRadius: "50%", background: "rgba(255,255,255,0.25)", flexShrink: 0 }}>
          <PhotoCircle url={personal.photo} name={personal.fullName} size={88} bgColor="rgba(255,255,255,0.2)" borderColor="#fff" borderWidth={2} />
        </div>
      </div>

      {/* Row: profile + skills */}
      <div style={{ display: "flex", gap: 12 }}>
        {summary && !hidden("summary") && (
          <Card flex={1.5} bg={tint}>
            <Label>{sw ? "Muhtasari" : "Profile"}</Label>
            <p style={{ fontSize: 10.5, lineHeight: 1.65, color: "#4b5563", margin: 0 }}>{summary}</p>
          </Card>
        )}
        {skills?.length > 0 && !hidden("skills") && (
          <Card flex={1}>
            <Label>{sw ? "Ujuzi" : "Skills"}</Label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {visibleSkills(skills).map((s) => (
                <span key={s.id} style={{ fontSize: 9.5, color: primaryColor, background: tint, border: `1px solid ${line}`, borderRadius: 20, padding: "3px 9px" }}>{s.name}</span>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Experience card */}
      {experience?.length > 0 && !hidden("experience") && (
        <Card>
          <Label>{sw ? "Uzoefu wa Kazi" : "Experience"}</Label>
          <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
            {experience.map((exp) => (
              <div key={exp.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: "#111827" }}>{exp.position}</span>
                  <span style={{ fontSize: 9, color: "#fff", background: primaryColor, padding: "2px 8px", borderRadius: 20, whiteSpace: "nowrap" }}>{dateRange(exp.startDate, exp.endDate, exp.current)}</span>
                </div>
                <div style={{ fontSize: 10.5, color: primaryColor, fontWeight: 600, margin: "1px 0 4px" }}>{exp.company}{exp.location && <span style={{ color: "#9ca3af", fontWeight: 400 }}> · {exp.location}</span>}</div>
                {exp.description && exp.description.split("\n").filter(Boolean).map((l, i) => (
                  <div key={i} style={{ display: "flex", gap: 7, marginBottom: 2 }}>
                    <span style={{ color: primaryColor, fontSize: 10, flexShrink: 0 }}>•</span>
                    <span style={{ fontSize: 10, color: "#4b5563", lineHeight: 1.55 }}>{l}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Row: education + (languages/certs/interests) */}
      <div style={{ display: "flex", gap: 12, alignItems: "stretch" }}>
        {education?.length > 0 && !hidden("education") && (
          <Card flex={1}>
            <Label>{sw ? "Elimu" : "Education"}</Label>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {education.map((edu) => (
                <div key={edu.id}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: "#111827" }}>{edu.institution}</div>
                  <div style={{ fontSize: 10, color: "#4b5563" }}>{edu.degree}{edu.field ? `, ${edu.field}` : ""}</div>
                  <div style={{ fontSize: 9, color: "#9ca3af" }}>{dateRange(edu.startDate, edu.endDate, false)}{edu.grade ? ` · ${edu.grade}` : ""}</div>
                </div>
              ))}
            </div>
          </Card>
        )}
        <Card flex={1} bg={tint}>
          {languages?.length > 0 && !hidden("languages") && (
            <div style={{ marginBottom: (certifications?.length || hobbies) ? 14 : 0 }}>
              <Label>{sw ? "Lugha" : "Languages"}</Label>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {languages.map((l) => (
                  <div key={l.id} style={{ fontSize: 10, color: "#4b5563" }}><span style={{ fontWeight: 600, color: "#111827" }}>{l.name}</span> — {l.proficiency}</div>
                ))}
              </div>
            </div>
          )}
          {certifications?.length > 0 && !hidden("certifications") && (
            <div style={{ marginBottom: hobbies ? 14 : 0 }}>
              <Label>{sw ? "Vyeti" : "Certifications"}</Label>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {certifications.map((c) => (
                  <div key={c.id} style={{ fontSize: 10, color: "#4b5563" }}><span style={{ fontWeight: 600, color: "#111827" }}>{c.name}</span>{c.issuer ? ` · ${c.issuer}` : ""}{c.date ? ` · ${fmtDate(c.date)}` : ""}</div>
                ))}
              </div>
            </div>
          )}
          {hobbies && !hidden("hobbies") && (
            <div>
              <Label>{sw ? "Mapendeleo" : "Interests"}</Label>
              <p style={{ fontSize: 10, color: "#4b5563", lineHeight: 1.55, margin: 0 }}>{hobbies}</p>
            </div>
          )}
        </Card>
      </div>

      {/* Referees */}
      {referees?.length > 0 && !hidden("referees") && (
        <Card>
          <Label>{sw ? "Wadhamini" : "Referees"}</Label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
            {referees.map((r) => (
              <div key={r.id} style={{ minWidth: 180, flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#111827" }}>{r.name}</div>
                {(r.title || r.company) && (
                  <div style={{ fontSize: 10, color: primaryColor, fontWeight: 600 }}>
                    {r.title}{r.title && r.company ? " · " : ""}{r.company}
                  </div>
                )}
                {r.email && <div style={{ fontSize: 9.5, color: "#9ca3af" }}>{r.email}</div>}
                {r.phone && <div style={{ fontSize: 9.5, color: "#9ca3af" }}>{r.phone}</div>}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
