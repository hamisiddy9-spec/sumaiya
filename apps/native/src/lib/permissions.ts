import * as ImagePicker from "expo-image-picker";
import { Linking, Platform } from "react-native";
import { dialog } from "../components/ui";
import { haptics } from "../components/ui";
import { getLastKnownLang } from "./i18n";

/**
 * The ONE place the app asks Android for a runtime permission.
 *
 * Why this exists: the camera was requested from three separate call sites with
 * three different behaviours, and the owner hit the result — "permissions asking
 * while onboarding then app". The scan screen explained itself properly; the
 * chat attach button and the PDF tools screen called
 * `ImagePicker.requestCameraPermissionsAsync()` and then `return`ed a bare
 * `null` when it was refused. So a user who tapped "Camera" got a permission
 * prompt, tapped "Don't allow", and then NOTHING: no message, no alternative, no
 * way to find out that the app was waiting for something. That is a dead end,
 * and it is worse than the duplicate prompt he reported.
 *
 * The rules this implements:
 *
 *  - Ask only at the moment the permission is actually needed (inside the
 *    action that needs it), never during onboarding or on mount.
 *  - At most ONE system prompt per app session. Android keeps showing its
 *    dialog while `canAskAgain` is true, so a second tap used to re-open it —
 *    that is the nag loop. After the first refusal we explain instead.
 *  - Never a dead end: a refusal always names a real alternative (pick a photo
 *    the user already has) and, once Android will no longer ask, a route to
 *    Settings.
 *  - Never lie. We say plainly when Android has stopped asking, instead of
 *    pretending a button will work.
 */

export type CameraAccess = "granted" | "refused" | "blocked";

/** Plain-Swahili explanation, shown in the app's own dialog (not the OS one). */
export const CAMERA_COPY = {
  /** One line, before the system prompt, saying why the camera is wanted. */
  reason: {
    en: "I need your camera to read the document you're about to photograph.",
    sw: "Ninahitaji kamera yako ili nisome hati utakayoipiga picha.",
  },
  refused: {
    title: { en: "No camera access", sw: "Ruhusa ya kamera haijatolewa" },
    body: {
      en: "Okay, I won't use the camera now. You can attach a photo you already have on your phone instead.",
      sw: "Sawa, sitatumia kamera sasa. Unaweza kuambatisha picha uliyo nayo kwenye simu yako badala yake.",
    },
  },
  blocked: {
    title: { en: "Camera is switched off", sw: "Kamera imezimwa" },
    body: {
      en: "You've denied camera access permanently, so I can't ask again. Go to your phone's Settings, select Sumaiya, then turn on Camera.",
      sw: "Umekataa ruhusa ya kamera kabisa, hivyo siwezi kuuliza tena. Nenda kwenye Mipangilio ya simu, chagua Sumaiya, kisha washa Kamera.",
    },
  },
  openSettings: { en: "Open Settings", sw: "Fungua Mipangilio" },
  choosePhoto: { en: "Choose a photo instead", sw: "Chagua picha badala yake" },
  notNow: { en: "Not now", sw: "Si sasa" },
} as const;

/**
 * Ask for the camera, at most once per session.
 *
 * `granted` — usable now. `refused` — the user said no and Android would still
 * ask again, but we do not re-prompt in this session. `blocked` — Android will
 * no longer show the prompt; only Settings can change it.
 */
let askedThisSession = false;

export async function requestCameraAccess(): Promise<CameraAccess> {
  try {
    const current = await ImagePicker.getCameraPermissionsAsync();
    if (current.granted) return "granted";

    if (!askedThisSession && current.canAskAgain) {
      askedThisSession = true;
      const res = await ImagePicker.requestCameraPermissionsAsync();
      if (res.granted) return "granted";
      return res.canAskAgain ? "refused" : "blocked";
    }
    return current.canAskAgain ? "refused" : "blocked";
  } catch {
    // A permission check that throws (a missing native module on an old build)
    // must not silently look like a refusal the user caused.
    return "blocked";
  }
}

/**
 * Explain a refusal and offer the way forward. Returns without doing anything
 * when access was granted, so callers can call it unconditionally.
 *
 * `onChoosePhoto` is the user's own library picker — the alternative that always
 * exists, which is what keeps this from being a dead end.
 */
export function showCameraRefusal(access: CameraAccess, onChoosePhoto?: () => void): void {
  if (access === "granted") return;
  haptics.warning();

  // A plain module cannot use the `useLang()` hook, but the provider keeps a
  // module-level mirror of the current language for exactly this (error-boundary
  // reads it the same way).
  const sw = getLastKnownLang() === "sw";
  const pick = (pair: { en: string; sw: string }) => (sw ? pair.sw : pair.en);

  if (access === "blocked") {
    dialog.alert(
      pick(CAMERA_COPY.blocked.title),
      pick(CAMERA_COPY.blocked.body),
      [
        { text: pick(CAMERA_COPY.notNow), style: "cancel" },
        ...(onChoosePhoto
          ? [{ text: pick(CAMERA_COPY.choosePhoto), onPress: onChoosePhoto }]
          : []),
        {
          text: pick(CAMERA_COPY.openSettings),
          onPress: () => {
            if (Platform.OS !== "web") void Linking.openSettings();
          },
        },
      ],
    );
    return;
  }

  dialog.alert(
    pick(CAMERA_COPY.refused.title),
    pick(CAMERA_COPY.refused.body),
    [
      { text: pick(CAMERA_COPY.notNow), style: "cancel" },
      ...(onChoosePhoto ? [{ text: pick(CAMERA_COPY.choosePhoto), onPress: onChoosePhoto }] : []),
    ],
  );
}

/** Test-only: lets a unit test drive the once-per-session rule from a clean slate. */
export function __resetCameraPromptForTest(): void {
  askedThisSession = false;
}
