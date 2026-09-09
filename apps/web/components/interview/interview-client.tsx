"use client";

// AI Interview Coach. A turn-by-turn mock interview: given the candidate's CV
// (and optionally the job they're interviewing for), the coach asks realistic
// questions one at a time and gives specific, encouraging feedback after each
// answer — in the candidate's language. Reuses /api/ai/interview-turn.

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, Send, Loader2, MessageSquareText, RotateCcw } from "lucide-react";
import type { Lang } from "@/lib/i18n/translations";

interface Props { lang: Lang; cvContext?: string; jobTitle?: string; hasCv?: boolean; cvId?: string; initialJd?: string; }
type Msg = { role: "assistant" | "user"; content: string };

// Persist an in-progress interview so a refresh resumes it (like the assistant).
const STORAGE_KEY = "sumaiya-interview-v1";
type SavedInterview = { sig: string; messages: Msg[]; done: boolean; jd: string };

export function InterviewClient({ lang, cvContext = "", jobTitle = "", hasCv = false, cvId, initialJd = "" }: Props) {
  const sw = lang === "sw";
  const [jd, setJd] = useState(initialJd);
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const restored = useRef(false);

  // A signature of the interview's context: a saved session is only resumed if
  // it belongs to the same CV/role, so switching CVs starts fresh.
  const sig = `${jobTitle}|${hasCv}|${cvContext.slice(0, 60)}`;

  // Resume a saved session on mount.
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as SavedInterview;
      if (saved?.sig === sig && Array.isArray(saved.messages) && saved.messages.length) {
        setMessages(saved.messages);
        setDone(!!saved.done);
        if (saved.jd) setJd(saved.jd);
        setStarted(true);
      }
    } catch { /* corrupt/absent — start fresh */ }
  }, [sig]);

  // Persist as the conversation advances.
  useEffect(() => {
    if (!started) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ sig, messages, done, jd } satisfies SavedInterview));
    } catch { /* storage full/blocked — non-critical */ }
  }, [started, messages, done, jd, sig]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  const turn = useCallback(async (history: Msg[]) => {
    setSending(true); setError("");
    try {
      const res = await fetch("/api/ai/interview-turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map((m) => ({ role: m.role, content: m.content })),
          jobTitle: jobTitle || undefined,
          jobDescription: jd.trim() || undefined,
          cvContext: cvContext || undefined,
          lang: sw ? "sw" : "en",
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { success?: boolean; data?: { reply: string; done: boolean }; error?: string };
      if (!res.ok || !json.success || !json.data?.reply) throw new Error(json.error || "failed");
      setMessages((m) => [...m, { role: "assistant", content: json.data!.reply }]);
      if (json.data.done) setDone(true);
    } catch {
      setError(sw ? "Samahani, imeshindwa. Jaribu tena." : "Sorry, that failed. Please try again.");
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [jd, jobTitle, cvContext, sw]);

  const start = () => {
    if (started || sending) return;
    setStarted(true);
    const seed: Msg[] = [{ role: "user", content: sw ? "Niko tayari, tuanze mahojiano." : "I'm ready, let's begin the interview." }];
    setMessages(seed);
    void turn(seed);
  };

  const submit = () => {
    const value = input.trim();
    if (!value || sending || done) return;
    const history = [...messages, { role: "user" as const, content: value }];
    setMessages(history);
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    void turn(history);
  };

  const restart = () => {
    setStarted(false); setMessages([]); setDone(false); setError(""); setInput("");
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* non-critical */ }
  };

  const autoGrow = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  };

  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-sand-2">
      {/* Header */}
      <div className="bg-espresso border-b border-espresso-line px-4 h-14 flex items-center gap-3 flex-shrink-0">
        <Link href="/dashboard" className="flex items-center gap-1 text-cream/60 hover:text-cream transition text-sm shrink-0" aria-label={sw ? "Rudi" : "Back"}>
          <ChevronLeft className="w-5 h-5" />
          <span className="hidden sm:inline">{sw ? "Rudi" : "Back"}</span>
        </Link>
        <div className="h-5 w-px bg-espresso-line hidden sm:block" />
        <div className="w-8 h-8 rounded-lg bg-pine flex items-center justify-center shrink-0">
          <MessageSquareText className="w-4 h-4 text-cream" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-cream leading-tight">{sw ? "Kocha wa Mahojiano" : "Interview Coach"}</p>
          <p className="text-[11px] text-cream/50 leading-tight truncate">{jobTitle ? jobTitle : (sw ? "Jizoeze maswali halisi ya mahojiano" : "Practice real interview questions")}</p>
        </div>
        {started && (
          <button onClick={restart} className="flex items-center gap-1 text-[11px] text-cream/50 hover:text-cream transition shrink-0" aria-label={sw ? "Anza upya" : "Restart"}>
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{sw ? "Anza upya" : "Restart"}</span>
          </button>
        )}
      </div>

      {!started ? (
        // ── Setup screen ──────────────────────────────────────────────────
        <div className="flex-1 overflow-y-auto px-4 py-8">
          <div className="max-w-md mx-auto space-y-5">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-pine-tint flex items-center justify-center mx-auto mb-3">
                <MessageSquareText className="w-7 h-7 text-pine" />
              </div>
              <h1 className="font-display font-bold text-espresso text-xl">{sw ? "Jitayarishe kwa Mahojiano" : "Prepare for your Interview"}</h1>
              <p className="text-sm text-text-body mt-1.5 leading-relaxed">
                {sw
                  ? "Nitakuuliza maswali halisi ya mahojiano, kisha nikupe ushauri baada ya kila jibu — kwa lugha yako."
                  : "I'll ask you real interview questions and give feedback after each answer — in your language."}
              </p>
            </div>

            {!hasCv && (
              <div className="flex items-start gap-2 text-[12px] text-text-muted bg-gold-tint/50 rounded-input px-3 py-2">
                <span>{sw ? "Kidokezo: fungua kutoka kwenye CV yako ili maswali yalenge uzoefu wako." : "Tip: open this from your CV so questions are tailored to your experience."}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-espresso mb-1.5">
                {sw ? "Bandika kazi unayoombea (si lazima)" : "Paste the job you're interviewing for (optional)"}
              </label>
              {initialJd && (
                <p className="flex items-center gap-1.5 text-[11px] text-pine font-medium mb-1.5">
                  <MessageSquareText className="w-3.5 h-3.5" />
                  {sw ? "Imepakiwa kutoka ombi lako — mahojiano yatalenga kazi hii." : "Loaded from your application — the interview will target this job."}
                </p>
              )}
              <textarea
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                rows={4}
                placeholder={sw ? "Bandika maelezo ya kazi hapa ili maswali yalenge kazi hii…" : "Paste the job description here to tailor the questions…"}
                className="w-full px-3 py-2.5 text-sm bg-card border border-border-input rounded-input focus:outline-none focus:shadow-focus-ember focus:border-ember placeholder:text-text-muted/50 resize-none"
              />
            </div>

            <button
              onClick={start}
              className="w-full flex items-center justify-center gap-2 bg-pine hover:bg-pine/90 text-cream text-sm font-semibold py-3 rounded-input-lg transition active:translate-y-[1px]"
            >
              <MessageSquareText className="w-4 h-4" />
              {sw ? "Anza mahojiano" : "Start the interview"}
            </button>
            <p className="text-[11px] text-text-muted text-center">{sw ? "Ni mazoezi — hakuna majibu sahihi au yasiyo sahihi." : "It's practice — there are no wrong answers here."}</p>
          </div>
        </div>
      ) : (
        // ── Interview chat ────────────────────────────────────────────────
        <>
          <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-5">
            <div className="min-h-full max-w-2xl mx-auto flex flex-col justify-end space-y-3" aria-live="polite">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    m.role === "user" ? "bg-ember text-cream rounded-br-md" : "bg-card border border-border text-espresso rounded-bl-md"
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5" aria-label={sw ? "Anaandika" : "Typing"}>
                    <span className="w-2 h-2 rounded-full bg-text-muted/60 animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-2 h-2 rounded-full bg-text-muted/60 animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-2 h-2 rounded-full bg-text-muted/60 animate-bounce" />
                  </div>
                </div>
              )}
              {error && (
                <div className="flex justify-start">
                  <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 max-w-[85%]">
                    <p className="text-sm text-red-700">{error}</p>
                    <button onClick={() => turn(messages)} disabled={sending} className="text-xs font-semibold text-ember-hover hover:underline mt-1 disabled:opacity-50">
                      {sw ? "Jaribu tena" : "Try again"}
                    </button>
                  </div>
                </div>
              )}
              {done && (
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 pt-2">
                  {cvId && (
                    <Link href={`/editor/cv/${cvId}`} className="text-xs font-semibold text-ember-hover hover:underline">
                      {sw ? "Boresha CV yako →" : "Polish your CV →"}
                    </Link>
                  )}
                  <Link href="/dashboard" className="text-xs font-semibold text-pine hover:underline">
                    {sw ? "Maliza — nenda dashibodi" : "Finish — go to dashboard"}
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Composer */}
          <div className="border-t border-border bg-card px-4 py-3 flex-shrink-0 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
            <div className="max-w-2xl mx-auto flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => { setInput(e.target.value); autoGrow(e.target); }}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
                placeholder={done ? (sw ? "Mahojiano yamekamilika" : "Interview complete") : sending ? (sw ? "Subiri…" : "One moment…") : (sw ? "Andika jibu lako…" : "Type your answer…")}
                rows={1}
                disabled={sending || done}
                autoFocus
                className="flex-1 resize-none px-4 py-2.5 text-base sm:text-sm leading-relaxed bg-sand-2 border border-border-input rounded-2xl focus:outline-none focus:shadow-focus-ember focus:border-ember placeholder:text-text-muted/60 max-h-36 overflow-y-auto disabled:opacity-60"
              />
              <button onClick={submit} disabled={!input.trim() || sending || done}
                aria-label={sw ? "Tuma" : "Send"}
                className="w-10 h-10 rounded-full bg-ember hover:bg-ember-hover text-cream flex items-center justify-center disabled:opacity-40 transition shrink-0">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
