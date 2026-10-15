"use client";

// AI Career Interview — structured profile-building with speak/type/skip/edit.
//
// Walks the deterministic question bank (lib/career-interview/questions) one
// question at a time. Answers are typed or spoken (Web Speech API — no keys),
// applied to the profile with applyAnswer() (non-destructive, merge-by-name
// for lists) and saved immediately to /api/profile. Every answer is
// user-authored → stamped confirmed. Skip leaves the field untouched; Back
// lets the user edit an earlier answer.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Lang } from "@/lib/i18n/translations";
import { createEmptyCareerProfile, type CareerProfile } from "@/types";
import {
  INTERVIEW_QUESTIONS,
  applyAnswer,
  readAnswer,
  type InterviewQuestion,
} from "@/lib/career-interview/questions";
import { useTts } from "@/lib/tts/use-tts";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";

const STRINGS = {
  en: {
    title: "Career Interview",
    subtitle: "A few questions to build your Career Profile — the source of truth every CV is made from. Type or speak.",
    loading: "Loading your profile…",
    errorLoad: "Couldn't load your profile.",
    errorSave: "Couldn't save your answer. Please try again.",
    networkError: "Network error. Please try again.",
    skip: "Skip",
    back: "Back",
    next: "Next",
    answer: "Save answer",
    saving: "Saving…",
    listening: "Listening… tap to stop",
    micUnsupported: "Voice input isn't supported in this browser.",
    listen: "Listen",
    stop: "Stop",
    doneTitle: "Profile complete 🎉",
    doneBody: "Your Career Profile now holds the facts your CVs are built from.",
    viewSettings: "View profile",
    goJobs: "Find matching jobs",
    answeredCount: (n: number) => `${n} ${n === 1 ? "question answered" : "questions answered"}`,
    of: "of",
    editNote: "Your answers are saved as you go.",
    finish: "Finish",
  },
  sw: {
    title: "Mahojiano ya Kazi",
    subtitle: "Maswali machache ya kujenga Wasifu wako wa Kazi — chanzo cha kweli ambacho kila CV hujengwa kutoka. Andika au sema.",
    loading: "Ninapakia wasifu wako…",
    errorLoad: "Sikuweza kupakia wasifu wako.",
    errorSave: "Sikuweza kuhifadhi jibu lako. Jaribu tena.",
    networkError: "Hitilafu ya mtandao. Jaribu tena.",
    skip: "Ruka",
    back: "Nyuma",
    next: "Endelea",
    answer: "Hifadhi jibu",
    saving: "Ninahifadhi…",
    listening: "Inasikiliza… gusa kuacha",
    micUnsupported: "Kuingiza kwa sauti haitumiki kwenye kivinjari hiki.",
    listen: "Sikiliza",
    stop: "Acha",
    doneTitle: "Wasifu umekamilika 🎉",
    doneBody: "Wasifu wako wa Kazi sasa unashikilia ukweli ambao CV zako hujengwa kutoka.",
    viewSettings: "Angalia wasifu",
    goJobs: "Tafuta nafasi za kazi zinazolingana",
    answeredCount: (n: number) => `${n} ${n === 1 ? "swali limejibiwa" : "maswali yamejibiwa"}`,
    of: "kati ya",
    editNote: "Majibu yako yanahifadhiwa unavyoendelea.",
    finish: "Maliza",
  },
} as const;

interface Props {
  lang: Lang;
}

function MicIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  );
}

export function CareerInterviewClient({ lang }: Props) {
  const s = STRINGS[lang];
  const sw = lang === "sw";

  const [profile, setProfile] = useState<CareerProfile | null>(null);
  const [idx, setIdx] = useState(0);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [listening, setListening] = useState(false);
  const recRef = useRef<{ stop: () => void } | null>(null);

  const tts = useTts({ lang: sw ? "sw" : "en" });

  const q = INTERVIEW_QUESTIONS[idx];

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/profile");
      const j = (await res.json().catch(() => ({}))) as { success?: boolean; data?: { careerProfile?: CareerProfile | null } | null };
      const cp = j.success ? (j.data?.careerProfile ?? null) : null;
      setProfile(cp && Object.keys(cp).length ? cp : createEmptyCareerProfile());
    } catch {
      setError(s.errorLoad);
      setProfile(createEmptyCareerProfile());
    }
  }, [s.errorLoad]);

  useEffect(() => { void load(); }, [load]);

  // Pre-fill the input when moving to a question that already has a value.
  useEffect(() => {
    if (profile && q) setDraft(readAnswer(profile, q));
  }, [idx, profile, q]);

  // Stop reading the previous question when the user moves on.
  useEffect(() => {
    tts.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  const toggleSpeak = () => {
    if (tts.speaking) {
      tts.cancel();
      return;
    }
    const text = [q.prompt[lang], q.hint?.[lang]].filter(Boolean).join(". ");
    tts.speak(text);
  };

  const saveProfile = useCallback(async (next: CareerProfile): Promise<boolean> => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ careerProfile: next, careerProfileSource: "interview" }),
      });
      const j = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string };
      if (!j.success) {
        setError(j.error || s.errorSave);
        return false;
      }
      return true;
    } catch {
      setError(s.networkError);
      return false;
    } finally {
      setSaving(false);
    }
  }, [s.errorSave, s.networkError]);

  const goNext = useCallback(() => {
    if (idx + 1 >= INTERVIEW_QUESTIONS.length) setDone(true);
    else setIdx(idx + 1);
  }, [idx]);

  const handleAnswer = async () => {
    if (!profile || saving) return;
    const value = draft.trim();
    if (!value) { goNext(); return; } // empty answer behaves like skip
    const next = applyAnswer(profile, q.id, value);
    const ok = await saveProfile(next);
    if (!ok) return;
    setProfile(next);
    goNext();
  };

  const handleSkip = () => {
    if (saving) return;
    goNext();
  };

  const handleBack = () => {
    if (saving) return;
    if (idx > 0) setIdx(idx - 1);
  };

  // ─── Voice input (Web Speech API — no keys, graceful fallback) ────────────
  const micSupported = useMemo(
    () => typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition),
    [],
  );

  const toggleMic = () => {
    if (listening) {
      recRef.current?.stop();
      setListening(false);
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setError(s.micUnsupported); return; }
    setError("");
    const rec = new SR();
    rec.lang = sw ? "sw-TZ" : "en-US";
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }>> }) => {
      let text = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        text += e.results[i][0]?.transcript ?? "";
      }
      setDraft((prev) => (prev ? `${prev} ${text}` : text).trim());
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    try { rec.start(); } catch { setListening(false); }
  };

  useEffect(() => () => { recRef.current?.stop(); }, []);

  const progress = profile ? Math.min(100, Math.round(((idx + (done ? 1 : 0)) / INTERVIEW_QUESTIONS.length) * 100)) : 0;

  if (!profile) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center text-sm text-text-muted">
        <Icon name="magic" size={22} className="animate-pulse mx-auto mb-3" />
        {s.loading}
      </div>
    );
  }

  if (done) {
    const answered = INTERVIEW_QUESTIONS.filter((qq) => readAnswer(profile, qq).trim() !== "").length;
    return (
      <div className="max-w-xl mx-auto px-4 py-14 text-center">
        <div className="w-14 h-14 rounded-2xl bg-pine/10 flex items-center justify-center mx-auto mb-4">
          <Icon name="check" size={26} className="text-pine" />
        </div>
        <h1 className="font-display text-2xl font-extrabold text-espresso">{s.doneTitle}</h1>
        <p className="text-sm text-text-muted mt-2 max-w-sm mx-auto leading-relaxed">{s.doneBody}</p>
        <p className="text-xs text-pine font-semibold mt-3">{s.answeredCount(answered)}</p>
        <div className="flex flex-wrap items-center justify-center gap-2.5 mt-6">
          <Button href="/settings" variant="secondary" size="sm">
            {s.viewSettings}
            <Icon name="chevron-right" size={14} />
          </Button>
          <Button href="/jobs" size="sm">
            <Icon name="target" size={14} />
            {s.goJobs}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl font-extrabold text-espresso flex items-center gap-2">
          <Icon name="comment" size={20} className="text-ember" />
          {s.title}
        </h1>
        <p className="text-sm text-text-muted mt-1.5 leading-relaxed">{s.subtitle}</p>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-[11px] text-text-muted mb-1.5">
          <span>{idx + 1} {s.of} {INTERVIEW_QUESTIONS.length}</span>
          <span>{s.editNote}</span>
        </div>
        <div className="h-1.5 bg-sand rounded-full overflow-hidden">
          <div className="h-full bg-ember rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {error && (
        <div className="mb-4 text-xs text-red-600 bg-red-50 border border-red-200 rounded-input px-3 py-2 flex items-start gap-2">
          <span>⚠</span>
          <span className="flex-1">{error}</span>
          <button onClick={() => setError("")} aria-label="close">&times;</button>
        </div>
      )}

      {/* Question card */}
      <div className="bg-card rounded-card border border-border p-5 sm:p-6">
        <p className="text-[11px] font-bold uppercase tracking-wide text-text-muted mb-1">
          {q.optional ? (sw ? "Hiari" : "Optional") : (sw ? "Muhimu" : "Required")}
        </p>
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-display text-lg font-bold text-espresso leading-snug">{q.prompt[lang]}</h2>
          {tts.supported && (
            <button
              type="button"
              onClick={toggleSpeak}
              aria-label={tts.speaking ? s.stop : s.listen}
              title={tts.speaking ? s.stop : s.listen}
              className={`shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold rounded-lg px-2 py-1 border transition ${
                tts.speaking
                  ? "bg-ember text-cream border-ember"
                  : "bg-white text-text-body border-border-input hover:border-ember hover:text-ember"
              }`}
            >
              {tts.speaking && <span className="w-1.5 h-1.5 rounded-full bg-cream animate-pulse" />}
              {tts.speaking ? s.stop : s.listen}
            </button>
          )}
        </div>
        {q.hint && <p className="text-xs text-text-muted mt-1.5">{q.hint[lang]}</p>}

        <div className="mt-4 flex items-start gap-2">
          {q.input === "textarea" ? (
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={4}
              placeholder={q.placeholder[lang]}
              className="flex-1 text-sm bg-cream border border-border-input rounded-input px-3 py-2.5 focus:outline-none focus:shadow-focus-ember focus:border-ember placeholder:text-text-muted/60 resize-y"
            />
          ) : (
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void handleAnswer(); } }}
              placeholder={q.placeholder[lang]}
              className="flex-1 text-sm bg-cream border border-border-input rounded-input px-3 py-2.5 focus:outline-none focus:shadow-focus-ember focus:border-ember placeholder:text-text-muted/60"
            />
          )}
          {micSupported && (
            <button
              type="button"
              onClick={toggleMic}
              aria-label={s.listening}
              title={s.listening}
              className={`shrink-0 w-10 h-10 inline-flex items-center justify-center rounded-[10px] border transition ${
                listening
                  ? "bg-ember text-cream border-ember animate-pulse"
                  : "bg-white text-text-body border-border-input hover:border-ember hover:text-ember"
              }`}
            >
              <MicIcon className="w-4.5 h-4.5" />
            </button>
          )}
        </div>
        {listening && (
          <p className="mt-2 text-[11px] text-ember-hover font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-ember animate-pulse" />
            {s.listening}
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 mt-5 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <Button onClick={handleBack} disabled={idx === 0 || saving} variant="ghost" size="sm">
              <Icon name="undo" size={13} />
              {s.back}
            </Button>
            <Button onClick={handleSkip} disabled={saving} variant="ghost" size="sm">
              {s.skip}
              <Icon name="chevron-right" size={13} />
            </Button>
          </div>
          <Button onClick={handleAnswer} disabled={saving} size="sm">
            {saving ? (
              <span className="inline-flex items-center gap-1.5">
                <Icon name="magic" size={13} className="animate-pulse" />
                {s.saving}
              </span>
            ) : (
              <>
                {idx + 1 >= INTERVIEW_QUESTIONS.length ? s.finish : s.answer}
                <Icon name="check" size={13} />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
