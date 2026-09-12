import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import type { CV, CVData } from "@sumaiya/types";
import { isEmptyCv } from "@sumaiya/utils/cv-shape";
import { useCvs } from "../hooks/use-cvs";
import { analyzeCv, atsScore, atsBreakdown, lineFindings, matchJd } from "../lib/ats";
import { useLang } from "../lib/i18n";
import { useEntitlements } from "../lib/entitlements";
import { PremiumSheet } from "../components/premium-sheet";
import { apiClient } from "../lib/api-client";
import { Button, EmptyState, ProgressBar, Screen, ScreenTitle, TextField, haptics, useThemeColors } from "../components/ui";
import { Icon } from "../components/icon";
import { SumaiyaMark } from "../components/sumaiya-mark";
import type { AtsCheckerScreenProps } from "../navigation/types";

function ScoreRing({ score, color, label }: { score: number; color: string; label: string }) {
  const c = useThemeColors();
  return (
    <View style={{ alignItems: "center", gap: 4 }}>
      <View
        style={{
          width: 96, height: 96, borderRadius: 48, borderWidth: 7, borderColor: color,
          alignItems: "center", justifyContent: "center", backgroundColor: color + "12",
        }}
      >
        <Text style={{ color: c.text, fontSize: 30, fontWeight: "800" }}>{score}</Text>
      </View>
      <Text style={{ color: c.textMuted, fontSize: 12 }}>{label}</Text>
    </View>
  );
}

export function AtsCheckerScreen({ route, navigation }: AtsCheckerScreenProps) {
  const c = useThemeColors();
  const { t, lang } = useLang();
  const sw = lang === "sw";
  const { cvs, loading, error, loadCVs } = useCvs();
  const { premium } = useEntitlements();
  const preselect: string | undefined = route?.params?.cvId;
  const [pickedId, setPickedId] = useState<string | undefined>(preselect);
  const [jd, setJd] = useState("");
  const [verdict, setVerdict] = useState<string | null>(null);
  const [verdictBusy, setVerdictBusy] = useState(false);
  const [showPremium, setShowPremium] = useState(false);

  const picked: CV | undefined = useMemo(
    () => cvs.find((x) => x.id === pickedId) ?? cvs[0],
    [cvs, pickedId],
  );

  const analysis = useMemo(() => {
    if (!picked) return null;
    const checks = analyzeCv(picked.data, sw);
    return {
      score: atsScore(checks),
      checks,
      pillars: atsBreakdown(checks, sw),
      findings: lineFindings(picked.data, sw),
    };
  }, [picked, sw]);

  const cvIsEmpty = useMemo(() => isEmptyCv(picked?.data), [picked]);

  const jdMatch = useMemo(() => {
    if (!picked || jd.trim().length < 40) return null;
    return matchJd(picked.data, jd);
  }, [picked, jd]);

  const runVerdict = async () => {
    if (!premium) { setShowPremium(true); return; }
    if (!picked || !analysis || verdictBusy) return;
    setVerdictBusy(true);
    haptics.light();
    try {
      const d: Partial<CVData> = picked.data ?? {};
      const failing = analysis.checks.filter((ch) => !ch.pass).map((ch) => ch.label).join("; ");
      const prompt =
        `${sw ? "Jibu kwa Kiswahili." : "Answer in English."} ` +
        `You are Sumaiya reviewing a CV. ATS score ${analysis.score}/100. Failing checks: ${failing || "none"}. ` +
        `Summary: "${(d.summary ?? "").slice(0, 400)}". Roles: ${(d.experience ?? []).map((e) => `${e.title} at ${e.company}`).join(", ") || "none"}. ` +
        `Skills: ${(d.skills ?? []).map((s) => s.name).join(", ") || "none"}. ` +
        `Give a short honest verdict (max 90 words) then the 3 highest-impact fixes as a numbered list. Ground everything in what's above — invent nothing.`;
      const { message } = await apiClient.sendChatMessage([{ role: "user", content: prompt }]);
      setVerdict(message.trim());
      haptics.success();
    } catch {
      haptics.error();
      setVerdict(null);
    } finally {
      setVerdictBusy(false);
    }
  };

  const scoreColor = (s: number) => (s >= 75 ? c.success : s >= 50 ? c.warning : c.error);
  const scoreTone = (s: number): "success" | "warning" | "error" => (s >= 75 ? "success" : s >= 50 ? "warning" : "error");
  const statusWord = (s: number) =>
    s >= 75 ? t("ATS-ready", "Tayari kwa ATS") : s >= 50 ? t("Needs work", "Inahitaji kazi") : t("High risk", "Hatari kubwa");

  return (
    <Screen scroll keyboardAvoiding contentContainerStyle={{ gap: 18 }}>
      <ScreenTitle>{t("ATS check", "Ukaguzi wa ATS")}</ScreenTitle>

      {loading && cvs.length === 0 ? (
        <Text style={{ color: c.textMuted }}>{t("Loading your CVs…", "Inapakia CV zako…")}</Text>
      ) : error && cvs.length === 0 ? (
        /* Never claim the user has no CVs when the real problem is that we
           couldn't reach the server — that is indistinguishable from data loss. */
        <EmptyState
          icon="alert-circle"
          title={t("Couldn't load your CVs", "Imeshindwa kupakia CV zako")}
          body={t(
            "Your CVs are safe on your account — we just couldn't reach the server. Check your connection and try again.",
            "CV zako ziko salama kwenye akaunti yako — tumeshindwa kufikia server. Angalia mtandao kisha ujaribu tena.",
          )}
          actionLabel={t("Try again", "Jaribu tena")}
          onAction={loadCVs}
        />
      ) : cvs.length === 0 ? (
        <View style={{ gap: 12 }}>
          <Text style={{ color: c.textBody }}>
            {t("You need a CV to check. Create one first.", "Unahitaji CV ili ukague. Tengeneza moja kwanza.")}
          </Text>
          <Button label={t("New CV", "CV mpya")} onPress={() => navigation.navigate("CVsTab", { screen: "CvEditor", params: { nonce: String(Date.now()) } })} />
        </View>
      ) : (
        <>
          {/* CV picker */}
          {cvs.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {cvs.map((cv) => {
                const active = (picked?.id ?? cvs[0].id) === cv.id;
                return (
                  <Pressable
                    key={cv.id}
                    onPress={() => { haptics.selection(); setPickedId(cv.id); }}
                    style={{
                      paddingVertical: 8, paddingHorizontal: 13, borderRadius: 10, borderWidth: 1.5,
                      borderColor: active ? c.accent : c.border,
                      backgroundColor: active ? c.accent + "14" : "transparent",
                    }}
                  >
                    <Text style={{ color: active ? c.accent : c.textBody, fontWeight: "700", fontSize: 13 }} numberOfLines={1}>
                      {cv.title}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          {analysis && (
            <Animated.View entering={FadeIn.duration(240)} style={{ gap: 18 }}>
              {cvIsEmpty && (
                <View
                  style={{
                    padding: 16, borderRadius: 16, borderWidth: 1,
                    borderColor: c.warning + "55", backgroundColor: c.warning + "12", gap: 6,
                  }}
                >
                  <Text style={{ color: c.warning, fontSize: 15, fontWeight: "800" }}>
                    {t("This CV is still blank", "CV hii bado ni tupu")}
                  </Text>
                  <Text style={{ color: c.textBody, fontSize: 13.5, lineHeight: 20 }}>
                    {t(
                      "The score below only measures what's written on the CV — right now that is just your name. Add your contacts, a short summary, one job and a few skills, then check again.",
                      "Alama hapa chini hupima kilichomo kwenye CV — kwa sasa ni jina lako pekee. Jaza mawasiliano, muhtasari mfupi, kazi moja na ujuzi kadhaa, kisha ukague tena.",
                    )}
                  </Text>
                </View>
              )}
              {/* Overall */}
              <View
                style={{
                  flexDirection: "row", alignItems: "center", gap: 18, padding: 16,
                  backgroundColor: c.bgElevated, borderRadius: 16, borderWidth: 1, borderColor: c.border,
                }}
              >
                <ScoreRing score={analysis.score} color={scoreColor(analysis.score)} label={t("of 100", "kati ya 100")} />
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={{ color: scoreColor(analysis.score), fontSize: 16, fontWeight: "800" }}>
                    {statusWord(analysis.score)}
                  </Text>
                  <Text style={{ color: c.textMuted, fontSize: 13, lineHeight: 19 }}>
                    {t(
                      "Deterministic checks — the same ones a real ATS runs. No AI, nothing sent anywhere.",
                      "Ukaguzi wa uhakika — sawa na ATS halisi. Hakuna AI, hakuna kinachotumwa popote.",
                    )}
                  </Text>
                </View>
              </View>

              {/* Pillars */}
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                {analysis.pillars.map((p) => (
                  <View
                    key={p.key}
                    style={{
                      width: "47.5%", padding: 12, borderRadius: 12, borderWidth: 1, borderColor: c.border,
                      backgroundColor: c.bgElevated, gap: 4,
                    }}
                  >
                    <Text style={{ color: c.textMuted, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.3 }}>
                      {p.label}
                    </Text>
                    <Text style={{ color: scoreColor(p.score), fontSize: 20, fontWeight: "800" }}>{p.score}</Text>
                    <ProgressBar value={p.score / 100} tone={scoreTone(p.score)} height={4} style={{ marginTop: 2 }} />
                  </View>
                ))}
              </View>

              {/* Failing checks with fixes */}
              <View style={{ gap: 8 }}>
                <Text style={{ color: c.text, fontSize: 15, fontWeight: "700" }}>
                  {t("Fix these", "Rekebisha haya")}
                </Text>
                {analysis.checks.filter((ch) => !ch.pass).length === 0 ? (
                  <Text style={{ color: c.success, fontSize: 13 }}>
                    {t("Everything passes. Nice.", "Kila kitu kimepita. Vizuri.")}
                  </Text>
                ) : (
                  analysis.checks
                    .filter((ch) => !ch.pass)
                    .map((ch, i) => (
                      <Animated.View
                        key={ch.id}
                        entering={FadeInDown.duration(220).delay(Math.min(i, 4) * 40)}
                        style={{
                          flexDirection: "row", gap: 10, padding: 12, borderRadius: 12,
                          backgroundColor: c.bgElevated, borderWidth: 1,
                          borderColor: (ch.severity === "fail" ? c.error : c.warning) + "40",
                        }}
                      >
                        <Icon
                          name={ch.severity === "fail" ? "alert-circle" : "alert-triangle"}
                          size={16}
                          color={ch.severity === "fail" ? c.error : c.warning}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: c.text, fontSize: 13.5, fontWeight: "700", marginBottom: 2 }}>{ch.label}</Text>
                          <Text style={{ color: c.textBody, fontSize: 12.5, lineHeight: 18 }}>{ch.fix}</Text>
                        </View>
                      </Animated.View>
                    ))
                )}
              </View>

              {/* Sumaiya's verdict — premium */}
              <View
                style={{
                  gap: 8,
                  padding: 14,
                  borderRadius: 14,
                  backgroundColor: c.accent + "0e",
                  borderWidth: 1,
                  borderColor: c.accent + "2a",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
                  <SumaiyaMark size={15} state="static" color={c.accent} />
                  <Text style={{ color: c.text, fontSize: 15, fontWeight: "800", flex: 1 }}>
                    {t("Sumaiya's verdict", "Uamuzi wa Sumaiya")}
                  </Text>
                  {!premium ? <Icon name="lock" size={13} color={c.textMuted} /> : null}
                </View>
                {verdict ? (
                  <Text style={{ color: c.textBody, fontSize: 13.5, lineHeight: 21 }}>{verdict}</Text>
                ) : (
                  <>
                    <Text style={{ color: c.textMuted, fontSize: 12.5, lineHeight: 18 }}>
                      {t(
                        "A written review — the honest verdict plus your three highest-impact fixes.",
                        "Mapitio yaliyoandikwa — uamuzi wa kweli pamoja na marekebisho matatu yenye athari kubwa.",
                      )}
                    </Text>
                    <Button
                      label={verdictBusy ? t("Reviewing…", "Inapitia…") : premium ? t("Get the verdict", "Pata uamuzi") : t("Unlock with Premium", "Fungua na Premium")}
                      variant="secondary"
                      size="sm"
                      loading={verdictBusy}
                      onPress={runVerdict}
                    />
                  </>
                )}
              </View>

              {/* Line findings */}
              {analysis.findings.length > 0 && (
                <View style={{ gap: 8 }}>
                  <Text style={{ color: c.text, fontSize: 15, fontWeight: "700" }}>
                    {t("Weak lines in your experience", "Mistari dhaifu kwenye uzoefu wako")}
                  </Text>
                  {analysis.findings.slice(0, 8).map((f) => (
                    <View key={f.id} style={{ padding: 12, borderRadius: 12, backgroundColor: c.bgElevated, borderWidth: 1, borderColor: c.border, gap: 4 }}>
                      <Text style={{ color: c.textMuted, fontSize: 11, fontWeight: "700" }}>
                        {f.where} · {f.issue}
                      </Text>
                      <Text style={{ color: c.textBody, fontSize: 12.5, fontStyle: "italic" }} numberOfLines={2}>
                        “{f.line}”
                      </Text>
                      <Text style={{ color: c.accent, fontSize: 12.5 }}>{f.fix}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* JD match */}
              <View style={{ gap: 8 }}>
                <Text style={{ color: c.text, fontSize: 15, fontWeight: "700" }}>
                  {t("Match against a job", "Linganisha na ajira")}
                </Text>
                <TextField
                  placeholder={t("Paste the job description here…", "Bandika maelezo ya ajira hapa…")}
                  value={jd}
                  onChangeText={setJd}
                  multiline
                  numberOfLines={5}
                  inputStyle={{ minHeight: 110, textAlignVertical: "top" }}
                />
                {jdMatch && (
                  <View style={{ gap: 8 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <Text style={{ color: scoreColor(jdMatch.score), fontSize: 22, fontWeight: "800" }}>
                        {jdMatch.score}%
                      </Text>
                      <Text style={{ color: c.textMuted, fontSize: 12, flex: 1 }}>
                        {t("of the job's keywords appear on this CV", "ya maneno muhimu ya ajira yapo kwenye CV hii")}
                      </Text>
                    </View>
                    <ProgressBar value={jdMatch.score / 100} tone={scoreTone(jdMatch.score)} />
                    {jdMatch.missing.length > 0 && (
                      <View style={{ gap: 6 }}>
                        <Text style={{ color: c.textMuted, fontSize: 12, fontWeight: "700" }}>
                          {t("Missing — add the true ones to your CV:", "Yanakosekana — ongeza ya kweli kwenye CV:")}
                        </Text>
                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                          {jdMatch.missing.map((k) => (
                            <View key={k} style={{ paddingVertical: 4, paddingHorizontal: 9, borderRadius: 8, backgroundColor: c.warning + "1f" }}>
                              <Text style={{ color: c.warning, fontSize: 12, fontWeight: "600" }}>{k}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                )}
              </View>

              <Button
                label={t("Open this CV in the editor", "Fungua CV hii kwenye kihariri")}
                variant="secondary"
                onPress={() =>
                  navigation.navigate("CVsTab", { screen: "CvEditor", params: { cvId: picked!.id, templateId: picked!.templateId } })
                }
              />
            </Animated.View>
          )}
        </>
      )}
      <PremiumSheet visible={showPremium} onClose={() => setShowPremium(false)} feature="verdict" />
    </Screen>
  );
}
