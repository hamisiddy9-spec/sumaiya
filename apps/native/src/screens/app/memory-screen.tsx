import React, { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, haptics, useThemeColors } from "../../components/ui";
import { Icon } from "../../components/icon";
import { useLang } from "../../lib/i18n";
import {
  EMPTY_MEMORY,
  episodeText,
  eraseMemory,
  factText,
  forget,
  loadConsent,
  loadMemory,
  saveMemory,
  setConsent,
  type Consent,
  type Memory,
} from "../../lib/ai-memory";

/**
 * "What Sumaiya knows"
 *
 * The counterpart to the memory layer. Once she starts drawing conclusions about
 * someone's career, they are entitled to see those conclusions, correct the
 * wrong ones, and delete them: Tanzania's PDPA 2022 gives rights of access,
 * rectification and erasure (ss.33, 38), and those rights are meaningless
 * without a surface to exercise them on.
 *
 * Written for the person, not for a lawyer: no field names, no "inferred
 * attributes" — the same plain sentences the coach would say out loud.
 */
export function MemoryScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const { t } = useLang();
  const [memory, setMemory] = useState<Memory | null>(null);
  const [consent, setConsentState] = useState<Consent>("unasked");
  const [showAllActivity, setShowAllActivity] = useState(false);

  useEffect(() => {
    (async () => {
      const [m, k] = await Promise.all([loadMemory(), loadConsent()]);
      setMemory(m);
      setConsentState(k);
    })();
  }, []);

  const refresh = useCallback(async (next: Memory) => {
    setMemory(next);
    await saveMemory(next);
  }, []);

  const onForget = useCallback(
    (key: string) => {
      haptics.light();
      if (!memory) return;
      void refresh(forget(memory, key));
    },
    [memory, refresh],
  );

  const onWithdraw = useCallback(() => {
    haptics.medium();
    Alert.alert(
      t("Turn off and delete?", "Zima na kufuta?"),
      t(
        "I will stop learning about you, and everything I have noted so far will be permanently deleted. I will still work — I just won't remember between visits.",
        "Nitaacha kujifunza kukuhusu, na kila nilichokumbuka kufikia sasa kitafutwa kabisa. Nitaendelea kufanya kazi — sitakumbuka kati ya ziara.",
      ),
      [
        { text: t("Cancel", "Ghairi"), style: "cancel" },
        {
          text: t("Delete everything", "Futa kila kitu"),
          style: "destructive",
          onPress: () => {
            void (async () => {
              await eraseMemory();
              await setConsent("declined");
              setConsentState("declined");
              setMemory(EMPTY_MEMORY);
              haptics.success();
            })();
          },
        },
      ],
    );
  }, [t]);

  const onAllow = useCallback(() => {
    haptics.light();
    void (async () => {
      await setConsent("granted");
      setConsentState("granted");
    })();
  }, []);

  const facts = memory?.facts ?? [];
  const episodes = memory?.episodes ?? [];
  const activity = showAllActivity ? episodes.slice().reverse() : episodes.slice(-5).reverse();

  return (
    <ScrollView
      contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40, gap: 18 }}
      style={{ backgroundColor: c.bg }}
    >
      {/* What this is — the same plain-language framing as the policy, because a
          disclosure nobody understands is not a disclosure. */}
      <View style={{ gap: 8 }}>
        <Text style={{ color: c.text, fontSize: 22, fontWeight: "800" }}>
          {t("What I know about you", "Ninachokujua")}
        </Text>
        <Text style={{ color: c.textBody, fontSize: 14.5, lineHeight: 21 }}>
          {t(
            "So I can help you better over time, I keep short notes about your activity and draw conclusions from them. Everything below is stored on this phone, is never sold, and is never used for advertising. I only advise — the decisions are always yours.",
            "Ili nikusaidie zaidi kadiri muda unavyopita, ninaweka kumbukumbu fupi za matumizi yako na kutoa hitimisho kutoka humo. Kila kitu hapa chini kimehifadhiwa kwenye simu hii, hakiuza, na hakitumiki kwa matangazo. Nashauri tu — maamuzi ni yako daima.",
          )}
        </Text>
      </View>

      {consent === "declined" ? (
        <View style={{ backgroundColor: c.bgElevated, borderWidth: 1, borderColor: c.border, borderRadius: 14, padding: 16, gap: 10 }}>
          <Text style={{ color: c.text, fontSize: 15, fontWeight: "700" }}>
            {t("Learning is off", "Kujifunza kumezimwa")}
          </Text>
          <Text style={{ color: c.textMuted, fontSize: 13.5, lineHeight: 19 }}>
            {t(
              "She is not keeping anything new. You can turn this back on whenever you like.",
              "Haweki kitu kipya. Unaweza kuwasha tena wakati wowote.",
            )}
          </Text>
          <Button label={t("Turn learning on", "Washa kujifunza")} onPress={onAllow} />
        </View>
      ) : null}

      {/* Facts — what she concluded. Each one removable on the spot. */}
      <View style={{ gap: 10 }}>
        <Text style={{ color: c.textMuted, fontSize: 12, fontWeight: "800", letterSpacing: 0.6 }}>
          {t("WHAT SHE'S NOTICED", "ALICHOKIONA")}
        </Text>
        {facts.length === 0 ? (
          <Text style={{ color: c.textMuted, fontSize: 14, lineHeight: 20 }}>
            {t(
              "Nothing yet. As you use the app she will start to notice patterns — and you'll see them listed here.",
              "Hakuna bado. Kadiri unavyotumia app ataanza kuona mifumo — na utaiona hapa.",
            )}
          </Text>
        ) : (
          facts.map((f) => (
            <View
              key={f.id}
              style={{ backgroundColor: c.bgElevated, borderWidth: 1, borderColor: c.border, borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ color: c.text, fontSize: 14.5, lineHeight: 20 }}>{factText(f, t)}</Text>
                <Text style={{ color: c.textMuted, fontSize: 11.5 }}>
                  {f.confirmed
                    ? t("You told her this", "Ulimwambia hivi")
                    : t(`Seen ${f.evidence} times`, `Imeonekana mara ${f.evidence}`)}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t(`Forget: ${factText(f, t)}`, `Sahau: ${factText(f, t)}`)}
                hitSlop={10}
                onPress={() => onForget(f.key)}
                style={{ padding: 6 }}
              >
                <Icon name="trash-2" size={18} color={c.textMuted} />
              </Pressable>
            </View>
          ))
        )}
      </View>

      {/* Activity — the raw material, shown so the conclusions aren't a black box. */}
      {episodes.length > 0 ? (
        <View style={{ gap: 10 }}>
          <Text style={{ color: c.textMuted, fontSize: 12, fontWeight: "800", letterSpacing: 0.6 }}>
            {t("RECENT ACTIVITY SHE NOTED", "MATUKIO YA HIVI KARIBUNI")}
          </Text>
          {activity.map((e) => (
            <Text key={e.id} style={{ color: c.textBody, fontSize: 13.5, lineHeight: 19 }}>
              {/* In the READER's language, not the language it was written in:
                  an episode is stored with the event that produced it, so a
                  Swahili user reading "MATUKIO YA HIVI KARIBUNI" sees Swahili
                  even for rows written before the toggle was flipped. */}
              • {episodeText(e, t)}
            </Text>
          ))}
          {episodes.length > 5 ? (
            <Pressable accessibilityRole="button" onPress={() => setShowAllActivity((v) => !v)} hitSlop={8}>
              <Text style={{ color: c.accent, fontSize: 13.5, fontWeight: "700" }}>
                {showAllActivity
                  ? t("Show less", "Onyesha kidogo")
                  : t(`Show all ${episodes.length}`, `Onyesha zote ${episodes.length}`)}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {/* The right to erasure, stated as an action rather than a paragraph. */}
      <View style={{ borderTopWidth: 1, borderTopColor: c.border, paddingTop: 16, gap: 10 }}>
        <Pressable accessibilityRole="button" onPress={onWithdraw} hitSlop={8}>
          <Text style={{ color: c.error, fontSize: 15, fontWeight: "700" }}>
            {t("Delete everything and turn learning off", "Futa kila kitu na zima kujifunza")}
          </Text>
        </Pressable>
        <Text style={{ color: c.textMuted, fontSize: 12, lineHeight: 17 }}>
          {t(
            "Permanent. This cannot be undone. Your CVs, your jobs and your chats are not affected.",
            "Kwa kudumu. Haiwezi kurudishwa. CV zako, kazi zako na mazungumzo yako haviathiriki.",
          )}
        </Text>
      </View>
    </ScrollView>
  );
}
