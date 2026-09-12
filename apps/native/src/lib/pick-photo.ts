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
 * Returns null if the manipulator failed (including a network failure
 * fetching a remote URI).
 */
export async function compressPhotoUri(uri: string): Promise<string | null> {
  try {
    const out = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 400 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true },
    );
    return out.base64 ? `data:image/jpeg;base64,${out.base64}` : null;
  } catch {
    return null;
  }
}

/**
 * Opens the system image picker, then compresses the result via
 * compressPhotoUri(). Shared by the CV editor's own photo control and the
 * first-run wizard's optional photo step, so both produce the exact same
 * shape — no separate "onboarding photo" format to reconcile later.
 *
 * Returns null if the user cancelled or the picker/manipulator failed.
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
