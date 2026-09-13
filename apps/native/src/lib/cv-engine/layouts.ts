/**
 * Layout archetypes — the HTML port of
 * apps/web/components/templates/engine/layouts.tsx.
 *
 * Each layout decides where the name/photo/contact live and where the ordered
 * sections go. Sections themselves are drawn by sections.ts.
 *
 * The one deliberate difference from the web: there is no AutoFitPage wrapper.
 * On the web that wrapper shrinks a too-long CV to fit an on-screen page; here
 * the document is printed (expo-print) or previewed in a WebView, and both
 * handle overflow themselves. Adding the wrapper would silently scale text down
 * and make the exported PDF disagree with the preview.
 */

import type { DesignTokens } from "./tokens";
import type { EngineView } from "./view";
import type { ExperienceVariant, Lang, SectionStyle, SkillDisplay } from "./types";
import { el, esc, join } from "./html";
import { photoCircle } from "./photo";
import { contactBlock, heading, renderSection, sectionLabel, type SectionRendererOptions } from "./sections";

const PAGE_W = 794;
const PAGE_H = 1123;

/** Order used when the CV itself carries no `sectionOrder`.
 *  Mirrors DEFAULT_SECTION_ORDER in apps/web/types/index.ts — NOT the web
 *  engine's older constant, which omitted "projects" and so dropped them from
 *  every template that used the default order. */
const DEFAULT_ORDER = [
  "summary",
  "experience",
  "projects",
  "education",
  "skills",
  "languages",
  "certifications",
  "referees",
  "hobbies",
];

function getOrder(view: EngineView, fallback?: string[]): string[] {
  return view.sectionOrder.length ? view.sectionOrder : fallback ?? DEFAULT_ORDER;
}

/** Section keys a layout is allowed to pin into a side column. `skills` and
 *  `languages` are always eligible (they read well narrow); everything else
 *  must actually appear in the document order. */
function sideSections(wanted: string[], order: string[]): string[] {
  return wanted.filter((k) => order.includes(k) || k === "skills" || k === "languages");
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────

export interface SidebarLayoutConfig {
  sidebarWidth: number;
  sidebarBg: string;
  sidebarBorderColor?: string;
  mainBg: string;
  nameColor: string;
  titleColor: string;
  contactIconColor: string;
  sidebarSectionStyle: SectionStyle;
  mainSectionStyle: SectionStyle;
  sidebarSections: string[];
  skillDisplay?: SkillDisplay;
  photoSize?: number;
  photoRadius?: number;
  showTimeline?: boolean;
  hobbiesDisplay?: "chips" | "text";
  experienceVariant?: ExperienceVariant;
}

export function sidebarLayout(
  view: EngineView,
  tokens: DesignTokens,
  config: SidebarLayoutConfig,
  lang: Lang = "en",
): string {
  const order = getOrder(view);
  const pinned = sideSections(config.sidebarSections ?? [], order);
  const pinnedSet = new Set(pinned);
  const mainSections = order.filter((k) => !pinnedSet.has(k));

  const sidebarOpts: SectionRendererOptions = {
    lang,
    sectionStyle: config.sidebarSectionStyle,
    skillDisplay: config.skillDisplay ?? "bar",
    hobbiesDisplay: config.hobbiesDisplay ?? "chips",
  };
  const mainOpts: SectionRendererOptions = {
    lang,
    sectionStyle: config.mainSectionStyle,
    skillDisplay: config.skillDisplay ?? "bar",
    showTimeline: config.showTimeline,
    hobbiesDisplay: config.hobbiesDisplay ?? "chips",
    experienceVariant: config.experienceVariant ?? "default",
  };

  const photoSize = config.photoSize ?? 80;
  const photo = view.personal.photo
    ? photoCircle({
        url: view.personal.photo,
        name: view.personal.fullName,
        size: photoSize,
        bgColor: tokens.color.accent,
        borderColor: tokens.color.faint,
        borderWidth: 2,
        radius: config.photoRadius ?? 50,
      })
    : "";

  const identity = el(
    "div",
    { display: "flex", flexDirection: "column", alignItems: "center", gap: 8, textAlign: "center" },
    photo +
      el(
        "div",
        {},
        `<div style="font-size:${tokens.font.name}px;font-weight:800;color:${config.nameColor};line-height:1.2;font-family:${tokens.fontFamily}">${esc(
          view.personal.fullName,
        )}</div>` +
          (view.personal.jobTitle
            ? `<div style="font-size:${tokens.font.nameTitle}px;color:${config.titleColor};margin-top:3px;font-family:${tokens.fontFamily}">${esc(
                view.personal.jobTitle,
              )}</div>`
            : ""),
      ),
  );

  const contact = el(
    "div",
    {},
    sectionLabel(heading("contact", lang), tokens, config.sidebarSectionStyle) +
      contactBlock(view.personal, tokens, config.contactIconColor, true),
  );

  const sidebar = el(
    "div",
    {
      width: config.sidebarWidth,
      minHeight: PAGE_H,
      backgroundColor: config.sidebarBg,
      flexShrink: 0,
      borderLeft: config.sidebarBorderColor ? `3px solid ${config.sidebarBorderColor}` : undefined,
      boxSizing: "border-box",
      padding: `${tokens.space.pageV}px ${Math.max(4, tokens.space.pageH - 8)}px`,
      display: "flex",
      flexDirection: "column",
      gap: tokens.space.section,
    },
    identity +
      contact +
      pinned
        .map((key) => renderSection(key, view, tokens, sidebarOpts))
        .filter(Boolean)
        .join(""),
  );

  const main = el(
    "div",
    {
      flex: 1,
      minHeight: PAGE_H,
      backgroundColor: config.mainBg,
      padding: `${tokens.space.pageV}px ${tokens.space.pageH}px`,
      display: "flex",
      flexDirection: "column",
      gap: tokens.space.section,
    },
    mainSections
      .map((key) => renderSection(key, view, tokens, mainOpts))
      .filter(Boolean)
      .join(""),
  );

  return el(
    "div",
    {
      width: PAGE_W,
      minHeight: PAGE_H,
      display: "flex",
      fontFamily: tokens.fontFamily,
      backgroundColor: tokens.color.faint,
    },
    sidebar + main,
  );
}

// ─── HEADER ───────────────────────────────────────────────────────────────────

export interface HeaderLayoutConfig {
  headerBg: string;
  headerTextColor: string;
  headerSubColor: string;
  headerContactColor: string;
  bodyBg: string;
  headerHeight?: number;
  headerPaddingV?: number;
  asideWidth?: number;
  asideSections?: string[];
  mainSectionStyle: SectionStyle;
  asideSectionStyle?: SectionStyle;
  photoSize?: number;
  photoOnLeft?: boolean;
  skillDisplay?: SkillDisplay;
  showTimeline?: boolean;
  hobbiesDisplay?: "chips" | "text";
  experienceVariant?: ExperienceVariant;
}

export function headerLayout(
  view: EngineView,
  tokens: DesignTokens,
  config: HeaderLayoutConfig,
  lang: Lang = "en",
): string {
  const order = getOrder(view);
  const asideWanted = config.asideSections ?? [];
  const asideList = sideSections(asideWanted, order);
  const asideSet = new Set(asideList);
  const mainSections = order.filter((k) => !asideSet.has(k));

  const mainOpts: SectionRendererOptions = {
    lang,
    sectionStyle: config.mainSectionStyle,
    skillDisplay: config.skillDisplay ?? "bar",
    showTimeline: config.showTimeline,
    hobbiesDisplay: config.hobbiesDisplay ?? "chips",
    experienceVariant: config.experienceVariant ?? "default",
  };
  const asideOpts: SectionRendererOptions = {
    lang,
    sectionStyle: config.asideSectionStyle ?? config.mainSectionStyle,
    skillDisplay: config.skillDisplay ?? "bar",
    hobbiesDisplay: config.hobbiesDisplay ?? "chips",
  };

  const photoSize = config.photoSize ?? 72;
  const headerPadV = config.headerPaddingV ?? 22;
  const headerPadH = tokens.space.pageH;

  const photo = view.personal.photo
    ? photoCircle({
        url: view.personal.photo,
        name: view.personal.fullName,
        size: photoSize,
        bgColor: tokens.color.accent + "80",
        borderColor: "rgba(255,255,255,0.4)",
        borderWidth: 2,
      })
    : "";

  const identityBlock =
    `<div style="flex:1;min-width:0">` +
    `<div style="font-size:${tokens.font.name}px;font-weight:800;color:${config.headerTextColor};line-height:1.15;font-family:${tokens.fontFamily}">${esc(
      view.personal.fullName,
    )}</div>` +
    (view.personal.jobTitle
      ? `<div style="font-size:${tokens.font.nameTitle}px;color:${config.headerSubColor};margin-top:3px;font-family:${tokens.fontFamily}">${esc(
          view.personal.jobTitle,
        )}</div>`
      : "") +
    `<div style="margin-top:8px">${contactBlock(view.personal, tokens, config.headerContactColor, false)}</div>` +
    `</div>`;

  const header = el(
    "div",
    { backgroundColor: config.headerBg, padding: `${headerPadV}px ${headerPadH}px` },
    el(
      "div",
      { display: "flex", alignItems: "center", gap: 18 },
      (config.photoOnLeft !== false ? photo : "") + identityBlock + (config.photoOnLeft === false ? photo : ""),
    ),
  );

  const mainCol = el(
    "div",
    {
      flex: 1,
      padding: `${tokens.space.pageV}px ${tokens.space.pageH}px`,
      display: "flex",
      flexDirection: "column",
      gap: tokens.space.section,
    },
    mainSections
      .map((key) => renderSection(key, view, tokens, mainOpts))
      .filter(Boolean)
      .join(""),
  );

  const aside =
    config.asideWidth && asideList.length
      ? el(
          "div",
          {
            width: config.asideWidth,
            flexShrink: 0,
            backgroundColor: tokens.color.faint,
            padding: `${tokens.space.pageV}px ${Math.max(4, tokens.space.pageH - 8)}px`,
            display: "flex",
            flexDirection: "column",
            gap: tokens.space.section,
            borderLeft: `1px solid ${tokens.color.faint}`,
          },
          asideList
            .map((key) => renderSection(key, view, tokens, asideOpts))
            .filter(Boolean)
            .join(""),
        )
      : "";

  return el(
    "div",
    { width: PAGE_W, minHeight: PAGE_H, backgroundColor: config.bodyBg, fontFamily: tokens.fontFamily },
    header + el("div", { display: "flex", flex: 1 }, mainCol + aside),
  );
}

// ─── MINIMAL ──────────────────────────────────────────────────────────────────

export interface MinimalLayoutConfig {
  bg: string;
  nameAlign: "left" | "center";
  dividerStyle: "solid" | "dotted" | "none";
  sectionStyle: SectionStyle;
  skillDisplay?: SkillDisplay;
  hobbiesDisplay?: "chips" | "text";
  accentOnName?: boolean;
  experienceVariant?: ExperienceVariant;
}

export function minimalLayout(
  view: EngineView,
  tokens: DesignTokens,
  config: MinimalLayoutConfig,
  lang: Lang = "en",
): string {
  const order = getOrder(view);
  const opts: SectionRendererOptions = {
    lang,
    sectionStyle: config.sectionStyle,
    skillDisplay: config.skillDisplay ?? "chip",
    hobbiesDisplay: config.hobbiesDisplay ?? "chips",
    experienceVariant: config.experienceVariant ?? "default",
  };

  const header = el(
    "div",
    { textAlign: config.nameAlign, marginBottom: tokens.space.section },
    `<div style="font-size:${tokens.font.name + 2}px;font-weight:800;color:${
      config.accentOnName ? tokens.color.accent : tokens.color.text
    };letter-spacing:-0.02em;font-family:${tokens.fontFamily};line-height:1.15">${esc(
      view.personal.fullName,
    )}</div>` +
      (view.personal.jobTitle
        ? `<div style="font-size:${tokens.font.nameTitle}px;color:${tokens.color.muted};margin-top:4px;font-family:${tokens.fontFamily}">${esc(
            view.personal.jobTitle,
          )}</div>`
        : "") +
      `<div style="margin-top:8px">${contactBlock(view.personal, tokens, tokens.color.muted, false)}</div>`,
  );

  const divider =
    config.dividerStyle !== "none"
      ? el("div", {
          height: 1.5,
          backgroundColor: tokens.color.accent,
          opacity: 0.7,
          marginBottom: tokens.space.section,
        })
      : "";

  const sections = order
    .map((key) => renderSection(key, view, tokens, opts))
    .filter(Boolean)
    .join("");

  return el(
    "div",
    {
      width: PAGE_W,
      minHeight: PAGE_H,
      backgroundColor: config.bg,
      fontFamily: tokens.fontFamily,
      padding: `${tokens.space.pageV}px ${tokens.space.pageH}px`,
      boxSizing: "border-box",
    },
    header +
      divider +
      el("div", { display: "flex", flexDirection: "column", gap: tokens.space.section }, sections),
  );
}

// ─── TWO COLUMN ───────────────────────────────────────────────────────────────

export interface TwoColumnLayoutConfig {
  headerBg: string;
  headerTextColor: string;
  headerSubColor: string;
  headerContactColor: string;
  leftBg: string;
  rightBg: string;
  leftWidth: number;
  leftSections: string[];
  rightSections: string[];
  leftSectionStyle: SectionStyle;
  rightSectionStyle: SectionStyle;
  dividerColor?: string;
  headerPaddingV?: number;
  photoSize?: number;
  photoOnLeft?: boolean;
  skillDisplay?: SkillDisplay;
  hobbiesDisplay?: "chips" | "text";
  experienceVariant?: ExperienceVariant;
  showTimeline?: boolean;
}

export function twoColumnLayout(
  view: EngineView,
  tokens: DesignTokens,
  config: TwoColumnLayoutConfig,
  lang: Lang = "en",
): string {
  const order = getOrder(view);
  const leftList = sideSections(config.leftSections ?? [], order);
  const rightList = sideSections(config.rightSections ?? [], order);

  const leftOpts: SectionRendererOptions = {
    lang,
    sectionStyle: config.leftSectionStyle,
    skillDisplay: config.skillDisplay ?? "bar",
    hobbiesDisplay: config.hobbiesDisplay ?? "chips",
    experienceVariant: config.experienceVariant ?? "default",
    showTimeline: config.showTimeline,
  };
  const rightOpts: SectionRendererOptions = {
    lang,
    sectionStyle: config.rightSectionStyle,
    skillDisplay: config.skillDisplay ?? "bar",
    hobbiesDisplay: config.hobbiesDisplay ?? "chips",
    experienceVariant: config.experienceVariant ?? "default",
  };

  const photoSize = config.photoSize ?? 72;
  const padV = config.headerPaddingV ?? 22;

  const photo = view.personal.photo
    ? photoCircle({
        url: view.personal.photo,
        name: view.personal.fullName,
        size: photoSize,
        bgColor: tokens.color.accent + "60",
        borderColor: "rgba(255,255,255,0.35)",
        borderWidth: 2,
      })
    : "";

  const header = el(
    "div",
    { backgroundColor: config.headerBg, padding: `${padV}px ${tokens.space.pageH}px` },
    el(
      "div",
      { display: "flex", alignItems: "center", gap: 16 },
      (config.photoOnLeft !== false ? photo : "") +
        `<div style="flex:1;min-width:0">` +
        `<div style="font-size:${tokens.font.name}px;font-weight:800;color:${config.headerTextColor};line-height:1.15">${esc(
          view.personal.fullName,
        )}</div>` +
        (view.personal.jobTitle
          ? `<div style="font-size:${tokens.font.nameTitle}px;color:${config.headerSubColor};margin-top:3px">${esc(
              view.personal.jobTitle,
            )}</div>`
          : "") +
        `<div style="margin-top:7px">${contactBlock(view.personal, tokens, config.headerContactColor, false)}</div>` +
        `</div>` +
        (config.photoOnLeft === false ? photo : ""),
    ),
  );

  const left = el(
    "div",
    {
      width: config.leftWidth,
      flexShrink: 0,
      backgroundColor: config.leftBg,
      padding: `${tokens.space.pageV}px ${Math.max(4, tokens.space.pageH - 4)}px`,
      display: "flex",
      flexDirection: "column",
      gap: tokens.space.section,
      borderRight: config.dividerColor ? `1px solid ${config.dividerColor}` : undefined,
    },
    leftList
      .map((key) => renderSection(key, view, tokens, leftOpts))
      .filter(Boolean)
      .join(""),
  );

  const right = el(
    "div",
    {
      flex: 1,
      backgroundColor: config.rightBg,
      padding: `${tokens.space.pageV}px ${tokens.space.pageH}px`,
      display: "flex",
      flexDirection: "column",
      gap: tokens.space.section,
    },
    rightList
      .map((key) => renderSection(key, view, tokens, rightOpts))
      .filter(Boolean)
      .join(""),
  );

  return el(
    "div",
    { width: PAGE_W, minHeight: PAGE_H, fontFamily: tokens.fontFamily, backgroundColor: "#fff" },
    header + el("div", { display: "flex", minHeight: PAGE_H - 120 }, left + right),
  );
}

// ─── ACCENT BAND ──────────────────────────────────────────────────────────────

export interface AccentBandLayoutConfig {
  bandWidth: number;
  bandColor: string;
  bg: string;
  nameColor: string;
  nameSize?: number;
  sectionStyle: SectionStyle;
  skillDisplay?: SkillDisplay;
  hobbiesDisplay?: "chips" | "text";
  experienceVariant?: ExperienceVariant;
  showTimeline?: boolean;
  photoSize?: number;
  photoRadius?: number;
  contactIconColor?: string;
  topRule?: boolean;
}

export function accentBandLayout(
  view: EngineView,
  tokens: DesignTokens,
  config: AccentBandLayoutConfig,
  lang: Lang = "en",
): string {
  const order = getOrder(view);
  const opts: SectionRendererOptions = {
    lang,
    sectionStyle: config.sectionStyle,
    skillDisplay: config.skillDisplay ?? "bar",
    hobbiesDisplay: config.hobbiesDisplay ?? "chips",
    experienceVariant: config.experienceVariant ?? "default",
    showTimeline: config.showTimeline,
  };

  const iconColor = config.contactIconColor ?? tokens.color.muted;
  const photoSize = config.photoSize ?? 0;
  const photo =
    photoSize > 0 && view.personal.photo
      ? photoCircle({
          url: view.personal.photo,
          name: view.personal.fullName,
          size: photoSize,
          bgColor: tokens.color.accent + "30",
          borderColor: tokens.color.faint,
          borderWidth: 2,
          radius: config.photoRadius ?? 50,
        })
      : "";

  const identity = el(
    "div",
    { display: "flex", alignItems: "flex-start", gap: 14, marginBottom: tokens.space.section },
    photo +
      `<div style="flex:1">` +
      `<div style="font-size:${config.nameSize ?? tokens.font.name + 2}px;font-weight:800;color:${
        config.nameColor
      };line-height:1.15;letter-spacing:-0.01em;font-family:${tokens.fontFamily}">${esc(view.personal.fullName)}</div>` +
      (view.personal.jobTitle
        ? `<div style="font-size:${tokens.font.nameTitle}px;color:${tokens.color.muted};margin-top:3px;font-family:${tokens.fontFamily}">${esc(
            view.personal.jobTitle,
          )}</div>`
        : "") +
      `<div style="margin-top:7px">${contactBlock(view.personal, tokens, iconColor, false)}</div>` +
      `</div>`,
  );

  const topRule = config.topRule
    ? el("div", {
        height: 1.5,
        backgroundColor: config.bandColor,
        opacity: 0.4,
        marginBottom: tokens.space.section,
      })
    : "";

  const sections = order
    .map((key) => renderSection(key, view, tokens, opts))
    .filter(Boolean)
    .join("");

  const content = el(
    "div",
    {
      flex: 1,
      minWidth: 0,
      padding: `${tokens.space.pageV}px ${tokens.space.pageH}px ${tokens.space.pageV}px ${Math.max(
        8,
        tokens.space.pageH - config.bandWidth / 2,
      )}px`,
    },
    identity +
      topRule +
      el("div", { display: "flex", flexDirection: "column", gap: tokens.space.section }, sections),
  );

  return el(
    "div",
    {
      width: PAGE_W,
      minHeight: PAGE_H,
      display: "flex",
      fontFamily: tokens.fontFamily,
      backgroundColor: config.bg,
    },
    el("div", { width: config.bandWidth, flexShrink: 0, backgroundColor: config.bandColor }) + content,
  );
}

export { PAGE_W, PAGE_H, DEFAULT_ORDER, join };
