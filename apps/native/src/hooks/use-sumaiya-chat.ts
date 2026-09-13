/**
 * Hook for managing Sumaiya AI chat state and logic
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthContext } from '../contexts/auth-context';
import { apiClient } from '../lib/api-client';
import { ApiError } from '@sumaiya/api-client';
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
import { reportError } from '../lib/reporting';
import { useLang, greetingFor } from '../lib/i18n';

// The greeting shown before any real turn is now language-aware — see
// greetingFor() in lib/i18n. It's fed to the model as the first history entry
// so it knows it has already introduced itself (otherwise the user's first
// real reply — e.g. "Kiswahili" — makes it start over).

const CHAT_KEY = 'sumaiya_chat_v1';

export function useSumaiyaChat() {
  const { user } = useAuthContext();
  const { lang, t } = useLang();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messageIdRef = useRef(0);
  const hydrated = useRef(false);

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

  // Send message to Sumaiya backend
  const sendMessage = useCallback(
    async (userMessage: string, opts?: { attachments?: Attachment[]; context?: Record<string, any> }) => {
      let attachments = opts?.attachments ?? [];
      if ((!userMessage.trim() && attachments.length === 0) || !user) return;

      setError(null);
      setLoading(true);

      // On the first turn, hand Sumaiya the user's saved Career Profile so she
      // doesn't ask them to re-type their history. (Server-side assembleUserContext
      // still runs too; this covers the device-local profile.)
      let profileBlock = "";
      if (messages.length === 0) {
        try { profileBlock = profilePromptBlock(await loadProfile()); } catch { /* ignore */ }
      }

      const userMsgId = generateMessageId();
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
      setMessages(prev => [...prev, userMsg]);

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
      }

      const note = attachmentsContext(attachments);
      const outgoing = [profileBlock, userMessage.trim(), note].filter(Boolean).join("\n\n");

      try {
        // Real AI reply via the Bearer-authenticated Hono endpoint. Multi-turn:
        // send the recent transcript so Sumaiya remembers the conversation.
        // Prepend the synthetic greeting so she doesn't re-introduce herself.
        const history: { role: "user" | "assistant"; content: string }[] = [
          { role: "assistant", content: greetingFor(lang) },
          ...messages
            .filter(m => m.content?.trim())
            .map(m => ({
              role: m.author === "user" ? ("user" as const) : ("assistant" as const),
              content: m.content,
            })),
          { role: "user" as const, content: outgoing },
        ];
        const { message: replyText } = await apiClient.sendChatMessage(history, undefined, lang);

        const sumaiyaResponse: SumaiyaResponse = {
          id: generateMessageId(),
          type: 'text',
          content: replyText,
          data: {},
        };

        // Convert to chat message
        const assistantMsg: ChatMessage = {
          id: generateMessageId(),
          type: sumaiyaResponse.type,
          author: 'sumaiya',
          content: sumaiyaResponse.content,
          data: sumaiyaResponse.data,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, assistantMsg]);

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
      } catch (err) {
        // Surface what the server actually said (AI not configured, quota hit,
        // session expired…) instead of a blanket "check your connection" —
        // status 0 is the only genuine network/timeout case.
        if (err instanceof ApiError && err.status !== 0) {
          if (err.status === 401) {
            setError(t("Your session expired — sign in again.", "Kipindi chako kimeisha — ingia tena."));
          } else if (err.status === 503) {
            setError(t("Sumaiya isn't switched on yet. Try again soon.", "Sumaiya bado hajawashwa. Jaribu tena hivi punde."));
          } else if (err.status === 429) {
            setError(err.message);
          } else {
            setError(err.message || t("Something went wrong. Try again.", "Kuna hitilafu. Jaribu tena."));
          }
        } else {
          setError(
            t(
              "Couldn't reach Sumaiya. Check your connection and try again.",
              "Imeshindwa kumfikia Sumaiya. Angalia mtandao kisha ujaribu tena.",
            ),
          );
        }
        reportError(err, { scope: 'sumaiyaChat.send' });
      } finally {
        setLoading(false);
      }
    },
    [user, generateMessageId, messages, lang, t]
  );

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
      add('open-cv', 'Open my CV', 'Fungua CV yangu', '📄', 'open-cv');
      add('ats', 'Check ATS', 'Kagua ATS', '🛡️', 'edit-cv', { section: 'ats' });
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
        return;
      }
      const { cv } = await apiClient.buildCv(transcript, lang);
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
    } catch (err) {
      if (err instanceof ApiError && err.status !== 0) {
        setError(err.message);
      } else {
        setError(t("Couldn't build the CV just now. Try again.", "Imeshindwa kutengeneza CV sasa. Jaribu tena."));
      }
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

  return {
    // State
    messages,
    loading,
    error,

    // Actions
    sendMessage,
    handleAction,
    clearChat,
    fetchLearningResources,
    buildCvFromChat,
    buildingCv,
    retryAttachment,

    // Utils
    generateMessageId
  };
}
