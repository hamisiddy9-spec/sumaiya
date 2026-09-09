import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

// Thin, crash-safe wrapper around expo-haptics. Every call is fire-and-forget
// and swallows errors (haptics are unavailable on some devices / the web /
// simulators). Use these instead of importing expo-haptics directly so the
// feedback vocabulary stays consistent across the app.

const enabled = Platform.OS === "ios" || Platform.OS === "android";

function run(fn: () => Promise<unknown>) {
  if (!enabled) return;
  fn().catch(() => {});
}

export const haptics = {
  /** A tap landed — buttons, toggles, selection. */
  light: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  /** A more deliberate press — primary actions, drag pickup. */
  medium: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  /** Heavy — destructive confirm, big moment. */
  heavy: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)),
  /** Something completed successfully. */
  success: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  /** A warning the user should notice. */
  warning: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
  /** An error / rejected action. */
  error: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
  /** Moving across discrete steps — segmented control, slider notches. */
  selection: () => run(() => Haptics.selectionAsync()),
};
