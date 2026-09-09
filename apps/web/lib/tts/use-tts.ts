"use client";

// useTts — React hook over the SpeechQueue. One instance per consumer;
// the queue is cancelled automatically on unmount so speech never leaks
// across navigation. Returns stable callbacks + reactive state.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createTtsProvider, type TtsProviderConfig } from "@/lib/tts/provider";
import { SpeechQueue } from "@/lib/tts/queue";
export interface UseTts {
  /** Speak text (chunked + queued). Safe to call repeatedly. */
  speak: (_text: string) => void;
  /** Stop everything and clear the queue. */
  cancel: () => void;
  pause: () => void;
  resume: () => void;
  speaking: boolean;
  paused: boolean;
  queued: number;
  supported: boolean;
}

export function useTts(config: TtsProviderConfig = {}): UseTts {
  const { lang, rate } = config;
  // P4: "auto" = cloud neural when NEXT_PUBLIC_TTS_CLOUD=1 + key present,
  // otherwise the zero-key browser voice — callers unchanged.
  const provider = useMemo(() => createTtsProvider("auto", { lang, rate }), [lang, rate]);
  const queueRef = useRef<SpeechQueue | null>(null);
  if (!queueRef.current) queueRef.current = new SpeechQueue(provider);

  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [queued, setQueued] = useState(0);

  useEffect(() => {
    const queue = queueRef.current!;
    const onChange = () => {
      const s = queue.state;
      setSpeaking(s.speaking);
      setPaused(s.paused);
      setQueued(s.queued);
    };
    queue.onchange = onChange;
    return () => {
      queue.onchange = null;
      queue.cancel();
    };
  }, []);

  const speak = useCallback((text: string) => queueRef.current?.enqueue(text), []);
  const cancel = useCallback(() => queueRef.current?.cancel(), []);
  const pause = useCallback(() => queueRef.current?.pause(), []);
  const resume = useCallback(() => queueRef.current?.resume(), []);

  return { speak, cancel, pause, resume, speaking, paused, queued, supported: provider.supported };
}
