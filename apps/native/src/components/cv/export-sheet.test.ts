/**
 * SCREEN 8 — the export / share sheet (Stitch `export_shiriki_modal_sheet`).
 *
 * The audit's headline finding was that this screen did not exist; what shipped
 * was a button that handed the PDF straight to the OS share sheet. These tests
 * cover the two things that make the sheet correct rather than merely present:
 *
 *   1. the DATA the sheet renders — real file size, real language, real
 *      tailored-for line, and the two capabilities this app genuinely does not
 *      have, each shipped visibly unavailable with its reason;
 *   2. the WIRING — every tile runs a real service (share / save / print), and
 *      the honesty rules the design would otherwise break (no "240 KB" fixture,
 *      no direct-to-WhatsApp promise, no "nothing goes to a server" claim).
 *
 * The heavy renderer deps are mocked so the module's pure surface can be
 * imported and asserted directly.
 */
import { readFileSync } from "fs";
import { join } from "path";

jest.mock("react-native-reanimated", () => ({
  __esModule: true,
  // Never rendered in these tests — the module's pure surface is what is
  // asserted — so the component stubs are inert placeholders.
  default: { View: () => null },
  useSharedValue: (v: unknown) => ({ value: v }),
  useAnimatedStyle: () => ({}),
  withTiming: (v: unknown) => v,
  runOnJS: (fn: unknown) => fn,
  useReducedMotion: () => false,
  Easing: {
    out: (f: unknown) => f,
    in: (f: unknown) => f,
    inOut: (f: unknown) => f,
    cubic: (x: number) => x,
    bezier: () => (x: number) => x,
  },
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock("expo-file-system/legacy", () => ({
  getInfoAsync: jest.fn(async () => ({ exists: true, uri: "file:///cache/x.pdf", size: 245760 })),
}));
jest.mock("../../services/share", () => ({ shareCV: jest.fn(), printPDF: jest.fn() }));
jest.mock("../../services/save-to-device", () => ({
  saveToPhone: jest.fn(),
  fileNameFromUri: (u: string) => u.split("/").pop() ?? "document.pdf",
  shouldOfferShare: () => false,
}));
jest.mock("../icon", () => ({ Icon: () => null }));
jest.mock("../../lib/i18n", () => ({
  useLang: () => ({ t: (en: string, _sw: string) => en, lang: "en" }),
  getLastKnownLang: () => "en",
}));
jest.mock("../ui", () => ({
  Button: () => null,
  EASE: { out: (f: unknown) => f, in: (f: unknown) => f },
  MOTION: { dur: { instant: 1, fast: 140, base: 220, slow: 300 } },
  dialog: { alert: jest.fn() },
  enterDurationMs: (r: boolean, d: number) => (r ? 1 : d),
  exitDurationMs: (r: boolean, d: number) => (r ? 1 : d),
  haptics: { light: jest.fn(), success: jest.fn(), error: jest.fn() },
  toast: { show: jest.fn() },
  useMotionReduced: () => false,
  useThemeColors: () => ({}),
}));

import {
  COVER_LETTER_TOGGLE,
  PAGE_FORMATS,
  PRIVACY_NOTICE,
  QUICK_SHARE_TILES,
  SHEET,
  documentLanguageBadge,
  formatFileSize,
  tailoredLine,
} from "./export-sheet";

const SOURCE = readFileSync(join(__dirname, "export-sheet.tsx"), "utf8");

// ── 1. The sheet's shape ─────────────────────────────────────────────────────
describe("the sheet's geometry is the mockup's, not a guess", () => {
  it("uses the mockup's radius, padding and grab bar", () => {
    // `rounded-t-[32px]`, a 36-wide grab bar, and nothing under 44 dp.
    expect(SHEET.radius).toBe(32);
    expect(SHEET.padding).toBe(20);
    expect(SHEET.gripWidth).toBe(36);
    expect(SHEET.gripHeight).toBe(5);
  });

  it("never lays out a control below the 44 dp floor (guide §8)", () => {
    expect(SHEET.tapMin).toBeGreaterThanOrEqual(44);
    // The tiles and the switch row read it rather than a literal.
    expect(SOURCE).toContain("minHeight: SHEET.tapMin");
    expect(SOURCE).toContain("SHEET.tapMin");
  });
});

// ── 2. Real values, not the design's fixtures ────────────────────────────────
describe("the metadata badges are real values of the exported file", () => {
  it("formats a real byte count", () => {
    expect(formatFileSize(245760)).toBe("240 KB");
    expect(formatFileSize(1536000)).toBe("1.5 MB");
    expect(formatFileSize(512)).toBe("512 B");
  });

  it("says the size is unknown rather than inventing one", () => {
    for (const junk of [null, undefined, -1, NaN, Infinity]) {
      expect(formatFileSize(junk as number)).toBeNull();
    }
    // And the sheet prints the honest fallback, never a fixture.
    expect(SOURCE).toMatch(/formatFileSize\(/);
    expect(SOURCE).toContain('t("Size unknown", "Ukubwa haujulikani")');
    expect(SOURCE).not.toContain("240 KB");
  });

  it("reads the file's actual size from the filesystem", () => {
    expect(SOURCE).toMatch(/getInfoAsync\(/);
  });

  it("names the language the document is actually written in", () => {
    // The mockup prints "Kiswahili & EN"; a single-language render is not that.
    expect(documentLanguageBadge("sw")).toEqual({ en: "Kiswahili", sw: "Kiswahili" });
    expect(documentLanguageBadge("en")).toEqual({ en: "English", sw: "Kiingereza" });
    expect(SOURCE).not.toContain("Kiswahili & EN");
  });

  it("tailors the line to a real job, or says plainly that there is none", () => {
    expect(tailoredLine({ title: "Teller Application", company: "NMB Bank" }, null)).toEqual({
      en: "Tailored for NMB Bank Teller Application",
      sw: "Imehaririwa kwa NMB Bank Teller Application",
    });
    // No job? The CV's own headline is a real field…
    expect(tailoredLine(null, "Warehouse Supervisor").en).toBe("Warehouse Supervisor");
    // …and with neither, it does not invent a job.
    const none = tailoredLine(null, null);
    expect(none.en).toMatch(/not tailored/i);
    expect(none.sw).toMatch(/haijalengwa/i);
  });
});

// ── 3. The four tiles ────────────────────────────────────────────────────────
describe("the four quick-share tiles", () => {
  it("are the mockup's four, in the mockup's order", () => {
    expect(QUICK_SHARE_TILES.map((tile) => tile.id)).toEqual(["whatsapp", "save", "email", "print"]);
  });

  it("are bilingual in both the label and the sub-line", () => {
    for (const tile of QUICK_SHARE_TILES) {
      for (const lang of ["en", "sw"] as const) {
        expect(tile.label[lang].trim().length).toBeGreaterThan(2);
        expect(tile.sub[lang].trim().length).toBeGreaterThan(10);
      }
      expect(tile.label.sw).not.toBe(tile.label.en);
      expect(tile.sub.sw).not.toBe(tile.sub.en);
    }
  });

  it("marks WhatsApp as the recommended one, as the mockup does", () => {
    const recommended = QUICK_SHARE_TILES.filter((tile) => tile.recommended);
    expect(recommended.map((tile) => tile.id)).toEqual(["whatsapp"]);
  });

  it("does not promise a send the app cannot make", () => {
    // The mockup's WhatsApp sub-line promises a message straight to an employer
    // or a personal number. There is no direct-to-number path in the app.
    const whatsapp = QUICK_SHARE_TILES.find((tile) => tile.id === "whatsapp")!;
    expect(whatsapp.sub.en).not.toMatch(/direct(ly)? to (an )?(employer|number)/i);
    expect(whatsapp.sub.sw).not.toMatch(/moja kwa moja kwa mwajiri|namba binafsi/i);
    // It says what actually happens: the share list opens.
    expect(whatsapp.sub.en.toLowerCase()).toMatch(/share list/);
  });

  it("is wired to the real services, not stubs", () => {
    expect(SOURCE).toMatch(/shareCV\(cv, pdfUri\)/);
    expect(SOURCE).toMatch(/saveToPhone\(pdfUri, fileName\)/);
    expect(SOURCE).toMatch(/printPDF\(pdfUri\)/);
    // A share tile and the save tile must go through the one tested place that
    // decides "not saved" — so a dismissed folder picker is never silent.
    expect(SOURCE).toMatch(/shouldOfferShare\(/);
    expect(SOURCE).toMatch(/fileNameFromUri\(/);
    expect(SOURCE).not.toMatch(/onPress=\{\(\) => \{\}\}/);
  });
});

// ── 4. The two capabilities that genuinely do not exist ──────────────────────
describe("capabilities this app does not have ship visibly unavailable", () => {
  it("offers A4 only, and says why US Letter is not offered", () => {
    const available = PAGE_FORMATS.filter((f) => f.available);
    expect(available.map((f) => f.id)).toEqual(["a4"]);
    expect(available[0].label.sw).toContain("Viwango vya Tanzania");

    const letter = PAGE_FORMATS.find((f) => f.id === "letter")!;
    expect(letter.available).toBe(false);
    expect(letter.reason).not.toBeNull();
    expect(letter.reason!.en.trim().length).toBeGreaterThan(10);
    expect(letter.reason!.sw.trim().length).toBeGreaterThan(10);
    // It never becomes selectable in the source.
    expect(SOURCE).toContain("disabled: !f.available");
  });

  it("ships the attach-cover-letter toggle disabled, with its reason", () => {
    // The native app prints one document per call and has no PDF merge, so the
    // mockup's "combine CV + letter into one file" cannot be honoured.
    expect(COVER_LETTER_TOGGLE.available).toBe(false);
    expect(COVER_LETTER_TOGGLE.reason.en.trim().length).toBeGreaterThan(10);
    expect(COVER_LETTER_TOGGLE.reason.sw.trim().length).toBeGreaterThan(10);
    // Disabled, never a live switch.
    expect(SOURCE).toMatch(/accessibilityState=\{\{ disabled: true, checked: false \}\}/);
    expect(SOURCE).not.toContain("onValueChange");
  });
});

// ── 5. The honesty rules that override the design ────────────────────────────
describe("the privacy block says only what this app actually does", () => {
  it("is bilingual", () => {
    for (const lang of ["en", "sw"] as const) {
      expect(PRIVACY_NOTICE.heading[lang].trim().length).toBeGreaterThan(5);
      expect(PRIVACY_NOTICE.body[lang].trim().length).toBeGreaterThan(40);
    }
    expect(PRIVACY_NOTICE.body.sw).not.toBe(PRIVACY_NOTICE.body.en);
  });

  it("drops the mockup's false claims", () => {
    const all = [PRIVACY_NOTICE.heading.en, PRIVACY_NOTICE.heading.sw, PRIVACY_NOTICE.body.en, PRIVACY_NOTICE.body.sw].join(" ");
    // The mockup: "Hakuna akaunti inayohitajika wala data inayotumwa kwa seva".
    expect(all).not.toMatch(/data inayotumwa kwa seva/i);
    expect(all).not.toMatch(/hakuna akaunti/i);
    expect(all.toLowerCase()).not.toMatch(/no account (is )?required/);
  });

  it("states the true position: the file is built here and never uploaded", () => {
    expect(PRIVACY_NOTICE.body.en.toLowerCase()).toMatch(/made on this phone/);
    expect(PRIVACY_NOTICE.body.en.toLowerCase()).toMatch(/never uploads the file/);
    expect(PRIVACY_NOTICE.body.sw.toLowerCase()).toMatch(/simu hii/);
    expect(PRIVACY_NOTICE.body.sw.toLowerCase()).toMatch(/haipaki faili/);
  });

  it("never promises an employer will reply", () => {
    expect(SOURCE.toLowerCase()).not.toMatch(/employer will|mwajiri atakujibu|watajibu/);
  });
});

// ── 6. Both languages, every element ─────────────────────────────────────────
describe("every element is reachable in both languages", () => {
  it("renders each data table through the bilingual `t(en, sw)` call", () => {
    expect(SOURCE).toContain("t(tile.label.en, tile.label.sw)");
    expect(SOURCE).toContain("t(tile.sub.en, tile.sub.sw)");
    expect(SOURCE).toContain("t(f.label.en, f.label.sw)");
    expect(SOURCE).toContain("t(COVER_LETTER_TOGGLE.label.en, COVER_LETTER_TOGGLE.label.sw)");
    expect(SOURCE).toContain("t(COVER_LETTER_TOGGLE.sub.en, COVER_LETTER_TOGGLE.sub.sw)");
    expect(SOURCE).toContain("t(COVER_LETTER_TOGGLE.reason.en, COVER_LETTER_TOGGLE.reason.sw)");
    expect(SOURCE).toContain("t(PRIVACY_NOTICE.heading.en, PRIVACY_NOTICE.heading.sw)");
    expect(SOURCE).toContain("t(PRIVACY_NOTICE.body.en, PRIVACY_NOTICE.body.sw)");
    expect(SOURCE).toContain("t(tailored.en, tailored.sw)");
    expect(SOURCE).toContain("t(badge.en, badge.sw)");
  });

  it("carries the two pinned CTAs and the header the design names", () => {
    expect(SOURCE).toContain('t("Share via WhatsApp", "Shiriki kupitia WhatsApp")');
    expect(SOURCE).toContain('t("Save as PDF to this phone", "Hifadhi kama PDF kwenye Simu")');
    expect(SOURCE).toContain('t("Close", "Funga")');
    expect(SOURCE).toContain('t("Saved", "Imehifadhiwa")');
    // The header's saved chip is only drawn when the CV is genuinely saved.
    expect(SOURCE).toMatch(/documentSaved \? \(/);
  });
});
