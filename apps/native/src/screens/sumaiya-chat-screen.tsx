import React, { useEffect, useRef, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  Easing,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { offlineStorage } from "@sumaiya/utils";
import { apiClient } from "../lib/api-client";
import { useCvs } from "../hooks/use-cvs";
import { useSumaiyaChat } from "../hooks/use-sumaiya-chat";
import { ChatMessageComponent } from "../components/chat/chat-message";
import { AttachmentPreviewSheet } from "../components/chat/attachment-preview-sheet";
import { AttachSheet } from "../components/chat/attach-sheet";
import { QuickActionsGrid } from "../components/chat/quick-actions-grid";
import { ChatComposer } from "../components/chat/chat-composer";
import { INITIAL_QUICK_ACTIONS } from "../components/chat/chat-types";
import type { CVData } from "@sumaiya/types";
import type { ActionType, Attachment } from "../components/chat/chat-types";
import type { AttachKind } from "../components/chat/attach-sheet";
import { Icon } from "../components/icon";
import { SumaiyaMark } from "../components/sumaiya-mark";
import { useSpeech } from "../lib/speech";
import { useLang, greetingFor } from "../lib/i18n";
import { resolveAttachment, linkAttachment } from "../lib/attachments";
import { haptics, useThemeColors, PromptModal } from "../components/ui";
import type { SumaiyaChatScreenProps } from "../navigation/types";

function TypingDot({ i }: { i: number }) {
  const c = useThemeColors();
  const v = useSharedValue(0.4);
  useEffect(() => {
    v.value = withDelay(
      i * 140,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 350, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.4, { duration: 350, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
      ),
    );
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: v.value, transform: [{ scale: 0.8 + v.value * 0.2 }] }));
  return <Animated.View style={[style, { width: 7, height: 7, borderRadius: 4, backgroundColor: c.textMuted }]} />;
}

export function SumaiyaChatScreen({ navigation, route }: SumaiyaChatScreenProps) {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const { messages, loading, error, sendMessage, clearChat, fetchLearningResources, buildCvFromChat, buildingCv } =
    useSumaiyaChat();
  const { cvs } = useCvs();
  const { lang, t } = useLang();
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [preview, setPreview] = useState<Attachment | null>(null);
  const [linkPrompt, setLinkPrompt] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

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

  useEffect(() => {
    if (messages.length) setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if ((!text && attachments.length === 0) || loading) return;
    haptics.light();
    const atts = attachments;
    setInput("");
    setAttachments([]);
    await sendMessage(text, { attachments: atts });
  };

  const onAttach = async (kind: AttachKind) => {
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
      Alert.alert(
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
      const picked = await resolveAttachment(kind);
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
        "Nisaidie kuandika barua ya maombi kwa kazi ninayoomba.",
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
          navigation.navigate("HomeTab", { screen: "JobApply" });
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
        clearChat();
        break;
    }
  };

  // Persist a CV Sumaiya built in the chat — straight to the local store + a
  // best-effort server push. No trip through the editor needed.
  const saveCvFromChat = async (cvData: CVData, template: string) => {
    const now = new Date();
    const cv = {
      id: `cv-${Date.now()}`,
      userId: "me",
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
      /* offline / will reconcile — it's in the local store */
    }
  };

  // Offer to build once the user has actually told Sumaiya something, and only
  // until a CV has been produced in this thread.
  const substantiveUserTurns = messages.filter((m) => m.author === "user" && m.content.trim().length > 12).length;
  const alreadyBuilt = messages.some((m) => m.type === "cv-ready");
  const showBuildBar = !empty && substantiveUserTurns >= 2 && !alreadyBuilt;

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
          <Pressable hitSlop={10} onPress={() => navigation.goBack()}>
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
            accessibilityLabel={speech.speaking ? t("Stop reading", "Acha kusoma") : t("Read aloud", "Soma kwa sauti")}
          >
            <Icon name={speech.speaking ? "volume-x" : "volume-2"} size={18} color={speech.speaking ? c.accent : c.textMuted} />
          </Pressable>
        ) : null}
        {!empty ? (
          <Pressable hitSlop={10} onPress={() => { haptics.selection(); speech.stop(); clearChat(); }}>
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
        >
          {empty ? (
            <Animated.View entering={FadeInUp.duration(320)} style={{ flex: 1, paddingTop: 12 }}>
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
                <Text style={{ color: c.textBody, fontSize: 14, lineHeight: 21 }}>
                  {greetingFor(lang)}
                </Text>
              </View>
              <QuickActionsGrid actions={INITIAL_QUICK_ACTIONS} onSelect={(a) => onInitialAction(a.id)} loading={loading} />
            </Animated.View>
          ) : (
            messages.map((m) => (
              <Animated.View key={m.id} entering={FadeInUp.duration(260)}>
                <ChatMessageComponent
                  message={m}
                  onActionPress={onAction}
                  loading={loading}
                  onPreviewAttachment={setPreview}
                  onOpenCvEditor={(cv) =>
                    navigation.navigate("CVsTab", { screen: "CvEditor", params: { initialData: cv } })
                  }
                  onSaveCv={saveCvFromChat}
                />
              </Animated.View>
            ))
          )}

          {loading ? (
            <View
              style={{
                flexDirection: "row",
                gap: 5,
                alignSelf: "flex-start",
                backgroundColor: c.bgElevated,
                borderWidth: 1,
                borderColor: c.border,
                borderRadius: 16,
                borderBottomLeftRadius: 4,
                paddingHorizontal: 14,
                paddingVertical: 12,
                marginTop: 6,
              }}
            >
              <TypingDot i={0} />
              <TypingDot i={1} />
              <TypingDot i={2} />
            </View>
          ) : null}

          {error ? (
            <View
              style={{
                flexDirection: "row",
                gap: 8,
                backgroundColor: c.error + "18",
                borderColor: c.error + "40",
                borderWidth: 1,
                borderRadius: 12,
                padding: 11,
                marginTop: 10,
              }}
            >
              <Icon name="alert-circle" size={16} color={c.error} />
              <Text style={{ flex: 1, color: c.error, fontSize: 13 }}>{error}</Text>
            </View>
          ) : null}
        </ScrollView>

        {showBuildBar ? (
          <Pressable
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
              backgroundColor: c.accent,
              opacity: buildingCv ? 0.7 : 1,
            }}
          >
            <SumaiyaMark size={16} color={c.accentText} state={buildingCv ? "thinking" : "static"} />
            <Text style={{ color: c.accentText, fontSize: 14, fontWeight: "800" }}>
              {buildingCv ? t("Building your CV…", "Inatengeneza CV yako…") : t("Build my CV from this chat", "Tengeneza CV yangu kutoka mazungumzo haya")}
            </Text>
          </Pressable>
        ) : null}

        <ChatComposer
          value={input}
          onChangeText={setInput}
          onSend={send}
          loading={loading}
          attachments={attachments}
          onAttach={onAttach}
          onOpenAttach={() => setAttachOpen(true)}
          onRemoveAttachment={(id) => setAttachments((prev) => prev.filter((a) => a.id !== id))}
          inputRef={inputRef}
        />
      </KeyboardAvoidingView>

      <AttachmentPreviewSheet attachment={preview} onClose={() => setPreview(null)} />

      <AttachSheet
        visible={attachOpen}
        onClose={() => setAttachOpen(false)}
        onPick={(kind) => onAttach(kind)}
      />

      <PromptModal
        visible={linkPrompt}
        title={t("Paste the job link", "Bandika link ya kazi")}
        message={t("Sumaiya will read the job description.", "Sumaiya atasoma maelezo ya kazi.")}
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
