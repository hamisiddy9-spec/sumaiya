import React, { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { Image, Modal, Pressable, ScrollView, SectionList, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { ALL_TEMPLATES, type CvTemplateId, type CvTemplateMeta } from "../../lib/cv-html";
import { useEntitlements } from "../../lib/entitlements";
import { loadProfile } from "../../lib/profile-store";
import { fieldLabel, suggestTemplates } from "../../lib/template-suggestions";
import { useLang } from "../../lib/i18n";
import {
  getCachedThumbUri,
  requestThumbRender,
  subscribeThumbReady,
  thumbCellHeight,
  warmThumbCacheFromDisk,
} from "../../lib/template-thumb-cache";
import { Icon } from "../icon";
import { PremiumSheet } from "../premium-sheet";
import { haptics, enterDurationMs, MOTION, TextField, useMotionReduced, useThemeColors } from "../ui";
import { RealTemplateThumb } from "./real-template-thumb";
import { TemplateThumb } from "./template-thumb";
import { TemplateThumbRenderer } from "./template-thumb-renderer";
import { track } from "../../lib/analytics";

/**
 * The TemplateHub gallery.
 *
 * The catalogue is organised as collections, not a flat grid:
 *
 *   1. Recommended for you  — AI-ranked designs for the user's field.
 *   2. TemplateHub Premium   — the paid collection (gated by entitlement).
 *   3. Curated Core          — simple, dependable, always-free designs.
 *
 * Search collapses this into a single flat "Results" section. A style filter
 * (Simple / Formal / Creative / Colourful) applies inside every section. The
 * grid is virtualised via SectionList and stays three-across by chunking each
 * section into rows.
 */

// User-facing style chips. These describe what a person can SEE in the design
// (plain / formal / bold / coloured) — never the render engine's internal
// layout name (`tpl.style`, unchanged below: sidebar | header | minimal |
// creative | classic). "Colourful" is the one chip that spans two engine
// layouts, since both read as "a coloured band" to someone looking at the
// design rather than its markup.
const STYLE_CHIPS: { key: string; en: string; sw: string; styles: string[] }[] = [
  { key: "simple", en: "Simple", sw: "Rahisi", styles: ["minimal"] },
  { key: "formal", en: "Formal", sw: "Rasmi", styles: ["classic"] },
  { key: "creative", en: "Creative", sw: "Ubunifu", styles: ["creative"] },
  { key: "colourful", en: "Colourful", sw: "Ya rangi", styles: ["sidebar", "header"] },
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
  // Reduced motion collapses every entrance to `dur.instant` (1ms) — never to
  // zero, and never by removing the transition. See MOTION-STANDARD §5.
  const reduce = useMotionReduced();
  const enterMs = enterDurationMs(reduce);

  const [query, setQuery] = useState("");
  // The input stays instant (MOTION-STANDARD §4 — a keystroke must produce its
  // glyph on the next frame) while the filter runs on the deferred value. Before
  // this, every keystroke re-filtered 218 designs and rebuilt the row chunks on
  // the JS thread of a low-end phone.
  const deferredQuery = useDeferredValue(query);
  const [family, setFamily] = useState<string | null>(null);
  const [premiumFor, setPremiumFor] = useState<string | null>(null);
  const [previewFor, setPreviewFor] = useState<CvTemplateMeta | null>(null);

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

  // Fired once per open, from any opener (dashboard teaser, first-run, the CV
  // preview card). Kept here — not in the callers — so a new entry point can't
  // forget to emit it.
  useEffect(() => {
    if (visible) track("template_viewed");
  }, [visible]);

  // Real thumbnails render lazily, one at a time, off-screen (see
  // template-thumb-cache.ts / template-thumb-renderer.tsx). `thumbTick` forces
  // a re-render of the currently mounted cells each time one finishes, so a
  // cell swaps from the schematic placeholder to the real design as soon as
  // it's ready, without waiting for the next scroll.
  const [thumbTick, setThumbTick] = useState(0);
  useEffect(() => {
    if (!visible) return;
    void warmThumbCacheFromDisk().then(() => setThumbTick((n) => n + 1));
    return subscribeThumbReady(() => setThumbTick((n) => n + 1));
  }, [visible]);

  const suggestion = useMemo(() => suggestTemplates(profileText, 6), [profileText]);

  const activeChip = useMemo(() => STYLE_CHIPS.find((f) => f.key === family) ?? null, [family]);

  const sections = useMemo<Section[]>(() => {
    const q = deferredQuery.trim().toLowerCase();
    const matches = (tpl: CvTemplateMeta) =>
      (!q ||
        tpl.id.includes(q) ||
        tpl.name.en.toLowerCase().includes(q) ||
        tpl.name.sw.toLowerCase().includes(q)) &&
      (!activeChip || (tpl.style ? activeChip.styles.includes(tpl.style) : false));

    // Search: one flat results section, no collection framing.
    if (q) {
      const data = ALL_TEMPLATES.filter(matches);
      return [{ key: "results", title: t("Results", "Matokeo"), data: chunk(data, COLUMNS) }];
    }

    const out: Section[] = [];

    // 1. AI recommendation. Surfaces even while a style filter is active, but
    //    never fights search (handled above).
    if (suggestion) {
      const recs = suggestion.templates.filter(
        (tpl) => !activeChip || (tpl.style ? activeChip.styles.includes(tpl.style) : false),
      );
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
  }, [deferredQuery, activeChip, suggestion, lang, t]);

  const cell = Math.floor((width - PAD * 2 - GAP * (COLUMNS - 1)) / COLUMNS);

  const pick = useCallback(
    (tpl: CvTemplateMeta) => {
      const locked = tpl.tier === "premium" && !premium;
      // Fired on every cell press — including a locked Premium tap — so the
      // funnel shows demand for designs before entitlement filters it.
      track("template_selected", { id: tpl.id, tier: tpl.tier });
      haptics.selection();
      if (locked) {
        setPremiumFor(tpl.id);
        return;
      }
      // Tap opens a full-screen preview, not a silent select — the user gets a
      // chance to see the design large before committing to it.
      setPreviewFor(tpl);
    },
    [premium],
  );

  const renderCell = useCallback(
    (item: CvTemplateMeta, idx: number) => {
      const locked = item.tier === "premium" && !premium;
      const active = item.id === selected;
      const thumbW = cell - 12;
      const thumbH = thumbCellHeight(thumbW);
      const cachedUri = getCachedThumbUri({ id: item.id, lang, width: thumbW, height: thumbH });
      // The real design once it's cached; the schematic placeholder — never a
      // WebView here — while the background renderer works through the queue.
      // Idempotent: the cache module drops a request that's already cached or
      // already queued, so calling this on every render is cheap.
      if (!cachedUri) requestThumbRender({ id: item.id, lang, width: thumbW, height: thumbH, accent: c.accent });
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
            {cachedUri ? (
              <Image
                source={{ uri: cachedUri }}
                style={{ width: thumbW, height: thumbH, borderRadius: 4, backgroundColor: "#fff" }}
                resizeMode="cover"
              />
            ) : (
              <TemplateThumb id={item.id} accent={c.accent} width={thumbW} />
            )}
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
    // thumbTick isn't read in the body — it's a pure re-render signal so a
    // cell swaps in its cached image as soon as the background render finishes.
    [cell, selected, premium, lang, pick, c, t, thumbTick],
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
    ({ section }: { section: Section }) => {
      // The recommendation section is DERIVED from the user's profile, which is
      // read asynchronously — so it used to materialise into the list a beat
      // after the user had already started reading (MOTION-STANDARD §1: nothing
      // appears, everything arrives). Only this header animates; the curated and
      // premium headers are present from the first frame and must stay still.
      const arriving = section.key === "recs";
      return (
        <Animated.View
          entering={arriving ? FadeInDown.duration(enterMs) : undefined}
          style={{ paddingHorizontal: PAD, paddingTop: 14, paddingBottom: 8 }}
        >
          <Text style={{ color: c.text, fontSize: 15.5, fontWeight: "800" }}>{section.title}</Text>
          {section.subtitle ? (
            <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 2, lineHeight: 16 }}>{section.subtitle}</Text>
          ) : null}
        </Animated.View>
      );
    },
    [c, enterMs],
  );

  const chip = (key: string, label: string, active: boolean, onPress: () => void) => (
    <Pressable
      key={key}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
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

  return (
    <Modal visible={visible} animationType={reduce ? "none" : "slide"} onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right }}>
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
              {t("Choose your CV design", "Chagua muundo wa CV yako")}
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

        {/* Style filter */}
        <View style={{ paddingHorizontal: PAD, marginTop: 10 }}>
          <FlatListRow>
            {STYLE_CHIPS.map((f) =>
              chip(f.key, lang === "sw" ? f.sw : f.en, family === f.key, () =>
                setFamily(family === f.key ? null : f.key),
              ),
            )}
          </FlatListRow>
        </View>

        {/* Collections grid. Each cell shows a cached real render once one
            exists (see template-thumb-cache.ts), and the pure-RN schematic
            thumbnail (template-thumb.tsx) until then — a real WebView per
            VISIBLE cell stuttered scrolling on low-end Android, which is why
            rendering happens off-screen, one template at a time, in
            <TemplateThumbRenderer/> below. Mount two rows, then grow the
            window as the user scrolls instead of all at once. */}
        <SectionList
          sections={sections}
          keyExtractor={(item, idx) => (item[0]?.id ?? "row") + idx}
          renderItem={renderRow}
          renderSectionHeader={renderSectionHeader}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
          initialNumToRender={COLUMNS * 2}
          maxToRenderPerBatch={COLUMNS}
          updateCellsBatchingPeriod={50}
          windowSize={4}
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

        {/* Off-screen, one-at-a-time real-render cache warmer for the grid
            above — see the SectionList comment and template-thumb-cache.ts. */}
        <TemplateThumbRenderer />
      </View>

      {/* Full-screen preview — tap a thumbnail to see the design large, then
          commit with "Use this design" (or dismiss). */}
      {previewFor ? (
        <Animated.View
          entering={FadeIn.duration(MOTION.dur.base)}
          style={{ position: "absolute", inset: 0, backgroundColor: c.bg, zIndex: 20, paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: PAD, paddingVertical: 12 }}>
            <View style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
              <Text style={{ color: c.text, fontSize: 18, fontWeight: "800" }} numberOfLines={1}>
                {lang === "sw" ? previewFor.name.sw : previewFor.name.en}
              </Text>
              <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 2 }}>
                {STYLE_CHIPS.find((f) => previewFor.style && f.styles.includes(previewFor.style))?.[
                  lang === "sw" ? "sw" : "en"
                ] ?? ""}{" "}
                · {previewFor.tier === "premium" ? t("Premium", "Premium") : t("Free", "Bure")}
              </Text>
            </View>
            <Pressable onPress={() => setPreviewFor(null)} hitSlop={12} accessibilityRole="button" accessibilityLabel={t("Close", "Funga")}>
              <Icon name="x" size={22} color={c.text} />
            </Pressable>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ alignItems: "center", paddingHorizontal: PAD, paddingVertical: 8 }}>
            <RealTemplateThumb id={previewFor.id} accent={c.accent} lang={lang} width={width - PAD * 2} />
          </ScrollView>

          <Animated.View
            entering={FadeInDown.duration(enterMs)}
            style={{ paddingHorizontal: PAD, paddingBottom: insets.bottom + 12, paddingTop: 4 }}
          >
            <Pressable
              onPress={() => {
                haptics.selection();
                onSelect(previewFor.id);
                onClose();
              }}
              style={{ backgroundColor: c.accent, borderRadius: 14, paddingVertical: 15, alignItems: "center" }}
              accessibilityRole="button"
              accessibilityLabel={t("Use this design", "Tumia muundo huu")}
            >
              <Text style={{ color: c.accentText, fontSize: 16, fontWeight: "800" }}>
                {t("Use this design", "Tumia muundo huu")}
              </Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      ) : null}

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
