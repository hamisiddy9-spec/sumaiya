# Sumaiya — UX & copy defect hunt (2026-09-20)

**Deliverable of a READ-ONLY hunt.** No source file was edited, staged, reverted or deleted. One
markdown document plus one temp file (`%LOCALAPPDATA%\Temp\swahili-pass-out.md`, the raw Claude CLI
output) were created. The uncommitted motion workstream in this tree was left untouched, nothing was
staged with `git add -A`, and no build was run.

## Snapshot — and why the line numbers must be treated as a hint, not a fact

| | |
|---|---|
| Repo | `C:\Users\hamis\projects\sumaiya` |
| Branch | `release/1.6.25` |
| HEAD when the findings were locked | **`97fa706`** (`docs: themed pairs …`) — HEAD MOVED during the hunt: it was `7fc8a05` at 18:47 and `97fa706` at 20:50 |
| Working tree | 55 uncommitted entries from the motion workstream (was 58 at 18:47 — the tree is being written to **while this hunt ran**) |
| Lines verified | 20:56 EAT, by `grep -n -F "<string>"` against the working tree |
| Git remote pushes | not attempted by this hunt |

**A peer agent is committing into this tree right now.** `apps/native/src/screens/cv-editor-screen.tsx`
changed under me mid-hunt (`"Kichwa cha kazi"` moved 562 → 570 in ~10 minutes).
**Therefore: the quoted STRING is the authoritative handle, not the line number.** Every finding below
prints the exact current string; re-grep it before editing. A line number that is off by ten is a
stale coordinate, not a contradiction.

Severity key — **S1** breaks trust or makes the product lie; **S2** wrong, confusing or inconsistent
for a real user; **S3** real but smaller (polish, tone, consistency, a11y labelling).

---

## 1. What I could NOT check — read this before trusting the list

1. **Nothing was driven on the phone.** The Pixel 8 Pro (`10.229.114.105:5555`) was not touched. No
   screenshot, no `uiautomator` dump, no OCR, no measured frame timings, no large-font run, no
   TalkBack run. I did not build an APK: this task is read-only, and two gradle runs on one `build/`
   dir already collided in this tree today.
2. **The installed APK is stale, and that matters for every defect the owner reported from it.** The
   APK on the phone was built at 10:12 today; four copy commits and 36 native files have landed since
   (`c489a22`, `cb29d9f`, `cba644f`, `c73992a`). Anything he saw may already be fixed in source — §2
   lists what I checked and found already correct.
3. **Gallery stutter (F14) is a structural reading, not a measurement.** I read the render path and
   say what it implies; I cannot say how many milliseconds it costs on his phone.
4. **No live-web comparison.** I did not fetch `https://sumaiya.app` to compare deployed strings to
   the tree. Every web claim below is a **source** claim. If a web string looks already fixed, check
   the deploy before editing source again.
5. **No database read.** The applications-store divergence (F44) is proven at source level (no sync
   path exists) but I did not query rows to observe it in one account's data.
6. **I did not run the lints or the test suite** (`npx jest src/lib/swahili-lint.test.ts`). So I cannot
   say whether the guards currently pass, and I have not claimed any string is lint-covered. One
   related negative result I *did* establish by reading the lint file: **there is no guard for the
   `i-`/`ina-` machine register** (`apps/native/src/lib/swahili-lint.test.ts` guards calques,
   `ujanja`/`mjanja`, `mgusiko`, `link ya`, ATS-in-Swahili and voice agreement only) — which is why
   F49 has twenty live instances.
7. **F29 (`Nafasi kwako`) provenance is unconfirmed.** I can see the owner's recorded wording decision
   and the current string; I cannot see why they diverged. Reported as a divergence to confirm, not as
   a defect to fix blind.
8. **a11y findings (F4, F19, F20, F21, F5) are source readings**, not observed screen-reader output.

---

## 2. Already correct — do not "fix" these (dropped candidates, with evidence)

Each of these looks like a defect from a quick read and is not one. Listing them is the point: a
findings list containing fixed items sends the fixer to work that is done.

| # | Candidate | Verdict and evidence |
|---|---|---|
| A1 | `omba kwa ujanja` ("apply by trickery") | **Gone.** `job-apply-screen.tsx:235` = `t("Apply smarter", "Omba vyema")`. Confirmed, as the brief said. |
| A2 | ATS named in Swahili | **Clean on the surfaces I read.** Home tile `t("ATS check", "Ukaguzi wa CV")` (`home-screen.tsx:276`), CV editor button `t("ATS", "Kagua CV")` (`cv-editor-screen.tsx:505`), CV-check title `t("ATS check", "Ukaguzi wa CV")` (`ats-checker-screen.tsx:123`), body says `"sawa na mifumo halisi ya kuajiri"` (`:207`). English keeps "ATS" (allowed). |
| A3 | Home's hardcoded **"224 designs"** is an unverified claim | **It is true.** `registry-sync.test.ts:95-96` asserts `Object.keys(TEMPLATE_REGISTRY)).toHaveLength(218)` **and** `ENGINE_TEMPLATES).toHaveLength(218)`; `CV_TEMPLATES` has 6 (`cv-html.ts:34-41`) → `ALL_TEMPLATES.length === 224`. The claim is computed elsewhere (`first-run-screen.tsx:478`) and hardcoded here — same number. |
| A4 | Denying the camera permission strands the user | **It does not.** `scan-screen.tsx:95-119` offers *Allow camera* when `canAskAgain`, *Open Settings* when it cannot, **and** a secondary *Choose from gallery* fallback. Best-in-class of the permission gates here. |
| A5 | Notifications permission is requested before the screen that needs it | **No.** `push.ts:62-64` only *reads* permission (`getPermissionsAsync`) and returns early; the only requester is the Profile toggle (`profile-screen.tsx:81`). Nothing is requested at launch. (The toggle's *effect* is a separate finding — F6.) |
| A6 | Learning Hub's `Premium` guide marker is cosmetic | **It is not cosmetic — the wall is inside the guide.** `guide-screen.tsx:18` `const walled = !!guide && guide.tier === "premium" && !premium`, with the paywall rendered at `:69-77`. Tapping through is correct. |
| A7 | A `PAID / INALIPWA` badge ships in the Learning Hub, breaking the owner's "no paid courses" rule | **It cannot render.** `learning-hub-screen.tsx:325` filters `catalogue.filter((r) => r.free && …)`, and `courses.ts` has **14 `free: true` / 0 `free: false`**. The `t("PAID","INALIPWA")` branch at `:555` is dead code. The rule holds. (Worth tightening so a future edit cannot resurrect it — S3, not a defect.) |
| A8 | Strings that exist in one language only | **Not found in the content modules.** `en`/`sw` counts are equal in `courses.ts` (69/69, whyEn 15/whySw 15), `guides.ts` (60/60), `career-fields.ts` (25/25), `template-suggestions.ts` (40/40), `cv-html.ts` (12/12), `attach-sheet.tsx` (5/5); `web/lib/i18n/translations.ts` has **0** empty `sw` values. The one-language gap I did find is page metadata (F47). |
| A9 | `Dashibodi` survived the owner's rename to `Nyumbani` | **Correctly scoped.** `"Nyumbani"` is applied everywhere the product names its landing page (`translations.ts:155`, both tab bars, marketing nav, all error CTAs). `Dashibodi` survives only as a *course topic* — `courses.ts:252-256` `{ en: "Dashboards", sw: "Dashibodi" }` with a comment giving the reason. Legitimate reuse, not a regression. |
| A10 | The gallery's schematic thumbnail is a cheat that lies about the design | **Defensible by design and documented.** `TemplateThumb` draws the layout *family* (6 bespoke sketches, 218 by family), `RealTemplateThumb` overlays the real render and the schematic is the instant placeholder underneath — so a grid never flashes empty. |
| A11 | External links leave the app with no warning | **Fixed on native.** `lib/external-link.ts` `confirmAndOpenUrl` (`t("Leave the app?","Ondoka kwenye app?")`) is used by the jobs feed (`jobs-screen.tsx:113`), the learning hub (`:556`) and elsewhere. **Not fixed on web** — that is F34. |
| A12 | Onboarding asks for something twice / asks before the screen that needs it | **Two-stage onboarding is coherent.** `onboarding-screen.tsx` asks only for the **language** (a 2-button choice, nothing else), then 4 slides; `first-run-screen.tsx` asks name→photo→field→experience→skills→recent→look, and **skips the name step entirely when the account already has a real one** (`:146-149`), with a deliberately careful junk-name guard (`:90-100`) that no longer discards short real names like "Ali". No duplicate ask found. |

---

## 3. Findings

### 3.1 Onboarding and permissions

**F1 — S2 — `apps/native/src/screens/first-run-screen.tsx:492`** *(the fabricated-word class the owner already killed once)*
```
sw: "Migusiko sita mifupi ili nianze kukufahamu — bila kuandika historia yote.",
```
`mgusiko` is not a Swahili word. The noun is **`mguso`** (pl. `miguso`). This is the *same* fabrication
the owner rejected on the sign-in screen and that `docs/SWAHILI-STANDARD-2026-09-20.md` §1 records as
correction #1 — it survived on a different screen. Claude: **WRONG** → *"Miguso sita mifupi…"*.
**Hurts:** every brand-new user, on the first screen after picking a language, before any value is
delivered. It is the product's first Swahili sentence. *(The count "sita" is arithmetically fine:
`slots = STEPS.length - 1 = 6`.)*

**F2 — S3 — `first-run-screen.tsx:313`**
```
dialog.alert(t("Couldn't use that photo", "Imeshindwa kutumia picha hiyo"), t("Try a different one — or skip this for now.", "Jaribu nyingine — au ruka kwa sasa."))
```
A failure line is a sentence **she says**, so it takes `ni-`: *"Sikuweza kutumia picha hiyo."*
`Imeshindwa…` is the `i-` machine register. Claude: **WRONG**. **Hurts:** a first-time user at their
first moment of friction, being spoken to by a machine instead of the product's voice.

**F3 — S2 — `first-run-screen.tsx:421-422`** *(wrong-country placeholder, and the pair disagrees)*
```
en: "Storekeeper at Brookside, 2021–2024. Ran stock, GRNs and a team of 4.",
sw: "Karani wa Duka, Brookside, 2021–2024. Nilisimamia bidhaa, GRN na timu ya watu 4.",
```
Three problems: **Brookside** is a Kenyan dairy brand in a Tanzania-first product (the hero badge
reads "For job seekers in Tanzania"); the roles are not the same job (EN *Storekeeper* = a store's
stock keeper, SW *Karani wa Duka* = a **shop clerk**); and the pair changes person (EN third-person
job title, SW first-person `Nilisimamia`). A placeholder is what a tired user copies verbatim.
Claude: **OK** on the Swahili (a placeholder is the user's own authored line, which §4.1 permits in
the first person) — so the fault is the content, not the grammar. **Hurts:** a first-time jobseeker
with no CV history, who will save "Brookside" as their employment.

**F4 — S2 — `first-run-screen.tsx:59-80` (`Chip`) and `:406-411` (the "+" button)**
```
<Pressable onPress={…} style={…}>            // no accessibilityRole, no accessibilityState
```
The field and skill chips are `Pressable`s with **no `accessibilityRole="button"` and no
`accessibilityState={{ selected }}`**, and the 46×46 "+" (the only way to add a skill that is not
suggested) has no label or role at all. `canNext` gates the Continue button on a selection
(`:218-221`), so a TalkBack user cannot tell that a chip is a button, cannot tell whether it is
selected, and must guess when Continue will enable. **Hurts:** screen-reader users, on the two steps
that are mandatory to finish onboarding.

**F5 — S3 — `first-run-screen.tsx:532-543` and `onboarding-screen.tsx:368-375`** — the `Skip`/`Ruka`
control is 13.5–14pt text with `hitSlop={10}` and (on onboarding) 8px vertical padding → roughly
**38–40 px** of touch height. That passes WCAG 2.5.8's 24 px floor but sits below the 48 dp platform
convention, on a control whose whole job is to be easy to hit. Cheap to fix with padding.

### 3.2 The Profile screen

**F6 — S1 — `apps/native/src/screens/app/profile-screen.tsx:326-335` + `lib/push.ts:61-64` + `app.json`**
```
profile-screen.tsx:332  label={t("Push notifications", "Arifa za simu")}
profile-screen.tsx:333  sublabel={t("Job matches, sync updates", "Ajira zinazofaa, taarifa za usawazishaji")}
push.ts:63            const pid = projectId();
push.ts:64            if (!pid || !userId) return false; // not provisioned yet — no-op
```
`projectId()` reads `Constants.expoConfig.extra.eas.projectId` / `Constants.easConfig.projectId`.
**`app.json` has no `extra` key at all** (verified: `expo.extra` is `undefined`), there is no
`app.config.*`, and `eas.json` contains no `projectId`. So `registerForPush()` returns `false` before
it ever asks for a token: **a real registration can never happen.**

The user-facing consequence is not handled. `setNotif(true)` calls
`Notifications.requestPermissionsAsync()` — which **shows the Android permission dialog** — and on a
grant it calls `registerForPush()` and then `setNotifications(true)` (`:106`). The toggle renders ON,
the row underneath promises **"Ajira zinazofaa"** (job matches), and nothing will ever arrive.

This is deliberate-for-now (the comment says so) — but "deliberate" is about the *plumbing*, not about
what the user is shown. **Hurts:** every Android user who turns notifications on: they grant a system
permission for a feature that cannot work, and the product's first promise is silently empty. Fix the
UI, not the plumbing: hide the row (or the sublabel) until a `projectId` exists, or say what is true.
*(I could not observe this on a device — it is a source-level certainty, not a screenshot.)*

**F7 — S2 — `profile-screen.tsx:226-260`** *(what happens with no photo, and with a photo)*
```
<View style={{ flexDirection: "row", … padding: 16 }}>      // a plain View — not pressable
  … <Text …>{initials(user?.name, user?.email)}</Text>       // always initials, never a photo
```
The identity block is **inert** (no `onPress`, no chevron, no edit path) and it renders initials in an
accent square — **always**. A photo taken in first-run is stored as a *pending* photo
(`first-run-screen.tsx:263` → `pick-photo.ts`) and consumed by the **first CV** (`cv-editor-screen.tsx:290`
→ `personalInfo.profilePhoto`). So: **with a photo and with no photo, Profile looks identical**, and
there is no way to correct a wrong name or add a photo from Profile — the one screen a user opens to
manage their identity. **Hurts:** everyone who did the optional photo step and wonders where it went;
and anyone whose Google name came through wrong.

**F8 — S2 — `profile-screen.tsx:395`**
```
sublabel={t("How to scan, score, export and more", "Jinsi ya kupakia, kukagua alama na kupakua")}
```
`kupakia` is **to upload**, and the English says **scan**. The same screen's own product calls the tab
`Pakia` (`animated-tab-bar.tsx:108`) and the FAQ answer calls the action `kuchanganua`
(`help-faq-screen.tsx:34`) — so the Swahili user is pointed at "how to upload" while the feature is
scanning. `pakia ≠ pakua` is a standing rule in the standard (§6.6). Claude: **WRONG** →
*"Jinsi ya kuchanganua, kukagua alama na kupakua"*. **Hurts:** the Swahili-first majority, on the only
link from Profile to Help.

**F9 — S3 — `profile-screen.tsx:446`**
```
{t("Sumaiya · Your career, guided", "Sumaiya · Kazi yako, inaongozwa")}
```
`inaongozwa` is the passive `ina-` register plus a word-for-word calque of "guided" — officialese for
a warm memorial tagline. Claude: **MINOR** → *"Sumaiya · Kazi yako, ikiongozwa nami"* or
*"Sumaiya · Kazi yako, kwa mwongozo"*. **Hurts:** it is on every Profile visit, and it is the product's
signature line.

**F10 — S3 — `profile-screen.tsx:377` vs `:433`** — `icon="trash-2"` with `iconColor={c.warning}` on
*Clear offline data* (harmless: it removes a local cache, and the server copies are safe) and
`icon="trash-2"` on *Delete account* (irreversible). **The benign action is dressed exactly like the
destructive one**, so the two are not distinguishable at a glance — and the benign one is the one a
user might tap carelessly. **Hurts:** a returning user clearing space who thinks they are clearing
cache.

**F11 — S3 — `profile-screen.tsx:384`**
```
<ListRow last icon="alert-circle" label={t("Version", "Toleo")} value={version} />
```
An **alert** glyph next to the version number. On a screen full of status icons, an alert icon beside
`1.6.25` reads as "something is wrong with your app". **Hurts:** the user the owner sends to Profile to
read the version back to him.

**F12 — S3 — `profile-screen.tsx:428`** — `t("Danger zone", "Eneo la hatari")` is a literal calque
(*eneo la hatari* = danger area/zone), it wraps a **single** row, and the FAQ instructs the user to
navigate by that label (`help-faq-screen.tsx:78-79`), so the calque is load-bearing. Consider naming
the group after what it does (*Akaunti na kufuta*).

### 3.3 The TemplateHub / template surfaces

**F13 — S2 — `apps/native/src/components/cv/real-template-thumb.tsx:30`** *(the whole gallery is English)*
```ts
const base = cvToHtml({ ...SAMPLE_CV, templateId: id }, { template: id, accent, lang: "en" });
```
`lang` is **hardcoded to `"en"`**. `SAMPLE_CV` (`lib/sample-cv.ts`) is entirely English — *"Storekeeper
& Operations Lead"*, *"Detail-oriented storekeeper with 6+ years…"*. So **every** design cell in the
gallery, and the gallery's own full-screen preview (`template-gallery.tsx:404`), shows a Swahili user
an English CV. Meanwhile the editor's preview passes the live language —
`cv-preview-card.tsx:73` `cvToHtml(cv, { accent: color, lang, template })` — so **the same design is
Swahili in one place and English in another.** **Hurts:** the Swahili-first user, in the exact surface
where they are being sold a look; 224 cells × the primary language. Fix: `lang` from `useLang()`, and
translate `SAMPLE_CV`.

**F14 — S2 (structural; unmeasured) — `real-template-thumb.tsx:38-54` + `template-gallery.tsx:337-346`**
Every realised cell mounts a **`WebView`** that builds a complete CV HTML document, rendered with
`androidLayerType="software"` (no hardware layer). The gallery is a `SectionList` of 224 templates,
3 per row, with `initialNumToRender={12}` + `removeClippedSubviews` — the windowing is the mitigation
the developer chose, which tells you the cost was known. Software-layer WebViews in a recycled list on
a cheap phone is the structural source of the stutter the owner reports. **I could not measure it**
(no device build) — reported as a reading of the render path, with the fix direction: keep the
schematic `TemplateThumb` in the grid and mount the real `WebView` only in the tapped full-screen
preview (`template-gallery.tsx:398-410` already has that view).

**F15 — S3 — `template-gallery.tsx:370-373`** — the no-results state is a bare sentence:
```
{t("No design matches that.", "Hakuna muundo unaolingana.")}
```
No action, and **no clear-filters control anywhere in the gallery**: recovery is tapping the active
chip again (`template-gallery.tsx:322` `setFamily(family === f.key ? null : f.key)`), which nothing
tells the user. The web gallery has an explicit *Ondoa vichujio* (`template-gallery-client.tsx:632`);
native does not. **Hurts:** a first-time user who taps "Kichwa" and then finds the catalogue emptied.

**F16 — S3 — `template-gallery.tsx:29-35`** — the family filter chips are single bare nouns of layout
anatomy: `Pembeni` (at the side), `Sahili` (simple), `Kichwa` (head), `Ubunifu` (creativity), `Rasmi`
(formal). A first-time CV builder cannot predict what `Kichwa` will filter to. **Honest note:** the
English labels have the same problem (`Sidebar / Minimal / Header / Creative / Classic`), so this is a
*design-vocabulary* fault, not a Swahili fault — Claude passed the Swahili (#36 OK). Fix both slots
together, e.g. describe the outcome ("Cv yenye kichwa cha rangi") rather than the anatomy.

**F17 — S3 — `template-gallery.tsx:146,157`** — the free section is titled `Mkusanyiko Msingi`
("Curated Core") and the premium subtitle reads `Miundo bora kwa nyaraka zinazohitaji kuvutia` — the
noun is **`nyaraka` (documents)**, which is TemplateHub's document-catalogue framing, not Sumaiya's.
Same class on Home (`home-screen.tsx:213` `"Miundo 224 kwa kila nyaraka"` / EN *"224 designs for every
document"*). Sumaiya's user has a CV, not a document catalogue. **Hurts:** brand coherence — the same
drift the brand rules already flagged for the support address and slogan.

**F18 — S3 — `template-gallery.tsx:281-290`** — the header count is
`t(`${ALL_TEMPLATES.length} designs`, `Miundo ${ALL_TEMPLATES.length}`)` whenever the search box is
empty, so with a family chip active the header still claims **"Miundo 224"** over a visibly short list.
A count that does not match the list is a small lie the user can check.

**F19 — S3 — `template-gallery.tsx:249-256`** — each cell's `accessibilityLabel` is the design name
only: **no `accessibilityState={{ selected }}`**, and because an explicit label on a `Pressable`
replaces its children, the `Premium` lock badge is not announced. A blind user taps a Premium design
and is dropped into a paywall with no warning, and cannot tell which design is currently chosen.
Compare `cv-preview-card.tsx:122-125`, which does it correctly (`accessibilityState={{ selected: active }}`).

**F20 — S2 — `components/cv/cv-preview-card.tsx:291`**
```
accessibilityLabel={t("Accent colour", "Rangi ya mwangaza")}
```
`mwangaza` means **light / brightness** — "the colour of the light". It is not "accent". This is also
the **only** label the colour-swatch row has, so a blind user is told the wrong thing about the one
control that changes the CV's appearance. Claude: **WRONG** → *"Rangi ya mkazo"* (`rangi kuu` is also
defensible). **Hurts:** screen-reader users only — which is precisely why it survived: nobody sees it.

**F21 — S3 — `cv-preview-card.tsx:175,192`** — the tile that opens the full gallery is visible as
```
{t("All", "Zote")}
```
with `accessibilityLabel={t("All designs", "Miundo yote")}`. `Zote` ("all") is the exact bare-anaphor
shape the owner banned (rule: *name the object*), and the announced label differs from the visible one,
which breaks WCAG 2.5.3 (Label in Name) for voice-control users. Claude: **WRONG** → make it
`Miundo yote` in both slots.

**F22 — S3 — `cv-preview-card.tsx:340`** — `t("Couldn't make the PDF. Try again.", "Imeshindwa
kutengeneza PDF. Jaribu tena.")` — machine register on the failure of the product's most valuable
action (getting the file out). Should be `Sikuweza kutengeneza PDF. Jaribu tena.` Claude: **WRONG**.

### 3.4 The CV editor's appearance / base-choice UI

**F23 — S2 — `cv-editor-screen.tsx:570, 589, 593, 594, 598`** *(can a first-time user tell these apart?)*
```
:570  <TextField label={t("Headline", "Kichwa cha kazi")} … />
:589  <Section title={t("Experience", "Uzoefu")} … />
:593  {t("ROLE", "KAZI")} {i + 1}
:594  accessibilityLabel={t("Delete role", "Futa kazi")}      // trash icon
:598  <TextField label={t("Job title", "Cheo")} … />
```
Inside one section called **Uzoefu**, the entry header reads **KAZI 1**, its first field is **Cheo**
("position/rank"), its delete is **Futa kazi** ("delete job"), and twenty lines above, a *different*
field is called **Kichwa cha kazi** ("head of work"). Four names for one entry, plus "Kichwa" already
means the CV **header** in the design filter (`template-gallery.tsx:32`). Claude: **MINOR** (separate
sections mitigate it, and it suggests `Muhtasari wa kitaaluma` for *Professional summary*). **Hurts:**
exactly the user the owner is worried about — someone who has never built a CV, who cannot tell
"Cheo" from "Kichwa cha kazi". *(Note the CV editor also shows two different labels for the same field
elsewhere in the app: `career-profile-screen.tsx:155` calls it `Kichwa / cheo lengwa`.)*

**F24 — S3 — `cv-editor-screen.tsx:413`**
```
dialog.alert(t("Export failed", "Kupakua kumeshindwa"), t("Try again in a moment.", "Jaribu tena baada ya muda."))
```
`Kupakua kumeshindwa` is not a Swahili sentence — an infinitive ("the download") finished with a
perfect passive ("has been failed"). It reads as machine noise on the failure of the export the user
just waited for. Claude: **WRONG** → *"Sikuweza kupakua PDF"*. **Hurts:** the returning user whose PDF
did not come out — the moment they are most likely to give up on the product.

**F25 — S3 — `cv-editor-screen.tsx:440`** — `t("Opening your CV…", "Inafungua CV yako…")`. The waiting
line on the CV editor, in machine register. Claude: **WRONG** → *"Ninafungua CV yako…"*.

**F26 — S3 — `help-faq-screen.tsx:55-58`** *(tells the user to tap a control that does not exist in Swahili)*
```
q: { en: "How do I export my CV as a PDF?", sw: "Ninawezaje kuhamisha CV yangu kama PDF?" }
a: { sw: "Fungua CV unayotaka, kisha uguse \"Export\" au \"Pakua PDF\". …" }
```
The Swahili UI's export button is **`Pakua PDF`** (`cv-editor-screen.tsx:455`) — there is no control
named "Export" anywhere in the Swahili app, and the FAQ hands the user an English button name in a
Swahili sentence (`Export` is not in the market-loanword list; `CV`, `PDF` are). `kuhamisha` ("to move
a thing from A to B") is also a calque for *export*. Claude: **WRONG** (banned English word, and the
two names presented as if they were two buttons). **Hurts:** a user reading Help to find the download —
they will hunt for a button that is not there.

**F27 — S3 — `help-faq-screen.tsx:34-37`** — the flagship scan answer says
```
sw: "Fungua kichupo cha Import na uguse \"Piga picha\" … Sumaiya anasoma maandishi na kujaza taarifa zako kiotomatiki…"
```
Two faults: the tab is labelled **`Pakia`** (`animated-tab-bar.tsx:108`), so "kichupo cha Import" names
a tab that is English-only in the app; and `Sumaiya anasoma` narrates her in the third person when the
house voice has her speak (*"Ninasoma maandishi…"*). Claude: **WRONG**, same fix. **Hurts:** the
first-time user following Help through the import flow that is the product's headline feature.

### 3.5 The jobs surface

**F28 — S2 — `apps/native/src/screens/jobs-screen.tsx:41-63, 82`** *(what a listing shows, and what tapping it does)*
The whole card is a **plain `View`** — not pressable — and the app has **no job-detail route**
(`navigation/types.ts:8-18`: HomeMain, LearningHub, Guide, Invite, Jobs, JobApply, Applications,
ApplicationDetail, AtsChecker). So the `description` a listing carries is **unreadable in the app**:
your only options are *Lenga CV yako* (which pastes the advert into the tailor screen) or leaving for
the browser. Every other Card in the app answers a tap (`home-screen.tsx:550`, `applications-screen.tsx:87`,
the hint Card at `:296`) — so the job card *looks* tappable and is not.

Second half: the card shows `title`, `company · location`, a `%` and two buttons. It does **not** show
`applicationDeadline`, even though the screen filters on it (`:82-83`) — so closing dates are used
against the user but never shown to them, and no salary appears even though the feed model carries it.
**Hurts:** a first-time jobseeker comparing listings on a phone — the closing date is the single most
decision-relevant field on a Tanzanian job advert (the standard's own §3 evidence is built on
`mwisho wa kutuma maombi`).

**F29 — S2 (divergence — confirm before changing) — `jobs-screen.tsx:118`**
```
<ScreenTitle eyebrow={t("Jobs", "Ajira")}>{t("Openings for you", "Nafasi kwako")}</ScreenTitle>
```
The owner's recorded decision is that **`kwako` alone reads possessive, not "for you"**, and the
tightened form is **`Ajira kwa ajili yako`** (the same reason he changed the Home tile). The Jobs
screen title still carries the rejected bare form. Also note the header is redundant — eyebrow `Ajira`
over title `Nafasi kwako` says "jobs" twice. **Not asserted as a regression**: provenance of the
current wording is unconfirmed, and the standard's own table shows this string has already moved once
(`Ajira kwako` → `Ajira kwa ajili yako` → observed as `Nafasi mpya` → now `Nafasi kwako` on Jobs).
**Bring him the two options; do not bulk-replace.**

**F30 — S2 — `jobs-screen.tsx:125`** (and `home-screen.tsx:493`)
```
title={t("Couldn't load jobs", "Imeshindwa kupakia ajira")}
```
`kupakia` = **upload**. Nothing is being uploaded; the feed failed to *fetch*. An error state is the
worst place for a wrong verb — it tells the user the app tried to send something. Claude: **WRONG**
("nothing is being uploaded"; propose *"Sikuweza kupata ajira"*). Same class at `home-screen.tsx:493`
(*"Imeshindwa kupakia CV zako"*) and `:500`. **Hurts:** anyone on a flaky network — i.e. the common case.

**F31 — S3 — `jobs-screen.tsx:134-136`**
```
body: t("…paste a job link and I'll tailor your CV to it.", "…au bandika kiungo cha ajira nikutengenezee CV iliyolengwa.")
actionLabel: t("Ask me", "Niulize")
```
Three-way disagreement in one empty state: the body invites a **link** (`kiungo`), the destination
(`JobApply`) asks for the **full advert text** (`job-apply-screen.tsx:279` placeholder), and the button
is labelled **"Ask me" / "Niulize"** — which names nothing and promises a conversation, not a paste
box. Claude: **WRONG** → *"Bandika tangazo"*. **Hurts:** a first-time user at the product's emptiest
moment, with no next step that matches its label.

**F32 — S3 — `jobs-screen.tsx:134`** — `"Nafasi mpya zinaingizwa kila siku."` uses the passive
`zinaingizwa` ("are being inserted") and reintroduces `Nafasi mpya`, the exact phrase the owner retired
on Home. The EN pair (*"New listings are pulled in daily"*) is fine; the Swahili was translated word
for word.

**F33 — S2 (three surfaces disagree) — `apps/web/components/jobs/jobs-feed.tsx:82-87` vs `apps/native/src/screens/jobs-screen.tsx` (whole file)**
Web has **five filters plus a sort mode**: `query`, `category`, `location`, `minScore`, `recency`,
`sort` (`match` / `newest` / `closing`), with `topCategories`/`topLocations` derived from the feed, and
an explicit *Ondoa vichujio*. **Native has no filtering and no search at all** — pull-to-refresh is the
only control. And on web the filters are plain component state: grep for `searchParams`,
`useSearchParams`, `router.replace`, `localStorage` in `jobs-feed.tsx` returns **nothing**, so any
navigation or reload resets every filter. So: the phone cannot filter, and the desktop forgets.
**Hurts:** the cheap-phone user who is the actual product, over a feed that is now ~365 Tanzanian
listings (commit `954dd25`) with no way to narrow it.

**F34 — S2 (one control, three defects) — `apps/web/components/jobs/jobs-feed.tsx:443-455`**
```
<a href={j.applyUrl} target="_blank" rel="noopener noreferrer" className="…">
  {sw ? "Omba" : "Apply"}
```
1. **The label promises an application the product does not make.** It opens the employer's site; the
   app takes no application, holds no form, confirms nothing.
2. **It leaves the product with no warning.** 8 `target="_blank"` anchors exist in web `components/`
   and `app/` and **no leaving-warning component exists** (grep for `leaving` / `external` finds only
   icon imports). Native has exactly this — `lib/external-link.ts:19-31`
   `t("Leave the app?","Ondoka kwenye app?")` — so **the owner's own instruction was implemented on
   native and not on web.**
3. **Native already renamed the same control** to `t("Open the advert", "Fungua tangazo")`
   (`jobs-screen.tsx:60`), so the two surfaces now name one action two ways — and only one of them is
   honest.

Making it worse, the page's own metadata repeats the promise: `jobs/page.tsx:20` — *"omba, na fuatilia
— vyote mahali pamoja"* ("apply and track — all in one place"). **Hurts:** every web visitor from a
search engine — the acquisition surface tells them they can apply, then silently ejects them to a
third-party site.

### 3.6 The CV-check page (can a first-time user tell what it does from the page alone?)

**F35 — S2 — `apps/native/src/screens/ats-checker-screen.tsx:123` (and the layout of the whole screen)**
The page is: title `t("ATS check", "Ukaguzi wa CV")` → skeleton → **a score ring with a number**. The
explanation exists but sits **inside the score card, below the number** (`:205-208`
*"Ukaguzi wa uhakika — sawa na mifumo halisi ya kuajiri…"*), and the no-CV state says only
*"Unahitaji CV ili ukague. Tengeneza moja kwanza."* (`:140`). So a first-time user meets a score
before being told what is being measured — and in English the page never expands "ATS" at all
(`:123` title, `:206` "the same ones a real ATS runs"). **Verdict on the owner's question: no — not
from the page alone.** The minimum honest fix is one line under the title that says what the check
reads and what the number means, in her voice.
*(The delayed skeleton is the "illustrations of boxes" complaint too — see F48.)*

**F36 — S2 — `ats-checker-screen.tsx:119`**
```
s >= 75 ? t("ATS-ready", "Tayari kwa waajiri") : s >= 50 ? t("Needs work", "Inahitaji kazi") : t("High risk", "Hatari kubwa");
```
**`Inahitaji kazi` means "it needs a job"** — not "it needs work". Half the users who land in the middle
band are told their CV is looking for employment. And for anything under 50 the badge reads
**`Hatari kubwa`** ("great danger") — alarmist for a document, against the house voice. Two of the
three words on the score card are mis-scaled. **Hurts:** the user who most needs direction (mid/low
score) is given a meaningless phrase and then a scare.

**F37 — S3 — `ats-checker-screen.tsx:297`** — `t("Reviewing…", "Inapitia…")` on the **premium**
verdict button: machine register on the one control that asks for money. Claude: **WRONG** →
*"Ninapitia…"*.

**F38 — S3 — `ats-checker-screen.tsx:354`** — `t("Missing — add the true ones to your CV:", "Yanakosekana
— ongeza ya kweli kwenye CV:")`: `Yanakosekana` is a bare anaphor ("they are missing" — *what* is
missing?), it ends in a colon with nothing after it, and `ya kweli` ("the true ones") strips the
English's honesty warning (*add only the ones that are true*). Claude: **WRONG** → name the object.

**F39 — S3 — `ats-checker-screen.tsx:239`** — `t("Everything passes. Nice.", "Kila kitu kimepita.
Vizuri.")`. The trailing "Nice."/"Vizuri." is filler hype of exactly the register the house voice
excludes. Claude: **MINOR**.

**F40 — S3 — `ats-checker-screen.tsx:206`** — *"Hakuna AI, hakuna kinachotumwa popote"* ("No AI, nothing
sent anywhere") sits in the score card that also hosts the premium verdict button (`:296-302`), which
**does** send the CV summary and failing checks to the model (`:84-90`). The claim is scoped to the
deterministic checks, but it is inside the card that offers the non-deterministic one. Reads as a
promise the product cannot keep — narrow the wording or move it.

**F41 — S3 — one feature, four Swahili names.** `Ukaguzi wa CV` (Home tile `home-screen.tsx:276`, screen
title `ats-checker-screen.tsx:123`), `Kagua CV` (CV editor button `cv-editor-screen.tsx:505`; web
footer `ui/footer.tsx:14`, web editor tool `cv-editor-client.tsx:3322`, web assistant
`cv-assistant-client.tsx:2498`), `kikagua CV` (`help-faq-screen.tsx:72`), `alama ya CV`
(`help-faq-screen.tsx:41`). Individually defensible; together they make the app and the web look like
two products.

**F42 — S3 — `help-faq-screen.tsx:41-44`** — the FAQ answer says the checker *"compares your CV against
the words in a job posting"*, but the score the user sees is computed with **no job posting at all**
(`ats-checker-screen.tsx:58-67` `analyzeCv(picked.data, sw)` → `atsScore`); the advert comparison is a
separate optional box that needs ≥40 characters (`:71-74`). The FAQ describes the sub-feature as the
whole score — so a first-time user expects the number to be about a job they have not been asked for.
**Hurts:** trust in the product's headline number.

### 3.7 Wider sweep — by category

**F43 — S2 — the Kenya/Nairobi placeholder class is still live** (`career-profile-screen.tsx:155-157`,
`application-detail-screen.tsx:147-148`, `first-run-screen.tsx:421-422`, and on web
`business-card-editor-client.tsx:385`, `letter-editor-client.tsx:515,570`, `shared-profile-panel.tsx:164`,
`settings-form.tsx:373`)
```
career-profile-screen.tsx:155  … placeholder="Warehouse Supervisor" />
career-profile-screen.tsx:157  <TextField label={t("Location", "Eneo")} … placeholder="Nairobi" />
application-detail-screen.tsx:147  … placeholder="Brookside" />
application-detail-screen.tsx:148  … placeholder="Nairobi" />
web settings-form.tsx:373  placeholder="e.g. Nairobi, Kenya" />
```
This is the *same class* the copy skill records as identified and fixed — a placeholder that reads as
the account's own value, so nobody edits it, so it gets saved. The country is wrong for a
Tanzania-first product (hero badge: *"For job seekers in Tanzania"*), the brand is Kenyan
(Brookside), and the role (Warehouse Supervisor) is a warehouse job in a market of dukas. On web the
placeholder is *Nairobi, Kenya* on the **settings** form — i.e. the fallback for a user's own location.
Report as a **content/data bug**, not a copy nit. **Hurts:** the first-time user with no job history,
whose first saved CV says Nairobi.

**F44 — S2 — "Applications" is two different products** (`apps/native/src/lib/applications-store.ts:1-13,17-23`,
`apps/native/src/hooks/use-applications.ts`, `apps/native/src/screens/applications-screen.tsx:78-79`,
`apps/web/components/dashboard/applications-grid.tsx:21-27`, `apps/web/components/dashboard/application-workspace.tsx:48-54`)

| | native (SQLite) | web (Postgres) |
|---|---|---|
| store | **device-only**, *"Syncs to the server later when that lands"* — `use-applications.ts` reads the local store only; **no `/api/mobile/*` applications route exists** | DB-backed, `drizzle` `application` |
| statuses | `saved · applied · interview · offer · closed` | `draft · applied · interviewing · offer · rejected · archived` |
| "applied" (SW) | **`Nimeomba`** (first person) | **`Umetuma`** (second person) |
| "interview" (SW) | `Usaili` | `Mahojiano` (both listed as correct in the standard §3, with different senses) |

Two more consequences: the two surfaces have **different lifecycles** (native has no *rejected* /
*archived* at all, web has no *closed*), and native's unknown-status fallback is
`STATUS_META[a.status] ?? STATUS_META.applied` (`applications-screen.tsx:78-79`) — so an application
that is *rejected* elsewhere renders on the phone as **"Applied"**. If the two ever sync, a rejection
displays as a live application. Meanwhile the web jobs page promises *"vyote mahali pamoja"* (all in
one place) and native's own screen promises *"mahali pamoja, kwenye simu yako"*
(`applications-screen.tsx:65`). **Hurts:** every user who does half the work on each surface — and it
is invisible until they look. Report as a product decision to make, not a typo to fix.

**F45 — S2 — `vichujio` (UI filter) is used for employer **screening criteria** in six live web strings, while the owner's correction landed in one** — `apps/web/app/[locale]/(marketing)/ats-checker/ats-checker-client.tsx:219`,
`…/ats-checker/page.tsx:16`, `…/tools/[slug]/page.tsx:172,209`, `…/about/page.tsx:15`, `…/contact/page.tsx:45`
```
ats-checker-client.tsx:219  sw: "CV yako inapita vichujio vya waajiri wengi. Rekebisha vidokezo vichache hapo chini."
signals.ts:235 (the corrected form)  sw: "CV yako inaweza kukosa vigezo vya waajiri"
```
The owner's decision (recorded in the copy skill) is **`vigezo` for assessment criteria / `vichujio`
for actual UI filtering**, and the corrected form survives in exactly one place — `signals.ts:235`.
**The two governing documents disagree**: `docs/SWAHILI-STANDARD-2026-09-20.md` §6.5 *recommends*
"vichujio vya waajiri", and the native lint's own error message recommends it
(`swahili-lint.test.ts:177`), so the guard is defending the form the owner rejected. Genuine UI
filters elsewhere use it correctly (`jobs-feed.tsx:284`, `template-gallery-client.tsx:632`). Claude's
independent answer, asked directly: *"for employer screening criteria a Tanzanian jobseeker expects
**vigezo** — it's the everyday word from job ads and news (*vigezo vya kuajiriwa*); *vichujio* is
understandable but technical/metaphorical; if you pick one term product-wide, use vigezo."*
**Owner call — and whichever way he goes, fix the doc, the lint message and the strings together.**

**F46 — S3 — `server` vs `seva`** — `home-screen.tsx:500` *"tumeshindwa kufikia **server**"* (raw
English noun) vs `profile-screen.tsx:135` *"ziko salama kwenye **seva**"*. Same object, two spellings,
one of them English, in the same app. Claude: **WRONG** → use *seva*.

**F47 — S3 — the browser titles of 11 authenticated web pages are English-only**, while 7 sibling
routes use `generateMetadata`:
```
apps/web/app/(app)/(dashboard)/dashboard/page.tsx:29   export const metadata: Metadata = { title: "Dashboard" };
…/settings/page.tsx:11 "Settings" · …/brief/page.tsx:17 "Daily Brief — Sumaiya"
…/career-interview/page.tsx:7 · …/import-cv/page.tsx:7 · …/editor/{cv,letter,cover-letter,business-card}: "… Editor"
apps/web/app/(app)/interview "Interview Prep" · …/snap "Snap-to-Apply" · …/studio "Design Studio"
```
A Swahili user's tab, bookmark and share preview read **"Dashboard"** — the exact word the owner
retired in favour of `Nyumbani` (`translations.ts:155`). The infrastructure exists
(`app/(app)/layout.tsx`, `assistant/page.tsx`, `cv/[slug]/page.tsx` all have `generateMetadata`), so
this is 11 pages that did not follow the convention. **Hurts:** low-grade, but it is the product's name
for the user's own home page, and PWA installs show it.

**F48 — S3 — the loading state everywhere is grey boxes with no words and nothing for a screen
reader.** `SkeletonList`/`SkeletonCard` (`components/ui/skeleton.tsx`) render 2–3 grey rectangles; the
component carries **no `accessibilityRole`, no `accessible`, no live region**, and no caller pairs it
with text. Used at `home-screen.tsx:464`, `cv-list-screen.tsx:118`, `applications-screen.tsx:59`,
`jobs-screen.tsx:121`, `ats-checker-screen.tsx:126`, `learning-hub-screen.tsx:360`. This is the
owner's literal complaint ("illustrations of boxes") still in place on six screens: for a swell on 3G
the user watches rectangles, and a screen-reader user is told nothing at all. The motion work in the
tree improves *how the boxes leave* (the `exiting` hand-off is genuinely good) but not what they say.
Cheapest honest fix: a single line of text ("Ninasoma…") under the group, with a live region.

**F49 — S2 — the machine register is the single largest copy class in the product, and it is
UNGUARDED: twenty verified instances** (plus two borderline ones, below). The rule is the owner's: a
waiting line and a failure line are sentences **she** says, so they take `ni-` (`ninasoma`,
`ninaandaa`, `napitia`, `sikuweza`); `i-`/`ina-` is the prefix you use when *a machine* narrates. The
English slots are idiomatic gerunds ("Reading the text…"), which is exactly why the Swahili slipped
through — it reads fine if you are reading the English.

| # | FILE:LINE | Current Swahili | Should be |
|---|---|---|---|
| 1 | `scan-processing-screen.tsx:28` | `"Inasoma maandishi…"` | `"Ninasoma maandishi…"` |
| 2 | `scan-processing-screen.tsx:28` | `"Inatafuta uzoefu wako…"` | `"Natafuta uzoefu wako…"` |
| 3 | `scan-processing-screen.tsx:28` | `"Inapanga CV yako…"` | `"Naandaa CV yako…"` |
| 4 | `scan-processing-screen.tsx:122` | `"Imeshindwa kupiga hiyo"` | `"Sikuweza kuisoma"` |
| 5 | `scan-processing-screen.tsx:176` | `"Inapiga CV yako"` | `"Ninasoma CV yako"` |
| 6 | `first-run-screen.tsx:313` | `"Imeshindwa kutumia picha hiyo"` | `"Sikuweza kutumia picha hiyo"` |
| 7 | `job-apply-screen.tsx:232` | `"Inalenga…"` | `"Ninalenga…"` |
| 8 | `job-apply-screen.tsx:303` | `"Inasoma ajira na wasifu wako…"` | `"Ninasoma ajira na wasifu wako…"` |
| 9 | `ats-checker-screen.tsx:297` | `"Inapitia…"` | `"Ninapitia…"` |
| 10 | `cv-editor-screen.tsx:371` | `"Imeshindwa kuhifadhi CV hii"` | `"Sikuweza kuhifadhi CV hii"` |
| 11 | `cv-editor-screen.tsx:413` | `"Kupakua kumeshindwa"` | `"Sikuweza kupakua PDF"` |
| 12 | `cv-editor-screen.tsx:440` | `"Inafungua CV yako…"` | `"Ninafungua CV yako…"` |
| 13 | `cv-preview-card.tsx:340` | `"Imeshindwa kutengeneza PDF. Jaribu tena."` | `"Sikuweza kutengeneza PDF. Jaribu tena."` |
| 14 | `jobs-screen.tsx:125` | `"Imeshindwa kupakia ajira"` | `"Sikuweza kupata ajira"` |
| 15 | `home-screen.tsx:493` | `"Imeshindwa kupakia CV zako"` | `"Sikuweza kupakua CV zako"` |
| 16 | `home-screen.tsx:500` | `"tumeshindwa kufikia server"` | `"sikuweza kufikia seva"` |
| 17 | `profile-screen.tsx:163` | `"Imeshindwa kufuta"` (clear offline data) | `"Sikuweza kufuta"` |
| 18 | `profile-screen.tsx:207` | `"Imeshindwa kufuta"` (delete account) | `"Sikuweza kufuta"` |
| 19 | `attachment-preview-sheet.tsx:168` | `"Inasoma…"` | `"Ninasoma…"` |
| 20 | `learning-hub-screen.tsx:372` | `"Imeshindwa kupakia mapungufu ya ujuzi wako…"` | `"Sikuweza kupata mapungufu…"` |

**Borderline, listed for completeness — arguably correct as written:** `update-prompt.tsx:287`
`"Inafungua ukurasa wa kusakinisha…"` and `support-screen.tsx:90` `"Inafungua programu yako ya barua
pepe…"`. Both describe a **genuinely external actor** (the Android install screen; the phone's mail
app) doing the opening, not the persona — so the `i-` prefix is defensible there. Everything in the
table above is the persona's own action or failure.

**Why this class keeps coming back: nothing guards it.** The native lint
(`apps/native/src/lib/swahili-lint.test.ts`) covers calques (`mistari ya msisitizo`, `vibao`,
`vidonge`, `kitone`…), `ujanja`/`mjanja`, `mgusiko`, `link ya`, ATS-in-Swahili and the voice-agreement
check — grep it for a progress/failure register rule and there is none. **Add one** in both lints
(`/\b(?:Ina|Ina|Ime)[a-z]+\b/` with `Imeshindwa|tumeshindwa`), with `bad`/`good` samples and watched
failing on a re-introduced string, per this repo's own convention. **Hurts:** every user of the
product's most-used AI path (photograph an old CV → wait → get a CV), plus every error moment.

**F50 — S3 — `job-apply-screen.tsx:270`**
```
sw: "Bado huna CV — nitaandika barua ya maombi kwa kutumia wasifu wako. Piga au tengeneza CV ili nilenge na hiyo pia."
```
`Piga` on its own means **hit/strike**; the scan verb needs its object (`Piga picha`). The English is
*"Scan or build a CV"*. Claude: **WRONG** → *"Piga picha au tengeneza CV…"*. **Hurts:** a first-time
user with no CV — the guard is shown exactly to the people least able to guess.

**F51 — S3 — `job-apply-screen.tsx:240`** — the heading over the CV / cover-letter / both choice is
`t("WHAT DO YOU WANT?", "UNATAKA NINI?")` — an all-caps interrogative that reads as a challenge rather
than a question, in a product whose voice is meant to be warm and dignified. Claude: **MINOR** →
*"Chagua unachohitaji"*.

**F52 — S3 — `learning-hub-screen.tsx:547`** — the no-results state is
`<EmptyState icon="search" title={t("Nothing here yet", "Bado hakuna")} body={t("Try a different search.", "Jaribu utafutaji mwingine.")} />`:
**no action**, no way to clear the query, and `Bado hakuna` is the exact bare anaphor the owner banned
("nothing yet" — nothing *what*?). The web's equivalent of this state names the recovery
(`jobs-feed.tsx:313` *"Jaribu neno lingine au ondoa vichujio"*). Claude: **WRONG** → *"Bado hakuna
matokeo"*. **Hurts:** a user who typed a typo and now sees a dead end.

**F53 — S2 (hype / tone) — the web's congratulation and streak copy**
```
web/components/editor/cv-editor-client.tsx:2911  {uiLang === "sw" ? "Unaenda vyema!" : "On a roll!"}   // with a 🔥 icon
web/components/dashboard/outcome-check.tsx:101   "Logged — good luck in the interview!" / "Imehifadhiwa — kila la heri kwenye mahojiano!"
web/components/dashboard/outcome-check.tsx:103   "You got the job. This is what it's all for. 🎉" / "Umepata kazi. Hii ndiyo lengo letu lote. 🎉"
```
Exclamation marks, a flame streak, and a party-popper emoji in **both** language slots — against the
standing rule for this product (no hype, no exclamation marks, dignified). `lengo letu lote` ("our
whole goal") also introduces a first-person-plural product voice that appears nowhere else.
**Hurts:** the product's identity — this is the one place the app sounds like a different company. Low
effort, high signal to the owner.

**F54 — S3 — a public endpoint still serves 8 fabricated jobs, one of them Kenyan** —
`apps/web/app/api/jobs/feed/route.ts:29-93`: a hardcoded `MOCK_JOBS` array (5 Tanzanian, plus
`id: '8'` **"Kenya Logistics Hub", Nairobi, "KES 60,000 – 90,000"**), served by `POST /api/jobs/feed`.
Nothing in `apps/` calls it — the only reference is the repo's own seam prober
(`scripts/seam/run.mjs:1131-1141`), which **already fails on it**: *"TWO FEEDS, TWO TRUTHS: …
/api/jobs/feed, which serves 8 hardcoded jobs, while the real feed serves the database's rows"*.
Honest framing: this is a **known leftover the repo's own tooling already flags**, not a discovery —
but it is public on the product's domain, and the non-Tanzanian row contradicts the market gate
(`lib/jobs/location-relevance.ts`) that the rest of the pipeline now enforces.

**F55 — S3 (flag, not an assertion) — the persona is "I" on one screen and "she" on another** —
`memory-screen.tsx:109` `t("What Sumaiya knows", "Anachojua Sumaiya")`, `:137`
`t("WHAT SHE'S NOTICED", "ALICHOKIONA")`, `:178` `MATUKIO YA HIVI KARIBUNI`, versus
`ats-checker-screen.tsx:282` `t("My verdict", "Uamuzi wangu")`, `home-screen.tsx:245`
`t("A tip from me", "Kidokezo changu")`, `learning-hub-screen.tsx:481`. Same problem inside the
Learning Hub: guides are `t("Guides from Sumaiya", "Miongozo ya Sumaiya")` (`:503`) while Home's tips are
`Kidokezo changu`. **Claude passed the memory-screen title (#6) as natural for a settings section**, so
I am not calling it a defect — but if the owner wants one voice, this is where it is not one.

**F56 — S3 — two stiff lines in the Learning Hub** — `:481` *"Unashughulikia ujuzi mkuu kwa lengo
lako"* is a calque of "for your target" (the product says `kazi unazolenga` elsewhere) and `:493`
*"Tayari unaonyesha:"* ("You already show:") uses a verb of displays for a person's skills.

**F57 — S3 — `lib/external-link.ts:21`** — `t("Leave the app?", "Ondoka kwenye app?")`: the English
noun **"app"** in a Swahili dialog title, on the one prompt that asks for consent before leaving. The
Swahili sentence should stand without the reader's English (`programu`). **Hurts:** every external
hand-off on native — the most frequent consent prompt in the app.

**F58 — S3 — three verbs for one gesture** — web Swahili copy uses **`bofya` ×8** but **`bonyeza` ×2**
(`cover-letter-editor-client.tsx:402`, `editor-profile-menu.tsx:323`), while the native app uses
**`gusa` ×5** and never uses either. I am not asserting which is right in his ear — only that a user
moving between the phone and the web is told to do the same thing with three different words.

**F59 — S3 — naming/brand drift on Home** — `home-screen.tsx:274`
`{ icon: "sumaiya", label: t("Career AI", "AI ya kazi"), …}` opens the tab that is itself labelled
`Sumaiya` (`animated-tab-bar.tsx:107`), so one destination has three names ("Sumaiya" / "Career AI ·
AI ya kazi" / "Talk to me · Ongea nami" in `cv-list-screen.tsx:137`), and the tile names a *mechanism*
where its five neighbours name outcomes. `:212` and `:285` put the literal **TemplateHub** brand and
its catalogue framing on the Home screen and in the Home quick-action grid, against the recorded rule
that the TemplateHub name appears only in the templates gallery. Claude on `AI ya kazi`: **MINOR** —
*"foregrounds the mechanism rather than the outcome/persona, and duplicates naming"*.

**F60 — S3 — design blurbs are the copy that explains the 224 choices** —
`src/lib/templates/*.ts` line 12 of each file. 218 entries carry a real Swahili blurb (not mirrored —
verified: 0 `sw === en`), which is a genuine achievement, but the prose has defects:
```
aberdare.ts:12  { en: "Dark charcoal, compact, rounded photo", sw: "Mkaa mweusi, fupi, picha ya mviringo" }
altus.ts:12     { en: "Slate, card experience, accent lines",  sw: "Kijivu, uzoefu wa kadi, mistari ya rangi" }
apex.ts:12      { en: "Bold header, timeline body",           sw: "Kichwa kinene, maudhui ya timeline" }
athens.ts:12    { en: "Midnight, light blue sub, clean body", sw: "Usiku wa manane, kichwa kidogo cha bluu hafifu, maudhui safi" }
axis.ts:12      { en: "Black band, timeline-v2 experience",   sw: "Ukanda mweusi, uzoefu wa timeline v2" }
```
`Mkaa mweusi` = **black charcoal** (the fuel) — not a colour; `uzoefu` is used for a *layout* sense
("card experience") where in Swahili it means work/life experience — meaningless; `timeline` is left
in English in at least a dozen blurbs (`apex`, `athi`, `axis`, `bangweulu`, `boston`, `carbon`,
`cincinnati`, `cobblestone`, `ember`, `folio`, `helsinki`, `homabay`…); `bluu hafifu` can read as
"poor-quality blue" rather than "light blue". Claude: **WRONG** on (b), (c), (e); **OK** on (a) and
(d) — I would take the `timeline`/`uzoefu` items as clear and leave (a)/(d) to the owner. **Hurts:**
a first-time user choosing a look, who gets adjectives that mean nothing in Swahili.

**F61 — S2 — a documented fix is NOT in the tree: the scan screen still narrates in the machine
register, verbatim as pre-fix copy.** `docs/SWAHILI-STANDARD-2026-09-20.md` (and the copy skill) record
this screen's four strings as corrected **by hand**:

| Recorded fix | Current source (verified 20:56 EAT) |
|---|---|
| `Inapiga CV yako` → **`Ninasoma CV yako`** | `scan-processing-screen.tsx:176` = `t("Scanning your CV", "Inapiga CV yako")` |
| `Inatafuta uzoefu wako...` → **`Natafuta uzoefu wako...`** | `:28` = `"Inatafuta uzoefu wako…"` |
| `Inapanga CV yako...` → **`Naandaa CV yako...`** | `:28` = `"Inapanga CV yako…"` |
| `Imeshindwa kupiga hiyo` → **`Sikuweza kuisoma`** | `:122` = `t("Couldn't scan that", "Imeshindwa kupiga hiyo")` |

**All four are in their pre-fix form** — including `kupiga` ("to hit"), which the standard names
explicitly as the wrong verb for reading. So one of three things happened: the fix never landed, landed
on another branch, or was reverted — and nothing in the tree or the docs says which.

Why this is its own finding rather than five rows in F49: **(1) the document is now wrong, and the next
agent will read the standard, believe this screen is clean, and skip it** — this is the standard's own
worked example, so a whole class *looks* done; **(2) it generalises** — a documented fix is a claim,
not a fact, so re-grep the string before assuming any fix landed. (The copy skill already insists on
this for the owner's copy decisions; it applies to an agent's own fixes with equal force.)
**Hurts:** every user scanning an old CV — the product's most-used AI path — is narrated by a machine,
in the one word the standard says reads as *hitting* their CV.

---

## 4. The Claude CLI Swahili pass (one invocation, 45 strings)

Method: the suspect strings were batched into **one** prompt (`%LOCALAPPDATA%\Temp\swahili-pass.txt`)
carrying the house rules (second person for the user's own things; first person only for the user's own
words/consent/authorship and the assistant speaking about herself; never ATS in Swahili; sell the
outcome; labels name their object; the market's own words; `pakia` ≠ `pakua`; `ni-` not `i-`/`ina-` on
progress and failure lines; the banned loaded-street-word list and the banned/calque list), and it was
run **once** via
`C:/Users/hamis/.local/bin/claude --dangerously-skip-permissions -p "$(cat swahili-pass.txt)"` with the
output redirected to a file. Raw output: `%LOCALAPPDATA%\Temp\swahili-pass-out.md` (8,965 bytes).
No parallel invocations.

**Counts, read off the output file (45 strings, 0 UNSURE): WRONG = 20 · MINOR = 8 · OK = 17.**

**Flagged WRONG (20):** #1 `Migusiko` (not a word); #2 `Imeshindwa kutumia picha`; #4 `kupakia`
for *scan*; #7 `Imeshindwa kupakia ajira`; #10 `Niulize` mislabels its destination; #15 `Inapitia…`;
#17 `Yanakosekana` anaphor; #20 `Import` + third-person `Sumaiya anasoma`; #21 `Export` (a control
that exists nowhere in the Swahili UI); #22 `Inafungua…`; #23 `Kupakua kumeshindwa`; #25 `Rangi ya
mwangaza`; #26 visible `Zote`; #27 `Imeshindwa kutengeneza PDF`; #28 `Inalenga…` + `Inasoma…`;
#30 bare `Piga`; #31 `Imeshindwa/tumeshindwa` + `kupakia` + raw `server`; #32 `premium` as a bare
English noun; #35 `Bado hakuna`; #38 the template-blurb items.

**Flagged MINOR (8):** #5 `inaongozwa` (stiff passive calque); #14 `Vizuri` filler; #24 the
`Kichwa cha kazi` / `Cheo` blur (plus `Muhtasari wa kikazi`); #29 `Unataka nini?` blunt;
#33 `AI ya kazi` foregrounds the mechanism and duplicates the "Sumaiya" tab name; #37 the
`rasimu wala iliyokamilika` construction; #39 `vidokezo` for "items"; #41 the clear-cache sentence.

**Passed OK (17):** #3 the first-run placeholder's first person (correct: the user's own authored line);
#6 `Anachojua Sumaiya` (natural as a settings-section title); #8 `Nafasi kwako`; #9 the jobs empty-state
body; #11 the jobs match copy; #12 `Ukaguzi wa CV`; #13 the no-ATS explanation; #16 the JD-match
fragment; #18 `Mistari dhaifu kwenye uzoefu wako`; #19 the FAQ question; #34 `Nafasi mpya`; #36 the
gallery's section titles and family chips; #40 the web CV-check failure line; #42 the storage warning;
#43 dark mode + notifications labels; #44 onboarding slide 1; #45 onboarding slide 3.

**Where I keep a finding Claude passed, and say so:**
- **#36 (family chips)** — passed on language; I still report **F16** as a *comprehension* fault (both
  languages), not a Swahili fault.
- **#8 (`Nafasi kwako`)** — passed on language; **F29** stands as a divergence from a recorded owner
  decision, to be confirmed with him rather than fixed.
- **#30** — Claude's fix ("Piga **picha**") and mine are the same; it rated it WRONG, I rate it S3
  because the guard only shows for CV-less users.
- **#38** — Claude rated (a) and (d) OK; I keep only the `timeline`/`uzoefu` items as clear and flag
  `Mkaa mweusi`/`bluu hafifu` for his ear.
- **#40** also returned the direct answer I asked for on the terminology conflict: **`vigezo`, not
  `vichujio`, for employer screening criteria** — which is F45.

Two of Claude's verdicts rest on rules it was given rather than on observation (`i-`/`ina-` register;
the banned English nouns) — that is expected, and those rules are the owner's, not Claude's invention.
Everything it flagged that I could verify in the tree, I did (each F above carries the grep result).

---

## 5. The five I would fix first — and why

1. **F6 — the push-notification toggle is a no-op** (`profile-screen.tsx:326-335`, `push.ts:61-64`,
   `app.json` has no `expo.extra`). It asks the user to grant a system permission and then promises
   "Ajira zinazofaa" while no token can ever be registered: fix the *UI* (hide or restate the row),
   not the plumbing.
2. **F34 — the web job card says "Omba" but only opens the employer's site, with no warning**
   (`jobs-feed.tsx:443-455`). It is a false promise on the acquisition surface, it violates the
   owner's own external-link instruction, and native has already renamed the same control to
   "Fungua tangazo" — one rename plus the existing warning pattern closes all three.
3. **F44 — Applications are two unsynced stores with different statuses and different Swahili**
   (`applications-store.ts` vs `applications-grid.tsx`; `Nimeomba` vs `Umetuma`; rejected renders as
   "Applied" on the phone). Both surfaces promise "all in one place": either sync it or stop saying it,
   because this is the one defect that gets worse the more the user trusts the product.
4. **F49 + F61 — the waiting and failure lines are still the machine talking** — **twenty verified
   instances**, the largest copy class in the product, including the product's most-used AI path
   (`scan-processing-screen.tsx:28,122,176`, where four strings the standard records as **already
   fixed by hand are still in their pre-fix form**). It is read when the user is anxious, the English
   is idiomatic so it keeps slipping through, and **nothing in either lint guards it** — so fixing the
   strings without adding the rule means doing this again in a month.
5. **F13 — the design gallery renders every thumbnail in English** (`real-template-thumb.tsx:30`
   `lang: "en"`). A Swahili-first user browses 224 designs — and the full-screen preview — through an
   English sample CV, while the editor shows the same design in Swahili. One prop, plus a translated
   `SAMPLE_CV`.

**Next two if he wants more:** F7 (Profile's identity block is inert and can never show the photo it
asked for) and F43 (the Nairobi/Brookside placeholder class is still in five screens and two web
forms).

---

## 6. Where the three surfaces disagree — one table

| Behaviour | Native app | Web | Verdict |
|---|---|---|---|
| Naming the CV check | `Ukaguzi wa CV` (tile, title) / `Kagua CV` (editor button) | `Kagua CV` (footer, editor tool, assistant) / `Ukaguzi` absent | F41 |
| Employer screening word | `mifumo halisi ya kuajiri` (clean) | `vichujio vya waajiri` ×6 | F45 |
| Jobs filtering | none at all | 5 filters + sort, lost on navigation | F33 |
| Opening a job advert | warns first, and the label is `Fungua tangazo` | `Omba`, no warning, new tab | F34 |
| Applications | device-only SQLite, 5 statuses, `Nimeomba` | DB, 6 statuses, `Umetuma` | F44 |
| Leaving for an external site | consent dialog everywhere | no mechanism exists | F34, A11 |
| Course/guide premium marker | marker + wall inside the guide | — | A6 (correct) |
| Loading state | skeletons (no text, no a11y) | page-level loading | F48 |
| Page titles | n/a | 11 English-only titles | F47 |
| Template gallery chrome | "TemplateHub" on Home + gallery | TemplateHub landing is a separate product surface | F59 |
