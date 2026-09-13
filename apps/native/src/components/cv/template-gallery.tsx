import React, { useCallback, useMemo, useState } from "react";
import { FlatList, Modal, Pressable, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn } from "react-native-reanimated";
import { ALL_TEMPLATES, type CvTemplateId, type CvTemplateMeta } from "../../lib/cv-html";
import { useEntitlements } from "../../lib/entitlements";
import { useLang } from "../../lib/i18n";
import { Icon } from "../icon";
import { PremiumSheet } from "../premium-sheet";
import { haptics, TextField, useThemeColors } from "../ui";
import { TemplateThumb } from "./template-thumb";

/**
 * The full template gallery.
 *
 * This exists because the app now carries 224 templates (the original six plus
 * the mirrored web registry) and a horizontal `ScrollView` with `.map()` would
 * mount every one of them at once. Here a virtualised FlatList only builds the
 * cells on screen, and search + filters make 224 navigable without scrolling
 * through 224 rows.
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
  const [tier, setTier] = useState<"all" | "free" | "premium">("all");
  const [family, setFamily] = useState<string | null>(null);
  const [premiumFor, setPremiumFor] = useState<string | null>(null);

  const cell = Math.floor((width - PAD * 2 - GAP * (COLUMNS - 1)) / COLUMNS);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ALL_TEMPLATES.filter((tpl) => {
      if (tier !== "all" && tpl.tier !== tier) return false;
      if (family && tpl.style !== family) return false;
      if (!q) return true;
      return (
        tpl.id.includes(q) ||
        tpl.name.en.toLowerCase().includes(q) ||
        tpl.name.sw.toLowerCase().includes(q)
      );
    });
  }, [query, tier, family]);

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

  const renderItem = useCallback(
    ({ item }: { item: CvTemplateMeta }) => {
      const locked = item.tier === "premium" && !premium;
      const active = item.id === selected;
      return (
        <Pressable
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
            <TemplateThumb id={item.id} accent={c.accent} width={cell - 12} />
          </View>
          <Text
            numberOfLines={1}
            style={{
              color: active ? c.accent : c.text,
              fontSize: 11.5,
              fontWeight: "700",
              maxWidth: cell,
            }}
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

  const chip = (
    key: string,
    label: string,
    active: boolean,
    onPress: () => void,
  ) => (
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
      <Text
        style={{ color: active ? c.accent : c.textMuted, fontSize: 12, fontWeight: "700" }}
      >
        {label}
      </Text>
    </Pressable>
  );

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
              {t("Choose a design", "Chagua muundo")}
            </Text>
            <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 2 }}>
              {t(
                `${results.length} of ${ALL_TEMPLATES.length} designs`,
                `${results.length} kati ya ${ALL_TEMPLATES.length} miundo`,
              )}
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

        {/* Filters */}
        <View style={{ paddingHorizontal: PAD, gap: 8, marginTop: 10 }}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {chip("all", t("All", "Zote"), tier === "all", () => setTier("all"))}
            {chip("free", t("Free", "Bure"), tier === "free", () => setTier("free"))}
            {chip("prem", "Premium", tier === "premium", () => setTier("premium"))}
          </View>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={FAMILIES}
            keyExtractor={(f) => f.key}
            contentContainerStyle={{ gap: 8 }}
            renderItem={({ item: f }) =>
              chip(f.key, lang === "sw" ? f.sw : f.en, family === f.key, () =>
                setFamily(family === f.key ? null : f.key),
              )
            }
          />
        </View>

        {/* Grid */}
        <FlatList
          data={results}
          keyExtractor={(tpl) => tpl.id}
          renderItem={renderItem}
          numColumns={COLUMNS}
          columnWrapperStyle={{ gap: GAP, paddingHorizontal: PAD }}
          contentContainerStyle={{ gap: GAP + 6, paddingVertical: 16, paddingBottom: insets.bottom + 28 }}
          initialNumToRender={COLUMNS * 4}
          maxToRenderPerBatch={COLUMNS * 4}
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

      <PremiumSheet
        visible={premiumFor !== null}
        onClose={() => setPremiumFor(null)}
        feature="templates"
      />
    </Modal>
  );
}
