import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Share, Text, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { apiClient } from "../lib/api-client";
import { useLang } from "../lib/i18n";
import { Card, Reveal, Screen, haptics, useThemeColors } from "../components/ui";
import { FONT, HOME_SPACING } from "../components/home";
import { Icon } from "../components/icon";
import type { InviteScreenProps } from "../navigation/types";

/**
 * `Alika` — the referral surface (design: `B3 · Alika (Invite)`).
 *
 * The DESIGN's surface: the reward in one line, the user's own code in a card
 * that can be read aloud and copied, the WhatsApp share, and two real counts at
 * the foot. The PLUMBING underneath is unchanged — the code, the invite URL and
 * the counts all come from `GET /api/referral`, and the two controls are the
 * same `Clipboard.setStringAsync` and `Share.share` calls this screen already
 * had.
 *
 * FOUR THINGS THE DESIGN PRINTS THAT THE DATA CANNOT BACK — resolved honestly
 * instead of mocked up:
 *
 *   1. `Waliojiunga 3` is a mock figure. The cell shows `joined` as the server
 *      counted it, which is 0 for a new referrer — so the whole stats card stays
 *      hidden until it has a true number to show (the behaviour this screen
 *      already had).
 *   2. `Siku 21 / Premium Ulizopata` ("Premium days you earned") has NO source:
 *      `ReferralStats` (apps/web/lib/referral.ts) exposes `premiumUntil` — an
 *      expiry instant — and never a total of days ever granted. Recomputing it
 *      here as `activated x 7` would be a second copy of a server rule this app
 *      cannot see, and it is wrong for anyone whose window has started running
 *      out. So the cell shows the number the app CAN compute from real state:
 *      the days of earned Premium still running, derived from `premiumUntil` and
 *      labelled "zimesalia / left" rather than "ulizopata / earned".
 *   3. `SUMAIYA-TZ77` is a mock code, and the design prints it uppercase. The
 *      real code is generated server-side from an unambiguous LOWERCASE alphabet
 *      (`genCode`, apps/web/lib/referral.ts) and is shown VERBATIM in the
 *      display and in the clipboard: an uppercased display would mean the string
 *      on screen is not the string that got copied, which is the one thing this
 *      card exists to get right.
 *   4. The WhatsApp-green button (`#25D366`) is a mockup artefact, not a token.
 *      The screen's one primary action is ember (`accentFillStrong`, the guide's
 *      emberPressed — the fill that clears AA under a 15px label).
 *
 * The reward figure IS real: 7 days per activated friend is what the server
 * grants (`PREMIUM_DAYS_PER_REFERRAL`), and it was already this screen's copy
 * before the design arrived.
 *
 * The share button keeps this app's own honest reading of a "WhatsApp" label
 * (see the `whatsapp` tile in components/cv/export-sheet.tsx): there is no
 * WhatsApp deep link, so it opens the OS share list — and the line under it
 * says so rather than promising a send the app cannot make.
 */

type ReferralData = {
  code: string;
  url: string;
  joined: number;
  activated: number;
  premiumUntil: string | null;
};

/** A day, for turning the server's expiry instant into whole days left. */
const DAY_MS = 24 * 60 * 60 * 1000;

export function InviteScreen({ navigation }: InviteScreenProps) {
  const c = useThemeColors();
  const { t } = useLang();
  const [data, setData] = useState<ReferralData | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [copied, setCopied] = useState(false);

  // A failed fetch is its own state. It used to fall through to "Sign in to get
  // your invite link.", which told a signed-in user on a dead network that they
  // had no account — the same defect class the jobs list and the CV list were
  // fixed for. The screen is behind the `invite` account gate, so the only
  // realistic failure here is the request itself.
  const load = useCallback(() => {
    setPhase("loading");
    apiClient
      .getReferral()
      .then((d) => {
        setData(d);
        setPhase("ready");
      })
      .catch(() => setPhase("error"));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const inviteText = (url: string) =>
    t(
      `I'm using Sumaiya to build my CV and find work — it's free. Try it: ${url}`,
      `Natumia Sumaiya kutengeneza CV yangu na kutafuta ajira — ni bure. Ijaribu: ${url}`,
    );

  const share = async () => {
    if (!data) return;
    haptics.light();
    try {
      const res = await Share.share({ message: inviteText(data.url) });
      // `whatsapp` is the channel this button IS: the design's button names
      // WhatsApp, and the share list is how a WhatsApp send happens here.
      if (res.action === Share.sharedAction) apiClient.referralShared("whatsapp").catch(() => {});
    } catch {
      /* dismissed */
    }
  };

  // The design's control copies the CODE ("Gusa kunakili kodi hii moja kwa
  // moja") — the thing that can be read aloud over a phone line. The invite URL
  // travels in the share message above, which is the only path that claims the
  // referral (`?ref=<code>` — see navigation/root-navigator.tsx).
  const copy = async () => {
    if (!data) return;
    haptics.selection();
    await Clipboard.setStringAsync(data.code);
    setCopied(true);
    apiClient.referralShared("copy").catch(() => {});
    setTimeout(() => setCopied(false), 1800);
  };

  const premiumDaysLeft = data?.premiumUntil
    ? Math.max(0, Math.ceil((new Date(data.premiumUntil).getTime() - Date.now()) / DAY_MS))
    : 0;

  return (
    <Screen scroll keyboardAvoiding={false} contentContainerStyle={{ gap: 16 }}>
      {/* headerShown is false for every stack (navigation/nav-config.ts), so
          the way back is the screen's own — the row guide-screen.tsx and the
          editor use, at §8's 44 dp rather than a bare text line with hitSlop. */}
      <Pressable
        onPress={() => navigation.goBack()}
        accessibilityRole="button"
        accessibilityLabel={t("Back", "Rudi")}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          alignSelf: "flex-start",
          minHeight: HOME_SPACING.minTarget,
          paddingRight: 12,
        }}
      >
        <Icon name="arrow-left" size={18} color={c.accent} />
        <Text style={{ color: c.accent, fontFamily: FONT.bold }}>{t("Back", "Rudi")}</Text>
      </Pressable>

      <Text
        style={{
          color: c.text,
          fontFamily: FONT.display,
          fontSize: 24,
          lineHeight: 30,
          letterSpacing: -0.4,
        }}
      >
        {t("Invite friends, earn Premium days", "Alika Marafiki, Pata Siku za Premium")}
      </Text>

      {/* The reward, in the design's own words. The number is the server's real
          grant per activated friend (PREMIUM_DAYS_PER_REFERRAL) — the same 7
          days of both this product's doors. */}
      <Text style={{ color: c.textBody, fontFamily: FONT.regular, fontSize: 14.5, lineHeight: 21 }}>
        {t(
          "Every friend who joins and starts writing their profile — you and they each get ",
          "Kila rafiki anayejiunga na kuanza kuandika wasifu, wewe na yeye mnapata ",
        )}
        <Text style={{ color: c.accent, fontFamily: FONT.bold }}>{t("7 days of Premium, free", "Siku 7 za huduma ya Premium bure")}</Text>
        {/* The sentence's own full stop. Punctuation is not a translatable
            string, so it is rendered literally rather than through a t() pair
            (i18n.test.ts rightly rejects a t(".", ".") with identical slots). */}
        {"."}
      </Text>

      {phase === "loading" ? (
        <Card style={{ alignItems: "center", justifyContent: "center", minHeight: 132 }}>
          <ActivityIndicator color={c.accent} />
        </Card>
      ) : phase === "error" || !data ? (
        <Card style={{ gap: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                backgroundColor: c.warning + "14",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="alert-circle" size={18} color={c.warning} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ color: c.text, fontFamily: FONT.bold, fontSize: 14.5, lineHeight: 19 }}>
                {t("Couldn't load your invite code", "Imeshindwa kupakia kodi yako ya mwaliko")}
              </Text>
              <Text style={{ color: c.textMuted, fontFamily: FONT.regular, fontSize: 12.5, lineHeight: 17, marginTop: 2 }}>
                {t("Check your connection, then try again.", "Angalia mtandao wako, kisha ujaribu tena.")}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={load}
            accessibilityRole="button"
            accessibilityLabel={t("Try again", "Jaribu tena")}
            style={{
              minHeight: HOME_SPACING.minTarget,
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              alignSelf: "flex-start",
            }}
          >
            <Icon name="refresh-cw" size={16} color={c.accent} />
            <Text style={{ color: c.accent, fontFamily: FONT.bold, fontSize: 14 }}>
              {t("Try again", "Jaribu tena")}
            </Text>
          </Pressable>
        </Card>
      ) : (
        <Reveal style={{ gap: 16 }}>
          {/* THE CODE CARD. The whole row is the control the design's helper
              line describes ("Gusa kunakili kodi hii moja kwa moja") — 56 dp
              tall, with the design's `Nakili` pill inside it, so there is one
              target instead of a 30 dp chip a thumb has to find. */}
          <Card style={{ gap: 10 }}>
            <Text
              style={{
                color: c.textMuted,
                fontFamily: FONT.mono,
                fontSize: 11,
                letterSpacing: 0.8,
                textAlign: "center",
                textTransform: "uppercase",
              }}
            >
              {t("Your invite code", "Kodi Yako ya Mwaliko")}
            </Text>

            <Pressable
              onPress={copy}
              accessibilityRole="button"
              accessibilityLabel={
                copied
                  ? t(`${data.code} copied`, `${data.code} imenakiliwa`)
                  : t(`Copy invite code ${data.code}`, `Nakili kodi ya mwaliko ${data.code}`)
              }
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                minHeight: 56,
                paddingLeft: 14,
                paddingRight: 6,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: c.border,
                backgroundColor: c.bgSunken,
              }}
            >
              {/* Verbatim, never re-cased: this is the string that gets copied. */}
              <Text
                numberOfLines={1}
                style={{ flexShrink: 1, color: c.accent, fontFamily: FONT.mono, fontSize: 20, letterSpacing: 3 }}
              >
                {data.code}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  minHeight: HOME_SPACING.minTarget,
                  paddingHorizontal: 12,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: c.border,
                  backgroundColor: c.bgElevated,
                }}
              >
                <Icon name={copied ? "check" : "copy"} size={15} color={copied ? c.success : c.accent} />
                <Text style={{ color: copied ? c.success : c.accent, fontFamily: FONT.mono, fontSize: 12.5 }}>
                  {copied ? t("Copied", "Imenakiliwa") : t("Copy", "Nakili")}
                </Text>
              </View>
            </Pressable>

            <Text style={{ color: c.textMuted, fontFamily: FONT.regular, fontSize: 11, textAlign: "center" }}>
              {t("Tap to copy this code directly.", "Gusa kunakili kodi hii moja kwa moja.")}
            </Text>
          </Card>

          {/* THE SHARE. One primary action, ember, 48 dp. */}
          <View style={{ gap: 8 }}>
            <Pressable
              onPress={share}
              accessibilityRole="button"
              accessibilityLabel={t("Send on WhatsApp", "Tuma kwa WhatsApp")}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                minHeight: 48,
                borderRadius: 12,
                backgroundColor: c.accentFillStrong,
              }}
            >
              <Icon name="message-circle" size={19} color={c.accentText} />
              <Text style={{ color: c.accentText, fontFamily: FONT.bold, fontSize: 15 }}>
                {t("Send on WhatsApp", "Tuma kwa WhatsApp")}
              </Text>
            </Pressable>
            <Text style={{ color: c.textMuted, fontFamily: FONT.regular, fontSize: 11.5, textAlign: "center" }}>
              {t("Opens the share list — pick WhatsApp.", "Inafungua orodha ya kushiriki — chagua WhatsApp.")}
            </Text>
          </View>

          {/* THE COUNTS. Both are real state: `joined` as the server counted it,
              and the days of earned Premium still running (`premiumUntil`).
              The design's `3` and `Siku 21` are mock figures with no source. */}
          {data.joined > 0 ? (
            <Card style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{ flex: 1, alignItems: "center", gap: 2 }}>
                <Text style={{ color: c.text, fontFamily: FONT.mono, fontSize: 18 }}>
                  {String(data.joined)}
                </Text>
                <Text style={{ color: c.textMuted, fontFamily: FONT.regular, fontSize: 11 }}>
                  {t("Joined", "Waliojiunga")}
                </Text>
              </View>
              <View style={{ width: 1, height: 32, backgroundColor: c.border }} />
              <View style={{ flex: 1, alignItems: "center", gap: 2 }}>
                <Text
                  style={{
                    color: premiumDaysLeft > 0 ? c.accent : c.textMuted,
                    fontFamily: FONT.mono,
                    fontSize: 18,
                  }}
                >
                  {t(`${premiumDaysLeft} days`, `Siku ${premiumDaysLeft}`)}
                </Text>
                <Text style={{ color: c.textMuted, fontFamily: FONT.regular, fontSize: 11 }}>
                  {t("Premium left", "Premium zimesalia")}
                </Text>
              </View>
            </Card>
          ) : null}
        </Reveal>
      )}
    </Screen>
  );
}
