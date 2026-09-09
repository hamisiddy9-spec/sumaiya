import React from "react";
import {
  IcoEmail, IcoPhone, IcoPin, IcoLinkedIn, IcoGlobe,
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

function lighten(hex: string, amt: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const h = m[1];
  const up = (c: number) => Math.round(c + (255 - c) * amt);
  return `rgb(${up(parseInt(h.slice(0, 2), 16))}, ${up(parseInt(h.slice(2, 4), 16))}, ${up(parseInt(h.slice(4, 6), 16))})`;
}

const PROF: Record<string, number> = { Native: 5, Fluent: 4, Advanced: 4, Intermediate: 3, Basic: 2 };

/**
 * Vibe — vibrant gradient, contemporary SaaS energy. A bold linear-gradient
 * header carries the name and a ring-framed portrait; the calm white body uses
 * gradient section ticks and gradient skill bars. Linear gradients only, so it
 * rasterises cleanly in the PDF export.
 */
export function VibeTemplate({ data, primaryColor, fontFamily, lang = "en" }: Props) {
  const { personal, summary, experience, education, skills, languages, certifications, referees, hobbies } = data;
  const hidden = (k: string) => data.hiddenSections?.includes(k) ?? false;
  const sw = lang === "sw";
  const body = fontFamily || "'Inter', 'Helvetica Neue', Arial, sans-serif";
  const grad = `linear-gradient(120deg, ${primaryColor} 0%, ${lighten(primaryColor, 0.42)} 100%)`;

  const Head = ({ children }: { children: React.ReactNode }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
      <span style={{ width: 20, height: 6, borderRadius: 3, background: grad }} />
      <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.02em", color: "#111827" }}>{children}</span>
    </div>
  );

  return (
    <div style={{ width: 794, minHeight: 1123, backgroundColor: "#ffffff", fontFamily: body, color: "#1f2937", boxSizing: "border-box" }}>
      {/* Gradient header */}
      <div style={{ background: grad, padding: "34px 40px", color: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 36, fontWeight: 800, margin: 0, letterSpacing: "-0.02em", lineHeight: 1.05 }}>{personal.fullName}</div>
          {personal.jobTitle && <div style={{ fontSize: 14, fontWeight: 500, opacity: 0.95, marginTop: 6 }}>{personal.jobTitle}</div>}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px 16px", marginTop: 14 }}>
            {personal.email && <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10, color: "rgba(255,255,255,0.95)" }}><IcoEmail size={11} color="#fff" />{personal.email}</span>}
            {personal.phone && <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10, color: "rgba(255,255,255,0.95)" }}><IcoPhone size={11} color="#fff" />{personal.phone}</span>}
            {personal.location && <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10, color: "rgba(255,255,255,0.95)" }}><IcoPin size={11} color="#fff" />{personal.location}</span>}
            {personal.linkedin && <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10, color: "rgba(255,255,255,0.95)" }}><IcoLinkedIn size={11} color="#fff" />{personal.linkedin}</span>}
            {personal.website && <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10, color: "rgba(255,255,255,0.95)" }}><IcoGlobe size={11} color="#fff" />{personal.website}</span>}
          </div>
        </div>
        <div style={{ padding: 3, borderRadius: "50%", background: "rgba(255,255,255,0.3)", flexShrink: 0 }}>
          <PhotoCircle url={personal.photo} name={personal.fullName} size={96} bgColor="rgba(255,255,255,0.2)" borderColor="#fff" borderWidth={2} />
        </div>
      </div>

      <div style={{ padding: "30px 40px 40px", display: "flex", gap: 34 }}>
        <div style={{ flex: 1.7, minWidth: 0 }}>
          {summary && !hidden("summary") && (
            <section style={{ marginBottom: 24 }}>
              <Head>{sw ? "Muhtasari" : "Profile"}</Head>
              <p style={{ fontSize: 11, lineHeight: 1.7, color: "#4b5563", margin: 0 }}>{summary}</p>
            </section>
          )}
          {experience?.length > 0 && !hidden("experience") && (
            <section style={{ marginBottom: 24 }}>
              <Head>{sw ? "Uzoefu wa Kazi" : "Experience"}</Head>
              <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
                {experience.map((exp) => (
                  <div key={exp.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: "#111827" }}>{exp.position}</span>
                      <span style={{ fontSize: 9.5, color: "#fff", background: grad, padding: "2px 9px", borderRadius: 20, whiteSpace: "nowrap" }}>{dateRange(exp.startDate, exp.endDate, exp.current)}</span>
                    </div>
                    <div style={{ fontSize: 11, color: primaryColor, fontWeight: 600, margin: "1px 0 5px" }}>{exp.company}{exp.location && <span style={{ color: "#9ca3af", fontWeight: 400 }}> · {exp.location}</span>}</div>
                    {exp.description && exp.description.split("\n").filter(Boolean).map((l, i) => (
                      <div key={i} style={{ display: "flex", gap: 7, marginBottom: 3 }}>
                        <span style={{ color: primaryColor, fontSize: 10, flexShrink: 0 }}>•</span>
                        <span style={{ fontSize: 10.5, color: "#4b5563", lineHeight: 1.6 }}>{l}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </section>
          )}
          {education?.length > 0 && !hidden("education") && (
            <section>
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
            </section>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {skills?.length > 0 && !hidden("skills") && (
            <section style={{ marginBottom: 24 }}>
              <Head>{sw ? "Ujuzi" : "Skills"}</Head>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {visibleSkills(skills).map((s) => (
                  <div key={s.id}>
                    <div style={{ fontSize: 10.5, color: "#374151", marginBottom: 4 }}>{s.name}</div>
                    <div style={{ height: 6, borderRadius: 3, background: "#eef0f3" }}>
                      <div style={{ width: `${(s.level / 5) * 100}%`, height: "100%", borderRadius: 3, background: grad }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
          {languages?.length > 0 && !hidden("languages") && (
            <section style={{ marginBottom: 24 }}>
              <Head>{sw ? "Lugha" : "Languages"}</Head>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {languages.map((l) => (
                  <div key={l.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "#374151", marginBottom: 3 }}><span>{l.name}</span><span style={{ color: "#9ca3af" }}>{l.proficiency}</span></div>
                    <div style={{ height: 5, borderRadius: 3, background: "#eef0f3" }}>
                      <div style={{ width: `${((PROF[l.proficiency] ?? 3) / 5) * 100}%`, height: "100%", borderRadius: 3, background: grad }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
          {certifications?.length > 0 && !hidden("certifications") && (
            <section style={{ marginBottom: 24 }}>
              <Head>{sw ? "Vyeti" : "Certifications"}</Head>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {certifications.map((c) => (
                  <div key={c.id}>
                    <div style={{ fontSize: 10.5, fontWeight: 600, color: "#111827" }}>{c.name}</div>
                    <div style={{ fontSize: 9.5, color: "#6b7280" }}>{c.issuer}{c.date ? ` · ${fmtDate(c.date)}` : ""}</div>
                  </div>
                ))}
              </div>
            </section>
          )}
          {referees?.length > 0 && !hidden("referees") && (
            <section style={{ marginBottom: 24 }}>
              <Head>{sw ? "Wadhamini" : "Referees"}</Head>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {referees.map((r) => (
                  <div key={r.id}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#111827" }}>{r.name}</div>
                    {(r.title || r.company) && <div style={{ fontSize: 10, fontWeight: 600, color: primaryColor }}>{r.title}{r.title && r.company ? " · " : ""}{r.company}</div>}
                    {r.email && <div style={{ fontSize: 9.5, color: "#6b7280" }}>{r.email}</div>}
                    {r.phone && <div style={{ fontSize: 9.5, color: "#6b7280" }}>{r.phone}</div>}
                  </div>
                ))}
              </div>
            </section>
          )}
          {hobbies && !hidden("hobbies") && (
            <section>
              <Head>{sw ? "Mapendeleo" : "Interests"}</Head>
              <p style={{ fontSize: 10.5, color: "#4b5563", lineHeight: 1.6, margin: 0 }}>{hobbies}</p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
