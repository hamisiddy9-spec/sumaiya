import React, { useCallback, useState } from "react";
import { ScrollView, Text, TextInput, View, Pressable, Switch, useWindowDimensions } from "react-native";
import { Mail, AlertCircle } from "lucide-react-native";
import { Screen, Button, TextField, useThemeColors, haptics } from "../components/ui";
import { useLang } from "../lib/i18n";
import { apiClient } from "../lib/api-client";
import { track } from "../lib/analytics";
import { reportError } from "../lib/reporting";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AppTabsParamList } from "../navigation/types";

type Props = NativeStackScreenProps<AppTabsParamList, "SendToRecruiter">;

export function SendToRecruiterScreen({ route, navigation }: Props) {
  const c = useThemeColors();
  const { t, lang } = useLang();
  const { cvId } = route.params || {};
  const isSw = lang === "sw";

  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [includeTrackingPixel, setIncludeTrackingPixel] = useState(true);
  const [saveToProfile, setSaveToProfile] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleEmailChange = (email: string) => {
    setRecipientEmail(email);
    if (email && !validateEmail(email)) {
      setEmailError(isSw ? "Barua pepe si sahihi" : "Invalid email address");
    } else {
      setEmailError(null);
    }
  };

  const handleSubmit = async () => {
    setError(null);

    if (!recipientEmail) {
      setError(isSw ? "Ingiza barua pepe ya mkipokezi" : "Please enter recipient email");
      return;
    }

    if (!validateEmail(recipientEmail)) {
      setError(isSw ? "Barua pepe si sahihi" : "Invalid email address");
      return;
    }

    setIsSubmitting(true);
    haptics.selection();
    try {
      await apiClient.sendCVToRecruiter({
        recipientEmail: recipientEmail.trim(),
        recipientName: recipientName.trim(),
        customMessage: customMessage.trim(),
        jobTitle: jobTitle.trim(),
        company: company.trim(),
        jobDescription: jobDescription.trim(),
        cvId: cvId || "",
        includeTrackingPixel,
        saveToProfile,
      });

      haptics.success();
      track("cv_sent_to_recruiter", {
        recipientEmail,
        cvId,
      });

      // Show success and navigate back
      navigation.goBack();
    } catch (err) {
      haptics.error();
      setError(
        err instanceof Error ? err.message : (isSw ? "Kosa fulani limetokea" : "An error occurred")
      );
      reportError(err);
      track("send_cv_error", {
        error: err instanceof Error ? err.message : "unknown",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen
      footer={
        <View style={{ gap: 10 }}>
          {error && (
            <View
              style={{
                backgroundColor: c.error + "15",
                borderRadius: 10,
                borderWidth: 1,
                borderColor: c.error,
                padding: 12,
                flexDirection: "row",
                gap: 8,
              }}
            >
              <AlertCircle size={18} color={c.error} style={{ marginTop: 2 }} />
              <Text style={{ color: c.error, fontSize: 13, flex: 1, fontWeight: "500" }}>
                {error}
              </Text>
            </View>
          )}
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Button
              label={isSw ? "Batilisha" : "Cancel"}
              variant="secondary"
              onPress={() => navigation.goBack()}
              disabled={isSubmitting}
              style={{ flex: 1 }}
            />
            <Button
              label={isSw ? "Tuma CV" : "Send CV"}
              onPress={handleSubmit}
              disabled={isSubmitting}
              loading={isSubmitting}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      }
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            backgroundColor: c.accent + "15",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Mail size={20} color={c.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.text, fontSize: 18, fontWeight: "800" }}>
            {isSw ? "Tuma kwa Mtu wa Ajira" : "Send to Recruiter"}
          </Text>
          <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 2 }}>
            {isSw ? "Tuma CV yako moja kwa moja kwa mjumbe" : "Send your CV directly to a recruiter"}
          </Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} scrollIndicatorInsets={{ right: 1 }}>
        {/* Recipient Email */}
        <Text style={{ color: c.text, fontSize: 13, fontWeight: "700", marginBottom: 8 }}>
          {isSw ? "Barua pepe ya mkipokezi *" : "Recipient Email *"}
        </Text>
        <TextInput
          placeholder={isSw ? "mjumbe@kampuni.com" : "recruiter@company.com"}
          placeholderTextColor={c.textMuted}
          value={recipientEmail}
          onChangeText={handleEmailChange}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!isSubmitting}
          style={{
            borderWidth: 1,
            borderColor: emailError ? c.error : c.border,
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
            color: c.text,
            backgroundColor: c.bgDefault,
            fontSize: 14,
            marginBottom: emailError ? 6 : 16,
          }}
        />
        {emailError && (
          <Text style={{ color: c.error, fontSize: 11, marginBottom: 12 }}>
            {emailError}
          </Text>
        )}

        {/* Recipient Name */}
        <Text style={{ color: c.text, fontSize: 13, fontWeight: "700", marginBottom: 8 }}>
          {isSw ? "Jina la mkipokezi (kwa aختiyariy)" : "Recipient Name (optional)"}
        </Text>
        <TextInput
          placeholder={isSw ? "Mpr. Ahmed" : "E.g., Ahmed"}
          placeholderTextColor={c.textMuted}
          value={recipientName}
          onChangeText={setRecipientName}
          editable={!isSubmitting}
          style={{
            borderWidth: 1,
            borderColor: c.border,
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
            color: c.text,
            backgroundColor: c.bgDefault,
            fontSize: 14,
            marginBottom: 16,
          }}
        />

        {/* Job Context Header */}
        <Text style={{ color: c.text, fontSize: 11, fontWeight: "700", marginBottom: 10, letterSpacing: 0.5, opacity: 0.6, textTransform: "uppercase" }}>
          {isSw ? "Muktadha wa Kazi (kwa aختiyariy)" : "Job Context (optional)"}
        </Text>

        {/* Job Title */}
        <TextInput
          placeholder={isSw ? "Mpr. Software Engineer" : "E.g., Software Engineer"}
          placeholderTextColor={c.textMuted}
          value={jobTitle}
          onChangeText={setJobTitle}
          editable={!isSubmitting}
          style={{
            borderWidth: 1,
            borderColor: c.border,
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
            color: c.text,
            backgroundColor: c.bgDefault,
            fontSize: 14,
            marginBottom: 10,
          }}
        />

        {/* Company */}
        <TextInput
          placeholder={isSw ? "Mpr. Safaricom" : "E.g., Safaricom"}
          placeholderTextColor={c.textMuted}
          value={company}
          onChangeText={setCompany}
          editable={!isSubmitting}
          style={{
            borderWidth: 1,
            borderColor: c.border,
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
            color: c.text,
            backgroundColor: c.bgDefault,
            fontSize: 14,
            marginBottom: 10,
          }}
        />

        {/* Job Description */}
        <TextInput
          placeholder={
            isSw
              ? "Andika kazi inahitaji (JD) kwa muktadha..."
              : "Paste job description for context..."
          }
          placeholderTextColor={c.textMuted}
          value={jobDescription}
          onChangeText={(text) => setJobDescription(text.slice(0, 1000))}
          multiline
          numberOfLines={4}
          editable={!isSubmitting}
          style={{
            borderWidth: 1,
            borderColor: c.border,
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
            color: c.text,
            backgroundColor: c.bgDefault,
            fontSize: 14,
            marginBottom: 4,
            textAlignVertical: "top",
          }}
        />
        <Text style={{ color: c.textMuted, fontSize: 11, marginBottom: 16, textAlign: "right" }}>
          {jobDescription.length}/1000
        </Text>

        {/* Custom Message */}
        <Text style={{ color: c.text, fontSize: 13, fontWeight: "700", marginBottom: 8 }}>
          {isSw ? "Ujumbe wa zaidi (kwa aختiyariy)" : "Custom Message (optional)"}
        </Text>
        <TextInput
          placeholder={
            isSw
              ? "Andika ujumbe wako wa mtu binafsi hapa..."
              : "Hi [Name], I'm applying for the [Role] position..."
          }
          placeholderTextColor={c.textMuted}
          value={customMessage}
          onChangeText={(text) => setCustomMessage(text.slice(0, 500))}
          multiline
          numberOfLines={4}
          editable={!isSubmitting}
          style={{
            borderWidth: 1,
            borderColor: c.border,
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
            color: c.text,
            backgroundColor: c.bgDefault,
            fontSize: 14,
            marginBottom: 4,
            textAlignVertical: "top",
          }}
        />
        <Text style={{ color: c.textMuted, fontSize: 11, marginBottom: 16, textAlign: "right" }}>
          {customMessage.length}/500
        </Text>

        {/* Advanced Options */}
        <View style={{ borderTopWidth: 1, borderTopColor: c.border, paddingTop: 16, marginBottom: 16 }}>
          <Text
            style={{
              color: c.text,
              fontSize: 11,
              fontWeight: "700",
              marginBottom: 12,
              letterSpacing: 0.5,
              opacity: 0.6,
              textTransform: "uppercase",
            }}
          >
            {isSw ? "Chaguo Jingine" : "Advanced Options"}
          </Text>

          {/* Track Email Opens */}
          <Pressable
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: 12,
              paddingHorizontal: 12,
              backgroundColor: c.bgElevated,
              borderRadius: 10,
              marginBottom: 10,
            }}
            onPress={() => {
              haptics.selection();
              setIncludeTrackingPixel(!includeTrackingPixel);
            }}
            disabled={isSubmitting}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.text, fontSize: 13, fontWeight: "600" }}>
                {isSw ? "Fuatilia kama barua pepe ilifunguka" : "Track email opens"}
              </Text>
              <Text style={{ color: c.textMuted, fontSize: 11, marginTop: 2 }}>
                {isSw ? "Jua kama mjumbe alibukuwa ujumbe wako" : "Know if recruiter opened your email"}
              </Text>
            </View>
            <Switch
              value={includeTrackingPixel}
              onValueChange={setIncludeTrackingPixel}
              disabled={isSubmitting}
              trackColor={{ false: c.border, true: c.accent + "80" }}
            />
          </Pressable>

          {/* Save to Profile */}
          <Pressable
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: 12,
              paddingHorizontal: 12,
              backgroundColor: c.bgElevated,
              borderRadius: 10,
            }}
            onPress={() => {
              haptics.selection();
              setSaveToProfile(!saveToProfile);
            }}
            disabled={isSubmitting}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.text, fontSize: 13, fontWeight: "600" }}>
                {isSw ? "Hifadhi mkipokezi katika wajarida" : "Save recruiter to contacts"}
              </Text>
              <Text style={{ color: c.textMuted, fontSize: 11, marginTop: 2 }}>
                {isSw
                  ? "Tumia tena baru/tarehe ya mjumbe baadaye"
                  : "Quickly contact this recruiter again"}
              </Text>
            </View>
            <Switch
              value={saveToProfile}
              onValueChange={setSaveToProfile}
              disabled={isSubmitting}
              trackColor={{ false: c.border, true: c.accent + "80" }}
            />
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}
