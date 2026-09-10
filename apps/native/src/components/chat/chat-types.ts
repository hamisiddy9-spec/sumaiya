/**
 * Chat message types and interfaces for Sumaiya AI assistant
 */

export type MessageType = 'text' | 'skill-gap' | 'recommendation' | 'action' | 'learning' | 'cv-ready';
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
}

export type AttachmentKind = 'image' | 'document' | 'link' | 'cv';

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
  { id: 'cv-builder', label: 'Build my CV', labelSw: 'Tengeneza CV yangu', icon: 'file-text', action: 'open-cv' },
  { id: 'job-letter', label: 'Cover letter', labelSw: 'Barua ya maombi', icon: 'mail', action: 'edit-cv', data: { template: 'letter' } },
  { id: 'learn-skills', label: 'Learn a skill', labelSw: 'Jifunze ujuzi', icon: 'briefcase', action: 'learn' },
  { id: 'free-chat', label: 'Just talk', labelSw: 'Tuongee tu', icon: 'message-circle', action: 'chat' },
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
