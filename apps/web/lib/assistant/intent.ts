/**
 * Conversational intelligence for Sumaiya — intent router + conversation state.
 *
 * Sumaiya is a companion FIRST and a career/document assistant SECOND. This
 * module is the deterministic brain that decides, on every turn, what kind of
 * message the user just sent and whether a document is actually being built:
 *
 *   - classifyIntent(text)      → what is the user DOING (greeting, chitchat,
 *                                 sports, a career request, a refusal…)
 *   - analyzeConversation(...)  → thread-level state: is a doc mode active,
 *                                 has the user refused/ignored career prompts
 *                                 enough to LOCK them out, is intake on now
 *   - buildConversationGuidance → the instruction block injected into the
 *                                 system prompt so the model follows the user's
 *                                 lead instead of replaying the CV script.
 *
 * Pure + deterministic (no AI) so every rule is unit-testable. The LLM never
 * "decides" to nag again because the prompt literally tells it the user's
 * current intent and silences the career script when it does not apply.
 */

export type DocKind = "cv" | "cover-letter" | "business-card" | "letter" | null;

export type IntentKind =
  | "greeting"
  | "chitchat"
  | "about-you"
  | "sports"
  | "thanks"
  | "bye"
  | "career-refusal"
  | "cv"
  | "job"
  | "doc"
  | "name"
  | "general";

export interface MessageLike {
  role: "user" | "assistant";
  content: string;
}

export interface ConversationState {
  /** Total user turns in the thread (1 = this is the very first message). */
  userTurnCount: number;
  /** Intent of the LAST user message. */
  latest: IntentKind;
  /** The last user message text (sanitised). */
  latestText: string;
  /** True when the last user message is the only user message in the thread. */
  isFirstUserTurn: boolean;
  /**
   * The document being built, if one is engaged: the client-selected docType,
   * OR derived from an explicit career request ("nataka CV", "barua ya kazi"…)
   * OR a first-turn name reply (the guest funnel: "tell me your name").
   * Null = general conversation — Sumaiya must NOT gather document details.
   */
  docMode: DocKind;
  /**
   * Whether Sumaiya should actively gather document details THIS turn.
   * False when no doc is engaged, when the doc is locked out, or when the
   * user's latest message is off-topic (they changed the subject).
   */
  intakeActive: boolean;
  /** Count of explicit career refusals ("acha story za kazi"). */
  careerRefusals: number;
  /** Count of clear topic switches away from career while a doc was pending. */
  topicSwitches: number;
  /**
   * Hard career lockout: the user refused/ignored career prompts ≥ 2 times.
   * While locked, NO career/document/ATS/match content may be raised until the
   * user explicitly asks for career help again (which resets the counters).
   */
  lockout: boolean;
  /** Lockout flipped to true ON this turn (was false one message ago). */
  lockoutThisTurn: boolean;
  /**
   * True when the caller should clear its docType selection (the client chose
   * a document chip but the user has since refused/abandoned it ≥ 2 times).
   */
  leaveDocMode: boolean;
}

// ── Normalisation ──────────────────────────────────────────────────────────

export function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[.,!?;:()\[\]{}«»„“]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ── Phrase rules (ordered — first match wins) ──────────────────────────────

const REFUSAL_RE = [
  /\b(acha|usia?che)\s+(na\s+)?(hizo|hiyo|zile|story|kazi|maswali|questions|tu|sasa|kabisa)\b/,
  /\bacha\s+story\b/,
  /\bbasta\b/,
  /\btosha\b/,
  /\bstop\b/,
  /\bleave\s+(it|that|this|the\s+(cv|job))\b/,
  /\bsitaki\b/,
  /\bnimechoka\b/,
  /\busini?ulize\b/,
  /\busiulize\b/,
  /\bsijibu\b/,
  /\bno\s+(more\s+)?(jobs?|career|cv|questions?)\b/,
  /\bnot\s+(now|today|interested|again)\b/,
  /\bsihitaji\b/,
  // NOTE: "sijui" (I don't know) and "siwezi" (I can't) are deliberately NOT
  // refusals. They are Swahili incapacity/helplessness, and in this market they
  // are the most common way a low-literacy user asks for help — "sijui kuandika"
  // means "I don't know how to write", not "leave me alone". Counting them as
  // refusals locked out exactly the people the product exists for: two of them
  // and intent.ts's hard career lockout fired. Withdrawal is "acha", "basta",
  // "tosha", "sitaki", "sihitaji" — not "I can't".
  /\bnataka\s+kupumzika\b/,
];

const COVER_LETTER_RE = /\b(barua\s+ya\s+(maombi|kazi)|cover\s*letter)\b/;
const BUSINESS_CARD_RE = /\b(kadi\s+ya\s+biashara|business\s*card)\b/;
const FORMAL_LETTER_RE = /\b(barua\s+rasmi|formal\s+letter|barua\b)/;
const CV_RE = /\b(cv|curriculum\s+vitae|resume|wasifu)\b/;

// Explicit action words that turn a passing "kazi/job" mention into a build
// request ("naomba kazi" = strong; "nimeona kazi" = smalltalk). \w* prefixes
// catch Swahili verb inflections (naomba / kuomba / nitengeneze / maombi).
const CAREER_ASK_RE = [
  /\b\w*omba\w*\b/,
  /\b(apply|applying|application|applicant)\b/,
  /\b\w*tengene\w*\b/,
  /\b\w*andik\w*\b/,
  /\b(build|create|make|buni)\b/,
  /\b(na?tak?a|need|needs|n?na?hitaji)\b/,
  /\b(nisaidie|help\s+me|msaada|saidia)\b/,
  /\b(boresha|improve|tailor|binafsisha)\b/,
  /\b\w*jeng\w*\b/,
  /\b(jaribu|try)\b/,
  /\b(update|sasisha|badilisha)\b/,
  /\b(pakia|upload)\b/,
];

const JOB_RE =
  /\b(kazi|jobs?|ajira|nafasi|interview|mahojiano|mwajiri|employer|salary|mshahara|career|taaluma|promotion|pandisha|raise)\b/;

const SPORTS_RE = [
  /\bmpira\b/,
  /\bsoka\b/,
  /\bfootball\b/,
  /\bsoccer\b/,
  /\bmechi\b/,
  /\bmatch(es)?\b/,
  /\bmatokeo\b/,
  /\b(premier\s+league|la\s+liga|laliga|champions\s+league|epl|bundesliga|serie\s+a|afcon|world\s+cup)\b/,
  /\btimu\b/,
  /\bgoals?\b/,
  /\bbao\b/,
  /\bkufunga\b/,
  /\balifunga\b/,
  /\bmchezaji\b/,
  /\bbasketball\b/,
  /\bkikapu\b/,
  /\btennis\b/,
  /\bboxing\b/,
  /\bndondi\b/,
  /\bcricket\b/,
  /\brugby\b/,
  /\b(man|city|arsenal|chelsea|liverpool|manu|united|real|barca|barcelona|juventus|simba|yang?ga|azam)\b/,
];

const THANKS_RE = /\b(asante|nashukuru|shukran|thanks|thank\s+you|tenks|thx)\b/;
const BYE_RE = /\b(kwaheri|bye|goodbye|tutaonana|see\s+you|lala\s+salama|usiku\s+mwema|good\s+night)\b/;

const ABOUT_YOU_RE = [
  /\b(upo|uko)\s+wapi\b/,
  /\b(where\s+are\s+you)\b/,
  /\b(wewe\s+ni|ni\s+wewe)\s+(nani|nani\b)/,
  /\b(unaitwa|unaitwaje)\b/,
  /\bjina\s+lako\b/,
  /\b(who\s+are\s+you|what'?s\s+your\s+name|your\s+name)\b/,
  /\b(unaishi|unakaa)\s+wapi\b/,
  /\bumri\s+wako\b/,
  /\buna\s+umri\s+gani\b/,
  /\bhow\s+old\s+are\s+you\b/,
  /\b(unafanya|unafanya\s+nini)\b/,
  /\b(what\s+(are|can|do)\s+you\s+do)\b/,
  /\b(are\s+you\s+a\s+(bot|robot|human)|ni\s+robot|ni\s+bot|wewe\s+ni\s+robot)\b/,
  /\b(unaweza\s+kufanya\s+nini|what\s+can\s+you\s+help)\b/,
];

const CHITCHAT_RE = [
  /\b(tupige|piga|tu?pige)\s+story\b/,
  /\bstory\b/,
  /\b(tuongee|tuzungumze|ongea|ongea\s+nami)\b/,
  /\b(hamna|hakuna)\s+(hata\s+)?(karibu|njema|sawa|kitu)\b/,
  /\bvipi\s+leo\b/,
  /\bsiku\s+yako\b/,
  /\b(imeendaje|umekuwaje|umeamkaje|ikoje|inaendeleaje)\b/,
  /\b(za\s+leo|mambo\s+gani|vipi\s+vipi)\b/,
  /\b(utani|joke|jokes|chekesha)\b/,
  /\b(hehe|hahaha|hihi|lol)\b/,
  /\b(tuache\s+kazi|badala\s+yake)\b/,
  /\bsema\s+niaje\b/,
];

const GREETING_RE = [
  /\bgood\s+(morning|afternoon|evening|day)\b/,
  /\bhabari\s+(za\s+)?(asubuhi|mchana|jioni|usiku|sasa|leo|nyumbani)\b/,
  /\b(hujambo|jambo|mambo|habari|salama|mzima|niaje|sema|vipi|wassup|sup)\b/,
  /\b(hi+|hello|hallo|halo|hey|hola|karibu)\b/,
];

const NAME_PREFIX_RE = /\b(jina\s+langu\s+ni|ni|my\s+name\s+is|name\s+is)\s+/;
const NAME_SHAPE_RE = /^[a-zA-ZÀ-ÖØ-öø-ÿ' .-]+$/;

const STOP_WORDS = new Set([
  "hi", "hello", "hey", "mambo", "habari", "jambo", "hujambo", "vipi", "sasa", "poa",
  "karibu", "asante", "thanks", "bye", "story", "cv", "kazi", "job", "help", "nisaidie",
  "tengeneza", "andika", "what", "where", "who", "why", "wapi", "nani", "lol", "ok", "sawa",
  "yes", "ndio", "no", "hapana", "acha", "basta", "stop", "sijui", "sitaki", "naomba",
]);

function any(re: RegExp | RegExp[], text: string): boolean {
  return (Array.isArray(re) ? re : [re]).some((r) => r.test(text));
}

/** Is this a strong build request rather than a passing career mention? */
export function isCareerAsk(text: string): boolean {
  const t = normalizeText(text);
  if (CV_RE.test(t) || COVER_LETTER_RE.test(t) || BUSINESS_CARD_RE.test(t) || FORMAL_LETTER_RE.test(t)) {
    return true;
  }
  if (!JOB_RE.test(t)) return false;
  return any(CAREER_ASK_RE, t);
}

/**
 * Map a career-related message to the document it is asking for, or null when
 * the message is not a document request. "Job" talk maps to "cv" (the natural
 * first document); specific asks map to their own doc type.
 */
export function resolveDocKind(text: string): Exclude<DocKind, null> | null {
  const t = normalizeText(text);
  if (COVER_LETTER_RE.test(t)) return "cover-letter";
  if (BUSINESS_CARD_RE.test(t)) return "business-card";
  if (FORMAL_LETTER_RE.test(t)) return "letter";
  if (CV_RE.test(t)) return "cv";
  if (JOB_RE.test(t) && isCareerAsk(t)) return "cv";
  return null;
}

/**
 * Deterministic intent classifier for ONE user message. Ordered: refusal →
 * specific doc ask → cv ask → job → sports → thanks → bye → about-you →
 * chitchat → greeting → general. Single-word greetings are matched LAST among
 * the social intents so "vipi matokeo ya mpira" lands on sports, not greeting.
 */
export function classifyIntent(text: string): IntentKind {
  const t = normalizeText(text);
  if (!t) return "general";
  if (any(REFUSAL_RE, t)) return "career-refusal";
  if (COVER_LETTER_RE.test(t) || BUSINESS_CARD_RE.test(t) || FORMAL_LETTER_RE.test(t)) return "doc";
  if (CV_RE.test(t)) return "cv";
  if (isCareerAsk(t)) return "job";
  if (any(SPORTS_RE, t)) return "sports";
  if (any(THANKS_RE, t)) return "thanks";
  if (any(BYE_RE, t)) return "bye";
  if (any(ABOUT_YOU_RE, t)) return "about-you";
  if (any(CHITCHAT_RE, t)) return "chitchat";
  if (any(GREETING_RE, t)) return "greeting";
  // Slang one-word greetings ("sasa", "poa") only when they ARE the message —
  // inside a sentence they are adverbs/adjectives ("kazi sasa", "kazi poa").
  const words = t.split(/\s+/);
  if (words.length === 1 && /^(sasa|poa)$/.test(t)) return "greeting";
  return "general";
}

/** A short first reply that looks like the user giving their name. */
export function looksLikeNameReply(text: string): boolean {
  const t = normalizeText(text).replace(NAME_PREFIX_RE, " ").trim();
  if (t.length < 2 || t.length > 40) return false;
  if (!NAME_SHAPE_RE.test(t)) return false;
  const words = t.split(/\s+/);
  if (words.length > 3) return false;
  if (words.some((w) => STOP_WORDS.has(w))) return false;
  return true;
}

// Topic kinds that pause intake AND (when career is pending) count toward the
// lockout. Greetings/thanks are polite — they pause neither the lockout count
// nor (after the first turn) the intake, so a chatty builder is never locked
// out by accident.
const OFF_TOPIC = new Set<IntentKind>(["chitchat", "sports", "about-you", "bye"]);
const REAFFIRM = new Set<IntentKind>(["cv", "job", "doc", "name"]);
const ENGAGING = new Set<IntentKind>(["general", "name", "cv", "job", "doc"]);

interface Counters {
  careerPending: boolean;
  docMode: Exclude<DocKind, null> | null;
  refusals: number;
  switches: number;
  locked: boolean;
}

/** Walk the user messages and derive counters + effective doc mode. */
function scan(messages: MessageLike[], docType: DocKind): Counters {
  const users = messages.filter((m) => m.role === "user").map((m) => m.content);
  const out: Counters = {
    careerPending: docType != null,
    docMode: docType,
    refusals: 0,
    switches: 0,
    locked: false,
  };
  let engaged = docType != null;
  for (let i = 0; i < users.length; i++) {
    const text = users[i];
    const kind = classifyIntent(text);
    if (kind === "doc" || kind === "cv" || (kind === "job" && isCareerAsk(text))) {
      // Explicit career re-engagement — resets any pending lockout.
      out.careerPending = true;
      engaged = true;
      out.refusals = 0;
      out.switches = 0;
      out.locked = false;
      if (!out.docMode) out.docMode = resolveDocKind(text);
    } else if (
      !out.careerPending &&
      i === 0 &&
      !docType &&
      (kind === "general" || kind === "name") &&
      looksLikeNameReply(text)
    ) {
      // Guest funnel: first reply is their name → CV intake begins.
      out.careerPending = true;
      engaged = true;
      out.docMode = "cv";
    } else if (kind === "name" && !out.careerPending && i === 0 && !docType) {
      out.careerPending = true;
      engaged = true;
      out.docMode = "cv";
    }

    if (!out.careerPending) continue;
    if (kind === "career-refusal") {
      out.refusals += 1;
    } else if (OFF_TOPIC.has(kind)) {
      out.switches += 1;
    } else if ((kind === "greeting" || kind === "thanks") && !engaged && i > 0) {
      // A greeting/thanks when the user has never actually engaged with the
      // build still signals "not interested" — count it as a soft switch.
      out.switches += 1;
    } else if (ENGAGING.has(kind)) {
      engaged = true;
    }
    // No break: a later explicit career ask must be able to reset the lockout.
    if (out.refusals + out.switches >= 2) {
      out.locked = true;
    }
  }
  if (out.locked) {
    out.careerPending = false;
    out.docMode = null;
  }
  return out;
}

/**
 * Full conversation-state analysis for one assistant turn.
 *
 * `messages` is the clean history (user + assistant, card-only entries already
 * dropped) INCLUDING the message the user just sent. `docType` is the
 * client-selected document chip (null when none was chosen).
 */
export function analyzeConversation(messages: MessageLike[], docType: DocKind): ConversationState {
  const users = messages.filter((m) => m.role === "user");
  const latestText = users.length ? users[users.length - 1].content : "";
  const userTurnCount = users.length;
  const isFirstUserTurn = userTurnCount === 1;

  let latest = classifyIntent(latestText);
  // The classifier is context-free; a bare name on the very first turn of a
  // doc-less thread is the guest funnel ("tell me your name") → a build start.
  if (isFirstUserTurn && !docType && latest === "general" && looksLikeNameReply(latestText)) {
    latest = "name";
  }

  const full = scan(messages, docType);
  const before = scan(messages.slice(0, -1), docType);
  const lockoutThisTurn = full.locked && !before.locked;

  // A locked thread has no doc; otherwise the scan-derived mode stands (the
  // client docType param, a derived career ask, or null = general chat).
  const docMode: DocKind = full.locked ? null : full.docMode;

  // Intake is ON only when a doc is engaged, the user is not locked out, and
  // their latest message is on the doc topic. A greeting mid-build (after the
  // first turn) still keeps intake warm — Sumaiya greets back and continues.
  const intakeBlockers = new Set<IntentKind>(["chitchat", "sports", "about-you", "bye", "thanks", "career-refusal"]);
  const intakeActive =
    docMode != null &&
    !full.locked &&
    !intakeBlockers.has(latest) &&
    !(latest === "greeting" && isFirstUserTurn);

  return {
    userTurnCount,
    latest,
    latestText,
    isFirstUserTurn,
    docMode,
    intakeActive,
    careerRefusals: full.refusals,
    topicSwitches: full.switches,
    lockout: full.locked,
    lockoutThisTurn,
    leaveDocMode: lockoutThisTurn && docType != null,
  };
}

// ── Prompt guidance ─────────────────────────────────────────────────────────

const DOC_LABEL: Record<Exclude<DocKind, null>, string> = {
  cv: "CV",
  "cover-letter": "cover letter",
  "business-card": "business card",
  letter: "formal letter",
};

/** One-line human label of the latest intent (English, for the prompt). */
function intentLabel(kind: IntentKind): string {
  switch (kind) {
    case "greeting": return "the user is greeting you";
    case "chitchat": return "the user wants casual conversation / changed the subject";
    case "about-you": return "the user is asking about YOU (who/where/what you are)";
    case "sports": return "the user wants to talk about sports or football";
    case "thanks": return "the user is thanking you";
    case "bye": return "the user is saying goodbye";
    case "career-refusal": return "the user is telling you to STOP the career/document topic";
    case "cv": return "the user is asking about a CV";
    case "job": return "the user is asking about a job / career help";
    case "doc": return "the user is asking for a document (letter / card)";
    case "name": return "the user just gave their name";
    default: return "the user is saying something general";
  }
}

function intentFollow(kind: IntentKind): string {
  switch (kind) {
    case "greeting":
      return "Greet back warmly in their language and ask how they are — short and human. Do NOT start gathering CV/job details and do NOT ask what they want to build.";
    case "about-you":
      return "Answer naturally and honestly: you are Sumaiya, the assistant inside the app. You have no body and no real location — say it lightly ('niko hapa kwenye Sumaiya 😄') and turn it back to them warmly. Never pretend to be human or to have a physical location.";
    case "sports":
      return "Talk about it like a friend. IMPORTANT: you do NOT have live match scores in this chat — if they ask for today's results, say so honestly in one line, ask which match/team they mean, and chat about the game. NEVER invent scores, results or fixtures.";
    case "chitchat":
      return "Match their energy and chat like a friend. Short, natural messages. Do NOT bring up CVs, jobs or documents.";
    case "thanks":
      return "Acknowledge it warmly and briefly ('karibu sana 😊'), then stop. Do NOT follow a thank-you with another question or offer.";
    case "bye":
      return "Say goodbye warmly in their language, in one short line. No follow-up questions, no offers.";
    case "career-refusal":
      return "They are telling you to drop the career/document topic. Acknowledge it with humour and warmth ('sawa sawa 😄 nimeelewa — tufanye kitu kingine'), apologise lightly if you over-pushed, and switch fully to whatever they want — even pure chat. Do NOT ask any gathering question.";
    default:
      return "";
  }
}

/**
 * Build the CONVERSATION-STATE instruction block injected into the system
 * prompt. This is the highest-authority behavioural guidance after security.
 */
export function buildConversationGuidance(state: ConversationState): string {
  const lines: string[] = [];
  lines.push(
    "CONVERSATION INTELLIGENCE (read this carefully — it overrides any document instructions below):",
  );
  lines.push(
    "You are a warm companion FIRST and a career/document assistant SECOND. The user can talk about anything — greetings, jokes, their day, sports, questions about you — and you engage genuinely every time. Career/document help is a service you offer when the user asks for it, never an agenda you push. You NEVER force a conversation back to CVs, jobs or documents.",
  );
  lines.push(
    `• RIGHT NOW ${intentLabel(state.latest)}. Latest user message: "${state.latestText.slice(0, 240)}". Follow this message wherever it leads.`,
  );
  const follow = intentFollow(state.latest);
  if (follow) lines.push(`  ${follow}`);

  if (state.lockout) {
    lines.push(
      "• ⚠️ CAREER LOCKOUT IS ACTIVE: this user has refused or ignored career/document questions at least twice in this thread. Do NOT offer, suggest, hint at, or steer toward CVs, jobs, applications, cover letters, ATS checks, matching or tailoring again — even softly — unless the user EXPLICITLY asks first (e.g. \"nitengeneze CV\"). Until then, just be their friend.",
    );
  }

  if (!state.docMode && !state.lockout) {
    lines.push(
      "• No document is being built and the user has not asked for career help. Do NOT ask \"unataka kutengeneza nini?\" / \"what would you like to create?\" — do not gather names, jobs, skills or contact details, and do not repeat offers that were already on screen. If they mention wanting a CV/job letter/card, the document instructions below apply from then on. A passing mention of work or jobs (\"nimeona kazi\", \"kazi yangu\") is smalltalk, NOT a build request — do not start gathering from it.",
    );
  } else if (state.docMode && !state.intakeActive && !state.lockout) {
    lines.push(
      `• The user earlier chose to build a ${DOC_LABEL[state.docMode]}, but their current message is off that topic. Respond fully to what they just said — do NOT ask any ${DOC_LABEL[state.docMode]} gathering question this turn and do NOT steer them back. If they return to the ${DOC_LABEL[state.docMode]} themselves, resume naturally where you left off.`,
    );
  }

  lines.push(
    "• Anti-repetition: never ask the same question twice, even in different words. If the user refuses or ignores a question twice, infer they want a different interaction and ADAPT — do not re-ask, do not reword, do not push a new career question. A human friend would change the subject, so do you.",
  );
  return lines.join("\n");
}
