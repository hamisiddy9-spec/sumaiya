import React, { useState, useEffect } from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from "react-native";
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { X, CheckCircle2 } from "lucide-react-native";
import { haptics } from "./ui/haptics";
import { useThemeColors } from "./ui/theme";
import { Button } from "./ui/button";
import { useLang } from "../lib/i18n";

interface OutcomeReportModalProps {
  visible: boolean;
  cvId: string;
  onClose: () => void;
  onSubmit: (data: {
    outcome: string;
    companyName: string;
    jobTitle: string;
    aiHelpfulRating: number;
    feedbackText: string;
  }) => void | Promise<void>;
}

const OUTCOME_OPTIONS = [
  { value: "interview", labelEn: "Got an interview", labelSw: "Nilipata mahojiano" },
  { value: "offer", labelEn: "Got an offer", labelSw: "Nilipata ajira" },
  { value: "rejection", labelEn: "Got rejected", labelSw: "Nilikataliwa" },
  { value: "not_sent", labelEn: "Didn't send", labelSw: "Sikutuma" },
  { value: "none_yet", labelEn: "No response yet", labelSw: "Hakuna jibu bado" },
];

const RATING_OPTIONS = [
  { value: 1, label: "😞" },
  { value: 2, label: "😐" },
  { value: 3, label: "🙂" },
  { value: 4, label: "😊" },
  { value: 5, label: "🤩" },
];

export function OutcomeReportModal({ visible, cvId, onClose, onSubmit }: OutcomeReportModalProps) {
  const c = useThemeColors();
  const { width, height } = useWindowDimensions();
  const { lang, t } = useLang();
  const isSw = lang === "sw";

  const [mounted, setMounted] = useState(visible);
  const [selectedOutcome, setSelectedOutcome] = useState<string>("none_yet");
  const [selectedRating, setSelectedRating] = useState<number>(3);
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [feedbackText, setFeedbackText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const progress = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      progress.value = withTiming(1, { duration: 180, easing: Easing.out(Easing.cubic) });
    } else if (mounted) {
      progress.value = withTiming(0, { duration: 140 }, (done) => {
        if (done) runOnJS(setMounted)(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const backdrop = useAnimatedStyle(() => ({ opacity: progress.value }));
  const card = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.94 + progress.value * 0.06 }],
  }));

  const handleSubmit = async () => {
    haptics.selection();
    setIsSubmitting(true);
    try {
      await onSubmit({
        outcome: selectedOutcome,
        companyName: companyName.trim(),
        jobTitle: jobTitle.trim(),
        aiHelpfulRating: selectedRating,
        feedbackText: feedbackText.trim(),
      });
    } catch (err) {
      console.error("Outcome submission error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) return null;

  return (
    <Modal transparent visible={mounted} onRequestClose={onClose} animationType="none" statusBarTranslucent>
      <Animated.View
        style={[backdrop, { width, height, backgroundColor: c.overlay, alignItems: "center", justifyContent: "flex-end", padding: 16 }]}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />

        <Animated.View
          style={[
            card,
            {
              width: "100%",
              backgroundColor: c.bgElevated,
              borderRadius: 20,
              paddingHorizontal: 20,
              paddingTop: 20,
              paddingBottom: 24,
              borderWidth: 1,
              borderColor: c.border,
              maxHeight: "85%",
            },
          ]}
        >
          {/* Header */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <Text style={{ color: c.text, fontSize: 18, fontWeight: "800" }}>
              {isSw ? "Je, CV hiyo ilisaidia?" : "Did this CV help?"}
            </Text>
            <Pressable onPress={onClose} style={{ padding: 8 }}>
              <X size={20} color={c.textMuted} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} scrollIndicatorInsets={{ right: 1 }}>
            {/* Outcome Selection */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: c.text, fontSize: 13, fontWeight: "700", marginBottom: 10 }}>
                {isSw ? "Nini kilitokeana?" : "What happened?"}
              </Text>
              {OUTCOME_OPTIONS.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    haptics.selection();
                    setSelectedOutcome(option.value);
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 12,
                    paddingHorizontal: 12,
                    marginBottom: 8,
                    borderRadius: 12,
                    backgroundColor:
                      selectedOutcome === option.value ? `${c.accent}15` : `${c.border}30`,
                    borderWidth: selectedOutcome === option.value ? 2 : 1,
                    borderColor: selectedOutcome === option.value ? c.accent : c.border,
                  }}
                >
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      borderWidth: 2,
                      borderColor: selectedOutcome === option.value ? c.accent : c.textMuted,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 10,
                    }}
                  >
                    {selectedOutcome === option.value && (
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.accent }} />
                    )}
                  </View>
                  <Text style={{ color: c.text, fontSize: 14, fontWeight: "500" }}>
                    {isSw ? option.labelSw : option.labelEn}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Company and Job Title */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: c.text, fontSize: 13, fontWeight: "700", marginBottom: 8 }}>
                {isSw ? "Jina la kampuni (kwa aختiyariy)" : "Company name (optional)"}
              </Text>
              <TextInput
                placeholder={isSw ? "Mpr. Safaricom" : "E.g., Safaricom"}
                placeholderTextColor={c.textMuted}
                value={companyName}
                onChangeText={setCompanyName}
                style={{
                  borderWidth: 1,
                  borderColor: c.border,
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  color: c.text,
                  backgroundColor: c.bgElevated,
                  fontSize: 14,
                }}
              />
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: c.text, fontSize: 13, fontWeight: "700", marginBottom: 8 }}>
                {isSw ? "Cheo (kwa aختiyariy)" : "Job title (optional)"}
              </Text>
              <TextInput
                placeholder={isSw ? "Mpr. Software Engineer" : "E.g., Software Engineer"}
                placeholderTextColor={c.textMuted}
                value={jobTitle}
                onChangeText={setJobTitle}
                style={{
                  borderWidth: 1,
                  borderColor: c.border,
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  color: c.text,
                  backgroundColor: c.bgElevated,
                  fontSize: 14,
                }}
              />
            </View>

            {/* Rating */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: c.text, fontSize: 13, fontWeight: "700", marginBottom: 10 }}>
                {isSw ? "Je, CV ilisaidia?" : "Was the CV helpful?"}
              </Text>
              <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
                {RATING_OPTIONS.map((rating) => (
                  <Pressable
                    key={rating.value}
                    onPress={() => {
                      haptics.selection();
                      setSelectedRating(rating.value);
                    }}
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 12,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor:
                        selectedRating === rating.value ? `${c.accent}15` : `${c.border}30`,
                      borderWidth: selectedRating === rating.value ? 2 : 1,
                      borderColor: selectedRating === rating.value ? c.accent : c.border,
                    }}
                  >
                    <Text style={{ fontSize: 28 }}>{rating.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Feedback Text */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{ color: c.text, fontSize: 13, fontWeight: "700", marginBottom: 8 }}>
                {isSw ? "Maoni yako (kwa aختiyariy)" : "Your feedback (optional)"}
              </Text>
              <TextInput
                placeholder={isSw ? "Sema nini kilichoonekana vizuri, nini kisichofanya kazi..." : "Tell us what went well, what could improve..."}
                placeholderTextColor={c.textMuted}
                value={feedbackText}
                onChangeText={setFeedbackText}
                maxLength={500}
                multiline
                numberOfLines={4}
                style={{
                  borderWidth: 1,
                  borderColor: c.border,
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  color: c.text,
                  backgroundColor: c.bgElevated,
                  fontSize: 14,
                  textAlignVertical: "top",
                }}
              />
              <Text style={{ color: c.textMuted, fontSize: 11, marginTop: 4, textAlign: "right" }}>
                {feedbackText.length}/500
              </Text>
            </View>

            {/* Buttons */}
            <View style={{ gap: 8 }}>
              <Button
                label={isSw ? "Tuma matokeo" : "Submit feedback"}
                onPress={handleSubmit}
                disabled={isSubmitting}
                loading={isSubmitting}
              />
              <Button
                label={isSw ? "Tatanga" : "Skip"}
                onPress={onClose}
                disabled={isSubmitting}
                variant="secondary"
              />
            </View>
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
