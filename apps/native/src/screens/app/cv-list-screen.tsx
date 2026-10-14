import React, { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View, type DimensionValue } from "react-native";
import type { CV } from "@sumaiya/types";
import { useCvs } from "../../hooks/use-cvs";
import { useApplications } from "../../hooks/use-applications";
import { useAuthContext } from "../../contexts/auth-context";
import { openAuth } from "../../navigation/root-nav";
import { GUEST_KEEP_CARD, guestText } from "../../lib/guest-invite";
import { offerGuestAccountOnce } from "../../components/account-gate";
import { cvErrorCopy } from "../../lib/cv-fetch-error";
import {
  Button,
  Card,
  EmptyState,
  Screen,
  ScreenTitle,
  SkeletonList,
  Stagger,
  TextField,
  haptics,
  useThemeColors,
} from "../../components/ui";
import { Icon } from "../../components/icon";
import { TemplateGallery } from "../../components/cv/template-gallery";
import { cvMetaLine, cvStatusLabel, cvStatusOf, type CvStatus } from "../../components/home/home-labels";
import { ALL_TEMPLATES } from "../../lib/cv-html";
import { letterIsEmpty } from "../../lib/letter-html";
import { APPLICATION_STATUS_LABEL } from "../applications-labels";
import { useLang } from "../../lib/i18n";
import { relativeDate } from "../../lib/relative-date";
import { dialog } from "../../components/ui";
import { exportCVAsPDF } from "../../services/pdf-export";
import { fileNameFromUri, saveToPhone, shouldOfferShare } from "../../services/save-to-device";
import type { CvTemplateId } from "../../lib/cv-html";
import { shareCV } from "../../services/share";
import type { CvListScreenProps } from "../../navigation/types";
import type { ThemeColors } from "../../components/ui/theme";

/**
 * Screen 5 — `CV zako` / Documents & templates (design:
 * `cv_zako_nyaraka_na_miundo`).
 *
 * The design is a document LIBRARY: a sub-header with search and sort, a
 * document-type filter row, a template-gallery entry card, a `CV za hivi
 * karibuni` section of thumbnail rows with a state chip and an overflow, and a
 * sticky `Jenga CV mpya`. What shipped instead was a stack of three-button
 * cards whose only route into the gallery was Home / first-run / the preview
 * card — this screen had none.
 *
 * TWO THINGS THE DESIGN ASSUMES THAT THE DATA DOES NOT HAVE, resolved honestly
 * rather than mocked up:
 *
 *   1. Stitch prints `Miundo 47`. The app offers every design it can actually
 *      render, so the number is read from `ALL_TEMPLATES.length` at runtime —
 *      never typed. (At this revision: 218 registry entries that carry a
 *      renderer + the six hand-written ids in `lib/cv-html.ts` = 224.)
 *   2. Stitch's chip row filters by document TYPE (CV / cover letter / card /
 *      formal letter). The store holds two of those four: a CV
 *      (`@sumaiya/types` `CV` — no kind field) and a cover letter (the
 *      `coverLetter` text on a saved application). `Kadi` and `Barua rasmi`
 *      would be chips that can never hold a document, so they are NOT rendered
 *      — a filter that always returns nothing is a promise the app cannot keep.
 *      The row shows the three types the app really has.
 */

type DocKind = "cv" | "letter" | "app";

interface Doc {
  key: string;
  kind: DocKind;
  id: string;
  title: string;
  meta: string;
  status: CvStatus;
  statusLabel: string;
  /** This device holds the only copy (CV only). */
  offline?: boolean;
  at: number;
}

/**
 * The document-type chips. `Swahili leads` — the first label a Swahili reader
 * sees is `Zote`, and the type names are the product's own words.
 */
const FILTERS: { key: DocKind | "all"; en: string; sw: string }[] = [
  { key: "all", en: "All", sw: "Zote" },
  { key: "cv", en: "CV", sw: "CV" },
  { key: "letter", en: "Cover letter", sw: "Barua ya maombi" },
  // The applications themselves, including the ones with no cover letter yet —
  // the shape the advert's Save button produces. Without this they were written
  // to the store and rendered nowhere, because a document only existed here if
  // it was a CV or an application that already carried a letter.
  { key: "app", en: "Applications", sw: "Maombi" },
];

const THUMB_W = 56;
const THUMB_H = 72;

/**
 * The row's 56 × 72 document thumbnail, drawn from theme tokens only.
 *
 * It is a schematic — the SHAPE of a page, never invented content — and it is
 * warm: `bgSunken` (#EFEEEA) with a hairline, no `#ffffff` anywhere. The
 * gallery's own grid cell used to paint pure white behind the real render
 * (`template-gallery.tsx`, §1 violation), which is exactly the hole in a warm
 * palette the guide forbids.
 */
function DocThumb({ kind, c }: { kind: DocKind; c: ThemeColors }) {
  const line = (w: DimensionValue, mt = 3, col = c.border) => (
    <View style={{ width: w, height: 2, borderRadius: 1, backgroundColor: col, marginTop: mt }} />
  );
  return (
    <View
      style={{
        width: THUMB_W,
        height: THUMB_H,
        borderRadius: 8,
        backgroundColor: c.bgSunken,
        borderWidth: 1,
        borderColor: c.border,
        padding: 6,
        overflow: "hidden",
      }}
    >
      {kind === "cv" ? (
        <>
          <View style={{ width: "70%", height: 3, borderRadius: 1.5, backgroundColor: c.accent }} />
          {line("100%")}
          {line("80%")}
          {line("60%")}
        </>
      ) : (
        /* A letter: the date block sits right, the signature block left. */
        <>
          <View style={{ alignSelf: "flex-end", width: "33%", height: 2, borderRadius: 1, backgroundColor: c.border }} />
          {line("100%", 6)}
          {line("100%")}
          {line("75%")}
          <View style={{ width: "33%", height: 3, borderRadius: 1.5, backgroundColor: c.accent, marginTop: 6 }} />
        </>
      )}
    </View>
  );
}

/** One row: thumbnail, title, meta line, state chip, `more_vert` overflow. */
function DocRow({
  doc,
  c,
  t,
  busy,
  onOpen,
  onMenu,
}: {
  doc: Doc;
  c: ThemeColors;
  t: (en: string, sw: string) => string;
  busy: boolean;
  onOpen: () => void;
  onMenu: () => void;
}) {
  // The chip's colour comes from the derived state, not from a stored flag —
  // see `cvStatusOf` (components/home/home-labels.ts), which is the one place
  // that decides what Rasimu / Tayari / Imekamilika mean.
  const chip = doc.status === "draft" ? { bg: c.bgSunken, fg: c.textMuted } : { bg: c.successTint, fg: c.success };
  return (
    <Card
      padded={false}
      style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 12, backgroundColor: c.bgElevated }}
    >
      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={`${doc.title}. ${doc.meta}. ${doc.statusLabel}`}
        style={{ flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 12, minHeight: 44 }}
      >
        <DocThumb kind={doc.kind} c={c} />
        <View style={{ flex: 1, minWidth: 0 }}>
          {/* Not clamped to one line: §8 holds the layout at 200 % text scale,
              and a clamped line is what breaks there. */}
          <Text style={{ color: c.text, fontSize: 15, fontWeight: "700", lineHeight: 20 }} numberOfLines={2}>
            {doc.title}
          </Text>
          <Text style={{ color: c.textMuted, fontSize: 12, lineHeight: 17, marginTop: 2 }} numberOfLines={1}>
            {busy ? t("Working…", "Inaendelea…") : doc.meta}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                backgroundColor: chip.bg,
                borderRadius: 999,
                paddingHorizontal: 9,
                paddingVertical: 3,
              }}
            >
              {doc.status === "complete" ? <Icon name="check" size={10} color={chip.fg} /> : null}
              <Text style={{ color: chip.fg, fontSize: 11, fontWeight: "700" }}>{doc.statusLabel}</Text>
            </View>
            {doc.offline ? (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  backgroundColor: c.warning + "1f",
                  borderRadius: 999,
                  paddingHorizontal: 9,
                  paddingVertical: 3,
                }}
              >
                <Icon name="wifi-off" size={11} color={c.warning} />
                <Text style={{ color: c.warning, fontSize: 11, fontWeight: "700" }}>
                  {t("On this phone", "Kwenye simu hii")}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </Pressable>

      {/* §8: 44 dp, not the design's 36. */}
      <Pressable
        onPress={onMenu}
        accessibilityRole="button"
        accessibilityLabel={t(`More options for ${doc.title}`, `Chaguo zaidi za ${doc.title}`)}
        style={{ width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" }}
      >
        <Icon name="more-vertical" size={20} color={c.textMuted} />
      </Pressable>
    </Card>
  );
}

export function CvListScreen({ navigation }: CvListScreenProps) {
  const c = useThemeColors();
  const { t, lang } = useLang();
  const { cvs, loading, error, errorKind, storageBlocked, deleteCV, loadCVs } = useCvs();
  // Cover letters live on the application that produced them (lib/
  // applications-store.ts). They are documents like any other, so the library
  // shows them — that is what makes `Barua ya maombi` a real filter rather
  // than a chip over an empty set.
  const { applications, loading: appsLoading, refresh: refreshApplications, remove: removeApplication } = useApplications();
  const { user, signOut } = useAuthContext();
  // GUEST MODE: this list is the device's own CVs, and everything on this screen
  // — build, edit, preview, download, delete — works with no account and no
  // network. The account only ever appears here as an offer, after there is
  // something worth keeping.
  const isGuest = !user;
  // Same truth as Home: the reason decides the message AND the action.
  const cvError = cvErrorCopy(errorKind ?? "unknown");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<DocKind | "all">("all");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [sort, setSort] = useState<"recent" | "name">("recent");
  const [galleryOpen, setGalleryOpen] = useState(false);

  // Export used to live only inside the editor and the preview card — a CV
  // the user just wants to grab a copy of, without editing it, had no path
  // to a download button at all. Reuses the exact same export call the
  // editor's own "Export PDF" button makes.
  //
  // What "Pakua" DOES changed on 2026-09-21, after the device sweep: the label
  // said download and the button opened the Android share sheet instead
  // ("Sharing 1 file"), leaving /sdcard/Download byte-identical before and
  // after — nothing was saved anywhere the user could find it. For this
  // audience the flow is save the file, then attach it in WhatsApp, so the
  // button now saves for real (the user picks the folder; see
  // services/save-to-device.ts) and then offers to share it in one tap. The
  // share sheet is still one tap away — it is just no longer mistaken for a
  // download.
  const downloadCV = async (cv: CV) => {
    setDownloading(cv.id);
    haptics.light();
    try {
      // cvToHtml validates the template id itself and falls back to "classic"
      // for anything unrecognised, so this cast is safe even for a stray
      // stored id from an older template set.
      const uri = await exportCVAsPDF(cv, { lang, template: cv.templateId as CvTemplateId });
      const saved = await saveToPhone(uri, fileNameFromUri(uri));
      // Anything short of a real save must still say something — a dismissed
      // folder picker used to return here in total silence: no file, no
      // message, no share sheet (measured on 1.6.28). shouldOfferShare() is
      // the single tested place that decides "not saved", so this screen and
      // the editor's own download button can't drift apart on it.
      if (shouldOfferShare(saved)) {
        if (saved.status === "unsupported") {
          haptics.success();
          // No SAF here — the system share sheet is this platform's own way to
          // save a file, so it is still the honest action to take.
          await shareCV(cv, uri);
          // The file has left the app: a deliverable, so the one offer stands.
          void offerGuestAccountOnce({ isGuest });
          return;
        }
        // "cancelled": the user dismissed the folder picker. Nothing failed,
        // but nothing was written either — say so and offer the share sheet
        // as the alternative save path, instead of returning in silence.
        dialog.alert(
          t("Not saved", "Haikuhifadhiwa"),
          t(
            "You didn't choose a folder, so nothing was saved. You can still share it directly.",
            "Hukuchagua folda, kwa hivyo hakuna kilichohifadhiwa. Bado unaweza kuisambaza moja kwa moja.",
          ),
          [
            { text: t("Share now", "Sambaza sasa"), onPress: () => void shareCV(cv, uri) },
            { text: t("Done", "Sawa"), style: "cancel" },
          ],
        );
        return;
      }
      haptics.success();
      dialog.alert(
        t("Saved to your phone", "Imehifadhiwa kwenye simu yako"),
        t(
          `${saved.fileName} is in the folder you chose. Open Files to attach it in WhatsApp.`,
          `${saved.fileName} iko kwenye folda uliyochagua. Fungua Files ili kuipachika WhatsApp.`,
        ),
        [
          { text: t("Share now", "Sambaza sasa"), onPress: () => void shareCV(cv, uri) },
          { text: t("Done", "Sawa"), style: "cancel" },
        ],
      );
      // THE DOWNLOAD MOMENT — the guest has a real PDF in their hand. This is
      // the one place the account is offered (dialog layer queues it behind the
      // confirmation above, so it appears once that is dismissed), it says what
      // the account EARNS, and it happens at most once ever.
      void offerGuestAccountOnce({ isGuest });
    } catch {
      haptics.error();
      dialog.alert(t("Export failed", "Kupakua kumeshindwa"), t("Try again in a moment.", "Jaribu tena baada ya muda."));
    } finally {
      setDownloading(null);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    haptics.light();
    try {
      await loadCVs?.();
      await refreshApplications();
    } finally {
      setRefreshing(false);
    }
  }, [loadCVs, refreshApplications]);

  const confirmDelete = (id: string, title: string) => {
    haptics.warning();
    dialog.alert(t("Delete this CV?", "Ufute CV hii?"), t(`"${title}" will be permanently removed.`, `"${title}" itafutwa kabisa.`), [
      { text: t("Cancel", "Ghairi"), style: "cancel" },
      {
        text: t("Delete", "Futa"),
        style: "destructive",
        onPress: async () => {
          setDeleting(id);
          try {
            await deleteCV(id);
            haptics.success();
          } catch {
            haptics.error();
            dialog.alert(t("Couldn't delete", "Imeshindwa kufuta"), t("Something went wrong. Try again.", "Kuna hitilafu. Jaribu tena."));
          } finally {
            setDeleting(null);
          }
        },
      },
    ]);
  };

  /**
   * Deleting a saved application that has no letter yet. A separate dialog from
   * the letter one on purpose: that copy promises the letter goes with the
   * application, which would be a strange thing to say about an application that
   * never had one.
   */
  const confirmDeleteApp = (id: string, title: string) => {
    haptics.warning();
    dialog.alert(
      t("Delete this application?", "Ufute ombi hili?"),
      t(
        `"${title}" and everything saved with it is removed from this phone.`,
        `"${title}" pamoja na kila kilichohifadhiwa nacho vinaondolewa kwenye simu hii.`,
      ),
      [
        { text: t("Cancel", "Ghairi"), style: "cancel" },
        {
          text: t("Delete", "Futa"),
          style: "destructive",
          onPress: async () => {
            setDeleting(id);
            try {
              await removeApplication(id);
              haptics.success();
            } catch {
              haptics.error();
              dialog.alert(
                t("Couldn't delete", "Imeshindwa kufuta"),
                t("The application is still on this phone. Try again.", "Ombi bado liko kwenye simu hii. Jaribu tena."),
              );
            } finally {
              setDeleting(null);
            }
          },
        },
      ],
    );
  };

  const confirmDeleteLetter = (id: string, title: string) => {
    haptics.warning();
    dialog.alert(
      t("Delete this letter?", "Ufute barua hii?"),
      t(
        `The cover letter on "${title}" is deleted with the application it belongs to.`,
        `Barua ya maombi ya "${title}" inafutwa pamoja na ombi linaloihusu.`,
      ),
      [
        { text: t("Cancel", "Ghairi"), style: "cancel" },
        {
          text: t("Delete", "Futa"),
          style: "destructive",
          onPress: async () => {
            setDeleting(id);
            try {
              await removeApplication(id);
              haptics.success();
            } catch {
              haptics.error();
              dialog.alert(
                t("Couldn't delete", "Imeshindwa kufuta"),
                t("The letter is still on this phone. Try again.", "Barua bado iko kwenye simu hii. Jaribu tena."),
              );
            } finally {
              setDeleting(null);
            }
          },
        },
      ],
    );
  };

  // Every layer of the library: the CVs the device holds, plus the cover
  // letters it holds. `letterIsEmpty` is the app's own guard (lib/letter-html.ts)
  // for "this is not a letter yet" — the same test the PDF export refuses on —
  // so a half-written draft never shows up as a finished document.
  const letters = useMemo(() => applications.filter((a) => !letterIsEmpty(a.coverLetter)), [applications]);

  const docs = useMemo<Doc[]>(() => {
    const cvDocs = cvs.map<Doc>((cv) => {
      const status = cvStatusOf(cv);
      return {
        key: `cv:${cv.id}`,
        kind: "cv",
        id: cv.id,
        title: cv.title,
        meta: cvMetaLine(cv.updatedAt, lang),
        status,
        statusLabel: cvStatusLabel(status, lang),
        offline: !!cv.isOfflineOnly,
        at: new Date(cv.updatedAt).getTime(),
      };
    });
    // A saved cover letter is written and usable — the app's own `ready` state.
    const letterDocs = letters.map<Doc>((a) => ({
      key: `letter:${a.id}`,
      kind: "letter",
      id: a.id,
      title: `${t("Cover letter", "Barua ya maombi")} — ${a.company}`,
      meta: `${a.role} · ${relativeDate(new Date(a.updatedAt), lang)}`,
      status: "ready",
      statusLabel: cvStatusLabel("ready", lang),
      at: a.updatedAt,
    }));
    // Applications that have no cover letter yet — a job saved from an advert.
    // These were the invisible ones: the write succeeded and the library showed
    // nothing, because `letters` above keeps only the applications whose letter
    // is non-empty and there was no other way to be a document here.
    const appDocs = applications
      .filter((a) => letterIsEmpty(a.coverLetter))
      .map<Doc>((a) => ({
        key: `app:${a.id}`,
        kind: "app",
        id: a.id,
        title: `${a.role} — ${a.company}`,
        meta: `${APPLICATION_STATUS_LABEL[a.status][lang]} · ${relativeDate(new Date(a.updatedAt), lang)}`,
        status: "ready",
        statusLabel: APPLICATION_STATUS_LABEL[a.status][lang],
        at: a.updatedAt,
      }));
    return [...cvDocs, ...letterDocs, ...appDocs];
  }, [cvs, letters, applications, lang, t]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = docs.filter(
      (d) =>
        // "Applications" means every application, letter or not: a cover letter
        // IS an application here (it is stored on one), so filtering by the
        // letter kind alone would hide the saved jobs this chip exists for.
        (filter === "all" ||
          (filter === "app" ? d.kind === "app" || d.kind === "letter" : d.kind === filter)) &&
        (!q || d.title.toLowerCase().includes(q)),
    );
    return sort === "name" ? [...list].sort((a, b) => a.title.localeCompare(b.title)) : [...list].sort((a, b) => b.at - a.at);
  }, [docs, filter, query, sort]);

  const templateCount = ALL_TEMPLATES.length;
  const previewDesigns = ALL_TEMPLATES.slice(0, 3);

  const filtering = filter !== "all" || query.trim().length > 0;

  const openDoc = (doc: Doc) => {
    if (doc.kind === "cv") {
      const cv = cvs.find((x) => x.id === doc.id);
      navigation.navigate("CvEditor", { templateId: cv?.templateId, cvId: doc.id });
      return;
    }
    navigation.navigate("HomeTab", { screen: "ApplicationDetail", params: { id: doc.id } });
  };

  // The overflow. It replaces the three always-visible buttons the design does
  // not have, and it is the app's own sheet layer — tab → screen → one sheet,
  // §8's depth limit.
  const openMenu = (doc: Doc) => {
    haptics.light();
    const cv = doc.kind === "cv" ? cvs.find((x) => x.id === doc.id) : undefined;
    const buttons = [
      doc.kind === "cv"
        ? {
            text: t("Edit", "Hariri"),
            onPress: () => navigation.navigate("CvEditor", { templateId: cv?.templateId, cvId: doc.id }),
          }
        : {
            text: t("Open the application", "Fungua ombi"),
            onPress: () => navigation.navigate("HomeTab", { screen: "ApplicationDetail", params: { id: doc.id } }),
          },
      ...(doc.kind === "cv"
        ? [{ text: t("Download", "Pakua"), onPress: () => cv && void downloadCV(cv) }]
        : []),
      {
        text: t("Delete", "Futa"),
        style: "destructive" as const,
        onPress: () =>
          doc.kind === "cv"
            ? confirmDelete(doc.id, doc.title)
            : doc.kind === "app"
              ? confirmDeleteApp(doc.id, doc.title)
              : confirmDeleteLetter(doc.id, doc.title),
      },
      { text: t("Cancel", "Ghairi"), style: "cancel" as const },
    ];
    dialog.alert(doc.title, doc.meta, buttons);
  };

  return (
    <Screen
      scroll
      keyboardAvoiding={false}
      refreshing={refreshing}
      onRefresh={onRefresh}
      // The sticky action is the Screen's own footer — in flow above the tab
      // bar, not a floating overlay (§8: one floating element only). It appears
      // once there is a list to add to; an empty screen already carries the
      // build action in its empty state.
      footer={
        rows.length > 0 ? (
          <Button
            label={t("Build a new CV", "Jenga CV mpya")}
            leftIcon={<Icon name="plus" size={20} color={c.accentText} />}
            onPress={() => navigation.navigate("CvEditor", { nonce: String(Date.now()) })}
          />
        ) : undefined
      }
    >
      {/* Sub-header: the title, the one line that frames this screen as a safe
          library, and the two affordances the design puts beside them. The
          ember count pill that used to sit here is gone — §10 forbids badges,
          and the design has none. */}
      <ScreenTitle
        trailing={
          <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
            <Pressable
              onPress={() => {
                haptics.selection();
                setSearchOpen((v) => !v);
              }}
              accessibilityRole="button"
              accessibilityState={{ expanded: searchOpen }}
              accessibilityLabel={t("Search documents", "Tafuta nyaraka")}
              style={{ width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" }}
            >
              <Icon name="search" size={22} color={searchOpen ? c.accent : c.textMuted} />
            </Pressable>
            {/* Two real orders, one control. (The design's `swap_vert` opens a
                menu; the app's dialog layer paints its LAST button as the
                primary, so a three-item sheet would have made "Ghairi" the
                ember action. Tapping cycles the order instead.) */}
            <Pressable
              onPress={() => {
                haptics.selection();
                setSort((s) => (s === "recent" ? "name" : "recent"));
              }}
              accessibilityRole="button"
              accessibilityLabel={
                sort === "recent"
                  ? t("Sorted by newest. Tap for A–Z by name.", "Imepangwa kwa mpya kwanza. Gusa kwa jina (A–Z).")
                  : t("Sorted by name. Tap for newest first.", "Imepangwa kwa jina. Gusa kwa mpya kwanza.")
              }
              style={{ width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" }}
            >
              <Icon name="arrow-up-down" size={22} color={sort === "name" ? c.accent : c.textMuted} />
            </Pressable>
          </View>
        }
      >
        {t("My CVs", "CV zako")}
      </ScreenTitle>

      <Text style={{ color: c.textMuted, fontSize: 13.5, lineHeight: 19, marginTop: -14, marginBottom: 14 }}>
        {t(
          "All your documents are safe and ready to use",
          "Nyaraka zako zote ziko salama na tayari kutumika",
        )}
      </Text>

      {searchOpen ? (
        <View style={{ marginBottom: 12 }}>
          <TextField
            value={query}
            onChangeText={setQuery}
            placeholder={t("Search documents", "Tafuta nyaraka")}
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>
      ) : null}

      {/* Document-type filter chips. Horizontal, like the design's.
          `flexGrow: 0` + `alignItems: "center"` are LOAD-BEARING, not style
          preferences: a horizontal ScrollView left to itself expands to fill the
          vertical space the screen has spare, and its content container's default
          `stretch` then inflates every chip into a tall blob. The space only
          exists when the list is empty or filtered empty — which is why this
          showed up on an empty CV library and never on a full jobs feed. */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingRight: 8, alignItems: "center" }}
        style={{ flexGrow: 0, marginBottom: 16 }}
      >
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <Pressable
              key={f.key}
              onPress={() => {
                haptics.selection();
                setFilter(f.key);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              // §8: 44 dp, never the design's 32.
              style={{
                minHeight: 44,
                paddingHorizontal: 16,
                borderRadius: 999,
                justifyContent: "center",
                backgroundColor: active ? c.accentFillStrong : c.bgSunken,
              }}
            >
              <Text style={{ color: active ? c.accentText : c.textBody, fontSize: 13, fontWeight: active ? "800" : "600" }}>
                {lang === "sw" ? f.sw : f.en}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* The template-gallery entry. This is the route: the CV list owns the
          gallery as its one sheet (`TemplateGallery`, the same component Home
          and first-run open), and choosing a design starts a new CV with it.
          Before this, the gallery was reachable from Home, first-run and the
          preview card — never from here. */}
      <Card
        onPress={() => {
          haptics.selection();
          setGalleryOpen(true);
        }}
        accessibilityLabel={t(
          `Designs ${templateCount}. Choose the design for your CV.`,
          `Miundo ${templateCount}. Chagua muundo wa CV yako.`,
        )}
        style={{ marginBottom: 18 }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 9,
              backgroundColor: c.accent + "1f",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="layout-template" size={16} color={c.accent} />
          </View>
          {/* The count is READ, never typed. Stitch's `Miundo 47` does not
              match this product: every design the app can render is in
              ALL_TEMPLATES (lib/cv-html.ts). */}
          <Text style={{ color: c.text, fontSize: 17, fontWeight: "800" }}>
            {t(`Designs ${templateCount}`, `Miundo ${templateCount}`)}
          </Text>
        </View>
        <Text style={{ color: c.textMuted, fontSize: 13.5, lineHeight: 19, marginTop: 10 }}>
          {t(
            `${templateCount} CV designs. Pick the one that suits you — you can change it any time.`,
            `Miundo ${templateCount} ya CV. Chagua unaokufaa — unaweza kuubadilisha wakati wowote.`,
          )}
        </Text>
        <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
          {previewDesigns.map((tpl) => (
            <View key={tpl.id} style={{ flex: 1 }}>
              <View
                style={{
                  aspectRatio: 3 / 4,
                  borderRadius: 8,
                  backgroundColor: c.bgSunken,
                  borderWidth: 1,
                  borderColor: c.border,
                  padding: 6,
                  overflow: "hidden",
                  justifyContent: "space-between",
                }}
              >
                <View style={{ gap: 3 }}>
                  <View style={{ width: "60%", height: 3, borderRadius: 1.5, backgroundColor: c.accent }} />
                  <View style={{ width: "85%", height: 2, borderRadius: 1, backgroundColor: c.border }} />
                  <View style={{ width: "70%", height: 2, borderRadius: 1, backgroundColor: c.border }} />
                </View>
                <View style={{ gap: 3 }}>
                  <View style={{ width: "100%", height: 1.5, backgroundColor: c.border }} />
                  <View style={{ width: "60%", height: 1.5, backgroundColor: c.border }} />
                </View>
              </View>
              <Text
                numberOfLines={1}
                style={{ color: c.textMuted, fontSize: 9.5, fontWeight: "700", textAlign: "center", marginTop: 4 }}
              >
                {lang === "sw" ? tpl.name.sw : tpl.name.en}
              </Text>
            </View>
          ))}
          <View style={{ flex: 1 }}>
            <View
              style={{
                aspectRatio: 3 / 4,
                borderRadius: 8,
                backgroundColor: c.bgSunken,
                borderWidth: 1,
                borderColor: c.border,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: c.accent, fontSize: 15, fontWeight: "800" }}>
                +{Math.max(0, templateCount - previewDesigns.length)}
              </Text>
              <Text style={{ color: c.textMuted, fontSize: 9.5, fontWeight: "700" }}>
                {t("view", "tazama")}
              </Text>
            </View>
          </View>
        </View>
      </Card>

      {storageBlocked && cvs.length > 0 ? (
        <Text style={{ color: c.textMuted, fontSize: 12.5, lineHeight: 18, marginBottom: 12 }}>
          {t(
            "These are the copies from your account. This device couldn't cache them, so offline access may be limited.",
            "Hizi ni nakala kutoka akaunti yako. Kifaa hiki hakikuweza kuzihifadhi, hivyo matumizi bila mtandao yanaweza kuwa machache.",
          )}
        </Text>
      ) : null}

      {(loading || appsLoading) && docs.length === 0 ? (
        <SkeletonList count={3} />
      ) : error && cvs.length === 0 ? (
        /* Never claim the user has no CVs when the real problem is that we
           couldn't reach the server — that is indistinguishable from data loss. */
        <View style={{ flex: 1, justifyContent: "center", paddingBottom: 40 }}>
          <EmptyState
            icon="alert-circle"
            title={t(cvError.title.en, cvError.title.sw)}
            body={t(cvError.body.en, cvError.body.sw)}
            actionLabel={t(cvError.action.en, cvError.action.sw)}
            onAction={
              cvError.actionKind === "signin"
                ? // A refused session is only fixable by someone who has one. A
                  // guest never did, so offer the account instead of a sign-out.
                  isGuest
                  ? () => openAuth()
                  : () => void signOut()
                : onRefresh
            }
          />
        </View>
      ) : docs.length === 0 ? (
        <View style={{ flex: 1, justifyContent: "center", paddingBottom: 40 }}>
          {isGuest ? (
            // A stranger's first screen. No account anywhere in it, and no
            // claim that anything is missing: the builder is one tap away and
            // the download works offline.
            <EmptyState
              icon="file-text"
              title={t("Build your CV — no account needed", "Jenga CV yako — hakuna akaunti inayohitajika")}
              body={t(
                "Your CV is written and saved on this phone, and you can download it as a PDF. Nothing leaves your phone unless you choose.",
                "CV yako inaandikwa na kuhifadhiwa kwenye simu hii, na unaweza kuipakua kama PDF. Hakuna kinachotoka kwenye simu yako bila wewe kuamua.",
              )}
              actionLabel={t("Build your CV", "Jenga CV yako")}
              onAction={() => navigation.navigate("CvEditor", { nonce: String(Date.now()) })}
              secondaryLabel={t("Upload a CV", "Pakia CV")}
              onSecondary={() => navigation.navigate("ImportTab")}
            />
          ) : (
            <EmptyState
              icon="file-text"
              title={t("You have no CVs yet", "Huna CV bado")}
              body={t("No CVs yet, draft or completed. Talk to me and I'll build one with you, or upload a CV you already have to start.", "Huna CV, rasimu wala iliyokamilika. Ongea nami nikutengenezee moja, au pakia CV uliyonayo ili kuanza.")}
              actionLabel={t("Talk to me", "Ongea nami")}
              onAction={() => navigation.navigate("SumaiyaTab")}
              secondaryLabel={t("Upload a CV", "Pakia CV")}
              onSecondary={() => navigation.navigate("ImportTab")}
            />
          )}
        </View>
      ) : (
        <>
          {/* The section header, with the design's `Zote →` — here it is a real
              control: it clears a filter that is hiding documents. */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              marginBottom: 12,
            }}
          >
            <Text style={{ color: c.text, fontSize: 17, fontWeight: "800", flexShrink: 1 }}>
              {t("Recent documents", "CV za hivi karibuni")}
            </Text>
            {filtering ? (
              <Pressable
                onPress={() => {
                  haptics.selection();
                  setFilter("all");
                  setQuery("");
                }}
                accessibilityRole="button"
                accessibilityLabel={t("Show everything", "Onyesha zote")}
                style={{ minHeight: 44, flexDirection: "row", alignItems: "center", gap: 4, paddingLeft: 8 }}
              >
                <Text style={{ color: c.accent, fontSize: 13, fontWeight: "800" }}>{t("All", "Zote")}</Text>
                <Icon name="arrow-right" size={15} color={c.accent} />
              </Pressable>
            ) : null}
          </View>

          {rows.length === 0 ? (
            <EmptyState
              icon="filter"
              title={t("Nothing matches that", "Hakuna kinacholingana")}
              body={
                query.trim()
                  ? t(
                      `No document here is called "${query.trim()}".`,
                      `Hakuna nyaraka hapa inayoitwa "${query.trim()}".`,
                    )
                  : t(
                      "There is no document of this type on this phone yet.",
                      "Hakuna nyaraka ya aina hii kwenye simu hii bado.",
                    )
              }
              actionLabel={t("Show everything", "Onyesha zote")}
              onAction={() => {
                setFilter("all");
                setQuery("");
              }}
            />
          ) : (
            <View style={{ gap: 12 }}>
              {rows.map((doc, i) => (
                <Stagger key={doc.key} index={i}>
                  <DocRow
                    doc={doc}
                    c={c}
                    t={t}
                    busy={downloading === doc.id || deleting === doc.id}
                    onOpen={() => {
                      haptics.light();
                      openDoc(doc);
                    }}
                    onMenu={() => openMenu(doc)}
                  />
                </Stagger>
              ))}
            </View>
          )}
        </>
      )}

      {/* THE QUIET OFFER — a guest who already has a CV to lose gets one
          standing row saying what an account is for. It is not a prompt: it
          never interrupts, and the interruption (after a save or a download)
          still happens at most once ever. It disappears the moment they sign
          in, because there is nothing left to offer. */}
      {isGuest && docs.length > 0 ? (
        <Card
          onPress={() => openAuth()}
          accessibilityLabel={t(GUEST_KEEP_CARD.cta.en, GUEST_KEEP_CARD.cta.sw)}
          style={{ marginTop: 16, flexDirection: "row", alignItems: "center", gap: 12 }}
        >
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              backgroundColor: c.accent + "14",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="user-plus" size={18} color={c.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.text, fontSize: 13.5, lineHeight: 19 }}>
              {guestText(GUEST_KEEP_CARD.body, lang)}
            </Text>
            <Text style={{ color: c.accent, fontSize: 13, fontWeight: "800", marginTop: 6 }}>
              {guestText(GUEST_KEEP_CARD.cta, lang)}
            </Text>
          </View>
        </Card>
      ) : null}

      {/* The gallery itself: searchable, filterable, virtualised — the same
          sheet every other entry point opens. */}
      <TemplateGallery
        visible={galleryOpen}
        onSelect={(id) => {
          navigation.navigate("CvEditor", { templateId: id, nonce: String(Date.now()) });
        }}
        onClose={() => setGalleryOpen(false)}
      />
    </Screen>
  );
}
