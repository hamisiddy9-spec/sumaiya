# Sumaiya — Swahili language standard & glossary

**Date:** 2026-09-20
**Status:** PROPOSAL — pending the owner's review. Neither the agent that compiled this nor
the model that helped research it is a native Swahili speaker. The owner is, and he has
already caught two defects that a non-native audit passed at first glance (see
§5). Treat every entry below as **evidence-backed, not ratified**. Where a word carries a
double meaning, this document says so rather than picking silently.

---

## 1. Why this document exists

Two native-speaker corrections in one session, both on strings that read fine to a
non-native writer:

1. **`Mgusiko mmoja, hakuna nywila.`** (sign-in screen) — `mgusiko` is not a Swahili word.
2. **`Omba kwa ujanja`** (the job-apply screen's title, EN "Apply smarter") —
   *"ujanja means tricky in the streets"*. The word a dictionary glosses as
   "cleverness" actually reads as **cunning / trickery**, so a job-application product
   was telling Tanzanians to apply **by trickery**. That is worse than a mistranslation:
   it is insulting and it implies cheating employers.

The second one is the important one, because it is a *class* of error, not a typo: a
non-native writer reaches for a Swahili word whose dictionary gloss matches the English
intent, and ships a word whose live register is loaded, rude or negative. §5 is the
standing defence against that class. Rule: **before adopting a Swahili word, check its
colloquial/street register, not just its dictionary gloss.**

---

## 2. Method, and what could NOT be reached

Market vocabulary was gathered by fetching live Tanzanian sources and quoting them. The
honest limits, stated up front because they affect how much weight this standard can
carry:

| Source | Result |
|---|---|
| **Ajira Portal** — `portal.ajira.go.tz` | A JavaScript-rendered SPA that returns blank content to a fetch. **Its live button text could not be observed.** All Ajira Portal UI-label claims below come from Tanzanian guide sites *describing* the portal, and are marked as such. |
| **Ajira Portal documents** — `ajira.go.tz` PDFs (e.g. the TANESCO interview-call announcement) | **Reachable and quoted.** These are the strongest evidence in this document: official government Swahili, with real connectives and real register. |
| **BrighterMonday Tanzania** — `brightermonday.co.tz` | **Dead.** The domain now 301-redirects to an unrelated business (`tatcafrica.com`); per search results the Tanzania operation ceased around Nov 2020. It could not be surveyed at all. |
| **Fuzu Tanzania** — `fuzu.com/tanzania` | HTTP **403** to automated fetch. Not surveyed. |
| **ZoomTanzania** | The `.com` domain does not resolve; its apparent successor `.net` loads almost entirely in **English**. |
| Wiktionary / kaikki.org (machine-readable Wiktionary dump) | Reachable. Used for the load/register checks in §5, with native-speaker audio on each entry. |
| Peer-reviewed Tanzania scholarship | Reachable (see §5). |
| **Mwananchi** (Tanzania's leading Swahili daily) | Reachable; used as live-journalism evidence of register in §5. |

**Consequence:** the commercial-platform half of "what real jobseekers see" is thin,
because two of the three named platforms are unreachable from here. The government
portal's documents carry the vocabulary load instead. Anyone re-running this should
retry BrighterMonday and Fuzu from a residential connection.

---

## 3. Glossary

Confidence key:
- **high** — seen on 2+ independent sources, at least one of them a major platform or a
  government document.
- **medium** — seen once, or only on a lower-traffic source, or a loanword whose spelling varies.
- **flag** — no source found, or sources disagree. **Do not adopt without the owner's call.**

| Concept | Adopt | Also seen | Source | Confidence |
|---|---|---|---|---|
| CV / resume | **CV** (loanword, kept as-is) | *wasifu*, *wasifu wa ujuzi* | jamiiforums thread "Jinsi ya kuandika CV": *"wasifu wa ujuzi (Curriculum Vitae au maarufu zaidi kama CV)"* — the source itself flags CV as the more popular form. <https://jamiiforums.com/threads/jinsi-ya-kuandika-cv.1978719/> · cvchapchap.com uses "CV" throughout its own prose · mwananchi.co.tz | **high** |
| job / vacancy | **nafasi za kazi** (headings) · **kazi** (in running text) | *ajira* | elimuforum.com page-wide heading *"Nafasi za Kazi"* · ajira.go.tz TANESCO PDF *"kuwapangia vituo vya kazi waombaji kazi watakaofaulu"* · cvchapchap.com *"kazi unayoomba"* · tanzaniatech.one/sw *"Zoom Tanzania ni tovuti ambayo itakupa uwezo wa kupata ajira"* | **high** |
| application (the act) | **maombi** | — | ajira.go.tz TANESCO PDF: *"mfumo wa maombi ya kazi"*, *"Waombaji Kazi wote walioomba kazi"* · elimuforum.com *"Unaweza Kutuma maombi ya Ajira Sasa kupitia Ajira Portal"* | **high** |
| apply (verb / button) | **omba** / **kuomba** · **tuma maombi** | — | tanzaniatech.one/sw: *"Unaweza kuomba nafasi hizo za kazi moja kwa moja"* · elimuforum.com *"Kutuma maombi ya Ajira"* · devinevisiontech.com lists "Tuma maombi" as the Swahili gloss. ⚠️ The same guide reports the *live* Ajira Portal dashboard button is still English **"Apply"** — the button text itself is unverified. | **high** (prose) / button unverified |
| application letter / cover letter | **barua ya maombi (ya kazi)** | *barua ya kikazi* (title-only evidence) | mwananchi.co.tz: *"Barua ya maombi ya kazi ni muonekano wako wa kwanza kwa mwajiri wako mtarajiwa"* · cvchapchap.com heading *"Kuandika Barua ya Maombi"* | **high** |
| employer | **mwajiri** | — (English "employer" never appeared inside Swahili text) | ajira.go.tz TANESCO PDF: *"MWAJIRI: TANZANIA ELECTRIC SUPPLY COMPANY LIMITED (TANESCO)"* · mwananchi.co.tz *"mwajiri wako mtarajiwa"* · cvchapchap.com · jamiiforums.com | **high** |
| interview | **usaili** (formal / the whole process) · **mahojiano** (the interview session itself) | — | ajira.go.tz TANESCO PDF title *"TANGAZO LA KUITWA KWENYE USAILI"*; body *"TAREHE YA USAILI WA MAHOJIANO: 23 JUNI, 2020"* — both words on one document, with that distinction. Repeated across many independent government postings on ajira.go.tz. | **high** (usaili) / **medium** (mahojiano) |
| salary | **mshahara** · *kiwango cha mshahara* (scale) | — | jamiiforums.com salary thread: *"vifuatavyo ni baadhi ya viwango vya mshahara kabla ya makato (gross) na unachokipokea mkononi"* | **high** |
| skills | **ujuzi** | — ("stadi" and English "skills" not seen in use) | cvchapchap.com: *"Ongeza elimu na ujuzi"*, *"ujuzi unaolingana na mahitaji ya kazi"* · jamiiforums.com *"una ujuzi zaidi ya kufanya kazi"* | **high** |
| experience | **uzoefu** / **uzoefu wa kazi** | *tajriba* (banned — see the repo lint) | cvchapchap.com *"Eleza uzoefu kwa matokeo"*, *"Mwalimu mwenye uzoefu wa miaka [X]"* · mwananchi.co.tz *"uzoefu wa kazi"* | **high** |
| deadline / closing date | **tarehe ya mwisho** · **mwisho wa kutuma maombi** | *tarehe za kufunga* | ajirazetu.com indexed post titles: *"…mwisho-wa-kutuma-maombi-tar-25-juni-2015"* · devinevisiontech.com *"tarehe za kufunga"*. ⚠️ The strongest single quote ("Mwisho wa kutuma maombi ya kazi ni tarehe 22 Agosti, 2025") came via a search summary, not a direct fetch. | **medium-high** |
| download | **pakua** | — | devinevisiontech.com (Ajira Portal guide) lists *"Pakua"* as the download term, directly fetched. Only one directly-verified source. ⚠️ Easily confused with **pakia** = *upload* — the pair is a real hazard; cvchapchap.com's upload page is "kupakia CV". | **medium** |
| sign up / register | **jisajili** | — | devinevisiontech.com section heading *"Hatua za kujisajili na kupakia CV"* (directly fetched). A second candidate source (orodhaforum.com) now redirects twice into an unrelated US site, so it is **not** counted. | **medium** |
| share | ⚠️ **no term adopted** | *-sambaza / kusambaza* (editorial only) | No share-button label was found on any reachable Tanzanian job platform. The only related evidence is editorial: ukomboz.blogspot.com *"Tangazo la nafasi za kazi linalosambaa katika baadhi ya mitandao ya kijamii ikiwemo 'Facebook na WhatsApp'"* — describing a rumour spreading, not a UI action. | **flag** |
| notification / alert | **arifa** | — | Swahili technical/UI usage; the product already ships "ARIFA ZA SIMU" on the Profile screen (on-device, 2026-09-20) | **medium** |
| password | **nenosiri** (adopt for consistency) · **nywila** is equally real | both | Wiktionary: *nywila* class IX, "password", **synonym: nenosiri** — <https://en.wiktionary.org/wiki/nywila> · kaikki mirror with native audio: <https://kaikki.org/dictionary/Swahili/meaning/n/ny/nywila.html> · proz.com's Swahili login UI uses **"Nywila"**, while *nenosiri* is used in the same page's help text: <https://swa.proz.com/consent-settings> | **medium** — both correct; pick one and keep it |

### 3.1 Loanwords the market keeps in English inside Swahili sentences

This is the licence the product needs, and it is exactly what the market does — so an
English word in Swahili copy is not automatically a defect. Evidence:

- **"CV"** — never displaced by *wasifu* on any source; the more popular form by the
  sources' own account (jamiiforums thread above).
- **"gross"** — jamiiforums.com: *"mshahara kabla ya makato (gross)"*.
- **"PDF"** — devinevisiontech.com: a file-format instruction (*"PDF tu"*).
- **"Submit"** — cvchapchap.com offers English *"Submit"* alongside Swahili *"Tuma"* as equals.
- **"Testimonials", "Provisional Results", "Statement of results"** — kept in English
  *inside* a formal government PDF (ajira.go.tz, TANESCO usaili announcement):
  *"Wasailiwa watakaowasilisha 'Testimonials', 'Provisional Results', 'Statement of
  results' … HAVITAKUBALIWA…"*.
- **"WhatsApp" / "Facebook"** — proper nouns inside Swahili sentences (ukomboz.blogspot.com).
- Government PDFs sometimes gloss the other way round: *"Barakoa (Mask)"* — Swahili first,
  English in parentheses.

**So the rule is not "no English word".** It is: the *Swahili* sentence must stand without
the English word's meaning being carried by the reader's English. `link`, `premium`,
`score` as bare nouns fail that test when a real Swahili word exists and is already in use
(*kiungo*, *hali ya juu*, *alama*). `CV`, `PDF`, `M-Pesa`, `WhatsApp`, `VETA`, `Excel`,
`LinkedIn` pass it.

---

## 4. Register: neutral, second person, plain imperatives

**What the sources actually sound like:**

- **Ajira Portal / ajira.go.tz — FORMAL / LEGAL.** From the TANESCO interview announcement:
  > *"Katibu wa Sekretarieti ya Ajira katika Utumishi wa Umma kwa niaba ya Shirika la Umeme
  > Tanzania (TANESCO) anapenda kuwataarifu Waombaji Kazi wote walioomba kazi kuwa usaili
  > unatarajiwa kuendeshwa kuanzia tarehe 20 hadi 23 Juni, 2020…"*
  and
  > *"Waombaji kazi ambao majina yao hayakuonekana katika tangazo hili watambue kuwa
  > hawakukidhi vigezo."*

  Official letterhead (*"JAMHURI YA MUUNGANO WA TANZANIA / OFISI YA RAIS / SEKRETARIETI YA
  AJIRA KATIKA UTUMISHI WA UMMA"*), numbered Roman clauses, third-person bureaucratic
  phrasing. This is a *letter*, not an interface.
- **BrighterMonday / Fuzu register: NOT VERIFIABLE** — both unreachable (§2). Any claim
  that they "read younger" would be a guess, so no such claim is made here.
- **Live street register** is a third thing again, and it is documented as its own
  phenomenon: *lugha ya mitaani* / *Kiswahili cha mtaani*, a register that deliberately
  deviates from standard Swahili and is *"used very much by youths in the city"*, with
  speakers who *"avoid its use in formal contexts"* (SWAHILI FORUM 13, §3.1 —
  <https://ul.qucosa.de/api/qucosa%3A11509/attachment/ATT-0/>). This is the register
  `ujanja` lives in.

**Recommendation for Sumaiya: NEUTRAL — between those, leaning to the simplest end.**

| Do | Don't |
|---|---|
| Second person, plain imperative: **Bandika**, **Pakua**, **Ingia**, **Hifadhi**, **Chagua** | Government/legal voice: *"anapenda kuwataarifu Waombaji Kazi wote…"* — the user is not a form |
| Ordinary everyday words a form-IV leaver reads without effort | Street register (*lugha ya mitaani*) — it dates fast, it is regional, and it is where loaded words hide |
| Name the object: *"kiungo cha ajira"*, *"barua ya maombi"* | Bare anaphors and cleverness metaphors |
| Reuse the market's own words from §3 | Coin new Swahili for a mechanism (the product's own rule: sell the outcome, never the mechanism) |

Why neutral and not the market's conversational extreme: the reader is a Tanzanian
jobseeker on a phone, often reading Swahili as a **second language**, on expensive mobile
data. Clarity beats cleverness, and a word with a second meaning (or a regional slang
sense) costs the reader more than a plain word costs in elegance. The owner's own standing
instruction to this project is the same note: *"use the simplest of words and actions."*

### 4.1 Voice: whose things are whose — the `zako` / `zangu` convention

**Status: CONVENTION, decided 2026-09-20.** The owner asked for one voice in the
chrome; this is the one, with the measurement behind it. It is a *voice* rule,
not a grammar rule — see the note at the end of this section before "correcting"
anything against it.

**The rule.**

> The product's chrome names the user's own things in the **second person**:
> `CV zako`, `wasifu wako`, `maombi yako`, `akaunti yako`, `picha zako`,
> `nyaraka zako`, `kazi yako`. The **first person** is reserved for the user's own
> words and for the assistant speaking about *herself* — never for the product
> describing the user's objects.

Two speakers exist in this product, and the distinction is between them, not
between "polite" and "friendly":

| Speaker | First person | Second person |
|---|---|---|
| **The product** — every tab, heading, button, label, empty state, dialog, score band, error | never, about the user's objects | always: *"CV zako"*, *"Huna CV bado"*, *"Pakia CV"*, *"Kagua CV yako"* |
| **Sumaiya** — the assistant, when the sentence is hers | about **herself**: *"nimeandaa CV yako"* (I have prepared your CV), *"Ongea nami"* (talk to me), *"niandikie"* (write for me) | still, about the user's objects: *"nimeandaa **CV yako**"* — she does **not** say *"CV yangu"* for someone else's CV |

**First person on the user's own object is correct in exactly four places.**
Anything else is the defect. (These four are also the allow-list in the lint —
each entry carries its reason; see §7.)

| # | Where | Example |
|---|---|---|
| 1 | **What the user says** — a message they send, a prompt they type or tap | *"Nisaidie kutengeneza CV yangu."* · *"Niulize maswali 6 … na upe alama majibu yangu."* |
| 2 | **What the user consents to** — the affirmative control of a confirm dialog | *"Ndiyo, futa akaunti yangu"* (EN: *"Yes, delete my account"* — the English slot does the same) |
| 3 | **What the user asks** — an FAQ entry phrased as the user's question, a question chip | *"Ninawezaje kufuta akaunti yangu?"* (EN: *"How do I delete my account?"*) |
| 4 | **What the user authors or sends** — a letter body, a share message, an invite, a document title they carry | *"… jinsi ujuzi na uzoefu wangu unavyolingana …"* · *"Natumia Sumaiya kutengeneza CV yangu …"* · *"Barua yangu ya maombi — Sumaiya"* |

**Examples of the defect and its fix** (all applied 2026-09-20, both apps):

| Surface | Was (first person) | Now (second person) | Why |
|---|---|---|---|
| Home tile → CV screen heading | `CV zako` … `CV zangu` | `CV zako` … `CV zako` | the observed defect: the tile and the screen it opens disagreed |
| Tab bar (`CVsTab`) | `CV zangu` | `CV zako` | chrome |
| Home tile a11y label | `Ona CV zangu` | `Ona CV zako` | chrome |
| Save-to-library control | `Hifadhi kwenye CV zangu` | `Hifadhi kwenye CV zako` | chrome |
| Web dashboard tab + heading | `CV Zangu` | `CV zako` | chrome, and the same object as the tab above |
| Web nav / footer / AI-tool tile | `Kagua ATS` | `Kagua CV` | chrome, and §6 rule 5 (never name the mechanism) |
| Lesson CTA | `Fungua CV zangu` | `Fungua CV zako` | chrome |
| Chat screen button | `Tengeneza CV yangu kutoka mazungumzo haya` | `Tengeneza CV yako …` | a control the product renders, not a message the user sends |
| Shared-card default title | `CV yangu lengwa` | `CV iliyolengwa` | the card belongs to the sender, not to the reader — naming the object with no owner was the honest fix |

**Why the second person and not "my" everywhere** (the alternative was seriously
considered, and this is the evidence that decided it):

- Measured at HEAD `1fc5bfa` across native `screens/ components/ lib/
  navigation/` and web `lib/ components/ app/ lib/i18n/`: **407 second-person
  occurrences against 83 first-person** (~4.9:1). After the 2026-09-20 fixes the
  same sweep reads **456 against 31** (~14.7:1), the 31 being the four legitimate
  classes above. Full table in `docs/SWAHILI-AUDIT-2026-09-20.md` §8.
- The 83 first-person occurrences were not one voice: they were (a) the four
  legitimate classes, and (b) a family of CTAs mirrored word-for-word from their
  English twins — EN *"Build my CV"* → SW *"Tengeneza CV yangu"*, EN *"Tailor my
  CV"* → *"Lenga CV yangu"*. That is translation drift, not a Swahili voice
  decision: the product's own natively-written Swahili (empty states, privacy,
  the dashboard prose, the mail copy) is second person, and the assistant uses
  the second person for the user's objects as well.
- Going the other way would have meant rewriting 407 strings to match a
  translation of English marketing copy, and it would have broken the assistant
  convention *"nimeandaa CV yako"*. So the first-person strings were the drift,
  not the house style.

**Flagged for the owner (not changed):** English chrome keeps the idiomatic
*"My CVs"* for a library destination, so the English and Swahili slots of the
same pair are now deliberately different in person (EN *"Build my CV"* / SW
*"Tengeneza CV yako"*). English is a separate convention and the owner's call; if
he wants the English aligned too, the direction the audit supports is the same
(second person) and it is one pass over the same file list.

**Do not "fix" grammar against this rule.** Swahili noun-class agreement makes
both forms correct for these nouns: `CV` is a borrowed noun taking `zi-`
agreement, so `CV zako` and `CV zangu` are *both* grammatical, and `wasifu` (u-)
takes `wako`/`wangu`. The fault was never agreement — it was the same user object
being named in two different voices on two different screens. A grammar checker
cannot see it; only a per-noun voice check can (§7).

---

## 5. Words to avoid — loaded street register

The `ujanja` class. For each word: what a dictionary says, what the street does with it,
and the evidence. **This table is the deliverable of correction #2** — no future writer
should have to rediscover it.

### 5.1 The word that shipped

**`ujanja`** — used in `apps/native/src/screens/job-apply-screen.tsx` as the Swahili title
for **"Apply smarter"**: `Omba kwa ujanja` (fixed 2026-09-20, see
`docs/SWAHILI-AUDIT-2026-09-20.md`).

| Evidence | What it says |
|---|---|
| Wiktionary / kaikki (native audio) | gloss 1 **"cunning"**, gloss 2 **"craftiness"** — <https://en.wiktionary.org/wiki/ujanja> · <https://kaikki.org/dictionary/Swahili/meaning/u/uj/ujanja.html> |
| Peer-reviewed, Tanzania fieldwork — Vavrus, *"More clever than the devil: ujanja as schooling strategy in Tanzania"* | *"analyzes the Swahili term ujanja, which combines cleverness, opportunism, **and deception**"* — <https://doi.org/10.1080/09518398.2013.847508> · also <https://eric.ed.gov/?id=EJ1044743> |
| The same paper, footnote 2 — a **Tanzanian native speaker** reviewing the author's draft | *"Amina … suggested I use the term **mwerevu**, which means clever, sharp, or smart, because it has a more positive connotation than mjanja. She noted that in some contexts, **mjanja can mean mlaghai – a cheat or a liar**"* |
| **Mwananchi** (Tanzania's leading Swahili daily), investigation headline | *"MAKALA YA UCHUNGUZI: … Habari yetu ya uchunguzi wa **ujanja** wa waganga kufilisi watu wenye hamu ya kupata utajiri na ajira…"* — `ujanja` used of witchdoctors fleecing people. <https://www.mwananchi.co.tz/mw/habari/makala/makala-ya-uchunguzi-waganga-wanavyowafilisi-wanaosaka-utajiri-bahati-4--2826400> |
| islamquest.net/sw (Swahili religious reference) | *"Lakini neno hilo kwa wakati mwengine humaanisha **kufanya ujanja na udanganyifu**"* — "doing ujanja **and deception**". <https://islamquest.net/sw/archive/fa297> |
| DOAJ — *African Imaginations of Moral Economy* | groups `ujanja` with *utani, chama, ujamaa* as a moral-economic concept carrying "wit **and cunning**" — <https://doaj.org/article/e89193455f4b41ba8f3c524065c0cac2> |
| **Owner (native speaker), 2026-09-20** | *"omba kwa ujanja is not right — ujanja means tricky in the streets"* |

Five independent sources, two of them native Swahili speakers, agree: **`ujanja` is
cunning/trickery, not intelligence.**

### 5.2 The avoid table

| Avoid | Dictionary says | Street actually means | Loaded? | Evidence | Use instead |
|---|---|---|---|---|---|
| **ujanja** | cunning, craftiness | trickery, being sneaky | **YES — banned** | Wiktionary/kaikki; Vavrus 2015 (*"cleverness, opportunism, and deception"*); Mwananchi investigation; islamquest (*"ujanja na udanganyifu"*); owner | name the outcome — *"Omba vyema"*, *"Tuma maombi yaliyolengwa"* |
| **mjanja / wajanja** | a cunning / shrewd person; a crafty person | a cheat, a hustler; per native speaker *"can mean mlaghai – a cheat or a liar"* | **YES — banned** | <https://en.wiktionary.org/wiki/mjanja> · Vavrus 2015 footnote 2 | *mwerevu* is the native-recommended positive alternative, but see 5.3 |
| **janja** | cunning, sly, crafty | same root as above | **YES — banned** | <https://en.wiktionary.org/wiki/janja> | — |
| **hila** | deceit, trick | cheating, a dodge | **YES** | <https://kaikki.org/dictionary/Swahili/meaning/h/hi/hila.html> | — |
| **ghiliba** | (of *-ghilibu*: to deceive, swindle, betray) | deception, a swindle | **YES** | <https://kaikki.org/dictionary/Swahili/meaning/g/gh/ghiliba.html> | — |
| **danganya / danganyifu** | to cheat, to deceive | same — plainly negative | **YES** | <https://kaikki.org/dictionary/Swahili/meaning/d/da/danganya.html> | — |
| **chakachua / kuchakachua** | to siphon petrol; to embezzle | rigging, doctoring results | **YES — do not use for "process a PDF"** | <https://kaikki.org/dictionary/Swahili/meaning/c/ch/chakachua.html> | for PDFs use **chakata / kuchakata** (the product already says *"zinachakatwa kwa usalama"*) |
| **kiburi** | arrogance, conceit, pride | arrogance, looking down on people | **YES** | <https://kaikki.org/dictionary/Swahili/meaning/k/ki/kiburi.html> | — |
| **uchoyo** | stinginess, miserliness | tight-fistedness — insulting about a person | **YES** | <https://kaikki.org/dictionary/Swahili/meaning/u/uc/uchoyo.html> | — |
| **mkorofi** | troublemaker, bully | troublemaker | **YES** | <https://kaikki.org/dictionary/Swahili/meaning/m/mk/mkorofi.html> | — |
| **kero** | annoyance, nuisance | something that irritates you | **YES** | <https://kaikki.org/dictionary/Swahili/meaning/k/ke/kero.html> | — |
| **ubabe** | (of *babe*: bully/strongman) | thuggery, throwing your weight around | **YES** (not in the product; recorded so nobody adds it) | no single dictionary page loaded; treat as banned alongside *mkorofi* | — |
| **kali** *(as a compliment)* | sharp, fierce, **acidic**, intense | harsh, tough, dangerous; "kali" also colloquially means strong/intense | **CAUTION** | <https://kaikki.org/dictionary/Swahili/meaning/k/ka/kali.html> — the glosses include "fierce" and "acidic". Describing a CV template as *"Kali kwa ATS"* ("fierce toward the ATS") was meaningless at best | describe the property: *"Inasomwa na mashine"* |
| **ujanja ujanja / janjajanja** | — | intensified trickery | **YES** | follows from *ujanja* | — |
| **kupiga chenga** | to dodge, to sidestep | to give someone the runaround / evade | **YES** — never use for "follow up" or "be resourceful" | no dictionary page loaded; treat as banned alongside *hila* | *fuatilia kwa heshima* |
| **werevu / mwerevu** | intelligence, cunning (*mwerevu*: a clever person) | the native speaker in Vavrus 2015 **recommended it as the positive alternative to mjanja** | **CAUTION — see 5.3** | <https://kaikki.org/dictionary/Swahili/meaning/w/we/werevu.html> · <https://kaikki.org/dictionary/Swahili/meaning/m/mw/mwerevu.html> | the owner's call. Not adopted here. |

### 5.3 Why this document does NOT adopt `werevu` on its own authority

`werevu` is the only candidate with a *native-speaker* endorsement inside a source — Amina's
note in Vavrus 2015 that *mwerevu* "means clever, sharp, or smart" and is "more positive
than *mjanja*". But the **same dictionary** glosses `werevu` as *"intelligence, **cunning**"*,
and derives it from `-erevu` = *"clever, **cunning**"*. So the dictionary still carries the
cunning sense, and only a native ear can say where the line falls in practice.

Therefore the replacement applied on 2026-09-20 was **`Omba vyema`** ("place your
application well"), which carries no second meaning at all, and `werevu` is put in front of
the owner as a candidate he may prefer. **This is exactly the failure mode this document
exists to prevent** — a non-native writer picking the cleverer-sounding option.

---

## 6. Rules for future writers

1. **Check the street register before adopting a word.** A dictionary gloss is necessary,
   not sufficient. Ask: what else does this word do in Dar es Salaam? If you cannot find
   a live source (news, forum, job board) using it in the sense you intend, flag it.
2. **One word, one meaning.** Prefer the word with no second sense. `vyema` over `ujanja`;
   plain imperative over a metaphor.
3. **The market's own words beat invented ones.** §3 is the licence: *nafasi za kazi*,
   *maombi*, *mwajiri*, *usaili*, *uzoefu*, *ujuzi*, *mshahara*, *pakua*, *jisajili*.
4. **Loanwords are allowed where the market keeps them** (`CV`, `PDF`, `M-Pesa`, `VETA`,
   `WhatsApp`, `Excel`, `LinkedIn`) and not where a live Swahili word already exists in the
   product (`link` → `kiungo`, `premium` → *hali ya juu* where it is descriptive).
5. **Never name the mechanism in Swahili.** Say *mifumo ya kuajiri* / *vichujio vya waajiri* /
   *kikagua CV*, never ATS. English copy may keep "ATS". (Two SEO `keywords:` arrays keep the
   literal *"alama ya ATS"* deliberately — that is the query a Swahili speaker actually
   types, and it is line-excluded in `apps/web/lib/swahili-lint.test.ts`.)
6. **`pakia` ≠ `pakua`.** Upload vs download. Check every instance.
7. **A label must be readable standalone and name its object** (`kiungo cha ajira`, not
   *"kiungo"*; *"barua ya maombi"*, not *"barua"*).
8. **The owner decides.** This document ranks options and cites sources; it does not
   overrule a native speaker's ear.
9. **One noun, one voice** (§4.1). The product names the user's own things in the second
   person (`CV zako`, `wasifu wako`, `akaunti yako`); the first person belongs to the
   assistant speaking about herself and to sentences that are genuinely the user's — their
   own message, their own consent, their own question, their own authored or shared text.
   Never `CV zangu` in chrome while `CV zako` sits on the tile next to it. Do not "fix"
   the agreement instead: both forms are grammatical, so this is a voice fault and only a
   voice check can catch it.

---

## 7. Enforcement

| Guard | File | Covers |
|---|---|---|
| Swahili copy lint (web) | `apps/web/lib/swahili-lint.test.ts` | kwa/wa agreement, plural-with-one, calques, `tajriba`, `barua ya kazi`, `Wathibitishaji`/`Marejeo`, malformed verbs, bare `Hakiki`, **ATS in Swahili**, **loaded street words (ujanja/mjanja/janja)**, **fabricated `mgusiko`**, **`link ya`**, **voice agreement on the user's own objects** (§4.1) |
| Swahili copy lint (native) | `apps/native/src/lib/swahili-lint.test.ts` | the native mirror. Until 2026-09-20 it carried the calques only, which is why 15 ATS strings shipped in the native UI; it now carries the four guards added that session plus the **voice-agreement guard** |
| No ATS jargon in the Swahili tree | `apps/web/lib/i18n/no-ats-jargon.test.ts` | walks the whole `translations.sw` string tree |

### 7.1 The voice guard, and why it is per noun

`voice agreement on the user's own objects` runs in **both** lints. It scans every
non-test source file in its tree, finds `<noun> <possessive>` for the user's own objects
(`CV`, `wasifu`, `maombi`, `kazi`, `akaunti`, `nyaraka`, `picha`, `barua`, `ujuzi`,
`uzoefu`, `taarifa`, `alama`, `jina`, `simu`, `kiungo`, `nafasi`, …), classifies each as
first or second person, and **fails when the same noun appears in both** — the exact shape
of the shipped defect, where `CV zako` and `CV zangu` are each fine alone.

It is a real assertion with a small tolerance, not a blanket ban:

- first-person copy is **allowed** — it is not the thing being banned;
- a **bounded, explicit exemption list** (`FIRST_PERSON_EXEMPT`, capped by
  `MAX_FIRST_PERSON_EXEMPT = 20` per app) tolerates the four legitimate classes of §4.1,
  each entry carrying the reason it exists;
- every exemption must still **match a live occurrence** — a stale or aspirational entry
  fails the suite, so the list cannot be padded;
- the exempted first-person occurrences must stay **under 15%** of all possessive
  occurrences, so the list cannot be grown into a blanket ban;
- a **corpus sanity check** fails if the scan ever finds too few occurrences, so a broken
  regex cannot silently pass.

Every guard added on 2026-09-20 shipped with `bad`/`good` samples so it is proven both ways
in the same run, and the voice guard was additionally watched **failing** on a re-introduced
`CV zangu` before being accepted.
