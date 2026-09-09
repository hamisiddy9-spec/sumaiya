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
import * as FileSystem from "expo-file-system";
import { useAppNavigation } from "../../hooks/use-app-navigation";
import { apiClient } from "../../lib/api-client";
import type { CVData } from "@sumaiya/types";
import { Button, Card, Screen, haptics, useThemeColors } from "../../components/ui";
import { Icon } from "../../components/icon";

interface Props {
  route: any;
}

const STEPS = ["Reading the text…", "Finding your experience…", "Structuring your CV…"];

export function ScanProcessingScreen({ route }: Props) {
  const c = useThemeColors();
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
          encoding: FileSystem.EncodingType.Base64,
        });
        const mime = photoUri.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
        const res = await apiClient.ocrUpload(`data:${mime};base64,${base64}`);
        if (cancelled) return;
        if (!res?.data) {
          throw new Error(
            "We couldn't read details from this photo. You can still start a CV and fill it in.",
          );
        }
        haptics.success();
        setData(res.data);
        setPhase("done");
        setTimeout(() => {
          if (!cancelled) navigation.navigate("CVEditor", { initialData: res.data });
        }, 1600);
      } catch (err) {
        if (cancelled) return;
        haptics.error();
        setErrorMsg(err instanceof Error ? err.message : "Scanning failed. Try again.");
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
            Couldn&apos;t scan that
          </Text>
          <Text style={{ color: c.textMuted, fontSize: 14, textAlign: "center", lineHeight: 20, maxWidth: 300 }}>
            {errorMsg}
          </Text>
          <View style={{ alignSelf: "stretch", gap: 10, marginTop: 12 }}>
            <Button label="Try another photo" onPress={() => navigation.goBack()} />
            <Button label="Retry" variant="secondary" onPress={() => setAttempt((a) => a + 1)} />
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
            <Text style={{ color: c.text, fontSize: 19, fontWeight: "700" }}>Scanning your CV</Text>
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
  const experience = data?.experience ?? [];
  const education = data?.education ?? [];
  const skills = data?.skills ?? [];

  return (
    <Screen scroll keyboardAvoiding={false}>
      <Animated.View entering={FadeIn.duration(300)} style={{ marginTop: 8, marginBottom: 18 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <Icon name="check-circle" size={20} color={c.success} />
          <Text style={{ color: c.text, fontSize: 24, fontWeight: "800", letterSpacing: -0.4 }}>
            Here&apos;s what we found
          </Text>
        </View>
        <Text style={{ color: c.textMuted, fontSize: 14 }}>You can fix anything in the editor.</Text>
      </Animated.View>

      {photoUri ? (
        <Image
          source={{ uri: photoUri }}
          style={{ width: "100%", height: 180, borderRadius: 14, marginBottom: 18 }}
          resizeMode="cover"
        />
      ) : null}

      {personal.fullName || personal.email ? (
        <Card style={{ marginBottom: 12, gap: 6 }}>
          <Text style={{ color: c.textMuted, fontSize: 11.5, fontWeight: "700", letterSpacing: 0.6, textTransform: "uppercase" }}>
            Contact
          </Text>
          {personal.fullName ? <Text style={{ color: c.text, fontSize: 16, fontWeight: "700" }}>{personal.fullName}</Text> : null}
          {[["mail", personal.email], ["phone", personal.phone], ["map-pin", personal.location]].map(([ic, val]) =>
            val ? (
              <View key={ic} style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
                <Icon name={ic as string} size={13} color={c.textMuted} />
                <Text style={{ color: c.textBody, fontSize: 13 }}>{val}</Text>
              </View>
            ) : null,
          )}
        </Card>
      ) : null}

      {experience.length ? (
        <Card style={{ marginBottom: 12, gap: 8 }}>
          <Text style={{ color: c.textMuted, fontSize: 11.5, fontWeight: "700", letterSpacing: 0.6, textTransform: "uppercase" }}>
            Experience · {experience.length}
          </Text>
          {experience.slice(0, 3).map((e: any, i: number) => (
            <View key={i}>
              <Text style={{ color: c.text, fontSize: 14, fontWeight: "700" }}>{e.title}</Text>
              <Text style={{ color: c.textMuted, fontSize: 12.5 }}>
                {e.company} · {e.startDate}–{e.endDate || "Present"}
              </Text>
            </View>
          ))}
          {experience.length > 3 ? (
            <Text style={{ color: c.accent, fontSize: 12.5, fontWeight: "700" }}>
              +{experience.length - 3} more
            </Text>
          ) : null}
        </Card>
      ) : null}

      {education.length ? (
        <Card style={{ marginBottom: 12, gap: 8 }}>
          <Text style={{ color: c.textMuted, fontSize: 11.5, fontWeight: "700", letterSpacing: 0.6, textTransform: "uppercase" }}>
            Education · {education.length}
          </Text>
          {education.slice(0, 2).map((e: any, i: number) => (
            <View key={i}>
              <Text style={{ color: c.text, fontSize: 14, fontWeight: "700" }}>
                {e.degree}
                {e.field ? ` · ${e.field}` : ""}
              </Text>
              <Text style={{ color: c.textMuted, fontSize: 12.5 }}>{e.institution}</Text>
            </View>
          ))}
        </Card>
      ) : null}

      {skills.length ? (
        <Card style={{ marginBottom: 18, gap: 10 }}>
          <Text style={{ color: c.textMuted, fontSize: 11.5, fontWeight: "700", letterSpacing: 0.6, textTransform: "uppercase" }}>
            Skills · {skills.length}
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {skills.slice(0, 10).map((s: any, i: number) => (
              <View key={i} style={{ backgroundColor: c.accent + "14", borderRadius: 8, paddingHorizontal: 9, paddingVertical: 5 }}>
                <Text style={{ color: c.accent, fontSize: 12, fontWeight: "700" }}>{s.name}</Text>
              </View>
            ))}
          </View>
        </Card>
      ) : null}

      <Button
        label="Open in editor"
        size="lg"
        onPress={() => navigation.navigate("CVEditor", { initialData: data })}
      />
      <View style={{ height: 10 }} />
      <Button label="Scan again" variant="ghost" onPress={() => navigation.goBack()} />
    </Screen>
  );
}
