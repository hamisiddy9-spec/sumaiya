#!/usr/bin/env node
/**
 * gen-native-templates.mjs — mirror the web CV template registry into the
 * native app's engine format.
 *
 * The web app draws its 266 templates with a small engine: every template picks
 * one of five layout components, optionally overrides design tokens, and hands
 * the layout a config object. Most templates are exactly that — a ~17 line
 * config. This script reads those configs out of the web source and emits one
 * native template module each, so the two platforms cannot drift and nobody
 * re-authors copy.
 *
 * Two things the web source does that are resolved here, at generation time:
 *   - `primaryColor` in a config becomes the sentinel "@accent"; the native
 *     renderer substitutes the real accent at render time.
 *   - `tokens.color.x` / `tokens.font.x` / `tokens.space.x` are resolved to the
 *     literal value the web would have produced (token defaults + this
 *     template's own makeTokens overrides), so the native renderer never has to
 *     re-derive them.
 *
 * Templates that are bespoke components are reported, never guessed.
 *
 *   node scripts/gen-native-templates.mjs [--check]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WEB_TYPES = path.join(ROOT, "apps/web/types/index.ts");
const WEB_TPL_DIR = path.join(ROOT, "apps/web/components/templates");
const OUT_DIR = path.join(ROOT, "apps/native/src/lib/templates");
const CHECK = process.argv.includes("--check");

const LAYOUTS = ["SidebarLayout", "HeaderLayout", "MinimalLayout", "TwoColumnLayout", "AccentBandLayout"];

/** The accent placeholder the native renderer replaces at render time. */
export const ACCENT = "@accent";

/** Mirrors apps/native/src/lib/cv-engine/document.ts. */
const DOC_DEFAULTS = {
  density: "normal",
  experienceVariant: "default",
  skillDisplay: "bar",
  showTimeline: false,
  hobbiesDisplay: "chips",
};

const DENSITY = {
  compact: { mul: 0.9, space: { pageH: 22, pageV: 22, section: 9, entry: 6, line: 1.36 } },
  normal: { mul: 1.0, space: { pageH: 28, pageV: 28, section: 15, entry: 10, line: 1.5 } },
  airy: { mul: 1.1, space: { pageH: 34, pageV: 34, section: 22, entry: 15, line: 1.64 } },
};

const COLOR_DEFAULTS = {
  text: "#111827",
  sub: "#374151",
  muted: "#6B7280",
  faint: "#F3F4F6",
  sidebarBg: "#F8FAFC",
  onSidebar: "#1F2937",
  onSidebarMuted: "#4B5563",
  onAccent: "#FFFFFF",
};

/** Mirrors makeTokens() so token references inside a config resolve to literals. */
function computeTokens(overrides = {}, density = "normal") {
  const d = DENSITY[density] ?? DENSITY.normal;
  const m = d.mul;
  const r = (n) => Math.round(n * m * 10) / 10;
  return {
    font: {
      name: r(26), nameTitle: r(12), sectionLabel: r(9), roleTitle: r(12),
      orgName: r(10.5), body: r(9.75), meta: r(8.5), tag: r(8.5),
      ...(overrides.font || {}),
    },
    space: { ...d.space, ...(overrides.space || {}) },
    color: { accent: ACCENT, ...COLOR_DEFAULTS, ...(overrides.color || {}) },
    fontFamily: "system",
  };
}

// ---------------------------------------------------------------- web registry

function arrayLiteral(src, name) {
  const i = src.indexOf("export const " + name);
  if (i < 0) return null;
  const eq = src.indexOf("=", i);
  const start = src.indexOf("[", eq);
  let depth = 0;
  for (let k = start; k < src.length; k++) {
    if (src[k] === "[") depth++;
    else if (src[k] === "]") {
      depth--;
      if (depth === 0) return src.slice(start, k + 1);
    }
  }
  return null;
}

function parseTemplates() {
  const src = fs.readFileSync(WEB_TYPES, "utf8");
  const literal = arrayLiteral(src, "TEMPLATES");
  if (!literal) throw new Error("TEMPLATES array not found in " + WEB_TYPES);

  const entries = [];
  let depth = 0, start = -1, inStr = null;
  for (let k = 0; k < literal.length; k++) {
    const ch = literal[k];
    if (inStr) {
      if (ch === "\\") k++;
      else if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") { inStr = ch; continue; }
    if (ch === "{") { if (depth === 0) start = k; depth++; }
    else if (ch === "}") { depth--; if (depth === 0) entries.push(literal.slice(start, k + 1)); }
  }

  const field = (block, key) => {
    const m = new RegExp(key + '\\s*:\\s*"([^"]*)"').exec(block);
    return m ? m[1] : "";
  };

  const premium = new Set();
  const premLiteral = arrayLiteral(src, "PREMIUM_TEMPLATE_IDS");
  if (premLiteral) for (const m of premLiteral.matchAll(/"([^"]+)"/g)) premium.add(m[1]);

  return entries.map((block) => ({
    id: field(block, "id"),
    name: field(block, "name"),
    description: field(block, "description"),
    previewColor: field(block, "previewColor"),
    style: field(block, "style"),
    tier: premium.has(field(block, "id")) ? "premium" : "free",
  }));
}

// ------------------------------------------------------------ web component

/** Balanced `{...}` starting at the first brace after `from`. */
function braceAt(src, from) {
  const open = src.indexOf("{", from);
  if (open < 0) return null;
  let depth = 0;
  for (let k = open; k < src.length; k++) {
    if (src[k] === "{") depth++;
    else if (src[k] === "}") {
      depth--;
      if (depth === 0) return src.slice(open, k + 1);
    }
  }
  return null;
}

/** The argument object of resolveDocument(data, {...}). */
function personalityText(src) {
  const i = src.indexOf("resolveDocument(");
  return i < 0 ? null : braceAt(src, i);
}

/**
 * The object literal inside `config={{ ... }}`. The first `{` after `config=`
 * opens the JSX expression container, the second opens the object itself —
 * reading only one brace yields `{{…}}`, which is not valid JavaScript.
 */
function configText(src) {
  const i = src.indexOf("config={{");
  if (i < 0) return null;
  const container = src.indexOf("{", i + "config=".length);
  if (container < 0) return null;
  return braceAt(src, container + 1);
}

/** Overrides object passed as makeTokens()' third argument, if any. */
function tokenOverridesText(src) {
  const i = src.indexOf("makeTokens(");
  if (i < 0) return null;
  const open = src.indexOf("{", i);
  if (open < 0) return null;
  // makeTokens(accent, fontFamily, { ... }, density) — a `{` before the third
  // comma only exists when overrides were supplied.
  const beforeComma = src.slice(i, src.indexOf("}", open) + 1);
  if (!beforeComma.includes("{")) return null;
  return braceAt(src, open);
}

function evaluate(text, scope) {
  const names = Object.keys(scope);
  // eslint-disable-next-line no-new-func
  const fn = new Function(...names, "return (" + text + ");");
  return fn(...names.map((n) => scope[n]));
}

function toModuleName(id) {
  const camel = id.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
  return camel.replace(/^[a-z]/, (c) => c.toUpperCase()) + "Template";
}

function main() {
  const templates = parseTemplates();
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const generated = [], bespoke = [], unparsed = [], missingComponent = [];

  for (const t of templates) {
    const file = path.join(WEB_TPL_DIR, t.id + ".tsx");
    if (!fs.existsSync(file)) { missingComponent.push(t.id); continue; }
    const src = fs.readFileSync(file, "utf8");

    const layout = LAYOUTS.find((l) => src.includes("<" + l));
    const confSrc = configText(src);
    if (!layout || !confSrc) { bespoke.push(t.id); continue; }

    let personality, config, tokenOverrides = {};
    try {
      const pSrc = personalityText(src);
      personality = pSrc ? evaluate(pSrc, { doc: DOC_DEFAULTS }) : {};
      const oSrc = tokenOverridesText(src);
      if (oSrc) tokenOverrides = evaluate(oSrc, { primaryColor: ACCENT, fontFamily: "system" });

      const doc = { ...DOC_DEFAULTS, ...personality };
      const tokens = computeTokens(tokenOverrides, doc.density);
      config = evaluate(confSrc, { doc, tokens, primaryColor: ACCENT, fontFamily: "system" });
    } catch (err) {
      unparsed.push(`${t.id}: ${err.message}`);
      continue;
    }

    const body = `import type { NativeTemplate } from "./types";

/**
 * ${t.name} — ${t.description}
 * Generated from apps/web/components/templates/${t.id}.tsx (${layout}).
 * Do not edit by hand: run \`node scripts/gen-native-templates.mjs\`.
 * "@accent" is replaced with the live accent colour at render time.
 */
export const ${toModuleName(t.id)}: NativeTemplate = {
  id: ${JSON.stringify(t.id)},
  name: { en: ${JSON.stringify(t.name)}, sw: ${JSON.stringify(t.name)} },
  // TODO(copy): sw blurb — mirrored from the web description for now.
  blurb: { en: ${JSON.stringify(t.description)}, sw: ${JSON.stringify(t.description)} },
  tier: ${JSON.stringify(t.tier)},
  previewColor: ${JSON.stringify(t.previewColor)},
  style: ${JSON.stringify(t.style)},
  layout: ${JSON.stringify(layout)},
  personality: ${JSON.stringify(personality, null, 2).replace(/\n/g, "\n  ")},
  tokenOverrides: ${JSON.stringify(tokenOverrides, null, 2).replace(/\n/g, "\n  ")},
  config: ${JSON.stringify(config, null, 2).replace(/\n/g, "\n  ")},
};
`;
    generated.push({ id: t.id, moduleName: toModuleName(t.id), body });
  }

  generated.sort((a, b) => a.id.localeCompare(b.id));

  const registry = `import type { NativeTemplate } from "./types";
${generated.map((g) => `import { ${g.moduleName} } from "./${g.id}";`).join("\n")}

/**
 * Every CV template the native app can draw, keyed by the same id the web
 * registry uses. Generated by scripts/gen-native-templates.mjs — do not edit.
 */
export const TEMPLATE_REGISTRY: Record<string, NativeTemplate> = {
${generated.map((g) => `  ${JSON.stringify(g.id)}: ${g.moduleName},`).join("\n")}
};

/** Templates that still need a hand-written renderer. */
export const BESPOKE_IDS: string[] = ${JSON.stringify(bespoke)};
`;

  const report = [
    "templates in the web registry : " + templates.length,
    "declarative (config generated)  : " + generated.length,
    "bespoke (hand port needed)      : " + bespoke.length,
    "no component file              : " + (missingComponent.length ? missingComponent.join(", ") : "none"),
  ];
  if (unparsed.length) {
    report.push("COULD NOT PARSE (skipped, not guessed):");
    for (const u of unparsed) report.push("  " + u);
  }
  report.push("", "bespoke ids:", "  " + bespoke.join("\n  "));
  const summary = report.join("\n");

  if (CHECK) {
    const drift = generated.filter((g) => {
      const p = path.join(OUT_DIR, g.id + ".ts");
      return !fs.existsSync(p) || fs.readFileSync(p, "utf8") !== g.body;
    });
    console.log(`--check: ${drift.length} stale/missing of ${generated.length}`);
    if (drift.length) {
      console.log(drift.slice(0, 10).map((d) => "  " + d.id).join("\n"));
      process.exit(1);
    }
    return;
  }

  let written = 0;
  for (const g of generated) {
    const p = path.join(OUT_DIR, g.id + ".ts");
    if (!fs.existsSync(p) || fs.readFileSync(p, "utf8") !== g.body) {
      fs.writeFileSync(p, g.body);
      written++;
    }
  }
  fs.writeFileSync(path.join(OUT_DIR, "registry.ts"), registry);

  console.log(summary);
  console.log("\nfiles written : " + written);
}

main();
