import React from "react";
import { fmtDate, dateRange, CVData } from "@/components/templates/template-utils";
import type { Lang } from "@/lib/i18n/translations";

interface Props {
  data: CVData;
  primaryColor: string;
  fontFamily: string;
  lang?: Lang;
}

const INK = "#1E1A16";
const RING_C = 2 * Math.PI * 26; // r = 26

function SkillRing({ label, level, color }: { label: string; level: number; color: string }) {
  const pct = Math.round((level / 5) * 100);
  const offset = RING_C * (1 - level / 5);
  return (
    <div style={{ textAlign: "center" }}>
      <svg width={70} height={70} viewBox="0 0 70 70">
        <circle cx={35} cy={35} r={26} fill="none" stroke="#ece3d5" strokeWidth={7} />
        <circle cx={35} cy={35} r={26} fill="none" stroke={color} strokeWidth={7} strokeLinecap="round" strokeDasharray={RING_C} strokeDashoffset={offset} transform="rotate(-90 35 35)" />
        <text x={35} y={39} textAnchor="middle" fontSize={14} fontWeight={700} fill={INK}>{pct}</text>
      </svg>
      <div style={{ fontSize: 9.5, color: "#4b5563", marginTop: 2, lineHeight: 1.2 }}>{label}</div>
    </div>
  );
}

/**
 * Nuru ("light") — infographic, data-forward. A dark two-tone header carries a
 * stat strip derived from the candidate's real history (years, roles, skills),
 * skills render as SVG donut gauges, and experience runs down an accent
 * timeline spine. The most graphic direction — instantly scannable.
 */
export function NuruTemplate({ data, primaryColor, fontFamily, lang = "en" }: Props) {
  const { personal, summary, experience, education, skills, languages, certifications, referees, hobbies } = data;
  const hidden = (k: string) => data.hiddenSections?.includes(k) ?? false;
  const sw = lang === "sw";
  const body = fontFamily || "'Inter', 'Helvetica Neue', Arial, sans-serif";

  // Derived stats — honest, from the user's own data (no fabricated metrics).
  const startYears = experience.map((e) => parseInt((e.startDate || "").slice(0, 4), 10)).filter((n) => !isNaN(n));
  const endYears = experience.map((e) => (e.current ? new Date().getFullYear() : parseInt((e.endDate || "").slice(0, 4), 10))).filter((n) => !isNaN(n));
  const years = startYears.length && endYears.length ? Math.max(0, Math.max(...endYears) - Math.min(...startYears)) : 0;
  const stats = [
    years > 0 ? { n: `${years}+`, l: sw ? "Miaka" : "Years" } : null,
    experience.length ? { n: String(experience.length), l: sw ? "Nafasi" : "Roles" } : null,
    skills.length ? { n: String(skills.length), l: sw ? "Ujuzi" : "Skills" } : null,
    certifications.length ? { n: String(certifications.length), l: sw ? "Vyeti" : "Certs" } : (education.length ? { n: String(education.length), l: sw ? "Digrii" : "Degrees" } : null),
  ].filter(Boolean) as { n: string; l: string }[];

  const ringSkills = skills.slice(0, 6);
  const ringColors = [primaryColor, INK, "#B57A18", primaryColor, INK, "#B57A18"];

  const Head = ({ children }: { children: React.ReactNode }) => (
    <div style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: INK, marginBottom: 14 }}>{children}</div>
  );

  return (
    <div style={{ width: 794, minHeight: 1123, backgroundColor: "#ffffff", fontFamily: body, color: "#1f2937", boxSizing: "border-box" }}>
      {/* Header band */}
      <div style={{ background: "linear-gradient(120deg, #1E1A16 0%, #3a2c22 100%)", color: "#fff", padding: "34px 40px 26px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20 }}>
          <div>
            <div style={{ fontSize: 32, fontWeight: 800, margin: 0, letterSpacing: "-0.01em" }}>{personal.fullName}</div>
            {personal.jobTitle && <div style={{ fontSize: 13, color: primaryColor, fontWeight: 600, letterSpacing: "0.04em", marginTop: 4 }}>{personal.jobTitle}</div>}
          </div>
          <div style={{ textAlign: "right", fontSize: 10.5, color: "#d9cfc2", lineHeight: 1.7 }}>
            {personal.email && <div>{personal.email}</div>}
            {personal.phone && <div>{personal.phone}</div>}
            {(personal.location || personal.website) && <div>{[personal.location, personal.website].filter(Boolean).join(" · ")}</div>}
          </div>
        </div>
        {stats.length > 0 && (
          <div style={{ display: "flex", gap: 12, marginTop: 22 }}>
            {stats.map((s, i) => (
              <div key={i} style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 9, padding: "11px 14px" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: primaryColor }}>{s.n}</div>
                <div style={{ fontSize: 9.5, letterSpacing: "0.08em", textTransform: "uppercase", color: "#bcae9f" }}>{s.l}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: "flex", padding: "28px 40px 40px", gap: 34 }}>
        {/* Left */}
        <div style={{ width: 230, flexShrink: 0 }}>
          {ringSkills.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <Head>{sw ? "Ujuzi" : "Skills"}</Head>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 8px" }}>
                {ringSkills.map((s, i) => (
                  <SkillRing key={s.id} label={s.name} level={s.level} color={ringColors[i % ringColors.length]} />
                ))}
              </div>
            </div>
          )}

          {education?.length > 0 && !hidden("education") && (
            <div style={{ marginBottom: 24 }}>
              <Head>{sw ? "Elimu" : "Education"}</Head>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {education.map((edu) => (
                  <div key={edu.id}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#111827" }}>{edu.institution}</div>
                    <div style={{ fontSize: 10.5, color: "#6b7280" }}>{edu.degree}{edu.field ? `, ${edu.field}` : ""}</div>
                    <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 1 }}>{dateRange(edu.startDate, edu.endDate, false)}{edu.grade ? ` · ${edu.grade}` : ""}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {languages?.length > 0 && !hidden("languages") && (
            <div style={{ marginBottom: 24 }}>
              <Head>{sw ? "Lugha" : "Languages"}</Head>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {languages.map((l) => (
                  <div key={l.id} style={{ fontSize: 11, color: "#4b5563" }}><span style={{ fontWeight: 600, color: "#111827" }}>{l.name}</span> — {l.proficiency}</div>
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

        {/* Right */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {summary && !hidden("summary") && (
            <div style={{ marginBottom: 24 }}>
              <Head>{sw ? "Muhtasari" : "Profile"}</Head>
              <p style={{ fontSize: 11, lineHeight: 1.7, color: "#4b5563", margin: 0 }}>{summary}</p>
            </div>
          )}

          {experience?.length > 0 && !hidden("experience") && (
            <div style={{ marginBottom: 24 }}>
              <Head>{sw ? "Uzoefu wa Kazi" : "Experience"}</Head>
              <div style={{ position: "relative", paddingLeft: 26 }}>
                <div style={{ position: "absolute", left: 5, top: 4, bottom: 4, width: 2, background: `linear-gradient(180deg, ${primaryColor}, #B57A18)` }} />
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {experience.map((exp) => (
                    <div key={exp.id} style={{ position: "relative" }}>
                      <div style={{ position: "absolute", left: -26, top: 2, width: 12, height: 12, borderRadius: "50%", background: primaryColor, border: "2px solid #fff", boxShadow: `0 0 0 2px ${primaryColor}` }} />
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                        <span style={{ fontSize: 13.5, fontWeight: 700, color: "#111827" }}>{exp.position}</span>
                        <span style={{ fontSize: 9.5, color: "#9ca3af", whiteSpace: "nowrap" }}>{dateRange(exp.startDate, exp.endDate, exp.current)}</span>
                      </div>
                      <div style={{ fontSize: 11, color: primaryColor, fontWeight: 600, margin: "1px 0 5px" }}>{exp.company}{exp.location && <span style={{ color: "#9ca3af", fontWeight: 400 }}> · {exp.location}</span>}</div>
                      {exp.description && exp.description.split("\n").filter(Boolean).map((line, i) => (
                        <div key={i} style={{ display: "flex", gap: 7, marginBottom: 3 }}>
                          <span style={{ color: primaryColor, fontSize: 10, lineHeight: 1.6, flexShrink: 0 }}>▸</span>
                          <span style={{ fontSize: 10.5, color: "#4b5563", lineHeight: 1.6 }}>{line}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {certifications?.length > 0 && !hidden("certifications") && (
            <div>
              <Head>{sw ? "Vyeti" : "Certifications"}</Head>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {certifications.map((c) => (
                  <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontSize: 11, color: "#111827" }}><span style={{ fontWeight: 600 }}>{c.name}</span>{c.issuer && <span style={{ color: "#6b7280" }}> · {c.issuer}</span>}</span>
                    <span style={{ fontSize: 9.5, color: "#9ca3af", whiteSpace: "nowrap" }}>{fmtDate(c.date)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {referees?.length > 0 && !hidden("referees") && (
            <div style={{ marginTop: 24 }}>
              <Head>{sw ? "Wadhamini" : "Referees"}</Head>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "12px 24px" }}>
                {referees.map((r) => (
                  <div key={r.id} style={{ minWidth: 160, flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#111827" }}>{r.name}</div>
                    {(r.title || r.company) && <div style={{ fontSize: 10.5, color: primaryColor, fontWeight: 600 }}>{r.title}{r.title && r.company ? " · " : ""}{r.company}</div>}
                    {r.email && <div style={{ fontSize: 10, color: "#9ca3af" }}>{r.email}</div>}
                    {r.phone && <div style={{ fontSize: 10, color: "#9ca3af" }}>{r.phone}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
