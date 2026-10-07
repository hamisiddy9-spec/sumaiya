import React, { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  FadeIn,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useLang } from "../../lib/i18n";
import { Icon } from "../../components/icon";
import {
  EASE,
  MOTION,
  Screen,
  ScreenTitle,
  enterDurationMs,
  haptics,
  staggerDelayMs,
  useMotionReduced,
  useThemeColors,
} from "../../components/ui";
import type { HelpFaqScreenProps } from "../../navigation/types";

interface Faq {
  q: { en: string; sw: string };
  a: { en: string; sw: string };
}

// Real questions a CV / job-seeker asks. Bilingual so the screen reads the same
// in either language; kept as structured {en, sw} content like guides.tsx.
const FAQS: Faq[] = [
  {
    q: { en: "How do I scan or import my CV?", sw: "Ninawezaje kuchanganua au kuleta CV yangu?" },
    a: {
      en: "Open the Import tab and tap \"Scan with camera\" to photograph each page, or \"Choose a file\" to pick a PDF from your phone. Sumaiya reads the text and fills in your details automatically — you can correct anything before saving.",
      sw: "Fungua kichupo cha Import na uguse \"Piga picha\" ili kupiga kila ukurasa, au \"Chagua faili\" kuchagua PDF kwenye simu yako. Sumaiya anasoma maandishi na kujaza taarifa zako kiotomatiki — unaweza kusahihisha chochote kabla ya kuhifadhi.",
    },
  },
  {
    q: { en: "How does the ATS score work?", sw: "Alama ya CV yangu inafanyaje kazi?" },
    a: {
      en: "The ATS checker compares your CV against the words in a job posting — skills, titles and keywords — and scores how well they match. A higher score means an automated hiring system is more likely to pass your CV through. It's guidance, not a guarantee: a human still reads it.",
      sw: "Kikagua CV hulinganisha CV yako na maneno katika tangazo la kazi — ujuzi, vyeo na maneno muhimu — na kutoa alama ya jinsi zinavyolingana. Alama kubwa inamaanisha mfumo wa kiotomatiki una uwezekano mkubwa wa kupitisha CV yako. Ni mwongozo, si uhakika: binadamu bado ataisoma.",
    },
  },
  {
    q: { en: "Is my data safe?", sw: "Je, taarifa zangu ni salama?" },
    a: {
      en: "Yes. Your CVs and career details are stored on encrypted servers and used only to help you build documents and apply for jobs. We never sell your data or share it with employers without your action, and you can delete your account and data any time.",
      sw: "Ndiyo. CV zako na taarifa za kazi huhifadhiwa kwenye seva zilizosimbwa na hutumiwa tu kukusaidia kuandaa hati na kuomba kazi. Hatuwahi kuuza taarifa zako wala kuzishiriki na waajiri bila hatua yako, na unaweza kufuta akaunti na data yako wakati wowote.",
    },
  },
  {
    q: { en: "How do I export my CV as a PDF?", sw: "Ninawezaje kuhamisha CV yangu kama PDF?" },
    a: {
      en: "Open the CV you want, then tap \"Export\" or \"Download PDF\". The PDF is saved to your phone and you can share it straight to WhatsApp, email or a job portal.",
      sw: "Fungua CV unayotaka, kisha uguse \"Export\" au \"Pakua PDF\". PDF inahifadhiwa kwenye simu yako na unaweza kuishiriki moja kwa moja kupitia WhatsApp, barua pepe au tovuti ya ajira.",
    },
  },
  {
    q: { en: "What does Sumaiya Premium include?", sw: "Sumaiya Premium inajumuisha nini?" },
    a: {
      en: "Premium unlocks advanced CV templates, deep career guides and more tailored writing help. Everything essential — building, tailoring and exporting your CV — stays free.",
      sw: "Premium inafungua miundo ya hali ya juu ya CV, miongozo ya kina ya kazi na usaidizi zaidi wa kuandika. Kila kitu muhimu — kuandaa, kurekebisha na kuhamisha CV yako — kinabaki bure.",
    },
  },
  {
    q: { en: "How do I tailor my CV to a specific job?", sw: "Ninawezaje kurekebisha CV yangu kwa kazi fulani?" },
    a: {
      en: "Paste the job posting into Sumaiya and ask her to tailor your CV, or use the ATS checker to see which keywords to add. She rewrites your summary and highlights to match the role.",
      sw: "Bandika tangazo la kazi kwa Sumaiya na umwombe akurekebishie CV yako, au tumia kikagua CV kuona maneno muhimu ya kuongeza. Anaandika upya muhtasari na mambo muhimu yako ili kufanana na kazi hiyo.",
    },
  },
  {
    q: { en: "How do I delete my account?", sw: "Ninawezaje kufuta akaunti yangu?" },
    a: {
      en: "Go to Profile → Danger zone → Delete account. This permanently removes your CVs, cover letters and account data. It can't be undone.",
      sw: "Nenda kwa Wasifu → Eneo la hatari → Futa akaunti. Hili linaondoa kabisa CV zako, barua za maombi na taarifa za akaunti. Haliwezi kurudishwa.",
    },
  },
  {
    q: { en: "Can I use Sumaiya offline?", sw: "Naweza kutumia Sumaiya bila mtandao?" },
    a: {
      en: "Your saved CVs are available offline, and edits sync to the cloud when you reconnect. Some features — chatting with Sumaiya, checking ATS and fetching jobs — need a connection.",
      sw: "CV zako zilizohifadhiwa zinapatikana bila mtandao, na mabadiliko husawazishwa kwenye wingu unapounganisha tena. Baadhi ya vipengele — kuzungumza na Sumaiya, kukagua CV yako na kupata ajira — vinahitaji mtandao.",
    },
  },
  {
    q: { en: "Is Sumaiya free to use?", sw: "Je, Sumaiya ni bure kutumia?" },
    a: {
      en: "Yes — the essentials are free forever. Create and tailor CVs, draft cover letters and export PDFs at no cost. Premium is optional.",
      sw: "Ndiyo — mambo muhimu ni bure milele. Unda na urekebishe CV, andaa barua za maombi na uhamishe PDF bila malipo. Premium ni ya hiari.",
    },
  },
];

function FaqItem({ faq, index }: { faq: Faq; index: number }) {
  const c = useThemeColors();
  const { lang } = useLang();
  const [open, setOpen] = useState(false);
  const reduce = useMotionReduced();
  const turn = useSharedValue(0);

  useEffect(() => {
    turn.value = withTiming(open ? 180 : 0, {
      duration: reduce ? MOTION.dur.instant : MOTION.dur.base,
      easing: EASE.inOut,
    });
  }, [open, reduce, turn]);

  const chevron = useAnimatedStyle(() => ({
    transform: [{ rotate: `${turn.value}deg` }],
  }));

  return (
    <Animated.View
      entering={FadeIn.duration(enterDurationMs(reduce, MOTION.dur.slow)).delay(
        staggerDelayMs(index, { reduceMotion: reduce }),
      )}
      // Without a `layout` transition the collapsed answer's height appears in
      // one frame and pushes every card below it down instantly — the single
      // most visible "boom" on this screen. The card animates its own resize and
      // the siblings follow it. Same pattern as the CV editor's Sections.
      layout={LinearTransition.springify().damping(20)}
      style={{
        borderRadius: 14,
        borderWidth: 1,
        borderColor: c.border,
        backgroundColor: c.bgElevated,
        overflow: "hidden",
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => {
          haptics.selection();
          setOpen((v) => !v);
        }}
        android_ripple={{ color: c.border }}
        style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 15 }}
      >
        <View style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: c.accent + "1f", alignItems: "center", justifyContent: "center" }}>
          <Icon name="help-circle" size={16} color={c.accent} />
        </View>
        <Text style={{ flex: 1, color: c.text, fontSize: 15, fontWeight: "600", lineHeight: 20 }}>{faq.q[lang]}</Text>
        {/* One icon that turns, rather than swapping chevron-down for chevron-up.
            The swap was an instant visual state change with no in-between. */}
        <Animated.View style={chevron}>
          <Icon name="chevron-down" size={17} color={c.textMuted} />
        </Animated.View>
      </Pressable>
      {open ? (
        <Animated.View
          entering={FadeIn.duration(enterDurationMs(reduce, MOTION.dur.base)).easing(EASE.out)}
          style={{ paddingHorizontal: 15, paddingBottom: 15, paddingTop: 0 }}
        >
          <Text style={{ color: c.textBody, fontSize: 13.5, lineHeight: 21, paddingLeft: 42 }}>{faq.a[lang]}</Text>
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

export function HelpFaqScreen({ navigation }: HelpFaqScreenProps) {
  const c = useThemeColors();
  const { t } = useLang();

  return (
    <Screen scroll keyboardAvoiding={false} contentContainerStyle={{ paddingBottom: 48 }}>
      <Pressable
        hitSlop={10}
        onPress={() => navigation.goBack()}
        style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8, marginBottom: 16 }}
      >
        <Icon name="arrow-left" size={18} color={c.accent} />
        <Text style={{ color: c.accent, fontWeight: "700" }}>{t("Profile", "Wasifu")}</Text>
      </Pressable>

      <ScreenTitle eyebrow={t("Help", "Msaada")}>{t("Frequently asked", "Maswali ya mara kwa mara")}</ScreenTitle>
      <Text style={{ color: c.textBody, fontSize: 13.5, lineHeight: 20, marginBottom: 18 }}>
        {t(
          "Quick answers to the things job-seekers ask most. Tap a question to read it.",
          "Majibu ya haraka kwa mambo ambayo wanaotafuta kazi huuliza zaidi. Gusa swali ili kulisoma.",
        )}
      </Text>

      <View style={{ gap: 10 }}>
        {FAQS.map((faq, i) => (
          <FaqItem key={faq.q.en} faq={faq} index={i} />
        ))}
      </View>
    </Screen>
  );
}
