import React from "react";
import { dateRange, fmtDate, CVData, visibleSkills, CvPhoto } from "@/components/templates/template-utils";
import type { Lang } from "@/lib/i18n/translations";

interface Props {
  data: CVData;
  primaryColor: string;
  fontFamily: string;
  lang?: Lang;
}

const BG = "#0D1117";
const PANEL = "#161B22";
const TXT = "#C9D1D9";
const DIM = "#8B949E";
const FAINT = "#30363D";
const MONO = "'JetBrains Mono', 'Fira Code', ui-monospace, 'SF Mono', Menlo, Consolas, monospace";

const PROF: Record<string, number> = { Native: 5, Fluent: 4, Advanced: 4, Intermediate: 3, Basic: 2 };

/**
 * Console — a terminal résumé for developers. Full-dark window chrome, real
 * monospace, section headers as `## comments`, ascii skill meters and `>`
 * prompts. Fully built from solid fills + text (no clip-path/filter), so it
 * survives the raster PDF export intact. Loud, native, and unmistakably tech.
 */
export function ConsoleTemplate({ data, primaryColor, fontFamily, lang = "en" }: Props) {
  const { personal, summary, experience, education, skills, languages, certifications, referees, hobbies } = data;
  const hidden = (k: string) => data.hiddenSections?.includes(k) ?? false;
  const sw = lang === "sw";
  const accent = primaryColor;
  // fontFamily is ignored on purpose — the monospace identity is the whole point.
  void fontFamily;

  const H = ({ children }: { children: React.ReactNode }) => (
    <div style={{ fontSize: 13, fontWeight: 700, color: accent, margin: "22px 0 11px" }}>## {children}</div>
  );

  const Bar = ({ level }: { level: number }) => {
    const n = Math.max(0, Math.min(10, Math.round((level / 5) * 10)));
    return (
      <span>
        <span style={{ color: accent }}>{"█".repeat(n)}</span>
        <span style={{ color: FAINT }}>{"█".repeat(10 - n)}</span>
      </span>
    );
  };

  return (
    <div style={{ width: 794, minHeight: 1123, backgroundColor: BG, fontFamily: MONO, color: TXT, boxSizing: "border-box" }}>
      {/* Window chrome */}
      <div style={{ background: PANEL, borderBottom: `1px solid ${FAINT}`, display: "flex", alignItems: "center", padding: "10px 16px", gap: 8 }}>
        <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#FF5F56" }} />
        <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#FFBD2E" }} />
        <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#27C93F" }} />
        <span style={{ flex: 1, textAlign: "center", fontSize: 10.5, color: DIM }}>
          ~/cv/{(personal.fullName || "resume").toLowerCase().replace(/\s+/g, "-")}.md
        </span>
        <span style={{ width: 33 }} />
      </div>

      <div style={{ padding: "26px 30px 40px" }}>
        {/* Name / title */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <CvPhoto url={personal.photo} name={personal.fullName} size={80} radius={8} borderColor={FAINT} borderWidth={1} />
          <div style={{ fontSize: 30, fontWeight: 700, color: "#fff", letterSpacing: "-0.01em", minWidth: 0 }}>
            <span style={{ color: accent }}># </span>{personal.fullName}
          </div>
        </div>
        {personal.jobTitle && <div style={{ fontSize: 13, color: DIM, marginTop: 4 }}><span style={{ color: accent }}>&gt; </span>{personal.jobTitle}</div>}

        {/* Contact as declarations */}
        <div style={{ marginTop: 14, fontSize: 10.5, lineHeight: 1.9 }}>
          {personal.email && <div><span style={{ color: accent }}>email</span><span style={{ color: DIM }}>{"   = "}</span>&quot;{personal.email}&quot;</div>}
          {personal.phone && <div><span style={{ color: accent }}>phone</span><span style={{ color: DIM }}>{"   = "}</span>&quot;{personal.phone}&quot;</div>}
          {personal.location && <div><span style={{ color: accent }}>location</span><span style={{ color: DIM }}>{"= "}</span>&quot;{personal.location}&quot;</div>}
          {personal.linkedin && <div><span style={{ color: accent }}>linkedin</span><span style={{ color: DIM }}>{"= "}</span>&quot;{personal.linkedin}&quot;</div>}
          {personal.website && <div><span style={{ color: accent }}>web</span><span style={{ color: DIM }}>{"     = "}</span>&quot;{personal.website}&quot;</div>}
        </div>

        {summary && !hidden("summary") && (
          <>
            <H>{sw ? "muhtasari" : "summary"}</H>
            <p style={{ fontSize: 11, lineHeight: 1.7, color: TXT, margin: 0 }}>{summary}</p>
          </>
        )}

        {experience?.length > 0 && !hidden("experience") && (
          <>
            <H>{sw ? "uzoefu_wa_kazi" : "experience"}</H>
            <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
              {experience.map((exp) => (
                <div key={exp.id}>
                  <div style={{ fontSize: 12.5, color: "#fff", fontWeight: 700 }}>
                    <span style={{ color: accent }}>▸ </span>{exp.position} <span style={{ color: DIM, fontWeight: 400 }}>@ {exp.company}</span>
                  </div>
                  <div style={{ fontSize: 10, color: DIM, margin: "2px 0 5px 14px" }}>{"// "}{dateRange(exp.startDate, exp.endDate, exp.current)}{exp.location ? ` · ${exp.location}` : ""}</div>
                  {exp.description && exp.description.split("\n").filter(Boolean).map((l, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, marginLeft: 14, marginBottom: 2 }}>
                      <span style={{ color: accent, flexShrink: 0 }}>-</span>
                      <span style={{ fontSize: 10.5, color: TXT, lineHeight: 1.55 }}>{l}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </>
        )}

        {skills?.length > 0 && !hidden("skills") && (
          <>
            <H>{sw ? "ujuzi" : "skills"}</H>
            <div style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: 11 }}>
              {visibleSkills(skills).map((s) => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 150, color: TXT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</span>
                  <Bar level={s.level} />
                </div>
              ))}
            </div>
          </>
        )}

        {/* education + languages side by side */}
        <div style={{ display: "flex", gap: 30, alignItems: "flex-start" }}>
          {education?.length > 0 && !hidden("education") && (
            <div style={{ flex: 1.3, minWidth: 0 }}>
              <H>{sw ? "elimu" : "education"}</H>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {education.map((edu) => (
                  <div key={edu.id}>
                    <div style={{ fontSize: 11.5, color: "#fff", fontWeight: 700 }}>{edu.institution}</div>
                    <div style={{ fontSize: 10.5, color: TXT }}>{edu.degree}{edu.field ? `, ${edu.field}` : ""}</div>
                    <div style={{ fontSize: 9.5, color: DIM }}>{"// "}{dateRange(edu.startDate, edu.endDate, false)}{edu.grade ? ` · ${edu.grade}` : ""}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {languages?.length > 0 && !hidden("languages") && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <H>{sw ? "lugha" : "languages"}</H>
              <div style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: 10.5 }}>
                {languages.map((l) => (
                  <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 90, color: TXT }}>{l.name}</span>
                    <Bar level={PROF[l.proficiency] ?? 3} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {certifications?.length > 0 && !hidden("certifications") && (
          <>
            <H>{sw ? "vyeti" : "certifications"}</H>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 10.5 }}>
              {certifications.map((c) => (
                <div key={c.id}><span style={{ color: accent }}>- </span><span style={{ color: "#fff" }}>{c.name}</span>{c.issuer ? <span style={{ color: DIM }}> · {c.issuer}</span> : null}{c.date ? <span style={{ color: DIM }}> · {fmtDate(c.date)}</span> : null}</div>
              ))}
            </div>
          </>
        )}

        {referees?.length > 0 && !hidden("referees") && (
          <>
            <H>{sw ? "wadhamini" : "referees"}</H>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16, fontSize: 10.5 }}>
              {referees.map((r) => (
                <div key={r.id} style={{ minWidth: 200, flex: 1 }}>
                  <div style={{ color: "#fff", fontWeight: 700 }}><span style={{ color: accent }}>- </span>{r.name}</div>
                  {(r.title || r.company) && <div style={{ color: accent, marginLeft: 14 }}>{r.title}{r.title && r.company ? " · " : ""}{r.company}</div>}
                  {r.email && <div style={{ color: DIM, marginLeft: 14 }}>{r.email}</div>}
                  {r.phone && <div style={{ color: DIM, marginLeft: 14 }}>{r.phone}</div>}
                </div>
              ))}
            </div>
          </>
        )}

        {hobbies && !hidden("hobbies") && (
          <>
            <H>{sw ? "mapendeleo" : "interests"}</H>
            <p style={{ fontSize: 10.5, color: TXT, lineHeight: 1.6, margin: 0 }}>{hobbies}</p>
          </>
        )}
      </div>
    </div>
  );
}
