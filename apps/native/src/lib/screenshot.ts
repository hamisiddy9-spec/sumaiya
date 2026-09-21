/**
 * Screen capture for user-initiated problem reports.
 *
 * `react-native-view-shot` (installed via `expo install` so its native build
 * is aligned to SDK 57) does the actual capture; `expo-image-manipulator`
 * (already a dependency) does the resize/compress pass, because view-shot's
 * own width/height options resize the CAPTURE itself rather than guaranteeing
 * a specific output byte size — routing through ImageManipulator's `resize` +
 * `compress` gives one place that controls the final size regardless of the
 * device's pixel ratio. A report is evidence, not a wallpaper: it must be
 * cheap on Tanzanian mobile data.
 */
import type { RefObject } from "react";
import type { View } from "react-native";
import { captureRef } from "react-native-view-shot";
import * as ImageManipulator from "expo-image-manipulator";

/**
 * The app's root view, registered once from `_layout.tsx`. A plain module
 * variable (not React context) so the error boundary — deliberately
 * dependency-free, see `error-boundary.tsx` — can trigger a capture without a
 * hook.
 */
let rootRef: RefObject<View | null> | null = null;

export function setScreenshotRoot(ref: RefObject<View | null> | null): void {
  rootRef = ref;
}

const TARGET_WIDTH = 720;
const JPEG_QUALITY = 0.6;

/**
 * A downscaled JPEG of the current screen, base64-encoded (no `data:` prefix).
 * Null on any failure — no root registered, capture failed, view not
 * measured yet — a report must still be sendable without a screenshot.
 */
export async function captureAppScreenshot(): Promise<string | null> {
  if (!rootRef?.current) return null;
  try {
    const uri = await captureRef(rootRef, { format: "jpg", quality: JPEG_QUALITY });
    const resized = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: TARGET_WIDTH } }],
      { compress: JPEG_QUALITY, format: ImageManipulator.SaveFormat.JPEG, base64: true },
    );
    return resized.base64 ?? null;
  } catch {
    return null;
  }
}
