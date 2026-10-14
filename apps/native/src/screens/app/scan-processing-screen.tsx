import React, { useEffect, useState } from "react";
import { Image, Text, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import * as FileSystem from "expo-file-system/legacy";
import { useAppNavigation } from "../../hooks/use-app-navigation";
import { apiClient } from "../../lib/api-client";
import { friendlyImportError, isTransportError } from "../../lib/app-errors";
import type { CV, CVData } from "@sumaiya/types";
import { Button, Screen, haptics, useThemeColors } from "../../components/ui";
import { EASE, MOTION, useMotionReduced } from "../../components/ui/motion";
import { Icon } from "../../components/icon";
import { useLang } from "../../lib/i18n";
import { CvPreviewCard } from "../../components/cv/cv-preview-card";
import type { RouteProp } from "@react-navigation/native";
import type { ScanStackParamList } from "../../navigation/types";

interface Props {
  route: RouteProp<ScanStackParamList, "ScanProcessing">;
}

/**
 * §10 — NO fabricated progress. This screen makes a SINGLE OCR call; it has no
 * real staged steps, so it no longer pretends to. The old `setInterval` cycled
 * "Reading → Finding → Structuring…" every 1.8 s — a fake ramp untied to what
 * the request was actually doing. What ships is one true, indeterminate line,
 * and the sweep below is a BOUNDED beat, off entirely under Reduce Motion (§4).
 */
const SCAN_SWEEP_MS = 1200;
const SCAN_SWEEP_CYCLES = 2;

export function ScanProcessingScreen({ route }: Props) {
  const c = useThemeColors();
  const { t, lang } = useLang();
  const navigation = useAppNavigation();
  const { photoUri } = route.params;
  const [data, setData] = useState<Partial<CVData> | null>(null);
  const [phase, setPhase] = useState<"scanning" | "done" | "error">("scanning");
  const [errorMsg, setErrorMsg] = useState("");
  const [attempt, setAttempt] = useState(0);
  const reduce = useMotionReduced();

  // §4 — the surface's entrance is 300 ms rise 12 (instant reduced), and the
  // sweep over the photo is a BOUNDED beat: 2 cycles then still, and not
  // rendered at all under Reduce Motion. Nothing here loops forever.
  const sweep = useSharedValue(0);
  const rise = useSharedValue(reduce ? 1 : 0);
  useEffect(() => {
    rise.value = reduce ? 1 : withTiming(1, { duration: MOTION.dur.slow, easing: EASE.out });
    if (reduce) {
      sweep.value = 0;
    } else {
      sweep.value = withRepeat(
        withTiming(1, { duration: SCAN_SWEEP_MS, easing: Easing.inOut(Easing.quad) }),
        SCAN_SWEEP_CYCLES,
        true,
      );
    }
    return () => {
      cancelAnimation(sweep);
      cancelAnimation(rise);
    };
  }, [reduce, rise, sweep]);
  const sweepStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sweep.value * 220 }],
    opacity: 0.5 + sweep.value * 0.5,
  }));
  const riseStyle = useAnimatedStyle(() => ({
    opacity: rise.value,
    transform: [{ translateY: (1 - rise.value) * MOTION.rise }],
  }));

  useEffect(() => {
    let cancelled = false;
    setPhase("scanning");

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
        // A transport failure goes through the shared mapper — its `message`
        // is English or a bare status line and must not reach the screen. The
        // "couldn't read details from this photo" Error thrown above IS
        // deliberately localised, so it is passed through as-is.
        setErrorMsg(
          isTransportError(err)
            ? friendlyImportError(err, lang)
            : err instanceof Error
              ? err.message
              : t("I couldn't read this photo. Try again.", "Sikuweza kusoma picha hii. Jaribu tena."),
        );
        setPhase("error");
      }
    })();

    return () => {
      cancelled = true;
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
              onPress={() => navigation.navigate("CvEditor", { nonce: String(Date.now()) })}
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
        <Animated.View style={[riseStyle, { flex: 1, alignItems: "center", justifyContent: "center", gap: 24 }]}>
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
            {reduce ? null : (
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
            )}
          </View>

          <View style={{ alignItems: "center", gap: 6 }}>
            <Text style={{ color: c.text, fontSize: 19, fontWeight: "700" }}>{t("Scanning your CV", "Inapiga CV yako")}</Text>
            {/* One true line — there is a SINGLE OCR call behind this screen,
                so any "steps" would be fabricated progress (§10). The words
                stay under Reduce Motion (§4). */}
            <Text style={{ color: c.textMuted, fontSize: 14, textAlign: "center", maxWidth: 280 }}>
              {t("Reading the text in your photo…", "Ninasoma maandishi kwenye picha yako…")}
            </Text>
          </View>
        </Animated.View>
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
      <Animated.View entering={reduce ? FadeIn.duration(MOTION.dur.instant) : FadeIn.duration(MOTION.dur.slow)} style={{ marginTop: 8, marginBottom: 16 }}>
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

      <Animated.View entering={reduce ? FadeIn.duration(MOTION.dur.instant) : FadeIn.duration(MOTION.dur.slow).delay(80)}>
        <CvPreviewCard
          cv={previewCv}
          onOpenEditor={() => navigation.navigate("CvEditor", { initialData: data, nonce: String(Date.now()) })}
        />
      </Animated.View>

      <View style={{ height: 12 }} />
      <Button
        label={t("Open in editor", "Fungua kwenye kihariri")}
        size="lg"
        onPress={() => navigation.navigate("CvEditor", { initialData: data, nonce: String(Date.now()) })}
      />
      <View style={{ height: 10 }} />
      <Button label={t("Scan again", "Piga tena")} variant="ghost" onPress={() => navigation.goBack()} />
    </Screen>
  );
}
