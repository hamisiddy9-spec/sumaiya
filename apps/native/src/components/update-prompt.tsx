import React, { useCallback, useEffect, useRef, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as FileSystem from "expo-file-system/legacy";
import * as IntentLauncher from "expo-intent-launcher";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Button, ProgressBar, haptics, useThemeColors } from "./ui";
import { Icon } from "./icon";
import { apiClient } from "../lib/api-client";
import { APP_VERSION } from "../lib/app-version";
import { shouldShowPrompt, type UpdateManifest } from "../lib/update-check";
import { APK_DOWNLOAD_URL } from "../lib/app-hosts";
import { shortMessage, track } from "../lib/telemetry";
import { useLang } from "../lib/i18n";

/**
 * On launch, ask the web backend (GET /api/app/update) for the latest released
 * version — the backend serves what WE published, so pushing a build to the
 * world stays a deliberate act rather than a side effect of uploading a file.
 *
 * "Download now" downloads the APK inside the app with real progress and hands
 * it to the system installer. It used to open a browser, which on Tanzanian
 * mobile data means a second chance for the download to fail and no way to tell
 * how far along it is. If anything about the in-app path fails, we fall back to
 * the browser rather than leaving someone stuck.
 *
 * An update must never hold the app hostage. On a 50 MB download over Tanzanian
 * mobile data this can take minutes, so while it runs the person can minimise
 * the sheet and carry on using Sumaiya — the transfer keeps going underneath and
 * a small progress pill stays on screen to pull it back.
 *
 * Every failure path is silent — the check must never break the app.
 */
const SKIPPED_KEY = "sumaiya.update.skipped";
/** The newest build we have already handed to the installer (see below). */
const DELIVERED_KEY = "sumaiya.update.delivered";
const DEFAULT_URL = APK_DOWNLOAD_URL;

interface Info {
  version: string;
  url: string;
  notes: { en?: string; sw?: string } | null;
}

export function UpdatePrompt() {
  const c = useThemeColors();
  const { t, lang } = useLang();
  const [info, setInfo] = useState<Info | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [phase, setPhase] = useState<"idle" | "downloading" | "installing">("idle");
  // Hides the sheet without touching the download running behind it.
  const [minimized, setMinimized] = useState(false);
  const downloading = useRef(false);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    (async () => {
      try {
        const [skipped, delivered, manifest] = await Promise.all([
          AsyncStorage.getItem(SKIPPED_KEY).catch(() => null),
          AsyncStorage.getItem(DELIVERED_KEY).catch(() => null),
          apiClient.getAppUpdate().catch(() => null as UpdateManifest | null),
        ]);
        const latest = manifest?.version ?? "";
        if (latest && shouldShowPrompt(APP_VERSION, latest, skipped, delivered)) {
          setInfo({
            version: latest,
            url: manifest?.url || DEFAULT_URL,
            // Both languages are kept and resolved when it renders: this check
            // fires once at launch, frequently before the stored language has
            // loaded — deciding here froze the notes in the default language.
            notes: manifest?.notes ?? null,
          });
          track("update.available", { version: latest, from: APP_VERSION });
        }
      } catch {
        /* silent */
      }
    })();
  }, [lang]);

  const dismiss = useCallback(() => {
    const v = info?.version;
    setInfo(null);
    setMinimized(false);
    if (v) {
      AsyncStorage.setItem(SKIPPED_KEY, v).catch(() => {});
      track("update.skip", { version: v });
    }
  }, [info]);

  // Get the sheet out of the way. Light haptic: the download is untouched, so
  // this must not read as a decision about anything.
  const minimize = useCallback(() => {
    haptics.light();
    setMinimized(true);
    track("update.minimize", { version: info?.version ?? null });
  }, [info]);

  const updateNow = useCallback(async () => {
    const url = info?.url || DEFAULT_URL;
    const version = info?.version ?? "unknown";
    if (!url || downloading.current) return;
    downloading.current = true;
    const startedAt = Date.now();
    haptics.medium();
    setMinimized(false);
    setPhase("downloading");
    setProgress(0);
    track("update.start", { version });
    try {
      // Straight from the release asset — a content-addressed file, over HTTPS,
      // no custom domain in the path to break the update for everyone.
      const target = `${FileSystem.cacheDirectory}sumaiya-${version}.apk`;
      const job = FileSystem.createDownloadResumable(url, target, {}, (p) => {
        const total = p.totalBytesExpectedToWrite;
        if (total > 0) setProgress(Math.min(1, p.totalBytesWritten / total));
      });
      const out = await job.downloadAsync();
      if (!out?.uri || (typeof out.status === "number" && out.status >= 400)) throw new Error("download failed");

      track("update.downloaded", { version, ms: Date.now() - startedAt });

      setPhase("installing");
      setProgress(1);
      // Android refuses a file:// URI coming from another app, so the APK has
      // to travel as content:// through expo's FileProvider, with the package
      // MIME type so the system offers the installer.
      const contentUri = await FileSystem.getContentUriAsync(out.uri);
      await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
        data: contentUri,
        flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
        type: "application/vnd.android.package-archive",
      });
      // The build is now in the installer's hands. Remember which one, so the
      // next launch can't ask again for a version the person just updated to
      // (the manifest legitimately still advertises it for a few minutes).
      await AsyncStorage.setItem(DELIVERED_KEY, version).catch(() => {});
      track("update.install", { version, ms: Date.now() - startedAt });
      setInfo(null);
      setPhase("idle");
      setProgress(null);
      setMinimized(false);
    } catch (err) {
      // Out of space, "install unknown apps" blocked, GitHub hiccup — the
      // browser path still works, so use it instead of a dead end.
      // NB: not `reason` — that key is on the server's PII strip list, and the
      // failure reason is the whole point of this event.
      track("update.fail", { version, why: shortMessage(err) });
      setPhase("idle");
      setProgress(null);
      setInfo(null);
      setMinimized(false);
      haptics.error();
      WebBrowser.openBrowserAsync(url).catch(() => {});
    } finally {
      downloading.current = false;
    }
  }, [info]);

  if (!info) return null;

  const note = (lang === "sw" ? info.notes?.sw : info.notes?.en) ?? info.notes?.en ?? info.notes?.sw ?? null;
  const busy = phase !== "idle";
  const pct = Math.round((progress ?? 0) * 100);

  // Minimised mid-download: the app underneath keeps working and the last thing
  // left on screen is this pill. Tapping it brings the sheet back.
  if (minimized && busy) {
    return (
      <View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 999,
          alignItems: "center",
          paddingHorizontal: 16,
          paddingBottom: 22,
        }}
      >
        <Pressable
          onPress={() => {
            haptics.light();
            setMinimized(false);
          }}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            width: "100%",
            maxWidth: 380,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: c.border,
            backgroundColor: c.bgElevated,
            paddingVertical: 11,
            paddingHorizontal: 14,
            shadowColor: "#000",
            shadowOpacity: 0.16,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 6 },
            elevation: 8,
          }}
        >
          <Icon name="download" size={18} color={c.accent} />
          <View style={{ flex: 1, gap: 5 }}>
            <Text numberOfLines={1} style={{ color: c.text, fontSize: 13, fontWeight: "700" }}>
              {phase === "installing"
                ? t("Ready to install", "Tayari kusakinisha")
                : t(`Downloading the new version… ${pct}%`, `Inapakua toleo jipya… ${pct}%`)}
            </Text>
            <ProgressBar value={phase === "installing" ? 1 : progress ?? 0} height={5} />
          </View>
          <Text style={{ color: c.accent, fontSize: 12.5, fontWeight: "700" }}>{t("View", "Ona")}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <Modal
      transparent
      animationType="fade"
      visible={!minimized}
      onRequestClose={phase === "downloading" ? minimize : dismiss}
    >
      <View style={{ flex: 1, backgroundColor: c.overlay, alignItems: "center", justifyContent: "center", padding: 24 }}>
        <View style={{ width: "100%", maxWidth: 380, borderRadius: 20, borderWidth: 1, borderColor: c.border, backgroundColor: c.bgElevated, padding: 24 }}>
          <View style={{ alignSelf: "center", width: 56, height: 56, borderRadius: 18, backgroundColor: c.accent + "18", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
            <Icon name="download" size={26} color={c.accent} />
          </View>
          <Text style={{ color: c.text, fontSize: 19, fontWeight: "700", textAlign: "center", marginBottom: 8 }}>
            {t("Update available", "Toleo jipya linapatikana")}
          </Text>
          <Text style={{ color: c.textBody, fontSize: 14.5, lineHeight: 21, textAlign: "center", marginBottom: note ? 14 : 20 }}>
            {t(
              `Sumaiya v${info.version} is out. We made it better and fixed what was broken. Download the new version.`,
              `Sumaiya v${info.version} imetoka. Tumeboresha app na tumerekebisha matatizo. Pakua toleo jipya.`,
            )}
          </Text>
          {note ? (
            <View style={{ backgroundColor: c.bg, borderRadius: 12, padding: 12, marginBottom: 20 }}>
              <Text style={{ color: c.textMuted, fontSize: 12, fontWeight: "700", marginBottom: 4 }}>{t("What's new", "Mambo mapya")}</Text>
              <Text style={{ color: c.text, fontSize: 13.5, lineHeight: 19 }}>{note}</Text>
            </View>
          ) : null}
          {phase === "downloading" ? (
            <View style={{ gap: 8, marginBottom: 6 }}>
              <ProgressBar value={progress ?? 0} height={8} />
              <Text style={{ color: c.textMuted, fontSize: 12.5, fontWeight: "700", textAlign: "center" }}>
                {t(
                  `Downloading the new version… ${Math.round((progress ?? 0) * 100)}%`,
                  `Inapakua toleo jipya… ${Math.round((progress ?? 0) * 100)}%`,
                )}
              </Text>
              {/* The download runs underneath the app, so nobody has to sit and
                  watch it. Saying so is what makes minimising feel allowed. */}
              <Text style={{ color: c.textMuted, fontSize: 11.5, textAlign: "center" }}>
                {t(
                  "You can carry on using the app — it installs by itself when it finishes.",
                  "Unaweza kuendelea kutumia app — itajisakinisha yenyewe ikimaliza.",
                )}
              </Text>
            </View>
          ) : phase === "installing" ? (
            <Text style={{ color: c.textBody, fontSize: 13, textAlign: "center", marginBottom: 6 }}>
              {t("The install screen is opening… tap Install to finish.", "Inafungua ukurasa wa kusakinisha… gusa Sakinisha kumaliza.")}
            </Text>
          ) : (
            <Button label={t("Download now", "Pakua sasa")} onPress={updateNow} />
          )}
          <Pressable
            onPress={phase === "idle" ? dismiss : phase === "downloading" ? minimize : undefined}
            hitSlop={8}
            style={{ paddingVertical: 12, alignItems: "center", marginTop: 4 }}
          >
            <Text style={{ color: phase === "installing" ? c.textMuted : c.accent, fontSize: 14, fontWeight: "700" }}>
              {phase === "idle"
                ? t("Later", "Baadaye")
                : phase === "downloading"
                  ? t("Keep using the app", "Endelea kutumia app")
                  : t("Installing…", "Inasakinisha…")}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
