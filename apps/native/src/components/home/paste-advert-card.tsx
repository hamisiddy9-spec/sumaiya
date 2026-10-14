import React from "react";
import { Text, View } from "react-native";
import { Button, Card, useThemeColors } from "../ui";
import { Icon } from "../icon";
import { useLang } from "../../lib/i18n";
import { FONT, HOME_SPACING } from "./tokens";

/**
 * CARD ONE of the design's Home — the advert loop, and the first thing on the
 * screen. It was missing entirely; the nearest thing shipped was a rotating
 * hint card whose eyebrow, title and CTA changed on every shuffle, so the one
 * action the product is built around ("show me the job, I'll aim your CV at
 * it") was never actually on screen.
 *
 * The copy is the design's, verbatim (guide §5 adopts Stitch's copy; §6's copy
 * rules govern the rest).
 *
 * SURFACE: the design paints a `#ffdbd1 → #f7e3db` gradient. There is no
 * gradient module in this app and adding one for a single card is not worth the
 * dependency, so the card is the design's gradient collapsed to its warm ember
 * tint (`emberTint`, the guide's 8–14 % band) with a low-alpha ember hairline.
 * The design's icon well is WHITE; §1 forbids `#ffffff` as a surface ("a white
 * card reads as a hole"), so the well is ember-tinted too.
 */
export function PasteAdvertCard({ onPaste }: { onPaste: () => void }) {
  const c = useThemeColors();
  const { t } = useLang();

  return (
    <Card
      padded={false}
      style={{
        padding: HOME_SPACING.cardPad,
        gap: HOME_SPACING.gutter,
        backgroundColor: c.accent + "12",
        borderColor: c.accent + "1f",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: HOME_SPACING.gutter }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: c.accent + "1f",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name="clipboard-paste" size={21} color={c.accent} />
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text style={{ color: c.text, fontSize: 18, lineHeight: 24, letterSpacing: -0.3, fontFamily: FONT.bold }}>
            {t("Paste a job advert", "Bandika tangazo la kazi")}
          </Text>
          {/* The design puts the eyebrow UNDER the headline; that is the
              hierarchy it draws, so the order is kept. */}
          <Text style={{ color: c.accent, fontSize: 10, letterSpacing: 0.6, textTransform: "uppercase", fontFamily: FONT.mono }}>
            {t("First, right now", "Mwelekeo wa Papo Hapo")}
          </Text>
        </View>
      </View>

      <Text style={{ color: c.textBody, fontSize: 13.5, lineHeight: 20, fontFamily: FONT.regular }}>
        {t(
          "Copy the advert you saw — on a notice board, in a WhatsApp group, or on a website. Paste it here, and your CV will aim at that job.",
          "Nakili tangazo uliloliona — kwenye ubao wa matangazo, kwenye kikundi cha WhatsApp, au kwenye tovuti. Bandika hapa, na CV yako ilenge kazi hiyo.",
        )}
      </Text>

      {/* The design's button is 48 px; `md` is the closest size the shared
          Button offers (46) and clears §8's 44 dp floor. */}
      <Button
        size="md"
        label={t("Paste advert", "Bandika tangazo")}
        leftIcon={<Icon name="clipboard-paste" size={18} color={c.accentText} />}
        onPress={onPaste}
      />
    </Card>
  );
}
