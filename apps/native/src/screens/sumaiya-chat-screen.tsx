import React, { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { offlineStorage } from "@sumaiya/utils";
import { apiClient } from "../lib/api-client";
import { useAuthContext } from "../contexts/auth-context";
import { ownerIdFor } from "../lib/local-owner";
import { useCvs } from "../hooks/use-cvs";
import { useOfflineSync } from "../hooks/use-offline-sync";
import { useSumaiyaChat } from "../hooks/use-sumaiya-chat";
import { ChatMessageComponent } from "../components/chat/chat-message";
import { AttachmentPreviewSheet } from "../components/chat/attachment-preview-sheet";
import { AttachSheet } from "../components/chat/attach-sheet";
import { JobChoiceSheet } from "../components/chat/job-choice-sheet";
import { QuickActionsGrid } from "../components/chat/quick-actions-grid";
import { ChatComposer } from "../components/chat/chat-composer";
import { ProgressRail, ProgressReceipt } from "../components/chat/progress-rail";
import { SystemNote } from "../components/chat/system-note";
import { TurnErrorCard } from "../components/chat/turn-error-card";
import { UnavailableCard } from "../components/chat/unavailable-card";
import { SuggestionChips } from "../components/chat/suggestion-chips";
import { INITIAL_QUICK_ACTIONS } from "../components/chat/chat-types";
import { CHAT_MOTION, chatEnterMs, chatExitMs } from "../components/chat/chat-motion";
import type { CVData } from "@sumaiya/types";
import type { ActionType, Attachment, ChatMessage } from "../components/chat/chat-types";
import type { AttachKind } from "../components/chat/attach-sheet";
import type { CvTemplateId } from "../lib/cv-html";
import { Icon } from "../components/icon";
import { SumaiyaMark } from "../components/sumaiya-mark";
import { useSpeech } from "../lib/speech";
import { useLang, greetingFor } from "../lib/i18n";
import { resolveAttachment, linkAttachment } from "../lib/attachments";
import { dialog, haptics, useMotionReduced, useThemeColors, PromptModal } from "../components/ui";
import type { SumaiyaChatScreenProps } from "../navigation/types";

/**
 * The chat screen — §3 of CHATBOX-REDESIGN-2026-09-20.md.
 *
 * What changed here, and why each one is not cosmetic:
 *
 *   · The **three-dot bubble is gone**. On the device tonight a user who got no
 *     reply sent `Hi` four times, because three pulsing dots look identical
 *     whether the request is healthy or dead — and re-sending on a metered
 *     connection costs them money. A progress rail built from real events
 *     replaced it, with a stop control from the first second.
 *   · The **composer is never blocked**. It used to be `editable={!loading}`
 *     with a dead send button; now the field is always live (a message sent
 *     while she works is queued, not refused) and the send slot becomes stop.
 *   · The **chips dock above the composer** in one scrollable row, capped at
 *     three, instead of repeating verbatim inside the transcript.
 *   · Every failure is a **state with a control**, never a dead end and never an
 *     English sentence in a Swahili conversation.
 */
export function SumaiyaChatScreen({ navigation, route }: SumaiyaChatScreenProps) {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const {
    messages,
    loading,
    error,
    delivery,
    turnSteps,
    turnStartedAt,
    turnError,
    modelStatus,
    queued,
    turnActive,
    turnOutcome,
    sendMessage,
    clearChat,
    fetchLearningResources,
    buildCvFromChat,
    buildingCv,
    retryAttachment,
    stopTurn,
    retryLastTurn,
    dismissTurnError,
    dismissError,
  } = useSumaiyaChat();
  const { cvs } = useCvs();
  const { user } = useAuthContext();
  const { queueOperation } = useOfflineSync();
  const { lang, t } = useLang();
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [preview, setPreview] = useState<Attachment | null>(null);
  const [linkPrompt, setLinkPrompt] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  // "Lenga kwenye kazi" must not assume which job — it opens the choice (our
  // listings, searchable, or the user's own) at zero request cost.
  const [jobChoiceOpen, setJobChoiceOpen] = useState(false);
  /** Move 21: the pill appears only when the reader is NOT at the bottom. */
  const [pinned, setPinned] = useState(true);
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const reduce = useMotionReduced();

  const previewLive = preview
    ? messages.flatMap((m) => m.attachments ?? []).find((a) => a.id === preview.id) ?? preview
    : null;

  // A file handed in from the Import tab lands here as a pending attachment.
  useEffect(() => {
    const incoming = route?.params?.attachment;
    if (!incoming?.uri) return;
    setAttachments((prev) =>
      prev.some((a) => a.uri === incoming.uri)
        ? prev
        : [
            ...prev,
            {
              id: `att-in-${Date.now()}`,
              kind: incoming.kind === "document" ? "document" : "image",
              uri: incoming.uri,
              name: incoming.name ?? "file",
              mimeType: incoming.mimeType,
              status: "ready",
            } as Attachment,
          ],
    );
    navigation.setParams?.({ attachment: undefined });
    setInput((v) => v || t("What can you tell me from this?", "Unaweza kuniambia nini kutoka hapa?"));
  }, [route?.params?.attachment]);

  // A one-tap "practise with Sumaiya" from the Learning Hub lands here as a
  // seed message we send straight away.
  useEffect(() => {
    const seed = route?.params?.seed;
    if (!seed?.trim()) return;
    navigation.setParams?.({ seed: undefined });
    void sendMessage(seed.trim());
  }, [route?.params?.seed]);

  const empty = messages.length === 0;
  const speech = useSpeech();
  const lastReply = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].author === "sumaiya" && messages[i].content) return messages[i].content;
    }
    return "";
  })();

  /**
   * S1: the old code guessed with `setTimeout(…, 80)` on every messages/loading
   * change — it fired on the first render of a restored 40-turn transcript and
   * it fought a user who was reading upwards. Now the transcript scrolls itself
   * only when the reader is already at the bottom, and it does so on a real
   * layout event (`onContentSizeChange`).
   */
  const scrollToEnd = (animated = true) => {
    scrollRef.current?.scrollToEnd({ animated: reduce ? false : animated });
  };

  const send = async () => {
    const text = input.trim();
    if (!text && attachments.length === 0) return;
    haptics.light();
    const atts = attachments;
    setInput("");
    setAttachments([]);
    await sendMessage(text, { attachments: atts });
  };

  const onAttach = async (kind: AttachKind) => {
    if (kind === "jobTarget") {
      setJobChoiceOpen(true);
      return;
    }
    if (kind === "link") {
      setLinkPrompt(true);
      return;
    }
    if (kind === "myDoc") {
      if (cvs.length === 0) {
        setInput((v) => v || t("I don't have a CV yet — help me build one.", "Sina CV bado — nisaidie kutengeneza."));
        inputRef.current?.focus();
        return;
      }
      const pickCv = (cv: (typeof cvs)[number]) => {
        const d = cv.data;
        const text = [
          `${t("My CV", "CV yangu")}: ${cv.title}`,
          d?.summary,
          (d?.experience ?? []).map((e) => `${e.title} — ${e.company} (${e.startDate}–${e.endDate || t("now", "sasa")})`).join("\n"),
          (d?.skills ?? []).length ? `${t("Skills", "Ujuzi")}: ${(d?.skills ?? []).map((s) => s.name).join(", ")}` : "",
        ].filter(Boolean).join("\n\n");
        setAttachments((prev) => [
          ...prev,
          { id: `cv-${cv.id}-${Date.now()}`, kind: "cv", uri: cv.id, name: cv.title, status: "ready", extractedText: text.slice(0, 4000) } as Attachment,
        ]);
      };
      if (cvs.length === 1) { pickCv(cvs[0]); return; }
      dialog.alert(
        t("Which CV?", "CV ipi?"),
        undefined,
        [
          ...cvs.slice(0, 4).map((cv) => ({ text: cv.title, onPress: () => pickCv(cv) })),
          { text: t("Cancel", "Ghairi"), style: "cancel" as const },
        ],
      );
      return;
    }
    try {
      const picked = await resolveAttachment(kind, {
        // The camera was refused and the user took the offered alternative —
        // a photo they already have. It has to land in the same place as a
        // camera shot, or the offer is a lie.
        onDeferred: (atts) => setAttachments((prev) => [...prev, ...atts].slice(0, 6)),
      });
      if (picked?.length) setAttachments((prev) => [...prev, ...picked].slice(0, 6));
    } catch {
      haptics.error();
    }
  };

  // The greeting chips SEED the conversation — Sumaiya's whole point is that she
  // helps you right here in the chat, not that she bounces you to a blank
  // editor. "Just talk" only dismisses the chips (send nothing, focus input).
  const onInitialAction = async (actionId: string) => {
    haptics.selection();
    const seed: Record<string, string> = {
      "cv-builder": t("Help me make my CV.", "Nisaidie kutengeneza CV yangu."),
      "job-letter": t(
        "Help me write a cover letter for a job I'm applying to.",
        "Nisaidie kuandika barua ya maombi kwa ajira ninayoomba.",
      ),
      "learn-skills": t(
        "What skills should I focus on learning to be more competitive for jobs?",
        "Ni ujuzi gani nijikite kujifunza ili niwe na ushindani zaidi kazini?",
      ),
    };
    if (actionId === "free-chat") {
      inputRef.current?.focus();
      return;
    }
    if (seed[actionId]) await sendMessage(seed[actionId]);
  };

  // Sumaiya is its own tab now, so jumps into other tabs' stacks must be
  // addressed as { screen } on the target tab — a bare navigate("CvEditor")
  // from here resolves to nothing.
  const goLearningHub = () => navigation.navigate("HomeTab", { screen: "LearningHub" });

  const onAction = (action: ActionType, data?: Record<string, any>) => {
    haptics.selection();
    switch (action) {
      case "open-cv":
      case "edit-cv": {
        if (data?.section === "jobs") {
          // The "Lenga kwenye kazi" chip and the + menu's fifth row. Never
          // assume the job: offer our live listings (searchable) or the user's
          // own advert, then hand the chosen one to the existing snap screen.
          setJobChoiceOpen(true);
          break;
        }
        if (data?.section === "ats") {
          const cv = cvs[0];
          navigation.navigate("HomeTab", { screen: "AtsChecker", params: cv ? { cvId: cv.id } : {} });
          break;
        }
        if (data?.template === "letter") {
          navigation.navigate("HomeTab", { screen: "ApplicationDetail", params: {} });
          break;
        }
        // Open the CV the user actually has — not a blank editor. If they have
        // none yet, take them to the list (Import / Start new) rather than
        // dropping them into an empty form.
        const target = data?.cvId
          ? cvs.find((cv) => cv.id === data.cvId)
          : cvs[0];
        if (target) {
          navigation.navigate("CVsTab", {
            screen: "CvEditor",
            params: { cvId: target.id, templateId: target.templateId },
          });
        } else {
          navigation.navigate("CVsTab", { screen: "CvListMain" });
        }
        break;
      }
      case "learn":
        if (data?.skills) {
          fetchLearningResources(data.skills).finally(goLearningHub);
        } else {
          goLearningHub();
        }
        break;
      case "practice":
      case "view-resources":
        goLearningHub();
        break;
      case "chat":
        speech.stop();
        askClear();
        break;
    }
  };

  /**
   * `Futa mazungumzo` behind a confirmation (§3.7 / R7). It was a destructive
   * action on up to 40 turns of work behind a 17 px icon with no confirmation at
   * all; the dialog is V2 (spring.gentle card, backdrop 220, out 140).
   */
  const askClear = () => {
    if (messages.length <= 2) {
      // Only two turns of nothing to lose — clearing instantly is not a risk.
      clearChat();
      return;
    }
    dialog.alert(
      t("Clear this conversation?", "Futa mazungumzo haya?"),
      t(
        `The ${messages.length} messages on this phone will be deleted. Nothing you built in it (a CV, a letter) is deleted with it.`,
        `Ujumbe ${messages.length} ulio kwenye simu hii utafutwa. Hutaifuta kitu ulichokitengeneza (CV, barua) kwa kufuta mazungumzo.`,
      ),
      [
        { text: t("Keep it", "Acha"), style: "cancel" as const },
        { text: t("Delete", "Futa"), style: "destructive" as const, onPress: () => { speech.stop(); clearChat(); } },
      ],
    );
  };

  // Persist a CV Sumaiya built in the chat — straight to the local store + a
  // best-effort server push. No trip through the editor needed.
  const saveCvFromChat = async (cvData: CVData, template: string): Promise<string> => {
    const now = new Date();
    const cv = {
      id: `cv-${Date.now()}`,
      // The SAME owner id the CV list and the editor use (lib/local-owner.ts).
      // This was the constant "me", which is why a CV built here was written to
      // the device and then missing from "CV zako" until a server round-trip
      // re-cached it — and missing from this screen's own CV picker too.
      userId: ownerIdFor(user),
      templateId: template,
      title: cvData.personalInfo?.fullName || "CV",
      data: cvData,
      createdAt: now,
      updatedAt: now,
    };
    await offlineStorage.saveCVOffline(cv).catch(() => {});
    try {
      await apiClient.createCV(cv);
    } catch {
      // Unlike cv-editor-screen.tsx's save(), this used to just comment "will
      // reconcile" without actually queuing anything — nothing was ever
      // retried, so a CV built here while offline (or during any transient
      // failure) would sit local-only forever with no sync-queue entry, no
      // "N to sync" pill, and the button below still confirming "Saved to My
      // CVs" as if it had reached the server. Route it through the same
      // queue the editor uses so it's retried like every other unsynced edit.
      await queueOperation("create_cv", cv.id, cv).catch(() => {});
    }
    // The id is returned so the card can hand it to the editor: the whole point
    // of the handoff (§3.4 step 2) is that saving from the editor updates THIS
    // document instead of forking a second CV.
    return cv.id;
  };

  /**
   * §3.4 · The handoff. Identity travels with it: the CV's real template, plus
   * `sourceCvId` so a save from the editor can update THIS document instead of
   * forking a second CV (M5). And the editor announces the context it came from
   * — as a system note in the chat, not a banner in the editor.
   */
  const openCvFromCard = (cv: CVData, templateId?: CvTemplateId, cvId?: string) => {
    addSystemNote(
      t(
        "You've opened the CV I built here. When you come back, I'll carry on with it.",
        "Umefungua CV yako iliyotengenezwa hapa. Ukirudi, nitaendelea nayo."
      ),
    );
    navigation.navigate("CVsTab", {
      screen: "CvEditor",
      // `sourceCvId` is passed only when the document has really been saved —
      // a placeholder id would make the editor believe it is editing a saved CV.
      params: { initialData: cv, templateId: templateId ?? null, ...(cvId ? { sourceCvId: cvId } : {}) },
    });
  };

  /** T3 · a system note in the transcript (centred, no avatar, never a toast). */
  const addSystemNote = (text: string) => {
    const note: ChatMessage = {
      id: `note-${Date.now()}`,
      type: "system",
      author: "sumaiya",
      content: text,
      data: {},
      timestamp: new Date(),
    };
    setSystemNotes((prev) => [...prev.slice(-2), note]);
  };
  const [systemNotes, setSystemNotes] = React.useState<ChatMessage[]>([]);

  // Offer to build once the user has actually told Sumaiya something, and only
  // until a CV has been produced in this thread.
  const substantiveUserTurns = messages.filter((m) => m.author === "user" && m.content.trim().length > 12).length;
  const alreadyBuilt = messages.some((m) => m.type === "cv-ready");

  // T6 · the docked chip row: the newest reply's suggestions, capped at three.
  const chips = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const s = messages[i].data?.suggestions;
      if (s?.length) return s;
    }
    return [];
  })();

  // Move 21 — the scroll-to-bottom pill, entering at 300 with a 12 px rise.
  const pillV = useSharedValue(0);
  useEffect(() => {
    pillV.value = withTiming(pinned ? 0 : 1, {
      duration: pinned ? chatExitMs(reduce, CHAT_MOTION.scrollPill.exit) : chatEnterMs(reduce, CHAT_MOTION.scrollPill.enter),
      easing: pinned ? Easing.in(Easing.cubic) : Easing.out(Easing.cubic),
    });
  }, [pinned, reduce, pillV]);
  const pillStyle = useAnimatedStyle(() => ({
    opacity: pillV.value,
    transform: [{ translateY: (1 - pillV.value) * CHAT_MOTION.scrollPill.distance }],
  }));

  // The composer's one always-true sentence (§3.1's draft line).
  const draftNote = queued
    ? t(
        "Kept — I'll send it as soon as I finish this one.",
        "Nimeihifadhi — nitaituma mara nitakapomaliza hii.",
      )
    : modelStatus === "unavailable"
      ? t("Your words are kept even while I can't think.", "Maneno yako yanahifadhiwa hata nikiwa siwezi kufikiri sasa hivi.")
      : undefined;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingBottom: 12,
          paddingHorizontal: 16,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          borderBottomWidth: 1,
          borderBottomColor: c.border,
          backgroundColor: c.bgElevated,
        }}
      >
        {navigation.canGoBack?.() ? (
          <Pressable hitSlop={10} onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel={t("Back", "Rudi")}>
            <Icon name="arrow-left" size={20} color={c.text} />
          </Pressable>
        ) : null}
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            backgroundColor: c.accent,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <SumaiyaMark size={19} color={c.accentText} state={loading ? "thinking" : "idle"} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.text, fontSize: 16, fontWeight: "700" }}>Sumaiya</Text>
          <Text style={{ color: c.textMuted, fontSize: 12 }}>
            {t("Your career assistant", "Msaidizi wako wa kazi")}
          </Text>
        </View>
        {!empty && lastReply && (speech.speaking || speech.speakable(lastReply)) ? (
          <Pressable
            hitSlop={10}
            onPress={() => {
              haptics.selection();
              speech.speaking ? speech.stop() : speech.speak(lastReply);
            }}
            accessibilityRole="button"
            accessibilityLabel={speech.speaking ? t("Stop reading", "Acha kusoma") : t("Read aloud", "Soma kwa sauti")}
          >
            <Icon name={speech.speaking ? "volume-x" : "volume-2"} size={18} color={speech.speaking ? c.accent : c.textMuted} />
          </Pressable>
        ) : null}
        {!empty ? (
          <Pressable
            hitSlop={10}
            onPress={() => { haptics.selection(); askClear(); }}
            accessibilityRole="button"
            accessibilityLabel={t("Clear conversation", "Futa mazungumzo")}
          >
            <Icon name="refresh-cw" size={17} color={c.textMuted} />
          </Pressable>
        ) : null}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 8 : 0}
      >
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => {
            if (pinned) scrollToEnd();
          }}
          onScroll={(e) => {
            const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
            setPinned(contentOffset.y + layoutMeasurement.height >= contentSize.height - 24);
          }}
          scrollEventThrottle={16}
        >
          {empty ? (
            <View style={{ flex: 1, paddingTop: 12 }}>
              {/* §3.2 T3 — one quiet line answering a real question: the
                  transcript has always been kept (40 turns on disk) and the UI
                  was silent about it. */}
              <View
                style={{
                  backgroundColor: c.bgElevated,
                  borderWidth: 1,
                  borderColor: c.border,
                  borderRadius: 18,
                  borderBottomLeftRadius: 4,
                  padding: 16,
                  marginBottom: 20,
                }}
              >
                <Text style={{ color: c.text, fontSize: 15, fontWeight: "700", marginBottom: 4 }}>
                  {t("Hi, I'm Sumaiya 👋", "Habari, mimi ni Sumaiya 👋")}
                </Text>
                <Text style={{ color: c.textBody, fontSize: 14, lineHeight: 21 }}>{greetingFor(lang)}</Text>
              </View>
              <QuickActionsGrid actions={INITIAL_QUICK_ACTIONS} onSelect={(a) => onInitialAction(a.id)} loading={loading} />
              <SystemNote text={t("This conversation stays on this phone.", "Mazungumzo yanabaki kwenye simu hii.")} />
            </View>
          ) : (
            messages.map((m, i) => {
              if (m.type === "system") return <SystemNote key={m.id} text={m.content} />;
              const prev = messages[i - 1];
              // One attribution row per run of her bubbles (T2).
              const showAttribution = m.author === "sumaiya" && (!prev || prev.author !== "sumaiya");
              return (
                <ChatMessageComponent
                  key={m.id}
                  message={m}
                  index={i}
                  showAttribution={showAttribution}
                  delivery={m.author === "user" ? delivery[m.id] : undefined}
                  onActionPress={onAction}
                  loading={loading}
                  onPreviewAttachment={setPreview}
                  onOpenCvEditor={openCvFromCard}
                  onSaveCv={saveCvFromChat}
                  onRetry={m.author === "user" && delivery[m.id] === "failed" ? () => void retryLastTurn() : undefined}
                  retryBusy={turnActive}
                  onWriteYourself={m.author === "user" ? dismissTurnError : undefined}
                />
              );
            })
          )}

          {/* Notes raised during this session (the editor hand-off, mostly). */}
          {systemNotes.map((n) => (
            <SystemNote key={n.id} text={n.content} />
          ))}

          {/* T4 · the rail, replacing the bare three-dot bubble entirely. */}
          {turnActive ? (
            <ProgressRail steps={turnSteps} startedAt={turnStartedAt} onStop={stopTurn} />
          ) : null}

          {/* T9 · what the rail leaves behind. */}
          {!turnActive && turnOutcome !== "failed" && turnSteps.length > 0 && turnSteps.some((s) => s.state === "done") ? (
            <ProgressReceipt steps={turnSteps} />
          ) : null}

          {queued ? (
            <SystemNote
              text={t("Kept — I'll send it as soon as I finish this one.", "Nimeihifadhi — nitaituma mara nitakapomaliza hii.")}
            />
          ) : null}

          {/* T8 · the honest unavailable state, from the probe (known) or the
              turn's own outcome (mid-turn). It never begs, never lies, never
              deadlines and never shows English. */}
          {turnError ? (
            turnError.modelMissing ? (
              <UnavailableCard
                variant="mid-turn"
                onOpenAts={() => {
                  const cv = cvs[0];
                  navigation.navigate("HomeTab", { screen: "AtsChecker", params: cv ? { cvId: cv.id } : {} });
                }}
                onOpenEditor={() => onAction("open-cv")}
                onReadPhoto={() => {
                  setAttachOpen(true);
                }}
                onRetry={() => void retryLastTurn()}
                retryBusy={turnActive}
                onWriteYourself={dismissTurnError}
              />
            ) : (
              <TurnErrorCard
                title={t("I couldn't answer this one.", "Sikuweza kujibu ombi hili.")}
                why={turnError.text}
                retryLabel={t("Try this request again", "Jaribu ombi hili tena")}
                onRetry={() => void retryLastTurn()}
                busy={turnActive}
                onSecondary={dismissTurnError}
              />
            )
          ) : null}

          {error ? (
            <TurnErrorCard
              title={t("That didn't go through.", "Hilo halikupita.")}
              why={error}
              onSecondary={dismissError}
            />
          ) : null}
        </ScrollView>

        {/* Move 21 — the pill that never animates the scroll offset itself. */}
        <Animated.View pointerEvents={pinned ? "none" : "auto"} style={[pillStyle, { alignSelf: "center", marginBottom: 6 }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("Go to the newest message", "Nenda kwenye ujumbe wa mwisho")}
            onPress={() => {
              setPinned(true);
              scrollToEnd();
            }}
            style={{
              minHeight: 36,
              paddingHorizontal: 14,
              borderRadius: 999,
              backgroundColor: c.text,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 6,
            }}
          >
            <Icon name="chevron-down" size={14} color={c.accentText} />
            <Text style={{ color: c.accentText, fontSize: 12, fontWeight: "700" }}>
              {t("Newest", "Ya mwisho")}
            </Text>
          </Pressable>
        </Animated.View>

        {!empty && substantiveUserTurns >= 2 && !alreadyBuilt ? (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: buildingCv }}
            onPress={() => {
              haptics.selection();
              buildCvFromChat();
            }}
            disabled={buildingCv}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              marginHorizontal: 12,
              marginBottom: 8,
              paddingVertical: 12,
              borderRadius: 14,
              backgroundColor: c.accentFill,
              opacity: buildingCv ? 0.7 : 1,
            }}
          >
            <SumaiyaMark size={16} color={c.accentText} state={buildingCv ? "thinking" : "static"} />
            <Text style={{ color: c.accentText, fontSize: 14, fontWeight: "800" }}>
              {buildingCv ? t("Building your CV…", "Inatengeneza CV yako…") : t("Build your CV from this chat", "Tengeneza CV yako kutoka mazungumzo haya")}
            </Text>
          </Pressable>
        ) : null}

        {/* T6 · the chips, docked above the composer in one scrollable row. */}
        {!empty ? <SuggestionChips suggestions={chips} onSuggestionPress={onAction} /> : null}

        <ChatComposer
          value={input}
          onChangeText={setInput}
          onSend={send}
          onStop={stopTurn}
          loading={loading}
          attachments={attachments}
          onAttach={onAttach}
          onOpenAttach={() => setAttachOpen(true)}
          onRemoveAttachment={(id) => setAttachments((prev) => prev.filter((a) => a.id !== id))}
          inputRef={inputRef}
          draftNote={draftNote}
        />
      </KeyboardAvoidingView>

      {/* The sheet renders the LIVE attachment, not the snapshot that was
          tapped: a retry updates the message, and a stale copy would keep
          showing the old failure after it had already succeeded. */}
      <AttachmentPreviewSheet
        attachment={previewLive}
        onClose={() => setPreview(null)}
        onRetry={
          previewLive && (previewLive.extractError || previewLive.extracting)
            ? () => {
                const owner = messages.find((m) => m.attachments?.some((a) => a.id === previewLive.id));
                if (owner) void retryAttachment(owner.id, previewLive.id);
              }
            : undefined
        }
      />

      <AttachSheet
        visible={attachOpen}
        onClose={() => setAttachOpen(false)}
        onPick={(kind) => onAttach(kind)}
      />

      {/* Which job? Our live listings (searchable, projected so it stays cheap)
          or the user's own advert. Only a real listing ever reaches the snap
          screen — and only after the user picked it. */}
      <JobChoiceSheet
        visible={jobChoiceOpen}
        onClose={() => setJobChoiceOpen(false)}
        onPickOurJob={(jd) => {
          setJobChoiceOpen(false);
          navigation.navigate("HomeTab", { screen: "JobApply", params: { jd } });
        }}
        onOwnSource={() => {
          setJobChoiceOpen(false);
          navigation.navigate("HomeTab", { screen: "JobApply" });
        }}
      />

      <PromptModal
        visible={linkPrompt}
        title={t("Paste the job link", "Bandika kiungo cha ajira")}
        message={t("I'll keep the link as context — paste the advert text too if you can.", "Nitaihifadhi kama muktadha — bandika pia maandishi ya tangazo ukiweza.")}
        placeholder="https://…"
        confirmLabel={t("Add", "Ongeza")}
        cancelLabel={t("Cancel", "Ghairi")}
        keyboardType="url"
        autoCapitalize="none"
        onCancel={() => setLinkPrompt(false)}
        onConfirm={(url) => {
          setLinkPrompt(false);
          if (url) setAttachments((prev) => [...prev, linkAttachment(url)]);
        }}
      />
    </View>
  );
}
