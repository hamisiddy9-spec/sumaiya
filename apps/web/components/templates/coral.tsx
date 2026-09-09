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

const IcoUser = <svg width={11} height={11} viewBox="0 0 20 20" fill="#fff"><path d="M10 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 18a7 7 0 0 1 14 0H3z"/></svg>;
const IcoBriefcase = <svg width={11} height={11} viewBox="0 0 20 20" fill="#fff"><path d="M6 5V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1h3a2 2 0 0 1 2 2v3H1V7a2 2 0 0 1 2-2h3zm2-1v1h4V4H8zM1 11h18v5a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-5z"/></svg>;
const IcoCap = <svg width={11} height={11} viewBox="0 0 24 24" fill="#fff"><path d="M12 3 1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/></svg>;
const IcoStar = <svg width={11} height={11} viewBox="0 0 24 24" fill="#fff"><path d="M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77 5.82 21l1.18-6.88-5-4.87 7.1-1.01L12 2z"/></svg>;
const IcoHeart = <svg width={11} height={11} viewBox="0 0 20 20" fill="#fff"><path d="M10 17s-6-3.9-8.2-7.4C.4 7 1.3 4 4 4c1.6 0 2.8 1 3.6 2C8.4 5 9.6 4 11.2 4c2.7 0 3.6 3 2.2 5.6C13.2 12.4 10 17 10 17z"/></svg>;

/**
 * Coral — colour-forward. Every section is introduced by a filled accent header
 * bar with an icon, tying a photo sidebar and a timelined main column together
 * under one bright hue (swappable via primaryColor). The friendly, banner-led
 * look from popular builders — warm and approachable.
 */
export function CoralTemplate({ data, primaryColor, fontFamily, lang = "en" }: Props) {
  const { personal, summary, experience, education, skills, languages, certifications, referees, hobbies } = data;
  const hidden = (k: string) => data.hiddenSections?.includes(k) ?? false;
  const sw = lang === "sw";
  const body = fontFamily || "'Inter', 'Helvetica Neue', Arial, sans-serif";

  const Bar = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, background: primaryColor, borderRadius: 6, padding: "6px 11px", marginBottom: 11 }}>
      <span style={{ display: "flex", alignItems: "center" }}>{icon}</span>
      <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#fff" }}>{children}</span>
    </div>
  );

  return (
    <div style={{ width: 794, minHeight: 1123, backgroundColor: "#ffffff", fontFamily: body, color: "#1f2937", display: "flex", boxSizing: "border-box" }}>
      {/* Sidebar */}
      <aside style={{ width: 250, flexShrink: 0, background: "#faf7f5", padding: "30px 22px", boxSizing: "border-box" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
          <div style={{ padding: 3, borderRadius: "50%", background: primaryColor }}>
            <PhotoCircle url={personal.photo} name={personal.fullName} size={116} bgColor={primaryColor} borderColor="#fff" borderWidth={2} />
          </div>
        </div>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 19, fontWeight: 800, color: "#111827", lineHeight: 1.1 }}>{personal.fullName}</div>
          {personal.jobTitle && <div style={{ fontSize: 11, color: primaryColor, fontWeight: 600, letterSpacing: "0.04em", marginTop: 4 }}>{personal.jobTitle}</div>}
        </div>

        <Bar icon={IcoUser}>{sw ? "Mawasiliano" : "Contact"}</Bar>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
          {personal.phone && <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 10, color: "#4b5563" }}><IcoPhone size={11} color={primaryColor} /><span>{personal.phone}</span></div>}
          {personal.email && <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 10, color: "#4b5563" }}><IcoEmail size={11} color={primaryColor} /><span style={{ wordBreak: "break-all" }}>{personal.email}</span></div>}
          {personal.location && <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 10, color: "#4b5563" }}><IcoPin size={11} color={primaryColor} /><span>{personal.location}</span></div>}
          {personal.linkedin && <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 10, color: "#4b5563" }}><IcoLinkedIn size={11} color={primaryColor} /><span style={{ wordBreak: "break-all" }}>{personal.linkedin}</span></div>}
          {personal.website && <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 10, color: "#4b5563" }}><IcoGlobe size={11} color={primaryColor} /><span style={{ wordBreak: "break-all" }}>{personal.website}</span></div>}
        </div>

        {skills?.length > 0 && !hidden("skills") && (
          <div style={{ marginBottom: 20 }}>
            <Bar icon={IcoStar}>{sw ? "Ujuzi" : "Skills"}</Bar>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {visibleSkills(skills).map((s) => (
                <div key={s.id}>
                  <div style={{ fontSize: 10, color: "#374151", marginBottom: 3 }}>{s.name}</div>
                  <div style={{ height: 5, borderRadius: 3, background: `${primaryColor}22` }}>
                    <div style={{ width: `${(s.level / 5) * 100}%`, height: "100%", borderRadius: 3, background: primaryColor }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {languages?.length > 0 && !hidden("languages") && (
          <div style={{ marginBottom: 20 }}>
            <Bar icon={IcoStar}>{sw ? "Lugha" : "Languages"}</Bar>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {languages.map((l) => (
                <div key={l.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#374151", marginBottom: 3 }}><span>{l.name}</span><span style={{ color: "#9ca3af" }}>{l.proficiency}</span></div>
                  <div style={{ height: 4, borderRadius: 2, background: `${primaryColor}22` }}>
                    <div style={{ width: `${((PROF[l.proficiency] ?? 3) / 5) * 100}%`, height: "100%", borderRadius: 2, background: primaryColor }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {hobbies && !hidden("hobbies") && (
          <div>
            <Bar icon={IcoHeart}>{sw ? "Mapendeleo" : "Interests"}</Bar>
            <p style={{ fontSize: 10, color: "#4b5563", lineHeight: 1.6, margin: 0 }}>{hobbies}</p>
          </div>
        )}
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: "30px 32px", minWidth: 0, boxSizing: "border-box" }}>
        {summary && !hidden("summary") && (
          <section style={{ marginBottom: 22 }}>
            <Bar icon={IcoUser}>{sw ? "Wasifu" : "Profile"}</Bar>
            <p style={{ fontSize: 11, lineHeight: 1.7, color: "#4b5563", margin: 0 }}>{summary}</p>
          </section>
        )}

        {experience?.length > 0 && !hidden("experience") && (
          <section style={{ marginBottom: 22 }}>
            <Bar icon={IcoBriefcase}>{sw ? "Uzoefu wa Kazi" : "Work Experience"}</Bar>
            <div style={{ position: "relative", paddingLeft: 20 }}>
              <div style={{ position: "absolute", left: 4, top: 4, bottom: 4, width: 2, background: `${primaryColor}55` }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {experience.map((exp) => (
                  <div key={exp.id} style={{ position: "relative" }}>
                    <div style={{ position: "absolute", left: -20, top: 3, width: 9, height: 9, borderRadius: "50%", background: primaryColor, border: "2px solid #fff", boxShadow: `0 0 0 1.5px ${primaryColor}` }} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: "#111827" }}>{exp.position}</span>
                      <span style={{ fontSize: 9.5, color: "#9ca3af", whiteSpace: "nowrap" }}>{dateRange(exp.startDate, exp.endDate, exp.current)}</span>
                    </div>
                    <div style={{ fontSize: 11, color: primaryColor, fontWeight: 600, margin: "1px 0 5px" }}>{exp.company}{exp.location && <span style={{ color: "#9ca3af", fontWeight: 400 }}> · {exp.location}</span>}</div>
                    {exp.description && exp.description.split("\n").filter(Boolean).map((line, i) => (
                      <div key={i} style={{ display: "flex", gap: 7, marginBottom: 3 }}>
                        <span style={{ color: primaryColor, fontSize: 10, lineHeight: 1.6, flexShrink: 0 }}>›</span>
                        <span style={{ fontSize: 10.5, color: "#4b5563", lineHeight: 1.6 }}>{line}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {education?.length > 0 && !hidden("education") && (
          <section style={{ marginBottom: 22 }}>
            <Bar icon={IcoCap}>{sw ? "Elimu" : "Education"}</Bar>
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

        {certifications?.length > 0 && !hidden("certifications") && (
          <section>
            <Bar icon={IcoStar}>{sw ? "Vyeti" : "Certifications"}</Bar>
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
          <section>
            <Bar icon={IcoUser}>{sw ? "Wadhamini" : "Referees"}</Bar>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
              {referees.map((r) => (
                <div key={r.id} style={{ minWidth: 180, flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#111827" }}>{r.name}</div>
                  {(r.title || r.company) && <div style={{ fontSize: 10, color: "#6b7280" }}>{r.title}{r.title && r.company ? " · " : ""}{r.company}</div>}
                  {r.email && <div style={{ fontSize: 9.5, color: "#9ca3af" }}>{r.email}</div>}
                  {r.phone && <div style={{ fontSize: 9.5, color: "#9ca3af" }}>{r.phone}</div>}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
