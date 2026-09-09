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
import { useSumaiyaChat } from "../hooks/use-sumaiya-chat";
import { ChatMessageComponent } from "../components/chat/chat-message";
import { QuickActionsGrid } from "../components/chat/quick-actions-grid";
import { ChatComposer } from "../components/chat/chat-composer";
import { INITIAL_QUICK_ACTIONS } from "../components/chat/chat-types";
import type { ActionType, Attachment } from "../components/chat/chat-types";
import type { AttachKind } from "../components/chat/attach-sheet";
import { Icon } from "../components/icon";
import { SumaiyaMark } from "../components/sumaiya-mark";
import { useSpeech } from "../lib/speech";
import { useLang, greetingFor } from "../lib/i18n";
import { resolveAttachment, linkAttachment } from "../lib/attachments";
import { haptics, useThemeColors } from "../components/ui";

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

export function SumaiyaChatScreen({ navigation, route }: any) {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const { messages, loading, error, sendMessage, clearChat, fetchLearningResources } = useSumaiyaChat();
  const { lang, t } = useLang();
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
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
      Alert.prompt?.(
        t("Paste the job link", "Bandika kiungo cha kazi"),
        t("Sumaiya will read the job description.", "Sumaiya atasoma maelezo ya kazi."),
        (url?: string) => {
          if (url && url.trim()) setAttachments((prev) => [...prev, linkAttachment(url)]);
        },
      );
      // Android has no Alert.prompt — fall back to a chat hint.
      if (Platform.OS === "android") {
        setInput((v) => (v ? v : t("Here's a job link: ", "Hiki hapa kiungo cha kazi: ")));
        inputRef.current?.focus();
      }
      return;
    }
    if (kind === "myDoc") {
      // Attaching one of your own CVs as context needs the CV list to expose a
      // picker mode + the import endpoint — tracked for the Profile/Applications
      // phase. For now, point the user at the ask.
      setInput((v) => v || t("Use my CV \"", "Tumia CV yangu \""));
      inputRef.current?.focus();
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
      "cv-builder": t(
        "I want to build a new CV. Ask me what you need to get started.",
        "Nataka kutengeneza CV mpya. Niulize unachohitaji ili tuanze.",
      ),
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
      case "edit-cv":
        if (data?.section === "jobs") {
          navigation.navigate("HomeTab", { screen: "HomeMain" });
        } else {
          navigation.navigate("CVsTab", { screen: "CvEditor" });
        }
        break;
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
            backgroundColor: "#7c3aed",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <SumaiyaMark size={19} color="#fff" state={loading ? "thinking" : "idle"} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.text, fontSize: 16, fontWeight: "700" }}>Sumaiya</Text>
          <Text style={{ color: c.textMuted, fontSize: 12 }}>
            {t("Your AI career assistant", "Msaidizi wako wa AI wa kazi")}
          </Text>
        </View>
        {!empty && speech.supported && lastReply ? (
          <Pressable
            hitSlop={10}
            onPress={() => {
              haptics.selection();
              speech.speaking ? speech.stop() : speech.speak(lastReply);
            }}
            accessibilityLabel={speech.speaking ? "Stop reading" : "Read Sumaiya's reply aloud"}
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
                <ChatMessageComponent message={m} onActionPress={onAction} loading={loading} />
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

        <ChatComposer
          value={input}
          onChangeText={setInput}
          onSend={send}
          loading={loading}
          attachments={attachments}
          onAttach={onAttach}
          onRemoveAttachment={(id) => setAttachments((prev) => prev.filter((a) => a.id !== id))}
          inputRef={inputRef}
        />
      </KeyboardAvoidingView>
    </View>
  );
}
