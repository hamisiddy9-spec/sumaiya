/**
 * Hook for managing Sumaiya AI chat state and logic
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthContext } from '../contexts/auth-context';
import { apiClient } from '../lib/api-client';
import { friendlyApiError, isTransportError } from '../lib/app-errors';
import type {
  ChatMessage,
  SuggestionChip,
  SkillGap,
  LearningResource,
  ActionType,
  SumaiyaResponse,
  Attachment
} from '../components/chat/chat-types';
import { extractAttachment, attachmentsContext } from '../lib/attachment-extract';
import { loadProfile, profilePromptBlock } from '../lib/profile-store';
import { loadMemory, renderMemoryBlock } from '../lib/ai-memory';
import { reportError } from '../lib/reporting';
import { useLang, greetingFor } from '../lib/i18n';
import { splitReplyIntoBubbles } from '../lib/reply-bubbles';
import { sleep } from '@sumaiya/utils';
import { buildTurnSteps, type ChatStep, type TurnProgress } from '../components/chat/chat-progress';
import { isModelUnavailableStatus, safeUnavailableText, type UnavailableVariant } from '../components/chat/chat-unavailable';

// A long reply arrives in one round-trip (no streaming — see reply-bubbles.ts
// for why), so staging it into separate bubbles is the only place a "typing"
// pause can go. Short enough to feel like a fast typist, not a stall.
const BUBBLE_DELAY_MS = 550;

// The greeting shown before any real turn is now language-aware — see
// greetingFor() in lib/i18n. It's fed to the model as the first history entry
// so it knows it has already introduced itself (otherwise the user's first
// real reply — e.g. "Kiswahili" — makes it start over).

const CHAT_KEY = 'sumaiya_chat_v1';

/** What the user's own turn says about its delivery — one word, under the bubble. */
export type DeliveryState = 'sending' | 'sent' | 'failed';

/** Why the reply is not coming, when it is not coming. */
export interface TurnError {
  /** Her sentence, in the user's language. Never a raw server body. */
  text: string;
  /** True when the model itself is the missing piece. */
  modelMissing: boolean;
  variant: UnavailableVariant;
}

export function useSumaiyaChat() {
  const { user } = useAuthContext();
  const { lang, t } = useLang();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Delivery word per user message id (§3.2 T1): Inatuma… / Imetumwa / Haijatumwa. */
  const [delivery, setDelivery] = useState<Record<string, DeliveryState>>({});
  /** The live rail, from real events only — never a timer. */
  const [progress, setProgress] = useState<TurnProgress | null>(null);
  const [turnStartedAt, setTurnStartedAt] = useState<number>(() => Date.now());
  /** A turn that failed: the error card hangs off the turn it belongs to. */
  const [turnError, setTurnError] = useState<TurnError | null>(null);
  /**
   * The provider's own answer about itself, asked once on entry (§3.6
   * "Detect": a probe, never a connectivity heuristic). `unknown` until it
   * answers — an unknown provider never renders as "unavailable".
   */
  const [modelStatus, setModelStatus] = useState<"unknown" | "ready" | "unavailable">("unknown");
  /** Kept while a turn is in flight; sent the moment that turn ends. */
  const [queued, setQueued] = useState<{ text: string; attachments: Attachment[] } | null>(null);
  const messageIdRef = useRef(0);
  const hydrated = useRef(false);
  const inFlight = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const stoppedRef = useRef(false);
  const lastTurnRef = useRef<{ text: string; attachments: Attachment[] } | null>(null);

  // Restore the last conversation so a backgrounded/killed app doesn't lose it
  // (it holds the answers "Build my CV from this chat" depends on).
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(CHAT_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as ChatMessage[];
          if (Array.isArray(parsed) && parsed.length) {
            setMessages(parsed.map((m) => ({ ...m, timestamp: new Date(m.timestamp) })));
          }
        }
      } catch {
        /* fresh start is fine */
      } finally {
        hydrated.current = true;
      }
    })();
  }, []);

  // Ask the thing that knows, once, before the user invests a message. A failed
  // probe is NOT "the provider is off" — it leaves the status unknown and the
  // chat behaves normally (an unplugged phone must not be told the intelligence
  // is unavailable when nobody asked it).
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!user) return;
      const status = await apiClient.getAiStatus();
      if (!alive || !status) return;
      setModelStatus(status.configured ? "ready" : "unavailable");
    })();
    return () => {
      alive = false;
    };
  }, [user]);

  // Persist (debounced), last 40 turns.
  useEffect(() => {
    if (!hydrated.current) return;
    const id = setTimeout(() => {
      AsyncStorage.setItem(CHAT_KEY, JSON.stringify(messages.slice(-40))).catch(() => {});
    }, 400);
    return () => clearTimeout(id);
  }, [messages]);

  // Generate unique message ID
  const generateMessageId = useCallback((): string => {
    return `msg-${Date.now()}-${++messageIdRef.current}`;
  }, []);

  /**
   * One turn, end to end — the single path every send, retry and queue-flush
   * takes. The user's words enter the transcript here and are never removed from
   * it; every line of the rail is emitted from a real event on this path.
   */
  const runTurn = useCallback(
    async (userMessage: string, opts?: { attachments?: Attachment[]; isRetry?: boolean }) => {
      let attachments = opts?.attachments ?? [];
      if ((!userMessage.trim() && attachments.length === 0) || !user) return;

      lastTurnRef.current = { text: userMessage, attachments };
      stoppedRef.current = false;
      setTurnError(null);
      setError(null);
      setTurnStartedAt(Date.now());
      setLoading(true);
      inFlight.current = true;
      // The Stop control aborts THIS controller — the transport is handed it, so
      // stopping really stops the request instead of paying for a reply the user
      // cancelled.
      const controller = new AbortController();
      abortRef.current = controller;

      // On the first turn, hand Sumaiya the user's saved Career Profile so she
      // doesn't ask them to re-type their history. (Server-side assembleUserContext
      // still runs too; this covers the device-local profile.)
      let profileBlock = "";
      if (messages.length === 0) {
        try { profileBlock = profilePromptBlock(await loadProfile()); } catch { /* ignore */ }
      }

      // What she already knows about this person — facts learned across previous
      // sessions, not just the profile they typed. Rendered into the FIRST item
      // of the transcript so it lives in a stable prefix: the provider's prompt
      // cache only pays out on an identical prefix, and this changes far less
      // often than the conversation does.
      let memoryBlock = "";
      try { memoryBlock = renderMemoryBlock(await loadMemory(), t); } catch { /* ignore */ }

      // A retry re-uses the SAME turn: the words are already in the transcript
      // and are never removed, so the rail restarts on the message that is
      // already there instead of appending it a second time.
      const existingUserId = [...messages].reverse().find((m) => m.author === "user")?.id;
      const userMsgId = opts?.isRetry && existingUserId ? existingUserId : generateMessageId();
      const readable = attachments.filter((a) => a.kind === "image" || a.kind === "document");
      const userMsg: ChatMessage = {
        id: userMsgId,
        type: 'text',
        author: 'user',
        content: userMessage.trim(),
        data: {},
        timestamp: new Date(),
        attachments: attachments.length
          ? attachments.map((a) => ({ ...a, extracting: readable.some((r) => r.id === a.id) }))
          : undefined,
      };
      if (!opts?.isRetry) setMessages(prev => [...prev, userMsg]);
      setDelivery((d) => ({ ...d, [userMsgId]: 'sending' }));
      setProgress({
        received: true,
        files: readable.length
          ? attachments.filter((a) => readable.some((r) => r.id === a.id)).map((a) => ({ name: a.name }))
          : undefined,
        awaiting: false,
        answering: false,
      });

      // Read each file's text BEFORE talking to Sumaiya, so she works from what
      // the document says — not from its name (which is how she used to "quote"
      // content that was never sent).
      if (readable.length) {
        attachments = await Promise.all(
          attachments.map(async (a) =>
            readable.some((r) => r.id === a.id) ? { ...a, ...(await extractAttachment(a)) } : a,
          ),
        );
        setMessages(prev =>
          prev.map(m => (m.id === userMsgId ? { ...m, attachments } : m)),
        );
        // The rail's file line reports the REAL outcome of the read: the count of
        // characters she got (`herufi 2,340`), or the app's own cause-specific
        // sentence when it failed.
        setProgress((p) => ({
          ...(p ?? { received: true, awaiting: false, answering: false }),
          files: attachments
            .filter((a) => readable.some((r) => r.id === a.id))
            .map((a) => ({
              name: a.name,
              chars: a.extractedText ? a.extractedText.length : undefined,
              error: a.extractedText ? undefined : a.extractError,
            })),
        }));
      }

      const note = attachmentsContext(attachments);
      const outgoing = [profileBlock, userMessage.trim(), note].filter(Boolean).join("\n\n");

      setProgress((p) => ({
        ...(p ?? { received: true, files: undefined, awaiting: false, answering: false }),
        awaiting: true,
      }));

      try {
        // Real AI reply via the Bearer-authenticated Hono endpoint. Multi-turn:
        // send the recent transcript so Sumaiya remembers the conversation.
        // Prepend the synthetic greeting so she doesn't re-introduce herself.
        const history: { role: "user" | "assistant"; content: string }[] = [
          { role: "assistant", content: [greetingFor(lang), memoryBlock].filter(Boolean).join("\n\n") },
          ...messages
            .filter(m => m.content?.trim())
            .map(m => ({
              role: m.author === "user" ? ("user" as const) : ("assistant" as const),
              content: m.content,
            })),
          { role: "user" as const, content: outgoing },
        ];
        const { message: replyText } = await apiClient.sendChatMessage(history, undefined, lang, controller.signal);

        // A reply arrived: the provider is up, whatever the entry probe said.
        setModelStatus("ready");
        setProgress((p) => ({
          ...(p ?? { received: true, files: undefined, awaiting: true, answering: false }),
          awaiting: false,
          answering: true,
        }));

        const sumaiyaResponse: SumaiyaResponse = {
          id: generateMessageId(),
          type: 'text',
          content: replyText,
          data: {},
        };

        // No streaming (see reply-bubbles.ts) — but a long reply popping in
        // as one wall of text reads like a form submission, not a
        // conversation. Stage it as separate bubbles instead, each after a
        // short "typing" pause. Suggestions still key off the FULL text
        // (sumaiyaResponse.content, untouched) and land on the last bubble.
        const bubbles = splitReplyIntoBubbles(replyText);
        for (let i = 0; i < bubbles.length; i++) {
          if (i > 0) await sleep(BUBBLE_DELAY_MS);
          // Stopping keeps the partial work: bubbles already delivered stay.
          if (stoppedRef.current) break;
          const bubbleMsg: ChatMessage = {
            id: generateMessageId(),
            type: sumaiyaResponse.type,
            author: 'sumaiya',
            content: bubbles[i],
            data: {},
            timestamp: new Date()
          };
          setMessages(prev => [...prev, bubbleMsg]);
        }

        // Generate suggestions based on conversation
        const suggestions = generateSuggestions(userMessage, sumaiyaResponse);
        if (suggestions.length > 0) {
          setMessages(prev => {
            const lastMsg = prev[prev.length - 1];
            return [
              ...prev.slice(0, -1),
              {
                ...lastMsg,
                data: {
                  ...lastMsg.data,
                  suggestions
                }
              }
            ];
          });
        }

        setDelivery((d) => ({ ...d, [userMsgId]: 'sent' }));
        setProgress((p) => ({
          ...(p ?? { received: true, files: undefined, awaiting: false, answering: true }),
          awaiting: false,
          answering: true,
          outcome: 'ok',
        }));
      } catch (err) {
        // Stopping is not a failure: the words stay, the partial work stays, and
        // no error card is raised for something the user chose.
        if (stoppedRef.current || (isTransportError(err) && err.kind === "aborted")) {
          setDelivery((d) => ({ ...d, [userMsgId]: 'sent' }));
          setProgress((p) => ({
            ...(p ?? { received: true, awaiting: false, answering: false }),
            awaiting: false,
            outcome: 'stopped',
          }));
          return;
        }

        const status = isTransportError(err) ? err.status : undefined;
        const modelMissing = isModelUnavailableStatus(status);
        // Everything goes through the shared mapper, which reads `status` and
        // `kind` — never `message`. On this path `message` is English
        // ("Network error. Check your connection.") or a raw HTTP status line
        // ("500 Internal Server Error") or, on the web's 503, the literal body
        // "AI is not configured." — and all three were reaching a Swahili screen.
        // `safeUnavailableText` is the last gate: a raw English body can no
        // longer become a bubble in a Swahili conversation.
        const localized = friendlyApiError(err, lang);
        setTurnError({
          // A model that is missing gets HER sentence about herself, not a
          // transport sentence about a network.
          text: modelMissing ? safeUnavailableText("", lang, "mid-turn") : safeUnavailableText(localized, lang, "mid-turn"),
          modelMissing,
          variant: "mid-turn",
        });
        setDelivery((d) => ({ ...d, [userMsgId]: 'failed' }));
        setProgress((p) => ({
          ...(p ?? { received: true, awaiting: false, answering: false }),
          awaiting: false,
          outcome: 'failed',
        }));
        if (modelMissing) setModelStatus("unavailable");
        reportError(err, { scope: 'sumaiyaChat.send' });
      } finally {
        inFlight.current = false;
        abortRef.current = null;
        setLoading(false);
      }
    },
    [user, generateMessageId, messages, lang, t]
  );

  /**
   * The composer is never blocked (§3.1 / R2). A message sent while a turn is
   * running is KEPT and sent the moment that turn ends — the alternative is a
   * locked field, which was the single biggest violation of the motion
   * standard's own "motion is never a gate" rule in the product.
   */
  const sendMessage = useCallback(
    async (userMessage: string, opts?: { attachments?: Attachment[]; context?: Record<string, any> }) => {
      if (inFlight.current) {
        setQueued({ text: userMessage, attachments: opts?.attachments ?? [] });
        return;
      }
      await runTurn(userMessage, { attachments: opts?.attachments });
    },
    [runTurn]
  );

  /** Send the queued turn, if any — fired automatically when a turn finishes. */
  const flushQueue = useCallback(async () => {
    if (inFlight.current || !queued) return;
    const next = queued;
    setQueued(null);
    await runTurn(next.text, { attachments: next.attachments });
  }, [queued, runTurn]);

  useEffect(() => {
    if (!loading && queued) void flushQueue();
  }, [loading, queued, flushQueue]);

  /**
   * Stop the turn: the request is aborted for real, the rail closes with the
   * partial work intact, and the user's words stay exactly where they are.
   * Stopping is never allowed to cost them what they wrote.
   */
  const stopTurn = useCallback(() => {
    stoppedRef.current = true;
    abortRef.current?.abort();
    setQueued(null);
  }, []);

  /**
   * Retry the turn that failed — the SAME words. This is the rule the whole
   * unavailable state is built on: a retry must never cost the user a retype
   * (and therefore another upload) to re-send something the model already got.
   */
  const retryLastTurn = useCallback(async () => {
    const last = lastTurnRef.current;
    if (!last || inFlight.current) return;
    await runTurn(last.text, { attachments: last.attachments, isRetry: true });
  }, [runTurn]);

  // Generate contextual suggestions based on user message and response
  // The "one decision per screen, big buttons" idea, applied to the chat:
  // after each reply we offer up to three concrete next steps, matched on both
  // sides of the exchange and in either language. Bilingual, and every action
  // routes somewhere real.
  const generateSuggestions = (
    userMessage: string,
    response: SumaiyaResponse
  ): SuggestionChip[] => {
    const hay = `${userMessage} ${response.content}`.toLowerCase();
    const has = (...ws: string[]) => ws.some((w) => hay.includes(w));
    const out: SuggestionChip[] = [];
    const add = (id: string, en: string, sw: string, emoji: string, action: ActionType, data?: Record<string, unknown>) =>
      out.push({ id, text: t(en, sw), emoji, action, data });

    // "Where do I even find vacancies?" comes BEFORE anyone has an advert to
    // bring — and it's the one answer they can act on tonight. When the user's
    // OWN message is a search question this chip takes the first slot: the list
    // is capped at three, and a sources chip that gets cut helps nobody. Only
    // the user's words count here — her reply mentions jobs constantly.
    const jobSearch = ['find', 'tafuta', 'search', 'vacancy', 'vacancies', 'nafasi', 'where', 'wapi', 'site', 'tovuti', 'nearby', 'karibu']
      .some((w) => userMessage.toLowerCase().includes(w));
    if (jobSearch) {
      add('find-jobs', 'Where to find jobs', 'Wapi kupata kazi', '🧭', 'learn', { section: 'sources' });
    }

    if (has('skill', 'ujuzi', 'gap', 'pengo', 'learn', 'jifunze', 'course', 'kozi')) {
      add('learn', 'Learning hub', 'Kituo cha kujifunza', '📚', 'learn', { skills: response.data.skills });
    }
    if (has('interview', 'usaili', 'practice', 'mazoezi')) {
      add('practice', 'Interview prep', 'Maandalizi ya usaili', '🎤', 'practice', { skills: response.data.skills });
    }
    if (has('cv', 'resume', 'wasifu', 'summary', 'muhtasari', 'experience', 'uzoefu')) {
      add('open-cv', 'Open my CV', 'Fungua CV yako', '📄', 'open-cv');
      // `Kagua CV yako` — the outcome, not the mechanism: §3.6c defect 3 caught
      // `Kagua ATS` naming the mechanism in Swahili (swahili-lint-ignore: cited counter-example), which the Swahili standard
      // forbids, and §3.5 J4 caught the same action under two names.
      add('ats', 'Check your CV', 'Kagua CV yako', '🛡️', 'edit-cv', { section: 'ats' });
    }
    if (has('job', 'kazi', 'apply', 'omba', 'advert', 'tangazo', 'tailor', 'lenga')) {
      add('tailor', 'Tailor to a job', 'Lenga kwenye kazi', '🎯', 'open-cv', { section: 'jobs' });
    }
    if (has('letter', 'barua')) {
      add('letter', 'Cover letter', 'Barua ya maombi', '✉️', 'edit-cv', { template: 'letter' });
    }

    // de-dup by id, cap at 3
    const seen = new Set<string>();
    return out.filter((s) => (seen.has(s.id) ? false : seen.add(s.id))).slice(0, 3);
  };

  // Handle action trigger (when user taps a suggestion or button)
  const handleAction = useCallback(
    async (action: ActionType, data?: Record<string, any>) => {
      // Action handlers are implemented in the UI component
      // This hook just manages chat state
      return { action, data };
    },
    []
  );

  // Clear chat history
  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
    setTurnError(null);
    setDelivery({});
    setProgress(null);
    setQueued(null);
    AsyncStorage.removeItem(CHAT_KEY).catch(() => {});
  }, []);

  // Build a structured CV from everything the user told Sumaiya in this chat
  // (+ their saved profile). Appends a 'cv-ready' message the screen renders as
  // an interactive preview.
  const [buildingCv, setBuildingCv] = useState(false);
  const buildCvFromChat = useCallback(async () => {
    if (!user || buildingCv) return;
    setBuildingCv(true);
    setError(null);
    setTurnStartedAt(Date.now());
    setProgress({ received: true, awaiting: true, answering: false });
    try {
      let profileBlock = "";
      try { profileBlock = profilePromptBlock(await loadProfile()); } catch { /* ignore */ }
      const said = messages
        .filter((m) => m.content?.trim())
        .map((m) => `${m.author === "user" ? "Me" : "Sumaiya"}: ${m.content.trim()}`)
        .join("\n");
      const transcript = [profileBlock, said].filter(Boolean).join("\n\n");
      if (transcript.trim().length < 20) {
        setError(t("Tell Sumaiya a bit about yourself first.", "Mwambie Sumaiya kidogo kukuhusu kwanza."));
        setProgress(null);
        return;
      }
      const { cv } = await apiClient.buildCv(transcript, lang);
      setModelStatus("ready");
      setMessages((prev) => [
        ...prev,
        {
          id: generateMessageId(),
          type: "cv-ready",
          author: "sumaiya",
          content: t("Here's your CV — check it, pick a look, and save it.", "Hii hapa CV yako — iangalie, chagua muonekano, na uihifadhi."),
          data: { cv },
          timestamp: new Date(),
        },
      ]);
      setProgress((p) => ({
        ...(p ?? { received: true, awaiting: true, answering: false }),
        awaiting: false,
        answering: true,
        outcome: "ok",
      }));
    } catch (err) {
      const status = isTransportError(err) ? err.status : undefined;
      const modelMissing = isModelUnavailableStatus(status);
      const localized = friendlyApiError(err, lang, {
        en: "I couldn't build the CV just now. Try again.",
        sw: "Sikuweza kutengeneza CV sasa. Jaribu tena.",
      });
      setTurnError({
        text: modelMissing ? safeUnavailableText("", lang, "mid-turn") : safeUnavailableText(localized, lang, "mid-turn"),
        modelMissing,
        variant: "mid-turn",
      });
      if (modelMissing) setModelStatus("unavailable");
      setProgress((p) => ({
        ...(p ?? { received: true, awaiting: false, answering: false }),
        awaiting: false,
        outcome: "failed",
      }));
      reportError(err, { scope: "sumaiyaChat.buildCv" });
    } finally {
      setBuildingCv(false);
    }
  }, [user, buildingCv, messages, lang, t, generateMessageId]);

  // Fetch learning resources for specific skills — real, verified course
  // links (lib/learning-resources.ts on the backend), never AI-invented.
  // Rating/duration/difficulty aren't tracked by that KB, so we report them
  // as unknown rather than fabricate numbers the UI would render as real.
  const fetchLearningResources = useCallback(
    async (skills: SkillGap[]) => {
      if (!user) return null;

      try {
        const resources = await apiClient.getLearningResources(skills.map(s => s.skill));
        return resources.map((r): LearningResource => ({
          id: r.id,
          name: r.title,
          url: r.url,
          platform: r.platform,
          duration: '',
          rating: 0,
          description: r.free ? t('Free', 'Bure') : t('Paid', 'Inalipwa'),
          difficulty: 'beginner',
        }));
      } catch (err) {
        reportError(err, { scope: 'sumaiyaChat.learningResources' });
        return null;
      }
    },
    [user, t]
  );

  /**
   * Try a failed file read again.
   *
   * A failed read used to be a dead end: the chip said it couldn't be read and
   * the only way forward was to re-attach the file. Now the user taps retry, we
   * re-read that one attachment, and on success we hand the recovered text
   * straight to Sumaiya as the next turn — so the thing they actually asked for
   * gets finished instead of them having to re-explain it.
   */
  const retryAttachment = useCallback(
    async (messageId: string, attachmentId: string) => {
      const target = messages
        .find((m) => m.id === messageId)
        ?.attachments?.find((a) => a.id === attachmentId);
      if (!target) return;

      setMessages((prev) =>
        prev.map((m) =>
          m.id !== messageId
            ? m
            : {
                ...m,
                attachments: m.attachments?.map((a) =>
                  a.id === attachmentId
                    ? { ...a, extracting: true, extractError: undefined, extractErrorCode: undefined }
                    : a,
                ),
              },
        ),
      );

      const patch = await extractAttachment(target);
      const merged: Attachment = { ...target, ...patch };

      setMessages((prev) =>
        prev.map((m) =>
          m.id !== messageId
            ? m
            : { ...m, attachments: m.attachments?.map((a) => (a.id === attachmentId ? merged : a)) },
        ),
      );

      if (!merged.extractedText) return;

      const line = t(
        `I read "${merged.name}" again and it worked this time. Please continue with it.`,
        `Nimeisoma "${merged.name}" tena na imefanikiwa. Tafadhali endelea nayo.`,
      );
      // Inline the recovered text rather than re-attaching the file: a real
      // attachment would be re-extracted (another upload) for no gain.
      await sendMessage(`${line}\n\n${attachmentsContext([merged])}`, { attachments: [] });
    },
    [messages, t, sendMessage],
  );

  /** The rail's rows for the current (or last) turn, from the real events. */
  const turnSteps: ChatStep[] = useMemo(() => (progress ? buildTurnSteps(progress) : []), [progress]);

  return {
    // State
    messages,
    loading,
    error,
    delivery,
    turnSteps,
    turnStartedAt,
    turnError,
    modelStatus,
    queued,
    /** True while a turn is in flight — the rail is on screen with it. */
    turnActive: loading && progress?.outcome === undefined,
    /**
     * How the last turn ended. A `failed` turn leaves NO receipt behind: a
     * collapsed "I did these steps ✓" line under a failure reads as success, and
     * the error card is the story (T7). A `stopped` turn does leave one — the
     * partial work is real and she says so.
     */
    turnOutcome: progress?.outcome,

    // Actions
    sendMessage,
    handleAction,
    clearChat,
    fetchLearningResources,
    buildCvFromChat,
    buildingCv,
    retryAttachment,
    stopTurn,
    retryLastTurn,
    flushQueue,
    /** The user chose to write it themselves — clear the failure, keep the words. */
    dismissTurnError: () => setTurnError(null),
    /** A local (non-transport) message the user has read, e.g. "tell me a bit first". */
    dismissError: () => setError(null),

    // Utils
    generateMessageId
  };
}
