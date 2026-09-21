import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, BackHandler, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { apiClient } from "../../lib/api-client";
import { jobChoiceModel, jobToJd, isUsableJd, type JobPickRow } from "@sumaiya/api-client";
import { Icon } from "../icon";
import { Button, haptics, useThemeColors } from "../ui";
import { useLang } from "../../lib/i18n";

/**
 * "Lenga kwenye kazi" must not assume which job.
 *
 * The owner's words: *"also the lenga kwenye kazi in chat box iwe na option ya
 * kuchagua kazi ya user yani atoe source au achague zetu"*. Two paths from this
 * one sheet:
 *
 *   1. **Chagua kutoka kwenye kazi zetu** — the live feed, searchable. The list
 *      is projected server-side (`?light=1`) so opening it costs a couple of KB
 *      instead of the ~350 KB full feed, and the one advert the user actually
 *      picks is fetched afterwards by id. A listing with no advert text says so
 *      rather than handing the engine a title and calling it a job.
 *   2. **Weka kazi yako mwenyewe** — the existing snap screen, where pasting the
 *      advert already works (and the [+] menu already offers a job link).
 *
 * COST: opening this sheet issues **no request**. Only the first path fetches,
 * and only when it is opened; typing is debounced (350 ms).
 *
 * House pattern, same as AttachSheet: a plain absolute overlay rendered at the
 * chat screen's root — NOT a <Modal>, whose content window drops flex props on
 * the New Architecture.
 */

const SEARCH_DEBOUNCE_MS = 350;

type Phase = "idle" | "loading" | "ready" | "empty" | "error";

/**
 * One path card. Module-level (not defined inside the sheet) so React keeps the
 * same component identity between renders — an inner component is a new type on
 * every render, which remounts its subtree and drops state.
 */
function PathCard({
  icon,
  title,
  hint,
  active,
  primary,
  onPress,
}: {
  icon: string;
  title: string;
  hint: string;
  active?: boolean;
  /** The leading path (our listings): filled, so it reads as the default. */
  primary?: boolean;
  onPress: () => void;
}) {
  const c = useThemeColors();
  const fg = primary ? c.accentText : c.text;
  const sub = primary ? c.accentText : c.textMuted;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${hint}`}
      accessibilityState={{ selected: !!active }}
      style={{
        borderWidth: 1.5,
        borderColor: c.accent,
        backgroundColor: primary ? c.accentFill : active ? c.accent + "12" : c.bgElevated,
        borderRadius: 14,
        padding: 12,
        marginBottom: 8,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: primary ? "rgba(255,255,255,0.22)" : c.accent + "1f", alignItems: "center", justifyContent: "center" }}>
          <Icon name={icon} size={19} color={primary ? c.accentText : c.accent} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ color: fg, fontSize: 15, fontWeight: "700" }}>{title}</Text>
          <Text style={{ color: sub, fontSize: 12.5, marginTop: 2, opacity: primary ? 0.9 : 1 }}>{hint}</Text>
        </View>
        {active ? <Icon name="check" size={18} color={fg} /> : null}
      </View>
    </Pressable>
  );
}

export function JobChoiceSheet({
  visible,
  onClose,
  onPickOurJob,
  onOwnSource,
}: {
  visible: boolean;
  onClose: () => void;
  /** A REAL listing was chosen — the advert text, exactly as the feed has it. */
  onPickOurJob: (jd: string, label: string) => void;
  /** The user will bring their own job (paste the advert, or its link). */
  onOwnSource: () => void;
}) {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const { t } = useLang();
  const model = jobChoiceModel();

  const [path, setPath] = useState<"ours" | "own" | null>(null);

  // The Android hardware back button. This sheet is NOT a <Modal> (see the note at the
  // top of the file), so nothing dismissed it on back: the press fell through to the
  // navigator and changed screen with the sheet still standing. The two sheets that ARE
  // Modals pass `onRequestClose` and close correctly — this is that same behaviour.
  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onClose();
      return true; // handled — do not also navigate
    });
    return () => sub.remove();
  }, [visible, onClose]);
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<JobPickRow[] | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const seqRef = useRef(0);
  const firstLoadRef = useRef(false);

  // A fresh sheet must never show the previous session's results.
  useEffect(() => {
    if (!visible) return;
    setPath(null);
    setQ("");
    setRows(null);
    setPhase("idle");
    setNotice("");
    setBusyId(null);
    firstLoadRef.current = false;
  }, [visible]);

  const load = useCallback(async (query: string) => {
    const seq = ++seqRef.current;
    setPhase("loading");
    setNotice("");
    try {
      const list = await apiClient.getJobs({ light: true, limit: 12, q: query });
      if (seq !== seqRef.current) return; // a newer search won — drop this answer
      const clean: JobPickRow[] = (Array.isArray(list) ? list : []).flatMap((j) => {
        const id = String(j?.id ?? "").trim();
        const title = String(j?.title ?? "").trim();
        if (!id || !title) return [];
        return [{ id, title, company: String(j?.company ?? ""), location: String(j?.location ?? "") }];
      });
      setRows(clean);
      setPhase(clean.length ? "ready" : "empty");
    } catch {
      if (seq !== seqRef.current) return;
      setRows(null);
      setPhase("error");
    }
  }, []);

  useEffect(() => {
    if (!visible || path !== "ours") return;
    // The first look at "our listings" fetches at once; typing then debounces.
    const delay = firstLoadRef.current ? SEARCH_DEBOUNCE_MS : 0;
    firstLoadRef.current = true;
    const id = setTimeout(() => { void load(q); }, delay);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, path, q]);

  if (!visible) return null;

  const choose = async (row: JobPickRow) => {
    if (busyId) return;
    haptics.selection();
    setBusyId(row.id);
    setNotice("");
    try {
      const found = await apiClient.getJobs({ id: row.id });
      const detail = Array.isArray(found) ? found[0] : undefined;
      const jd = jobToJd({ title: detail?.title ?? row.title, company: detail?.company ?? row.company, description: detail?.description ?? "" });
      if (!isUsableJd(jd)) {
        // The listing exists but carries no advert. Say so — never run the
        // engine on a title, and never invent the missing text.
        setNotice(t("This listing has no advert text. Paste the text yourself.", "Tangazo hili halina maandishi ya kutosha. Bandika maandishi yenyewe."));
        return;
      }
      onPickOurJob(jd, [row.title, row.company].filter(Boolean).join(" · "));
    } catch {
      setNotice(t("Couldn't load the advert. Try again.", "Imeshindwa kupakia tangazo. Jaribu tena."));
    } finally {
      setBusyId(null);
    }
  };

  const oursFirst = model.paths[0] === "ours";

  return (
    <View style={[StyleSheet.absoluteFill, { justifyContent: "flex-end", zIndex: 1000, elevation: 1000 }]}>
      <Pressable
        style={[StyleSheet.absoluteFill, { backgroundColor: c.overlay }]}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel={t("Close", "Funga")}
      />

      <View
        style={{
          backgroundColor: c.bgElevated,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingTop: 8,
          paddingBottom: insets.bottom + 16,
          paddingHorizontal: 12,
          borderTopWidth: 1,
          borderColor: c.border,
          maxHeight: "85%",
        }}
      >
        <View style={{ alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: c.border, marginBottom: 14 }} />
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginHorizontal: 8, marginBottom: 4 }}>
          <Text style={{ color: c.text, fontSize: 15, fontWeight: "700" }}>
            {t("Which job do you want to aim at?", "Unataka kulenga kazi ipi?")}
          </Text>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel={t("Close", "Funga")} hitSlop={10}>
            <Icon name="x" size={18} color={c.textMuted} />
          </Pressable>
        </View>
        {/* The approved design's line: our listings lead, your own is one tap away. */}
        <Text style={{ color: c.textBody, fontSize: 12.5, marginHorizontal: 8, marginBottom: 10, lineHeight: 18 }}>
          {t(
            "Sure. Which job do you want to aim at — choose from our listings, or use your own?",
            "Sawa. Unataka kulenga kazi ipi — chagua kwenye kazi zetu, au weka yako mwenyewe?",
          )}
        </Text>

        <ScrollView bounces={false} keyboardShouldPersistTaps="handled">
          {oursFirst ? (
            <PathCard
              icon="briefcase"
              title={t("Choose one of our listings", "Chagua kutoka kwenye kazi zetu")}
              hint={t("Real openings we have right now.", "Nafasi za kazi zilizopo sasa.")}
              active={path === "ours"}
              primary
              onPress={() => { haptics.selection(); setPath(path === "ours" ? null : "ours"); setNotice(""); }}
            />
          ) : null}

          <PathCard
            icon="link"
            title={t("Use your own job", "Weka kazi yako mwenyewe")}
            hint={t("Paste the advert, or its link.", "Bandika tangazo, au kiungo chake.")}
            active={path === "own"}
            onPress={() => { haptics.selection(); setPath("own"); onOwnSource(); }}
          />

          {path === "ours" ? (
            <View style={{ marginTop: 4 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  borderWidth: 1,
                  borderColor: c.border,
                  borderRadius: 12,
                  paddingHorizontal: 10,
                  backgroundColor: c.bg,
                }}
              >
                <Icon name="search" size={15} color={c.textMuted} />
                <TextInput
                  value={q}
                  onChangeText={setQ}
                  placeholder={t("Search — role, company or place", "Tafuta — cheo, kampuni au mahali")}
                  placeholderTextColor={c.textMuted}
                  autoCapitalize="none"
                  style={{ flex: 1, color: c.text, fontSize: 14, paddingVertical: 10 }}
                />
              </View>

              {phase === "loading" ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 12, paddingHorizontal: 4 }}>
                  <ActivityIndicator color={c.accent} />
                  <Text style={{ color: c.textMuted, fontSize: 13 }}>{t("Searching…", "Ninatafuta…")}</Text>
                </View>
              ) : null}

              {phase === "error" ? (
                <View style={{ paddingTop: 10 }}>
                  <Text style={{ color: c.textBody, fontSize: 13, marginBottom: 8 }}>
                    {t("Couldn't load the jobs. Check your connection and try again.", "Imeshindwa kupakia kazi. Angalia mtandao wako kisha ujaribu tena.")}
                  </Text>
                  <Button label={t("Try again", "Jaribu tena")} variant="secondary" size="sm" onPress={() => void load(q)} />
                </View>
              ) : null}

              {phase === "empty" ? (
                <View style={{ paddingTop: 10 }}>
                  <Text style={{ color: c.textBody, fontSize: 13, marginBottom: 10 }}>
                    {rows === null || q.trim()
                      ? t(
                          `Nothing matches “${q.trim()}”. Try another word, or use your own job.`,
                          `Hakuna kazi inayolingana na “${q.trim()}”. Jaribu neno lingine, au weka kazi yako mwenyewe.`,
                        )
                      : t("No openings are listed right now. Use your own job.", "Hakuna nafasi za kazi zilizoorodheshwa sasa. Weka kazi yako mwenyewe.")}
                  </Text>
                  {/* The escape hatch, not just the words for it: a search that
                      finds nothing must never dead-end. */}
                  <Button
                    label={t("Use your own job", "Weka kazi yako mwenyewe")}
                    variant="secondary"
                    size="sm"
                    onPress={() => { haptics.selection(); setPath("own"); onOwnSource(); }}
                  />
                </View>
              ) : null}

              {phase === "ready"
                ? rows?.map((row) => (
                    <Pressable
                      key={row.id}
                      disabled={busyId !== null}
                      onPress={() => void choose(row)}
                      accessibilityRole="button"
                      accessibilityLabel={`${row.title}. ${[row.company, row.location].filter(Boolean).join(", ")}`}
                      style={{ paddingVertical: 11, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: c.border, opacity: busyId ? 0.5 : 1 }}
                    >
                      <Text style={{ color: c.text, fontSize: 14.5, fontWeight: "600" }} numberOfLines={2}>
                        {row.title}
                      </Text>
                      <Text style={{ color: c.textMuted, fontSize: 12.5, marginTop: 2 }} numberOfLines={1}>
                        {[row.company, row.location].filter(Boolean).join(" · ")}
                      </Text>
                    </Pressable>
                  ))
                : null}

              {notice ? <Text style={{ color: c.warning, fontSize: 12.5, marginTop: 8 }}>{notice}</Text> : null}
            </View>
          ) : null}
        </ScrollView>
      </View>
    </View>
  );
}
