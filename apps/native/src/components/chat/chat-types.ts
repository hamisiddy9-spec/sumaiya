/**
 * Chat message types and interfaces for Sumaiya AI assistant
 */

/**
 * The message taxonomy of §3.2, as a union.
 *
 * `'recommendation'` and `'action'` were **retired** (audit M1): nothing ever
 * rendered them, so they were dead union members that made the type look like it
 * had capabilities it did not have. The kinds that arrived with the redesign:
 *
 *   'text'        a turn — the user's (T1) or Sumaiya's (T2)
 *   'system'      T3, the centred note that carries what the app knows
 *   'progress'    T4/T9, the step rail while she works, the receipt after
 *   'unavailable' T8, the honest "I can't think right now" state
 *   'cv-ready'    T5, a produced document
 *   'skill-gap' / 'learning' — kept, and wrapped in the document-card shell
 */
export type MessageType = 'text' | 'skill-gap' | 'learning' | 'cv-ready' | 'system' | 'progress' | 'unavailable';
export type ActionType = 'open-cv' | 'learn' | 'practice' | 'chat' | 'edit-cv' | 'view-resources';
export type MessageAuthor = 'user' | 'sumaiya';

export interface SkillGap {
  skill: string;
  current: number; // 0-1 (0% - 100%)
  required: number; // 0-1
  gap: number; // required - current
}

export interface LearningResource {
  id: string;
  name: string;
  url: string;
  platform: string; // 'freecodecamp', 'coursera', 'udemy', etc.
  duration: string; // '4h', '2 weeks', etc.
  rating: number; // 0-5
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface QuickAction {
  id: string;
  label: string;
  /** Swahili label — the grid renders this when the app is in SW. */
  labelSw?: string;
  icon: string;
  action: ActionType;
  data?: Record<string, any>;
}

export interface SuggestionChip {
  id: string;
  text: string;
  emoji: string;
  action: ActionType;
  data?: Record<string, any>;
}

export interface ChatMessageData {
  // Text message
  content?: string;

  // Skill gap data
  skills?: SkillGap[];
  resources?: LearningResource[];

  // Action suggestions
  suggestions?: SuggestionChip[];
  actions?: QuickAction[];

  // Metadata
  confidence?: number; // 0-1 for AI confidence in response

  // A CV Sumaiya built from the conversation (type: 'cv-ready')
  cv?: import("@sumaiya/types").CVData;
  /**
   * The template the produced CV was actually BUILT with — the card used to
   * hard-code `'classic'` (M5), so the CV shown was not necessarily the CV saved.
   */
  cvTemplateId?: import("../../lib/cv-html").CvTemplateId;

  /** T8: which unavailable variant this is, when the model is missing. */
  unavailable?: 'known' | 'mid-turn' | 'partial';
}

export type AttachmentKind = 'image' | 'document' | 'link' | 'cv';

/**
 * Why a file couldn't be read. Every failure carries one of these so the UI can
 * say the real reason in the user's language, and Sumaiya can relay it instead
 * of guessing. See lib/attachment-extract.ts for the copy + classification.
 */
export type ExtractFailure =
  | 'too_big'
  | 'timeout'
  | 'network'
  | 'auth'
  | 'server'
  | 'scanned_pdf'
  | 'unsupported'
  | 'empty'
  | 'unreadable'
  | 'device_file';

export interface Attachment {
  id: string;
  kind: AttachmentKind;
  /** local file uri (image/document), or the URL for a link, or cvId for 'cv' */
  uri: string;
  name: string;
  mimeType?: string;
  size?: number;
  /** upload lifecycle for the chip UI */
  status: 'pending' | 'uploading' | 'ready' | 'error';
  progress?: number; // 0-1
  /** Text pulled out of the file (OCR for images, unpdf for PDFs) once the
   *  send flow has read it. Powers the "preview what Sumaiya got" sheet. */
  extractedText?: string;
  /** Set instead of extractedText when the file couldn't be read (scanned PDF,
   *  Word doc, network error). Shown in the preview sheet. */
  extractError?: string;
  /** Cause of the failure — drives the localised copy + the retry affordance. */
  extractErrorCode?: ExtractFailure;
  /** True while extraction is in flight. */
  extracting?: boolean;
}

export interface ChatMessage {
  id: string;
  type: MessageType;
  author: MessageAuthor;
  content: string;
  data: ChatMessageData;
  timestamp: Date;
  sending?: boolean; // While message is being sent
  error?: string; // If message failed to send
  /**
   * T1: the user's own turn's delivery word — one word, under the bubble:
   * `Inatuma…` · `Imetumwa` · `Haijatumwa`. The bubble and its words are never
   * removed on failure; it gains an outline instead.
   */
  delivery?: 'sending' | 'sent' | 'failed';
  /**
   * True when the turn's text came from one of the offered openers rather than
   * the user's own typing (audit F5): the bubble says so, because putting words
   * in someone's mouth unmarked is the one thing this vocabulary must not do.
   */
  offeredOpener?: boolean;
  attachments?: Attachment[]; // Files/links the user added to this turn
}

export interface SumaiyaResponse {
  id: string;
  type: MessageType;
  content: string;
  data: ChatMessageData;
  metadata?: {
    model?: string;
    latency?: number;
    confidence?: number;
  };
}

// Quick actions available from greeting
export const INITIAL_QUICK_ACTIONS: QuickAction[] = [
  // §3.6 voice table / mockup 01 #2: this is CHROME the product renders, not
  // something the user said — so it names the outcome in the second person.
  // `Ongea nami` beside it stays first person on purpose: that one IS her
  // speaking, which the Swahili voice rule permits.
  { id: 'cv-builder', label: 'Build my CV', labelSw: 'Tengeneza CV yako', icon: 'file-text', action: 'open-cv' },
  { id: 'job-letter', label: 'Cover letter', labelSw: 'Barua ya maombi', icon: 'mail', action: 'edit-cv', data: { template: 'letter' } },
  { id: 'learn-skills', label: 'Learn a skill', labelSw: 'Jifunze ujuzi', icon: 'briefcase', action: 'learn' },
  { id: 'free-chat', label: 'Just talk', labelSw: 'Ongea nami', icon: 'message-circle', action: 'chat' },
];

// Action types and their handlers
export const ACTION_HANDLERS: Record<ActionType, string> = {
  'open-cv': 'Navigate to CV editor',
  'learn': 'Show learning resources',
  'practice': 'Start skill practice',
  'chat': 'Start free conversation',
  'edit-cv': 'Edit CV section',
  'view-resources': 'View all resources'
};
