# The Chatbox — audit, research, redesign spec, 2026-09-20

**Scope.** The chat surface on both platforms, named explicitly by the owner:
*“feel free to redesign everythings annimations chatbox and its features everthing.”*
This document is a proposal. **No source file was modified.** Everything here is a
spec a developer can build plus five standalone HTML mockups the owner can judge.

**Surfaces audited**

| Platform | Path |
| --- | --- |
| Android / iOS (the real product) | `apps/native/src/screens/sumaiya-chat-screen.tsx` + `apps/native/src/components/chat/*` |
| Web | `apps/web/components/assistant/cv-assistant-client.tsx` (3,913 lines) + `apps/web/components/assistant/*` |

## 0. The premise, and the one line that changed tonight

**The assistant works.** As of 2026-09-20, `GET /api/ai/status` returns
`{"configured":true,"provider":"deepseek"}`, and a real Swahili turn on the device
answered in 1.79 s:

> “Nisaidie kuandika muhtasari mfupi wa CV ya huduma kwa mteja.”
> → “Nzuri, hiyo ni kazi nzuri. Niambie kwanza — unafanya kazi gani kwa sasa au
> ulifanya mara ya mwisho, na kwa kampuni gani?”

**So the redesign assumes a working assistant**, not an outage: the reply arrives, the
document card is produced, the job flow completes. Everything in §3 is the product
with its intelligence on.

**The unavailable state (§3.6, mockup 05) is kept and demoted** from “today's
condition” to **the failure path** — a provider goes down, a rate limit lands, data
runs out, a key is rotated. Its principles are unchanged and non-negotiable (never
beg, never lie, never dead-end), and it is designed *now* so the first real outage is
not met by surprise. Two pieces of evidence keep it honest:

- **Before it was designed**, the app answered `AI is not configured.` in English
  inside a Swahili screen, or `Sumaiya ana shughuli nyingi sasa hivi` in the third
  person, and a button labelled “Boresha na AI” returned the user's own text unchanged
  while reporting success.
- **On the device**, a user who received no reply sent **`Hi` four times** (§3.6c).
  That is the measured cost of the silent version of this state.

**Her reply above is first person** (`Niambie…`, `unafanya kazi gani…`): she speaks,
she is not described. The message taxonomy in §3.2 is built on that, and §3.6's voice
rules apply to the chat's own copy in every state, working or not.

---

**Hard constraints obeyed.** No colour changed, no logo changed, the product is not
renamed, the product's AI is DeepSeek and never Claude, Swahili-first, sell the
outcome and never the mechanism, nothing proposed is a *new capability* without a
named thing it replaces, and the voice for anything spoken is female (ElevenLabs
“Rachel”) — so all written assistant copy is written to be read aloud by her.

**Mockups and how they were checked.** Five standalone HTML files under
`docs/design/2026-09-20/`, phone viewport first, real palette values read from
`apps/web/tailwind.config.ts` and `apps/native/src/components/ui/theme.ts`, real
Swahili copy lifted from the code. Each was rendered at 390×844 in real Chrome,
measured programmatically for content clipping, sent to a vision model for
critique, fixed, and re-rendered. `docs/design/2026-09-20/CHATBOX-SPEC-CHECKLIST.md`
lists what the pixel review changed.

---

# 1. THE AUDIT

Line numbers are at the time of writing (`dafa760`); three sibling agents were
editing this tree, so treat a line number as a pointer, not a contract.

## 1.1 The composer

| # | Where | What it is | The problem |
| --- | --- | --- | --- |
| C1 | `apps/native/src/components/chat/chat-composer.tsx:86` | `canSend = (text \|\| attachments) && !loading` | While a reply is in flight the composer is **dead**: send is disabled and the field is `editable={false}` (`:142`). The user cannot interrupt, cannot type the next thought, cannot correct a typo in the message they just sent. This is the single biggest violation of the motion standard's own §2.2 (“motion is never a gate”) in the product. |
| C2 | `chat-composer.tsx:167-186` | Send is a 40×40 `Pressable`, disabled state = `backgroundColor: c.border` + muted glyph | Disabled send is a **faded filled button**: it looks like a button that is nearly available. There is no label, no tooltip, no reason. |
| C3 | `chat-composer.tsx:116-133` | `+` is a 40×40 circle, tinted | Under the 44–48 dp floor that the market guidance and iOS hit-region guidance both state; also visually equal in weight to send, which dilutes the primary. |
| C4 | `chat-composer.tsx:144-149` | `submitBehavior="newline"`, `returnKeyType="default"` | **Correct and must be kept.** Enter never sends. On the web the opposite is true (`cv-assistant-client.tsx:3144`, Enter sends) — a real cross-surface inconsistency, and the native behaviour is the right one for this audience. |
| C5 | `chat-composer.tsx:94-99` | Comment recording a double-inset bug (80 px of dead space) | Fixed, and the reason is documented — good. |
| C6 | `chat-composer.tsx:69-71` | `TODO: voice input` | Voice is on the web (`cv-assistant-client.tsx:3126-3139`, `micSupported`) and not on native. Not fixed here — see §9. |

## 1.2 Attachments, and the scan/import path

| # | Where | What it is | The problem |
| --- | --- | --- | --- |
| A1 | `chat-composer.tsx:22-62` | Attachment chip: thumbnail/icon, name, `x` | The chip shows **no size, no progress, no state text**. `att.status` only changes the border colour (`:40`) and `att.progress` exists in the type (`chat-types.ts:93`) but is never rendered. A 3 MB upload on a slow uplink is a chip that just sits there. |
| A2 | `attachment-preview-sheet.tsx:126-129` | While extracting: `Icon name="refresh-cw"` + `Ninasoma faili…` | The icon is **static**. There is no motion at all in the state that most needs it, so it reads as a hung screen rather than a working one. |
| A3 | `scan-processing-screen.tsx:27-28, 57-60` | `setInterval(1800)` cycling three fixed sentences (`Inasoma maandishi… / Inatafuta uzoefu wako… / Inapanga CV yako…`) | **The OCR “progress ramp” is a timer, not a report.** It loops back to step 1 forever and is identical whether the request is healthy or dead. It cannot be right; it can only be wrong for a long enough time that the user stops believing the screen. |
| A4 | `scan-processing-screen.tsx:42-45` | `withRepeat(withTiming(1, {1600}), -1, true)` sweep, no `cancelAnimation` cleanup | Exactly the defect class the motion standard names at N1/N15: an unbounded per-frame callback that outlives its node, on a device with roughly a third of a Pixel's throughput. |
| A5 | `attachment-extract.ts:46-87` | Ten cause codes with hand-written Swahili copy each | **Genuinely good** — the best-designed failure surface in the product. The redesign keeps it verbatim and puts it where the user is looking. |
| A6 | `attachment-extract.ts:29-37, 243-249, 275-281` | 4 MB pre-flight, 3 MB base64 cap, `MAX_CHARS 12000` | Honest limits, stated in copy. Kept. |
| A7 | `attachment-extract.ts:266-315` | 2 attempts, `700 * attempt` backoff | The client already knows a read is being retried and **tells the UI nothing**; the user sees the same static icon throughout. |

## 1.3 `lenga kwenye kazi` — the job-targeting flow

| # | Where | What it is | The problem |
| --- | --- | --- | --- |
| J1 | `native/.../job-choice-sheet.tsx` (313 lines), `web/.../job-choice-panel.tsx` (244 lines) | Two paths — *Chagua kutoka kwenye kazi zetu* / *Weka kazi yako mwenyewe* — on one sheet, zero requests to open, `?light=1` projection for the list, 350 ms debounce, honest empty/error/notice branches | **Well built and hard to find.** It opens only from a chip that a keyword test has to earn. |
| J2 | `use-sumaiya-chat.ts:250-252` | The chip is generated only if user/reply text contains `job \| kazi \| apply \| omba \| advert \| tangazo \| tailor \| lenga` | A first-time user who writes “nahitaji kazi mbaya” may get it; one who writes “nisadie kuomba” may not. The capability is gated on vocabulary. |
| J3 | `job-choice-sheet.tsx:156`, `job-choice-panel.tsx` render | `if (!visible) return null` | **No entrance and no exit** — the sheet appears and vanishes on one frame, in a codebase whose motion standard already specifies a bottom-sheet composite (§3.5). |
| J4 | `use-sumaiya-chat.ts:251` vs `cv-assistant-client.tsx:3031` | `Lenga kwenye kazi` (native) vs `Lenga CV kwa kazi` (web) | Same action, two names. |
| J5 | `job-choice-sheet.tsx:167-171` | A listing with no advert text is refused, with the reason | Honest and kept. |
| J6 | `sumaiya-chat-screen.tsx:212-215` | `open-cv`/`edit-cv` with `section:'jobs'` navigates to `JobApply` | There are **two** job-targeting surfaces (this sheet and the `JobApply` snap screen) and the chat can reach both — but nothing tells the user they are the same intent. |
| J7 | `QA-NATIVE-DEVICE-2026-09-20.md:116` | Three taps on `Lenga ajira hii` mutated the advert text instead (`2335 → 2339 → 2340` chars) and started nothing, with no error for 40 s | **The primary control of this flow did not fire on the build tested.** Whatever the cause, the redesign's rule is that a primary control may not be silently inert. |

## 1.4 Message types, and what actually renders

| # | Where | What it is | The problem |
| --- | --- | --- | --- |
| M1 | `chat-types.ts:5` | `'text' \| 'skill-gap' \| 'recommendation' \| 'action' \| 'learning' \| 'cv-ready'` | `'recommendation'` and `'action'` are **never rendered** by `chat-message.tsx` — dead union members. |
| M2 | `chat-message.tsx:39-115` | User bubble: ember fill, right, radius 18/4; Sumaiya bubble: card + border, left | Clear and kept. |
| M3 | `chat-message.tsx:105-107` | `sending` renders the text `Inatuma…` **inside** the bubble | There is no *sent* or *failed* state anywhere. A turn that fails to deliver is indistinguishable from one that delivered, until an error appears elsewhere. |
| M4 | `chat-message.tsx:81-90` | Attachment inside a bubble: `extracting` → static `refresh-cw`; `extractError` → warning icon | The only signal a file failed to read is a **13 px icon colour change**. |
| M5 | `chat-message.tsx:119-137` | `cv-ready` renders `CvPreviewCard` with `templateId: 'classic'` **hard-coded** | The CV the user is shown may not be the CV they get; and `onOpenCvEditor` passes `initialData` only (`sumaiya-chat-screen.tsx:400-402`), so the editor receives a **copy with no identity** — save it and you have two CVs. |
| M6 | `sumaiya-chat-screen.tsx:290-292, 450-477` | The `Tengeneza CV yako kutoka mazungumzo haya` bar appears after 2 substantive turns and disappears forever once a `cv-ready` message exists | The offer is a **separate floating bar** with no relationship to the artifact it produces, and it takes 2×12-character turns of typing before it is even offered. |
| M7 | `cv-editor-client.tsx:2774-2777` | Editor copy for a local-only “enhance”: *“AI haipatikani kwa sasa, kwa hivyo tumefanya usafi mdogo wa maandishi tu…”* | **The honest pattern already exists in this codebase — and the chat does not use it.** This is the single most transferable piece of copy in the repo. |

## 1.5 The thinking / waiting state

| # | Where | What it is | The problem |
| --- | --- | --- | --- |
| T1 | `sumaiya-chat-screen.tsx:36-53` | `TypingDot`: three 7 px dots, `withRepeat(…, -1)`, no cleanup, delays `i*140`, 350 ms in/out | Unbounded loop with no `cancelAnimation` — the N1/N15 defect class again. |
| T2 | `sumaiya-chat-screen.tsx:409-429` | The thinking bubble: three dots and nothing else | **No words, no elapsed time, no stop.** On the product's slowest path (a DeepSeek turn on 3G) the user's entire information budget is three pulsing dots. |
| T3 | `use-sumaiya-chat.ts:27-30, 167-179` | No streaming; a long reply is split into bubbles 550 ms apart | An intentional, documented decision (no streaming on a metered connection). It is the right call — but it means the **first** token arrives only after the whole response does, so the pre-first-token wait is longer here than in a streaming product and needs *more* honest signalling, not less. |
| T4 | `cv-assistant-client.tsx:2815-2837` | Web renders **two** indicators for the same state — an `analyzing` bubble and a `sending` bubble, both keyed on the same flags | Two answers to one question, stacked. |

## 1.6 The error state

| # | Where | What it is | The problem |
| --- | --- | --- | --- |
| E1 | `sumaiya-chat-screen.tsx:431-447` | A full-width card, `c.error` tint, `alert-circle`, the raw `error` string | **No retry control. No next step. No cause.** To retry, the user must retype — and retyping a turn that the model already received is how a metered-data user pays twice for nothing. |
| E2 | `use-sumaiya-chat.ts:198-209` → `app-errors.ts:153-158` | 502/503/504 → *“Nina shughuli nyingi sasa hivi. Jaribu tena baada ya muda mfupi.”* | Correct first person at HEAD, but the **shipped bundle carries the third-person** `Sumaiya ana shughuli nyingi` (`QA-NATIVE-DEVICE:190`), and the sentence blames her workload for a provider that is unreachable — the wrong cause, and the one it taught users to believe. |
| E3 | `apps/web/lib/api/routes/ai.ts:157` (+17 identical sites) | `503 {"error":"AI is not configured."}` | The chat renders that **English JSON body** as Sumaiya's own bubble in a Swahili UI (`QA-WEB-JOURNEYS:63`). |
| E4 | `QA-WEB-JOURNEYS:37` | `/api/ai/enhance` returns 200 with the input unchanged and `{"source":"local"}` | A button labelled **“Boresha na AI”** reports success and changes nothing. |
| E5 | `QA-WEB-JOURNEYS:36` | Snap-to-apply renders `Hifadhi kwenye akaunti yako` **disabled, with no tooltip** | A dead end produced by the product's own primary journey. |

## 1.7 Empty / first-run

| # | Where | What it is | The problem |
| --- | --- | --- | --- |
| F1 | `sumaiya-chat-screen.tsx:371-391` | Greeting bubble + `QuickActionsGrid` | Sound. Keep. |
| F2 | `sumaiya-chat-screen.tsx:384` + `lib/i18n.tsx:100` | Lead `Habari, mimi ni Sumaiya 👋` **and** body starting `Habari, mimi ni Sumaiya.` | The greeting says itself twice, in the same bubble. |
| F3 | `chat-types.ts:132` | `Tengeneza CV yangu` | A chrome control in the first person on the user's own object — the exact defect the Swahili standard's §4.1 forbids, sitting next to `Ongea nami` (which *is* legitimate). Three vision reviewers flagged the inconsistency of the 2×2 grid icons vs the labels. |
| F4 | `quick-actions-grid.tsx:25` | `FadeInDown.duration(280).delay(i * 55)` | **Off-token motion**: 280 is not a duration token and 55 is not a stagger step (tokens: 300 entering, 30 + min(i,6)×40). |
| F5 | `sumaiya-chat-screen.tsx:183-201` | Tapping a card **sends a pre-written message as if the user had typed it** | Defensible (voice rule class 1: what the user says) but it puts words in their mouth with no marker. The mockup keeps the behaviour and keeps the copy; the spec only requires the bubble be honest about being an offered opener. |

## 1.8 Scroll, keyboard, and the slow connection

| # | Where | What it is | The problem |
| --- | --- | --- | --- |
| S1 | `sumaiya-chat-screen.tsx:118-120` | `setTimeout(…, 80)` then `scrollToEnd({animated:true})` on **every** `messages` or `loading` change | An 80 ms layout guess instead of `onContentSizeChange`; it fires on the first render of a restored 40-turn transcript, and it **fights a user who is reading upwards** while a reply stages in. |
| S2 | `use-sumaiya-chat.ts:50-75` | Transcript persisted to `sumaiya_chat_v1`, last 40 turns, 400 ms debounce | Good. But **nothing in the UI ever says the conversation is kept** — and `Futa mazungumzo` (`sumaiya-chat-screen.tsx:346-355`) wipes it from a 17 px icon with **no confirmation**. |
| S3 | `sumaiya-chat-screen.tsx:363-368` | `ScrollView` with `keyboardDismissMode="interactive"`, `keyboardShouldPersistTaps="handled"` | Correct. Keep. |
| S4 | — | There is **no slow-connection state of any kind.** No “this is taking longer”, no keep-my-words, no resend-this-turn, no queued turn. The dots repeat until the user gives up. | |

## 1.9 Accessibility and motion, measured against the standard

| # | Finding |
| --- | --- |
| X1 | **Reduce Motion is respected where it is implemented** (`useMotionReduced` + `enterDurationMs`/`exitDurationMs`, `skeleton.tsx`, `empty-state.tsx`, `button.tsx`, `sumaiya-mark.tsx`; the web net in `globals.css`). The chat's own animations are the exception: `TypingDot` (`sumaiya-chat-screen.tsx:39-50`), `QuickActionsGrid` (`:25`) and `AttachmentPreviewSheet`'s 220/160 ms (`:44-47`) never consult `useMotionReduced()`. |
| X2 | 160 ms in `attachment-preview-sheet.tsx:46` and 280/55 ms in `quick-actions-grid.tsx:25`, 320 ms and 260 ms in `sumaiya-chat-screen.tsx:371,394` are **not tokens**. Four ad-hoc durations in one screen. |
| X3 | The web composer's send button swaps `<Send/>` for `<Loader2/>` on one frame (`cv-assistant-client.tsx:3154`) — the standard's §3.5 “Button label ↔ spinner” requires a 220 ms cross-fade, and this is the one place in the chat where the user is looking. |
| X4 | Web: `aria-live="polite"` sits on the **typing** row (`:2827`) and the mic error (`:3007`), not on a finished assistant message, and the transcript has no `role="log"`. Announcing a token/step stream through a live region is the documented way to make a screen reader stutter; announcing nothing is the other failure. |
| X5 | No message-level timestamp or ordering affordance is rendered on either platform, so “when did I say that” is unanswerable in a 40-turn transcript. |

## 1.10 What the user cannot do or understand today, plainly

*(These are surface findings and they hold whether the assistant is answering or not —
the device captures in §3.6c were taken on both sides of that line.)*

1. **Cannot stop her.** No control anywhere in either app cancels an in-flight turn.
2. **Cannot keep typing** while she works — the field is disabled.
3. **Cannot tell whether their message was delivered.** No `Imetumwa` / `Haijatumwa`.
4. **Cannot retry the thing that failed.** An error card offers no action, so a retry costs a retype.
5. **Cannot tell what is happening**, beyond three dots. Not one word about the file being read, the job being parsed, or the CV being assembled.
6. **Cannot tell whether the file was read.** A 13 px icon colour is the whole vocabulary.
7. **Cannot find job targeting** unless their words happen to contain the right noun.
8. **Cannot tell whether the conversation is kept.** It is (40 turns on disk) and the UI is silent about it.
9. **Cannot trust `Boresha na AI`.** It returned their own text with a 200 and a success path.
10. **Cannot explain the failure.** *“AI is not configured.”* is English, and it is not their fault.
11. **Cannot see what still works** when the model is unreachable, though ATS scoring, PDF export, OCR and the job feed all keep working without it.
12. **Cannot open the CV she built as *their* CV** — the editor gets a copy with no id, so the save creates a second one.

**And the two things that waste the user's data or time:**

- **A fake progress ramp is a data-cost multiplier.** A user who does not believe the screen leaves and comes back, and every return is another request on a metered connection. `scan-processing-screen.tsx`'s 1.8 s sentence carousel buys nothing and costs retries.
- **`Ninasoma faili…` with a static icon, over a 2-attempt, 700 ms-backoff upload** (`attachment-extract.ts:266-315`), is a screen that has already decided to retry twice and tells the user nothing while it spends their bytes.

---

# 2. RESEARCH — 2026, and what actually transfers

Every URL below was fetched or searched on 2026-09-20. “Transfers / does not
transfer” is judged for a **1–3 GB Android on metered data in daylight**, not for a
desk.

## 2.1 The composer and its affordances

- **Saglitz, *AI Product UX — Designing Chat, Streaming & Agentic Interfaces***
  (`https://saglitz.com/design/ai-product-ux`) — the composer is multi-line by
  default; **“the send button becomes a stop-generation button while the model
  streams”**, and “interruptibility is mandatory, not optional”; attachments must
  show **upload progress, thumbnails, type/size limits and a remove control before
  send**. *Transfers:* everything. Our send button never becomes stop, our chips
  never show progress. *Does not transfer:* slash-commands and `@`-mentions
  (desktop literacy the audience does not have).
- **AniUI `PromptInput`**
  (`https://aniui.dev/docs/prompt-input`) — a compound composer: a textarea that
  grows to `maxHeight` then scrolls, an **optional toolbar slot**, and
  `PromptInputSend` which “renders as a stop button” while streaming, with an
  `emptyFallback` slot for what replaces the send arrow when the draft is empty.
  *Transfers:* the max-height-then-scroll field (we have it: 120 dp), the
  stop-in-the-same-slot rule, and the `emptyFallback` idea — our empty send slot
  should be a deliberate outline, not a faded button.
- **Margelo, *Building a ChatGPT-Style AI Chat App in React Native***
  (`https://margelo.com/blog/building-native-llm-chat-app-with-rag`) — the
  composer is pinned with `KeyboardStickyView`, which reads the keyboard height **on
  the UI thread** and applies it as a `translateY`, “no JS round-trip and no lag”.
  *Transfers:* the principle (keyboard avoidance must track the keyboard exactly,
  which our standard already states at §4). *Does not transfer:* Liquid Glass / iOS 26
  materials, `react-native-keyboard-controller` as a new dependency on a release APK
  for a 100 ms improvement.
- **OpenClaw, *iOS Chat Gets a Cleaner Composer***
  (`https://openclawchronicles.com/posts/openclaw-2026-7-2-ios-chat-clean-composer`)
  — the composer “starts at 44 points tall, grows through four lines as the user
  types, and **preserves 44-point hit regions** for attachment, voice, and send —
  that last detail matters on mobile: a compact UI is only better if it remains easy
  to tap.” Also: “transient assistant states keep the same geometry, so loading and
  streaming do not feel like a separate visual system.” *Transfers:* both. Our
  targets are 40 dp and our loading bubble has different geometry from every other
  bubble.

## 2.2 Waiting, and what the assistant shows while it works

- **Multigrid, *Progressive Disclosure of AI Reasoning***
  (`https://multigrid.ai/learn/reasoning-ux`) — the auto-collapse on first token,
  “Thought for 24s”, and above all: **“Real pipeline events — retrieval, tool calls,
  sub-steps… are actual observed system behaviour, and they are the most trustworthy
  thing in this list.”** Labelling discipline: “Do not label it ‘why’, ‘explanation’
  or ‘rationale’.” *Transfers:* the entire step-rail idea, and the collapse-on-finish.
- **Dreaming Press, *How to Show Users What Your AI Agent Is Doing Right Now***
  (`https://dreaming.press/posts/how-to-show-users-what-your-ai-agent-is-doing.html`)
  — the table that names our defect: opaque spinner = “could be working or hung”;
  **indeterminate bar = “motion without meaning”**; **fake or estimated percentage =
  “betrayal when it jumps or stalls at 99%”**; live activity feed = “each line is
  evidence of actual work”. *Transfers:* the whole taxonomy, including the three
  guard rails (throttle token floods, heartbeat + timeout for a hung step, always a
  terminal success/error). *Does not transfer:* a live RSS/SSE feed — our chat has
  no streaming by design, so the honest version is a **small, closed set of real
  steps**, not a token firehose.
- **Nokia Blog, *Practical Interface Patterns For AI Transparency (Part 2)***
  (`https://thenokiablog.com/practical-interface-patterns-for-ai-transparency-part-2/`)
  — the **living breadcrumb** (one line that changes: “Reading email → Drafting
  reply”), the **dynamic checklist** (“every planned step… highlights the step
  currently in progress… manages unpredictable time”), and the diagnosis rule:
  *“I could not check your calendar”* blames the assistant; *“The Google Calendar
  connection is not responding. I will try again in 30 seconds”* does not.
  *Transfers:* the dynamic checklist is exactly the shape our rail should take, and
  the disentangling rule is exactly what our 502/503 copy gets wrong.
- **Agentic UX Patterns, *Tool Usage Indicators***
  (`https://agenticuxpatterns.com/patterns/tool-usage-indicators`) — one line per
  operation with icon, label, status; **past tense on completion** (“Searched
  knowledge base (24 results found)”); “limit concurrent motion… animate the most
  relevant calls and keep others static. Respect reduced motion preferences”;
  “Handle partial or degraded states explicitly.” *Transfers:* past-tense
  completion and the motion limit.
- **AI/TLDR, *AI Error States***
  (`https://ai-tldr.dev/learn/building-ai-apps/ai-ux-patterns/ai-error-state-design/`)
  — the failure table that matches our live strings almost line for line, including
  “stream interrupted… never silently display a truncated response as if it were
  complete”, “never expose the raw HTTP status code”, and `source` disclosure: a
  badge like “Using backup model” “is honest and builds more trust than a silent
  swap”. *Transfers:* our `source: "local"` answer **is** a backup model and must be
  badged.

## 2.3 Chat → a structured task → and back

- **Anthropic, *What are artifacts and how do I use them***
  (`https://support.claude.com/en/articles/9487310-what-are-artifacts-and-how-do-i-use-them`)
  — the criteria for promoting content out of the transcript: significant and
  self-contained, “something you're likely to want to **edit, iterate on, or reuse
  outside the conversation**”; a **version selector**; edits made **in the artifact
  window**; and “Ask Claude to modify… changes appear directly in the artifact
  window”. *Transfers:* the promotion test, the version idea (our CV needs a label
  for which CV the thread produced), and above all that the artifact window is a
  *peer* of the chat with a way back. *Does not transfer:* a right-hand side panel
  on a 390 dp phone — on mobile the handoff must be a full-screen push with a
  shared element.
- **`https://claude.com/docs/claude-science/artifacts.md`** — “Click a linked file in
  the conversation **to open it in a tab beside the chat**”; “When Claude saves the
  same filename again in the same session, the artifact gains a new version.”
  *Transfers:* the **linked file in the conversation** is the handoff affordance;
  versioning by identity, which is exactly the `cvId` our chat loses.
- **QCode, *How to build AI fallback modes that preserve user momentum***
  (`https://qcode.in/how-to-build-ai-fallback-modes-that-preserve-user-momentum/`)
  — the fallback ladder and its rule: **“Never let AI failure erase intent, erase
  progress, or erase the next step.”** Preserve `original prompt`, `partial_output`,
  `task mode`, `failure reason category`. *Transfers:* this is the whole brief for our
  unavailable state, and it is the reason “Jaribu tena” must resend *the same turn*.

## 2.4 Quick actions that do not clutter

- **Web Platform review, *AI Product UX*** (above) and **Ethora, *Chat App UI/UX
  Design Patterns*** (`https://ethora.com/blog/chat-app-ui-ux-design`) — quick
  actions belong **on the row, reachable without opening anything**, and the
  composer is the anchor; “debounce input at ~200 ms; show a clear button once the
  field has content”. *Transfers:* docking chips to the composer rather than
  stacking them inside the transcript. This is also what the vision reviewer
  demanded unprompted (§8).
- The web app already does the right thing here — `cv-assistant-client.tsx:3012-3059`
  collapses capabilities behind **“Ninachoweza kufanya”** after the thread starts.
  **The redesign ports that to native rather than inventing anything.**
- **StartChooser** (`apps/web/components/assistant/start-chooser.tsx:1-9`) already
  states the research: “a blank field asks a new user to invent the product;
  low-literacy users freeze. One decision, big targets.” *Transfers:* keep four
  cards, keep them ≥60 dp, keep them one decision deep.

## 2.5 Attachments and scanning flows

- **Saglitz** (above) for progress/thumbnail/limits/remove-before-send — all four are
  in the audit's A1.
- **Agentic UX Patterns** for the failure-with-recovery rule: “When a tool fails,
  clearly mark the indicator with a failure state **and short explanation**. Offer
  recovery actions where appropriate (‘Retry’, ‘Try a smaller date range’,
  ‘Reconnect integration’)… Indicate downstream effects.” Our
  `attachment-extract.ts` MESSAGES table already contains the explanation and the
  recovery step per cause; the UI does not show them in the transcript.
- **Photograph-vs-scan is a real classification**, not a nicety: `scanned_pdf`
  already exists as its own code (`attachment-extract.ts:67-70`) with the correct
  recovery (“send a photo of the page instead and I'll read it”). The redesign
  surfaces *that* sentence where the failure happened.

## 2.6 How products communicate that the assistant is unavailable or limited

- **Multigrid, *Offline-First AI Features: Degraded Modes That Do Not Lie***
  (`https://multigrid.ai/learn/offline-first-ai`) — the request-class taxonomy
  (`local-sufficient` / `degradable` / `deferrable` / refuse), the **capability
  object** recomputed on real events rather than a connectivity flag, and five rules
  worth quoting into our spec: “**Label the output, not the app.** A small, permanent
  marker on results produced locally — ‘offline draft’ — beats a banner across the
  screen”; “**Offer the upgrade rather than performing it**”; “**Never spin
  indefinitely**… A spinner with no end is the most common way an offline path
  becomes a support ticket”; “**Say what is unavailable and why, in one sentence**”;
  “**Do not announce the good case**” (labelling everything trains people to ignore
  the label). *Transfers:* all five, and the “label the output” rule decides the gold
  provenance chip on the document card in mockup 05.
- **tianpan.co, *Disconnected Agent Mode***
  (`https://tianpan.co/blog/2026-05-02-disconnected-agent-mode-network-you-dont-have`)
  — “**capability-degradation tiers the user can see**”, and the sentence this design
  is built on: “**Users will tolerate a degraded mode if they understand they're in
  one. They will not tolerate an agent that silently lies to them about what it can
  do.**” Also the anti-pattern: “the ‘loading’ UI is the only feedback the user gets,
  and it's indistinguishable between ‘the model is thinking’ and ‘the network has
  been gone for forty seconds.’” *Transfers:* the visible tier, and the explicit-routing
  choice (“explicit routing surfaced as a status, not a setting”) over a power-user
  mode selector.
- **Ilovedevops, *Graceful Degradation When Models Are Unavailable***
  (`https://ilovedevops.substack.com/p/graceful-degradation-when-models`) —
  “**messages like ‘Something went wrong’ or ‘Try again later’ do not explain what
  changed or what users can do next… Graceful degradation should degrade features,
  not dignity.**” *Transfers:* the copy rule, verbatim.
- **Goran Stimac, *Graceful Degradation for AI-Enhanced Applications***
  (`https://goranstimac.com/blog/graceful-degradation-for-ai-enhanced-applications/`)
  — “**never let the user think the AI responded when the fallback fired**”; the four
  UX patterns, of which **Pattern 1 (feature-level degradation: an explanatory
  message + a manual alternative, rest of the page works normally)** is ours.
  *Transfers:* Pattern 1 and the rule. *Does not transfer:* a circuit breaker with
  half-open probes as a client-side feature — the client should ask
  `/api/ai/status` (which exists, `routes/ai.ts:113`), not implement resilience
  logic on a phone.

## 2.7 Non-Western, mobile-first products

- **Safaricom *Zuri* (Kenya) — the closest thing to a peer this product has.**
  `https://www.safaricom.co.ke/personal/value-added-services/information-services/zuri`
  · `https://newsroom.safaricom.co.ke/innovation/everything-you-need-to-know-about-my-oneapp/`
  · `https://newsroom.safaricom.co.ke/innovation/tracking-zuri-safaricoms-customer-care-chatbot/`
  Zuri is a named, female-voiced, first-person assistant (“Zuri is your very own
  Safaricom Assistant… **She** works 24/7”; the Zuri team's own words: “you want it to
  imitate, as much as possible, a real customer care representative the way they
  would engage you in a conversation”). Distribution is **WhatsApp-first, then
  Telegram, Messenger, SMS 100 / SMS 234, webchat and the app** — choosing channels
  by how much data they cost. The 2025 agentic Zuri removed the menu: “you can type
  in anything, and it will give you an answer. You don't have to have some menu
  response.” *Transfers:* (a) it is independent evidence that the personified,
  first-person, female assistant is the register this market already talks to — our
  voice rule is not an affectation; (b) **the channel itself is a data-cost decision**
  — which is the argument for putting the light version of this chat on WhatsApp
  rather than only behind an APK (flagged for the owner in §9, not built here);
  (c) keep the type-anything promise and drop menu trees. *Does not transfer:* a
  customer-care assistant's use cases (balance, PUK) — ours is document work.
- **Zalo / *Kiki Info* (Vietnam) — a 70 M-user messenger that shipped AI as an
  Official Account inside the chat app** (`https://ar2025.vng.com.vn/en/business-report/zalo-ai`,
  `https://vietnam.vn/en/viet-nam-da-co-mo-hinh-ai-do-nguoi-viet-lam-chu`): ~30% of MAU
  used at least one AI feature in 2025; Kiki Info reached “nearly 500,000 users… in
  its first week”; Zalo trained a 13 B Vietnamese-language model rather than shipping
  a Western one. *Transfers:* the strongest evidence for **Swahili-first as a product
  decision, not a translation layer** — and for the framing that the assistant lives
  where the user already is. Zalo's AI Greeting Cards / zSticker are the localisation
  discipline: features shaped to local form, not translated features.
- **Kakao (Korea)**
  (`https://www.kakaocorp.com/page/detail/11725?lang=ENG`) — “the most innovative AI
  in the most familiar KakaoTalk”; AI arrives **inside the existing chat window**
  (“KakaoTalk's chat window becomes a ‘window of possibilities’”) rather than as a
  new app, and “VoiceTalk… call recording, transcription, AI summarization” is added
  to a surface that already exists. *Transfers:* the strategic shape of our redesign —
  improve the window the user already has; do not add a surface.
- **Gojek / Grab and the SEA device profile** — the design-target table worth
  adopting almost verbatim
  (`https://seraphim.vn/pages/ui-ux-design-indonesia.html`): primary viewport **360×800**;
  minimum supported 320×568; **RAM target 2–4 GB**; **touch target minimum 48×48 dp,
  recommended 56×56** “accounts for outdoor use, screen protectors, and
  one-handed operation”; initial load payload under 500 KB; WebP for 40–60% smaller
  images; “data costs money: users switch off data between sessions”. And from
  `https://institutepm.com/knowledge-hub/ai-product-southeast-asia-strategy`: “**AI
  features that rely on large context windows, streaming responses, or persistent
  browser sessions need to be redesigned for this device profile. That is not
  localization. It is a different product.**” *Transfers:* the numbers (we measured
  40 dp targets and a 390 dp frame; the market's floor is 48 dp at 360 dp wide), and
  the last sentence, which is the licence for “no streaming, a step rail instead”.
- **PickMe / Gojek offline capability** (`https://elaraventures.com/blog/mobile-first-product-design-asian-markets-0101`)
  — Gojek's engineering constraints “tied to low-bandwidth networks and entry-level
  Android device performance… was not a concession. It was a strategic decision to
  maximize addressable market.” *Transfers:* the framing to use with the owner when
  he weighs a heavier animation.

## 2.8 Accessible and motion requirements for a chat surface

- **WCAG 2.2, three criteria** (`https://a11ypath.com/guides/motion-and-animation`,
  `https://motionspec.dev/blog/wcag-2-3-3-animation-from-interactions`,
  `https://css-animation.com/accessible-motion-architecture/wcag-animation-conformance`):
  **2.2.2 Pause, Stop, Hide (Level A)** — anything that starts automatically, runs
  **more than five seconds** and sits beside other content must have a pause/stop/hide
  control. **2.3.1 Three Flashes (Level A)** — nothing flashes more than three times
  per second. **2.3.3 Animation from Interactions (Level AAA)** — interaction-triggered
  motion must be disable-able unless essential. Two facts that matter to us:
  (i) our `TypingDot` and the scan sweep are **unpausable loops that outlive five
  seconds — a Level A failure, not a taste question**; (ii) the reduced-motion net must
  be `0.01ms` and **not** `0`: “setting the duration to a hair above zero rather than
  removing the animation keeps `animationend` and `transitionend` events firing — so
  any JavaScript waiting on them still runs.” Our web net already uses `.01ms`
  (`apps/web/app/globals.css`), and the motion standard already requires 1 ms not 0.
  That requirement is now backed by a citation.
- **Apple HIG, *Accessibility*** (`https://developer.apple.com/design/human-interface-guidelines/accessibility`)
  — “give people the option to enlarge text **by at least 200 percent**”; under Reduce
  Motion, “reduce automatic and repetitive animations, including zooming, scaling and
  peripheral motion”, and the implementation list we should be judged against:
  “**Tightening animation springs to reduce bounce effects; tracking animations
  directly with people's gestures; avoiding animating depth changes in z-axis layers;
  replacing transitions in x-, y- and z-axes with fades to avoid motion.**”
  *Transfers:* the 200% text floor, and the “replace axis transitions with fades”
  instruction — which is exactly our handoff animation's reduced-motion form.
- **Apple HIG, *Motion*** (`https://developer.apple.com/design/human-interface-guidelines/motion`)
  — “**generally avoid adding motion to UI interactions that occur frequently**”;
  “avoid using it as the only way to communicate important information”; “let people
  cancel motion”. *Transfers:* the reason the chips and the per-keystroke path stay
  instant.
- **Android font scaling** (`https://colinmarsch.ca/2025/04/14/font-scaling-issues/`,
  `https://eevis.codes/blog/2025-10-31/compose-ui-tests-for-larger-font-sizes-scrolling-and-text-truncation/`,
  and Google's own `TextSizeCheck`
  `https://android.googlesource.com/platform/external/accessibility-test-framework/+/05d9fd79972f3a48318a12b4c98178dccc1f087a/src/main/java/com/google/android/apps/common/testing/accessibility/framework/checks/TextSizeCheck.java`):
  **~20% of mobile users run a font scale above default**; the three failure modes are
  **text clipping, overlapping content in horizontal rows, and a screen that cannot
  scroll once the text grows**; the fix pattern is to switch a horizontal row to a
  vertical stack and to make every screen scrollable. Google's check flags exactly our
  two layouts: a `TextView` in a fixed height, and a `TextView` in a fixed-height
  container. *Transfers:* our `maxHeight: 120` composer field, the fixed 66–108 px
  attachment tiles, and the 2×2 quick-action grid all need a 200% pass; the 2×2 grid
  must become 1 column.
- **Announcing a chat to a screen reader, without the token flood**
  (`https://accessibility.build/guides/accessible-ai-chat`) — the three-part
  structure (a **message log** with roles, a **status region** that announces state
  changes politely and “without ever moving focus”, and a **composer** that keeps
  focus after send); and the central warning: “the single biggest mistake teams make
  is treating the streaming response as something to shout at the screen reader…
  let the text appear silently while it streams and to announce the finished message
  once.” *Transfers:* our `aria-live` is on the typing row and not on the finished
  message — the exact inversion of the guidance.
- **One-handed reach** (`https://webdesignerindia.medium.com/thumb-zone-optimization-mobile-navigation-patterns-9fbc54418b81`,
  and the peer-reviewed source behind it:
  `https://www.tandfonline.com/doi/full/10.1080/10447318.2024.2327199` and
  `https://pubmed.ncbi.nlm.nih.gov/23516793/` for the thumb-reach envelopes) — the
  natural zone is the bottom 25–40% of the screen; “the primary reach zone… preferred
  location for controls matches the primary thumb reach zones fairly well”; published
  summaries record 75% of users navigating primarily with the thumb, 49% one-handed,
  and Instagram's internal finding that features placed in the stretch zone saw
  **43% lower engagement**. *Transfers:* every action in this chat — send, `+`, the
  chips, the sheet's two paths, the stop control — belongs in the bottom third. The
  three things currently out of reach are the header's read-aloud and clear-conversation
  icons (`sumaiya-chat-screen.tsx:333-355`), which the redesign moves or duplicates
  lower.

---

# 3. THE DESIGN

## 3.1 The composer, control by control

One row, bottom of the screen, inside the bottom third at every font scale.

| Control | Size | Affordance | Change from today |
| --- | --- | --- | --- |
| **`+` attach** | 44 dp square, radius pill, `#FBE9E1` fill, `#DA4A1C` glyph | Opens the attach sheet | 40 → 44 dp (market floor 48; 44 is the iOS hit-region minimum and the smallest gesture-safe size that does not grow the row) |
| **Field** | `min-height 44`, grows to 5 lines then scrolls; radius 22 (pill at one line, `input-lg`-family at rest) | Type. **Enter inserts a newline, never sends** (`chat-composer.tsx:144-149` — kept) | Same behaviour; the ember focus ring is `#DA4A1C` 1.5 px, matching the web's `focus-ember` |
| **Send, empty** | 44 dp, **1.5 px `#9C8D7B` outline**, `#756A5E` glyph, transparent fill | Nothing yet — it is an *empty* affordance, not a disabled button | Was a faded filled button that looked nearly-available |
| **Send, ready** | 44 dp, `#B83A12` fill, `#FAF5EE` glyph, `box-shadow 0 3px 0 #A8330F` | Sends | Same colour, now unambiguous |
| **Send, working** | the same 44 dp slot becomes **stop**: `#211A15` fill, a rounded-square glyph, `aria-label "Acha"` | Cancels the turn; kept partial work is retained; the user's words stay | **New control in an existing slot** — it replaces nothing and adds no height |
| **Draft line** | 11.5 px `#756A5E`, below the row, shown only when it has something true to say | “Maneno yako yanahifadhiwa.” while offline/unavailable | New line, existing space (today the row is padded 10 px bottom) |

**Rules that bind the composer**

- Nothing in the composer animates per keystroke (motion standard §4).
- The field's growth is a layout change and is therefore **instant**, never eased.
- The send slot's three states are one component with a 220 ms cross-fade between
  glyphs and a 90 ms fill transition — the standard's “Button label ↔ spinner”
  composite, applied to the slot rather than to a label.
- Primary vs secondary is carried by **fill, not size**: the `+` stays outlined-tint,
  send fills.

## 3.2 Message taxonomy

Nine kinds. Every one of them has a job; the two dead union members are retired.

**T1 · User turn (`Ujumbe wako`)** — right-aligned, `#B83A12` fill, `#FAF5EE` text,
radius 18 with bottom-right 4, `max-width 86%`, padding 11/14. Attachments render as
pills inside the bubble. Below the text, right-aligned at 10.5 px, **one delivery
word**: `Inatuma…` · `Imetumwa` · `Haijatumwa`. On failure the bubble is unchanged
and gains a 1.5 px `#C13E14` outline — the words are never removed.

**T2 · Sumaiya turn (`Jibu`)** — left-aligned, `#FFFFFF` fill, 1 px `#E9E0D4` border,
radius 18 with bottom-left 4. A run of bubbles from one reply carries **one**
attribution row above the first: a 16 dp mark + `SUMAIYA` at 11 px 800 `#756A5E`.
Subsequent bubbles carry none. Text 15/22 `#211A15`.

**T3 · System note (`Kidokezo`)** — centred, no avatar, `#F4EEE4` pill, 12 px
`#756A5E`, `max-width 88%`. Carries: persistence (“Mazungumzo yanabaki kwenye simu
hii.”), a restored turn, “mazungumzo yamefutwa”, a queued turn, and a retry receipt.
It is the only element allowed to be centred.

**T4 · Progress rail (`Hatua`)** — see §3.3. It is a card, not a bubble: full
width, `#FFFFFF`, 1 px border, radius 20, `shadow-card`.

**T5 · Document card (`Kadi ya hati`)** — see §3.4.

**T6 · Suggestion chip (`Chip`)** — docked above the composer, one horizontally
scrollable row on `#FFFFFF` with a 1 px top border. Chips: `#F4EEE4` fill, 1 px
`#E9E0D4` border, 12 px 700 `#2C231C`, a `›` in `#DA4A1C` as the prefix, 7×12
padding, `white-space: nowrap`. **Maximum three, and they name an outcome**
(`Lenga kwenye kazi`, `Kagua CV yako`, `Barua ya maombi`) or are her invitation in
the first person (`Ongea nami`). Never a third-party feature label.

**T7 · Error, attached to a turn (`Hitilafu`)** — right-aligned under the failed
turn, `max-width 92%`, `#FFFFFF`, 1 px `rgba(193,62,20,.35)` with a **3 px
`#C13E14` left edge**, radius 16. Three parts, always, in this order: what happened
(h4, 14/800), why (13/1.5 `#6B5F54`, with the non-cause explicitly ruled out), what
to do (buttons). Never full-width, never a status code.

**T8 · Unavailable card (`Kutokuwa na uwezo`)** — see §3.6. A first-class state.

**T9 · Receipt (`Risiti`)** — after a multi-step turn completes, the rail collapses
to one pill: `✓ Nilifanya hivi: hatua 3 ▾`, 12.5 px 600 `#6B5F54` on `#FFFFFF`.
Tapping expands the finished steps, read-only. It never re-animates on scroll.

**Retired:** `type: 'recommendation'` and `type: 'action'` (`chat-types.ts:5`), which
nothing renders. `type: 'skill-gap'` and `'learning'` keep their existing cards
(`skill-gap-card.tsx`, `learning-resources.tsx`) wrapped in the document-card shell
so all rich content has one visual grammar.

## 3.3 The progress rail

Anatomy, top to bottom: attribution row (`SUMAIYA` + elapsed `inaendelea · 6s`),
a **step-truthful bar**, up to four step rows, a footer with the stop control.

- The bar is `transform: scaleX(finished / total)` — two of four done is `scaleX(.5)`.
  It **never** runs ahead of the work. On completion it turns `#12433D` and reaches
  `1`.
- The current step's own glyph carries a bounded beat (1.05 s, `ease.inOut`), so
  motion is attached to the thing that is moving. Nothing else moves.
- Step states: **done** — solid `#12433D` disc, `#FAF5EE` check, text in `#756A5E`,
  past tense, with a sub-line of the actual result (`herufi 2,340 — nikasoma “Sales
  Officer, CCBRT”`). **Current** — `#B83A12` disc, `#FAF5EE` text at 700. **Pending**
  — hollow `#9C8D7B` ring, text at 75% — and it is *named*, because a named future
  step is a plan, not a silence.
- The rail carries **stop from the first second**. Stopping keeps partial work (a
  file already read stays read) and never discards the user's words.
- **Honesty rules the rail must obey**, drawn from the research: every line is
  emitted by a real event; there are at most four; elapsed time is plain text and
  never animated; a step that has not run is never faked; if a step hangs, the line
  changes to a stalled state and the stop control stays available.
- When the reply arrives, the rail collapses to the receipt at 220 ms while the first
  bubble rises into the space.

## 3.4 The document card, and the handoff to the editor

The card is **full width** with a tinted header band (`KADI YA HATI` left, state
right) — a band no bubble has, which is what stops it reading as a rich message.
Body: a document thumbnail, the title (`CV — Amina Juma`), a chip row (template,
page count), and one sentence stating **what she used and what she could not find**
(`Nilichotumia: jina, uzoefu wa mauzo, ujuzi 9, elimu. Nilichokosa: namba ya simu.`).
Then the action stack: primary `Fungua kwenye kihariri`, secondary
`Hifadhi kwenye CV zako`, and a state line in a `#E4EDEA` footer
(`✓ Imehifadhiwa kwenye CV zako` · `Inatumika bila mtandao`).

**The handoff.** Tap the primary:

1. The card's header band and thumbnail are the **shared element**. On web: a FLIP
   transform from the card's rect to the editor header, `dur.screen` 260 ms
   `ease.emphasized`; the chat behind it cross-fades at 140 ms. On native:
   `navigation.navigate` with `slide_from_right` (260 ms, already in
   `nav-config.ts`) plus a `Reanimated` shared-element transition on the thumbnail.
2. **Identity travels with it.** The card passes `cvId` *and* `templateId`, replacing
   `initialData`-only (`sumaiya-chat-screen.tsx:400-402`) so saving cannot fork a
   second CV — and replacing the hard-coded `templateId: 'classic'`
   (`chat-message.tsx:126`).
3. The editor **announces the context it came from**: a system note in the chat,
   not a banner in the editor — “Umefungua CV yako iliyotengenezwa hapa. Ukirudi,
   nitaendelea nayo.”
4. Coming back, the card is in its `saved` state and **the state change is the
   “we came back” signal** — no toast, no confetti. If the user changed the CV, the
   card's state line becomes `Imehifadhiwa · v2` (versioning on identity, as
   artifacts do).
5. Reduced motion: the FLIP is replaced by a **cross-fade**.

## 3.5 The `lenga kwenye kazi` flow — **OPTION A: ours is the primary path**

> **Decision, 2026-09-20.** The owner chose *“lenga kwa kazi option a”*. Option A is
> read as: **“Chagua kutoka kwenye kazi zetu” is the default path** — our live
> listings lead — and *“Weka kazi yako mwenyewe”* is one tap away for a user who
> already has an advert. **If that reading is wrong, the flip is one line:** swap the
> two `PathCard` blocks in `job-choice-sheet.tsx` / `job-choice-panel.tsx` so the
> “own job” card renders first and is the one `path` initialises to. Nothing else in
> this section changes, because the sheet is symmetric by construction
> (`job-choice-sheet.tsx:216-232`, `model.paths[0]`).

Consequences of ours being primary, and they are deliberate:

1. **The list is loaded when the sheet opens** — no tap first. That costs **one
   request (~1–2 KB**, the server's `?light=1` projection**)**, where the current
   implementation costs zero until “ours” is tapped. This is the only added network
   cost in the whole redesign and it is the price of “ours leads”; it is stated
   because the sheet's own cost note (`job-choice-sheet.tsx:25-26`) otherwise
   promises zero, and the promise must be updated with the behaviour.
2. **The assistant's question leads with ours and names both paths in one breath:**
   *“Nina nafasi za kazi tulizo nazo sasa. **Chagua moja hapa chini** — au, kama una
   tangazo lako, bandika na nitailenga.”* The second clause keeps the option honest
   without giving it equal visual weight.
3. **Path A carries a ``Chaguo la kwanza`` marker** (ember-tint pill, `#A8330F` text)
   instead of a bare ✓. A check reads as “you already chose this”; a label reads as
   “this is where we start”. Path B carries a quiet `›`.
4. **The search field is populated and results are already listed**, with the honest
   count line (`Kazi 3 zinaonekana. Andika neno lingine kuchuja.`) rather than a
   spinner, because there is no in-flight request to report on first paint.

- **Entry, always available:** a fifth row in the `+` sheet, `Lenga kwenye kazi`,
  beneath `Moja ya CV zako` (`attach-sheet.tsx:19-25`). The chip from
  `use-sumaiya-chat.ts:250-252` stays as a *second* way in. Nothing is removed.
- **The sheet** keeps its two paths and its wording verbatim
  (`job-choice-sheet.tsx:219-229`): `Chagua kutoka kwenye kazi zetu` /
  `Nafasi halisi za kazi tulizo nazo sasa.` and `Weka kazi yako mwenyewe` /
  `Bandika tangazo, au kiungo chake.` It gains the entrance the standard already
  specifies (backdrop 220 ms `ease.out`; panel `translateY 360→0`, 220 ms `ease.out`;
  exit 140 ms `ease.in`) and the open path gets a 1.5 px `#DA4A1C` border plus a
  check, so “open” is unmistakable against “closed”.
- **Zero requests to open; one for the list; one for the chosen advert; debounced
  typing.** Exactly as `job-choice-sheet.tsx:25-26` already documents — and the
  redesign adds one UI line saying so, so a user on metered data understands why the
  list is thin.
- **Cost disclosure:** the search field hint states the row count and offers the
  second path in the same sentence as the empty result — the second clause matters
  more than the first.
- **The primary control is `Lenga CV yako kwa kazi hii`** and it may never be inert
  (J7), never disabled without a printed reason, and is always followed by the
  promise of a diff first: `Nitaonyesha kila nilichobadilisha kabla ya kuhifadhi.`
- **The chip label is unified** to `Lenga kwenye kazi` on both platforms (J4).

## 3.6 The honest `intelligence unavailable` state

**It is a state, not an error page, and it is a first-class member of the message
taxonomy.**

**Detection.** `GET /api/ai/status` → `{configured, provider}` (`routes/ai.ts:113`)
on chat entry; the turn's own outcome thereafter (`source: "local"` counts as
unavailable-for-writing). Never a connectivity heuristic.

**Three variants, all in the same card:**

| Variant | When | What it says | What it offers |
| --- | --- | --- | --- |
| **Known** | the probe says so, before the user types | “**Sina uwezo wa kufikiri sasa hivi.**” + “Sikutaka ujue kwa kuandika ombi na kusubiri bure — kwa hivyo nakuambia kabla.” | The three things that genuinely work with no model: `Kagua CV yako` (deterministic ATS score + keyword diff), `Fungua kwenye kihariri`, `Soma picha ya CV yako` (tesseract OCR). Then a ruled-out line: `Kinachokosekana: kuandika na kuboresha kwa maneno.` |
| **Mid-turn** | the turn fails | “**Sikuweza kufikiri ombi hili.**” + “Sababu: huduma inayoniwezesha kufikiri haipatikani sasa hivi. **Si mtandao wako, na si maandishi yako** — ombi lako lilifika, jibu langu halikutoka.” | `Jaribu ombi hili tena` (resends **the same turn**, per QCode's rule) and `Andika mwenyewe`. Then the promise: `Nimehifadhi ulichoandika.` |
| **Partial** | work was done without a model | “**Kuandika upya kwa maneno hakupatikani sasa hivi.**” + “Nimefanya nilichoweza bila kufikiri — usafi mdogo.” | A gold band **on the artifact itself**: `◎ HUU NI USAFI MDOGO WA MAANDISHI — SI AI`, the before/after of the one line changed, `Weka` / `Acha`, and `Haijaharibu maandishi yako.` |

**Six rules it obeys, and they are the deliverable.**

1. **First person, about herself.** `Sina…` · `Sikuweza…` · `Nitaleta tena nikirudi.`
   Never her name in the third person from inside her own bubble. The
   already-fixed `app-errors.ts:156` is the model; the shipped third-person string
   (`QA-NATIVE-DEVICE:190`) is the bug.
2. **Never beg, never blame.** No “please try again later”, no apology loop. The
   reason is named and **the wrong reason is ruled out explicitly**, because this
   codebase has a documented history of blaming the user's connection for our own
   faults (`app-errors.ts:200-204`).
3. **Never dead-end.** At least one control that works *now* on every screen. A
   control may be disabled only with its reason printed beside it (E5).
4. **Never fake success.** Local work is labelled **on the output**, in gold — and
   only when the output is degraded. Nothing is labelled on the good path
   (Multigrid's “do not announce the good case”).
5. **The user's words are sacred.** Kept on screen, never cleared, never re-typed;
   `Jaribu tena` resends the same turn.
6. **The composer stays open.** The user may keep writing while the intelligence is
   off; the draft line says it is being kept. **The block is on the reply, never on
   the typing.** This is the deliberate opposite of today's `editable={!loading}`.

**Voice surfaces the chat must bring into line** (named here; the strings are not
edited by this task — a sibling agent owns the app-wide sweep):

| Surface | Today | Rule |
| --- | --- | --- |
| Chat header subtitle, `sumaiya-chat-screen.tsx:330` | `Msaidizi wako wa kazi` | Keep — the product naming her role to the user |
| Greeting, `sumaiya-chat-screen.tsx:384` + `i18n.tsx:100` | `Habari, mimi ni Sumaiya…` | Keep — her one first-person introduction. **De-duplicate**: the lead and the body say the same sentence twice |
| Progress rail lines | (new) | First person: `Ninalinganisha na CV yako`, `Nasoma picha yako` |
| Errors and the unavailable card | third-person busy line shipped | First person, always |
| Chips | `Tengeneza CV yangu` / `Lenga CV kwa kazi` / `Ongea nami` | Name an outcome, or be her speaking. `Tengeneza CV yako`; `Lenga kwenye kazi` |
| Home tile `AI ya kazi` (`home-screen.tsx:284`), `Msaidizi wa AI` (`dashboard/page.tsx:275`, `cv-editor-client.tsx:3412`) | third-party feature labels | **Outside the chat** — flagged for the sibling agent's sweep, and the reason the chat's own chips must not join that register |

## 3.6b The overlay language — one popup across the platform

The owner: *“match the pop up boxes accross the platform like share na sehemu
nyingine.”* The platform-wide overlay system is owned by a sibling agent
(`docs/design/2026-09-20/REDESIGN-SPEC-2026-09-20.md`); that document currently
specifies **elevation for the floating layer** (§5.4: `shadow.floating` belongs to
dialogs, sheets, toasts and the sticky action bar) and **the motion for dialogs and
sheets** (§7.0, from the motion standard), but it does **not yet define named
overlay *variants*.** So the five variants below are **ASSUMED** — derived from the
components already shipping in `apps/native/src/components/ui/` plus that spec's
elevation and motion rules. **They are assumptions, stated as assumptions**: if the
sibling names different variants, the mapping column is what changes, not the chat.

| # | Assumed variant | Surface + motion | Already in the tree |
| --- | --- | --- | --- |
| **V1** | **Bottom sheet** — backdrop + panel rising from the bottom, top radius 24, grabber, `shadow.floating`, optional title 15.5/700 and ✕ | backdrop opacity `220 ease.out`; panel `translateY 360→0`, `220 ease.out`; out `140 ease.in` | `premium-sheet.tsx`, `lesson-sheet.tsx` |
| **V2** | **Confirm dialog** — centred card, backdrop, `radius card-lg 20`, `spring.gentle`; destructive action in the error/`accentPressed` tone, cancel as ghost; **may contain a single text field** | card `scale .94→1` `spring.gentle {20,180,.9}`; out `140 ease.in` | `dialog.tsx:122` (spring `{20,240,.8}`), `prompt-modal.tsx` |
| **V3** | **Inline notice** — *not floating*: a surface inside the scroll content. Three tones: `sand-2` (system note), `gold-tint` (degraded/limited), error tint + 3 px left edge (fault) | `rise 300 ease.out` in; `140 ease.in` out | `connectivity-gate.tsx`, `auth-error-banner.tsx` |
| **V4** | **Full-screen task page** — a *push*, not an overlay, when the task is a document | `slide_from_right 260` | the CV editor, the snap screen |
| **V5** | **OS share sheet** — outside our system; our own V2 names the file *before* handing off | platform-owned | `expo-sharing` |

**Every overlay the chat owns, mapped:**

| Chat overlay | Variant | Motion it must use | Today |
| --- | --- | --- | --- |
| `AttachSheet` — “Ongeza kwenye mazungumzo” | **V1** | V1 composite | `attach-sheet.tsx:49` `if (!visible) return null` — **appears and vanishes on one frame. Conflict.** |
| `JobChoiceSheet` — “Unataka kulenga kazi ipi?” | **V1**, tall body (`maxHeight 86%`) | V1 composite | `job-choice-sheet.tsx:156` — same instant swap. **Conflict.** |
| `AttachmentPreviewSheet` — “Nilichosoma” | **V1** | V1 composite | already animates, but at `220` in / **`160` out** (`:44-47`) — 160 is not a token; must be `140 ease.in`. **Off-token conflict.** |
| Document card actions (open / save / download) | **none — inline.** The card is a V3-family surface in the transcript; a produced file is not a popup | card arrival per §3.8 #4 | correct today (it is a card, not a modal) |
| PDF / share hand-off for a produced document | **V2**, naming the file → then **V5** | V2 composite | no confirmation today; the OS chooser appears with no context |
| `PromptModal` — “Bandika kiungo cha ajira” | **V2 with one text field** | V2 composite | exists; the shared system must keep an input slot or this overlay has no home |
| `Futa mazungumzo` (clear conversation) | **V2** | V2 composite | **no confirmation at all** (`sumaiya-chat-screen.tsx:346-355`) — a destructive action with 40 turns behind a 17 px icon. **Conflict.** |
| Unavailable notice | **V3**, `gold-tint`, in the thread | `rise 300 ease.out`, self-retires at `140 ease.in` | n/a — it does not exist |
| Error on a turn | **V3**, error tone with the 3 px left edge | `rise 300 ease.out` | the current card is a styled `<View>`, not a variant (`:431-447`) |
| Mic / listening state (web) | **V3**, amber | inline | exists, inline |
| The sheet's own loading / empty / error states | inline inside V1's body, never a second overlay | per §3.8 | exists inside the job sheet |

### Reconciliation — the sibling's overlay spec landed after this section was written

`docs/design/2026-09-20/08-overlays.html` now names the platform's overlay system
directly: **“one scrim constant, one z-ladder, three radii, five variants”** —

| Theirs | Mine | Verdict |
| --- | --- | --- |
| **1 · Bottom sheet — the default for choices** | V1 | **Match.** Attach sheet, job sheet and the read sheet are all this. |
| **2a · Confirm dialog — destructive** | V2 | **Match.** `Futa mazungumzo` is 2a. |
| **2b · Confirm dialog — not destructive** | V2 | **Match.** The “name the file before the OS chooser” confirmation is 2b. |
| **3 · Toast — transient confirmation** | *(deliberately unused)* | **The chat uses no toast.** A transient confirmation for something the user must be able to re-read — a saved CV, a failed read, an unavailable assistant — is the wrong instrument; the chat's equivalents are the **inline receipt** (T9), the **system note** (T3) and the **status line on the document card**, all of which persist. Flagged, not hidden. |
| **4 · Full-screen sheet — a task, not a choice** | V4 | **Match in intent.** Mine is a navigation push; theirs is a scrim-based full-screen sheet. Either satisfies “a task, not a choice”; the *housing* is the sibling's call, because it is their system. |
| **5 · Share sheet — the one that differs by platform** | V5 | **Match.** |
| — | **V3 · Inline notice** | **THE ONE REAL GAP.** The chat's three most important non-happy surfaces — the **unavailable notice**, the **error on a turn**, and the **system note** — are **not scrim overlays**: they live inside the transcript, in the reading order, at the exact turn they belong to. None of the five variants is a scrim-less in-content surface. If the platform system ships only scrim overlays, these have no home and will be re-invented per screen — which is the defect the overlay work exists to remove. **Recommended resolution:** name the in-content notice as a sixth variant (a *surface*, not an *overlay*) or state explicitly that in-content status is the host screen's business. **This is the design conflict worth the owner seeing.** |

### Overlay conflicts to see, not paper over

1. **Two incompatible overlay housings in one app.** `attach-sheet.tsx:27-35` records
   that this codebase had to abandon RN `<Modal>` because the New Architecture drops
   `flexDirection: row` on nested Pressables — so the attach sheet and the job sheet
   are **absolute overlays rendered at the screen root**, while
   `attachment-preview-sheet.tsx:69` uses a real `<Modal transparent>`. A shared
   overlay system must pick **one housing** or the chat will go on containing two
   kinds of sheet that animate and dismiss differently. *This is the single biggest
   consistency risk in this list.*
2. **`maxHeight` is three values** — attach `80%`, preview `78%`, job `85%`. One
   variant needs one scale (`sm 60 / md 80 / lg 88`).
3. **A confirm dialog inside the chat must not be pushed by the keyboard**, and must
   render above the composer. There is no precedent for V2 inside the chat today.
4. **Static-surface shadow.** The sibling's §5.2 says a static content block is white
   + 1 px border **with no shadow**, and §5.4 reserves `shadow.floating` for the
   floating layer. Three of my chat cards (the step rail, the document card, the
   unavailable card) carry `shadow.card` at rest. **One-line resolution:** delete the
   resting shadow from those three — the reviewer-approved pixels barely move and the
   system becomes consistent. **Left as-is in the mockups on purpose** so the owner
   can see the conflict rather than have it silently resolved.
5. **Small ember text.** The sibling's §1.2/§1.3 measured `#DA4A1C` at 3.89:1 on
   cream — **a fill and icon colour, never small text**; small ember text uses
   `#A8330F`. **Applied in the mockups** (eyebrows, callout headings, the `›` chip
   prefix, the “Done” text button all moved to `ember-shadow`; every ember *fill* and
   *icon* is unchanged). No colour was invented — one existing token replaced another,
   in text only.

## 3.6c The device — what the real phone showed, and what it cost

Captured from the owner's phone on 2026-09-20, app **1.6.24**, `pro.sumaiya.app` in
the foreground: `1344×2992` physical, **override density 408** → the app actually
renders in **527×1173 dp**. The mockups were then re-rendered at that geometry as
well as at 390×844; **nothing clips at either width** (checked by measurement, not by
eye). The device was **in use by the owner** when I first connected (Facebook in the
foreground); I did not take it over, did not sign anything out, and read only the
chat surface — the screencap of his other app was never taken.

### The outage capture (a user whose screen said nothing)

The conversation as it stood while the key was unset, in order:

1. *“Nisaidie kuandika muhtasari mfupi wa CV ya huduma kwa mteja”*
2. *“Andika muhtasari mfupi wa CV”* — the same request again
3. **`Hi` · `Hi` · `Hi` · `Hi`** — four consecutive sends, **no reply to any of them**
4. then her answer, the chip row, a `.docx` attachment, her correction, her questions

**A user on metered data paid to say `Hi` four times because the screen told them
nothing.** That is the cost §3.6 exists to remove, caught on the device rather than
argued from the code, and it is the completion of audit findings E1/E2: the error
card has no action, so repeating the message is the only tool the user has.

### The live capture (the assistant answering)

With the assistant live, one short Swahili turn was sent from the chat and captured
**two seconds in** and **eight seconds later**: the waiting state and the answer.

**The waiting state, in pixels:** one small dark bubble containing **three grey dots**
— no words, no elapsed time, no stop control. It is also *small*: a marginal mark in
the corner of a large dark screen. Asked directly whether a user could tell a healthy
wait from a stalled one, the independent reading was: *“No — the only signal is the
three-dot pill, which is a generic ‘thinking’ indicator with no progress, no timer, no
cancellation option. If it stalls, it looks the same.”* **I verified the pixels myself
before using this** — the three-dot pill is there, above the ember build bar, with
nothing else. This is audit T1/T2 confirmed on the device while the product is at its
best, and it is exactly what mockup 04 replaces. Asked the same question of mockup 04,
the same model said it “makes it clearer that the assistant is working… the progress
line, the active dot and the elapsed-time text give explicit progress, and `Acha`
gives the user a way to stop”.

**The answer state, in pixels — three real defects:**

1. **Four rows of tappable control on one screen, and the chip row repeats verbatim.**
   Below the last two messages a user meets: a chip row, the full-width
   `Tengeneza CV yangu kutoka mazungumzo haya` bar, the composer, and the 5-tab bar.
   The chips under her earlier bubble and the chips under her newest reply are the
   **same three chips in the same order** (`Fungua CV yangu · Kagua ATS · Lenga kwenye
   kazi`). A vision pass measured the screen as roughly **65% conversation / 30%
   controls**, and its verdict on the controls was “a lot of chrome for a chat screen,
   especially on metered data”. The redesign's answer is not to delete the chips but
   to **dock one row** and retire the floating bar into the document card (§3.2, §3.4).
2. **Her prose names controls that do not exist under those names.** She writes
   *“gusa hapa chini: ukaguzi wa CV, linganisha kazi, au tengeneza hati”* — while the
   chips below her read `Kagua ATS`, `Fungua CV yangu`, `Lenga kwenye kazi`. A user
   told to tap “ukaguzi wa CV” cannot find it. **This is a copy/control contract
   defect**, and the fix belongs to the prompt and the chip table, not to layout.
3. **The chip says `Kagua ATS`** — the mechanism named in Swahili, which the Swahili
   standard §6 rule 5 forbids (the app's own replacement is `Kagua CV`).

Worth reporting even though it is outside the chat's surface: **her reply was a
deflection, not the deliverable.** Asked to *write* a short CV summary, she answered
*“Umekwisha niambia hivyo, asante! Hebu tuende hatua inayofuata…”* and offered a menu.
The surface's job is to make her words readable; the answer's job is to be an answer,
and that is a prompt-quality finding for whoever owns the assistant turn.

**What also holds in both captures, and belongs to other agents' sweeps:**

- **Two chip rows on one screen** (`Kituo cha kujifunza · Fungua CV yangu · Kagua ATS`
  mid-thread, and `Fungua CV yangu · Kagua ATS · Lenga kwenye kazi` above the build
  bar) — the docking argument in §3.2 / mockup 02, in the wild.
- The floating `Tengeneza CV yangu kutoka mazungumzo haya` bar (audit M6) occupying
  full width directly above the composer.
- **Dark mode's composer has a contrast problem**: the input pill is dark on a dark
  background and the placeholder blends into it, so “where do I type” is answered
  less clearly than in the light build. Independent vision reading, and it matches
  what I see in the capture. The palette is fixed, so the fix is the field's
  **border and fill role**, not a new colour — flagged for the sibling's dark-mode pass.
- Strings that show **build 1.6.24 predates the 2026-09-20 sweeps**: the tab reads
  `CV zangu` (the standard's §4.1 table records it as changed to `CV zako`), the
  header reads `Omba kwa ujanja` (a word the standard **bans**), the home tile reads
  `AI ya kazi` and a chip reads `Kagua ATS` (mechanism named in Swahili). **All four
  are outside the chat** and are reported to the voice/terminology sweep, not fixed
  here.
- **At 527 dp the empty state is sparser than at 390 dp** — about half the screen is
  cream below the four cards. I am **not** filling it. More cards is a menu, which is
  exactly the criticism the sibling spec already makes of this screen (their N13),
  and inventing content to fill a tall screen is the defect, not the fix. The
  greeting and the four cards stay anchored to the top; if the owner wants density
  there, the honest move is taller cards (60 → 78 dp), not a fifth thing to tap.

## 3.7 Accessibility contract

- **Reduced motion**: every duration in §3.8 has a `dur.instant` form via
  `enterDurationMs`/`exitDurationMs` and `useMotionReduced()` on native, and the
  existing `globals.css` net on web. **Nothing is motion-only**: every rail step,
  receipt, error and unavailable card is legible as static text.
- **200% text**: the quick-action grid collapses 2 columns → 1; the composer field
  still scrolls at 5 lines; attachment tiles go from 108×108 to a full-width row;
  no text anywhere has a fixed height. Verified as a build gate, not a promise — see
  §7.
- **Screen readers**: the transcript is a **log** (`role="log"`, `aria-live="polite"`
  only on *finished* assistant turns), the rail is a **status region** updated at
  step boundaries only (`aria-live="polite"`, never per token — there are no tokens),
  and the composer keeps focus after send. Today's `aria-live` on the typing row
  (`cv-assistant-client.tsx:2827`) inverts this and gets removed.
- **Touch targets**: 44 dp minimum in the composer (market guidance recommends 48;
  the sheet rows are already 56).
- **One-handed**: send, `+`, chips, the sheet's two paths, the stop control and the
  retry controls are all in the bottom 40% of the screen. The two header icons that
  live in the stretch zone (read-aloud, clear conversation) gain duplicates inside
  the `+` sheet.
- **`Futa mazungumzo` gets a confirmation** — a destructive action on 40 turns of
  work behind a 17 px icon today (`sumaiya-chat-screen.tsx:346-355`).

## 3.8 The animations

All values are the app's existing tokens (`apps/web/lib/motion.ts`,
`apps/native/src/components/ui/motion.tsx`, `docs/MOTION-STANDARD-2026-09-20.md`).
**Nothing here invents a duration.** The two off-token values found in the audit
(280/55 in `quick-actions-grid.tsx`, 160 in `attachment-preview-sheet.tsx`) are
replaced.

| # | Move | Entry | Exit | Curve | Reduced motion | Why it is cheap |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | **Sumaiya bubble arrives** | `300` | — | `ease.out (0.33,1,0.68,1)` | `instant` | `opacity + translateY(12)`, one node |
| 2 | **Bubble run stagger** | `30 + min(i,3)×40` (cap **3** for chat, not 6) | — | — | `0` | cap; 3 lookups, no integrator |
| 3 | **User bubble appears** | **none** | — | — | — | their finger produced it — §4 “taps” |
| 4 | **Document card placed** | `220` `scale .985→1`, `translateY 6→0` | `140 ease.in` | `ease.out` | `instant` | transform only |
| 5 | **Chips dock in** | `300` (stagger 30, cap 3) | `140 ease.in` | `ease.out` | `instant` | shared-row children |
| 6 | **Progress rail enters** (replacing the 3-dot bubble) | `300`, 12 px rise | `140 ease.in` | `ease.out` | `instant` | overlaps the outgoing bubble |
| 7 | **Rail step advances** | old line `140 ease.in`, new line `220 ease.out` | — | — | `instant` | two text nodes, no container reflow |
| 8 | **Rail collapses to receipt** | `220` container `layout` on `spring.snappy {22,260,.8}` | — | spring | `instant` | sanctioned reflow case (§3.3 of the standard) |
| 9 | **Step-truthful bar** | `220 ease.out` on `transform: scaleX` | — | — | `instant` | transform only, no width |
| 10 | **Current-step beat** | bounded, `1.05 s`, 2 cycles | — | `ease.inOut` | none (static dot) | one 8 px node; **replaces an unbounded `withRepeat(-1)`** |
| 11 | **Send ⇄ stop morph** | `220` glyph cross-fade + `90` fill | — | `ease.out` / `micro` | `instant` | in-place, no layout |
| 12 | **Attachment chip enters / leaves** | `300` (stagger 40) | `140 ease.in` | `ease.out` | `instant` | layout on container only |
| 13 | **Upload progress** | `90` steps on `scaleX` | — | `ease.out` | `instant` | transform only, ≥5% steps |
| 14 | **Sheet present/dismiss** (attach, job choice, preview) | backdrop `220`, panel `translateY 360→0` `220` | `140 ease.in` | `ease.out` | cross-fade | already in the standard; just implement it |
| 15 | **Chosen path expands** | content `220` + container `layout` | `140` | `ease.out` | `instant` | the standard's expand/collapse |
| 16 | **Error card arrives on its turn** | `300` rise | `140 ease.in` | `ease.out` | `instant` | one node |
| 17 | **Retry: label ⇄ spinner** | `220` in place | — | `ease.out` | `instant` | the standard's button composite |
| 18 | **Rail → receipt → answer hand-off** | placeholder `140 FadeOut` **while** content enters `300` | — | `ease.in` / `ease.out` | `instant` | the standard's “Loading → content” |
| 19 | **Unavailable card arrives** | `300` rise | `140 ease.in` (self-retiring on recovery) | `ease.out` / `ease.in` | `instant` | one node; **no pulse, no bounce, no infinite attention** |
| 20 | **Card → editor handoff** | FLIP card→editor header `260` | reverse `260` | `ease.emphasized (0.16,1,0.3,1)` | **cross-fade** (per Apple HIG: replace axis motion with fades) | one composited layer |
| 21 | **Scroll-to-bottom pill** | `300` rise 12 | `140 ease.in` | `ease.out` | `instant` | never animates scroll offset (§4) |
| 22 | **Destructive confirm (clear conversation)** | dialog `spring.gentle {20,180,.9}`, backdrop `220` | `140 ease.in` | spring / `ease.in` | cross-fade | the standard's dialog composite |

**Banned by this redesign, with the reason:** any unbounded `withRepeat(-1)` in the
chat or the scan path (Level A WCAG 2.2.2 failure, and a per-frame cost on a Redmi-class
GPU); any bar that reports more progress than has happened; any animation on the
keystroke path; any animation of a number the user is comparing; any third ad-hoc
duration; and a per-row spring on more than the one sanctioned container.

---

# 4. WHAT TRANSFERS TO A CHEAP ANDROID ON EXPENSIVE DATA

| Pattern | Verdict | Cost |
| --- | --- | --- |
| Step rail from real pipeline events | **Take** | 4 text nodes; replaces the existing dots |
| Dynamic checklist instead of a percentage | **Take** | no new requests |
| Auto-collapse the working state to a receipt | **Take** | removes attention cost |
| Stop-in-the-send-slot | **Take** | interrupts an in-flight request — saves the user's data |
| Progress + size per attachment chip | **Take** | local state only |
| Honest capability tier, visible as a status | **Take** | one probe (`/api/ai/status`) |
| Label the output, not the app | **Take** | one gold band on one card |
| Token-level streaming UI | **Skip** | no streaming by design; a token firehose is also the documented screen-reader failure |
| Live log / raw reasoning disclosure | **Skip** | spending attention and bytes on content this audience must not read |
| Animated/estimated percentage | **Reject** | “betrayal when it jumps” — and it is a lie we would have to maintain |
| Skeleton shimmer on every surface | **Skip in the chat** | the rail is the loading state; a shimmer plus a rail is two answers |
| Liquid Glass / backdrop-blur materials | **Reject** | per-frame GPU cost for no information |
| Count-up numbers | **Reject in the chat** | scores are compared, not admired (the standard's §4) |
| Model/effort picker in the composer | **Reject** | the web's Haraka/Wastani/Kina (`cv-assistant-client.tsx:3080-3116`) is a mechanism; sell the outcome, and a first-time user cannot price a reasoning budget |
| Haptics on every step | **Reduce** | one light haptic on send and on the terminal success/error state only |

---

# 5. THE MOCKUPS

All in `docs/design/2026-09-20/`, self-contained (inline CSS, no build step, one
Google-Fonts link with a system fallback), phone viewport first.

| File | One line |
| --- | --- |
| `00-index.html` | The proposal cover: the five screens as links, the rules they obey, and the four ideas that carry the redesign |
| `01-empty-chat.html` | Empty chat: her one first-person greeting, four outcome-named quick actions, and a composer that shows what a disabled send actually means |
| `02-exchange-document-card.html` | A working exchange: delivery state, staged bubbles, a settled step receipt, the CV document card with a save that always completes, and chips docked to the composer |
| `03-lenga-kwenye-kazi.html` | The job-targeting sheet on **Option A** — *chagua yetu* is the default with the list already loaded (`Chaguo la kwanza`), and *weka yako mwenyewe* is one tap away |
| `04-progress-and-reading.html` | Waiting done honestly: the four-step rail with a step-truthful bar and a stop control; the read that succeeded; the read that could not |
| `05-unavailable.html` | The intelligence-unavailable state in three variants, beside the verbatim strings the product ships today and the six rules the state obeys |
| `CHATBOX-SPEC-CHECKLIST.md` | How the mockups were rendered, measured and reviewed — the exact commands, and every fix a pixel review forced |

**How they were verified** (this is the part that is not a claim):

1. Rendered in real Chrome via Playwright at **390×844**, device scale 2
   (`docs/design/2026-09-20/CHATBOX-SPEC-CHECKLIST.md` has the exact commands).
2. **Measured for clipping programmatically** — every direct child of the transcript
   compared against `scrollHeight`. Two real defects were found this way and fixed:
   the document card in `02` (clipped by 30 px) and the unavailable card in `05`
   (clipped by 28 px — the *honest last line* was the thing being cut, which is
   exactly the failure this state exists to prevent).
3. **Sent to vision models for pixel critique** and fixed; the findings and the
   models that produced them are in §8.

---

# 6. WHAT I COULD NOT VERIFY

- **No live session.** `/assistant` requires sign-in and no saved credential exists
  for the owner's account; the evidence for the live AI-off behaviour is therefore
  the sibling agents' captures (`docs/QA-WEB-JOURNEYS-2026-09-20.md` §D1/§D3,
  `docs/QA-NATIVE-DEVICE-2026-09-20.md` §4b–§4d), not my own request.
- **No device run of *this redesign*.** The device was used to capture the chat **as
  it is today** (§3.6c) — that is real evidence about the current product, not about
  the proposal. Every animation duration here is still a spec, not a measurement:
  `scripts/motion-frames.py` and `dumpsys gfxinfo` were **not** run against the
  redesign because it does not exist as code.
- **The device geometry was matched (527×1173 dp) but not the device.** Rendering a
  mockup at the right dp width in Chrome is not the same as running it in the APK:
  no keyboard inset, no tab bar inset, no Android text rendering, no notification
  shade. The keyboard-up composer state was therefore judged from the app's own
  earlier real-device capture (`apps/native/qa/2026-09-11/42-chat-sent.png`), not from
  my own tap — the owner was using the phone and I did not take it over.
- **Dark mode was not mocked.** The existing palette has a dark set
  (`theme.ts:62-85`) and `QA-NATIVE-DEVICE` captured the chat in dark. One vision
  reviewer argued dark is *more* legible in bright daylight on cheap LCDs and on
  battery; I could not resolve that with evidence, so the mockups render the light
  palette (the app's default) and the question is flagged in §9.
- **200% font scale was not rendered.** The rules in §3.7 are derived from Google's
  `TextSizeCheck` criteria and the Android font-scaling literature, not from a
  screenshot at `fontScale = 2`.
- **The fifth `+` row for job targeting** assumes `attach-sheet.tsx`'s row list can
  grow from 5 to 6 without exceeding its `maxHeight: 80%` — not measured.
- **`job-choice-sheet.tsx:167`'s "listing has no advert" rate** is unknown; I do not
  know how often users would hit that branch in production.
- **The vision critiques are model judgements, not user testing.** Seven free models
  were tried; four answered on at least one pass, three failed (429 / provider
  unavailable / token-budget). Their Swahili transcription is unreliable — one model
  "read back" garbled text at 390 px — so I used their **layout** findings and
  discarded their quotations of the copy. Every finding I acted on was independently
  reproducible (the clipping was confirmed by measurement, the chip placement by
  reasoning about the transcript).

---

# 7. HOW TO VERIFY THIS ONCE IT IS BUILT

1. **Frame sequence** for the rail advance, the card arrival, and the sheet — with
   `scripts/motion-frames.py`, per the standard's §7. Report *interpolated* or *pop*.
2. **Jank** for the rail with four steps live: `dumpsys gfxinfo pro.sumaiya.app`,
   read `Janky frames %` and the 99th percentile.
3. **`RetryableMountingLayerException` count must be 0** on a cold start into the
   chat with a turn in flight — the redesign removes three unbounded loops.
4. **Clip test at `fontScale = 2.0`** on the composer, the chips, the rail, the
   document card and the unavailable card.
5. **Screen reader**: TalkBack reading a full turn — one announcement per finished
   message, one per rail step, none per keystroke.
6. **AI-off drill**: with `DEEPSEEK_API_KEY` empty, walk the three variants and
   confirm (a) no English reaches the screen, (b) no control is disabled without a
   printed reason, (c) `Jaribu tena` resends the same turn, (d) the local-tidy
   result is labelled on the artifact.
7. **Reduce Motion**: turn it on, repeat 1 and 2, confirm every state is still
   legible and nothing is merely invisible.

---

# 8. THE PIXEL REVIEW — what changed, and which model said so

**Engine note:** Claude CLI was session-limited (`claude -p` exited 1, “You've hit
your session limit · resets 1:40am”) and was **not** used. The web research used
ordinary search/extract; the pixel critique used OpenRouter `:free` vision models
only, with rotation on 429. Models that produced findings:
`inclusionai/ling-3.0-flash-vl:free`, `nex-agi/nex-n2.5-pro:free`,
`dots-studio/dots-3-note-preview:free`. Models that failed and produced nothing:
`google/gemma-4-31b-it:free` and `google/gemma-4-26b-a4b-it:free` (HTTP 429,
upstream shared pool), `thinkingmachines/inkling:free` (403, agentic-harness gate),
`nex-agi/nex-n2.5-mini:free` (invalid request),
`nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free` (502, provider exhausted).

| Finding | Model | What I changed |
| --- | --- | --- |
| “The greeting text is repeated — ‘Habari, mimi ni Sumaiya’ appears twice, once as heading, once inside the body.” | ling-3.0-flash-vl | Real defect, and it is in the app (`sumaiya-chat-screen.tsx:384` + `i18n.tsx:100`). Body now starts at `Naweza kuandika CV yako…`. Logged as audit F2. |
| “The warning card + 3 long action cards overflow, forcing the closing hint below the fold… clipped mid-sentence, looks like a bug.” | ling-3.0-flash-vl | Confirmed by measurement: the unavailable card was **28 px** too tall and the honest last line was the casualty. Shortened the sub-lines and folded the footer into the ruled-out line. Also fixed a 30 px clip on the document card. |
| “The thin progress bar is almost full at 6 s while only step 3 of 4 is active, could be misleading… reads as decorative/fake.” | nex-n2.5-pro | The bar now reports `finished / total` (`scaleX(.5)`), and the *current* step's glyph carries the bounded beat. |
| “Finished and pending rely on small pale icons and can blur on a cheap screen.” | nex-n2.5-pro | Done = solid pine disc + white check; pending = hollow ring; current = ember disc. |
| “The ‘read’ panel and the ‘could not read’ warning use the same beige treatment… the warning looks like a continuation of the extracted content.” | nex-n2.5-pro | **A genuine contradiction in my first draft** — I had shown extracted text *and* a failure warning in one sheet. Split into screen B (succeeded) and screen C (failed, with error polarity on the sheet edge, no extracted text, and the recovery step). |
| “They look a bit too much like chat bubbles themselves… wrapping into two rows makes it look messy and takes up a lot of screen real estate, especially on a small cheap Android screen.” | dots-3-note-preview | Chips moved out of the transcript and **docked above the composer** as one scrollable row, smaller and neutral-tinted with a `›` prefix so they cannot read as the user's own bubbles. |
| “The document card… reads a bit like a rich message bubble rather than a cohesive container.” | dots-3-note-preview | The card gained a tinted `KADI YA HATI` header band and a `tayari` state chip (also rendered uppercase) — a band no bubble has. |
| “The old avatar had a distinctive logo vs a generic ‘S’.” | ling-3.0-flash-vl | My placeholder “S” was replacing the brand. Replaced with the **real `SumaiyaMark` geometry, verbatim from `logo.tsx`** (three swept blades, cream on ember) — the logo is not redesigned, it is now shown correctly. |
| “The storage disclaimer bubble above the composer is clutter; cut it.” | ling-3.0-flash-vl | Shortened to one sentence and **recorded as the first thing to cut** in the screen's own notes, since the value is real but low. |
| “The status card is honest and calm; two buttons plus the saved draft mean it is not a dead end.” | ling-3.0-flash-vl (on the unavailable state) | Kept as designed. |

**What I did not act on:** one model transcribed the Swahili from the pixels and
returned it garbled (“linauma”, “kejibu”), then judged the state “broken/panicky”
*on the basis of its own bad transcription*. That is a limitation of reading 11–13 px
text from a 390 px screenshot, not a product finding; I discarded the verdict and
kept the layout observations. Recorded here so nobody re-derives it as a copy defect.

---

# 9. THE CALLS THE OWNER MIGHT REJECT — and how to say no cheaply

| # | Call | Why he might reject it | How to say no cheaply | What it costs to keep |
| --- | --- | --- | --- | --- |
| R1 | **The send button becomes a Stop control while she is working** | It puts a cancel in the slot every finger goes to; a mistap ends an answer the user paid for | Cut move 11 and move 10. The rail's footer keeps its own `Acha` button 40 px above the composer, so interruptibility survives without the morph | One extra control in the rail |
| R2 | **The composer stays editable while she works** (today it is disabled) | One more in-flight turn, one more request on metered data | Keep `editable={!loading}`, and keep the *requested* change only for the draft line (“maneno yako yanahifadhiwa”). The user still cannot lose typing | The loss of the “type the next thought” behaviour, and C1 stays open |
| R3 | **A four-step rail replaces the three dots** | “Too much text on the screen”, and it exposes implementation steps | Cut to **two** lines: the current step and a quiet `hatua 2/4` counter. The stop control and the elapsed time stay | The “it is a plan, not a silence” benefit |
| R4 | **A gold “SI AI” band on any locally-produced result** | It looks like an error on a success | Keep the band but reduce it to an 11 px line inside the card footer, or move the disclosure to the `Jaribu tena` state only. **What must not be cut is the disclosure itself** — `Boresha na AI` returning the input unchanged is the defect this exists to prevent | Nothing but the signal; without it we ship E4 again |
| R5 | **`Tengeneza CV yangu` → `Tengeneza CV yako`** | He may have chosen the first person deliberately | One word, one card, fully reversible. The rule and the measurement are in `SWAHILI-STANDARD-2026-09-20.md` §4.1 | Nothing |
| R6 | **The 200% text-scale gate (2 columns → 1, no fixed heights)** | It changes the look at default size too, if done bluntly | Gate it behind the font scale only: at default the 2×2 grid is unchanged | ~20% of Android users keep clipping |
| R7 | **`Futa mazungumzo` behind a confirmation** | It is one more tap on a control he may use often | Confirm only when the thread has more than N turns; below that, clear instantly | One irreversible tap on up to 40 turns |
| R8 | **Replacing the 1.8 s scan ramp with real steps** | Real steps need server-side events; the fake ramp ships today | Ship the **two-line** version first (upload, then read), which needs no new server work, and let the rail grow as events become available | The user keeps watching a timer they cannot trust |
| R9 | **The document card carrying `cvId` into the editor** | Touches the editor's contract, which another agent is editing right now | It is one extra param on `navigate`; if the editor cannot take it yet, the card passes it as `initialData` plus a `sourceCvId` and the editor wires it later | The duplicate-CV defect (M5) stays open |
| R10 | **Putting a light version of this chat on WhatsApp** | Not a design change; a product decision with cost and support implications | Explicitly **out of scope here** — raised only because Safaricom's Zuri (§2.7) is the same market and the channel is a data-cost decision. He can ignore it at zero cost | Nothing today; it is the cheapest channel story in the market |

**The single risk he is most likely to reject outright: R1 + R2 together** — that is,
“the composer is never blocked”. It is the one change that alters the *shape* of the
interaction rather than its surface. The presentation that survives a rejection: ship
the rail, the receipt, the honest unavailable state and the document card first (all
of which are additive and reversible), and put the composer's three states (empty /
ready / working) in a second pass, behind a flag, so he can see it and switch it off.
