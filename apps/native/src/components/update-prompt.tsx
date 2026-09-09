import React, { useCallback, useEffect, useRef, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Button, haptics, useThemeColors } from "./ui";
import { Icon } from "./icon";
import { apiClient } from "../lib/api-client";
import { APP_VERSION } from "../lib/app-version";
import { shouldShowPrompt, type UpdateManifest } from "../lib/update-check";

/**
 * On launch, ask the web backend (GET /api/app/update) for the latest released
 * version. If it's newer than this build AND the user hasn't dismissed that
 * exact version, show a modal with "Update now" (opens the APK download).
 * Every failure path is silent — the check must never break the app.
 */
const SKIPPED_KEY = "th.update.skipped";
const DEFAULT_URL = "https://sumaiya.pro/downloads/sumaiya.apk";

interface Info {
  version: string;
  url: string;
  note: string | null;
}

export function UpdatePrompt() {
  const c = useThemeColors();
  const [info, setInfo] = useState<Info | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    (async () => {
      try {
        const [skipped, manifest] = await Promise.all([
          AsyncStorage.getItem(SKIPPED_KEY).catch(() => null),
          apiClient.getAppUpdate().catch(() => null as UpdateManifest | null),
        ]);
        const latest = manifest?.version ?? "";
        if (latest && shouldShowPrompt(APP_VERSION, latest, skipped)) {
          setInfo({
            version: latest,
            url: manifest?.url || DEFAULT_URL,
            note: manifest?.notes?.en || manifest?.notes?.sw || null,
          });
        }
      } catch {
        /* silent */
      }
    })();
  }, []);

  const dismiss = useCallback(() => {
    const v = info?.version;
    setInfo(null);
    if (v) AsyncStorage.setItem(SKIPPED_KEY, v).catch(() => {});
  }, [info]);

  const updateNow = useCallback(() => {
    const url = info?.url || DEFAULT_URL;
    setInfo(null);
    haptics.medium();
    WebBrowser.openBrowserAsync(url).catch(() => {});
  }, [info]);

  if (!info) return null;

  return (
    <Modal transparent animationType="fade" visible onRequestClose={dismiss}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <View style={{ width: "100%", maxWidth: 380, borderRadius: 20, borderWidth: 1, borderColor: c.border, backgroundColor: c.bgElevated, padding: 24 }}>
          <View style={{ alignSelf: "center", width: 56, height: 56, borderRadius: 18, backgroundColor: c.accent + "18", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
            <Icon name="download" size={26} color={c.accent} />
          </View>
          <Text style={{ color: c.text, fontSize: 19, fontWeight: "700", textAlign: "center", marginBottom: 8 }}>
            Update available
          </Text>
          <Text style={{ color: c.textBody, fontSize: 14.5, lineHeight: 21, textAlign: "center", marginBottom: info.note ? 14 : 20 }}>
            Sumaiya v{info.version} is ready. Update to get the latest fixes and features.
          </Text>
          {info.note ? (
            <View style={{ backgroundColor: c.bg, borderRadius: 12, padding: 12, marginBottom: 20 }}>
              <Text style={{ color: c.textMuted, fontSize: 12, fontWeight: "700", marginBottom: 4 }}>What's new</Text>
              <Text style={{ color: c.text, fontSize: 13.5, lineHeight: 19 }}>{info.note}</Text>
            </View>
          ) : null}
          <Button label="Update now" onPress={updateNow} />
          <Pressable onPress={dismiss} hitSlop={8} style={{ paddingVertical: 12, alignItems: "center", marginTop: 4 }}>
            <Text style={{ color: c.textMuted, fontSize: 14, fontWeight: "700" }}>Later</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
