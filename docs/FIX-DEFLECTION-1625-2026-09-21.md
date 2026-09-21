# Deflection + rail-honesty + competitor-bleed + copy — fixes and evidence

Date: 2026-09-21 · repo `sumaiya` · branch `release/1.6.25` (nothing pushed, nothing committed by me yet)
Source of the defects: `docs/QA-NATIVE-1625-2026-09-21.md` §2.3–2.5 (live Pixel 8 Pro, build 1.6.25).

This file is written incrementally so a killed run still leaves usable material.

---

## 0. The four items

| # | Item | Status |
|---|------|--------|
| 1 | The deflection — a deliverable request must be ANSWERED, not answered with a menu | fixed, deterministic + prompt; live AFTER quoted below |
| 2 | The rail must not claim an answer it did not receive (`✓ Hii hapa jibu lako`) | fixed in `apps/native` (+ web twin) |
| 3 | The prose must offer OUR listings first, competitors only as a secondary mention | fixed in both prompts |
| 4 | Swahili copy defects (`customer service`, `ATS`, `CV yangu`) | fixed in both prompts + a deterministic reply guard |

---

## 1. Root causes (from the code, not from guesses)

The measured replies were **not** the model's own words. Both of them are string constants:

* `apps/web/lib/assistant/repeat-guard.ts:96` (old) — `Nimekuelewa 😊 Hivi karibuni tumezungumza jambo kama hili … ni ipi?`
* `apps/web/lib/assistant/repeat-guard.ts:98` (old) — `Umekwisha niambia hivyo, asante! … Tutafanya nini kwanza?`

`guardReplyAgainstRepeat()` runs on **both** chat paths the device uses
(`lib/api/routes/mobile.ts:154`, `lib/api/routes/ai.ts:846`). It swapped the model's reply for a
canned MENU whenever the fresh reply was ≥ 0.72 similar to an earlier one — which is exactly what
happens when a user asks the same question twice. **The deliverable was written and then thrown away.**

The second mechanism is the fallback branch proper: `analyzeConversation()` sees the word "CV" and
sets `docMode: "cv"` + `intakeActive: true`, so the prompt ran the GATHER script
("Ask about ONE thing per message", `ai.ts:711-726`). Measured on the live API with a single message
(no prior reply → the guard cannot fire):

```
POST https://sumaiya.app/api/ai/assistant-turn
{"messages":[{"role":"user","content":"Nisaidie kuandika muhtasari mfupi wa CV ya huduma kwa mteja."}],"lang":"sw"}
→ {"reply":"Nzuri — muhtasari mfupi wa CV ya huduma kwa mteja tunaweza kuandika haraka. Kwanza, ni kazi gani hasa unayoiomba, na jina lako ni nani?"}
```

Two questions, no summary. So both the guard AND the gather-first branch had to be fixed.

---

## 2. BEFORE (live production, real DeepSeek, quoted verbatim)

Request (`lang: "sw"`), sent to `https://sumaiya.app/api/ai/assistant-turn`:

**A. single message (guard cannot fire)**

```json
{"messages":[{"role":"user","content":"Nisaidie kuandika muhtasari mfupi wa CV ya huduma kwa mteja."}],"lang":"sw"}
```
> Nzuri — muhtasari mfupi wa CV ya huduma kwa mteja tunaweza kuandika haraka. Kwanza, ni kazi gani hasa unayoiomba, na jina lako ni nani?

**B. with the same request already in the thread (the device shape — guard active)**

```json
{"messages":[
  {"role":"user","content":"Nisaidie kuandika muhtasari mfupi wa CV ya huduma kwa mteja."},
  {"role":"assistant","content":"Nzuri — muhtasari mfupi wa CV ya huduma kwa mteja tunaweza kuandika haraka. Kwanza, ni kazi gani hasa unayoiomba, na jina lako ni nani?"},
  {"role":"user","content":"Nisaidie kuandika muhtasari mfupi wa CV ya huduma kwa mteja."}],"lang":"sw"}
```
> Sawa, tunaanza na muhtasari huo. Niambie jina lako, na ni kazi gani unaiomba kwenye CV hii?

**C. jobs question (competitor bleed), live**

```json
{"messages":[{"role":"user","content":"Nianzie wapi kutafuta kazi Tanzania?"}],"lang":"sw"}
```
> Anza na Ajira Portal (portal.ajira.go.tz) kwa kazi za serikali, kisha BrighterMonday, JobwebTanzania, Fuzu na Mabumbe. Kazi nyingi haziwekwi mtandaoni — pitia kwenye ubao wa matangazo wa halmashauri ya wilaya, ofisi ya kata, VETA, makanisa na misikiti, na kurasa za kazi za Mwananchi, Uhuru au The Guardian.

Our own list (11 real rows, §2.5 of the QA report) is never mentioned.

---

## 3. What changed

### 3.1 New: `apps/web/lib/assistant/deliverable.ts`
`requestedDeliverable(text)` → which deliverable the user asked for (summary, cover letter, letter,
message, about-me, experience, skills), or `null`. `replyCarriesDeliverable(reply)` /
`classifyTurnEnding(reply)` → `"answer" | "question" | "other"`, measured against the two device
replies (both classify as `question`, i.e. NOT an answer).

### 3.2 `apps/web/lib/assistant/repeat-guard.ts`
* `REPEAT_VARIANTS` rewritten: no menu of other actions, and no false claim that the user repeated
  themselves (`Umekwisha niambia hivyo` asserted something the module cannot know).
* `guardReplyAgainstRepeat(..., ctx?)` now ABSTAINS when (a) the user asked for a deliverable, or
  (b) the fresh reply already carries one. A menu is never a substitute for a deliverable.

### 3.3 `apps/web/lib/assistant/intent.ts`
`buildConversationGuidance()` gained a DELIVER-FIRST block that outranks the gather script whenever
the latest message asks for a deliverable (one short question allowed, but the work must still appear).

### 3.4 `apps/web/lib/api/routes/ai.ts` (prompt v2.2 → **v2.3**) and `mobile.ts` (v1.3 → **v1.4**)
* DELIVER-FIRST prompt section; the gather script no longer runs first for a deliverable request.
* `FINDING VACANCIES` rewritten: OUR OWN LISTINGS COME FIRST; an outside source only as a secondary
  mention, never as the answer.
* Swahili copy rules (no untranslated English, no `ATS`, second-person possessives).
* The repeat instruction no longer says "offer something new instead" (that produced menus).
* Both routes pass `latestUserMessage` to the guard and run the new Swahili copy guard last.

### 3.5 New: `apps/web/lib/assistant/reply-copy.ts`
Deterministic last pass on Swahili replies: `customer service` → `huduma kwa mteja`,
`barua ya maombi`, `muhtasari`, `ATS` → `ukaguzi wa CV` / `alama ya CV` / `mifumo ya kuajiri`,
`vichujio vya waajiri` → `vigezo vya waajiri`, `CV yangu` → `CV yako`. English replies untouched.

### 3.6 `apps/native/src/components/chat/chat-progress.ts` (the rail)
`✓ Hii hapa jibu lako` is emitted at `chat-progress.ts:219` (old line 148). It was printed for ANY
turn that returned a reply. Now `TurnProgress.ending` carries the real ending
(`turnEndingOf(reply)`), and the finished row reads:
`answer → "Hii hapa jibu lako"`, `question → "Nimekuuliza kitu"` / `"I've asked you something"`,
not reported → `"Nimejibu"`. Set in `apps/native/src/hooks/use-sumaiya-chat.ts:314` (and `:527` for
the built-CV turn). The web twin (`apps/web/lib/assistant/chat-progress.ts` +
`components/assistant/cv-assistant-client.tsx:984`) carries the same fix.

---

## 4. Evidence — deterministic (RED → GREEN)

Native rail (jest), with the old label line temporarily restored:

* old label, new tests → `Tests: 3 failed, 11 passed, 14 total`
* fixed code → `Tests: 14 passed, 14 total`

Web guard (vitest), with the two new abstain rules temporarily removed:

* pre-fix behaviour, new tests → 3 failures (`expected 'Sawa. Tuchukue hatua moja kwa wakati…' to be 'Karibu! …'`)
* fixed code → all pass

Swahili lint — the exemption is real and NARROW (marker `swahili-lint-ignore`, the convention already
used at `lib/upload-limits.ts:11` and `components/assistant/cv-assistant-client.tsx:1166`):

| run | result |
|-----|--------|
| probe `// … kagua ATS` into `lib/assistant/intent.ts` (ordinary copy file) | `Tests 1 failed \| 749 passed (750)` — guard BITES |
| probe the same into a NEW unmarked line inside `reply-copy.ts` | `Tests 1 failed \| 749 passed (750)` — exemption is line-scoped, not file-wide |
| probe `"Nimeboresha CV yangu"` into `intent.ts` (possessive guard) | `Tests 1 failed \| 749 passed (750)` — guard BITES |
| both probes deleted | `Tests 750 passed (750)` |

`apps/web` typecheck `tsc --noEmit`: exit 0. `apps/native` typecheck: exit 0.
`apps/web` full vitest: `Test Files 163 passed | 1 skipped (164)`, `Tests 2469 passed | 3 skipped (2472)`, exit 0.
`apps/native` jest (chat + swahili-lint + reply-bubbles): `Test Suites 6 passed`, `Tests 430 passed`.

(The earlier full-suite log with 2 `swahili-lint` failures was the run started at 10:05, before the
markers landed; the `tools-extract` DOCX failure in that log did not reproduce — it passes alone
(8/8) and in the clean full run, i.e. a load flake against its 5 s cap.)

---

## 5. AFTER — how it was verified, and what each method does NOT prove

**Method and its limits, stated first.** The fix is not deployed (and I did not deploy it: two
`vercel deploy` attempts were made and the second was cancelled by the owner — metered Build CPU —
so no deploy is part of this work). Two weeks of auth wall also block the app's own mobile route:
`POST /api/mobile/chat` returns `{"error":"Unauthorized"}` without a Supabase session, and email
sign-up is broken (429), so no account can be created. Therefore:

* **real-model AFTER on production: NOT POSSIBLE** — production still runs the old prompt.
  Labelled `dependency unavailable (no provider key locally; no deploy permitted)`.
* **what was done instead:** the app was run LOCALLY against a stub OpenAI-compatible provider
  (`LITELLM_BASE_URL=http://127.0.0.1:8787/v1`, the provider seam already in
  `lib/api/ai-provider.ts`), so the REAL route, the REAL prompt assembly and the REAL guards ran.
  The MODEL TEXT in the quotes below is the stub's, i.e. this proves the prompt + the pipeline,
  **not** model quality. Every prompt-side claim below is read off the prompt the route itself built.

### 5.1 The assembled prompt (route-built, local run)

`POST http://127.0.0.1:3111/api/ai/assistant-turn` with the exact request, `lang: "sw"` — the
19,268-character prompt the route sent contains:

```
• ⚠️ DELIVER-FIRST — the user's latest message asks for a CV professional summary (muhtasari wa CV).
Your REPLY this turn must CONTAIN that deliverable, written out in full, in their language, ready to
copy — the actual sentences, not a description of them. A menu of things you COULD do ("naweza
kukagua CV yako, kuilinganisha na kazi, au kutengeneza hati — ni ipi?") is NOT an answer and must
never replace it. A menu MAY follow the deliverable; it may not stand in for it. Do NOT start with
questions.
```
```
FINDING VACANCIES — OUR OWN LISTINGS COME FIRST. Sumaiya already carries real, daily-updated
Tanzanian vacancies (the in-app "Nafasi za kazi" list) … NEVER name an outside job site as the
answer, and never lead with one. Only when they have ALREADY seen our list and still want more may
you add at most ONE outside source as a secondary mention …
```
```
SWAHILI COPY (whenever you answer in Swahili — non-negotiable): … Write "huduma kwa mteja" (never
"customer service") … NEVER write "ATS" in Swahili …
```

and the OLD competitor-first sentence is gone from the assembled prompt:

```
"name at most two real sources"                                → False
"Ajira Portal (portal.ajira.go.tz) for government, BrighterMonday" → False
```

### 5.2 AFTER replies (local route + stub provider — quoted verbatim)

Exact device request, stable prompt:

> Hii hapa muhtasari mfupi wa CV yako: Msaidizi wa huduma kwa mteja mwenye uzoefu wa miaka mitatu
> katika mapokezi, kushughulikia malalamiko na kuhudumia wateja kwa heshima. Nimezoea kufanya kazi
> kwa mfumo wa kompyuta na kutunza rekodi za wateja kwa usahihi. Natafuta nafasi ya kuhudumia
> wateja ambapo naweza kuongeza kuridhika kwa wateja. Nikuboreshe zaidi?

The menu, when present, FOLLOWS the summary instead of replacing it — which is the rule the fix
encodes. Same request in the device shape (a near-identical earlier reply already in the thread):

| run | reply |
|-----|-------|
| pre-fix guard (abstain rules temporarily removed) | `Sawa. Tuchukue hatua moja kwa wakati: nini kifuatacho kwako?` — the summary is GONE |
| fixed guard, identical request history | `Hii hapa muhtasari mfupi wa CV yako: … Nikuboreshe zaidi?` — the summary survives |

### 5.3 Copy guard end-to-end (stub played a model that leaked all three defects)

stub reply → what the route RETURNED:

```
in : Nimeona CV yangu ya customer service — nzuri. Nikuonyeshe alama ya ATS yako?
out: Nimeona CV yako ya huduma kwa mteja — nzuri. Nikuonyeshe alama ya CV yako?
```

### 5.4 The rail

`apps/native` jest, with the old label line temporarily restored: `3 failed, 11 passed, 14 total`;
with the fix: `14 passed`. The two device replies classify as `question`, so the finished row reads
`Nimekuuliza kitu` / "I've asked you something" instead of `Hii hapa jibu lako`.

### 5.5 Item by item

| # | Item | Evidence | Not proven |
|---|------|----------|-----------|
| 1 | Deflection | live BEFORE (3 real-model replies, no summary); route-built prompt now orders delivery; pre-fix vs fixed guard RED/GREEN end-to-end; 9-detector unit tests on the verbatim device strings | that DeepSeek obeys the new prompt — needs a deploy or a provider key |
| 2 | Rail | jest RED→GREEN; `turnEndingOf` tested on the two verbatim device replies | not run on a device (no APK build allowed/needed) |
| 3 | Competitor bleed | route-built prompt says our listings first; old sentence absent (asserted) | model's actual prose for the jobs question |
| 4 | Copy defects | end-to-end quote in 5.3 (3 defects fixed in one pass); web `swahili-lint` 750/750 GREEN (after the narrow marker exemption, with the guard proven to still bite); 8 unit tests | — |

