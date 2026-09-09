import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import * as Speech from "expo-speech";

/**
 * useSpeech — read-aloud for Sumaiya's replies, mirroring the web app's useTts.
 *
 * On-device TTS via expo-speech (no key, works offline). Sumaiya answers in
 * whichever language the user wrote (usually English or Kiswahili), so we guess
 * the language per message and, like the web, only speak Swahili when the device
 * actually has a Swahili voice — an English voice reading Swahili is worse than
 * silence. `supported` = "TTS exists at all"; a Swahili message on a device with
 * no sw voice is simply skipped.
 *
 * Fire-and-forget; every call swallows errors.
 */
export interface UseSpeech {
  speak: (text: string) => void;
  stop: () => void;
  speaking: boolean;
  supported: boolean;
}

const SW_MARKERS = [
  " na ", " ya ", " wa ", " ni ", " kwa ", " katika ", " yako ", " yangu ",
  " kazi", " unaweza", " nina", " hii", " tafadhali", " asante", " habari",
  " kuandika", " barua", " maombi", " kwenye",
];

/** Crude but sufficient: ≥2 Swahili function-word hits → treat as Swahili. */
function looksSwahili(text: string): boolean {
  const t = ` ${text.toLowerCase()} `;
  let hits = 0;
  for (const m of SW_MARKERS) if (t.includes(m)) hits++;
  return hits >= 2;
}

export function useSpeech(): UseSpeech {
  const [speaking, setSpeaking] = useState(false);
  const [hasSwVoice, setHasSwVoice] = useState(false);
  const mounted = useRef(true);
  const supported = Platform.OS === "ios" || Platform.OS === "android";

  useEffect(() => {
    mounted.current = true;
    if (supported) {
      Speech.getAvailableVoicesAsync()
        .then((voices) => {
          if (mounted.current) {
            setHasSwVoice(voices.some((v) => v.language?.toLowerCase().startsWith("sw")));
          }
        })
        .catch(() => {});
    }
    return () => {
      mounted.current = false;
      Speech.stop().catch(() => {});
    };
  }, [supported]);

  const stop = useCallback(() => {
    Speech.stop().catch(() => {});
    setSpeaking(false);
  }, []);

  const speak = useCallback(
    (text: string) => {
      const clean = text.trim();
      if (!clean || !supported) return;
      const sw = looksSwahili(clean);
      if (sw && !hasSwVoice) return; // don't read Swahili in an English voice
      Speech.stop().catch(() => {});
      setSpeaking(true);
      Speech.speak(clean, {
        language: sw ? "sw" : "en-US",
        rate: 1.0,
        onDone: () => { if (mounted.current) setSpeaking(false); },
        onStopped: () => { if (mounted.current) setSpeaking(false); },
        onError: () => { if (mounted.current) setSpeaking(false); },
      });
    },
    [supported, hasSwVoice],
  );

  return { speak, stop, speaking, supported };
}
