import { Linking } from "react-native";
import { dialog } from "../components/ui";
import { haptics } from "../components/ui";

/**
 * Every external hand-off must warn the user before the browser opens —
 * owner requirement, 2026-09-12. A tap that looks like an in-app action
 * (a job-board card, "Learn" on a course, a source link) used to open
 * Chrome immediately with zero notice; from the user's side the app just
 * silently threw them out. This is the one place that decision is made,
 * so every surface gets the same warning instead of each screen inventing
 * (or forgetting) its own.
 *
 * `t` is the caller's own useLang() `t(en, sw)` — kept as a parameter
 * rather than importing the hook here, since this is a plain module
 * function callable from an onPress handler, not a component.
 */
export function confirmAndOpenUrl(url: string, t: (en: string, sw: string) => string): void {
  haptics.light();
  dialog.alert(
    t("Leave the app?", "Ondoka kwenye app?"),
    t(
      "This opens in your browser, outside Sumaiya.",
      "Hii itafungua kwenye kivinjari chako, nje ya Sumaiya.",
    ),
    [
      { text: t("Cancel", "Ghairi"), style: "cancel" },
      { text: t("Continue", "Endelea"), onPress: () => { Linking.openURL(url).catch(() => {}); } },
    ],
  );
}
