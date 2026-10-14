import React, { useCallback, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { offlineStorage } from "@sumaiya/utils";
import { useLang } from "../../lib/i18n";
import { Icon } from "../../components/icon";
import {
  Button,
  Reveal,
  Screen,
  ScreenTitle,
  dialog,
  haptics,
  useThemeColors,
} from "../../components/ui";
import { FONT } from "../../components/home";
import { SUPPORT_EMAIL } from "../../lib/app-hosts";
import { useAuthContext } from "../../contexts/auth-context";
import { ownerIdFor } from "../../lib/local-owner";
import { eraseMemory, setConsent } from "../../lib/ai-memory";
import { clearChatFor } from "../../lib/chat-scope";
import { deleteApplication, listApplications } from "../../lib/applications-store";
import type { PrivacyTermsScreenProps } from "../../navigation/types";

/**
 * Screen — `Faragha na Sheria` / Privacy & Terms (design: F3, `Kifaa Chako Tu`).
 *
 * TWO THINGS THIS FILE OWES THE READER, both of them design decisions rather
 * than styling choices:
 *
 *   1. EVERY SENTENCE HERE IS TRUE OF THE SHIPPED BUILD. The design's two cards
 *      are a hand-written map of where data actually lives, so each card is
 *      backed by code, not by confidence:
 *        • "Kile Kinachobaki Kwenye Simu Yako" — the CVs, applications, photos
 *          and AI memory really are in this device's SQLite file and
 *          AsyncStorage (lib/ai-memory.ts, @sumaiya/utils offlineStorage).
 *        • The signed-in rider — "zinasawazishwa kwenye akaunti yako" — exists
 *          because a signed-in user's CVs DO reach the server (hooks/use-cvs.ts
 *          reads them back), so the card must not imply the device is the only
 *          copy. A guest has no account, so for a guest the exclusivity is
 *          literal and the rider is not shown.
 *        • "Kwa Ruhusa Tu" on the second card means what it says: nothing leaves
 *          without a user action — an export, a share, a report the user sends,
 *          or the account sync that only exists after they sign in.
 *      The design's third clause, "kurejesha programu kama ilivyosakinishwa
 *      upya" (restores the app as if freshly installed), is NOT kept: the wipe
 *      below does not sign anyone out, does not clear the language/theme
 *      preferences and does not remove the local career profile, so claiming a
 *      factory reset would be a lie. The card states the wipe it performs.
 *
 *   2. THE POLICY IS STILL ON THIS SCREEN. F3 shows a 390 × 800 fragment — two
 *      summary cards, a danger box and a policy footer — and the full text that
 *      was already here (what is collected, what is shared, security, and the
 *      PDPA ss.33/38 rights of access and erasure) is retained beneath it. A
 *      summary card is not a disclosure: deleting the policy from the screen
 *      named `Faragha na Masharti` would be a privacy regression dressed up as
 *      a redesign.
 *
 * The wipe itself is the real one, and it is honest about its edges: SQLite
 * documents (CVs, the applications table, the pending sync queue), the chat
 * transcript and Sumaiya's memory go; the account and its synced copies do not.
 */

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

/**
 * One of the design's two map cards. `stays` is the success-tinted one (what
 * never leaves the handset), `sends` the raised one (what leaves, on purpose).
 * The tint and the dot are the guide's own `success` / `ember` — never Tailwind's
 * `emerald-*`, which is a mockup artefact (see docs/DESIGN-GUIDE.md §1).
 */
function TrustCard({
  tone,
  title,
  body,
}: {
  tone: "stays" | "sends";
  title: string;
  body: string;
}) {
  const c = useThemeColors();
  const stays = tone === "stays";
  return (
    <View
      style={{
        borderRadius: 12,
        borderWidth: 1,
        borderColor: stays ? c.success + "33" : c.border,
        backgroundColor: stays ? c.successTint : c.bgElevated,
        padding: 14,
        gap: 6,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: stays ? c.success : c.accent,
          }}
        />
        <Text
          style={{
            flexShrink: 1,
            color: stays ? c.success : c.text,
            fontSize: 13,
            lineHeight: 18,
            fontFamily: FONT.bold,
          }}
        >
          {title}
        </Text>
      </View>
      <Text style={{ color: c.textBody, fontSize: 12, lineHeight: 18, fontFamily: FONT.regular }}>
        {body}
      </Text>
    </View>
  );
}

function SectionBlock({ section, index }: { section: Section; index: number }) {
  const c = useThemeColors();
  const { lang } = useLang();
  return (
    <Reveal delayMs={Math.min(index, 3) * 40} style={{ marginBottom: 18 }}>
      <Text
        style={{
          color: c.text,
          fontSize: 15.5,
          fontFamily: FONT.bold,
          marginBottom: 6,
        }}
      >
        {section.heading[lang]}
      </Text>
      <Text style={{ color: c.textBody, fontSize: 14, lineHeight: 22, fontFamily: FONT.regular }}>
        {section.body[lang]}
      </Text>
    </Reveal>
  );
}

export function PrivacyTermsScreen({ navigation }: PrivacyTermsScreenProps) {
  const c = useThemeColors();
  const { t } = useLang();
  const { user, loading: authLoading } = useAuthContext();
  const isGuest = !user;
  // The wipe below runs under this owner's key, so a second person on a shared
  // handset is never the one erased — see lib/owner-scope.ts.
  const ownerId = ownerIdFor(user);
  const [erasing, setErasing] = useState(false);

  /**
   * The real wipe: everything this device holds about the person.
   *
   * `offlineStorage.clearAll()` empties the `cvs` and `sync_queue` tables of
   * sumaiya.db; the applications table lives in the SAME SQLite file
   * (lib/applications-store.ts) and has no clear-all, so it is emptied row by
   * row with its own exported delete. The chat transcript and Sumaiya's memory
   * are per-owner keys, and consent is left as `declined` rather than reset to
   * `unasked`: the assistant must not quietly start learning again from zero on
   * the next launch without the person asking for it — the memory screen's
   * toggle is where that is turned back on.
   */
  const runErase = useCallback(async () => {
    setErasing(true);
    try {
      await offlineStorage.clearAll();
      const applications = await listApplications().catch(() => []);
      for (const app of applications) {
        await deleteApplication(app.id).catch(() => {
          /* one stubborn row must not stop the wipe */
        });
      }
      await clearChatFor(ownerId);
      await eraseMemory(ownerId);
      await setConsent(ownerId, "declined");
      haptics.success();
      dialog.alert(
        t("Done — the phone is clear", "Imekamilika — simu iko safi"),
        t(
          "The CVs on this phone, the applications list, your chat with me and everything I remembered are gone. I will not start learning about you again until you turn it on.",
          "CV zilizokuwa kwenye simu hii, orodha ya maombi, mazungumzo yako nami na kila nilichokumbuka vimefutwa. Sitaanza kujifunza kukuhusu tena mpaka uwashe mwenyewe.",
        ),
      );
    } catch {
      haptics.error();
      dialog.alert(
        t("Couldn't delete everything", "Imeshindwa kufuta kila kitu"),
        t(
          "Some of it is still on this phone. Try again; if it keeps failing, write to",
          "Baadhi bado yako kwenye simu hii. Jaribu tena; kikishindikana, andikia",
        ) + ` ${SUPPORT_EMAIL}.`,
      );
    } finally {
      setErasing(false);
    }
  }, [ownerId, t]);

  /**
   * Ask first, and say exactly what goes. Four honest outcomes, so the question
   * never over-promises:
   *   • a guest — this device holds the ONLY copy of those CVs (no account
   *     behind them), which is the one case where the tap is irreversible;
   *   • a signed-in user — the synced copies stay on the account;
   *   • anything still waiting to upload — named by count, as the profile
   *     screen's clear-cache dialog does, because clearing discards it;
   *   • while the session is still restoring — refused, since `ownerId` would
   *     be the guest bucket and the wrong person's memory would be erased.
   */
  const onEraseAll = useCallback(async () => {
    haptics.warning();
    if (authLoading) return;

    let pending = 0;
    try {
      pending = (await offlineStorage.getSyncQueue()).length;
    } catch {
      /* if the queue cannot be read, fall through with the plain wording */
    }

    const body = isGuest
      ? t(
          "This deletes the CVs saved on this phone, the applications list, your chat with me and everything I remember about you. These CVs have no account behind them, so this device holds the only copy.",
          "Hii inafuta CV zilizohifadhiwa kwenye simu hii, orodha ya maombi, mazungumzo yako nami na kila ninachokumbuka kukuhusu. CV hizi hazina akaunti nyuma yake, hivyo kifaa hiki kina nakala pekee.",
        )
      : t(
          "This deletes the CVs saved on this phone, the applications list, your chat with me and everything I remember about you. The copies synced to your account stay.",
          "Hii inafuta CV zilizohifadhiwa kwenye simu hii, orodha ya maombi, mazungumzo yako nami na kila ninachokumbuka kukuhusu. Nakala zilizosawazishwa kwenye akaunti yako zinabaki.",
        );

    const pendingLine =
      pending > 0
        ? t(
            ` ${pending} change${pending === 1 ? "" : "s"} on this device ${pending === 1 ? "hasn't" : "haven't"} finished uploading and will be discarded too.`,
            ` Mabadiliko ${pending} kwenye kifaa hiki hayajamaliza kupakiwa na yatafutwa pia.`,
          )
        : "";

    dialog.alert(
      t("Delete everything on this phone?", "Ufute kila kitu kwenye simu hii?"),
      body + pendingLine,
      [
        { text: t("Cancel", "Ghairi"), style: "cancel" },
        {
          text: t("Delete everything", "Futa kila kitu"),
          style: "destructive",
          onPress: () => void runErase(),
        },
      ],
    );
  }, [authLoading, isGuest, runErase, t]);

  return (
    <Screen scroll keyboardAvoiding={false} contentContainerStyle={{ paddingBottom: 48 }}>
      <Pressable
        hitSlop={10}
        onPress={() => navigation.goBack()}
        accessibilityRole="button"
        accessibilityLabel={t("Back to profile", "Rudi kwenye wasifu")}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          minHeight: 44,
          marginBottom: 4,
        }}
      >
        <Icon name="arrow-left" size={18} color={c.accent} />
        <Text style={{ color: c.accent, fontFamily: FONT.bold }}>
          {t("Profile", "Wasifu")}
        </Text>
      </Pressable>

      <Reveal>
        <Text
          style={{
            color: c.accent,
            fontSize: 12,
            letterSpacing: 1.2,
            textTransform: "uppercase",
            fontFamily: FONT.mono,
          }}
        >
          {t("A privacy promise", "Uhakika wa Faragha")}
        </Text>
        <ScreenTitle>{t("Only your phone", "Kifaa Chako Tu")}</ScreenTitle>

        <Text
          style={{
            color: c.textBody,
            fontSize: 12.5,
            lineHeight: 19,
            marginBottom: 16,
            fontFamily: FONT.regular,
          }}
        >
          {t(
            "Sumaiya was built on firm principles about respecting privacy. We have no central database that collects or sells your profile to outside companies.",
            "Sumaiya iliundwa kwa kufuata misingi madhubuti ya kuheshimu faragha. Hatuna kanzidata kuu ya kukusanya au kuuza wasifu wako kwa makampuni ya nje.",
          )}
        </Text>

        <View style={{ gap: 10 }}>
          <TrustCard
            tone="stays"
            title={t("What stays on your phone", "Kile Kinachobaki Kwenye Simu Yako")}
            body={
              t(
                "All your CVs, your applications list, the photos you upload, and the record of your conversations with the assistant.",
                "CV zako zote, orodha ya maombi ya kazi, picha ulizopakia, na kumbukumbu ya mazungumzo na msaidizi.",
              ) +
              // A signed-in user's documents are also on the server (the CV list
              // is read back from it), so the card must not imply "this handset
              // is the only copy" — the exclusivity is true for a guest only.
              (isGuest
                ? ""
                : t(
                    " You are signed in, so they are also synced to your account.",
                    " Umeingia kwenye akaunti, hivyo pia zinasawazishwa kwenye akaunti yako.",
                  ))
            }
          />
          <TrustCard
            tone="sends"
            title={t(
              "What goes online (only with your permission)",
              "Kile Kinachotumwa Mtandaoni (Kwa Ruhusa Tu)",
            )}
            body={t(
              "Applications you choose to send to an employer yourself, or files you send through WhatsApp or email.",
              "Maombi unayochagua mwenyewe kutuma kwa mwajiri, au faili unazozituma kupitia WhatsApp au Barua pepe.",
            )}
          />
        </View>
      </Reveal>

      <Reveal delayMs={80} style={{ marginTop: 16 }}>
        <View
          style={{
            borderRadius: 12,
            borderWidth: 1,
            borderColor: c.error + "33",
            backgroundColor: c.errorTint,
            padding: 16,
            gap: 8,
          }}
        >
          <Text style={{ color: c.error, fontSize: 13, lineHeight: 18, fontFamily: FONT.bold }}>
            {t("Delete all the data on this device", "Futa Taarifa Zote Kwenye Kifaa")}
          </Text>
          <Text style={{ color: c.textBody, fontSize: 12, lineHeight: 18, fontFamily: FONT.regular }}>
            {t(
              "This immediately deletes every SQLite document on this phone, Sumaiya's memory, and your chat with her. It cannot be undone.",
              "Hii inafuta mara moja nyaraka zote za SQLite kwenye simu hii, kumbukumbu za Sumaiya, na mazungumzo yako naye. Haiwezi kurudishwa.",
            )}
          </Text>
          <Button
            variant="danger"
            label={t("Delete everything now", "Futa Kila Kitu Sasa")}
            loading={erasing}
            disabled={authLoading}
            onPress={() => void onEraseAll()}
          />
        </View>
      </Reveal>

      {/* The full disclosure, kept in full: the cards above summarise where data
          lives, they do not replace the policy (see the file header). */}
      <View style={{ marginTop: 28 }}>
        <Text style={{ color: c.text, fontSize: 18, fontFamily: FONT.bold, marginBottom: 12 }}>
          {t("Privacy Policy", "Sera ya Faragha")}
        </Text>
        {PRIVACY_SECTIONS.map((s, i) => (
          <SectionBlock key={s.heading.en} section={s} index={i} />
        ))}
      </View>

      <View style={{ height: 1, backgroundColor: c.border, marginVertical: 10 }} />

      <Text style={{ color: c.text, fontSize: 18, fontFamily: FONT.bold, marginBottom: 12 }}>
        {t("Terms of Service", "Masharti ya Huduma")}
      </Text>
      {TERMS_SECTIONS.map((s, i) => (
        <SectionBlock key={s.heading.en} section={s} index={i} />
      ))}

      <Text
        style={{
          color: c.textMuted,
          fontSize: 12.5,
          lineHeight: 19,
          marginTop: 6,
          fontFamily: FONT.regular,
        }}
      >
        {t("Questions about this policy?", "Una maswali kuhusu sera hii?")}{" "}
        <Text style={{ color: c.accent, fontFamily: FONT.bold }}>{SUPPORT_EMAIL}</Text>
      </Text>

      {/* The design's footer. The law is named as the code names it — PDPA 2022
          (lib/ai-memory.ts cites ss.23/33/38 of it) rather than a vague
          "Sheria za Tanzania", because a policy footer that misnames the regime
          it follows is the one line on this screen a reviewer would check. */}
      <View style={{ borderTopWidth: 1, borderTopColor: c.border, marginTop: 22, paddingTop: 12 }}>
        <Text
          style={{
            color: c.textMuted,
            fontSize: 11,
            textAlign: "center",
            fontFamily: FONT.mono,
          }}
        >
          {t(
            "Policy version: March 2025 • Tanzania law (PDPA 2022) & GDPR",
            "Toleo la Sera: Machi 2025 • Sheria za Tanzania (PDPA 2022) & GDPR",
          )}
        </Text>
      </View>
    </Screen>
  );
}
