import React from "react";
import { Pressable, Text, View } from "react-native";
import { Icon } from "../../components/icon";
import { haptics, useThemeColors } from "../../components/ui";
import { FONT } from "../../components/home/tokens";
import { useLang } from "../../lib/i18n";

/**
 * The CV editor's collapsible section card — design C1, the editor's whole
 * skeleton.
 *
 * The design's four numbered sections are all the same object in four states:
 *
 *   collapsed + countable   `1. Taarifa Binafsi` … `4/4 Kamili`
 *   collapsed + data        `3. Elimu & Vyeti` / subtitle … `Hariri →`
 *   open + one list         `2. Uzoefu wa Kazi` / `Sehemu 2 zimejazwa` … `+ Ongeza Kazi`
 *   open + fields           the form itself
 *
 * Two things the design cannot say and this component refuses to fake:
 *
 *   - The **filled count is computed by the caller** from the real data. There
 *     is no default and no placeholder: a section with nothing countable passes
 *     `count` as undefined and gets the `Hariri →` affordance instead. A made-up
 *     `0/4` on a screen that holds the user's only CV is worse than no count.
 *   - The count is only coloured `success` when it is actually complete;
 *     otherwise it carries the `warning` token — the guide's needs-attention
 *     hue. (Stitch drew the complete state only; the incomplete state is not a
 *     success and must not be painted like one.)
 *
 * The whole header row is ONE ≥48 dp tap target (§8), so `Hariri →` is a label
 * on a real control rather than 30 dp of text the user has to hit exactly.
 */
export function SectionCard({
  index,
  title,
  icon,
  open,
  onToggle,
  subtitle,
  preview,
  count,
  action,
  children,
}: {
  /** 1-based, printed as `1. ` exactly as the design numbers its sections. */
  index: number;
  title: string;
  icon: string;
  open: boolean;
  onToggle: () => void;
  /** The collapsed one-liner (the design's 11 px muted line under the title). */
  subtitle?: string;
  /** The collapsed detail block — a hairline, then the content (design: the
   *  two-column `Jina Kamili / Simu` preview under `border-t`). */
  preview?: React.ReactNode;
  /** REAL filled/total for a section whose completeness can be counted. */
  count?: { filled: number; total: number };
  /** Header-right control while open (the design's `+ Ongeza Kazi`). */
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const c = useThemeColors();
  const { t } = useLang();
  const complete = count ? count.filled >= count.total : false;

  return (
    <View
      style={{
        backgroundColor: c.bgElevated,
        borderRadius: 16,
        borderWidth: 1,
        // The open section carries the design's ember-tinted ring
        // (`border-ember/40`); a closed one is a plain hairline.
        borderColor: open ? c.accent + "59" : c.border,
        overflow: "hidden",
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${index}. ${title}${subtitle ? `. ${subtitle}` : ""}`}
        onPress={() => {
          haptics.selection();
          onToggle();
        }}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 11,
          padding: 14,
          minHeight: 48,
        }}
      >
        <View
          style={{
            width: 30,
            height: 30,
            borderRadius: 9,
            backgroundColor: c.accent + "14",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name={icon} size={16} color={c.accent} />
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ color: c.text, fontSize: 15, fontFamily: FONT.bold }}>
            {`${index}. ${title}`}
          </Text>
          {subtitle ? (
            <Text
              style={{ color: c.textMuted, fontSize: 11, lineHeight: 16, marginTop: 2, fontFamily: FONT.regular }}
              numberOfLines={2}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>

        {action ? (
          action
        ) : count ? (
          <View
            style={{
              flexShrink: 0,
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 999,
              backgroundColor: (complete ? c.success : c.warning) + "1a",
            }}
          >
            {complete ? <Icon name="check" size={11} color={c.success} /> : null}
            <Text
              style={{
                color: complete ? c.success : c.warning,
                fontSize: 11,
                fontFamily: FONT.mono,
              }}
            >
              {`${count.filled}/${count.total} ${t("Complete", "Kamili")}`}
            </Text>
          </View>
        ) : !open ? (
          <View style={{ flexShrink: 0, flexDirection: "row", alignItems: "center", gap: 3 }}>
            <Text style={{ color: c.textMuted, fontSize: 11.5, fontFamily: FONT.mono }}>
              {t("Edit", "Hariri")}
            </Text>
            <Icon name="arrow-right" size={13} color={c.textMuted} />
          </View>
        ) : null}
      </Pressable>

      {open ? (
        <View style={{ paddingHorizontal: 14, paddingBottom: 16, gap: 12 }}>{children}</View>
      ) : preview ? (
        <View style={{ paddingHorizontal: 14, paddingBottom: 14 }}>
          <View style={{ borderTopWidth: 1, borderTopColor: c.border, paddingTop: 10 }}>{preview}</View>
        </View>
      ) : null}
    </View>
  );
}

/**
 * A tracked, uppercase group label inside a section body (the app's
 * `ListGroupLabel` look, without the 22 dp top margin that suits a list screen
 * and not a card).
 */
export function SubLabel({ children }: { children: string }) {
  const c = useThemeColors();
  return (
    <Text
      style={{
        color: c.textMuted,
        fontSize: 10.5,
        letterSpacing: 0.8,
        textTransform: "uppercase",
        fontFamily: FONT.mono,
        marginBottom: 2,
      }}
    >
      {children}
    </Text>
  );
}

/** One `label / value` cell of a collapsed preview grid (design: `Jina Kamili`
 *  over its value, two per row). An empty value is shown as `—`, never as a
 *  guess. */
export function PreviewCell({ label, value }: { label: string; value: string }) {
  const c = useThemeColors();
  return (
    <View style={{ width: "48%", gap: 1 }}>
      <Text style={{ color: c.textMuted, fontSize: 10 }}>{label}</Text>
      <Text
        style={{ color: value ? c.text : c.textMuted, fontSize: 13, fontFamily: FONT.semibold }}
        numberOfLines={1}
      >
        {value || "—"}
      </Text>
    </View>
  );
}
