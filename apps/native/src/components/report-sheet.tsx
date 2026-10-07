import React, { useCallback, useEffect, useRef, useState } from "react";
import { Modal, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { Icon } from "./icon";
import { Button, TextField, haptics, useThemeColors } from "./ui";
import { apiClient } from "../lib/api-client";
import { APP_VERSION } from "../lib/app-version";
import { currentInstallId, deviceLabel } from "../lib/telemetry";
import { getLogEntries } from "../lib/log-buffer";
import { captureAppScreenshot } from "../lib/screenshot";
import { getLastKnownLang } from "../lib/i18n";

/**
 * User-initiated problem report — consent first, always.
 *
 * Reachable from two places that have very different guarantees:
 *   - Profile/Settings, a normal screen inside every provider.
 *   - `error-boundary.tsx`'s crash screen, which by definition has just
 *     unmounted everything below it — including LangProvider.
 *
 * So, like `error-boundary.tsx` itself, this component is deliberately
 * dependency-light: it reads the language with the plain `getLastKnownLang()`
 * function (not the `useLang()` hook) and is mounted in `_layout.tsx` as a
 * SIBLING of `<ErrorBoundary>`, not inside it — a crash below it must not take
 * this down with it, or the crash screen's own "Report a problem" button would
 * have nothing to open.
 *
 * The imperative `reportSheet.open()` / listener pair mirrors `dialog.tsx` and
 * `toast.tsx`: a plain module handle any component (or a class component with
 * no hooks, like the error boundary) can call without needing this component
 * as an ancestor.
 */

export type ReportKind = "crash" | "problem" | "idea";

type Listener = (open: boolean, kind: ReportKind) => void;

let listener: Listener | null = null;

export const reportSheet = {
  open(kind: ReportKind = "problem") {
    listener?.(true, kind);
  },
  /** @internal used by ReportSheetHost */
  _subscribe(l: Listener | null) {
    listener = l;
  },
};

/** Local bilingual pick, independent of LangProvider — see file header. */
function tt(en: string, sw: string): string {
  try {
    return getLastKnownLang() === "sw" ? sw : en;
  } catch {
    return en;
  }
}

type Step = "consent" | "sending" | "done" | "error";

function ConsentRow({
  icon,
  label,
  sublabel,
  checked,
  onToggle,
  locked,
}: {
  icon: string;
  label: string;
  sublabel: string;
  checked: boolean;
  onToggle?: () => void;
  locked?: boolean;
}) {
  const c = useThemeColors();
  return (
    <Pressable
      onPress={onToggle}
      disabled={!onToggle}
      accessibilityRole={onToggle ? "checkbox" : undefined}
      accessibilityState={onToggle ? { checked } : undefined}
      style={{ flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 10 }}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          borderWidth: 1.5,
          borderColor: checked ? c.accent : c.borderStrong,
          backgroundColor: checked ? c.accentFill : "transparent",
          alignItems: "center",
          justifyContent: "center",
          marginTop: 1,
        }}
      >
        {checked ? <Icon name="check" size={14} color={c.accentText} /> : null}
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Icon name={icon} size={15} color={c.textMuted} />
          <Text style={{ color: c.text, fontSize: 14.5, fontWeight: "700" }}>{label}</Text>
          {locked ? (
            <Text style={{ color: c.textMuted, fontSize: 11 }}>{tt("(always included)", "(inatumwa kila wakati)")}</Text>
          ) : null}
        </View>
        <Text style={{ color: c.textMuted, fontSize: 12.5, marginTop: 2, lineHeight: 17 }}>{sublabel}</Text>
      </View>
    </Pressable>
  );
}

export function ReportSheetHost() {
  const c = useThemeColors();
  const [visible, setVisible] = useState(false);
  const [kind, setKind] = useState<ReportKind>("problem");
  const [step, setStep] = useState<Step>("consent");
  const [note, setNote] = useState("");
  const [includeScreenshot, setIncludeScreenshot] = useState(true);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [logCount, setLogCount] = useState(0);
  const openSeq = useRef(0);

  useEffect(() => {
    reportSheet._subscribe((open, k) => {
      if (!open) return;
      const seq = ++openSeq.current;
      setKind(k);
      setStep("consent");
      setNote("");
      setIncludeScreenshot(true);
      setScreenshot(null);
      setLogCount(getLogEntries().length);
      setCapturing(true);
      setVisible(true);
      captureAppScreenshot().then((shot) => {
        if (openSeq.current !== seq) return; // sheet was closed/reopened meanwhile
        setScreenshot(shot);
        setCapturing(false);
        if (!shot) setIncludeScreenshot(false);
      });
    });
    return () => reportSheet._subscribe(null);
  }, []);

  const close = useCallback(() => {
    openSeq.current++; // invalidate any in-flight capture
    setVisible(false);
  }, []);

  const send = useCallback(async () => {
    setStep("sending");
    haptics.light();
    const entries = getLogEntries();
    const res = await apiClient.postAppReport({
      installId: currentInstallId() ?? "unknown",
      kind,
      note: note.trim() ? note.trim() : undefined,
      screenshot: includeScreenshot ? (screenshot ?? undefined) : undefined,
      logs: entries.map((e) => ({ at: e.at, kind: e.kind, name: e.name, detail: e.detail })),
      appVersion: APP_VERSION,
      platform: Platform.OS,
      device: deviceLabel(),
    });
    if (res.ok) {
      haptics.success();
      setStep("done");
    } else {
      haptics.error();
      setStep("error");
    }
  }, [kind, note, includeScreenshot, screenshot]);

  if (!visible) return null;

  return (
    <Modal transparent visible animationType="fade" statusBarTranslucent onRequestClose={close}>
      <View style={{ flex: 1, backgroundColor: c.overlay, justifyContent: "flex-end" }}>
        <View
          style={{
            backgroundColor: c.bgElevated,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 32,
            maxHeight: "88%",
          }}
        >
          {step === "consent" ? (
            <>
              <Text style={{ color: c.text, fontSize: 19, fontWeight: "800" }}>
                {tt("Report a problem", "Ripoti tatizo")}
              </Text>
              <Text style={{ color: c.textBody, fontSize: 13.5, marginTop: 4 }}>
                {tt("Here's exactly what I'll send:", "Hivi ndivyo nitakavyotuma:")}
              </Text>

              <ScrollView style={{ marginTop: 6 }} showsVerticalScrollIndicator={false}>
                <ConsentRow
                  icon="camera"
                  label={tt("A picture of this screen", "Picha ya skrini hii")}
                  sublabel={
                    capturing
                      ? tt("Capturing…", "Inanasa picha…")
                      : screenshot
                        ? tt("Ready — you can leave this unchecked.", "Iko tayari — unaweza kutobofya hii.")
                        : tt("Couldn't capture a screenshot this time.", "Sikuweza kunasa picha wakati huu.")
                  }
                  checked={includeScreenshot && !!screenshot}
                  onToggle={screenshot ? () => setIncludeScreenshot((v) => !v) : undefined}
                />
                <ConsentRow
                  icon="list"
                  label={tt("Your last app messages", "Ujumbe wako wa mwisho wa programu")}
                  sublabel={tt(
                    `${logCount} log lines from just before you tapped Report — no CV content.`,
                    `Kumbukumbu ${logCount} kabla hujagusa Ripoti — hakuna maudhui ya CV.`,
                  )}
                  checked
                  locked
                />
                <ConsentRow
                  icon="smartphone"
                  label={tt("Your app version and phone model", "Toleo la programu na aina ya simu yako")}
                  sublabel={`${APP_VERSION} · ${deviceLabel() ?? Platform.OS}`}
                  checked
                  locked
                />

                <View style={{ marginTop: 10 }}>
                  <TextField
                    label={tt("What happened? (optional)", "Ni nini kilitokea? (si lazima)")}
                    placeholder={tt("Tell me a bit more…", "Niambie zaidi kidogo…")}
                    value={note}
                    onChangeText={setNote}
                    multiline
                    numberOfLines={3}
                    maxLength={1000}
                    inputStyle={{ minHeight: 80, textAlignVertical: "top" }}
                  />
                </View>

                <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 4, lineHeight: 17 }}>
                  {tt(
                    "I never include your CV content, your name, your email or your phone number.",
                    "Sikuweki maudhui ya CV yako, jina lako, barua pepe yako au namba yako ya simu.",
                  )}
                </Text>
              </ScrollView>

              <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
                <View style={{ flex: 1 }}>
                  <Button label={tt("Cancel", "Ghairi")} variant="ghost" onPress={close} />
                </View>
                <View style={{ flex: 1 }}>
                  <Button
                    label={tt("Send report", "Tuma ripoti")}
                    onPress={send}
                    disabled={capturing}
                  />
                </View>
              </View>
            </>
          ) : null}

          {step === "sending" ? (
            <View style={{ paddingVertical: 30, alignItems: "center", gap: 10 }}>
              <Text style={{ color: c.text, fontSize: 15, fontWeight: "700" }}>
                {tt("Sending…", "Inatuma…")}
              </Text>
            </View>
          ) : null}

          {step === "done" ? (
            <View style={{ paddingVertical: 20, alignItems: "center", gap: 14 }}>
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 18,
                  backgroundColor: c.accentFill,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="check" size={26} color={c.accentText} />
              </View>
              <Text style={{ color: c.text, fontSize: 16, fontWeight: "800", textAlign: "center" }}>
                {tt("Thank you — I've got your report.", "Asante — nimepokea ripoti yako.")}
              </Text>
              <Text style={{ color: c.textBody, fontSize: 13.5, textAlign: "center" }}>
                {tt("You can carry on.", "Unaweza kuendelea.")}
              </Text>
              <Button label={tt("Done", "Sawa")} onPress={close} />
            </View>
          ) : null}

          {step === "error" ? (
            <View style={{ paddingVertical: 20, alignItems: "center", gap: 14 }}>
              <Text style={{ color: c.text, fontSize: 15, fontWeight: "700", textAlign: "center" }}>
                {tt(
                  "I couldn't send that. Check your connection and try again.",
                  "Sikuweza kutuma hiyo. Angalia mtandao wako na ujaribu tena.",
                )}
              </Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Button label={tt("Cancel", "Ghairi")} variant="ghost" onPress={close} />
                <Button label={tt("Try again", "Jaribu tena")} onPress={() => setStep("consent")} />
              </View>
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}
