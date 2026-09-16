import React from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useLang } from "../../lib/i18n";
import { Icon } from "../../components/icon";
import { Screen, ScreenTitle, useThemeColors } from "../../components/ui";
import { SUPPORT_EMAIL } from "../../lib/app-hosts";
import type { PrivacyTermsScreenProps } from "../../navigation/types";

interface Section {
  heading: { en: string; sw: string };
  body: { en: string; sw: string };
}

const PRIVACY_SECTIONS: Section[] = [
  {
    heading: { en: "What we collect", sw: "Tunachokusanya" },
    body: {
      en: "The details you give us — your name, contact information, career history, the CVs and cover letters you create, and your preferences. We also collect basic device data needed to run the app, such as app version and crash reports.",
      sw: "Taarifa unazotupatia — jina lako, mawasiliano, historia ya kazi, CV na barua za maombi unazounda, na mapendeleo yako. Pia tunakusanya data msingi ya kifaa inayohitajika kuendesha programu, kama toleo la programu na ripoti za hitilafu.",
    },
  },
  {
    heading: { en: "How we use it", sw: "Jinsi tunavyotumia" },
    body: {
      en: "To build, tailor and export your documents, to suggest jobs that match your profile, and to keep the app working and improving. We do not sell your personal data.",
      sw: "Kuandaa, kurekebisha na kuhamisha hati zako, kupendekeza ajira zinazolingana na wasifu wako, na kuhakikisha programu inafanya kazi na kuboreshwa. Hatuuzi taarifa zako binafsi.",
    },
  },
  {
    heading: { en: "What we share", sw: "Tunachoshiriki" },
    body: {
      en: "Only with the services that power the app — secure hosting and the AI providers that process your documents when you ask — and only as needed. We never share your data with employers unless you apply to them yourself.",
      sw: "Tu na huduma zinazowezesha programu — upangishaji salama na watoa huduma wa AI wanaochakata hati zako unapoomba — na tu inapohitajika. Hatuwahi kushiriki data yako na waajiri isipokuwa wewe mwenyewe utuma maombi kwao.",
    },
  },
  {
    heading: { en: "Data security", sw: "Usalama wa data" },
    body: {
      en: "Your data is encrypted in transit and at rest. Access is limited to what is needed to run the service, and we follow standard security practices to protect it.",
      sw: "Data yako imesimbwa inaposafirishwa na inapohifadhiwa. Ufikiaji umepunguzwa kwa kile kinachohitajika kuendesha huduma, na tunafuata taratibu za kawaida za usalama kuilinda.",
    },
  },
  {
    heading: { en: "Your rights", sw: "Haki zako" },
    body: {
      en: "You can view, correct, export or delete your data at any time — in the app or by emailing us. Deleting your account removes your CVs, documents and account data.",
      sw: "Unaweza kuona, kusahihisha, kuhamisha au kufuta data yako wakati wowote — kwenye programu au kwa kututumia barua pepe. Kufuta akaunti kunaondoa CV zako, hati na taarifa za akaunti.",
    },
  },
];

const TERMS_SECTIONS: Section[] = [
  {
    heading: { en: "Using the service", sw: "Kutumia huduma" },
    body: {
      en: "Sumaiya is a tool to help you create career documents. You are responsible for the accuracy of the information you enter and for how you use the documents you create.",
      sw: "Sumaiya ni zana ya kukusaidia kuandaa hati za kazi. Wewe unawajibika kwa usahihi wa taarifa unazoingiza na kwa jinsi unavyotumia hati unazounda.",
    },
  },
  {
    heading: { en: "Your account", sw: "Akaunti yako" },
    body: {
      en: "Keep your sign-in details safe. You may close your account at any time from Profile → Delete account.",
      sw: "Weka maelezo yako ya kuingia salama. Unaweza kufunga akaunti yako wakati wowote kutoka Wasifu → Futa akaunti.",
    },
  },
  {
    heading: { en: "AI-generated content", sw: "Maudhui yanayotengenezwa na AI" },
    body: {
      en: "Some content is generated with AI. Review it before you send it — you are responsible for the final documents you submit to employers.",
      sw: "Baadhi ya maudhui yanatengenezwa na AI. Yakague kabla ya kuyatuma — wewe unawajibika kwa hati za mwisho unazowasilisha kwa waajiri.",
    },
  },
  {
    heading: { en: "Acceptable use", sw: "Matumizi yanayokubalika" },
    body: {
      en: "Do not use the app for anything unlawful or to misrepresent yourself to employers.",
      sw: "Usitumie programu kwa jambo lolote kinyume cha sheria au kujitambulisha vibaya kwa waajiri.",
    },
  },
  {
    heading: { en: "Changes to these terms", sw: "Mabadiliko ya masharti haya" },
    body: {
      en: "We may update these terms and the privacy policy. We will notify you of material changes in the app.",
      sw: "Tunaweza kusasisha masharti haya na sera ya faragha. Tutakujulisha mabadiliko muhimu kwenye programu.",
    },
  },
];

function SectionBlock({ section, index }: { section: Section; index: number }) {
  const c = useThemeColors();
  const { lang } = useLang();
  return (
    <Animated.View entering={FadeInDown.duration(260).delay(Math.min(index, 6) * 40)} style={{ marginBottom: 18 }}>
      <Text style={{ color: c.text, fontSize: 15.5, fontWeight: "800", marginBottom: 6 }}>{section.heading[lang]}</Text>
      <Text style={{ color: c.textBody, fontSize: 14, lineHeight: 22 }}>{section.body[lang]}</Text>
    </Animated.View>
  );
}

export function PrivacyTermsScreen({ navigation }: PrivacyTermsScreenProps) {
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

      <ScreenTitle>{t("Privacy & Terms", "Faragha na Masharti")}</ScreenTitle>

      {/* Plain-language summary */}
      <View
        style={{
          borderRadius: 14,
          borderWidth: 1,
          borderColor: c.border,
          backgroundColor: c.bgElevated,
          padding: 16,
          marginBottom: 24,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <Icon name="shield" size={16} color={c.accent} />
          <Text style={{ color: c.accent, fontSize: 13, fontWeight: "800", letterSpacing: 0.3 }}>
            {t("In short", "Kwa ufupi").toUpperCase()}
          </Text>
        </View>
        <Text style={{ color: c.text, fontSize: 14, lineHeight: 21 }}>
          {t(
            "We collect only what we need to build your CVs and help you apply for jobs. We never sell your personal data. You can see, export or delete your data any time, and you can reach us at",
            "Tunakusanya tu kile tunachohitaji ili kuandaa CV zako na kukusaidia kuomba kazi. Hatuwahi kuuza taarifa zako binafsi. Unaweza kuona, kuhamisha au kufuta data yako wakati wowote, na unaweza kuwasiliana nasi kupitia",
          )}{" "}
          <Text style={{ color: c.text, fontWeight: "700" }}>{SUPPORT_EMAIL}</Text>.
        </Text>
      </View>

      <Text style={{ color: c.text, fontSize: 18, fontWeight: "800", marginBottom: 12 }}>{t("Privacy Policy", "Sera ya Faragha")}</Text>
      {PRIVACY_SECTIONS.map((s, i) => (
        <SectionBlock key={s.heading.en} section={s} index={i} />
      ))}

      <View style={{ height: 1, backgroundColor: c.border, marginVertical: 10 }} />

      <Text style={{ color: c.text, fontSize: 18, fontWeight: "800", marginBottom: 12 }}>{t("Terms of Service", "Masharti ya Huduma")}</Text>
      {TERMS_SECTIONS.map((s, i) => (
        <SectionBlock key={s.heading.en} section={s} index={i} />
      ))}

      <Text style={{ color: c.textMuted, fontSize: 12.5, lineHeight: 19, marginTop: 6 }}>
        {t("Questions about this policy?", "Una maswali kuhusu sera hii?")}{" "}
        <Text style={{ color: c.accent, fontWeight: "700" }}>{SUPPORT_EMAIL}</Text>
      </Text>
    </Screen>
  );
}
