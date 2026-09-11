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
 * Opens the system image picker, then resizes + compresses the result to a
 * small square JPEG and returns it as a base64 data URI ready to drop into
 * CVData.personalInfo.profilePhoto. Shared by the CV editor's own photo
 * control and the first-run wizard's optional photo step, so both produce
 * the exact same shape — no separate "onboarding photo" format to reconcile
 * later.
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

  const out = await ImageManipulator.manipulateAsync(
    res.assets[0].uri,
    [{ resize: { width: 400 } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true },
  );
  return out.base64 ? `data:image/jpeg;base64,${out.base64}` : null;
}
