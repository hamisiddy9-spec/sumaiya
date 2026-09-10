import React, { useEffect, useRef, useState } from "react";
import { Image, Text, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import * as FileSystem from "expo-file-system/legacy";
import { useAppNavigation } from "../../hooks/use-app-navigation";
import { apiClient } from "../../lib/api-client";
import type { CV, CVData } from "@sumaiya/types";
import { Button, Screen, haptics, useThemeColors } from "../../components/ui";
import { Icon } from "../../components/icon";
import { useLang } from "../../lib/i18n";
import { CvPreviewCard } from "../../components/cv/cv-preview-card";

interface Props {
  route: any;
}

const STEPS_EN = ["Reading the text…", "Finding your experience…", "Structuring your CV…"];
const STEPS_SW = ["Inasoma maandishi…", "Inatafuta uzoefu wako…", "Inapanga CV yako…"];

export function ScanProcessingScreen({ route }: Props) {
  const c = useThemeColors();
  const { t, lang } = useLang();
  const STEPS = lang === "sw" ? STEPS_SW : STEPS_EN;
  const navigation = useAppNavigation();
  const { photoUri } = route.params;
  const [data, setData] = useState<Partial<CVData> | null>(null);
  const [phase, setPhase] = useState<"scanning" | "done" | "error">("scanning");
  const [errorMsg, setErrorMsg] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [step, setStep] = useState(0);

  const sweep = useSharedValue(0);
  useEffect(() => {
    sweep.value = withRepeat(withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, []);
  const sweepStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sweep.value * 220 }],
    opacity: 0.5 + sweep.value * 0.5,
  }));

  const stepTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;
    setPhase("scanning");
    setStep(0);
    stepTimer.current = setInterval(
      () => setStep((s) => (s + 1) % STEPS.length),
      1800,
    );

    (async () => {
      try {
        const base64 = await FileSystem.readAsStringAsync(photoUri, {
          encoding: "base64",
        });
        const mime = photoUri.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
        const res = await apiClient.ocrUpload(`data:${mime};base64,${base64}`);
        if (cancelled) return;
        if (!res?.data) {
          throw new Error(
            t("We couldn't read details from this photo. You can still start a CV and fill it in.", "Hatukuweza kusoma maelezo kwenye picha hii. Bado unaweza kuanza CV na kuijaza."),
          );
        }
        haptics.success();
        setData(res.data);
        setPhase("done");
      } catch (err) {
        if (cancelled) return;
        haptics.error();
        setErrorMsg(err instanceof Error ? err.message : t("Scanning failed. Try again.", "Kupiga kumeshindwa. Jaribu tena."));
        setPhase("error");
      } finally {
        if (stepTimer.current) clearInterval(stepTimer.current);
      }
    })();

    return () => {
      cancelled = true;
      if (stepTimer.current) clearInterval(stepTimer.current);
    };
  }, [photoUri, attempt]);

  // ── Error ───────────────────────────────────────────────────────────────
  if (phase === "error") {
    return (
      <Screen scroll={false} keyboardAvoiding={false}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 16 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              backgroundColor: c.error + "1f",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="alert-triangle" size={28} color={c.error} />
          </View>
          <Text style={{ color: c.text, fontSize: 20, fontWeight: "800", textAlign: "center" }}>
            {t("Couldn't scan that", "Imeshindwa kupiga hiyo")}
          </Text>
          <Text style={{ color: c.textMuted, fontSize: 14, textAlign: "center", lineHeight: 20, maxWidth: 300 }}>
            {errorMsg}
          </Text>
          <View style={{ alignSelf: "stretch", gap: 10, marginTop: 12 }}>
            <Button label={t("Try another photo", "Jaribu picha nyingine")} onPress={() => navigation.goBack()} />
            <Button label={t("Retry", "Jaribu tena")} variant="secondary" onPress={() => setAttempt((a) => a + 1)} />
            <Button
              label={t("Start a blank CV instead", "Anza CV tupu badala yake")}
              variant="ghost"
              onPress={() => navigation.navigate("CVEditor", {})}
            />
          </View>
        </View>
      </Screen>
    );
  }

  // ── Scanning ────────────────────────────────────────────────────────────
  if (phase === "scanning") {
    return (
      <Screen scroll={false} keyboardAvoiding={false}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 24 }}>
          <View
            style={{
              width: 200,
              height: 240,
              borderRadius: 16,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: c.border,
            }}
          >
            <Image source={{ uri: photoUri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
            <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.25)" }} />
            <Animated.View
              style={[
                sweepStyle,
                {
                  position: "absolute",
                  left: 0,
                  right: 0,
                  height: 3,
                  backgroundColor: c.accent,
                  shadowColor: c.accent,
                  shadowOpacity: 0.8,
                  shadowRadius: 8,
                },
              ]}
            />
          </View>

          <View style={{ alignItems: "center", gap: 6 }}>
            <Text style={{ color: c.text, fontSize: 19, fontWeight: "700" }}>{t("Scanning your CV", "Inapiga CV yako")}</Text>
            <Animated.Text key={step} entering={FadeIn.duration(300)} style={{ color: c.textMuted, fontSize: 14 }}>
              {STEPS[step]}
            </Animated.Text>
          </View>
        </View>
      </Screen>
    );
  }

  // ── Done / review ───────────────────────────────────────────────────────
  const personal = (data?.personalInfo ?? {}) as Record<string, string>;
  const previewCv: CV = {
    id: "scan-preview",
    userId: "me",
    templateId: "default",
    title: personal.fullName || "CV",
    data: (data ?? {}) as CVData,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return (
    <Screen scroll keyboardAvoiding={false}>
      <Animated.View entering={FadeIn.duration(300)} style={{ marginTop: 8, marginBottom: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <Icon name="check-circle" size={20} color={c.success} />
          <Text style={{ color: c.text, fontSize: 24, fontWeight: "800", letterSpacing: -0.4 }}>
            {t("Here's what we found", "Hivi ndivyo tulivyopata")}
          </Text>
        </View>
        <Text style={{ color: c.textMuted, fontSize: 14 }}>
          {t("Check it, pick a colour, then open the editor to fix anything.", "Iangalie, chagua rangi, kisha fungua kihariri kurekebisha chochote.")}
        </Text>
      </Animated.View>

      <Animated.View entering={FadeIn.duration(300).delay(80)}>
        <CvPreviewCard
          cv={previewCv}
          onOpenEditor={() => navigation.navigate("CVEditor", { initialData: data })}
        />
      </Animated.View>

      <View style={{ height: 12 }} />
      <Button
        label={t("Open in editor", "Fungua kwenye kihariri")}
        size="lg"
        onPress={() => navigation.navigate("CVEditor", { initialData: data })}
      />
      <View style={{ height: 10 }} />
      <Button label={t("Scan again", "Piga tena")} variant="ghost" onPress={() => navigation.goBack()} />
    </Screen>
  );
}
