"use client";

// Guided voice intake — build a first CV hands-free (system blueprint —
// Stage 5, "guided Swahili voice intake").
//
// Sumaiya asks each question out loud; the user answers by voice (free browser
// STT, Swahili supported) or by typing. At the end the answers become a
// transcript that /api/ai/build-cv turns into a real CV, then we open the
// editor. Every answer stays fully editable before it's sent — nothing is
// committed from audio the user didn't see.

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, Square, Check, RotateCcw, Keyboard, Volume2, Loader2, ChevronRight } from "lucide-react";
import {
  createRecognizer,
  speak,
  stopSpeaking,
  voiceInputSupported,
  voiceOutputSupported,
  type Recognizer,
} from "@/lib/voice/speech";
import { VOICE_INTAKE, buildTranscript } from "@/lib/voice/intake-script";

type Lang = "en" | "sw";
type Phase = "intro" | "asking" | "building" | "error";

export function VoiceIntake({ lang = "sw" }: { lang?: Lang }) {
  const router = useRouter();
  const sw = lang === "sw";
  const supported = voiceInputSupported();

  const [phase, setPhase] = useState<Phase>("intro");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState("");
  const [listening, setListening] = useState(false);
  const [typing, setTyping] = useState(!supported);
  const [micError, setMicError] = useState<string | null>(null);
  const [buildError, setBuildError] = useState<string | null>(null);
  const recRef = useRef<Recognizer | null>(null);

  const q = VOICE_INTAKE[step];
  const total = VOICE_INTAKE.length;

  const stopListening = useCallback(() => {
    recRef.current?.stop();
    recRef.current = null;
    setListening(false);
  }, []);

  const startListening = useCallback(() => {
    if (!supported || listening) return;
    setMicError(null);
    stopSpeaking();
    const rec = createRecognizer(lang, {
      onResult: (r) => setDraft(r.transcript),
      onDone: () => {
        recRef.current = null;
        setListening(false);
      },
      onError: (code) => {
        setListening(false);
        recRef.current = null;
        if (code === "not-allowed" || code === "service-not-allowed") {
          setMicError(sw ? "Ruhusu matumizi ya kipaza sauti kisha jaribu tena." : "Allow microphone access, then try again.");
          setTyping(true);
        } else if (code === "no-speech") {
          setMicError(sw ? "Sikusikia chochote — jaribu tena." : "I didn't catch that — try again.");
        }
      },
    });
    if (!rec) {
      setTyping(true);
      return;
    }
    recRef.current = rec;
    setListening(true);
    rec.start();
  }, [supported, listening, lang, sw]);

  // Speak the question when it changes (and we're in the asking phase).
  useEffect(() => {
    if (phase !== "asking" || !q) return;
    setDraft(answers[q.id] ?? "");
    if (voiceOutputSupported()) speak(q.prompt[lang], lang);
    return () => stopSpeaking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, step]);

  useEffect(() => () => {
    recRef.current?.abort();
    stopSpeaking();
  }, []);

  const accept = useCallback(async () => {
    stopListening();
    const value = draft.trim();
    const next = { ...answers };
    if (value) next[q.id] = value;
    setAnswers(next);
    setDraft("");

    if (step + 1 < total) {
      setStep(step + 1);
      return;
    }

    // Done — build the CV.
    setPhase("building");
    setBuildError(null);
    try {
      const transcript = buildTranscript(next, lang);
      const res = await fetch("/api/ai/build-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: transcript, lang }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.data) {
        throw new Error(json?.error ?? "build failed");
      }
      const created = await fetch("/api/cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: json.data, title: sw ? "CV yangu" : "My CV" }),
      });
      const cj = await created.json().catch(() => null);
      const id = cj?.data?.id;
      if (!id) throw new Error("save failed");
      router.push(`/editor/cv/${id}?fresh=voice`);
    } catch {
      setPhase("error");
      setBuildError(
        sw
          ? "Imeshindikana kutengeneza CV sasa. Majibu yako yapo salama — jaribu tena."
          : "Couldn't build the CV right now. Your answers are safe — try again.",
      );
    }
  }, [draft, answers, q, step, total, lang, sw, router, stopListening]);

  const skip = useCallback(() => {
    stopListening();
    setDraft("");
    if (step + 1 < total) setStep(step + 1);
    else void accept();
  }, [step, total, accept, stopListening]);

  // ── Intro ────────────────────────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <div className="max-w-lg mx-auto px-5 py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-ember/10 flex items-center justify-center mx-auto mb-5">
          <Mic className="w-7 h-7 text-ember" />
        </div>
        <h1 className="font-display font-extrabold text-2xl text-espresso mb-2">
          {sw ? "Tengeneza CV kwa kusema" : "Build your CV by voice"}
        </h1>
        <p className="text-sm text-text-body mb-6">
          {sw
            ? "Nitakuuliza maswali machache. Jibu kwa kusema au kwa kuandika. Utaona kila jibu na kuweza kulibadilisha kabla ya kutengeneza CV."
            : "I'll ask you a few questions. Answer by voice or by typing. You'll see every answer and can edit it before the CV is built."}
        </p>
        {!supported && (
          <p className="text-xs text-gold-text bg-gold-tint border border-gold/30 rounded-lg p-3 mb-4">
            {sw
              ? "Kivinjari chako hakina uandishi wa sauti — utaandika majibu. (Chrome kwenye Android inafanya kazi vizuri.)"
              : "Your browser doesn't support voice input — you'll type answers. (Chrome on Android works best.)"}
          </p>
        )}
        <button
          onClick={() => setPhase("asking")}
          className="inline-flex items-center gap-2 bg-ember text-cream font-semibold text-sm px-5 py-3 rounded-pill shadow-ember-hard hover:bg-ember-hover transition"
        >
          {sw ? "Anza" : "Start"}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // ── Building ─────────────────────────────────────────────────────────────
  if (phase === "building") {
    return (
      <div className="max-w-lg mx-auto px-5 py-20 text-center">
        <Loader2 className="w-8 h-8 text-ember animate-spin mx-auto mb-4" />
        <p className="text-sm text-text-body">
          {sw ? "Ninatengeneza CV yako kutoka majibu yako…" : "Building your CV from your answers…"}
        </p>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (phase === "error") {
    return (
      <div className="max-w-lg mx-auto px-5 py-16 text-center">
        <p className="text-sm text-text-body mb-5">{buildError}</p>
        <button
          onClick={() => {
            setPhase("asking");
            setStep(total - 1);
          }}
          className="inline-flex items-center gap-2 bg-ember text-cream font-semibold text-sm px-5 py-2.5 rounded-pill hover:bg-ember-hover transition"
        >
          <RotateCcw className="w-4 h-4" />
          {sw ? "Jaribu tena" : "Try again"}
        </button>
      </div>
    );
  }

  // ── Asking ───────────────────────────────────────────────────────────────
  return (
    <div className="max-w-lg mx-auto px-5 py-8">
      <div className="flex items-center gap-2 mb-6">
        <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-ember transition-all duration-300"
            style={{ width: `${(step / total) * 100}%` }}
          />
        </div>
        <span className="text-[11px] font-mono text-text-muted tabular-nums">
          {step + 1}/{total}
        </span>
      </div>

      <div className="flex items-start gap-2 mb-1">
        <h2 className="font-display font-bold text-xl text-espresso flex-1">{q.prompt[lang]}</h2>
        {voiceOutputSupported() && (
          <button
            onClick={() => speak(q.prompt[lang], lang)}
            aria-label={sw ? "Sikia swali" : "Hear the question"}
            className="w-9 h-9 flex items-center justify-center text-text-muted hover:text-ember shrink-0"
          >
            <Volume2 className="w-4.5 h-4.5" />
          </button>
        )}
      </div>
      {q.hint && <p className="text-xs text-text-muted mb-4">{q.hint[lang]}</p>}

      <div className="mt-4 rounded-card-lg border border-border-input bg-surface p-3">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={() => setTyping(true)}
          rows={4}
          placeholder={
            listening
              ? sw
                ? "Ninasikiliza…"
                : "Listening…"
              : sw
                ? "Jibu lako litaonekana hapa"
                : "Your answer appears here"
          }
          className="w-full resize-none bg-transparent text-sm text-text-body outline-none placeholder:text-text-muted"
        />
        {micError && <p className="text-xs text-ember-hover mt-1">{micError}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-4">
        {supported && !typing && (
          listening ? (
            <button
              onClick={stopListening}
              className="inline-flex items-center gap-2 bg-ember text-cream font-semibold text-sm px-4 py-2.5 rounded-pill animate-pulse"
            >
              <Square className="w-4 h-4" />
              {sw ? "Simama" : "Stop"}
            </button>
          ) : (
            <button
              onClick={startListening}
              className="inline-flex items-center gap-2 bg-ember text-cream font-semibold text-sm px-4 py-2.5 rounded-pill shadow-ember-hard hover:bg-ember-hover transition"
            >
              <Mic className="w-4 h-4" />
              {draft ? (sw ? "Sema tena" : "Speak again") : sw ? "Sema jibu" : "Speak your answer"}
            </button>
          )
        )}
        {supported && (
          <button
            onClick={() => {
              stopListening();
              setTyping((t) => !t);
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-body hover:text-ember-hover px-2 py-2"
          >
            <Keyboard className="w-3.5 h-3.5" />
            {typing ? (sw ? "Tumia sauti" : "Use voice") : sw ? "Andika badala yake" : "Type instead"}
          </button>
        )}

        <div className="ml-auto flex items-center gap-2">
          {q.optional && (
            <button
              onClick={skip}
              className="text-xs font-medium text-text-muted hover:text-espresso px-2 py-2"
            >
              {sw ? "Ruka" : "Skip"}
            </button>
          )}
          <button
            onClick={accept}
            disabled={!draft.trim() && !q.optional}
            className="inline-flex items-center gap-1.5 bg-espresso text-cream font-semibold text-sm px-4 py-2.5 rounded-pill disabled:opacity-40 hover:bg-espresso/90 transition"
          >
            <Check className="w-4 h-4" />
            {step + 1 === total ? (sw ? "Tengeneza CV" : "Build CV") : sw ? "Sawa" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
