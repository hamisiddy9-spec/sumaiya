import React from "react";
import {
  IcoEmail, IcoPhone, IcoPin, IcoLinkedIn, IcoGlobe,
  dateRange, fmtDate, CVData,
  visibleSkills,
} from "@/components/templates/template-utils";
import type { Lang } from "@/lib/i18n/translations";

interface Props {
  data: CVData;
  primaryColor: string;
  fontFamily: string;
  lang?: Lang;
}

const BG = "#0B0B14";
const CARD = "#14141F";
const TXT = "#D7D8E0";
const DIM = "#8A8B99";
const LINE = "rgba(255,255,255,0.08)";

function lighten(hex: string, amt: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const h = m[1];
  const up = (c: number) => Math.round(c + (255 - c) * amt);
  return `rgb(${up(parseInt(h.slice(0, 2), 16))}, ${up(parseInt(h.slice(2, 4), 16))}, ${up(parseInt(h.slice(4, 6), 16))})`;
}

const PROF: Record<string, number> = { Native: 5, Fluent: 4, Advanced: 4, Intermediate: 3, Basic: 2 };

/**
 * Neon — dark, sleek, vibrant. Near-black ground, a bright accent, gradient
 * bars and rounded cards. The streaming-app aesthetic applied to a résumé.
 * Solid fills + linear gradients only (no glow filters), so it survives the
 * raster export while still reading as bold and modern.
 */
export function NeonTemplate({ data, primaryColor, fontFamily, lang = "en" }: Props) {
  const { personal, summary, experience, education, skills, languages, certifications, referees, hobbies } = data;
  const hidden = (k: string) => data.hiddenSections?.includes(k) ?? false;
  const sw = lang === "sw";
  const body = fontFamily || "'Inter', 'Helvetica Neue', Arial, sans-serif";
  const grad = `linear-gradient(90deg, ${primaryColor}, ${lighten(primaryColor, 0.4)})`;

  const Head = ({ children }: { children: React.ReactNode }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
      <span style={{ width: 18, height: 4, borderRadius: 2, background: grad }} />
      <span style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "#fff" }}>{children}</span>
    </div>
  );
  const Card: React.CSSProperties = { background: CARD, border: `1px solid ${LINE}`, borderRadius: 14, padding: 18 };

  return (
    <div style={{ width: 794, minHeight: 1123, backgroundColor: BG, fontFamily: body, color: TXT, padding: 30, boxSizing: "border-box" }}>
      {/* Header */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 38, fontWeight: 800, margin: 0, letterSpacing: "-0.02em", lineHeight: 1.02, color: "#fff" }}>{personal.fullName}</div>
        {personal.jobTitle && (
          <div style={{ display: "inline-block", marginTop: 10, fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: BG, background: grad, padding: "5px 13px", borderRadius: 20 }}>{personal.jobTitle}</div>
        )}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", marginTop: 14 }}>
          {personal.email && <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 10, color: DIM }}><IcoEmail size={11} color={lighten(primaryColor, 0.25)} />{personal.email}</span>}
          {personal.phone && <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 10, color: DIM }}><IcoPhone size={11} color={lighten(primaryColor, 0.25)} />{personal.phone}</span>}
          {personal.location && <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 10, color: DIM }}><IcoPin size={11} color={lighten(primaryColor, 0.25)} />{personal.location}</span>}
          {personal.linkedin && <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 10, color: DIM }}><IcoLinkedIn size={11} color={lighten(primaryColor, 0.25)} />{personal.linkedin}</span>}
          {personal.website && <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 10, color: DIM }}><IcoGlobe size={11} color={lighten(primaryColor, 0.25)} />{personal.website}</span>}
        </div>
      </div>

      {summary && !hidden("summary") && (
        <div style={{ ...Card, marginBottom: 16 }}>
          <p style={{ fontSize: 11, lineHeight: 1.7, color: TXT, margin: 0 }}>{summary}</p>
        </div>
      )}

      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        <div style={{ flex: 1.7, minWidth: 0, display: "flex", flexDirection: "column", gap: 16 }}>
          {experience?.length > 0 && !hidden("experience") && (
            <div style={Card}>
              <Head>{sw ? "Uzoefu wa Kazi" : "Experience"}</Head>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {experience.map((exp) => (
                  <div key={exp.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: "#fff" }}>{exp.position}</span>
                      <span style={{ fontSize: 9.5, color: DIM, whiteSpace: "nowrap" }}>{dateRange(exp.startDate, exp.endDate, exp.current)}</span>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: lighten(primaryColor, 0.25), margin: "1px 0 5px" }}>{exp.company}{exp.location && <span style={{ color: DIM, fontWeight: 400 }}> · {exp.location}</span>}</div>
                    {exp.description && exp.description.split("\n").filter(Boolean).map((l, i) => (
                      <div key={i} style={{ display: "flex", gap: 7, marginBottom: 3 }}>
                        <span style={{ color: lighten(primaryColor, 0.25), fontSize: 10, flexShrink: 0 }}>▸</span>
                        <span style={{ fontSize: 10.5, color: TXT, lineHeight: 1.55 }}>{l}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
          {education?.length > 0 && !hidden("education") && (
            <div style={Card}>
              <Head>{sw ? "Elimu" : "Education"}</Head>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {education.map((edu) => (
                  <div key={edu.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{edu.institution}</span>
                      <span style={{ fontSize: 9.5, color: DIM, whiteSpace: "nowrap" }}>{dateRange(edu.startDate, edu.endDate, false)}</span>
                    </div>
                    <div style={{ fontSize: 11, color: TXT }}>{edu.degree}{edu.field ? `, ${edu.field}` : ""}{edu.grade ? ` · ${edu.grade}` : ""}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 16 }}>
          {skills?.length > 0 && !hidden("skills") && (
            <div style={Card}>
              <Head>{sw ? "Ujuzi" : "Skills"}</Head>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {visibleSkills(skills).map((s) => (
                  <div key={s.id}>
                    <div style={{ fontSize: 10.5, color: TXT, marginBottom: 4 }}>{s.name}</div>
                    <div style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,0.1)" }}>
                      <div style={{ width: `${(s.level / 5) * 100}%`, height: "100%", borderRadius: 3, background: grad }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {languages?.length > 0 && !hidden("languages") && (
            <div style={Card}>
              <Head>{sw ? "Lugha" : "Languages"}</Head>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {languages.map((l) => (
                  <div key={l.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: TXT, marginBottom: 3 }}><span>{l.name}</span><span style={{ color: DIM }}>{l.proficiency}</span></div>
                    <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.1)" }}>
                      <div style={{ width: `${((PROF[l.proficiency] ?? 3) / 5) * 100}%`, height: "100%", borderRadius: 2, background: grad }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {(certifications?.length > 0 || hobbies) && (
            <div style={Card}>
              {certifications?.length > 0 && !hidden("certifications") && (
                <div style={{ marginBottom: hobbies ? 14 : 0 }}>
                  <Head>{sw ? "Vyeti" : "Certifications"}</Head>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {certifications.map((c) => (
                      <div key={c.id} style={{ fontSize: 10, color: TXT }}><span style={{ fontWeight: 600, color: "#fff" }}>{c.name}</span>{c.issuer ? ` · ${c.issuer}` : ""}{c.date ? ` · ${fmtDate(c.date)}` : ""}</div>
                    ))}
                  </div>
                </div>
              )}
              {hobbies && !hidden("hobbies") && (
                <div>
                  <Head>{sw ? "Mapendeleo" : "Interests"}</Head>
                  <p style={{ fontSize: 10, color: TXT, lineHeight: 1.6, margin: 0 }}>{hobbies}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {referees?.length > 0 && !hidden("referees") && (
        <div style={{ ...Card, marginTop: 16 }}>
          <Head>{sw ? "Wadhamini" : "Referees"}</Head>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
            {referees.map((r) => (
              <div key={r.id} style={{ minWidth: 180, flex: 1 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: "#fff" }}>{r.name}</div>
                {(r.title || r.company) && <div style={{ fontSize: 10, fontWeight: 600, color: lighten(primaryColor, 0.25) }}>{r.title}{r.title && r.company ? " · " : ""}{r.company}</div>}
                {r.email && <div style={{ fontSize: 9.5, color: DIM }}>{r.email}</div>}
                {r.phone && <div style={{ fontSize: 9.5, color: DIM }}>{r.phone}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
