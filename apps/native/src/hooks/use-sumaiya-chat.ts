/**
 * Hook for managing Sumaiya AI chat state and logic
 */

import { useCallback, useRef, useState } from 'react';
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
import { describeAttachments } from '../lib/attachments';
import { loadProfile, profilePromptBlock } from '../lib/profile-store';
import { useLang, greetingFor } from '../lib/i18n';

// The greeting shown before any real turn is now language-aware — see
// greetingFor() in lib/i18n. It's fed to the model as the first history entry
// so it knows it has already introduced itself (otherwise the user's first
// real reply — e.g. "Kiswahili" — makes it start over).

export function useSumaiyaChat() {
  const { user } = useAuthContext();
  const { lang, t } = useLang();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messageIdRef = useRef(0);

  // Generate unique message ID
  const generateMessageId = useCallback((): string => {
    return `msg-${Date.now()}-${++messageIdRef.current}`;
  }, []);

  // Send message to Sumaiya backend
  const sendMessage = useCallback(
    async (userMessage: string, opts?: { attachments?: Attachment[]; context?: Record<string, any> }) => {
      const attachments = opts?.attachments ?? [];
      if ((!userMessage.trim() && attachments.length === 0) || !user) return;

      setError(null);
      setLoading(true);

      // Until /api/mobile/import ships, an attachment can't be uploaded — it
      // rides along as a described context line so Sumaiya can respond usefully
      // ("I see you attached your old CV — want me to pull your history from it?").
      const note = describeAttachments(attachments);
      // On the first turn, hand Sumaiya the user's saved Career Profile so she
      // doesn't ask them to re-type their history. (Server-side assembleUserContext
      // still runs too; this covers the device-local profile.)
      let profileBlock = "";
      if (messages.length === 0) {
        try { profileBlock = profilePromptBlock(await loadProfile()); } catch { /* ignore */ }
      }
      const outgoing = [profileBlock, userMessage.trim(), note].filter(Boolean).join("\n\n");

      // Add user message to chat
      const userMsg: ChatMessage = {
        id: generateMessageId(),
        type: 'text',
        author: 'user',
        content: userMessage.trim() || note,
        data: {},
        timestamp: new Date(),
        attachments: attachments.length ? attachments : undefined,
      };

      setMessages(prev => [...prev, userMsg]);

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
        const { message: replyText } = await apiClient.sendChatMessage(history);

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
        setError(
          t(
            "Couldn't reach Sumaiya. Check your connection and try again.",
            "Imeshindwa kumfikia Sumaiya. Angalia mtandao kisha ujaribu tena.",
          ),
        );
        console.error('Sumaiya chat error:', err);
      } finally {
        setLoading(false);
      }
    },
    [user, generateMessageId, messages, lang, t]
  );

  // Generate contextual suggestions based on user message and response
  const generateSuggestions = (
    userMessage: string,
    response: SumaiyaResponse
  ): SuggestionChip[] => {
    const suggestions: SuggestionChip[] = [];
    const lowerMessage = userMessage.toLowerCase();

    // Skill-related keywords
    if (
      lowerMessage.includes('skill') ||
      lowerMessage.includes('gap') ||
      lowerMessage.includes('weak') ||
      lowerMessage.includes('improve') ||
      lowerMessage.includes('learn')
    ) {
      suggestions.push({
        id: 'learn-now',
        text: 'Learn now',
        emoji: '📚',
        action: 'learn',
        data: { skills: response.data.skills }
      });
      suggestions.push({
        id: 'fix-cv',
        text: 'Fix my CV',
        emoji: '🔧',
        action: 'edit-cv'
      });
    }

    // CV-related keywords
    if (
      lowerMessage.includes('cv') ||
      lowerMessage.includes('resume') ||
      lowerMessage.includes('experience') ||
      lowerMessage.includes('summary')
    ) {
      suggestions.push({
        id: 'open-cv',
        text: 'Open CV',
        emoji: '📄',
        action: 'open-cv'
      });
      suggestions.push({
        id: 'tips',
        text: 'Show tips',
        emoji: '💡',
        action: 'view-resources'
      });
    }

    // Job search keywords
    if (lowerMessage.includes('job') || lowerMessage.includes('apply')) {
      suggestions.push({
        id: 'browse-jobs',
        text: 'Browse jobs',
        emoji: '💼',
        action: 'open-cv', // Navigate to jobs section
        data: { section: 'jobs' }
      });
      suggestions.push({
        id: 'improve-cv',
        text: 'Improve CV',
        emoji: '⚡',
        action: 'edit-cv'
      });
    }

    // Practice/practice keywords
    if (lowerMessage.includes('practice') || lowerMessage.includes('exercise')) {
      suggestions.push({
        id: 'practice',
        text: 'Start practice',
        emoji: '🚀',
        action: 'practice',
        data: { skills: response.data.skills }
      });
    }

    return suggestions.slice(0, 3); // Limit to 3 suggestions
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
  }, []);

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
          description: r.free ? 'Free' : 'Paid',
          difficulty: 'beginner',
        }));
      } catch (err) {
        console.error('Learning resources error:', err);
        return null;
      }
    },
    [user]
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

    // Utils
    generateMessageId
  };
}
