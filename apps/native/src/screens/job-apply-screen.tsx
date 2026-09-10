import React, { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Share, Text, TextInput, View } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import type { CVData } from "@sumaiya/types";
import { apiClient } from "../lib/api-client";
import { useCvs } from "../hooks/use-cvs";
import { Button, Screen, ScreenTitle, SectionHeader, haptics, useThemeColors } from "../components/ui";
import { Icon } from "../components/icon";
import { SumaiyaMark } from "../components/sumaiya-mark";
import { useLang } from "../lib/i18n";
import type { JobApplyScreenProps } from "../navigation/types";

type Want = "cv" | "letter" | "both";
type Result = Awaited<ReturnType<typeof apiClient.applyToJob>>;

const WANT_OPTS: { id: Want; en: string; sw: string; icon: string }[] = [
  { id: "cv", en: "Tailor my CV", sw: "Lenga CV yangu", icon: "file-text" },
  { id: "letter", en: "Cover letter", sw: "Barua ya maombi", icon: "mail" },
  { id: "both", en: "Both", sw: "Zote mbili", icon: "layers" },
];

export function JobApplyScreen({ navigation, route }: JobApplyScreenProps) {
  const c = useThemeColors();
  const { t } = useLang();
  const { cvs, updateCV } = useCvs();
  const [jd, setJd] = useState<string>(route?.params?.jd ?? "");
  const [want, setWant] = useState<Want>("both");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [applied, setApplied] = useState(false);

  const targetCv = useMemo(
    () => [...cvs].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))[0] ?? null,
    [cvs],
  );

  async function generate() {
    if (jd.trim().length < 60) {
      haptics.error();
      setError(t("Paste the full posting — the role, what you'd do, and the requirements.", "Bandika tangazo lote — cheo, utakachofanya, na masharti."));
      return;
    }
    setError(null);
    setLoading(true);
    setResult(null);
    setApplied(false);
    try {
      const r = await apiClient.applyToJob(jd.trim(), want, targetCv ? { cvId: targetCv.id } : {});
      haptics.success();
      setResult(r);
    } catch (e: any) {
      haptics.error();
      setError(e?.message || t("Couldn't tailor to this job. Try again.", "Imeshindwa kulenga kazi hii. Jaribu tena."));
    } finally {
      setLoading(false);
    }
  }

  async function applyCvChanges() {
    if (!result?.cv || !targetCv) return;
    setApplied(true);
    haptics.success();
    const data = { ...(targetCv.data as CVData) };
    if (result.cv.summary) data.summary = result.cv.summary;
    const byId = new Map(result.cv.experience.map((e) => [e.id, e.description]));
    data.experience = (data.experience ?? []).map((exp: any) =>
      byId.has(exp.id) ? { ...exp, description: byId.get(exp.id) } : exp,
    );
    try {
      await updateCV(targetCv.id, { ...targetCv, data, updatedAt: new Date() });
    } catch {
      /* offline queue picks it up */
    }
    navigation.navigate("CVsTab", { screen: "CvEditor", params: { cvId: targetCv.id, templateId: targetCv.templateId } });
  }

  async function shareLetter() {
    if (!result?.letter) return;
    haptics.light();
    await Share.share({ message: result.letter.content }).catch(() => {});
  }

  async function letterToPdf() {
    if (!result?.letter) return;
    haptics.light();
    const body = result.letter.content
      .split(/\n{2,}/)
      .map((para) => `<p>${para.replace(/\n/g, "<br/>").replace(/</g, "&lt;")}</p>`)
      .join("");
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      body{font-family:Georgia,'Times New Roman',serif;line-height:1.6;color:#222;padding:56px 60px;font-size:12pt}
      h1{font-size:15pt;margin:0 0 4px}.sub{color:#666;font-size:10.5pt;margin-bottom:28px}p{margin:0 0 14px}
    </style></head><body>
      <h1>${(result.jobTitle || "Cover letter").replace(/</g, "&lt;")}</h1>
      <div class="sub">${(result.company || "").replace(/</g, "&lt;")}</div>
      ${body}
    </body></html>`;
    try {
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: "application/pdf" });
    } catch {
      /* ignore */
    }
  }

  // ── Result view ──────────────────────────────────────────────────────────
  if (result) {
    return (
      <Screen scroll>
        <Animated.View entering={FadeIn.duration(240)} style={{ marginTop: 8, marginBottom: 18 }}>
          <Text style={{ color: c.textMuted, fontSize: 12, fontWeight: "700", letterSpacing: 0.4, textTransform: "uppercase" }}>
            {t("Tailored to", "Imelengwa kwa")}
          </Text>
          <Text style={{ color: c.text, fontSize: 24, fontWeight: "800", letterSpacing: -0.4, marginTop: 2 }}>
            {result.jobTitle || t("this role", "cheo hiki")}
          </Text>
          {result.company ? <Text style={{ color: c.textBody, fontSize: 15, marginTop: 2 }}>{result.company}</Text> : null}
        </Animated.View>

        {result.cv ? (
          <Animated.View
            entering={FadeInDown.duration(280)}
            style={{ backgroundColor: c.bgElevated, borderWidth: 1, borderColor: c.border, borderRadius: 16, padding: 16, marginBottom: 14 }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <Icon name="file-text" size={16} color={c.accent} />
              <Text style={{ color: c.text, fontSize: 15, fontWeight: "700" }}>{t("CV, retuned for this job", "CV, imerekebishwa kwa kazi hii")}</Text>
            </View>
            <Text style={{ color: c.textMuted, fontSize: 12, fontWeight: "700", marginBottom: 4 }}>{t("NEW SUMMARY", "MUHTASARI MPYA")}</Text>
            <Text style={{ color: c.textBody, fontSize: 14, lineHeight: 21, marginBottom: 12 }}>{result.cv.summary}</Text>
            {result.cv.experience.length ? (
              <Text style={{ color: c.textMuted, fontSize: 12 }}>
                + {result.cv.experience.length} {result.cv.experience.length === 1 ? t("experience entry rewritten", "kipengele cha uzoefu kimeandikwa upya") : t("experience entries rewritten", "vipengele vya uzoefu vimeandikwa upya")}
              </Text>
            ) : null}
            <View style={{ marginTop: 14 }}>
              <Button
                label={applied ? t("Applied — open editor", "Imewekwa — fungua kihariri") : t(`Apply to "${targetCv?.title || "my CV"}"`, `Weka kwenye "${targetCv?.title || "CV yangu"}"`)}
                onPress={applyCvChanges}
              />
            </View>
          </Animated.View>
        ) : null}

        {result.letter ? (
          <Animated.View
            entering={FadeInDown.duration(280).delay(60)}
            style={{ backgroundColor: c.bgElevated, borderWidth: 1, borderColor: c.border, borderRadius: 16, padding: 16, marginBottom: 14 }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <Icon name="mail" size={16} color={c.accent} />
              <Text style={{ color: c.text, fontSize: 15, fontWeight: "700" }}>{t("Cover letter", "Barua ya maombi")}</Text>
            </View>
            <Text style={{ color: c.textBody, fontSize: 14, lineHeight: 22 }}>{result.letter.content}</Text>
            <View style={{ flexDirection: "row", gap: 8, marginTop: 14 }}>
              <View style={{ flex: 1 }}>
                <Button label={t("Export PDF", "Pakua PDF")} variant="secondary" onPress={letterToPdf} />
              </View>
              <View style={{ flex: 1 }}>
                <Button label={t("Share", "Sambaza")} variant="secondary" onPress={shareLetter} />
              </View>
            </View>
          </Animated.View>
        ) : null}

        <Pressable
          onPress={() => { haptics.selection(); setResult(null); setJd(""); }}
          style={{ paddingVertical: 14, alignItems: "center" }}
        >
          <Text style={{ color: c.accent, fontSize: 14, fontWeight: "700" }}>{t("Tailor to another job", "Lenga kazi nyingine")}</Text>
        </Pressable>
      </Screen>
    );
  }

  // ── Input view ───────────────────────────────────────────────────────────
  return (
    <Screen
      scroll
      footer={
        <Button label={loading ? t("Tailoring…", "Inalenga…") : t("Tailor to this job", "Lenga kazi hii")} onPress={generate} loading={loading} disabled={loading} />
      }
    >
      <ScreenTitle trailing={<SumaiyaMark size={24} color={c.accent} />}>{t("Apply smarter", "Omba kwa ujanja")}</ScreenTitle>
      <Text style={{ color: c.textBody, fontSize: 14.5, lineHeight: 21, marginBottom: 18 }}>
        {t("Paste a job description. Sumaiya retunes your CV and writes a matching cover letter — grounded in what she already knows about you.", "Bandika maelezo ya kazi. Sumaiya anarekebisha CV yako na kuandika barua ya maombi inayolingana — kwa kutumia anachokifahamu kukuhusu.")}
      </Text>

      <Text style={{ color: c.textMuted, fontSize: 12, fontWeight: "700", letterSpacing: 0.3, marginBottom: 8 }}>{t("WHAT DO YOU WANT?", "UNATAKA NINI?")}</Text>
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 18 }}>
        {WANT_OPTS.map((o) => {
          const active = want === o.id;
          return (
            <Pressable
              key={o.id}
              onPress={() => { haptics.selection(); setWant(o.id); }}
              style={{
                flex: 1,
                alignItems: "center",
                gap: 6,
                paddingVertical: 12,
                borderRadius: 12,
                borderWidth: 1.5,
                borderColor: active ? c.accent : c.border,
                backgroundColor: active ? c.accent + "12" : c.bgElevated,
              }}
            >
              <Icon name={o.icon} size={18} color={active ? c.accent : c.textMuted} />
              <Text style={{ color: active ? c.text : c.textBody, fontSize: 12, fontWeight: "700", textAlign: "center" }}>{t(o.en, o.sw)}</Text>
            </Pressable>
          );
        })}
      </View>

      {(want === "cv" || want === "both") && !targetCv ? (
        <View style={{ flexDirection: "row", gap: 8, backgroundColor: c.warning + "18", borderRadius: 10, padding: 11, marginBottom: 14 }}>
          <Icon name="alert-circle" size={15} color={c.warning} />
          <Text style={{ flex: 1, color: c.textBody, fontSize: 12.5, lineHeight: 18 }}>
            {t("You have no CV yet — I\u2019ll write the cover letter from your profile. Scan or build a CV to tailor one too.", "Bado huna CV — nitaandika barua ya maombi kwa kutumia wasifu wako. Piga au tengeneza CV ili nilenge na hiyo pia.")}
          </Text>
        </View>
      ) : null}

      <TextInput
        value={jd}
        onChangeText={setJd}
        multiline
        placeholder={t("Paste the full job posting here…\n\nRole, responsibilities, requirements — the more, the better.", "Bandika tangazo lote la kazi hapa…\n\nCheo, majukumu, masharti — zaidi, bora.")}
        placeholderTextColor={c.textMuted}
        style={{
          minHeight: 220,
          textAlignVertical: "top",
          backgroundColor: c.bgElevated,
          borderWidth: 1,
          borderColor: c.border,
          borderRadius: 14,
          padding: 14,
          color: c.text,
          fontSize: 14,
          lineHeight: 20,
        }}
      />
      {error ? (
        <Text style={{ color: c.error, fontSize: 13, marginTop: 10 }}>{error}</Text>
      ) : (
        <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 10 }}>{jd.trim().length} {t("characters", "herufi")}</Text>
      )}

      {loading ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 20 }}>
          <ActivityIndicator color={c.accent} />
          <Text style={{ color: c.textBody, fontSize: 13 }}>{t("Reading the job and your profile…", "Inasoma kazi na wasifu wako…")}</Text>
        </View>
      ) : null}
    </Screen>
  );
}
