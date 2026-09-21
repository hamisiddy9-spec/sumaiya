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

  let directoryUri: string;
  try {
    // OPEN SOMEWHERE USABLE. Called with no argument, SAF opens at the volume
    // ROOT, which Android 11+ forbids as a destination: the user is met with
    // "Can't use this folder / To protect your privacy, choose another folder",
    // a GREYED-OUT "USE THIS FOLDER" button, and no hint about what to do.
    // Measured on the Enigma (Android 15, 720x1560): the obvious choice is a dead
    // end, and Download is refused too — only Documents enables the button.
    // Anchoring at Documents means the first screen the user sees is one they can
    // actually save into.
    const permission = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync(
      "content://com.android.externalstorage.documents/document/primary%3ADocuments",
    );
    if (!permission.granted || !permission.directoryUri) return { status: "cancelled" };
    directoryUri = permission.directoryUri;
  } catch {
    // No SAF (an unusual ROM, a locked-down device) — sharing still works.
    return { status: "unsupported" };
  }

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
