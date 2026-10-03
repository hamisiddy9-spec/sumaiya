/**
 * The bilingual surface. `i18n.tsx` is imported by 45 files — every screen,
 * sheet and card a user reads — and its API is a single untyped call:
 *
 *     t("Save to My CVs", "Hifadhi kwenye CV zangu")
 *
 * There is no key registry and no dictionary, so there is no compiler and no
 * runtime that can tell you a Swahili user is about to be shown English, an
 * empty string, or the literal text "undefined". Those three failures are what
 * this file guards, in the only two ways they can be caught:
 *
 *   1. RUNTIME — the parts that are real functions: greetingFor(), the
 *      useLang() fallback, and the whole LangProvider lifecycle (stored choice
 *      read on mount, setLang() persisting + PATCHing the server, a secure
 *      store that throws) driven through a React renderer.
 *   2. STATIC — every one of the ~650 `t(en, sw)` call sites in src/, parsed
 *      out of the source with comments masked, asserting each call supplies
 *      BOTH languages and that the Swahili slot is never empty, never the
 *      English string, and never an `.en` field passed twice.
 *
 * What this does NOT cover: the wording/grammar of any individual Swahili
 * string (that is swahili-lint.test.ts), and how a screen actually lays the
 * string out. See the report accompanying this file.
 */
import fs from "fs";
import path from "path";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { LangProvider, getLastKnownLang, greetingFor, useLang } from "./i18n";

jest.mock("@sumaiya/utils", () => ({
  getSecureItem: jest.fn(),
  setSecureItem: jest.fn(),
}));
jest.mock("./api-client", () => ({
  apiClient: { setLangPreference: jest.fn() },
}));

import { getSecureItem, setSecureItem } from "@sumaiya/utils";
import { apiClient } from "./api-client";

const getStored = getSecureItem as jest.Mock;
const setStored = setSecureItem as jest.Mock;
const setLangPreference = apiClient.setLangPreference as jest.Mock;

// ---------------------------------------------------------------------------
// 1. Runtime — the provider and the two exported functions that need no React
// ---------------------------------------------------------------------------

let current: ReturnType<typeof useLang> | null = null;
let renderCount = 0;

function Probe() {
  current = useLang();
  renderCount++;
  return null;
}

async function mount(tree: React.ReactElement): Promise<ReactTestRenderer> {
  let created!: ReactTestRenderer;
  await act(async () => {
    created = create(tree);
  });
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
  return created;
}

const mountProvider = () =>
  mount(React.createElement(LangProvider, null, React.createElement(Probe)));

const api = () => {
  if (!current) throw new Error("Probe never rendered");
  return current;
};

beforeEach(() => {
  current = null;
  renderCount = 0;
  jest.clearAllMocks();
  getStored.mockResolvedValue(null);
  setStored.mockResolvedValue(undefined);
  setLangPreference.mockResolvedValue(undefined);
});

describe("i18n — the language starts as English and only ever en or sw", () => {
  it("reports English before anything has been stored", () => {
    // Fresh module instance, so this is the real initial value rather than
    // whatever an earlier test left behind.
    jest.isolateModules(() => {
      const fresh = require("./i18n") as typeof import("./i18n");
      expect(fresh.getLastKnownLang()).toBe("en");
    });
  });

  it("is English, and not yet ready, until the stored choice has been read", async () => {
    // `ready: false` is what stops a Swahili user's first paint from being a
    // flash of English they then have to re-read.
    getStored.mockReturnValue(new Promise(() => {}));
    await mountProvider();
    expect(api().lang).toBe("en");
    expect(api().ready).toBe(false);
    expect(api().t("Hello", "Habari")).toBe("Hello");
  });

  it("answers in Kiswahili once a stored choice of sw has been read", async () => {
    getStored.mockResolvedValue("sw");
    await mountProvider();
    expect(api().lang).toBe("sw");
    expect(api().ready).toBe(true);
    expect(api().t("Save to My CVs", "Hifadhi kwenye CV zangu")).toBe(
      "Hifadhi kwenye CV zangu",
    );
    expect(getLastKnownLang()).toBe("sw");
  });

  it("answers in English for a stored choice of en", async () => {
    getStored.mockResolvedValue("en");
    await mountProvider();
    expect(api().lang).toBe("en");
    expect(api().ready).toBe(true);
    expect(api().t("Save to My CVs", "Hifadhi kwenye CV zangu")).toBe("Save to My CVs");
  });

  it("ignores anything else the store hands back instead of rendering it", async () => {
    for (const junk of ["fr", "SW", "sw ", "", 0, null, undefined, {}, "en-US"]) {
      getStored.mockResolvedValue(junk);
      await mountProvider();
      expect(api().lang).toBe("en");
      expect(api().ready).toBe(true);
    }
  });

  it("still reaches ready when the secure store throws", async () => {
    getStored.mockRejectedValue(new Error("keychain locked"));
    await mountProvider();
    expect(api().lang).toBe("en");
    expect(api().ready).toBe(true);
  });
});

describe("i18n — switching language", () => {
  it("applies immediately, persists, and tells the server", async () => {
    getStored.mockResolvedValue(null);
    await mountProvider();
    expect(api().lang).toBe("en");

    await act(async () => {
      api().setLang("sw");
    });

    // The screen re-renders in the new language...
    expect(api().lang).toBe("sw");
    expect(api().t("Back", "Rudi")).toBe("Rudi");
    // ...the choice survives the next launch...
    expect(setStored).toHaveBeenCalledWith("language", "sw");
    // ...and the server can compose notifications in it (language-sync.tsx
    // exists because this call alone is not enough; it needs a token).
    expect(setLangPreference).toHaveBeenCalledWith("sw");
    // The crash boundary and auth-errors have no context to read.
    expect(getLastKnownLang()).toBe("sw");

    await act(async () => {
      api().setLang("en");
    });
    expect(api().lang).toBe("en");
    expect(getLastKnownLang()).toBe("en");
  });

  it("switches the visible language even when persisting and the PATCH both fail", async () => {
    getStored.mockResolvedValue(null);
    await mountProvider();

    setStored.mockRejectedValue(new Error("keychain full"));
    setLangPreference.mockRejectedValue(new Error("offline"));

    await act(async () => {
      api().setLang("sw");
    });

    // The user asked for Kiswahili on this device; a failed save or a failed
    // PATCH must not silently revert them to English.
    expect(api().lang).toBe("sw");
    expect(api().t("Back", "Rudi")).toBe("Rudi");
  });

  it("re-renders consumers when the language changes", async () => {
    getStored.mockResolvedValue(null);
    await mountProvider();
    const before = renderCount;
    await act(async () => {
      api().setLang("sw");
    });
    expect(renderCount).toBeGreaterThan(before);
  });

  it("does not touch the server when nothing has been switched", async () => {
    getStored.mockResolvedValue("sw");
    await mountProvider();
    expect(setLangPreference).not.toHaveBeenCalled();
    expect(setStored).not.toHaveBeenCalled();
  });
});

describe("i18n — useLang() without the provider (the defensive path)", () => {
  it("never crashes and answers in English", async () => {
    // A screen rendered outside LangProvider in a test, or a crash inside the
    // provider itself, must not throw "useLang must be used within...".
    await mount(React.createElement(Probe));
    expect(api().lang).toBe("en");
    expect(api().ready).toBe(true);
    expect(api().t("Hello", "Habari")).toBe("Hello");
    expect(() => api().setLang("sw")).not.toThrow();
  });

  it("cannot leave the app claiming the wrong language after it", async () => {
    // setLang() is a no-op here, so the language never changes and nothing is
    // persisted behind the provider's back.
    await mount(React.createElement(Probe));
    api().setLang("sw");
    expect(setStored).not.toHaveBeenCalled();
    expect(setLangPreference).not.toHaveBeenCalled();
  });
});

describe("i18n — Sumaiya's opening line", () => {
  const en = greetingFor("en");
  const sw = greetingFor("sw");

  it("greets in the language the user chose", () => {
    expect(en).toContain("Hi, I'm Sumaiya");
    expect(sw).toContain("Habari, mimi ni Sumaiya");
  });

  it("is a real sentence in each, not one string reused for both", () => {
    expect(sw).not.toBe(en);
    expect(sw.length).toBeGreaterThan(40);
    expect(en.length).toBeGreaterThan(40);
  });

  it("says in English that Kiswahili is available, and never in English to a Swahili user", () => {
    expect(en).toContain("Kiswahili");
    // The bug this guards: a Swahili user greeted by the English line.
    expect(sw).not.toContain("Hi, I'm Sumaiya");
    expect(sw).not.toMatch(/\bWhat are you working on\b/);
  });

  it("offers the same things in both", () => {
    for (const line of [en, sw]) {
      expect(line.toLowerCase()).toMatch(/cv/);
      // cover letter: "cover letter" / "barua ya maombi"
      expect(line.toLowerCase()).toMatch(/cover letter|barua ya maombi/);
    }
  });
});

// ---------------------------------------------------------------------------
// 2. Static — every t(en, sw) call site in the app
// ---------------------------------------------------------------------------

const SRC = path.join(__dirname, "..");

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules") continue;
      walk(full, out);
    } else if (/\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

/**
 * Blank out comments, keeping every offset and newline in place.
 *
 * Needed because the codebase CITES `t("…", …)` inside explanatory comments
 * (lib/app-errors.ts:9 is the one that caught this out) and those citations are
 * not call sites. String and template literals are preserved — they are the API
 * being checked — and regex literals are skipped rather than mistaken for the
 * start of a comment (cv-engine/html.ts contains /"/g).
 */
function maskComments(src: string): string {
  const out: string[] = [];
  let quote: string | null = null;
  let i = 0;
  const tail = () => out.join("").replace(/\s+$/, "");
  while (i < src.length) {
    const c = src[i];
    const next = src[i + 1] ?? "";
    if (quote) {
      out.push(c);
      if (c === "\\") {
        out.push(next);
        i += 2;
        continue;
      }
      if (c === quote) quote = null;
      i++;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      quote = c;
      out.push(c);
      i++;
      continue;
    }
    if (c === "/" && next === "/") {
      while (i < src.length && src[i] !== "\n") {
        out.push(" ");
        i++;
      }
      continue;
    }
    if (c === "/" && next === "*") {
      while (i < src.length && !(src[i] === "*" && src[i + 1] === "/")) {
        out.push(src[i] === "\n" ? "\n" : " ");
        i++;
      }
      out.push("  ");
      i += 2;
      continue;
    }
    if (c === "/") {
      const before = tail();
      const last = before.slice(-1);
      const startsRegex =
        last === "" ||
        "(,=:[!&|?{};+-*%~^<>".includes(last) ||
        /(return|typeof|case|in|of|delete|void|instanceof|new|do|else|yield|await)$/.test(before);
      if (startsRegex) {
        out.push(c);
        i++;
        let inClass = false;
        while (i < src.length) {
          const ch = src[i];
          out.push(ch);
          if (ch === "\\") {
            out.push(src[i + 1] ?? "");
            i += 2;
            continue;
          }
          if (ch === "[") inClass = true;
          else if (ch === "]") inClass = false;
          else if (ch === "/" && !inClass) break;
          else if (ch === "\n") break;
          i++;
        }
        i++;
        continue;
      }
    }
    out.push(c);
    i++;
  }
  return out.join("");
}

/** Split an argument list on top-level commas only. */
function splitArgs(text: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let cur = "";
  let quote: string | null = null;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quote) {
      cur += c;
      if (c === "\\") {
        cur += text[i + 1] ?? "";
        i++;
        continue;
      }
      if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      quote = c;
      cur += c;
      continue;
    }
    if (c === "(" || c === "[" || c === "{") depth++;
    else if (c === ")" || c === "]" || c === "}") depth--;
    else if (c === "," && depth === 0) {
      parts.push(cur);
      cur = "";
      continue;
    }
    cur += c;
  }
  parts.push(cur);
  if (parts.length > 1 && parts[parts.length - 1].trim() === "") parts.pop();
  return parts.map((p) => p.trim());
}

interface CallSite {
  file: string;
  line: number;
  args: string[];
}

const CALL = /(?<![A-Za-z0-9_$.])t\(/g;

function findCallSites(): { callSites: CallSite[]; files: number } {
  const files = walk(SRC);
  const callSites: CallSite[] = [];
  for (const file of files) {
    const masked = maskComments(fs.readFileSync(file, "utf8"));
    CALL.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = CALL.exec(masked))) {
      let i = m.index + m[0].length;
      let depth = 1;
      let quote: string | null = null;
      while (i < masked.length && depth > 0) {
        const c = masked[i];
        if (quote) {
          if (c === "\\") {
            i += 2;
            continue;
          }
          if (c === quote) quote = null;
        } else if (c === '"' || c === "'" || c === "`") quote = c;
        else if (c === "(") depth++;
        else if (c === ")") depth--;
        i++;
      }
      callSites.push({
        file: path.relative(SRC, file).replace(/\\/g, "/"),
        line: masked.slice(0, m.index).split("\n").length,
        args: splitArgs(masked.slice(m.index + m[0].length, i - 1)),
      });
      CALL.lastIndex = m.index + m[0].length;
    }
  }
  return { callSites, files: files.length };
}

const { callSites, files: scannedFiles } = findCallSites();
const named = (c: CallSite) => `${c.file}:${c.line}`;
const isLiteral = (a: string) =>
  a.length >= 2 && (a[0] === '"' || a[0] === "'" || a[0] === "`") && a[a.length - 1] === a[0];
const textOf = (a: string) => a.slice(1, -1).trim();

describe("i18n — every t(en, sw) call site in src/", () => {
  it("found the module's call sites (the scan cannot pass by finding nothing)", () => {
    // 45 files import this module; a handful use only greetingFor/useLang.
    expect(scannedFiles).toBeGreaterThan(300);
    expect(callSites.length).toBeGreaterThan(500);
    const filesWithCalls = new Set(callSites.map((c) => c.file));
    expect(filesWithCalls.size).toBeGreaterThan(40);
  });

  it("was checked with comments removed — a cited call in a comment is not a call", () => {
    // Two real files prove the mask: app-errors.ts explains the old pattern in
    // a comment, cv-engine/html.ts holds /"/g (a quote inside a regex literal,
    // which a naive stripper mistakes for a string).
    const appErrors = maskComments(
      fs.readFileSync(path.join(SRC, "lib", "app-errors.ts"), "utf8"),
    );
    expect(appErrors).toContain("friendlyApiError");
    expect(appErrors).not.toContain("Couldn't tailor to this job");
    const html = maskComments(
      fs.readFileSync(path.join(SRC, "lib", "cv-engine", "html.ts"), "utf8"),
    );
    expect(html).toContain(".replace(/&/g, \"&amp;\")");
  });

  it("always passes BOTH languages (a missing sw renders as the text 'undefined')", () => {
    const offenders = callSites
      .filter((c) => c.args.length !== 2)
      .map((c) => `${named(c)} has ${c.args.length} argument(s)`);
    expect(offenders).toEqual([]);
  });

  it("never passes an empty string in either language slot", () => {
    const offenders = callSites
      .filter((c) => c.args.length === 2 && c.args.some((a) => isLiteral(a) && textOf(a) === ""))
      .map((c) => `${named(c)} -> ${JSON.stringify(c.args)}`);
    expect(offenders).toEqual([]);
  });

  it("never passes the English string as the Swahili one", () => {
    // Identical pairs are legitimate ONLY for proper nouns and product names
    // that are not translated. Anything else appearing here means English copy
    // leaked into the Swahili slot — the failure a user cannot report as a bug,
    // they just quietly get English.
    const SHARED_IN_BOTH_LANGUAGES = new Set([
      "Sumaiya",
      "Sumaiya Premium",
      "TemplateHub",
      "TemplateHub Premium",
      "Premium",
      // The named "share this app's APK" action — a feature name, not a
      // sentence to translate (see apps/native/src/lib/apk-share.ts).
      "Nitumie Sumaiya",
    ]);
    const offenders = callSites
      .filter((c) => {
        if (c.args.length !== 2) return false;
        const [en, sw] = c.args;
        if (!isLiteral(en) || !isLiteral(sw)) return false;
        return en === sw && !SHARED_IN_BOTH_LANGUAGES.has(textOf(en));
      })
      .map((c) => `${named(c)} -> ${c.args[0]}`);
    expect(offenders).toEqual([]);
  });

  it("never passes a .en / .title field into the Swahili slot", () => {
    // The dynamic call sites (t(r.en, r.sw), t(course.title.en, course.title.sw))
    // are where a copy-paste of the same field twice is invisible in review.
    const offenders = callSites
      .filter((c) => {
        if (c.args.length !== 2) return false;
        const sw = c.args[1];
        if (isLiteral(sw)) return false;
        return !/sw/i.test(sw) && !sw.includes("…");
      })
      .map((c) => `${named(c)} -> ${c.args[1]}`);
    expect(offenders).toEqual([]);
  });
});
