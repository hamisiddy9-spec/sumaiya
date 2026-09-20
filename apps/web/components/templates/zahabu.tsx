import React from "react";
import {
  IcoEmail, IcoPhone, IcoPin, IcoLinkedIn, IcoGlobe,
  PhotoSquare, fmtDate, dateRange, CVData,
  visibleSkills,
} from "@/components/templates/template-utils";
import type { Lang } from "@/lib/i18n/translations";

interface Props {
  data: CVData;
  primaryColor: string;
  fontFamily: string;
  lang?: Lang;
}

const INK = "#1E1A16";       // fixed dark charcoal panel
const INK_SOFT = "#B9AE9F";  // muted label on dark

const PROF: Record<string, number> = { Native: 5, Fluent: 4, Advanced: 4, Intermediate: 3, Basic: 2 };

/**
 * Zahabu ("gold") — bold branding résumé. A fixed charcoal sidebar with a
 * diamond-framed portrait lets a single swappable accent (primaryColor) do all
 * the talking: accent icon-badge section headers, accent skill bars, and an
 * accent timeline down the experience. High-contrast and confident — the
 * dark + one-bright-colour look from the strongest reference designs.
 */
export function ZahabuTemplate({ data, primaryColor, fontFamily, lang = "en" }: Props) {
  const { personal, summary, experience, education, skills, languages, certifications, referees, hobbies } = data;
  const hidden = (k: string) => data.hiddenSections?.includes(k) ?? false;
  const sw = lang === "sw";
  const body = fontFamily || "'Inter', 'Helvetica Neue', Arial, sans-serif";

  const SideHead = ({ children }: { children: React.ReactNode }) => (
    <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: primaryColor, marginBottom: 12, paddingBottom: 5, borderBottom: `1px solid ${primaryColor}55` }}>{children}</div>
  );

  const Badge = ({ children, icon }: { children: React.ReactNode; icon: React.ReactNode }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
      <span style={{ width: 24, height: 24, borderRadius: 6, background: primaryColor, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: 14, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: INK }}>{children}</span>
    </div>
  );

  const IcoBriefcase = <svg width={13} height={13} viewBox="0 0 20 20" fill="#fff"><path d="M6 5V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1h3a2 2 0 0 1 2 2v3H1V7a2 2 0 0 1 2-2h3zm2-1v1h4V4H8zM1 11h18v5a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-5z"/></svg>;
  const IcoCap = <svg width={13} height={13} viewBox="0 0 24 24" fill="#fff"><path d="M12 3 1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/></svg>;
  const IcoStar = <svg width={12} height={12} viewBox="0 0 24 24" fill="#fff"><path d="M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77 5.82 21l1.18-6.88-5-4.87 7.1-1.01L12 2z"/></svg>;
  const IcoUser = <svg width={13} height={13} viewBox="0 0 20 20" fill="#fff"><path d="M10 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 18a7 7 0 0 1 14 0H3z"/></svg>;

  return (
    <div style={{ width: 794, minHeight: 1123, backgroundColor: "#ffffff", fontFamily: body, color: "#2b2b2b", display: "flex", boxSizing: "border-box" }}>
      {/* Sidebar */}
      <aside style={{ width: 256, flexShrink: 0, backgroundColor: INK, color: "#EDE6DC", padding: "34px 24px", boxSizing: "border-box" }}>
        {/* Portrait — square with accent frame (export-safe) */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
          <div style={{ padding: 4, borderRadius: 14, background: primaryColor }}>
            <PhotoSquare url={personal.photo} name={personal.fullName} size={120} radius={10} bgColor="#2c2620" borderColor={INK} borderWidth={0} />
          </div>
        </div>

        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: "0.02em", lineHeight: 1.1 }}>{personal.fullName}</div>
          {personal.jobTitle && <div style={{ fontSize: 11, color: primaryColor, letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 5 }}>{personal.jobTitle}</div>}
        </div>

        <div style={{ height: 1, background: "rgba(255,255,255,0.12)", margin: "18px 0 22px" }} />

        {skills?.length > 0 && !hidden("skills") && (
          <div style={{ marginBottom: 24 }}>
            <SideHead>{sw ? "Ujuzi" : "Skills"}</SideHead>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {visibleSkills(skills).map((s) => (
                <div key={s.id}>
                  <div style={{ fontSize: 10.5, color: "#EDE6DC", marginBottom: 4 }}>{s.name}</div>
                  <div style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,0.14)" }}>
                    <div style={{ width: `${(s.level / 5) * 100}%`, height: "100%", borderRadius: 3, background: primaryColor }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {languages?.length > 0 && !hidden("languages") && (
          <div style={{ marginBottom: 24 }}>
            <SideHead>{sw ? "Lugha" : "Languages"}</SideHead>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {languages.map((l) => (
                <div key={l.id}>
                  <div style={{ display: "flex", fontSize: 10.5, color: "#EDE6DC", marginBottom: 4, gap: 8 }}><span style={{flex: 1, minWidth: 0, borderBottom: "1px dotted currentColor", paddingBottom: 2}}>{l.name}</span><span style={{flexShrink: 0, whiteSpace: "nowrap", color: INK_SOFT}}>{l.proficiency}</span></div>
                  <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.14)" }}>
                    <div style={{ width: `${((PROF[l.proficiency] ?? 3) / 5) * 100}%`, height: "100%", borderRadius: 2, background: primaryColor }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <SideHead>{sw ? "Mawasiliano" : "Contact"}</SideHead>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {personal.phone && <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 10.5, color: "#EDE6DC" }}><IcoPhone size={12} color={primaryColor} /><span>{personal.phone}</span></div>}
            {personal.email && <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 10.5, color: "#EDE6DC" }}><IcoEmail size={12} color={primaryColor} /><span style={{ wordBreak: "break-all" }}>{personal.email}</span></div>}
            {personal.location && <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 10.5, color: "#EDE6DC" }}><IcoPin size={12} color={primaryColor} /><span>{personal.location}</span></div>}
            {personal.linkedin && <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 10.5, color: "#EDE6DC" }}><IcoLinkedIn size={12} color={primaryColor} /><span style={{ wordBreak: "break-all" }}>{personal.linkedin}</span></div>}
            {personal.website && <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 10.5, color: "#EDE6DC" }}><IcoGlobe size={12} color={primaryColor} /><span style={{ wordBreak: "break-all" }}>{personal.website}</span></div>}
          </div>
          {hobbies && !hidden("hobbies") && (
            <div style={{ marginTop: 22 }}>
              <SideHead>{sw ? "Mapendeleo" : "Interests"}</SideHead>
              <p style={{ fontSize: 10, color: "#EDE6DC", lineHeight: 1.6, margin: 0 }}>{hobbies}</p>
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: "40px 36px", minWidth: 0, boxSizing: "border-box" }}>
        {summary && !hidden("summary") && (
          <section style={{ marginBottom: 26 }}>
            <Badge icon={IcoStar}>{sw ? "Muhtasari" : "Profile"}</Badge>
            <p style={{ fontSize: 11, lineHeight: 1.75, color: "#4b5563", margin: 0 }}>{summary}</p>
          </section>
        )}

        {experience?.length > 0 && !hidden("experience") && (
          <section style={{ marginBottom: 26 }}>
            <Badge icon={IcoBriefcase}>{sw ? "Uzoefu wa Kazi" : "Experience"}</Badge>
            <div style={{ position: "relative", paddingLeft: 22 }}>
              <div style={{ position: "absolute", left: 4, top: 4, bottom: 4, width: 2, background: primaryColor }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {experience.map((exp) => (
                  <div key={exp.id} style={{ position: "relative" }}>
                    <div style={{ position: "absolute", left: -22, top: 3, width: 10, height: 10, borderRadius: "50%", background: primaryColor, border: "2px solid #fff", boxShadow: `0 0 0 2px ${primaryColor}` }} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{exp.position}</span>
                      <span style={{ fontSize: 9.5, color: "#9ca3af", whiteSpace: "nowrap" }}>{dateRange(exp.startDate, exp.endDate, exp.current)}</span>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: primaryColor, margin: "1px 0 5px" }}>{exp.company}{exp.location && <span style={{ color: "#9ca3af", fontWeight: 400 }}> · {exp.location}</span>}</div>
                    {exp.description && exp.description.split("\n").filter(Boolean).map((line, i) => (
                      <div key={i} style={{ display: "flex", gap: 7, marginBottom: 3 }}>
                        <span style={{ color: primaryColor, fontSize: 10, lineHeight: 1.6, flexShrink: 0 }}>▪</span>
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
          <section style={{ marginBottom: 26 }}>
            <Badge icon={IcoCap}>{sw ? "Elimu" : "Education"}</Badge>
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {education.map((edu) => (
                <div key={edu.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: "#111827" }}>{edu.institution}</span>
                    <span style={{ fontSize: 9.5, color: "#9ca3af", whiteSpace: "nowrap" }}>{dateRange(edu.startDate, edu.endDate, false)}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#4b5563", marginTop: 1 }}>{edu.degree}{edu.field ? `, ${edu.field}` : ""}{edu.grade ? <span style={{ color: primaryColor, fontWeight: 600 }}> · {edu.grade}</span> : null}</div>
                  {edu.description && <p style={{ fontSize: 10, color: "#6b7280", lineHeight: 1.5, margin: "3px 0 0 0" }}>{edu.description}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {certifications?.length > 0 && !hidden("certifications") && (
          <section style={{ marginBottom: 26 }}>
            <Badge icon={IcoStar}>{sw ? "Vyeti" : "Certifications"}</Badge>
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
            <Badge icon={IcoUser}>{sw ? "Wadhamini" : "Referees"}</Badge>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
              {referees.map((r) => (
                <div key={r.id} style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#111827" }}>{r.name}</div>
                  {(r.title || r.company) && <div style={{ fontSize: 10.5, fontWeight: 600, color: primaryColor }}>{r.title}{r.title && r.company ? " · " : ""}{r.company}</div>}
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
