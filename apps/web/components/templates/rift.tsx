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

const PROF: Record<string, number> = { Native: 5, Fluent: 4, Advanced: 4, Intermediate: 3, Basic: 2 };
const GOLD = "#F2A93B";

/**
 * Rift — premium professional. A full-height colour sidebar (driven by
 * primaryColor, with a subtle depth overlay) carries a ring-framed portrait,
 * icon contacts, skill bars and language dots; the calm white main column runs
 * the name, an accent job-title pill, profile, a dated experience list and
 * education. The "designed résumé" archetype, done with restraint.
 */
export function RiftTemplate({ data, primaryColor, fontFamily, lang = "en" }: Props) {
  const { personal, summary, experience, education, skills, languages, certifications, referees, hobbies } = data;
  const sw = lang === "sw";
  const body = fontFamily || "'Inter', 'Helvetica Neue', Arial, sans-serif";
  // Respect the user's per-section visibility toggles (this template previously
  // ignored hiddenSections and always rendered every filled section).
  const hidden = (k: string) => data.hiddenSections?.includes(k) ?? false;

  const SideLabel = ({ children }: { children: React.ReactNode }) => (
    <div style={{ textTransform: "uppercase", letterSpacing: "0.16em", fontSize: 10, color: GOLD, fontWeight: 700, marginBottom: 11 }}>{children}</div>
  );
  const MainLabel = ({ children }: { children: React.ReactNode }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
      <span style={{ width: 16, height: 3, background: primaryColor, borderRadius: 2 }} />
      <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#1f2937" }}>{children}</span>
    </div>
  );

  return (
    <div style={{ width: 794, minHeight: 1123, backgroundColor: "#ffffff", fontFamily: body, color: "#1f2937", display: "flex", boxSizing: "border-box" }}>
      {/* Sidebar */}
      <aside style={{ position: "relative", width: 270, flexShrink: 0, backgroundColor: primaryColor, color: "#fff", padding: "34px 26px", boxSizing: "border-box" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(0,0,0,0.28) 100%)" }} />
        <div style={{ position: "relative" }}>
          {/* Portrait with gold ring */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 22 }}>
            <div style={{ padding: 4, borderRadius: "50%", background: `linear-gradient(135deg, ${GOLD}, ${primaryColor})` }}>
              <PhotoCircle url={personal.photo} name={personal.fullName} size={116} bgColor="rgba(0,0,0,0.25)" borderColor="rgba(255,255,255,0.9)" borderWidth={2} />
            </div>
          </div>

          <SideLabel>{sw ? "Mawasiliano" : "Contact"}</SideLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 26 }}>
            {personal.email && <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 10.5, color: "#eef2f1" }}><IcoEmail size={12} color={GOLD} /><span style={{ wordBreak: "break-all" }}>{personal.email}</span></div>}
            {personal.phone && <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 10.5, color: "#eef2f1" }}><IcoPhone size={12} color={GOLD} /><span>{personal.phone}</span></div>}
            {personal.location && <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 10.5, color: "#eef2f1" }}><IcoPin size={12} color={GOLD} /><span>{personal.location}</span></div>}
            {personal.linkedin && <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 10.5, color: "#eef2f1" }}><IcoLinkedIn size={12} color={GOLD} /><span style={{ wordBreak: "break-all" }}>{personal.linkedin}</span></div>}
            {personal.website && <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 10.5, color: "#eef2f1" }}><IcoGlobe size={12} color={GOLD} /><span style={{ wordBreak: "break-all" }}>{personal.website}</span></div>}
          </div>

          {skills?.length > 0 && !hidden("skills") && (
            <div style={{ marginBottom: 26 }}>
              <SideLabel>{sw ? "Ujuzi" : "Skills"}</SideLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {visibleSkills(skills).map((s) => (
                  <div key={s.id}>
                    <div style={{ fontSize: 10.5, color: "#eef2f1", marginBottom: 4 }}>{s.name}</div>
                    <div style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,0.16)" }}>
                      <div style={{ width: `${(s.level / 5) * 100}%`, height: "100%", borderRadius: 3, background: `linear-gradient(90deg, ${GOLD}, #ffffff)` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {languages?.length > 0 && !hidden("languages") && (
            <div style={{ marginBottom: 26 }}>
              <SideLabel>{sw ? "Lugha" : "Languages"}</SideLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {languages.map((l) => (
                  <div key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 10.5, color: "#eef2f1" }}>{l.name}</span>
                    <span style={{ display: "flex", gap: 3 }}>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <i key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: i <= (PROF[l.proficiency] ?? 3) ? GOLD : "rgba(255,255,255,0.25)" }} />
                      ))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {hobbies && !hidden("hobbies") && (
            <div>
              <SideLabel>{sw ? "Mapendeleo" : "Interests"}</SideLabel>
              <p style={{ fontSize: 10, color: "#eef2f1", lineHeight: 1.6, margin: 0 }}>{hobbies}</p>
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: "38px 34px", minWidth: 0, boxSizing: "border-box" }}>
        <div style={{ fontSize: 33, fontWeight: 800, color: primaryColor, margin: 0, letterSpacing: "-0.02em", lineHeight: 1.05 }}>{personal.fullName}</div>
        {personal.jobTitle && (
          <div style={{ display: "inline-block", marginTop: 8, fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#fff", background: primaryColor, padding: "5px 12px", borderRadius: 5 }}>{personal.jobTitle}</div>
        )}

        {summary && !hidden("summary") && (
          <section style={{ marginTop: 26 }}>
            <MainLabel>{sw ? "Muhtasari" : "Profile"}</MainLabel>
            <p style={{ fontSize: 11, lineHeight: 1.7, color: "#4b5563", margin: 0 }}>{summary}</p>
          </section>
        )}

        {experience?.length > 0 && !hidden("experience") && (
          <section style={{ marginTop: 24 }}>
            <MainLabel>{sw ? "Uzoefu wa Kazi" : "Experience"}</MainLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
              {experience.map((exp) => (
                <div key={exp.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: "#111827" }}>{exp.position}</span>
                    <span style={{ fontSize: 9.5, color: "#fff", background: primaryColor, padding: "2px 8px", borderRadius: 20, whiteSpace: "nowrap" }}>{dateRange(exp.startDate, exp.endDate, exp.current)}</span>
                  </div>
                  <div style={{ fontSize: 11, color: primaryColor, fontWeight: 600, margin: "2px 0 5px" }}>
                    {exp.company}{exp.location && <span style={{ color: "#9ca3af", fontWeight: 400 }}> · {exp.location}</span>}
                  </div>
                  {exp.description && exp.description.split("\n").filter(Boolean).map((line, i) => (
                    <div key={i} style={{ display: "flex", gap: 7, marginBottom: 3 }}>
                      <span style={{ color: primaryColor, fontSize: 10, lineHeight: 1.6, flexShrink: 0 }}>▸</span>
                      <span style={{ fontSize: 10.5, color: "#4b5563", lineHeight: 1.6 }}>{line}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </section>
        )}

        {education?.length > 0 && !hidden("education") && (
          <section style={{ marginTop: 24 }}>
            <MainLabel>{sw ? "Elimu" : "Education"}</MainLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {education.map((edu) => (
                <div key={edu.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#111827" }}>{edu.institution}</span>
                    <span style={{ fontSize: 9.5, color: "#9ca3af", whiteSpace: "nowrap" }}>{dateRange(edu.startDate, edu.endDate, false)}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#4b5563", marginTop: 1 }}>
                    {edu.degree}{edu.field ? `, ${edu.field}` : ""}{edu.grade ? <span style={{ color: primaryColor, fontWeight: 600 }}> · {edu.grade}</span> : null}
                  </div>
                  {edu.description && <p style={{ fontSize: 10, color: "#6b7280", lineHeight: 1.5, margin: "3px 0 0 0" }}>{edu.description}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {certifications?.length > 0 && !hidden("certifications") && (
          <section style={{ marginTop: 24 }}>
            <MainLabel>{sw ? "Vyeti" : "Certifications"}</MainLabel>
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
          <section style={{ marginTop: 24 }}>
            <MainLabel>{sw ? "Wadhamini" : "Referees"}</MainLabel>
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
