import * as Sharing from "expo-sharing";
import * as Print from "expo-print";
import { dialog } from "../components/ui";
import type { CV } from "@sumaiya/types";
import { getLastKnownLang } from "../lib/i18n";
import { reportExport } from "./export-ledger";

/**
 * Every user-visible string in this module, in both languages.
 *
 * This was the audit's P0 #3: five English-only strings on the export/share
 * path — a stock not-available title, a bare Error, a device-can't-share
 * sentence and two more on the failure branches — on an app whose guide says,
 * verbatim, "Ship an English-only surface. Both languages, every screen."
 * (§10). They also opened with a status word instead of naming the situation;
 * §6 requires an error to state what happened AND the next action, and to never
 * scold.
 *
 * A service module cannot call `useLang()`, so the language is read from
 * `lib/i18n`'s module-level mirror — the same value the crash boundary uses
 * (`getLastKnownLang`), which survives even when no React provider is mounted.
 */
export interface CopyPair {
  en: string;
  sw: string;
}

export const SHARE_COPY = {
  /** The device has no share target at all (Sharing.isAvailableAsync() false). */
  shareUnavailable: {
    title: { en: "Sharing isn't available here", sw: "Kushiriki hakupatikani kwenye kifaa hiki" },
    body: {
      en: "This phone has no share list to open. Save the PDF to your phone instead — you can attach it in WhatsApp from Files.",
      sw: "Simu hii haina orodha ya kushiriki ya kufungua. Hifadhi PDF kwenye simu badala yake — unaweza kuipachika WhatsApp kutoka Files.",
    },
  },
  /** The share sheet was opened but the hand-off failed. */
  shareFailed: {
    title: { en: "The document wasn't sent", sw: "Hati haikusambazwa" },
    body: {
      en: "Sending it did not finish. Try again in a moment, or save the PDF to your phone and attach it yourself.",
      sw: "Kutuma hakukukamilika. Jaribu tena baada ya muda, au hifadhi PDF kwenye simu na uipachike mwenyewe.",
    },
  },
  /** No PDF viewer behind the share list. */
  previewUnavailable: {
    title: { en: "Can't open the PDF here", sw: "PDF haifunguki kwenye kifaa hiki" },
    body: {
      en: "This phone has no PDF viewer. Save the file to your phone, then open it from Files.",
      sw: "Simu hii haina kifungua PDF. Hifadhi faili kwenye simu, kisha uifungue kutoka Files.",
    },
  },
  /** The preview hand-off failed. */
  previewFailed: {
    title: { en: "The PDF didn't open", sw: "PDF haikufunguka" },
    body: {
      en: "Try again in a moment, or save the file to your phone and open it from Files.",
      sw: "Jaribu tena baada ya muda, au hifadhi faili kwenye simu na uifungue kutoka Files.",
    },
  },
  /** The phone's print window could not be opened. */
  printFailed: {
    title: { en: "Printing didn't start", sw: "Uchapishaji haukuanza" },
    body: {
      en: "This phone didn't open a print window. Try again in a moment, or save the PDF to your phone and print it elsewhere.",
      sw: "Simu hii haikufunguka kidirisha cha kuchapisha. Jaribu tena baada ya muda, au hifadhi PDF kwenye simu na uichapishe kwingine.",
    },
  },
} as const;

/** The string for the user's chosen language. Mirrors lib/i18n's `t(en, sw)`. */
function pick(pair: CopyPair): string {
  return getLastKnownLang() === "sw" ? pair.sw : pair.en;
}

function alert(title: CopyPair, body: CopyPair): void {
  dialog.alert(pick(title), pick(body));
}

export async function shareCV(cv: CV, pdfUri: string): Promise<void> {
  try {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      alert(SHARE_COPY.shareUnavailable.title, SHARE_COPY.shareUnavailable.body);
      return;
    }

    const name = cv.data.personalInfo?.fullName?.trim();
    // The CV has left the device — tell the server, so the assistant's library
    // knows. Both call sites of shareCV hand over a freshly printed PDF, so this
    // is the one place that sees every CV export without double-counting.
    await reportExport({ documentType: "cv", documentId: cv.id, title: cv.title });
    await Sharing.shareAsync(pdfUri, {
      mimeType: "application/pdf",
      // The OS renders this as the share sheet's own header, so it is a
      // user-visible string like any other and is bilingual.
      dialogTitle: name
        ? pick({ en: `Share ${name}'s CV`, sw: `Shiriki CV ya ${name}` })
        : pick({ en: "Share your CV", sw: "Shiriki CV yako" }),
      UTI: "com.adobe.pdf",
    });
  } catch (error) {
    console.error("Share failed:", error);
    alert(SHARE_COPY.shareFailed.title, SHARE_COPY.shareFailed.body);
  }
}

export async function openPDFPreview(pdfUri: string): Promise<void> {
  try {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      alert(SHARE_COPY.previewUnavailable.title, SHARE_COPY.previewUnavailable.body);
      return;
    }

    await Sharing.shareAsync(pdfUri, {
      mimeType: "application/pdf",
      dialogTitle: pick({ en: "View CV", sw: "Ona CV" }),
    });
  } catch (error) {
    console.error("PDF preview failed:", error);
    alert(SHARE_COPY.previewFailed.title, SHARE_COPY.previewFailed.body);
  }
}

/**
 * Open the phone's own print window with the already-printed PDF.
 *
 * `Print.printAsync` hands the file to the Android print framework / iOS
 * AirPrint — the system path, on-device, no server. It is the capability the
 * export sheet's "Chapisha Stationery" / "Print" tile needs, so it lives here
 * with the rest of the export actions rather than being re-implemented in the
 * sheet. It resolves once the print window closes (a cancel resolves too — we
 * therefore never claim the page was printed, only that the window opened); it
 * rejects when this phone cannot print at all.
 */
export async function printPDF(pdfUri: string): Promise<void> {
  try {
    await Print.printAsync({ uri: pdfUri });
  } catch (error) {
    console.error("Print failed:", error);
    alert(SHARE_COPY.printFailed.title, SHARE_COPY.printFailed.body);
  }
}
