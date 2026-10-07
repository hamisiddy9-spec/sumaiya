import React, { useCallback, useState } from "react";
import { Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import type { CV } from "@sumaiya/types";
import { useCvs } from "../../hooks/use-cvs";
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
  haptics,
  useThemeColors,
} from "../../components/ui";
import { Icon } from "../../components/icon";
import { useLang } from "../../lib/i18n";
import { relativeDate } from "../../lib/relative-date";
import { dialog } from "../../components/ui";
import { exportCVAsPDF } from "../../services/pdf-export";
import { fileNameFromUri, saveToPhone, shouldOfferShare } from "../../services/save-to-device";
import type { CvTemplateId } from "../../lib/cv-html";
import { shareCV } from "../../services/share";
import type { CvListScreenProps } from "../../navigation/types";

export function CvListScreen({ navigation }: CvListScreenProps) {
  const c = useThemeColors();
  const { t, lang } = useLang();
  const { cvs, loading, error, errorKind, storageBlocked, deleteCV, loadCVs } = useCvs();
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
    } finally {
      setRefreshing(false);
    }
  }, [loadCVs]);

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

  return (
    <Screen scroll keyboardAvoiding={false} refreshing={refreshing} onRefresh={onRefresh}>
      <ScreenTitle
        trailing={
          cvs.length > 0 ? (
            <View style={{ backgroundColor: c.accent, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 4 }}>
              <Text style={{ color: c.accentText, fontSize: 13, fontWeight: "700" }}>{cvs.length}</Text>
            </View>
          ) : undefined
        }
      >
        {t("My CVs", "CV zako")}
      </ScreenTitle>

      {storageBlocked && cvs.length > 0 ? (
        <Text style={{ color: c.textMuted, fontSize: 12.5, lineHeight: 18 }}>
          {t(
            "These are the copies from your account. This device couldn't cache them, so offline access may be limited.",
            "Hizi ni nakala kutoka akaunti yako. Kifaa hiki hakikuweza kuzihifadhi, hivyo matumizi bila mtandao yanaweza kuwa machache.",
          )}
        </Text>
      ) : null}

      {loading && cvs.length === 0 ? (
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
      ) : cvs.length === 0 ? (
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
              onAction={() =>
                navigation.navigate("CvEditor", { nonce: String(Date.now()) })
              }
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
        cvs
          .slice()
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .map((cv: CV, i) => (
            <Stagger key={cv.id} index={i}>
              <Card style={{ marginBottom: 12, gap: 12 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      backgroundColor: c.accent + "14",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon name="file-text" size={20} color={c.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: c.text, fontSize: 15.5, fontWeight: "700" }} numberOfLines={1}>
                      {cv.title}
                    </Text>
                    <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 2 }}>
                      {t("Updated", "Ilibadilishwa")} {relativeDate(cv.updatedAt, lang)}
                    </Text>
                  </View>
                  {cv.isOfflineOnly ? (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: c.warning + "1f", borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 }}>
                      <Icon name="wifi-off" size={11} color={c.warning} />
                      <Text style={{ color: c.warning, fontSize: 10.5, fontWeight: "700" }}>{t("Offline", "Nje ya mtandao")}</Text>
                    </View>
                  ) : null}
                </View>

                <View style={{ flexDirection: "row", gap: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Button
                      label={t("Edit", "Hariri")}
                      variant="secondary"
                      size="sm"
                      leftIcon={<Icon name="edit" size={15} color={c.text} />}
                      onPress={() =>
                        navigation.navigate("CvEditor", { templateId: cv.templateId, cvId: cv.id })
                      }
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button
                      label={t("Download", "Pakua")}
                      variant="secondary"
                      size="sm"
                      loading={downloading === cv.id}
                      leftIcon={<Icon name="download" size={15} color={c.text} />}
                      onPress={() => void downloadCV(cv)}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button
                      label={t("Delete", "Futa")}
                      variant="ghost"
                      size="sm"
                      loading={deleting === cv.id}
                      leftIcon={<Icon name="trash-2" size={15} color={c.error} />}
                      onPress={() => confirmDelete(cv.id, cv.title)}
                      haptic="warning"
                    />
                  </View>
                </View>
              </Card>
            </Stagger>
          ))
      )}

      {/* THE QUIET OFFER — a guest who already has a CV to lose gets one
          standing row saying what an account is for. It is not a prompt: it
          never interrupts, and the interruption (after a save or a download)
          still happens at most once ever. It disappears the moment they sign
          in, because there is nothing left to offer. */}
      {isGuest && cvs.length > 0 ? (
        <Card
          onPress={() => openAuth()}
          accessibilityLabel={t(GUEST_KEEP_CARD.cta.en, GUEST_KEEP_CARD.cta.sw)}
          style={{ marginTop: 4, flexDirection: "row", alignItems: "center", gap: 12 }}
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
    </Screen>
  );
}
