/**
 * Saving a document onto the phone, for real.
 *
 * The CV list's "Pakua" (download) handed the freshly printed PDF straight to
 * the Android share sheet. On the device (1.6.24, 2026-09-21) that is a sheet
 * titled "Sharing 1 file" and `/sdcard/Download` is byte-identical before and
 * after: the label promised a download and nothing was saved anywhere the user
 * could find it. For this audience the expected flow is save it, then attach it
 * in WhatsApp — so the file has to land somewhere Files can see.
 *
 * expo-print writes into the app's private cache, behind its FileProvider; the
 * OS does not let us move that file into shared storage directly, and there is
 * no permission that grants it (MANAGE_EXTERNAL_STORAGE is the one that would,
 * and it is not shippable). The Storage Access Framework is the supported door:
 * the user picks the folder — Downloads is one tap away — and Android hands us
 * a URI with write permission inside it. That is also why this cannot be silent
 * and cannot be a plain path: the picker is the user's consent, and it is the
 * only honest way to answer "where did my file go?".
 */
import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";

export type SaveOutcome =
  /** Written into the folder the user chose. */
  | { status: "saved"; fileName: string }
  /** The user closed the folder picker. Nothing was written, and nothing failed. */
  | { status: "cancelled" }
  /** No SAF on this platform — the caller's share sheet is the system's save path. */
  | { status: "unsupported" };

/**
 * The one place that decides whether a caller must fall back to sharing the
 * file directly. Only "saved" means a file actually landed somewhere the user
 * can find it — every other outcome used to let the caller return in silence
 * (measured on 1.6.28: dismissing the folder picker ended with no file, no
 * message and no share sheet). Pulled out as pure logic, tested here, so a
 * screen cannot re-introduce a silent branch by switching on `status` itself.
 */
export function shouldOfferShare(
  outcome: SaveOutcome,
): outcome is Extract<SaveOutcome, { status: "cancelled" | "unsupported" }> {
  return outcome.status !== "saved";
}

/**
 * Anchor folders to try, in order. Measured behaviour differs by OS/OEM:
 * Android 15 (Enigma, Hisense, 720x1560) and Android 17 (Pixel 8 Pro) both
 * open the picker cleanly anchored at Documents; Android 11+ refuses the
 * volume root outright as a destination (greyed-out "USE THIS FOLDER"). If a
 * given anchor URI itself makes the picker throw before it even opens (an
 * unusual OEM content-provider), fall through to the next candidate instead
 * of calling the whole platform unsupported.
 */
const ANCHOR_CANDIDATES: (string | undefined)[] = [
  "content://com.android.externalstorage.documents/document/primary%3ADocuments",
  "content://com.android.externalstorage.documents/document/primary%3ADownload",
  undefined,
];

async function requestSaveDirectory(): Promise<FileSystem.FileSystemRequestDirectoryPermissionsResult | null> {
  for (const anchor of ANCHOR_CANDIDATES) {
    try {
      return anchor
        ? await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync(anchor)
        : await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
    } catch {
      // This anchor made the picker throw before it opened — try the next one.
      continue;
    }
  }
  // Every candidate threw: no usable SAF on this device.
  return null;
}

/** The readable name a printed PDF already carries (expo-print names it a UUID). */
export function fileNameFromUri(uri: string): string {
  const last = (uri.split("/").pop() ?? "").split("?")[0] ?? "";
  let name = last;
  try {
    name = decodeURIComponent(last);
  } catch {
    /* a literal % in the name is not percent-encoding — keep it as-is */
  }
  // SAF stores the display name verbatim, and every Android file manager keys
  // "open with / attach" off the extension.
  if (name && !/\.pdf$/i.test(name)) name = `${name}.pdf`;
  return name || "document.pdf";
}

export async function saveToPhone(
  fromUri: string,
  fileName: string,
  mimeType = "application/pdf",
): Promise<SaveOutcome> {
  // SAF is Android-only. On iOS the share sheet's own "Save to Files" is the
  // system save path, so the caller falls back to sharing there.
  if (Platform.OS !== "android") return { status: "unsupported" };

  // OPEN SOMEWHERE USABLE. Called with no argument, SAF opens at the volume
  // ROOT, which Android 11+ forbids as a destination: the user is met with
  // "Can't use this folder / To protect your privacy, choose another folder",
  // a GREYED-OUT "USE THIS FOLDER" button, and no hint about what to do.
  // Measured on the Enigma (Android 15, 720x1560): the obvious choice is a
  // dead end, and Download is refused too — only Documents enables the
  // button. Measured again on a Pixel 8 Pro (Android 17): Documents opened
  // cleanly and the export completed, writing to /sdcard/Documents. Anchoring
  // at Documents means the first screen most users see is one they can
  // actually save into; requestSaveDirectory() still tries further candidates
  // if that anchor itself throws on some OEM build.
  const permission = await requestSaveDirectory();
  if (!permission) return { status: "unsupported" };
  if (!permission.granted) return { status: "cancelled" };
  const directoryUri = permission.directoryUri;

  // Read first, then create: a read failure (a print that never landed) should
  // fail before we have made an empty file in the user's folder.
  const base64 = await FileSystem.readAsStringAsync(fromUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const target = await FileSystem.StorageAccessFramework.createFileAsync(
    directoryUri,
    fileName,
    mimeType,
  );
  await FileSystem.StorageAccessFramework.writeAsStringAsync(target, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return { status: "saved", fileName };
}
