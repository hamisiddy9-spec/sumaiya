import React from "react";
import { Image, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeOut, Layout } from "react-native-reanimated";
import { Icon } from "../icon";
import { haptics, useThemeColors } from "../ui";
import { useLang } from "../../lib/i18n";
import { type AttachKind } from "./attach-sheet";
import type { Attachment } from "./chat-types";

interface Props {
  value: string;
  onChangeText: (t: string) => void;
  onSend: () => void;
  loading: boolean;
  attachments: Attachment[];
  onAttach: (kind: AttachKind) => void;
  onOpenAttach: () => void;
  onRemoveAttachment: (id: string) => void;
  inputRef?: React.RefObject<TextInput | null>;
}

function Chip({ att, onRemove }: { att: Attachment; onRemove: () => void }) {
  const c = useThemeColors();
  const isImg = att.kind === "image";
  return (
    <Animated.View
      entering={FadeIn.duration(160)}
      exiting={FadeOut.duration(120)}
      layout={Layout.springify().damping(18).stiffness(200)}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 7,
        paddingVertical: 5,
        paddingLeft: isImg ? 5 : 10,
        paddingRight: 6,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: att.status === "error" ? c.error + "66" : c.border,
        backgroundColor: att.status === "error" ? c.error + "14" : c.bg,
        maxWidth: 200,
      }}
    >
      {isImg ? (
        <Image source={{ uri: att.uri }} style={{ width: 26, height: 26, borderRadius: 6 }} />
      ) : (
        <Icon
          name={att.kind === "link" ? "link" : att.kind === "cv" ? "briefcase" : "file-text"}
          size={15}
          color={att.status === "error" ? c.error : c.accent}
        />
      )}
      <Text numberOfLines={1} style={{ flex: 1, color: c.textBody, fontSize: 12 }}>
        {att.name}
      </Text>
      <Pressable hitSlop={8} onPress={onRemove}>
        <Icon name="x" size={13} color={c.textMuted} />
      </Pressable>
    </Animated.View>
  );
}

/**
 * The Sumaiya chat composer: a [+] attach control (photos, files, links, your
 * own CVs), attachment chips above the field, and send. Modeled on the ChatGPT
 * / Claude mobile composer users already know.
 *
 * TODO: voice input ("tap > speak > type" is core to the low-literacy brief).
 * Needs a native STT module + a rebuild — see NIGHT_LOG.md.
 */
export function ChatComposer({
  value,
  onChangeText,
  onSend,
  loading,
  attachments,
  onAttach,
  onOpenAttach,
  onRemoveAttachment,
  inputRef,
}: Props) {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const { t } = useLang();

  const canSend = (value.trim().length > 0 || attachments.length > 0) && !loading;

  return (
    <>
      <View
        style={{
          paddingHorizontal: 12,
          paddingTop: attachments.length ? 8 : 10,
          paddingBottom: insets.bottom + 10,
          borderTopWidth: 1,
          borderTopColor: c.border,
          backgroundColor: c.bgElevated,
          gap: 8,
        }}
      >
        {attachments.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 12 }}>
            {attachments.map((a) => (
              <Chip key={a.id} att={a} onRemove={() => onRemoveAttachment(a.id)} />
            ))}
          </ScrollView>
        )}

        <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8 }}>
          <Pressable
            onPress={() => {
              haptics.light();
              onOpenAttach();
            }}
            accessibilityLabel={t("Add photo or file", "Ongeza picha au faili")}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: c.accent + "16",
            }}
          >
            <Icon name="plus" size={21} color={c.accent} />
          </Pressable>

          <TextInput
            ref={inputRef}
            value={value}
            onChangeText={onChangeText}
            placeholder={t("Message me…", "Niandikie…")}
            placeholderTextColor={c.textMuted}
            selectionColor={c.accent}
            editable={!loading}
            multiline
            // Enter must NEVER send. Most people type a job advert or a paragraph
            // into this box, and losing a half-written message to a stray Return
            // is worse than one extra tap — sending is the button's job alone.
            // `submitBehavior` is the RN 0.86 replacement for blurOnSubmit.
            submitBehavior="newline"
            returnKeyType="default"
            maxLength={2000}
            style={{
              flex: 1,
              maxHeight: 120,
              minHeight: 40,
              backgroundColor: c.bg,
              borderWidth: 1,
              borderColor: c.border,
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingTop: 10,
              paddingBottom: 10,
              fontSize: 15,
              color: c.text,
            }}
          />

          <Pressable
            onPress={() => {
              if (!canSend) return;
              haptics.light();
              onSend();
            }}
            disabled={!canSend}
            accessibilityLabel={t("Send", "Tuma")}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: canSend ? c.accent : c.border,
            }}
          >
            <Icon name="arrow-up" size={19} color={canSend ? c.accentText : c.textMuted} />
          </Pressable>
        </View>
      </View>
    </>
  );
}
