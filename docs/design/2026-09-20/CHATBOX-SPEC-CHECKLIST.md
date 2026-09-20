# CHATBOX mockups — how they were checked

Run from the repo root (`C:\Users\hamis\projects\sumaiya`). These are the exact
commands; they are reproducible. The two scripts live outside the repo (in the
workspace at `C:\Users\hamis\`) and are **not** committed — they are tooling, not
source.

## 1. Render, phone viewport first

```bash
# 390x844 @2x  — the deliverable render (what the owner opens)
NODE_PATH="C:/Users/hamis/projects/sumaiya/node_modules" SCALE=2 \
  node C:/Users/hamis/render-chat-mockups.js \
  "C:/Users/hamis/projects/sumaiya/docs/design/2026-09-20" \
  00-index.html 01-empty-chat.html 02-exchange-document-card.html \
  03-lenga-kwenye-kazi.html 04-progress-and-reading.html 05-unavailable.html

# 390x844 @1x  — the small set fed to vision models (a smaller payload is a
# faster answer and a lower chance of provider rejection)
NODE_PATH="C:/Users/hamis/projects/sumaiya/node_modules" SCALE=1 SUFFIX="__sm" \
  node C:/Users/hamis/render-chat-mockups.js <same args>
```

Real Chrome is used (`channel: "chrome"`) because the Playwright browser bundle is
not installed on this machine and installing it would spend the owner's bandwidth.
Output: `%LOCALAPPDATA%\Temp\chat-mockups\`.

## 2. Clip check — this is the one that found real defects

```bash
NODE_PATH="C:/Users/hamis/projects/sumaiya/node_modules" \
  node C:/Users/hamis/check-clipping.js \
  "C:/Users/hamis/projects/sumaiya/docs/design/2026-09-20" \
  01-empty-chat.html 02-exchange-document-card.html 03-lenga-kwenye-kazi.html \
  04-progress-and-reading.html 05-unavailable.html
```

A flex-column child **shrinks instead of overflowing**, so the visible defect is
inner clipping (`scrollHeight > clientHeight` on a child), not transcript overflow.
The script measures both. Two real defects were caught this way and fixed:

| Screen | Defect | Fixed by |
| --- | --- | --- |
| `02-exchange-document-card.html` | The document card's save control and state line were **30 px below the fold** — the card the user is meant to act on was cut in half | Removed a bubble that repeated what the card itself says |
| `05-unavailable.html` | The unavailable card was **28 px too tall**, and the line being cut was **the honest last sentence** — the exact failure this state exists to prevent | Shortened the working rows' sub-lines and folded the footer into the ruled-out line |

Current state: **every frame reports `ok (nothing clipped)`.**
Re-run it after any edit to a mockup; it is the only check that cannot be fooled by
looking at a screenshot.

## 3. Pixel review — the models, the questions, the findings

`:free` models only, request built inside Python so the base64 PNG goes over the
socket and never through argv (Windows' ~32K command-line limit is what kills a
base64-in-argv call). Models are rotated on a 429 rather than retried.

**Models that produced findings**

| Model | Pass | Verdict it produced |
| --- | --- | --- |
| `inclusionai/ling-3.0-flash-vl:free` | composer / hierarchy / unanswered state | “Reads as **honest and calm**”; decided by `Si mtandao wako, na si maandishi yako` and `Sikutaka uje… nakuambia kabla`. Answered **Yes** that the user's words are unmistakably kept, **Yes** that the composer is reachable one-handed, and **No** to “does anything beg, apologise or blame” |
| `nex-agi/nex-n2.5-pro:free` | the working state | “**Reads as real progress, barely** — two completed concrete outputs and current/pending visible,” but “the progress bar is nearly full after 6 seconds while step 3 of 4 is active; it reads as decorative/fake” |
| `dots-studio/dots-3-note-preview:free` | document card + chips | Chips “look a bit too much like chat bubbles themselves… wrapping into two rows makes it look messy”; the document card “reads a bit like a rich message bubble rather than a cohesive container” |
| `inclusionai/ling-3.0-flash-vl:free` | read success vs read failure vs job sheet | **Yes** — read vs could-not-read is “unmistakable from pixels alone”; “the strongest signal is the red X icon versus the green check icon”. The recovery hint “makes sense immediately… not a technical excuse”. Both job paths read as “equal-sized cards; the selected/open one is distinguished by a red border, tinted background and a checkmark” |

**Models that failed and produced nothing** (recorded so nobody re-runs them
expecting a result): `google/gemma-4-31b-it:free` and
`google/gemma-4-26b-a4b-it:free` (HTTP 429, upstream shared pool),
`thinkingmachines/inkling:free` (403, agentic-harness gate),
`nex-agi/nex-n2.5-mini:free` (invalid request),
`nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free` (502, provider exhausted),
`qwen/qwen3.8-27b:free` (429).

**Claude was not available.** `claude -p "reply with exactly: OK"` exited 1 with
“You've hit your session limit · resets 1:40am (Africa/Nairobi)”. No Claude pass was
used anywhere in this work.

## 4. What the pixel review changed

1. **The unavailable card was clipped** — found by the model, **confirmed by
   measurement**, fixed. (Never trust the model alone; always confirm.)
2. **The progress bar raced to the end while the work was at step 3 of 4** — the bar
   now reports `finished / total`: two of four done is `scaleX(.5)`.
3. **Done and pending step glyphs were too weak to read on a cheap screen** — done is
   now a solid pine disc with a white check; pending is a hollow ring.
4. **The reading sheet showed extracted text *and* a “could not read” warning at the
   same time** — a genuine contradiction in the first draft. Split into screen B
   (succeeded, quiet `Niliisoma yote`) and screen C (failed, error polarity on the
   sheet's edge, no extracted text, the real recovery step).
5. **The suggestion chips read as the user's own bubbles** — moved out of the
   transcript and docked above the composer, one scrollable row.
6. **The document card read as a rich bubble** — it gained a tinted header band and a
   state chip, which no bubble has.
7. **A placeholder parenthetical (“(nitahifadhi hadi nirudi)”)** was called
   confusing — moved out of the field into the draft line below it.
8. **A coloured emoji icon set** (🛡️ 📄 📷 🔒 💼 🔗 💡) was replaced with monochrome
   inline SVG in the palette. A blue shield emoji was an off-palette colour, which
   the brief forbids.
9. **My placeholder logo** — a letter “S” — was replacing the real brand. Every
   mockup now carries the **real `SumaiyaMark` geometry, verbatim from
   `apps/web/components/ui/logo.tsx`** (three swept blades, `M12 2.6 C 15.1 5 15.6 8.6
   13.5 10.8 C 12.7 11.7 11.3 11.7 10.5 10.8 C 8.4 8.6 8.9 5 12 2.6 Z`, rotated 0/120/240).
   The logo was **not** redesigned.
10. **A duplicated greeting** — the lead `Habari, mimi ni Sumaiya 👋` and the body
    both said it. The duplication is real and lives in the app
    (`sumaiya-chat-screen.tsx:384` + `lib/i18n.tsx:100`); the mockup de-duplicates it.

## 5. How to read a vision transcript (learned the hard way)

A vision model reading a 390 px screenshot is an **impression, not evidence**:

- It **misreads small text**. One pass returned `UZOFU` for `UZOEFU` and `linauma`
  for a line it could not resolve. It then judged the state “broken/panicky” on the
  strength of its own bad transcription. That verdict was discarded.
- It **blends the prompt into the image**. A description can contain a string that
  exists only in the question asked, not in the pixels. **Any quoted string must be
  grepped in the source file before it is reported as a defect.**
- Its **absence claims are the least reliable** (“there is no send control”). Verify
  in the HTML before believing one.

**What it is reliable for, and what this design used it for:** hierarchy, density
and crowding at phone width, whether the composer reads as the place to type, whether
the waiting state reads as progress or as a stall, whether the unavailable state
reads as honest or as broken, and whether the screen looks like a proposal or a
wireframe. Every finding acted on above was independently reproducible — the two
clipping defects by measurement, the chip and card findings by reasoning about the
transcript.

## 5b. The real device — captured live, both sides of the AI coming back

The owner's phone was available, and the chat **as it exists today** was captured from
it rather than inferred. Device: Pixel-class, `1344×2992` physical, **override density
408** → the app renders in **527×1173 dp** (my mockups were also re-rendered at that
geometry; nothing clips at either width).

```
ADB="C:/Users/hamis/tools/android-sdk/platform-tools/adb.exe"; S=10.229.114.105:5555
"$ADB" connect $S
"$ADB" -s $S shell svc power stayon true          # or every dump returns the lock screen
"$ADB" -s $S shell input keyevent KEYCODE_WAKEUP
"$ADB" -s $S shell screencap -p /sdcard/x.png && "$ADB" -s $S pull /sdcard/x.png <out>
# in-app typing only — NEVER sign out, uninstall, clear data, or message a real contact
"$ADB" -s $S shell input tap <x> <y>              # the Sumaiya tab, then the composer
"$ADB" -s $S shell input text "word%sanother"     # %s is a space; %20 is typed literally
```

Captures, all in `%LOCALAPPDATA%\Temp\chat-device\`:

| File | What it shows |
| --- | --- |
| `01-chat-empty.png` | The chat **while the AI was unset**: a real thread in which the user sent `Hi` four times unanswered, two near-duplicate requests, a `.docx` attachment, two chip rows and the floating build bar |
| `13-typed-clean.png` | The composer **with the keyboard up** on the real device: the field grows to two lines, the build bar stays pinned, the tab bar yields to the keyboard, and the keyboard takes ~half the screen |
| `16-waiting.png` | **The waiting state, live**: one small dark bubble, three grey dots, no words, no timer, no stop |
| `17-answer.png` | **The answer, live**: her reply in 1.79 s-class time, with **four rows of tappable controls** below it and the chip row repeated verbatim |

Three things this changed in the deliverables:

1. **The premise was corrected.** The assistant **works** now
   (`/api/ai/status` → `{"configured":true,"provider":"deepseek"}`), so mockup
   `05-unavailable.html` was **re-framed from “today's condition” to the failure
   path** — same six rules, demoted priority — and the spec opens by saying so.
2. **The waiting-state finding was promoted** from a code reading to a device
   observation: a user cannot tell a healthy wait from a stalled one.
3. **The control-row count became a finding** — four rows below the last message, with
   the chip row repeating verbatim.

**Device discipline observed:** the phone was in the owner's hands when I first
connected (Facebook in the foreground), so nothing was captured or launched until it
was free; no screencap of his other app was ever taken; no sign-out, no uninstall, no
data clear, no message to a human contact. The only network spend was **one short
Swahili turn in the app's own chat**, to capture the answering state on request.

## 6. What was NOT verified

- **No device run of the redesign.** The device captured the product **as it is**, not
  the proposal. No `scripts/motion-frames.py` verdict and no `dumpsys gfxinfo` numbers
  exist for these mockups: it is a spec, not code.
- **The keyboard-up state was not driven by me.** The composer-with-keyboard capture is
  the app's own (`apps/native/qa/2026-09-11/42-chat-sent.png` and `13-typed-clean.png`),
  not a mockup of the redesigned composer with an inset keyboard.
- **No live session.** `/assistant` needs a signed-in account and no saved credential
  exists for the owner's; the live AI-off behaviour is cited from the sibling agents'
  captures, not reproduced here.
- **Dark mode was not mocked.** One reviewer argued dark is more legible outdoors on
  cheap LCDs; unresolved. Flagged for the owner.
- **200% font scale was not rendered.** The rules are derived from Google's
  `TextSizeCheck` criteria, not from a screenshot at `fontScale = 2`.
