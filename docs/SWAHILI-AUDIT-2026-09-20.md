# Sumaiya — Swahili audit, 2026-09-20

**Companion to:** `docs/SWAHILI-STANDARD-2026-09-20.md` (the language standard and glossary).
**Status:** the changes in §4 are **implemented and committed**. Everything in §5 is
**flagged, not changed** — it is the owner's call.
**Standing caveat:** neither the agent that ran this audit nor the model that helped is a
native Swahili speaker. The owner is. Two of the defects below were found **by him**, not by
this audit — which is the honest measure of how much a non-native audit can be trusted:
it catches mechanics and inconsistencies, not register.

---

## 1. Coverage: what was enumerated, and how

Strings were enumerated **mechanically**, not by reading files. Four extractors, all
grep/AST-lite based, then deduplicated on `(file, line, string)`:

| # | Extractor | Catches |
|---|---|---|
| 1 | `sw` object parse of `apps/web/lib/i18n/translations.ts` | the web `sw:` tree, keyed by namespace |
| 2 | `t("en", "sw")` call matcher | the native app's inline bilingual pairs |
| 3 | `sw:` property matcher | `{ en, sw }` and `sw: "…"` objects across web + native + packages |
| 4 | ternary matcher for `sw ? "A" : "B"`, `lang === "sw" ? … : …`, `lang !== "sw" ? … : …` | the web marketing/legal pages and app screens, which translate inline rather than through the tree |

**Result: 3,474 Swahili string instances across 428 files (2,536 distinct strings).**

| Surface | strings |
|---|---|
| web components | 1,146 |
| native screens | 555 |
| native CV templates (name + blurb per template) | 436 |
| native lib / services (server-driven and in-app copy) | 424 |
| web lib (server-composed copy) | 289 |
| web marketing + legal pages | 234 |
| web i18n `sw` tree (`translations.ts`) | 125 |
| native components | 98 |
| packages (shared, e.g. vacancy sources) | 20 |
| native navigation | 5 |

Two extraction passes were needed: the first (1 & 3) reported 2,005 instances and **missed
the entire marketing surface**, because those pages translate with a `sw ? … : …` ternary
rather than a `t()` call or an `{ en, sw }` object. The ternary pass added 1,469 more.

**Not covered by enumeration — state it plainly:** every string the **language model
generates at runtime** (assistant replies, AI-written CV lines, AI explanations). Those are
not literals; they come out of prompts in `apps/web/lib/api/routes/ai.ts`,
`apps/web/lib/assistant/*`, `apps/native/src/hooks/use-sumaiya-chat.ts` and
`apps/native/src/lib/ats.ts`. The Swahili quality of the assistant's own sentences is
**not measurable by this audit** and should be sampled live.

---

## 2. Defect classes found

| # | Class | Count | Status |
|---|---|---|---|
| A | **Loaded street word** — right gloss, loaded real-world meaning | 1 | **fixed** (native speaker catch #2) |
| B | **Fabricated word** — not Swahili at all | 1 | **fixed** (native speaker catch #1) |
| C | **Mechanism named in Swahili** (ATS) | 15 | **fixed** |
| D | **English word inside a Swahili sentence** where the product already owns a Swahili term | 5 | 4 **fixed**, 1 **flagged** |
| E | **Ambiguous / mistranslated** (reads as something else) | 5 | **flagged** |
| F | **Untranslated surface** — English only, no Swahili at all | 4 + emails | **flagged** |
| G | **Inconsistent term** across surfaces (both words real) | 2 | **flagged** |

Prior audits in this repo already had guards for the calque/agreement classes
(`tajriba`, `barua ya kazi`, `Wathibitishaji`, `ailenge`, bare `Hakiki`, `MANENO YA
MAPENZI`, `kwa`/`wa` agreement). Those did **not** recur; nothing here re-treads them.

---

## 3. The worst offenders, quoted

### 3.1 `Omba kwa ujanja` — the loaded word (class A)

`apps/native/src/screens/job-apply-screen.tsx:235`

```
<ScreenTitle …>{t("Apply smarter", "Omba kwa ujanja")}</ScreenTitle>
```

The English is *"Apply smarter"*; the Swahili told the user to apply **by trickery**.
Owner, 2026-09-20: *"omba kwa ujanja is not right — ujanja means tricky in the streets."*

Evidence that this is a real register problem and not one person's preference (full citation
list in the standard's §5):

- Wiktionary glosses **ujanja** as *"cunning"* / *"craftiness"*, and **mjanja** as *"a cunning
  person; a shrewd person"* / *"a crafty person"*.
- Vavrus (2015), *"More clever than the devil: ujanja as schooling strategy in Tanzania"*,
  describes ujanja as *"cleverness, opportunism, **and deception**"*. Its footnote 2 records a
  **Tanzanian native speaker** (Amina) telling the author that *mjanja* *"can mean mlaghai —
  a cheat or a liar"*, and recommending *mwerevu* instead for its positive connotation.
- **Mwananchi**, Tanzania's leading Swahili daily, uses it for fraud: *"uchunguzi wa ujanja wa
  waganga kufilisi watu"* — an investigation into witchdoctors fleecing people.
- A Swahili reference site ties it directly to deception: *"humaanisha kufanya ujanja na
  udanganyifu"* — "means doing ujanja **and deception**".

**Why this is the worst string in the product:** the app's whole promise is that a CV built
with it is honest and gets read. Telling a jobseeker in Tanzania to apply *kwa ujanja* is
both insulting to the reader and an instruction to cheat the employer. It is a brand-level
liability, not a wording nit.

**Applied:** `"Omba vyema"` (EN unchanged). Proposed rather than asserted — the standard's
§5.3 explains why `werevu`, the only candidate with a native-speaker endorsement, was **not**
adopted on this audit's authority (its own dictionary gloss still includes "cunning").
The owner may prefer `Omba kwa werevu`, `Omba kwa uangalifu`, or an outcome-naming title.

### 3.2 `Mgusiko mmoja, hakuna nywila.` — the fabricated word (class B)

`apps/native/src/screens/auth/sign-in-screen.tsx:235`

```
{t("One tap, no password.", "Mgusiko mmoja, hakuna nywila.")}
```

`mgusiko` is not a Swahili word (kaikki/Wiktionary has no entry; the verb is `-gusa`, the noun
for a touch is **`mguso`**). This was the owner's first catch of the session and it is the
same fabrication class the native lint already guards for (`kitone`/`vitone` were the previous
instances).

**Applied:** `"Mguso mmoja, hakuna nywila."` — the minimal change, keeping the owner's own
words (`nywila` **is** a real Swahili word for password, class IX, with `nenosiri` as its
dictionary synonym — see the standard's §3).

### 3.3 ATS named in Swahili — 15 user-visible native strings (class C)

The product's hard rule is *"sell the outcome, never the mechanism"*, and Swahili copy must
never say "ATS". **Web enforces it in two tests** (`apps/web/lib/swahili-lint.test.ts` →
`ats-jargon-in-swahili`, and `apps/web/lib/i18n/no-ats-jargon.test.ts`). **Native enforced
nothing**, so it shipped 15 strings with the mechanism in the Swahili slot. Seen **on the
device**, Home screen, Kiswahili, 2026-09-20:

> **"Ukaguzi wa ATS"** — the quick-action tile (`apps/native/src/screens/app/home-screen.tsx:275`)

Others, all user-visible:

| file:line | string |
|---|---|
| `apps/native/src/lib/cv-engine/document.ts:86` | `sw: "Salama kwa ATS"` (a CV preset label) |
| `apps/native/src/lib/cv-html.ts:35` | `sw: "Salama kila mahali. Nzuri kwa ATS."` |
| `apps/native/src/lib/templates/grid.ts:12` | `sw: "Kali kwa ATS, inasomwa na mashine"` |
| `apps/native/src/lib/ats.ts:94` | `"… — ATS huhitaji vyote."` |
| `apps/native/src/lib/ats.ts:100` | `"Ondoa picha — mifumo mingi ya ATS hukataa…"` |
| `apps/native/src/lib/ats.ts:121` | `"… ili ATS isome vizuri."` |
| `apps/native/src/components/premium-sheet.tsx:52` | `"Alama ya ATS ya uhakika inabaki bure"` |
| `apps/native/src/screens/app/help-faq-screen.tsx:25` | `sw: "Alama ya ATS inafanyaje kazi?"` |
| `apps/native/src/screens/app/help-faq-screen.tsx:28` | `"Kichunguzi cha ATS hulinganisha CV yako…"` |
| `apps/native/src/screens/app/help-faq-screen.tsx:56` | `"…au tumia kichunguzi cha ATS…"` |
| `apps/native/src/screens/app/help-faq-screen.tsx:70` | `"…kuzungumza na Sumaiya, kuangalia ATS na kupata ajira…"` |
| `apps/native/src/screens/ats-checker-screen.tsx:119` | `t("ATS-ready", "Tayari kwa ATS")` |
| `apps/native/src/screens/ats-checker-screen.tsx:123` | `t("ATS check", "Ukaguzi wa ATS")` |
| `apps/native/src/screens/ats-checker-screen.tsx:207` | `"Ukaguzi wa uhakika — sawa na ATS halisi…"` |
| `apps/native/src/screens/cv-editor-screen.tsx:505` | a badge rendering the bare literal `ATS` in the Swahili UI |

**Fixed with the vocabulary the web tree already uses** — `mifumo ya kuajiri`,
`vichujio vya waajiri`, `kikagua CV`, and — following the web precedent at
`apps/web/app/[locale]/(marketing)/about/page.tsx:51` where "ATS-safe export" is rendered
**"Uhamishaji unaosomwa na waajiri"** — `waajiri` for the "safe/ready for the ATS" labels.
English strings are untouched: English copy is allowed to keep "ATS".

**Root cause fixed too:** the missing guard. `apps/native/src/lib/swahili-lint.test.ts` now
carries `ATS_IN_SWAHILI`, the mirror of the web guard. Without it the same 15 strings come
back the next time someone writes native copy.

### 3.4 English words inside Swahili sentences (class D)

| string | file:line | verdict |
|---|---|---|
| `"Bandika link ya ajira"` | `apps/native/src/components/chat/attach-sheet.tsx:23` | **fixed** → `"Bandika kiungo cha ajira"` |
| `t("Job link", "Link ya ajira")` | `apps/native/src/components/chat/attachment-preview-sheet.tsx:63` | **fixed** → `"Kiungo cha ajira"` |
| `"…au bandika link ya ajira nikutengenezee CV iliyolengwa."` | `apps/native/src/screens/jobs-screen.tsx:138` | **fixed** → `"…au bandika kiungo cha ajira…"` |
| `t("Paste the job link", "Bandika link ya ajira")` | `apps/native/src/screens/sumaiya-chat-screen.tsx:511` | **fixed** → `"Bandika kiungo cha ajira"` |
| `"Miundo halisi na makusanyo ya premium, yanayolingana na uwanja wako."` | `apps/native/src/screens/app/home-screen.tsx:215` | **flagged** (§5.1) |

The `link` → `kiungo` fix is not a preference: **the owner already made this decision.** He
corrected *"tuma link"* → *"tuma kiungo"* in an earlier pass, and the product already uses
**kiungo** in at least ten places (`application-detail-screen.tsx:149` "Kiungo cha ajira (si
lazima)", `invite-screen.tsx:88`, `guides.ts:69`, `short-courses.ts:97`, web sign-in and
reset-password). Four strings kept the English word — a decided term quietly regressing,
which is exactly the failure the project's own copy standard warns to re-check every session.
A guard (`LINK_FOR_KIUNGO`) now makes it stick.

### 3.5 `Kali kwa ATS, inasomwa na mashine` — a double defect

`apps/native/src/lib/templates/grid.ts:12` — EN: *"ATS-strict, machine-readable"*.

`kali` glosses as **sharp / fierce / acidic / intense**. "Fierce toward the ATS" is not a
description of a CV layout; it was a word-by-word rendering of English *"strict"*. Fixed to
**`"Inasomwa na mashine"`** (the part that carries meaning), which also drops the ATS mention.

---

## 4. Changes implemented (21 strings, 17 files)

Commit: see §7. Every edit was applied by exact-match script with a per-edit `OK/FAIL` report
(21 applied, 0 failed), then re-grepped for residuals: `ujanja` 0, `Mgusiko` 0, `link ya` 0,
Swahili-side `ATS` 0 across `apps/native/src` and `apps/web`.

| file:line | before | after | why |
|---|---|---|---|
| `apps/native/src/screens/job-apply-screen.tsx:235` | `"Omba kwa ujanja"` | `"Omba vyema"` | loaded street word (§3.1) |
| `apps/native/src/screens/auth/sign-in-screen.tsx:235` | `"Mgusiko mmoja, hakuna nywila."` | `"Mguso mmoja, hakuna nywila."` | fabricated word (§3.2) |
| `apps/native/src/components/chat/attach-sheet.tsx:23` | `"Bandika link ya ajira"` | `"Bandika kiungo cha ajira"` | decided term regressed (§3.4) |
| `apps/native/src/components/chat/attachment-preview-sheet.tsx:63` | `"Link ya ajira"` | `"Kiungo cha ajira"` | same |
| `apps/native/src/screens/jobs-screen.tsx:138` | `"…bandika link ya ajira…"` | `"…bandika kiungo cha ajira…"` | same |
| `apps/native/src/screens/sumaiya-chat-screen.tsx:511` | `"Bandika link ya ajira"` | `"Bandika kiungo cha ajira"` | same |
| `apps/native/src/screens/app/home-screen.tsx:275` | `t("ATS check", "Ukaguzi wa ATS")` | `"Ukaguzi wa CV"` | §3.3 |
| `apps/native/src/screens/ats-checker-screen.tsx:119` | `"Tayari kwa ATS"` | `"Tayari kwa waajiri"` | §3.3 |
| `apps/native/src/screens/ats-checker-screen.tsx:123` | `"Ukaguzi wa ATS"` | `"Ukaguzi wa CV"` | §3.3 |
| `apps/native/src/screens/ats-checker-screen.tsx:207` | `"sawa na ATS halisi"` | `"sawa na mifumo halisi ya kuajiri"` | §3.3 |
| `apps/native/src/screens/cv-editor-screen.tsx:505` | literal `ATS` badge | `t("ATS", "Kagua CV")` | §3.3 |
| `apps/native/src/lib/cv-engine/document.ts:86` | `"Salama kwa ATS"` | `"Salama kwa waajiri"` | §3.3, mirrors web `about/page.tsx:51` |
| `apps/native/src/lib/cv-html.ts:35` | `"Nzuri kwa ATS."` | `"Nzuri kwa waajiri."` | §3.3 |
| `apps/native/src/lib/templates/grid.ts:12` | `"Kali kwa ATS, inasomwa na mashine"` | `"Inasomwa na mashine"` | §3.5 |
| `apps/native/src/lib/ats.ts:94` | `"— ATS huhitaji vyote."` | `"— mifumo ya kuajiri huhitaji vyote."` | §3.3 |
| `apps/native/src/lib/ats.ts:100` | `"mifumo mingi ya ATS hukataa"` | `"mifumo mingi ya kuajiri hukataa"` | §3.3 |
| `apps/native/src/lib/ats.ts:121` | `"ili ATS isome vizuri"` | `"ili mifumo ya kuajiri isome vizuri"` | §3.3 |
| `apps/native/src/screens/app/help-faq-screen.tsx:25` | `"Alama ya ATS inafanyaje kazi?"` | `"Alama ya CV yangu inafanyaje kazi?"` | §3.3 |
| `apps/native/src/screens/app/help-faq-screen.tsx:28` | `"Kichunguzi cha ATS hulinganisha…"` | `"Kikagua CV hulinganisha…"` | §3.3 |
| `apps/native/src/screens/app/help-faq-screen.tsx:56` | `"tumia kichunguzi cha ATS kuona…"` | `"tumia kikagua CV kuona…"` | §3.3 |
| `apps/native/src/screens/app/help-faq-screen.tsx:70` | `"kuangalia ATS na kupata ajira"` | `"kukagua CV yako na kupata ajira"` | §3.3 |
| `apps/native/src/components/premium-sheet.tsx:52` | `"Alama ya ATS ya uhakika…"` | `"Alama ya CV yako ya uhakika…"` | §3.3 |

**Everything above is a NATIVE-app change → it needs the next APK, not a Vercel deploy.**
The only web-side change is the lint itself; nothing user-visible changed on the web.

### 4.1 Guards added (so this class cannot come back)

`apps/web/lib/swahili-lint.test.ts` (+3 guards) and `apps/native/src/lib/swahili-lint.test.ts`
(+4 guards, each with `bad`/`good` samples):

| guard | pattern | catches |
|---|---|---|
| `loaded-street-word` (both lints) | `\b(ujanja\|mjanja\|wajanja\|janja)\b` | the `ujanja` class |
| `fabricated-word` (both) | `\bmgusiko\b` | the fabricated-word class |
| `link-for-kiungo` (both) | `\blink ya\b` | English `link` in Swahili copy |
| `ATS_IN_SWAHILI` (native only — web already had it) | `\b(?:wa\|ya\|kwa\|za\|la\|cha\|na\|kwenye\|kikagua)\s+ATS\b` | the mechanism-in-Swahili class |

**Each guard was proven to fire, not merely written.** A temporary probe file containing
`"Omba kwa ujanja"`, `"Mgusiko mmoja"`, `"Bandika link ya ajira"` and `"Ukaguzi wa ATS"` was
dropped into `src/`, the lint was run and **failed with the guard's own message** on each of
the four patterns, and the probe was deleted:

```
"Mgusiko" — not a Swahili word; the noun for a touch is "mguso" … in …__lintprobe__.ts:1
"link ya" — English "link" inside Swahili copy; use "kiungo" … in …__lintprobe__.ts:1
"wa ATS" — names the ATS mechanism in Swahili copy; describe the outcome instead … :1
"ujanja" — loaded street word: ujanja/mjanja gloss as "cunning"/"crafty" and read as TRICKERY … :1
```

A guard never seen failing is not known to work.

---

## 5. FLAGGED — not changed, awaiting the owner's decision

These are judgement calls in his language. None was rewritten.

### 5.1 `"Miundo halisi na makusanyo ya premium, yanayolingana na uwanja wako."`
`apps/native/src/screens/app/home-screen.tsx:215` — read **on the device**, Home screen.

Lowercase English `premium` inside a Swahili sentence. The product's own Swahili gloss for the
Premium tier is **"hali ya juu"** (Profile screen, on device: *"Miundo ya hali ya juu na kozi
za kina"*), so `"ya premium"` here is inconsistent with the product's own term.
**Why flagged and not changed:** the project standard lists **Premium** as *brand layer* — a
tier name stays as-is. This is a *descriptive* lowercase use, not the tier name, so it arguably
should be `"makusanyo ya hali ya juu"`, but the line between "the brand Premium" and "a premium
thing" is the owner's to draw.

### 5.2 `"Inahitaji kazi"` (EN *"Needs work"*) — ambiguous, in three places
- `apps/native/src/screens/ats-checker-screen.tsx:119`
- `apps/web/app/[locale]/(marketing)/ats-checker/ats-checker-client.tsx:120`
- `apps/web/components/assistant/cv-assistant-client.tsx:3120`

It is the middle band of a three-way score label (`Tayari` / `Inahitaji kazi` / `Hatari
kubwa`). On a **job**-application product, *"Inahitaji kazi"* can read as **"needs a job"**
rather than "needs work done to it". Proposed: **`"Inahitaji marekebisho"`** ("needs
corrections") — unambiguous, and `marekebisho` is already the product's word for fixes.
Flagged because it labels a score and the owner may read it as fine as it stands.

### 5.3 `"Tengeneza"` as the Process button, while the body says `"zinachakatwa"`
`apps/web/lib/i18n/translations.ts:282` (button `process: "Tengeneza"`) vs `:260`
(`"Zote zinachakatwa kwa usalama…"`).

`-tengeneza` = make/create; `-chakata` = process (data). The same namespace uses **chakata**
in prose and **tengeneza** on the button — and `kuchakachua` is the banned word, so the safe
form is `chakata`. Proposed: **`"Chakata"`**. Flagged because it is a button label the owner
may have chosen deliberately.

### 5.4 `"Tumia wasifu kuanza →"` (EN *"Use your profile to start"*)
`apps/native/src/screens/app/home-screen.tsx:383` — **seen on the device**, Home screen.

Grammatically loose: `kuanza` is the infinitive, so the line reads as "use the profile to
start" with no object for either verb. Proposed: **`"Anza na wasifu wako →"`** or
`"Tumia wasifu wako kuanza →"`. Flagged — this is a small wording fix in his voice.

### 5.5 `"Ulizopakua"` as the Downloads heading (EN *"Downloads"*)
`apps/web/lib/i18n/translations.ts:194`. `Ulizopakua` = *"the ones you downloaded"* — a
relative clause used as a heading. Proposed: **`"Upakuaji"`** or `"Vilivyopakuliwa"`. Flagged.

### 5.6 `"Mpango unaendelea"` as the Premium-active label (EN *"Plan active"*)
`apps/web/lib/i18n/translations.ts:195`. `unaendelea` = *"is continuing"* — reads as "the plan
is ongoing", not "the plan is active". Proposed: **`"Mpango unatumika"`** or `"Mpango hai"`.
Flagged.

### 5.7 `"Shirikisha Sumaiya"` as the share/invite section label (EN *"Share Sumaiya"*)
`apps/native/src/screens/app/profile-screen.tsx:339` — **seen on the device**, Profile screen
(as `SHIRIKISHA SUMAIYA`, above "Mwalike rafiki").

`-shirikisha` means **to involve/enlist someone** ("involve Sumaiya"), not to share. The
market term for something spreading is **`-sambaza`** — but the standard's own research could
**not** find a source for a real *share-button* label on any reachable Tanzanian job platform
(the standard's §3 marks *share* as **flag**). So this is flagged rather than changed:
proposed **`"Sambaza Sumaiya"`**, confidence **medium**.

### 5.8 Leftover English example literals inside Swahili strings
- `apps/web/lib/i18n/translations.ts:295` — `"Iweke fupi — DRAFT, SIRI, au jina lako linafaa
  zaidi."` — the EN string lists `DRAFT, CONFIDENTIAL`; the Swahili translated CONFIDENTIAL
  (**SIRI**) but left **DRAFT** in English, so the example set is half-translated.
- `apps/web/lib/i18n/translations.ts:296` — `"…kama 'n / jumla'."` — quoting a page-number
  format; harmless, but "total" is rendered while the `n` is not Swahili.

Flagged as cosmetic; the owner may prefer to leave both.

### 5.9 `"Kikagua CV"` is a coinage — sanctioned, but worth his eye
`kikagua` is an agent noun built from `-kagua` (check) and appears in the repo's **approved**
replacement list, so this audit used it rather than inventing something else. It is not a
dictionary word. If the owner dislikes it, the alternative is a phrase (`"kikagua CV"` →
`"ukaguzi wa CV"`), and the guard message would change with it.

---

## 6. Untranslated: English leaking into the Swahili UI

### 6.1 On the device (Pixel, `pro.sumaiya.app` 1.6.24, language = Kiswahili, 2026-09-20)

Screens captured: Home, CV zangu (empty state), Profile, the CV editor, and the tab bar. Text
quoted is the on-screen text from a `uiautomator` dump of each screen.

| Screen | On-screen text | Verdict |
|---|---|---|
| **Home** | `"Ukaguzi wa ATS"` | **English mechanism in the Swahili UI** — now fixed in source; the running APK still shows it until the next build |
| **Home** | `"AI ya kazi"` | `AI` is a loanword the market keeps; but `AI ya kazi` is ambiguous ("AI of the job" vs "Career AI") — see §5 note below |
| **Home** | `"Miundo 224 kwa kila nyaraka / Miundo halisi na makusanyo ya premium…"` | `premium` — flagged (§5.1) |
| **Home** | `"TEMPLATEHUB"`, `"TemplateHub"` | brand name — not a leak |
| **Profile** | `"SUMAIYA PREMIUM"`, `"Toleo 1.6.24"` | brand + `Toleo` (version) — fine |
| **Profile** | `"English"` / `"Kiswahili"` | language names, correctly in their own language — fine |
| **Profile** | `"HI"` over the name | user's own initials, not a greeting — not a leak |
| **Tab bar** | `Nyumbani · CV zangu · Sumaiya · Pakia · Wasifu` | fully Swahili — no leak |

So **three** English-in-Swahili-UI items were visible on the device, of which one was a real
defect (`ATS`, now fixed), one is flagged (`premium`), and one is a brand string (fine).
Anything below the fold of those screens (a CV-long editor, the jobs feed, the chat) was not
walked to completion — see §7.

### 6.2 In source

| Surface | file:line | What it is |
|---|---|---|
| **Empty-state / share dialogs** | `apps/native/src/services/share.ts:10`, `:26`, `:34`, `:44` | `"Sharing is not available on your device"`, `"Failed to share CV"`, `"PDF preview not available on your device"`, `"Failed to open PDF preview"` — **English only; there is no `sw` string at all**, so a Kiswahili user who taps Share on a device without a share sheet gets raw English. It is a plain module, not a component, so it has no `useLang()`; every other dialog in the app (`cv-list-screen.tsx:55,73,85`, `profile-screen.tsx:92,131,149,160,163,171,190,206`, `career-profile-screen.tsx:35,63`, `application-detail-screen.tsx:77,85,100,126`, `external-link.ts:20`) **is** bilingual. `share.ts` is the one that was missed. |
| **Realtime subscription errors** | `apps/native/src/hooks/use-offline-sync.ts:115` | `` `Failed to sync: ${msg}` `` — English, but the array is **not rendered** anywhere (only read inside the hook), so it is a log, not a user-facing leak. Noted for completeness. |
| **Transactional email** | `apps/web/lib/email.ts:20`, `:47`, `:49`, `:64`, `:66-76`, `:109`, `:130-132`, `:139`, `:150-163` | **All transactional email is English-only** — `<html lang="en">`, `"Manage preferences"`, the welcome email (*"Welcome to Sumaiya…"*, *"Get started in 3 steps:"*, *"Export as a polished PDF and apply with confidence"*) and the follow-up reminder (*"One of your applications has…"*, *"Open my applications"*). There is **no language parameter** on `sendWelcomeEmail` / `sendFollowUpReminder`. The one exception is `sendAiSupportReply` (`:214-228`), which picks a Swahili subject by **regex-detecting Swahili words in the AI's reply text** (`:221`) rather than reading the user's stored preference. Note the follow-ups **push** cron does it correctly — `apps/web/app/api/cron/follow-ups/route.ts:88,110-120` reads `userProfile.lang` and composes the title/body in Swahili — so the product already owns the pattern; email just does not use it. |
| **Legal pages** | `apps/web/app/[locale]/(marketing)/privacy/page.tsx`, `.../terms/page.tsx` | Translation is **partial but present** (each page carries a handful of `sw ?` strings, e.g. `privacy/page.tsx` meta). Not audited line-by-line for completeness — flagged for a follow-up pass, because a legally-binding policy half-translated is worse than an untranslated one. |

### 6.3 One near-miss worth recording (a false accusation avoided)

`apps/web/lib/[locale]/i18n/translations.ts:251` reads `"Sumaiya anaipamba kwa ajili yako"`.
This **is** `"kwa ajili yako"` — correct. An earlier session misread a rendered page title as
`"kwa ajili ya yako"` and reported it as a bug; the source disagreed. It is **not** a defect
and was not touched. (Recorded here because the reflex to "fix" a half-glimpsed Swahili string
is exactly how a non-native audit introduces a new fault.)

---

## 7. Verification, and what could not be verified

### Gates
| app | command | result |
|---|---|---|
| native | `npx tsc --noEmit` | **exit 0**, no errors |
| native | `npx jest` | **1201 passed, 1201 total**, 42 suites |
| web | `npx tsc --noEmit` | **exit 0**, no errors |
| web | `npx vitest run` | **2117 passed, 3 skipped, 3 failed** — the 3 failures are **not from this work** (below) |
| confined | `npx vitest run lib/swahili-lint.test.ts lib/i18n/no-ats-jargon.test.ts lib/i18n/translations.test.ts` | **726 passed, 3 files** |
| confined | `npx jest src/lib/swahili-lint.test.ts` | **366 passed** |

**On the 3 web failures, honestly:** they are `apps/web/components/templates/photo-rendering.test.ts`
(an **untracked, in-progress** test file belonging to a concurrent photo-template workstream,
not to this task). Proof they are not mine: I stashed **every** change under `apps/` (mine and
that workstream's), re-ran just that file on the resulting clean tree, and it still failed —
**4 failed** there, i.e. the concurrent work is mid-flight. My own changed files do not touch
any template or photo rendering.

### Not verified
- **The assistant's own Swahili.** Runtime-generated text (chat replies, AI-written CV lines)
  is not enumerable and was not sampled. This is the largest unmeasured surface in the product.
- **The ATS checker screen on the device** — it requires a CV, and the test account has none
  ("Huna CV bado"), so the `Tayari kwa waajiri` / `Inahitaji kazi` labels could not be read on
  screen. Source-verified only.
- **The web rendering of the changes** — trivial (the only web change is a test file), but the
  Swahili *marketing* pages were audited from source, not rendered.
- **Legal pages in full**, and the **jobs feed / chat / learning hub** on the device beyond
  their empty states.
- **BrighterMonday Tanzania and Fuzu Swahili** — both unreachable (§2 of the standard), so the
  commercial half of the market vocabulary rests on government documents plus two sites.
- **Whether `werevu` is safe to use** — see the standard's §5.3. Only the owner can settle it.
