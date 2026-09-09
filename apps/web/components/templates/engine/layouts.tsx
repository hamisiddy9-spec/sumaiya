// Layout archetypes for engine-backed templates.
// Each layout knows where to put: the name/header, the photo,
// contact info, and the ordered section list.
// Sections are rendered by the dispatcher in sections.tsx.

import React from "react";
import type { CVData } from "@/types";
import type { DesignTokens } from "./tokens";
import type { SectionStyle, SectionRendererOptions, ExperienceVariant } from "./sections";
import { renderSection, SectionLabel, ContactBlock, heading } from "./sections";
import type { Lang } from "@/lib/i18n/translations";
import { PhotoCircle } from "@/components/templates/template-utils";
import { AutoFitPage } from "./fit";

const PAGE_W = 794;
const PAGE_H = 1123;

// Default section order when data doesn't specify one
const DEFAULT_ORDER = ["summary", "experience", "education", "skills", "languages", "certifications", "referees", "hobbies"];

function getOrder(data: CVData, fallback?: string[]): string[] {
  return data.sectionOrder?.length ? data.sectionOrder : (fallback ?? DEFAULT_ORDER);
}

// ─── SIDEBAR LAYOUT ───────────────────────────────────────────────────────────
// Left sidebar (fixed width) + right main column.
// Sidebar holds: photo, name+title, contact.
// Optionally sidebar also holds: skills, languages.
// Main column holds: ordered sections (excluding sidebar-pinned ones).

export interface SidebarLayoutConfig {
  sidebarWidth: number;
  sidebarBg: string;
  sidebarBorderColor?: string;  // left-border accent; undefined = no border
  mainBg: string;
  nameColor: string;            // on sidebar
  titleColor: string;           // job title on sidebar
  contactIconColor: string;
  sidebarSectionStyle: SectionStyle;
  mainSectionStyle: SectionStyle;
  sidebarSections: string[];    // sections pinned to sidebar (e.g. skills, languages)
  skillDisplay?: SectionRendererOptions["skillDisplay"];
  photoSize?: number;
  photoRadius?: number;         // 50% = circle, 0 = square, number = px radius
  showTimeline?: boolean;
  hobbiesDisplay?: "chips" | "text";
  experienceVariant?: ExperienceVariant;
}

export function SidebarLayout({
  data, tokens, config, lang = "en",
}: { data: CVData; tokens: DesignTokens; config: SidebarLayoutConfig; lang?: Lang }) {
  const order = getOrder(data);
  const sidebarSet = new Set(config.sidebarSections);
  const mainSections = order.filter(k => !sidebarSet.has(k));
  // Sidebar sections in the order they appear in sidebarSections config
  const sidebarSectionList = config.sidebarSections.filter(k => order.includes(k) || ["skills","languages"].includes(k));

  const photoSize = config.photoSize ?? 80;

  const sidebarOpts: SectionRendererOptions = { lang,
    sectionStyle: config.sidebarSectionStyle,
    skillDisplay: config.skillDisplay ?? "bar",
    hobbiesDisplay: config.hobbiesDisplay ?? "chips",
  };
  const mainOpts: SectionRendererOptions = { lang,
    sectionStyle: config.mainSectionStyle,
    skillDisplay: config.skillDisplay ?? "bar",
    showTimeline: config.showTimeline,
    hobbiesDisplay: config.hobbiesDisplay ?? "chips",
    experienceVariant: config.experienceVariant ?? "default",
  };

  return (
    <AutoFitPage>
      <div style={{
        width: PAGE_W, minHeight: PAGE_H, display: "flex",
        fontFamily: tokens.fontFamily, backgroundColor: tokens.color.faint,
      }}>
        {/* Sidebar */}
        <div style={{
          width: config.sidebarWidth, minHeight: PAGE_H,
          backgroundColor: config.sidebarBg, flexShrink: 0,
          borderLeft: config.sidebarBorderColor ? `3px solid ${config.sidebarBorderColor}` : undefined,
          boxSizing: "border-box",
          padding: `${tokens.space.pageV}px ${tokens.space.pageH - 8}px`,
          display: "flex", flexDirection: "column", gap: tokens.space.section,
        }}>
          {/* Photo + identity */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, textAlign: "center" }}>
            {data.personal.photo && (
              <PhotoCircle
                url={data.personal.photo}
                name={data.personal.fullName}
                size={photoSize}
                bgColor={tokens.color.accent}
                borderColor={tokens.color.faint}
                borderWidth={2}
              />
            )}
            <div>
              <div style={{ fontSize: tokens.font.name, fontWeight: 800, color: config.nameColor, lineHeight: 1.2, fontFamily: tokens.fontFamily }}>
                {data.personal.fullName}
              </div>
              {data.personal.jobTitle && (
                <div style={{ fontSize: tokens.font.nameTitle, color: config.titleColor, marginTop: 3, fontFamily: tokens.fontFamily }}>
                  {data.personal.jobTitle}
                </div>
              )}
            </div>
          </div>

          {/* Contact */}
          <div>
            <SectionLabel label={heading("contact", lang)} tokens={tokens} style={config.sidebarSectionStyle} />
            <ContactBlock personal={data.personal} tokens={tokens} iconColor={config.contactIconColor} />
          </div>

          {/* Sidebar sections (skills, languages, etc.) */}
          {sidebarSectionList.map(key => {
            const node = renderSection(key, data, tokens, sidebarOpts);
            return node ? <div key={key}>{node}</div> : null;
          })}
        </div>

        {/* Main */}
        <div style={{
          flex: 1, minHeight: PAGE_H,
          backgroundColor: config.mainBg,
          padding: `${tokens.space.pageV}px ${tokens.space.pageH}px`,
          display: "flex", flexDirection: "column", gap: tokens.space.section,
        }}>
          {mainSections.map(key => {
            const node = renderSection(key, data, tokens, mainOpts);
            return node ? <div key={key}>{node}</div> : null;
          })}
        </div>
      </div>
    </AutoFitPage>
  );
}

// ─── HEADER LAYOUT ────────────────────────────────────────────────────────────
// Full-width header (accent/dark/white) + body below.
// Body can be single column or split (mainWeight + asideWeight).

export interface HeaderLayoutConfig {
  headerBg: string;
  headerTextColor: string;
  headerSubColor: string;
  headerContactColor: string;
  bodyBg: string;
  headerHeight?: number;        // Auto if undefined — uses padding
  headerPaddingV?: number;
  asideWidth?: number;          // If set, body is split; aside holds skill/lang/certs
  asideSections?: string[];
  mainSectionStyle: SectionStyle;
  asideSectionStyle?: SectionStyle;
  photoSize?: number;
  photoOnLeft?: boolean;        // default true
  skillDisplay?: SectionRendererOptions["skillDisplay"];
  showTimeline?: boolean;
  hobbiesDisplay?: "chips" | "text";
  experienceVariant?: ExperienceVariant;
}

export function HeaderLayout({
  data, tokens, config, lang = "en",
}: { data: CVData; tokens: DesignTokens; config: HeaderLayoutConfig; lang?: Lang }) {
  const order = getOrder(data);
  const asideSet = new Set(config.asideSections ?? []);
  const mainSections = order.filter(k => !asideSet.has(k));
  const asideSectionList = (config.asideSections ?? []).filter(k => order.includes(k) || ["skills","languages"].includes(k));

  const photoSize = config.photoSize ?? 72;
  const headerPadH = tokens.space.pageH;
  const headerPadV = config.headerPaddingV ?? 22;

  const mainOpts: SectionRendererOptions = { lang,
    sectionStyle: config.mainSectionStyle,
    skillDisplay: config.skillDisplay ?? "bar",
    showTimeline: config.showTimeline,
    hobbiesDisplay: config.hobbiesDisplay ?? "chips",
    experienceVariant: config.experienceVariant ?? "default",
  };
  const asideOpts: SectionRendererOptions = { lang,
    sectionStyle: config.asideSectionStyle ?? config.mainSectionStyle,
    skillDisplay: config.skillDisplay ?? "bar",
    hobbiesDisplay: config.hobbiesDisplay ?? "chips",
  };

  return (
    <AutoFitPage>
      <div style={{ width: PAGE_W, minHeight: PAGE_H, backgroundColor: config.bodyBg, fontFamily: tokens.fontFamily }}>
        {/* Header */}
        <div style={{ backgroundColor: config.headerBg, padding: `${headerPadV}px ${headerPadH}px` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            {config.photoOnLeft !== false && data.personal.photo && (
              <PhotoCircle
                url={data.personal.photo}
                name={data.personal.fullName}
                size={photoSize}
                bgColor={tokens.color.accent + "80"}
                borderColor="rgba(255,255,255,0.4)"
                borderWidth={2}
              />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: tokens.font.name, fontWeight: 800, color: config.headerTextColor, lineHeight: 1.15, fontFamily: tokens.fontFamily }}>
                {data.personal.fullName}
              </div>
              {data.personal.jobTitle && (
                <div style={{ fontSize: tokens.font.nameTitle, color: config.headerSubColor, marginTop: 3, fontFamily: tokens.fontFamily }}>
                  {data.personal.jobTitle}
                </div>
              )}
              <div style={{ marginTop: 8 }}>
                <ContactBlock personal={data.personal} tokens={tokens} iconColor={config.headerContactColor} vertical={false} />
              </div>
            </div>
            {config.photoOnLeft === false && data.personal.photo && (
              <PhotoCircle
                url={data.personal.photo}
                name={data.personal.fullName}
                size={photoSize}
                bgColor={tokens.color.accent + "80"}
                borderColor="rgba(255,255,255,0.4)"
                borderWidth={2}
              />
            )}
          </div>
        </div>

        {/* Body */}
        <div style={{ display: "flex", flex: 1 }}>
          {/* Main column */}
          <div style={{
            flex: 1, padding: `${tokens.space.pageV}px ${tokens.space.pageH}px`,
            display: "flex", flexDirection: "column", gap: tokens.space.section,
          }}>
            {mainSections.map(key => {
              const node = renderSection(key, data, tokens, mainOpts);
              return node ? <div key={key}>{node}</div> : null;
            })}
          </div>

          {/* Aside (optional) */}
          {config.asideWidth && asideSectionList.length > 0 && (
            <div style={{
              width: config.asideWidth, flexShrink: 0,
              backgroundColor: tokens.color.faint,
              padding: `${tokens.space.pageV}px ${tokens.space.pageH - 8}px`,
              display: "flex", flexDirection: "column", gap: tokens.space.section,
              borderLeft: `1px solid ${tokens.color.faint}`,
            }}>
              {asideSectionList.map(key => {
                const node = renderSection(key, data, tokens, asideOpts);
                return node ? <div key={key}>{node}</div> : null;
              })}
            </div>
          )}
        </div>
      </div>
    </AutoFitPage>
  );
}

// ─── MINIMAL LAYOUT ───────────────────────────────────────────────────────────
// Single column, full width. Name centered, contact centered.
// Clean editorial feel — large whitespace, accent color sparingly.

export interface MinimalLayoutConfig {
  bg: string;
  nameAlign: "left" | "center";
  dividerStyle: "solid" | "dotted" | "none";
  sectionStyle: SectionStyle;
  skillDisplay?: SectionRendererOptions["skillDisplay"];
  hobbiesDisplay?: "chips" | "text";
  accentOnName?: boolean;
  experienceVariant?: ExperienceVariant;
}

export function MinimalLayout({
  data, tokens, config, lang = "en",
}: { data: CVData; tokens: DesignTokens; config: MinimalLayoutConfig; lang?: Lang }) {
  const order = getOrder(data);
  const opts: SectionRendererOptions = { lang,
    sectionStyle: config.sectionStyle,
    skillDisplay: config.skillDisplay ?? "chip",
    hobbiesDisplay: config.hobbiesDisplay ?? "chips",
    experienceVariant: config.experienceVariant ?? "default",
  };
  const ta = config.nameAlign;

  return (
    <AutoFitPage>
      <div style={{
        width: PAGE_W, minHeight: PAGE_H,
        backgroundColor: config.bg, fontFamily: tokens.fontFamily,
        padding: `${tokens.space.pageV}px ${tokens.space.pageH}px`,
        boxSizing: "border-box",
      }}>
        {/* Header */}
        <div style={{ textAlign: ta, marginBottom: tokens.space.section }}>
          <div style={{
            fontSize: tokens.font.name + 2, fontWeight: 800,
            color: config.accentOnName ? tokens.color.accent : tokens.color.text,
            letterSpacing: "-0.02em", fontFamily: tokens.fontFamily, lineHeight: 1.15,
          }}>
            {data.personal.fullName}
          </div>
          {data.personal.jobTitle && (
            <div style={{ fontSize: tokens.font.nameTitle, color: tokens.color.muted, marginTop: 4, fontFamily: tokens.fontFamily }}>
              {data.personal.jobTitle}
            </div>
          )}
          <div style={{ marginTop: 8 }}>
            <ContactBlock personal={data.personal} tokens={tokens} iconColor={tokens.color.muted} vertical={false} />
          </div>
        </div>

        {/* Divider */}
        {config.dividerStyle !== "none" && (
          <div style={{
            height: 1.5, backgroundColor: tokens.color.accent, opacity: 0.7, marginBottom: tokens.space.section,
          }} />
        )}

        {/* Sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: tokens.space.section }}>
          {order.map(key => {
            const node = renderSection(key, data, tokens, opts);
            return node ? <div key={key}>{node}</div> : null;
          })}
        </div>
      </div>
    </AutoFitPage>
  );
}

// ─── TWO-COLUMN LAYOUT ────────────────────────────────────────────────────────
// Full-width header (no sidebar) + body split into two independent columns.
// Each column has its own section list and section style.
// Useful for creative / magazine-style layouts.

export interface TwoColumnLayoutConfig {
  headerBg: string;
  headerTextColor: string;
  headerSubColor: string;
  headerContactColor: string;
  leftBg: string;
  rightBg: string;
  leftWidth: number;           // px, right gets flex:1
  leftSections: string[];      // sections in left column
  rightSections: string[];     // sections in right column
  leftSectionStyle: SectionStyle;
  rightSectionStyle: SectionStyle;
  dividerColor?: string;       // optional vertical divider between columns
  headerPaddingV?: number;
  photoSize?: number;
  photoOnLeft?: boolean;
  skillDisplay?: SectionRendererOptions["skillDisplay"];
  hobbiesDisplay?: "chips" | "text";
  experienceVariant?: ExperienceVariant;
  showTimeline?: boolean;
}

export function TwoColumnLayout({
  data, tokens, config, lang = "en",
}: { data: CVData; tokens: DesignTokens; config: TwoColumnLayoutConfig; lang?: Lang }) {
  const leftOpts: SectionRendererOptions = { lang,
    sectionStyle: config.leftSectionStyle,
    skillDisplay: config.skillDisplay ?? "bar",
    hobbiesDisplay: config.hobbiesDisplay ?? "chips",
    experienceVariant: config.experienceVariant ?? "default",
    showTimeline: config.showTimeline,
  };
  const rightOpts: SectionRendererOptions = { lang,
    sectionStyle: config.rightSectionStyle,
    skillDisplay: config.skillDisplay ?? "bar",
    hobbiesDisplay: config.hobbiesDisplay ?? "chips",
    experienceVariant: config.experienceVariant ?? "default",
  };
  const photoSize = config.photoSize ?? 72;
  const padV = config.headerPaddingV ?? 22;

  return (
    <AutoFitPage>
      <div style={{ width: PAGE_W, minHeight: PAGE_H, fontFamily: tokens.fontFamily, backgroundColor: "#fff" }}>
        {/* Header */}
        <div style={{ backgroundColor: config.headerBg, padding: `${padV}px ${tokens.space.pageH}px` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {config.photoOnLeft !== false && data.personal.photo && (
              <PhotoCircle url={data.personal.photo} name={data.personal.fullName} size={photoSize}
                bgColor={tokens.color.accent + "60"} borderColor="rgba(255,255,255,0.35)" borderWidth={2} />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: tokens.font.name, fontWeight: 800, color: config.headerTextColor, lineHeight: 1.15 }}>
                {data.personal.fullName}
              </div>
              {data.personal.jobTitle && (
                <div style={{ fontSize: tokens.font.nameTitle, color: config.headerSubColor, marginTop: 3 }}>
                  {data.personal.jobTitle}
                </div>
              )}
              <div style={{ marginTop: 7 }}>
                <ContactBlock personal={data.personal} tokens={tokens} iconColor={config.headerContactColor} vertical={false} />
              </div>
            </div>
          </div>
        </div>

        {/* Two-column body */}
        <div style={{ display: "flex", minHeight: PAGE_H - 120 }}>
          {/* Left */}
          <div style={{
            width: config.leftWidth, flexShrink: 0,
            backgroundColor: config.leftBg,
            padding: `${tokens.space.pageV}px ${tokens.space.pageH - 4}px`,
            display: "flex", flexDirection: "column", gap: tokens.space.section,
            borderRight: config.dividerColor ? `1px solid ${config.dividerColor}` : undefined,
          }}>
            {config.leftSections.map(key => {
              const node = renderSection(key, data, tokens, leftOpts);
              return node ? <div key={key}>{node}</div> : null;
            })}
          </div>
          {/* Right */}
          <div style={{
            flex: 1,
            backgroundColor: config.rightBg,
            padding: `${tokens.space.pageV}px ${tokens.space.pageH}px`,
            display: "flex", flexDirection: "column", gap: tokens.space.section,
          }}>
            {config.rightSections.map(key => {
              const node = renderSection(key, data, tokens, rightOpts);
              return node ? <div key={key}>{node}</div> : null;
            })}
          </div>
        </div>
      </div>
    </AutoFitPage>
  );
}

// ─── ACCENT BAND LAYOUT ───────────────────────────────────────────────────────
// A thin colored accent band runs the full left edge of the page.
// The rest of the page is a single column — name/contact at top, sections below.
// Much more minimal than a sidebar — the band is purely decorative (8-16px wide).

export interface AccentBandLayoutConfig {
  bandWidth: number;           // 6-20px recommended
  bandColor: string;           // usually primaryColor or a fixed color
  bg: string;
  nameColor: string;
  nameSize?: number;           // defaults to tokens.font.name
  sectionStyle: SectionStyle;
  skillDisplay?: SectionRendererOptions["skillDisplay"];
  hobbiesDisplay?: "chips" | "text";
  experienceVariant?: ExperienceVariant;
  showTimeline?: boolean;
  photoSize?: number;
  photoRadius?: number;
  contactIconColor?: string;
  topRule?: boolean;           // draw a rule below the name block
}

export function AccentBandLayout({
  data, tokens, config, lang = "en",
}: { data: CVData; tokens: DesignTokens; config: AccentBandLayoutConfig; lang?: Lang }) {
  const order = getOrder(data);
  const opts: SectionRendererOptions = { lang,
    sectionStyle: config.sectionStyle,
    skillDisplay: config.skillDisplay ?? "bar",
    hobbiesDisplay: config.hobbiesDisplay ?? "chips",
    experienceVariant: config.experienceVariant ?? "default",
    showTimeline: config.showTimeline,
  };
  const iconColor = config.contactIconColor ?? tokens.color.muted;
  const photoSize = config.photoSize ?? 0;
  const photoRadius = config.photoRadius ?? 50;
  const contentPadL = tokens.space.pageH;

  return (
    <AutoFitPage>
      <div style={{ width: PAGE_W, minHeight: PAGE_H, display: "flex", fontFamily: tokens.fontFamily, backgroundColor: config.bg }}>
        {/* Accent band */}
        <div style={{ width: config.bandWidth, flexShrink: 0, backgroundColor: config.bandColor }} />

        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0, padding: `${tokens.space.pageV}px ${tokens.space.pageH}px ${tokens.space.pageV}px ${contentPadL - config.bandWidth / 2}px` }}>
          {/* Identity block */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: tokens.space.section }}>
            {photoSize > 0 && data.personal.photo && (
              <div style={{ borderRadius: photoRadius === 50 ? "50%" : photoRadius, overflow: "hidden", flexShrink: 0, width: photoSize, height: photoSize }}>
                <PhotoCircle url={data.personal.photo} name={data.personal.fullName} size={photoSize}
                  bgColor={tokens.color.accent + "30"} borderColor={tokens.color.faint} borderWidth={2} />
              </div>
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: config.nameSize ?? tokens.font.name + 2, fontWeight: 800, color: config.nameColor, lineHeight: 1.15, letterSpacing: "-0.01em" }}>
                {data.personal.fullName}
              </div>
              {data.personal.jobTitle && (
                <div style={{ fontSize: tokens.font.nameTitle, color: tokens.color.muted, marginTop: 3 }}>
                  {data.personal.jobTitle}
                </div>
              )}
              <div style={{ marginTop: 7 }}>
                <ContactBlock personal={data.personal} tokens={tokens} iconColor={iconColor} vertical={false} />
              </div>
            </div>
          </div>

          {config.topRule && (
            <div style={{ height: 1.5, backgroundColor: config.bandColor, opacity: 0.4, marginBottom: tokens.space.section }} />
          )}

          {/* Sections */}
          <div style={{ display: "flex", flexDirection: "column", gap: tokens.space.section }}>
            {order.map(key => {
              const node = renderSection(key, data, tokens, opts);
              return node ? <div key={key}>{node}</div> : null;
            })}
          </div>
        </div>
      </div>
    </AutoFitPage>
  );
}
