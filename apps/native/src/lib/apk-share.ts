/**
 * "Nitumie Sumaiya" — share this app's own installed APK, phone-to-phone,
 * for zero data cost. The APK is the product; without this it can only move
 * between people by a download link, which costs the receiver data they may
 * not have and which Tanzanians don't reach for anyway (see
 * docs/CLAUDE-QUEUE-2026-09-20.md §0 — "weka option ya share without data").
 *
 * Android only: iOS has no equivalent "share my own binary" concept, and this
 * whole path is a no-op there (see shareApk below).
 *
 * Never on the critical path: every failure mode here returns a tagged
 * `{ ok: false, reason }` result instead of throwing, so a caller can show a
 * quiet message and the rest of the app behaves identically whether this
 * works or not.
 */
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { getApkSourcePath } from "sumaiya-apk-share";
import { track } from "./analytics";

const SHARE_CODE_KEY = "sumaiya.apk.share.code";
const FILE_PREFIX = "sumaiya-";
const FILE_SUFFIX = ".apk";
// Long enough for local transfer apps (WhatsApp, Xender, SHAREit, Bluetooth)
// to finish reading the shared file through the FileProvider grant before the
// underlying copy is removed; short enough that "don't leave it in cache
// indefinitely" is actually true.
const CLEANUP_DELAY_MS = 3 * 60_000;

// Avoids 0/O and 1/I — this code gets typed and read aloud phone-to-phone.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomShareCode(): string {
  let out = "";
  for (let i = 0; i < 6; i++) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

/** Generated once per install, persisted, reused — so every receiver can be attributed to a sharer. */
export async function getOrCreateShareCode(): Promise<string> {
  try {
    const existing = await AsyncStorage.getItem(SHARE_CODE_KEY);
    if (existing) return existing;
  } catch {
    /* fall through — an unpersisted code for this one share beats none */
  }
  const code = randomShareCode();
  try {
    await AsyncStorage.setItem(SHARE_CODE_KEY, code);
  } catch {
    /* best-effort persistence; the code above still gets used for this share */
  }
  return code;
}

export type ShareApkResult =
  | { ok: true }
  | {
      ok: false;
      reason:
        | "unsupported-platform"
        | "apk-path-unavailable"
        | "sharing-unavailable"
        | "copy-failed"
        | "share-failed";
    };

function cacheDir(): string | null {
  return FileSystem.cacheDirectory ?? null;
}

/** Removes any previously-shared APK copies. Called on next app start (crash-safe) and, delayed, after a fresh share. */
export async function cleanupSharedApkCopies(keepFilename?: string): Promise<void> {
  const dir = cacheDir();
  if (!dir) return;
  try {
    const names = await FileSystem.readDirectoryAsync(dir);
    for (const name of names) {
      if (!name.startsWith(FILE_PREFIX) || !name.endsWith(FILE_SUFFIX)) continue;
      if (name === keepFilename) continue;
      await FileSystem.deleteAsync(`${dir}${name}`, { idempotent: true }).catch(() => {});
    }
  } catch {
    /* cache directory unreadable — nothing to clean up */
  }
}

/**
 * Copies the installed APK into cache under a coded filename and hands it to
 * the OS share sheet with the Android package MIME type, so it reaches
 * WhatsApp, Xender, SHAREit, Bluetooth and Nearby Share.
 */
export async function shareApk(): Promise<ShareApkResult> {
  if (Platform.OS !== "android") return { ok: false, reason: "unsupported-platform" };

  const sourcePath = getApkSourcePath();
  if (!sourcePath) return { ok: false, reason: "apk-path-unavailable" };

  const dir = cacheDir();
  if (!dir) return { ok: false, reason: "copy-failed" };

  const code = await getOrCreateShareCode();
  const filename = `${FILE_PREFIX}${code}${FILE_SUFFIX}`;
  const dest = `${dir}${filename}`;

  try {
    const existing = await FileSystem.getInfoAsync(dest).catch(() => null);
    if (!existing?.exists) {
      const sourceUri = sourcePath.startsWith("file://") ? sourcePath : `file://${sourcePath}`;
      await FileSystem.copyAsync({ from: sourceUri, to: dest });
    }
    const info = await FileSystem.getInfoAsync(dest);
    if (!info.exists || info.isDirectory || info.size === 0) {
      return { ok: false, reason: "copy-failed" };
    }
  } catch {
    return { ok: false, reason: "copy-failed" };
  }

  try {
    const available = await Sharing.isAvailableAsync();
    if (!available) return { ok: false, reason: "sharing-unavailable" };
    await Sharing.shareAsync(dest, {
      mimeType: "application/vnd.android.package-archive",
      dialogTitle: "Nitumie Sumaiya",
    });
    track("apk_shared", { code });
    setTimeout(() => {
      void cleanupSharedApkCopies();
    }, CLEANUP_DELAY_MS);
    return { ok: true };
  } catch {
    return { ok: false, reason: "share-failed" };
  }
}
