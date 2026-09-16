import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Modal, Pressable, SectionList, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn } from "react-native-reanimated";
import { ALL_TEMPLATES, type CvTemplateId, type CvTemplateMeta } from "../../lib/cv-html";
import { useEntitlements } from "../../lib/entitlements";
import { loadProfile } from "../../lib/profile-store";
import { fieldLabel, suggestTemplates } from "../../lib/template-suggestions";
import { useLang } from "../../lib/i18n";
import { Icon } from "../icon";
import { PremiumSheet } from "../premium-sheet";
import { haptics, TextField, useThemeColors } from "../ui";
import { RealTemplateThumb } from "./real-template-thumb";

/**
 * The TemplateHub gallery.
 *
 * The catalogue is organised as collections, not a flat grid:
 *
 *   1. Recommended for you  — AI-ranked designs for the user's field.
 *   2. TemplateHub Premium   — the paid collection (gated by entitlement).
 *   3. Curated Core          — simple, dependable, always-free designs.
 *
 * Search collapses this into a single flat "Results" section. A family filter
 * (Sidebar / Minimal / …) applies inside every section. The grid is virtualised
 * via SectionList and stays three-across by chunking each section into rows.
 */

const FAMILIES: { key: string; en: string; sw: string }[] = [
  { key: "sidebar", en: "Sidebar", sw: "Pembeni" },
  { key: "minimal", en: "Minimal", sw: "Sahili" },
  { key: "header", en: "Header", sw: "Kichwa" },
  { key: "creative", en: "Creative", sw: "Ubunifu" },
  { key: "classic", en: "Classic", sw: "Rasmi" },
];

const GAP = 12;
const PAD = 20;
const COLUMNS = 3;

type Row = CvTemplateMeta[];
type Section = { key: string; title: string; subtitle?: string; data: Row[] };

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

export function TemplateGallery({
  visible,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  selected?: CvTemplateId;
  onSelect: (id: CvTemplateId) => void;
  onClose: () => void;
}) {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { t, lang } = useLang();
  const { premium } = useEntitlements();

  const [query, setQuery] = useState("");
  const [family, setFamily] = useState<string | null>(null);
  const [premiumFor, setPremiumFor] = useState<string | null>(null);

  // ── Job-aware suggestions ──────────────────────────────────────────────────
  // Derived from text the user already gave us (headline, goals, experience) —
  // no extra question. If nothing matches we show no section at all, because a
  // wrong recommendation is worse than none.
  const [profileText, setProfileText] = useState("");
  useEffect(() => {
    if (!visible) return;
    let alive = true;
    loadProfile()
      .then((p) => {
        if (alive) setProfileText([p.headline, p.goals, p.experience, p.skills].filter(Boolean).join(" "));
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [visible]);

  const suggestion = useMemo(() => suggestTemplates(profileText, 6), [profileText]);

  const sections = useMemo<Section[]>(() => {
    const q = query.trim().toLowerCase();
    const matches = (tpl: CvTemplateMeta) =>
      (!q ||
        tpl.id.includes(q) ||
        tpl.name.en.toLowerCase().includes(q) ||
        tpl.name.sw.toLowerCase().includes(q)) &&
      (!family || tpl.style === family);

    // Search: one flat results section, no collection framing.
    if (q) {
      const data = ALL_TEMPLATES.filter(matches);
      return [{ key: "results", title: t("Results", "Matokeo"), data: chunk(data, COLUMNS) }];
    }

    const out: Section[] = [];

    // 1. AI recommendation. Surfaces even while a family filter is active, but
    //    never fights search (handled above).
    if (suggestion) {
      const recs = suggestion.templates.filter((tpl) => !family || tpl.style === family);
      if (recs.length) {
        out.push({
          key: "recs",
          title: t("Recommended for you", "Imependekezwa kwako"),
          subtitle: `${t("For your job", "Kwa kazi yako")} · ${fieldLabel(suggestion.field, lang)}`,
          data: chunk(recs, COLUMNS),
        });
      }
    }

    // 2. Premium collections.
    const premiumRows = ALL_TEMPLATES.filter((tpl) => tpl.tier === "premium" && matches(tpl));
    if (premiumRows.length) {
      out.push({
        key: "premium",
        title: t("TemplateHub Premium", "TemplateHub Premium"),
        subtitle: t(
          "Distinct designs for when your documents need to stand out",
          "Miundo bora kwa nyaraka zinazohitaji kuvutia",
        ),
        data: chunk(premiumRows, COLUMNS),
      });
    }

    // 3. Curated core (always free).
    const coreRows = ALL_TEMPLATES.filter((tpl) => tpl.tier !== "premium" && matches(tpl));
    if (coreRows.length) {
      out.push({
        key: "core",
        title: t("Curated Core", "Mkusanyiko Msingi"),
        subtitle: t("Simple, dependable designs — always free", "Miundo sahili na ya uhakika — bure daima"),
        data: chunk(coreRows, COLUMNS),
      });
    }

    return out;
  }, [query, family, suggestion, lang, t]);

  const cell = Math.floor((width - PAD * 2 - GAP * (COLUMNS - 1)) / COLUMNS);

  const pick = useCallback(
    (tpl: CvTemplateMeta) => {
      const locked = tpl.tier === "premium" && !premium;
      haptics.selection();
      if (locked) {
        setPremiumFor(tpl.id);
        return;
      }
      onSelect(tpl.id);
      onClose();
    },
    [premium, onSelect, onClose],
  );

  const renderCell = useCallback(
    (item: CvTemplateMeta, idx: number) => {
      const locked = item.tier === "premium" && !premium;
      const active = item.id === selected;
      return (
        <Pressable
          key={item.id}
          onPress={() => pick(item)}
          style={{ width: cell, alignItems: "center", gap: 6 }}
          accessibilityRole="button"
          accessibilityLabel={lang === "sw" ? item.name.sw : item.name.en}
        >
          <View
            style={{
              padding: 3,
              borderRadius: 10,
              borderWidth: 2.5,
              borderColor: active ? c.accent : "transparent",
              opacity: locked ? 0.55 : 1,
            }}
          >
            <RealTemplateThumb id={item.id} accent={c.accent} width={cell - 12} />
          </View>
          <Text
            numberOfLines={1}
            style={{ color: active ? c.accent : c.text, fontSize: 11.5, fontWeight: "700", maxWidth: cell }}
          >
            {lang === "sw" ? item.name.sw : item.name.en}
          </Text>
          {locked ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
              <Icon name="lock" size={9} color={c.textMuted} />
              <Text style={{ color: c.textMuted, fontSize: 9.5, fontWeight: "700" }}>
                {t("Premium", "Premium")}
              </Text>
            </View>
          ) : null}
        </Pressable>
      );
    },
    [cell, selected, premium, lang, pick, c, t],
  );

  const renderRow = useCallback(
    ({ item }: { item: Row }) => (
      <View style={{ flexDirection: "row", gap: GAP, paddingHorizontal: PAD, paddingBottom: GAP + 4 }}>
        {item.map((tpl, i) => renderCell(tpl, i))}
      </View>
    ),
    [renderCell],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: Section }) => (
      <View style={{ paddingHorizontal: PAD, paddingTop: 14, paddingBottom: 8 }}>
        <Text style={{ color: c.text, fontSize: 15.5, fontWeight: "800" }}>{section.title}</Text>
        {section.subtitle ? (
          <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 2, lineHeight: 16 }}>{section.subtitle}</Text>
        ) : null}
      </View>
    ),
    [c],
  );

  const chip = (key: string, label: string, active: boolean, onPress: () => void) => (
    <Pressable
      key={key}
      onPress={() => {
        haptics.selection();
        onPress();
      }}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 99,
        borderWidth: 1.5,
        borderColor: active ? c.accent : c.border,
        backgroundColor: active ? c.accent + "18" : "transparent",
      }}
    >
      <Text style={{ color: active ? c.accent : c.textMuted, fontSize: 12, fontWeight: "700" }}>{label}</Text>
    </Pressable>
  );

  const total = useMemo(() => sections.reduce((n, s) => n + s.data.reduce((m, r) => m + r.length, 0), 0), [sections]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top }}>
        {/* Header */}
        <Animated.View
          entering={FadeIn}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: PAD,
            paddingVertical: 12,
          }}
        >
          <View>
            <Text style={{ color: c.text, fontSize: 19, fontWeight: "800" }}>
              {t("TemplateHub", "TemplateHub")}
            </Text>
            <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 2 }}>
              {t(`${total} of ${ALL_TEMPLATES.length} designs`, `${total} kati ya ${ALL_TEMPLATES.length} miundo`)}
            </Text>
          </View>
          <Pressable
            onPress={() => {
              haptics.selection();
              onClose();
            }}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={t("Close", "Funga")}
          >
            <Icon name="x" size={22} color={c.text} />
          </Pressable>
        </Animated.View>

        {/* Search */}
        <View style={{ paddingHorizontal: PAD }}>
          <TextField
            value={query}
            onChangeText={setQuery}
            placeholder={t("Search designs", "Tafuta miundo")}
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>

        {/* Family filter */}
        <View style={{ paddingHorizontal: PAD, marginTop: 10 }}>
          <FlatListRow>
            {FAMILIES.map((f) =>
              chip(f.key, lang === "sw" ? f.sw : f.en, family === f.key, () =>
                setFamily(family === f.key ? null : f.key),
              ),
            )}
          </FlatListRow>
        </View>

        {/* Collections grid */}
        <SectionList
          sections={sections}
          keyExtractor={(item, idx) => (item[0]?.id ?? "row") + idx}
          renderItem={renderRow}
          renderSectionHeader={renderSectionHeader}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
          initialNumToRender={COLUMNS * 4}
          windowSize={5}
          removeClippedSubviews
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={{ padding: 40, alignItems: "center" }}>
              <Text style={{ color: c.textMuted, fontSize: 13, textAlign: "center" }}>
                {t("No design matches that.", "Hakuna muundo unaolingana.")}
              </Text>
            </View>
          }
        />
      </View>

      <PremiumSheet visible={premiumFor !== null} onClose={() => setPremiumFor(null)} feature="templates" />
    </Modal>
  );
}

/** A simple horizontal chip row (kept inline to avoid a second file). */
function FlatListRow({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>{children}</View>
  );
}
