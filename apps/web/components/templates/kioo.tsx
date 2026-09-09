import React from "react";
import {
  IcoEmail, IcoPhone, IcoPin, IcoLinkedIn, IcoGlobe,
  fmtDate, dateRange, CVData,
  visibleSkills,
} from "@/components/templates/template-utils";
import type { Lang } from "@/lib/i18n/translations";

interface Props {
  data: CVData;
  primaryColor: string;
  fontFamily: string;
  lang?: Lang;
}

const INK = "#1E1A16";

/** Mix a hex colour toward white so any accent — including dark navies — stays
 *  legible on the charcoal info panel. Falls back to a warm light on bad input. */
function lightenOnDark(hex: string, amt = 0.5): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return "#D8CBB6";
  const h = m[1];
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  const up = (c: number) => Math.round(c + (255 - c) * amt);
  return `rgb(${up(r)}, ${up(g)}, ${up(b)})`;
}

/**
 * Kioo ("glass") — photo-forward. A real edge-to-edge portrait fills the top of
 * a full-height left column; a charcoal info panel below carries contact,
 * skills and languages. The right side leads with a bordered name plate and
 * runs summary, experience and education. The bold photo column is the
 * signature — no other template lets the portrait own the page like this.
 */
export function KiooTemplate({ data, primaryColor, fontFamily, lang = "en" }: Props) {
  const { personal, summary, experience, education, skills, languages, certifications, referees, hobbies } = data;
  const hidden = (k: string) => data.hiddenSections?.includes(k) ?? false;
  const sw = lang === "sw";
  const body = fontFamily || "'Inter', 'Helvetica Neue', Arial, sans-serif";
  const initials = personal.fullName.trim().split(/\s+/).map((n) => n[0] ?? "").join("").slice(0, 2).toUpperCase();
  const accentOnDark = lightenOnDark(primaryColor); // legible accent for the charcoal panel

  const SideHead = ({ children }: { children: React.ReactNode }) => (
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: accentOnDark, marginBottom: 10 }}>{children}</div>
  );
  const MainHead = ({ children }: { children: React.ReactNode }) => (
    <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: INK, marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ width: 22, height: 3, background: primaryColor, borderRadius: 2 }} />{children}
    </div>
  );

  return (
    <div style={{ width: 794, minHeight: 1123, backgroundColor: "#ffffff", fontFamily: body, color: "#1f2937", display: "flex", boxSizing: "border-box" }}>
      {/* Left column */}
      <div style={{ width: 272, flexShrink: 0, display: "flex", flexDirection: "column", backgroundColor: INK }}>
        {/* Full-bleed portrait */}
        <div style={{ width: "100%", height: 300, overflow: "hidden", flexShrink: 0 }}>
          {personal.photo ? (
            <img src={personal.photo} alt={personal.fullName} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", background: primaryColor, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 72, fontWeight: 800, color: "rgba(255,255,255,0.9)" }}>{initials}</span>
            </div>
          )}
        </div>

        {/* Info panel */}
        <div style={{ padding: "26px 22px", color: "#E7DFD4", flex: 1 }}>
          <SideHead>{sw ? "Mawasiliano" : "Contact"}</SideHead>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
            {personal.phone && <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 10, color: "#E7DFD4" }}><IcoPhone size={11} color={accentOnDark} /><span>{personal.phone}</span></div>}
            {personal.email && <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 10, color: "#E7DFD4" }}><IcoEmail size={11} color={accentOnDark} /><span style={{ wordBreak: "break-all" }}>{personal.email}</span></div>}
            {personal.location && <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 10, color: "#E7DFD4" }}><IcoPin size={11} color={accentOnDark} /><span>{personal.location}</span></div>}
            {personal.linkedin && <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 10, color: "#E7DFD4" }}><IcoLinkedIn size={11} color={accentOnDark} /><span style={{ wordBreak: "break-all" }}>{personal.linkedin}</span></div>}
            {personal.website && <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 10, color: "#E7DFD4" }}><IcoGlobe size={11} color={accentOnDark} /><span style={{ wordBreak: "break-all" }}>{personal.website}</span></div>}
          </div>

          {skills?.length > 0 && !hidden("skills") && (
            <div style={{ marginBottom: 24 }}>
              <SideHead>{sw ? "Ujuzi" : "Skills"}</SideHead>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {visibleSkills(skills).map((s) => (
                  <div key={s.id}>
                    <div style={{ fontSize: 10, color: "#E7DFD4", marginBottom: 3 }}>{s.name}</div>
                    <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.15)" }}>
                      <div style={{ width: `${(s.level / 5) * 100}%`, height: "100%", borderRadius: 2, background: accentOnDark }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {languages?.length > 0 && !hidden("languages") && (
            <div style={{ marginBottom: 24 }}>
              <SideHead>{sw ? "Lugha" : "Languages"}</SideHead>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {languages.map((l) => (
                  <div key={l.id} style={{ fontSize: 10, color: "#E7DFD4" }}><span style={{ fontWeight: 600 }}>{l.name}</span> <span style={{ color: "#B9AE9F" }}>— {l.proficiency}</span></div>
                ))}
              </div>
            </div>
          )}

          {hobbies && !hidden("hobbies") && (
            <div>
              <SideHead>{sw ? "Mapendeleo" : "Interests"}</SideHead>
              <p style={{ fontSize: 10, color: "#E7DFD4", lineHeight: 1.6, margin: 0 }}>{hobbies}</p>
            </div>
          )}
        </div>
      </div>

      {/* Right column */}
      <main style={{ flex: 1, padding: "36px 34px", minWidth: 0, boxSizing: "border-box" }}>
        {/* Name plate */}
        <div style={{ border: `2px solid ${INK}`, borderLeft: `6px solid ${primaryColor}`, padding: "16px 18px", marginBottom: 24 }}>
          <div style={{ fontSize: 30, fontWeight: 800, color: INK, margin: 0, letterSpacing: "0.02em", lineHeight: 1.05 }}>{personal.fullName}</div>
          {personal.jobTitle && <div style={{ fontSize: 12.5, color: primaryColor, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 5 }}>{personal.jobTitle}</div>}
        </div>

        {summary && !hidden("summary") && (
          <section style={{ marginBottom: 22 }}>
            <MainHead>{sw ? "Wasifu" : "Profile"}</MainHead>
            <p style={{ fontSize: 11, lineHeight: 1.7, color: "#4b5563", margin: 0 }}>{summary}</p>
          </section>
        )}

        {experience?.length > 0 && !hidden("experience") && (
          <section style={{ marginBottom: 22 }}>
            <MainHead>{sw ? "Uzoefu wa Kazi" : "Experience"}</MainHead>
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
                      <span style={{ color: primaryColor, fontSize: 10, lineHeight: 1.6, flexShrink: 0 }}>▪</span>
                      <span style={{ fontSize: 10.5, color: "#4b5563", lineHeight: 1.6 }}>{line}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </section>
        )}

        {education?.length > 0 && !hidden("education") && (
          <section style={{ marginBottom: 22 }}>
            <MainHead>{sw ? "Elimu" : "Education"}</MainHead>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {education.map((edu) => (
                <div key={edu.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#111827" }}>{edu.institution}</span>
                    <span style={{ fontSize: 9.5, color: "#9ca3af", whiteSpace: "nowrap" }}>{dateRange(edu.startDate, edu.endDate, false)}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#4b5563" }}>{edu.degree}{edu.field ? `, ${edu.field}` : ""}{edu.grade ? <span style={{ color: primaryColor, fontWeight: 600 }}> · {edu.grade}</span> : null}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {certifications?.length > 0 && !hidden("certifications") && (
          <section>
            <MainHead>{sw ? "Vyeti" : "Certifications"}</MainHead>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {certifications.map((c) => (
                <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: 11, color: "#111827" }}><span style={{ fontWeight: 600 }}>{c.name}</span>{c.issuer && <span style={{ color: "#6b7280" }}> · {c.issuer}</span>}</span>
                  <span style={{ fontSize: 9.5, color: "#9ca3af", whiteSpace: "nowrap" }}>{fmtDate(c.date)}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {referees?.length > 0 && !hidden("referees") && (
          <section style={{ marginTop: 22 }}>
            <MainHead>{sw ? "Wadhamini" : "Referees"}</MainHead>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {referees.map((r) => (
                <div key={r.id}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: "#111827" }}>{r.name}</div>
                  {(r.title || r.company) && (
                    <div style={{ fontSize: 10.5, color: primaryColor, fontWeight: 600, margin: "1px 0" }}>
                      {r.title}{r.title && r.company ? " · " : ""}{r.company}
                    </div>
                  )}
                  {r.email && <div style={{ fontSize: 10, color: "#6b7280" }}>{r.email}</div>}
                  {r.phone && <div style={{ fontSize: 10, color: "#6b7280" }}>{r.phone}</div>}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
