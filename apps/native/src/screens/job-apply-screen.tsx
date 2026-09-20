import React, { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Share, Text, TextInput, View } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import type { CVData } from "@sumaiya/types";
import { apiClient } from "../lib/api-client";
import { friendlyApiError } from "../lib/app-errors";
import { useCvs } from "../hooks/use-cvs";
import { Button, Screen, ScreenTitle, SectionHeader, dialog, haptics, useThemeColors } from "../components/ui";
import { Icon } from "../components/icon";
import { SumaiyaMark } from "../components/sumaiya-mark";
import { letterIsEmpty, letterToHtml } from "../lib/letter-html";
import { letterFileName, renamePdf } from "../services/pdf-export";
import { reportExport } from "../services/export-ledger";
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
  const { t, lang } = useLang();
  const { cvs, updateCV } = useCvs();
  const [jd, setJd] = useState<string>(route?.params?.jd ?? "");
  const [want, setWant] = useState<Want>(route?.params?.want ?? "both");
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
      const r = await apiClient.applyToJob(jd.trim(), want, { ...(targetCv ? { cvId: targetCv.id } : {}), lang });
      haptics.success();
      setResult(r);
    } catch (e: any) {
      haptics.error();
      setError(
        friendlyApiError(e, lang, {
          en: "I couldn't tailor your CV to this job. Try again.",
          sw: "Sikuweza kulenga CV yako kwa ajira hii. Jaribu tena.",
        }),
      );
    } finally {
      setLoading(false);
    }
  }

  async function applyCvChanges() {
    if (!result?.cv || !targetCv) return;
    if (applied) return; // in-flight/double-tap guard — this used to write twice and push twice
    setApplied(true);
    haptics.success();
    const data = { ...(targetCv.data as CVData) };
    if (result.cv.summary) data.summary = result.cv.summary;
    const tailored = Array.isArray(result.cv.experience) ? result.cv.experience : [];
    const byId = new Map(tailored.map((e) => [e.id, e.description]));
    data.experience = (data.experience ?? []).map((exp) => {
      const next = byId.get(exp.id);
      return next != null ? { ...exp, description: next } : exp;
    });
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
    const content = result.letter.content ?? "";

    // The reported bug: when the letter body came back empty this still printed
    // a page holding nothing but the job title and the company name. A blank PDF
    // that opens fine is worse than an error — it can be sent to an employer.
    // So: refuse, and say why.
    if (letterIsEmpty(content)) {
      haptics.error();
      dialog.alert(
        t("The letter is empty", "Barua haina maandishi"),
        t(
          "Nothing was written for this job, so there is nothing to export. Go back and try again.",
          "Hakuna kilichoandikwa kwa kazi hii, kwa hivyo hakuna cha kupakua. Rudi nyuma na ujaribu tena.",
        ),
      );
      return;
    }

    haptics.light();
    try {
      const { uri } = await Print.printToFileAsync({
        html: letterToHtml({ jobTitle: result.jobTitle, company: result.company, content }),
      });
      // Without this the file keeps expo-print's UUID name and lands in WhatsApp
      // as "54abcd12-d5ef-47ae-8fb4-cae2774c3185.pdf".
      const named = await renamePdf(uri, letterFileName(result.jobTitle, result.company));
      // The ledger carries the same readable name the file got, so the assistant
      // can say which letter was sent — and this letter has no stored row, so the
      // title is the only identity it will ever have.
      await reportExport({
        documentType: "cover-letter",
        title: result.jobTitle,
      });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(named, { mimeType: "application/pdf" });
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
              <Text style={{ color: c.text, fontSize: 15, fontWeight: "700" }}>{t("CV, retuned for this job", "CV, imerekebishwa kwa ajira hii")}</Text>
            </View>
            <Text style={{ color: c.textMuted, fontSize: 12, fontWeight: "700", marginBottom: 4 }}>{t("NEW SUMMARY", "MUHTASARI MPYA")}</Text>
            <Text style={{ color: c.textBody, fontSize: 14, lineHeight: 21, marginBottom: 12 }}>{result.cv.summary}</Text>
            {(result.cv.experience ?? []).length ? (
              <Text style={{ color: c.textMuted, fontSize: 12 }}>
                + {(result.cv.experience ?? []).length} {(result.cv.experience ?? []).length === 1 ? t("experience entry rewritten", "kipengele cha uzoefu kimeandikwa upya") : t("experience entries rewritten", "vipengele vya uzoefu vimeandikwa upya")}
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
          letterIsEmpty(result.letter.content) ? (
            /* An empty letter is a failure, not a document. It gets an
               explanation and NO export button — a blank PDF that opens fine is
               worse than an error, because it can be sent to an employer. */
            <Animated.View
              entering={FadeInDown.duration(280).delay(60)}
              style={{ flexDirection: "row", gap: 10, alignItems: "center", backgroundColor: c.error + "12", borderWidth: 1, borderColor: c.error + "2a", borderRadius: 16, padding: 16, marginBottom: 14 }}
            >
              <Icon name="alert-circle" size={18} color={c.error} />
              <Text style={{ flex: 1, color: c.textBody, fontSize: 13, lineHeight: 19 }}>
                {t(
                  "Nothing was written for this job. Go back and try again.",
                  "Hakuna kilichoandikwa kwa kazi hii. Rudi nyuma na ujaribu tena.",
                )}
              </Text>
            </Animated.View>
          ) : (
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
          )
        ) : null}

        <Pressable
          onPress={() => { haptics.selection(); setResult(null); setJd(""); }}
          style={{ paddingVertical: 14, alignItems: "center" }}
        >
          <Text style={{ color: c.accent, fontSize: 14, fontWeight: "700" }}>{t("Tailor to another job", "Lenga ajira nyingine")}</Text>
        </Pressable>
      </Screen>
    );
  }

  // ── Input view ───────────────────────────────────────────────────────────
  return (
    <Screen
      scroll
      footer={
        <Button label={loading ? t("Tailoring…", "Inalenga…") : t("Tailor to this job", "Lenga ajira hii")} onPress={generate} loading={loading} disabled={loading} />
      }
    >
      <ScreenTitle trailing={<SumaiyaMark size={24} color={c.accent} />}>{t("Apply smarter", "Omba vyema")}</ScreenTitle>
      <Text style={{ color: c.textBody, fontSize: 14.5, lineHeight: 21, marginBottom: 18 }}>
        {t("Paste a job description. I retune your CV and write a matching cover letter — grounded in what I already know about you.", "Bandika maelezo ya ajira. Narekebisha CV yako na kuandika barua ya maombi inayolingana — kwa kutumia ninachokifahamu kukuhusu.")}
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
        placeholder={t("Paste the full job posting here…\n\nRole, responsibilities, requirements — the more, the better.", "Bandika tangazo lote la ajira hapa…\n\nCheo, majukumu, masharti — zaidi, bora.")}
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
          <Text style={{ color: c.textBody, fontSize: 13 }}>{t("Reading the job and your profile…", "Inasoma ajira na wasifu wako…")}</Text>
        </View>
      ) : null}
    </Screen>
  );
}
