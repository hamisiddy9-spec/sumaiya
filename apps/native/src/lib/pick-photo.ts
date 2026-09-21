import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";

// A photo captured during first-run (before any CV exists to attach it to)
// waits here until the user's first CV is created, then is consumed once and
// cleared. Plain AsyncStorage, not expo-secure-store: SecureStore enforces a
// ~2KB value limit on Android and a compressed photo's base64 is well past
// that (typically 15-60KB) — writing it there would silently fail.
const PENDING_PHOTO_KEY = "sumaiya_pending_onboarding_photo";

export async function setPendingOnboardingPhoto(dataUri: string): Promise<void> {
  await AsyncStorage.setItem(PENDING_PHOTO_KEY, dataUri).catch(() => {});
}

/** Reads and clears the pending photo in one call — it's meant to be used at most once. */
export async function consumePendingOnboardingPhoto(): Promise<string | null> {
  try {
    const v = await AsyncStorage.getItem(PENDING_PHOTO_KEY);
    if (v) await AsyncStorage.removeItem(PENDING_PHOTO_KEY);
    return v;
  } catch {
    return null;
  }
}

/**
 * Resizes + compresses any image URI (a local picker result or a remote
 * http(s) URL — expo-image-manipulator fetches remote URIs itself) to a
 * small square-ish JPEG and returns it as a base64 data URI ready to drop
 * into CVData.personalInfo.profilePhoto. The shared compress step behind
 * both pickAndCompressPhoto() and the first-run wizard's Google-avatar
 * prefill, so every source produces the exact same shape.
 *
 * Throws if the manipulator fails (including a network failure fetching a
 * remote URI) — callers that already show an error on failure (the CV
 * editor's photo control, the first-run wizard's photo step) rely on this to
 * tell a real failure apart from a user cancelling the picker, which returns
 * null instead. Callers that treat a missing photo as a non-issue (the
 * Google-avatar prefill) must catch this themselves.
 */
export async function compressPhotoUri(uri: string): Promise<string> {
  const out = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 400 } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true },
  );
  if (!out.base64) throw new Error("Image manipulator returned no base64 data");
  return `data:image/jpeg;base64,${out.base64}`;
}

/**
 * Opens the system image picker, then compresses the result via
 * compressPhotoUri(). Shared by the CV editor's own photo control and the
 * first-run wizard's optional photo step, so both produce the exact same
 * shape — no separate "onboarding photo" format to reconcile later.
 *
 * Returns null only if the user cancelled the picker. Throws if the
 * manipulator fails, so callers' existing try/catch can tell the two apart.
 */
export async function pickAndCompressPhoto(): Promise<string | null> {
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.85,
  });
  if (res.canceled || !res.assets[0]?.uri) return null;
  return compressPhotoUri(res.assets[0].uri);
}
