import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Button, Screen, dialog, haptics, toast, useThemeColors } from "../../components/ui";
import { FONT } from "../../components/home";
import { Icon } from "../../components/icon";
import { useLang } from "../../lib/i18n";
import { useAuthContext } from "../../contexts/auth-context";
import { ownerIdFor } from "../../lib/local-owner";
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
  type Fact,
  type Memory,
} from "../../lib/ai-memory";

/**
 * `Kumbukumbu ya Sumaiya` / Sumaiya's memory (design: F4).
 *
 * What Sumaiya knows about a person, in the person's own hands. Tanzania's PDPA
 * 2022 gives rights of access, rectification and erasure (ss.33, 38), and those
 * rights are meaningless without a surface to exercise them on — so this screen
 * shows the real store (lib/ai-memory.ts) as plain sentences, one delete per
 * row, and a master `Kujifunza` switch that is the real consent state.
 *
 * Two controls, two different promises — deliberately not the same button twice:
 *
 *   • `Kujifunza` (the toggle) is CONSENT. On = the assistant may keep learning
 *     (consent `granted`). Off = she stops learning AND everything she noticed
 *     is erased, which is the honest reading of "turn this off": a memory store
 *     that keeps the conclusions it may no longer extend is a memory she was
 *     told she had turned off. Turning it back on is one tap here.
 *   • `Safisha Kumbukumbu Zote` deletes what she has learned and LEAVES CONSENT
 *     ALONE — for someone who wants a clean slate, not an assistant switched
 *     off. Saying so in the confirm is the difference between the two taps.
 *
 * The design's category chip is presentation only; it is derived from the fact's
 * own topic key (see FACT_CATEGORY), never invented, and a topic this build does
 * not know falls back to the spaced key — the same honest degradation
 * `eventText` uses in the store, which never silently mislabels a row.
 */

/** The recorded date, in the reader's language: `Machi 12` / `March 12`. */
const SW_MONTHS = [
  "Januari", "Februari", "Machi", "Aprili", "Mei", "Juni",
  "Julai", "Agosti", "Septemba", "Oktoba", "Novemba", "Desemba",
];
const EN_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function recordedLabel(at: number, sw: boolean): string {
  const d = new Date(at);
  const month = (sw ? SW_MONTHS : EN_MONTHS)[d.getMonth()] ?? "";
  return sw ? `Ilirekodiwa ${month} ${d.getDate()}` : `Recorded ${month} ${d.getDate()}`;
}

/**
 * The chip over each card. The topics below are the ones the app actually
 * writes (cv-editor-screen.tsx, ats-checker-screen.tsx — see EPISODE_TEXT in
 * lib/ai-memory.ts); anything else renders its own key so a future topic shows
 * up as itself rather than under a category that may be wrong.
 */
const FACT_CATEGORY: Record<string, { en: string; sw: string }> = {
  cv_rebuilt: { en: "CV & DESIGN", sw: "CV & MUUNDO" },
  cv_exported: { en: "CV & DESIGN", sw: "CV & MUUNDO" },
  cv_check_failed: { en: "CV CHECK", sw: "UKAGUZI WA CV" },
};

function chipLabel(key: string, sw: boolean): string {
  const known = FACT_CATEGORY[key];
  if (known) return sw ? known.sw : known.en;
  return key.replace(/_/g, " ").toUpperCase();
}

/** The master switch. The design's pill, drawn inside a real 44 dp target. */
function LearningToggle({
  on,
  onToggle,
}: {
  on: boolean;
  onToggle: () => void;
}) {
  const c = useThemeColors();
  const { t } = useLang();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      accessibilityLabel={t("Learning", "Kujifunza")}
      onPress={onToggle}
      style={{
        minHeight: 44,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 12,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: c.border,
        backgroundColor: c.bgSunken,
      }}
    >
      <Text
        style={{
          color: c.textMuted,
          fontSize: 10,
          letterSpacing: 0.8,
          textTransform: "uppercase",
          fontFamily: FONT.mono,
        }}
      >
        {t("Learning", "Kujifunza")}
      </Text>
      {/* The track and knob are the design's own proportions (32 × 16, 12 dp
          knob). The knob is `c.bg`, the guide's lightest surface — never pure
          #ffffff, which the guide allows only as text on ember (§1). */}
      <View
        style={{
          width: 32,
          height: 16,
          borderRadius: 999,
          backgroundColor: on ? c.accentFill : c.borderStrong,
          justifyContent: "center",
          alignItems: on ? "flex-end" : "flex-start",
          paddingHorizontal: 2,
        }}
      >
        <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: c.bg }} />
      </View>
    </Pressable>
  );
}

/** One remembered thing: category, when it was recorded, the sentence, delete. */
function MemoryCard({ fact, onForget }: { fact: Fact; onForget: () => void }) {
  const c = useThemeColors();
  const { t, lang } = useLang();
  const sw = lang === "sw";
  const sentence = factText(fact, t);
  return (
    <View
      style={{
        borderRadius: 12,
        borderWidth: 1,
        borderColor: c.border,
        backgroundColor: c.bgElevated,
        padding: 14,
        gap: 8,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <View
          style={{
            backgroundColor: c.accentTint,
            borderRadius: 4,
            paddingHorizontal: 8,
            paddingVertical: 2,
          }}
        >
          <Text style={{ color: c.accent, fontSize: 10, letterSpacing: 0.6, fontFamily: FONT.mono }}>
            {chipLabel(fact.key, sw)}
          </Text>
        </View>
        <Text style={{ color: c.textMuted, fontSize: 10, fontFamily: FONT.mono }} numberOfLines={1}>
          {recordedLabel(fact.at, sw)}
        </Text>
      </View>

      <Text style={{ color: c.text, fontSize: 13, lineHeight: 20, fontFamily: FONT.regular }}>
        {`"${sentence}"`}
      </Text>

      {/* Evidence, stated — a three-episode hunch reads differently from
          something the person said out loud, and hiding that would make the
          card look more certain than the store is. */}
      <Text style={{ color: c.textMuted, fontSize: 11, fontFamily: FONT.mono }}>
        {fact.confirmed
          ? t("You told me this", "Ulimwambia hivi")
          : t(`Noticed ${fact.evidence}x`, `Imeonekana mara ${fact.evidence}`)}
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t(`Delete: ${sentence}`, `Futa: ${sentence}`)}
        onPress={onForget}
        style={{
          minHeight: 44,
          alignSelf: "flex-end",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-end",
          paddingLeft: 12,
        }}
      >
        <Text style={{ color: c.error, fontSize: 11.5, fontFamily: FONT.mono }}>
          {t("Delete this memory", "Futa kumbukumbu hii")}
        </Text>
      </Pressable>
    </View>
  );
}

export function MemoryScreen() {
  const c = useThemeColors();
  const { t, lang } = useLang();
  const sw = lang === "sw";
  // What she knows belongs to the PERSON, not the handset (lib/ai-memory.ts):
  // the memory is read, written and erased under this owner's key, so a second
  // person on a shared phone is never shown the first person's conclusions.
  const { user, loading: authLoading } = useAuthContext();
  const ownerId = ownerIdFor(user);

  const [memory, setMemory] = useState<Memory | null>(null);
  const [consent, setConsentState] = useState<Consent>("unasked");
  const [showAllActivity, setShowAllActivity] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Never read (or claim — lib/owner-scope.ts) while the session is still
    // restoring: the owner is not known yet, so ownerId would be the guest
    // bucket and a read would steal the signed-in user's memory into it.
    if (authLoading) return;
    let alive = true;
    (async () => {
      const [m, k] = await Promise.all([loadMemory(ownerId), loadConsent(ownerId)]);
      if (!alive) return;
      setMemory(m);
      setConsentState(k);
    })();
    return () => {
      alive = false;
    };
  }, [ownerId, authLoading]);

  const onForget = useCallback(
    (key: string) => {
      haptics.light();
      if (!memory) return;
      const next = forget(memory, key);
      setMemory(next);
      void saveMemory(ownerId, next);
      toast.show(t("That memory is gone.", "Kumbukumbu hiyo imefutwa."));
    },
    [memory, ownerId, t],
  );

  const learn = useCallback(() => {
    haptics.light();
    // A tap on is the affirmative act; the screen's own paragraph is the notice
    // (PDPA s.23(2) — nothing is written before the person has been told what is
    // kept and why).
    void (async () => {
      await setConsent(ownerId, "granted");
      setConsentState("granted");
      toast.show(t("I will learn as we go.", "Nitajifunza kadiri tunavyoendelea."));
    })();
  }, [ownerId, t]);

  const stopLearning = useCallback(() => {
    haptics.medium();
    dialog.alert(
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
              await eraseMemory(ownerId);
              await setConsent(ownerId, "declined");
              setConsentState("declined");
              setMemory(EMPTY_MEMORY);
              haptics.success();
            })();
          },
        },
      ],
    );
  }, [ownerId, t]);

  const clearAll = useCallback(() => {
    haptics.warning();
    dialog.alert(
      t("Clear every memory?", "Safisha kumbukumbu zote?"),
      t(
        "Everything below is deleted and your answers stop using it. Learning stays on, so I will start noticing again from today — you can switch it off with the toggle.",
        "Kila kitu hapa chini kitafutwa na majibu yako hayatatumia tena. Kujifunza kunabaki kuwashwa, hivyo nitaanza kuona upya kuanzia leo — unaweza kuzima kwa kitufe cha juu.",
      ),
      [
        { text: t("Cancel", "Ghairi"), style: "cancel" },
        {
          text: t("Clear all", "Safisha zote"),
          style: "destructive",
          onPress: () => {
            void (async () => {
              setBusy(true);
              try {
                await eraseMemory(ownerId);
                setMemory(EMPTY_MEMORY);
                haptics.success();
                toast.show(t("The slate is clean.", "Kumbukumbu zote zimefutwa."));
              } finally {
                setBusy(false);
              }
            })();
          },
        },
      ],
    );
  }, [ownerId, t]);

  // Newest first, as the design orders them.
  const facts = useMemo(() => [...(memory?.facts ?? [])].sort((a, b) => b.at - a.at), [memory]);
  const episodes = memory?.episodes ?? [];
  const activity = showAllActivity ? episodes.slice().reverse() : episodes.slice(-5).reverse();
  const learning = consent === "granted";

  return (
    <Screen
      scroll
      keyboardAvoiding={false}
      contentContainerStyle={{ gap: 14, paddingBottom: 24 }}
      footer={
        <View style={{ gap: 8 }}>
          <Button
            // Full width, at the design's height; `secondary` is the guide's
            // raised surface with a real border, not a bare grey block.
            variant="secondary"
            label={t("Clear all memories", "Safisha Kumbukumbu Zote")}
            disabled={busy || facts.length === 0}
            onPress={clearAll}
          />
          <Text
            style={{
              color: c.textMuted,
              fontSize: 11,
              textAlign: "center",
              fontFamily: FONT.mono,
            }}
          >
            {/* The design's line, and it is literally true: nothing in
                lib/ai-memory.ts touches the network. */}
            {t(
              "These memories are stored on your phone only.",
              "Kumbukumbu hizi zimehifadhiwa kwenye simu yako tu.",
            )}
          </Text>
        </View>
      }
    >
      {/* Title and master switch on one row, as the design has them. The title
          wraps instead of clamping — §8's rule is that the layout holds at 200 %
          text scale, which a one-line clamp is exactly what breaks. */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginTop: 8,
        }}
      >
        <Text
          style={{
            flexShrink: 1,
            color: c.text,
            fontSize: 24,
            lineHeight: 29,
            letterSpacing: -0.4,
            fontFamily: FONT.display,
          }}
        >
          {t("Sumaiya's memory", "Kumbukumbu ya Sumaiya")}
        </Text>
        <LearningToggle on={learning} onToggle={learning ? stopLearning : learn} />
      </View>

      <Text style={{ color: c.textBody, fontSize: 12.5, lineHeight: 19, fontFamily: FONT.regular }}>
        {t(
          "These are the things Sumaiya remembers about you to improve her answers. You can delete anything at any time.",
          "Haya ni mambo Sumaiya anayokumbuka kukuhusu ili kuboresha majibu yake. Unaweza kufuta chochote wakati wowote.",
        )}
      </Text>

      {/* Kept from the screen this replaces: the two claims a person is owed
          before they judge what is above. Both are true of the build. */}
      <Text style={{ color: c.textMuted, fontSize: 11.5, lineHeight: 17, fontFamily: FONT.regular }}>
        {t(
          "Everything here stays on this phone, is never sold and is never used for advertising. I only advise — the decisions are always yours.",
          "Kila kitu hapa kimehifadhiwa kwenye simu hii, hakiuza, na hakitumiki kwa matangazo. Nashauri tu — maamuzi ni yako daima.",
        )}
      </Text>

      {learning ? null : (
        <View
          style={{
            borderRadius: 12,
            borderWidth: 1,
            borderColor: c.border,
            backgroundColor: c.bgElevated,
            padding: 14,
            gap: 4,
          }}
        >
          <Text style={{ color: c.text, fontSize: 14, fontFamily: FONT.bold }}>
            {t("Learning is off", "Kujifunza kumezimwa")}
          </Text>
          <Text style={{ color: c.textMuted, fontSize: 12.5, lineHeight: 18, fontFamily: FONT.regular }}>
            {t(
              "I am not keeping anything new. Tap the switch above to turn it back on whenever you like.",
              "Haweki kitu kipya. Gusa kitufe cha juu kuwasha tena wakati wowote.",
            )}
          </Text>
        </View>
      )}

      {/* What she concluded. The design's card, one per remembered thing. */}
      {memory === null ? (
        <Text style={{ color: c.textMuted, fontSize: 13, fontFamily: FONT.regular }}>
          {t("Reading memories…", "Inasoma kumbukumbu…")}
        </Text>
      ) : facts.length === 0 ? (
        <Text style={{ color: c.textMuted, fontSize: 13, lineHeight: 19, fontFamily: FONT.regular }}>
          {t(
            "Nothing yet. As you use the app she will start to notice patterns — and you'll see them listed here.",
            "Hakuna bado. Kadiri unavyotumia app ataanza kuona mifumo — na utaiona hapa.",
          )}
        </Text>
      ) : (
        <View style={{ gap: 12 }}>
          {facts.map((f) => (
            <MemoryCard key={f.id} fact={f} onForget={() => onForget(f.key)} />
          ))}
        </View>
      )}

      {/* Activity — the raw material, shown so the conclusions aren't a black
          box. The design has no section for it, but deleting it would turn the
          cards above back into an unexplained judgement about the person. */}
      {episodes.length > 0 ? (
        <View style={{ gap: 8 }}>
          <Text
            style={{
              color: c.textMuted,
              fontSize: 10,
              letterSpacing: 0.8,
              textTransform: "uppercase",
              fontFamily: FONT.mono,
            }}
          >
            {t("Recent activity she noted", "Matukio ya hivi karibuni")}
          </Text>
          {activity.map((e) => (
            <Text
              key={e.id}
              style={{ color: c.textBody, fontSize: 12.5, lineHeight: 18, fontFamily: FONT.regular }}
            >
              {/* In the READER's language, not the language it was written in:
                  an episode is stored with the event that produced it, so a
                  Swahili user reading this list sees Swahili even for rows
                  written before the toggle was flipped. */}
              • {episodeText(e, t)}
            </Text>
          ))}
          {episodes.length > 5 ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => setShowAllActivity((v) => !v)}
              style={{ minHeight: 44, justifyContent: "center" }}
            >
              <Text style={{ color: c.accent, fontSize: 13, fontFamily: FONT.bold }}>
                {showAllActivity
                  ? t("Show less", "Onyesha kidogo")
                  : t(`Show all ${episodes.length}`, `Onyesha zote ${episodes.length}`)}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </Screen>
  );
}
