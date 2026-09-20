/**
 * Universal section renderers — the HTML port of
 * apps/web/components/templates/engine/sections.tsx.
 *
 * Each renderer is pure: tokens + normalised data in, an HTML string out.
 * `sectionStyle` controls the heading's visual treatment; the layout module
 * decides where the section lands on the page.
 *
 * Faithful to the web on purpose: same nine heading styles, same five skill
 * displays, same five experience variants, same spacing keys. If the web engine
 * changes, change this file with it — the sync test in
 * apps/native/src/lib/cv-engine/sections.test.ts guards the section keys.
 */

import type { DesignTokens } from "./tokens";
import type { EngineView, VExperience, VPersonal } from "./view";
import type { ExperienceVariant, Lang, SectionStyle, SkillDisplay } from "./types";
import { dateRange, el, esc, fmtDate, join, tx } from "./html";
import { icon } from "./icons";

// ─── Localised headings ───────────────────────────────────────────────────────
// Same wording as the web engine, so a Swahili-first user gets Swahili headings
// on engine templates too.

const HEADINGS: Record<string, { en: string; sw: string }> = {
  summary: { en: "Professional Summary", sw: "Muhtasari" },
  experience: { en: "Work Experience", sw: "Uzoefu wa Kazi" },
  education: { en: "Education", sw: "Elimu" },
  skills: { en: "Skills", sw: "Ujuzi" },
  projects: { en: "Projects", sw: "Miradi" },
  languages: { en: "Languages", sw: "Lugha" },
  certifications: { en: "Certifications", sw: "Vyeti" },
  referees: { en: "Referees", sw: "Wadhamini" },
  hobbies: { en: "Interests", sw: "Mapendeleo" },
  contact: { en: "Contact", sw: "Mawasiliano" },
};

export function heading(key: string, lang: Lang = "en"): string {
  const h = HEADINGS[key];
  if (!h) return key;
  return lang === "sw" ? h.sw : h.en;
}

// ─── Section label ────────────────────────────────────────────────────────────

export function sectionLabel(
  label: string,
  tokens: DesignTokens,
  style: SectionStyle = "underline",
): string {
  if (style === "none" || !label) return "";

  const base: Record<string, string | number> = {
    fontSize: tokens.font.sectionLabel,
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    fontFamily: tokens.fontFamily,
  };

  if (style === "underline") {
    return el(
      "div",
      { marginBottom: 9 },
      tx(label, { ...base, color: tokens.color.text }) +
        el("div", {
          height: 1,
          backgroundColor: tokens.color.accent,
          opacity: 0.5,
          marginTop: 3,
        }),
    );
  }

  if (style === "tag") {
    return el("div", { ...base, color: tokens.color.accent, marginBottom: 8 }, esc(label));
  }

  if (style === "box") {
    return el(
      "div",
      { marginBottom: 9 },
      tx(label, {
        ...base,
        color: tokens.color.onAccent,
        backgroundColor: tokens.color.accent,
        padding: "2px 8px",
        borderRadius: 3,
        display: "inline-block",
      }),
    );
  }

  if (style === "line-accent") {
    return el(
      "div",
      { display: "flex", alignItems: "center", gap: 7, marginBottom: 9 },
      el("div", {
        width: 3,
        height: 13,
        backgroundColor: tokens.color.accent,
        borderRadius: 2,
        flexShrink: 0,
      }) + tx(label, { ...base, color: tokens.color.text }),
    );
  }

  if (style === "dots") {
    return el(
      "div",
      { display: "flex", alignItems: "center", gap: 6, marginBottom: 9 },
      el("div", {
        width: 6,
        height: 6,
        borderRadius: "50%",
        backgroundColor: tokens.color.accent,
        flexShrink: 0,
      }) + tx(label, { ...base, color: tokens.color.muted }),
    );
  }

  if (style === "pill") {
    return el(
      "div",
      { marginBottom: 10 },
      tx(label, {
        ...base,
        color: tokens.color.accent,
        border: `1.5px solid ${tokens.color.accent}`,
        borderRadius: 99,
        padding: "2px 12px",
        display: "inline-block",
        letterSpacing: "0.1em",
      }),
    );
  }

  if (style === "ruled") {
    return el(
      "div",
      { marginBottom: 10 },
      el("div", { height: 1, backgroundColor: tokens.color.faint, marginBottom: 5 }) +
        tx(label, { ...base, color: tokens.color.muted }) +
        el("div", { height: 1, backgroundColor: tokens.color.accent, marginTop: 4, opacity: 0.6 }),
    );
  }

  if (style === "numbered") {
    return el(
      "div",
      { display: "flex", alignItems: "center", gap: 8, marginBottom: 9 },
      el(
        "div",
        {
          width: 18,
          height: 18,
          borderRadius: "50%",
          backgroundColor: tokens.color.accent,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        },
        `<span style="font-size:8px;font-weight:800;color:${tokens.color.onAccent};font-family:${tokens.fontFamily}">§</span>`,
      ) + tx(label, { ...base, color: tokens.color.text }),
    );
  }

  return "";
}

// ─── Contact block ────────────────────────────────────────────────────────────

function contactItem(svg: string, text: string, color: string, fontSize: number): string {
  if (!text) return "";
  return el(
    "div",
    { display: "flex", alignItems: "center", gap: 5, fontFamily: "inherit" },
    svg + tx(text, { fontSize, color, fontFamily: "inherit", lineHeight: 1.35 }),
  );
}

export function contactBlock(
  personal: VPersonal,
  tokens: DesignTokens,
  iconColor: string,
  vertical = true,
): string {
  const items: { name: "email" | "phone" | "pin" | "linkedin" | "globe"; text: string }[] = [
    { name: "email", text: personal.email },
    { name: "phone", text: personal.phone },
    { name: "pin", text: personal.location },
    { name: "linkedin", text: personal.linkedin },
    { name: "globe", text: personal.website },
  ].filter((i) => i.text.trim() !== "") as typeof items;

  if (!items.length) return "";

  const body = items
    .map((i) => contactItem(icon(i.name, 9, iconColor), i.text, iconColor, tokens.font.meta))
    .join("");

  if (vertical) {
    return el("div", { display: "flex", flexDirection: "column", gap: 5 }, body);
  }
  return el("div", { display: "flex", flexWrap: "wrap", gap: "3px 14px" }, body);
}

// ─── Summary ──────────────────────────────────────────────────────────────────

export function summarySection(
  view: EngineView,
  tokens: DesignTokens,
  style: SectionStyle,
  lang: Lang = "en",
): string {
  if (!view.summary || view.hiddenSections.includes("summary")) return "";
  return el(
    "div",
    {},
    sectionLabel(heading("summary", lang), tokens, style) +
      `<p style="font-size:${tokens.font.body}px;color:${tokens.color.sub};line-height:${tokens.space.line};margin:0;font-family:${tokens.fontFamily}">${esc(view.summary)}</p>`,
  );
}

// ─── Experience ───────────────────────────────────────────────────────────────

const CLAMP_4 =
  "display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden";
const CLAMP_3 =
  "display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden";

export function experienceSection(
  view: EngineView,
  tokens: DesignTokens,
  style: SectionStyle,
  lang: Lang = "en",
  showTimeline = false,
  variant: ExperienceVariant = "default",
): string {
  const items = view.hiddenSections.includes("experience") ? [] : view.experience;
  if (!items.length) return "";

  const label = sectionLabel(heading("experience", lang), tokens, style);
  const range = (e: VExperience) =>
    dateRange(e.startDate, e.endDate, lang === "sw" ? "Sasa" : "Present", lang);

  const roleTitle = (e: VExperience) =>
    `<div style="font-size:${tokens.font.roleTitle}px;font-weight:700;color:${tokens.color.text};font-family:${tokens.fontFamily}">${esc(e.position)}</div>`;

  const orgLine = (e: VExperience) =>
    `<div style="font-size:${tokens.font.orgName}px;color:${tokens.color.sub};margin-top:1px;font-family:${tokens.fontFamily}">${esc(e.company)}${
      e.location ? esc(` · ${e.location}`) : ""
    }</div>`;

  const dateCell = (e: VExperience, extra = "") =>
    `<div style="font-size:${tokens.font.meta}px;color:${tokens.color.muted};white-space:nowrap;font-family:${tokens.fontFamily};flex-shrink:0;${extra}">${esc(range(e))}</div>`;

  // ── card ────────────────────────────────────────────────────────────────────
  if (variant === "card") {
    const body = items
      .map((e) =>
        el(
          "div",
          {
            padding: "8px 10px 8px 13px",
            backgroundColor: tokens.color.faint,
            borderRadius: 5,
            borderLeft: `3px solid ${tokens.color.accent}`,
          },
          el(
            "div",
            {
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 6,
            },
            `<div style="flex:1;min-width:0">${roleTitle(e)}${orgLine(e)}</div>` + dateCell(e),
          ) +
            (e.description
              ? `<p style="font-size:${tokens.font.body}px;color:${tokens.color.muted};margin:4px 0 0;line-height:${tokens.space.line};font-family:${tokens.fontFamily};${CLAMP_4}">${esc(e.description)}</p>`
              : ""),
        ),
      )
      .join("");
    return el(
      "div",
      {},
      label + el("div", { display: "flex", flexDirection: "column", gap: tokens.space.entry + 3 }, body),
    );
  }

  // ── compact ─────────────────────────────────────────────────────────────────
  if (variant === "compact") {
    const body = items
      .map((e) =>
        el(
          "div",
          {},
          el(
            "div",
            { display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 6 },
            `<span style="font-size:${tokens.font.roleTitle}px;font-weight:700;color:${tokens.color.text};font-family:${tokens.fontFamily}">${esc(e.position)}${
              e.company
                ? `<span style="font-weight:400;color:${tokens.color.sub}"> · ${esc(e.company)}</span>`
                : ""
            }</span>` +
              `<span style="font-size:${tokens.font.meta}px;color:${tokens.color.muted};white-space:nowrap;font-family:${tokens.fontFamily};flex-shrink:0">${esc(range(e))}</span>`,
          ) +
            (e.description
              ? `<p style="font-size:${tokens.font.body - 0.5}px;color:${tokens.color.muted};margin:2px 0 0;line-height:1.4;font-family:${tokens.fontFamily};${CLAMP_3}">${esc(e.description)}</p>`
              : ""),
        ),
      )
      .join("");
    return el(
      "div",
      {},
      label + el("div", { display: "flex", flexDirection: "column", gap: tokens.space.entry - 2 }, body),
    );
  }

  // ── timeline-v2 ─────────────────────────────────────────────────────────────
  if (variant === "timeline-v2") {
    const present = lang === "sw" ? "Sasa" : "Present";
    const body = items
      .map((e, idx) => {
        const top = e.current ? present : fmtDate(e.endDate, lang);
        const dateCol = el(
          "div",
          { width: 60, flexShrink: 0, paddingTop: 2, textAlign: "right", paddingRight: 10 },
          `<span style="font-size:${tokens.font.meta - 0.5}px;color:${tokens.color.accent};font-family:${tokens.fontFamily};line-height:1.3;display:block">${esc(top)}</span>` +
            `<span style="font-size:${tokens.font.meta - 1}px;color:${tokens.color.muted};font-family:${tokens.fontFamily}">${esc(
              fmtDate(e.startDate, lang),
            )}</span>`,
        );
        const track = el(
          "div",
          {
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            flexShrink: 0,
            width: 14,
          },
          el("div", {
            width: 10,
            height: 10,
            borderRadius: "50%",
            backgroundColor: tokens.color.accent,
            flexShrink: 0,
            border: `2px solid ${tokens.color.accent}`,
            marginTop: 2,
          }) +
            (idx < items.length - 1
              ? el("div", {
                  width: 2,
                  flex: 1,
                  backgroundColor: tokens.color.accent + "25",
                  minHeight: 24,
                  borderRadius: 1,
                })
              : ""),
        );
        const content = el(
          "div",
          { flex: 1, minWidth: 0, paddingLeft: 10 },
          roleTitle(e) +
            orgLine(e) +
            (e.description
              ? `<p style="font-size:${tokens.font.body}px;color:${tokens.color.muted};margin:4px 0 0;line-height:${tokens.space.line};font-family:${tokens.fontFamily}">${esc(e.description)}</p>`
              : ""),
        );
        return el("div", { display: "flex", gap: 0 }, dateCol + track + content);
      })
      .join("");
    return el(
      "div",
      {},
      label + el("div", { display: "flex", flexDirection: "column", gap: tokens.space.entry + 2 }, body),
    );
  }

  // ── table ───────────────────────────────────────────────────────────────────
  if (variant === "table") {
    const body = items
      .map((e, idx) => {
        const firstLine = e.description
          ? e.description.split("\n")[0].replace(/^[-•▸]\s*/, "")
          : "";
        return el(
          "div",
          {
            display: "grid",
            gridTemplateColumns: "1fr auto",
            padding: "7px 10px",
            backgroundColor: idx % 2 === 0 ? "#fff" : tokens.color.faint,
            gap: 8,
          },
          `<div><span style="font-size:${tokens.font.roleTitle}px;font-weight:700;color:${tokens.color.text};font-family:${tokens.fontFamily}">${esc(e.position)}</span>` +
            `<span style="font-size:${tokens.font.orgName}px;color:${tokens.color.sub};font-family:${tokens.fontFamily}">${
              e.company ? esc(` @ ${e.company}`) : ""
            }</span>` +
            (firstLine
              ? `<p style="font-size:${tokens.font.body - 0.5}px;color:${tokens.color.muted};margin:2px 0 0;line-height:1.4;font-family:${tokens.fontFamily}">${esc(firstLine)}</p>`
              : "") +
            `</div>` +
            `<div style="font-size:${tokens.font.meta}px;color:${tokens.color.muted};white-space:nowrap;font-family:${tokens.fontFamily};padding-top:2px">${esc(range(e))}</div>`,
        );
      })
      .join("");
    return el(
      "div",
      {},
      label +
        el(
          "div",
          { borderRadius: 4, overflow: "hidden", border: `1px solid ${tokens.color.faint}` },
          body,
        ),
    );
  }

  // ── default (optional left timeline) ────────────────────────────────────────
  const body = items
    .map((e, idx) => {
      const gutter = showTimeline
        ? el(
            "div",
            {
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              flexShrink: 0,
              width: 12,
            },
            el("div", {
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: tokens.color.accent,
              flexShrink: 0,
              marginTop: 3,
            }) +
              (idx < items.length - 1
                ? el("div", {
                    width: 1,
                    flex: 1,
                    backgroundColor: tokens.color.accent + "30",
                    minHeight: 20,
                  })
                : ""),
          )
        : "";
      const content = el(
        "div",
        { flex: 1, minWidth: 0 },
        el(
          "div",
          { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 },
          `<div style="flex:1;min-width:0">${roleTitle(e)}${orgLine(e)}</div>` + dateCell(e),
        ) +
          (e.description
            ? `<p style="font-size:${tokens.font.body}px;color:${tokens.color.muted};margin:4px 0 0;line-height:${tokens.space.line};font-family:${tokens.fontFamily};${CLAMP_4}">${esc(e.description)}</p>`
            : ""),
      );
      return el("div", { display: "flex", gap: showTimeline ? 10 : 0 }, gutter + content);
    })
    .join("");

  return el(
    "div",
    {},
    label + el("div", { display: "flex", flexDirection: "column", gap: tokens.space.entry }, body),
  );
}

// ─── Education ────────────────────────────────────────────────────────────────

export function educationSection(
  view: EngineView,
  tokens: DesignTokens,
  style: SectionStyle,
  lang: Lang = "en",
): string {
  const items = view.hiddenSections.includes("education") ? [] : view.education;
  if (!items.length) return "";

  const body = items
    .map((e) =>
      el(
        "div",
        { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 },
        `<div style="flex:1;min-width:0"><div style="font-size:${tokens.font.roleTitle}px;font-weight:700;color:${tokens.color.text};font-family:${tokens.fontFamily}">${esc(
          e.degree,
        )}${e.field ? esc(` ${lang === "sw" ? "katika" : "in"} ${e.field}`) : ""}</div>` +
          `<div style="font-size:${tokens.font.orgName}px;color:${tokens.color.sub};font-family:${tokens.fontFamily}">${esc(e.institution)}</div>` +
          (e.grade
            ? `<div style="font-size:${tokens.font.meta}px;color:${tokens.color.muted};font-family:${tokens.fontFamily}">${esc(e.grade)}</div>`
            : "") +
          `</div>` +
          `<div style="font-size:${tokens.font.meta}px;color:${tokens.color.muted};white-space:nowrap;font-family:${tokens.fontFamily};flex-shrink:0">${esc(
            dateRange(e.startDate, e.endDate, "", lang),
          )}</div>`,
      ),
    )
    .join("");

  return el(
    "div",
    {},
    sectionLabel(heading("education", lang), tokens, style) +
      el("div", { display: "flex", flexDirection: "column", gap: tokens.space.entry }, body),
  );
}

// ─── Skills ───────────────────────────────────────────────────────────────────

/** A filled/empty bar — the web's SkillBar. */
function skillBar(level: number, color: string, bg: string, width: number, height: number): string {
  const pct = Math.max(0, Math.min(100, (level / 5) * 100));
  return el(
    "div",
    { width, height, backgroundColor: bg, borderRadius: height, overflow: "hidden", flexShrink: 0 },
    el("div", { width: `${pct}%`, height: "100%", backgroundColor: color, borderRadius: height }),
  );
}

/** Five dots, `level` of them filled — the web's SkillDots. */
function skillDots(level: number, color: string, empty: string, size: number): string {
  const dots = [1, 2, 3, 4, 5]
    .map((i) =>
      el("div", {
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: i <= level ? color : empty,
        flexShrink: 0,
      }),
    )
    .join("");
  return el("div", { display: "flex", gap: 3, flexShrink: 0 }, dots);
}

export function skillsSection(
  view: EngineView,
  tokens: DesignTokens,
  style: SectionStyle,
  lang: Lang = "en",
  display: SkillDisplay = "bar",
): string {
  const items = (view.hiddenSections.includes("skills") ? [] : view.skills).filter(
    (s) => s.name.trim().length > 0,
  );
  if (!items.length) return "";

  const label = sectionLabel(heading("skills", lang), tokens, style);

  if (display === "chip") {
    const body = items
      .map((s) =>
        tx(s.name, {
          fontSize: tokens.font.tag,
          color: tokens.color.accent,
          backgroundColor: tokens.color.accent + "18",
          border: `1px solid ${tokens.color.accent}35`,
          borderRadius: 99,
          padding: "2px 8px",
          fontFamily: tokens.fontFamily,
        }),
      )
      .join("");
    return el("div", {}, label + el("div", { display: "flex", flexWrap: "wrap", gap: 5 }, body));
  }

  if (display === "grid") {
    const body = items
      .map((s) =>
        el(
          "div",
          { display: "flex", alignItems: "center", gap: 5 },
          el("div", {
            width: 4,
            height: 4,
            borderRadius: "50%",
            backgroundColor: tokens.color.accent,
            flexShrink: 0,
          }) + tx(s.name, { fontSize: tokens.font.body, color: tokens.color.text, fontFamily: tokens.fontFamily }),
        ),
      )
      .join("");
    return el(
      "div",
      {},
      label + el("div", { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 8px" }, body),
    );
  }

  if (display === "tag-rated") {
    const body = items
      .map((s) =>
        el(
          "span",
          {
            fontSize: tokens.font.tag,
            color: tokens.color.text,
            backgroundColor: tokens.color.faint,
            border: `1px solid ${tokens.color.accent}40`,
            borderRadius: 4,
            padding: "2px 8px",
            fontFamily: tokens.fontFamily,
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
          },
          esc(s.name) +
            el("span", {
              width: (s.level / 5) * 20,
              height: 3,
              backgroundColor: tokens.color.accent,
              borderRadius: 2,
              display: "inline-block",
            }),
        ),
      )
      .join("");
    return el("div", {}, label + el("div", { display: "flex", flexWrap: "wrap", gap: 5 }, body));
  }

  const body = items
    .map((s) =>
      el(
        "div",
        { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 },
        `<span style="font-size:${tokens.font.body}px;color:${tokens.color.text};font-family:${tokens.fontFamily};flex:1;min-width:0">${esc(s.name)}</span>` +
          (display === "bar"
            ? skillBar(s.level, tokens.color.accent, tokens.color.faint, 70, 3)
            : skillDots(s.level, tokens.color.accent, tokens.color.faint, 7)),
      ),
    )
    .join("");

  return el(
    "div",
    {},
    label + el("div", { display: "flex", flexDirection: "column", gap: 6 }, body),
  );
}

// ─── Languages ────────────────────────────────────────────────────────────────

/**
 * Languages — a label/level PAIR per row.
 *
 * Mirrors LanguagesSection in
 * apps/web/components/templates/engine/sections.tsx, including the reason the
 * row is no longer `justify-content: space-between`: the pair is only joined by
 * the row they share, so a wide row (a header layout's main column measures
 * 560px+, a sidebar's aside 195–300px) pushed `Kiswahili` and `Native` so far
 * apart that they read as two unrelated fragments — "language far left, level
 * far right". The level still sits right-aligned in its own column (levels must
 * line up), and a dotted leader on the label carries the eye across the gap at
 * any width. Both apps must stay in step: the native WebView preview and the
 * PDF export are generated from this file.
 */
export function languagesSection(
  view: EngineView,
  tokens: DesignTokens,
  style: SectionStyle,
  lang: Lang = "en",
): string {
  const items = view.hiddenSections.includes("languages") ? [] : view.languages;
  if (!items.length) return "";

  const body = items
    .map((l) =>
      el(
        "div",
        { display: "flex", alignItems: "baseline", gap: 8 },
        tx(l.name, {
          flex: "1 1 auto",
          minWidth: 0,
          borderBottom: "1px dotted currentColor",
          paddingBottom: 2,
          fontSize: tokens.font.body,
          color: tokens.color.text,
          fontFamily: tokens.fontFamily,
        }) +
          tx(l.proficiency, {
            flexShrink: 0,
            whiteSpace: "nowrap",
            fontSize: tokens.font.meta,
            color: tokens.color.muted,
            fontFamily: tokens.fontFamily,
          }),
      ),
    )
    .join("");

  return el(
    "div",
    {},
    sectionLabel(heading("languages", lang), tokens, style) +
      el("div", { display: "flex", flexDirection: "column", gap: 5 }, body),
  );
}

// ─── Certifications ───────────────────────────────────────────────────────────

export function certificationsSection(
  view: EngineView,
  tokens: DesignTokens,
  style: SectionStyle,
  lang: Lang = "en",
): string {
  const items = view.hiddenSections.includes("certifications") ? [] : view.certifications;
  if (!items.length) return "";

  const body = items
    .map((c) =>
      el(
        "div",
        {},
        `<div style="font-size:${tokens.font.body}px;font-weight:600;color:${tokens.color.text};font-family:${tokens.fontFamily}">${esc(c.name)}</div>` +
          `<div style="font-size:${tokens.font.meta}px;color:${tokens.color.muted};font-family:${tokens.fontFamily}">${esc(c.issuer)}${
            c.date ? esc(` · ${fmtDate(c.date, lang)}`) : ""
          }</div>`,
      ),
    )
    .join("");

  return el(
    "div",
    {},
    sectionLabel(heading("certifications", lang), tokens, style) +
      el("div", { display: "flex", flexDirection: "column", gap: 6 }, body),
  );
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export function projectsSection(
  view: EngineView,
  tokens: DesignTokens,
  style: SectionStyle,
  lang: Lang = "en",
): string {
  const items = view.hiddenSections.includes("projects") ? [] : view.projects;
  if (!items.length) return "";

  const body = items
    .map((p) => {
      const meta = [p.role, p.date ? fmtDate(p.date, lang) : ""].filter(Boolean).join(" · ");
      const lines = (p.description || "")
        .split(/\n+/)
        .map((l) => l.replace(/^[-•]\s*/, "").trim())
        .filter(Boolean);
      const linesHtml = lines.length
        ? el(
            "div",
            { marginTop: 2 },
            lines
              .map((line) =>
                `<div style="font-size:${tokens.font.body}px;color:${tokens.color.sub};font-family:${tokens.fontFamily};line-height:${tokens.space.line}">${esc(
                  lines.length > 1 ? `• ${line}` : line,
                )}</div>`,
              )
              .join(""),
          )
        : "";
      return el(
        "div",
        {},
        el(
          "div",
          { display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 },
          `<div style="font-size:${tokens.font.body}px;font-weight:600;color:${tokens.color.text};font-family:${tokens.fontFamily}">${esc(p.name)}</div>` +
            (meta
              ? `<div style="font-size:${tokens.font.meta}px;color:${tokens.color.muted};font-family:${tokens.fontFamily};white-space:nowrap">${esc(meta)}</div>`
              : ""),
        ) + linesHtml,
      );
    })
    .join("");

  return el(
    "div",
    {},
    sectionLabel(heading("projects", lang), tokens, style) +
      el("div", { display: "flex", flexDirection: "column", gap: 8 }, body),
  );
}

// ─── Referees ─────────────────────────────────────────────────────────────────

export function refereesSection(
  view: EngineView,
  tokens: DesignTokens,
  style: SectionStyle,
  lang: Lang = "en",
): string {
  const items = view.hiddenSections.includes("referees") ? [] : view.referees;
  if (!items.length) return "";

  const body = items
    .map((r) =>
      el(
        "div",
        {
          padding: "6px 8px",
          backgroundColor: tokens.color.faint,
          borderRadius: 4,
          borderLeft: `2px solid ${tokens.color.accent}50`,
        },
        `<div style="font-size:${tokens.font.body}px;font-weight:600;color:${tokens.color.text};font-family:${tokens.fontFamily}">${esc(r.name)}</div>` +
          `<div style="font-size:${tokens.font.meta}px;color:${tokens.color.sub};font-family:${tokens.fontFamily}">${esc(r.title)}${
            r.company ? esc(` — ${r.company}`) : ""
          }</div>` +
          `<div style="font-size:${tokens.font.tag}px;color:${tokens.color.muted};font-family:${tokens.fontFamily};margin-top:2px">${esc(r.email)}${
            r.phone ? esc(` · ${r.phone}`) : ""
          }</div>`,
      ),
    )
    .join("");

  return el(
    "div",
    {},
    sectionLabel(heading("referees", lang), tokens, style) +
      el("div", { display: "flex", flexDirection: "column", gap: 6 }, body),
  );
}

// ─── Hobbies ──────────────────────────────────────────────────────────────────

export function hobbiesSection(
  view: EngineView,
  tokens: DesignTokens,
  style: SectionStyle,
  lang: Lang = "en",
  display: "chips" | "text" = "chips",
): string {
  if (!view.hobbies || view.hiddenSections.includes("hobbies")) return "";
  const items = view.hobbies
    .split(/[,\n]+/)
    .map((h) => h.trim())
    .filter(Boolean);

  const label = sectionLabel(heading("hobbies", lang), tokens, style);

  if (display === "chips") {
    const chips = items
      .map((h) =>
        tx(h, {
          fontSize: tokens.font.tag,
          color: tokens.color.sub,
          backgroundColor: tokens.color.faint,
          borderRadius: 99,
          padding: "2px 8px",
          fontFamily: tokens.fontFamily,
        }),
      )
      .join("");
    return el("div", {}, label + el("div", { display: "flex", flexWrap: "wrap", gap: 4 }, chips));
  }

  return el(
    "div",
    {},
    label +
      `<p style="font-size:${tokens.font.body}px;color:${tokens.color.sub};margin:0;font-family:${tokens.fontFamily};line-height:${tokens.space.line}">${esc(
        view.hobbies,
      )}</p>`,
  );
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────

export interface SectionRendererOptions {
  sectionStyle: SectionStyle;
  skillDisplay?: SkillDisplay;
  hobbiesDisplay?: "chips" | "text";
  showTimeline?: boolean;
  experienceVariant?: ExperienceVariant;
  lang?: Lang;
}

/** Renders one section by key. Returns "" when the section has no data — so a
 *  caller can drop it from the page entirely instead of leaving a gap. */
export function renderSection(
  key: string,
  view: EngineView,
  tokens: DesignTokens,
  opts: SectionRendererOptions,
): string {
  const s = opts.sectionStyle;
  const l = opts.lang ?? "en";
  switch (key) {
    case "summary":
      return summarySection(view, tokens, s, l);
    case "experience":
      return experienceSection(view, tokens, s, l, opts.showTimeline, opts.experienceVariant);
    case "education":
      return educationSection(view, tokens, s, l);
    case "skills":
      return skillsSection(view, tokens, s, l, opts.skillDisplay);
    case "projects":
      return projectsSection(view, tokens, s, l);
    case "languages":
      return languagesSection(view, tokens, s, l);
    case "certifications":
      return certificationsSection(view, tokens, s, l);
    case "referees":
      return refereesSection(view, tokens, s, l);
    case "hobbies":
      return hobbiesSection(view, tokens, s, l, opts.hobbiesDisplay);
    default:
      return "";
  }
}

/** Every section key the engine can draw — used by the sync test and by the
 *  layouts to decide what a template can pin into a sidebar. */
export const SECTION_KEYS = [
  "summary",
  "experience",
  "education",
  "skills",
  "projects",
  "languages",
  "certifications",
  "referees",
  "hobbies",
] as const;

export { join };
