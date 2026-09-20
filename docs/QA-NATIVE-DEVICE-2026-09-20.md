# Native device sweep — Sumaiya on the real phone

**Date:** 2026-09-20 (evening, EAT) · **Author:** device-QA subagent (Hermes)
**Device:** Google Pixel 8 Pro (`husky`), Android 17 / build fingerprint `google/husky/husky:17/CP2A.260805.005...`, serial `10.229.114.105:5555` (adb over Wi-Fi)
**Panel:** 1344 × 2992 px, physical density 480, **override density 408 → 2.55 px/dp**
**App under test:** `pro.sumaiya.app`, installed build **1.6.24 (versionCode 10624)**, `lastUpdateTime = 2026-09-20 10:02:55`, `firstInstallTime = 2026-09-18 20:53:16`
**Signed in as:** Hamis Iddy (Mweuc) `hamisiddy9@gmail.com` — the owner's real production account (NOT wiped, NOT signed out; see "Left-behind state")

### How to read the evidence lines
Every claim below carries the instrument that produced it, in the form
*[dump]* = `uiautomator dump` text/bounds, *[shot NNN kB]* = `exec-out screencap` file size, *[px]* = measured pixel position from a screenshot, *[bundle]* = string grepped out of the APK's `assets/index.android.bundle`, *[src]* = repo source at a named commit, *[logcat]* = device log.
A screenshot proves **rendering**, never **behaviour** — where I only have a screenshot I say so.

Screenshots and dump XML from this sweep are on disk at `C:/Users/hamis/projects/sumaiya/.qa-tmp/shots/` and `.qa-tmp/*.xml` (untracked, not committed).

---

## 0. BASELINE

| What | Value | How |
|---|---|---|
| versionName / versionCode | **1.6.24 / 10624** | [dump] `dumpsys package pro.sumaiya.app` |
| lastUpdateTime | **2026-09-20 10:02:55** | same |
| APK this build came from | `apps/native/android/app/build/outputs/apk/release/app-release.apk`, **45,565,859 B**, mtime **10:12**, md5 prefix **136f5699f0c0** | `ls -l`, `md5sum` |
| Process on launch | **does not crash.** `am force-stop` → `am start -n pro.sumaiya.app/.MainActivity` → Home rendered by t+14 s; `pidof` non-empty; `topResumedActivity=…pro.sumaiya.app/.MainActivity` | [logcat] + [dump] + [shot 01_launch 210 kB] |
| Crash buffer | **zero entries for `pro.sumaiya.app`** across the whole sweep. The only crash-buffer content seen all evening was an unrelated vendor HAL abort at 19:31:25 (`android.hardware.sensors-service.multihal`, SIGABRT from `LibSuezNappClient` watchdog) | [logcat] `logcat -d -b crash` |
| `ReactNativeJS` lines | **0** — expected: this is a release build, `console.*` is stripped | [logcat] |
| Session state | signed in, **0 CVs** at start, career profile already filled | [dump] Home + CV list empty state |

**The build is stale and that is the point of this report.** Since 10:02 today, **40 native files** have changed on disk (`git log --since=2026-09-20 10:02 --name-only -- apps/native | sort -u | wc -l` = 40), and the tree has since moved to `HEAD = 978b25c` (21:18). Everything the owner is looking at on his phone is **1.6.24**.

---

## 1. ONBOARDING AND FIRST RUN — ⚠️ NOT DRIVEN (stated honestly)

**Why not:** the device holds a signed-in production session. The only route into first-run/sign-in is to sign out, and re-entry needs an **emailed OTP that only the owner can read** — so signing out would have locked the owner out of his own account. I left the session intact. Therefore:

- **Could not drive:** first-run screen render, its field order, the onboarding permission prompt, and what a refusal does *during onboarding*.
- **Could not drive:** the sign-in screen, its OTP field, and any "deny" of a system dialog (I also did not manufacture an OS-level deny — I used the in-app alternative instead, see below).

**What I verified instead, by device + source:**

| Surface | Permission | How verified |
|---|---|---|
| **Pakia (Upload) tab** | **Camera**. The tab opens on an in-app gate, not a bare OS dialog: title `Ruhusa ya kamera`, body `Natumia kamera kusoma CV uliyonayo. Hakuna kinachohifadhiwa — picha inatumika kisha inafutwa.`, buttons `Ruhusu kamera` and `Chagua kutoka kwenye picha badala yake` | [dump] 22_import.xml, [shot 22_import 96 kB] |
| **The alternative path (`Chagua kutoka kwenye picha badala yake`)** | **No runtime permission at all** — it opens `com.google.android.photopicker` (the system photo picker). Nothing was asked; the OS never prompted | [dump] focus = `com.google.android.photopicker/MainActivity`, [shot 23_import_picker 2,074 kB] |
| **Profile → `Arifa za simu` toggle** | **Notifications**, requested when the user turns the toggle on | [dump] profile screen, [src] `profile-screen.tsx:81` calls `Notifications.requestPermissionsAsync()` |
| App launch | **does not prompt.** `usePushRegistration` only *reads* permission (`getPermissionsAsync`) on mount | [src] `lib/push.ts` lines 51–105 |
| Storage / photos | **never requested** — the picker is the system one | [src] grep of `apps/native/src` for `PermissionsAndroid`/media-library requests = only `lib/permissions.ts`, `scan-screen.tsx` (camera) |

**On the owner's "asked during onboarding and then again later":** the source explains it, and it is **already fixed in source** (commit `978b25c`, 21:18 — *"permissions asking while onboarding then app"*): *"the camera was requested from three call sites with three behaviours, two of which returned a bare null on refusal (tap Camera, refuse, nothing happens). Consolidated into lib/permissions.ts: one prompt per session, honest 'blocked' vs 'refused', a plain-Swahili reason, and a real alternative."* On the phone that consolidation is **not present** — the build has whatever the three old call sites did. I verified **one** of the three (the Pakia gate); the onboarding one I could not reach.

**What a "deny" does in the build: NOT VERIFIED** (I did not send a system deny). What I can say: the app offers a working alternative path that never asks the OS, and the *source-level* pre-fix complaint was "tap Camera, refuse, nothing happens".

---

## 2. ACCOUNT — sign-in, sign-out, reachability

- **Signed-out reachability: NOT DRIVEN.** I did not sign out (reason above), so I cannot report what an anonymous user reaches.
- **Sign-out in the shipped build: NOT PRESENT on the Profile screen.** The Profile screen was dumped top-to-bottom: the `AKAAUNTI` group contains only **`Futa data iliyohifadhiwa`** and **`Toleo 1.6.24`**; there is no `Toka` / "Sign out" row anywhere on the screen — [dump] 02_profile.xml (47 nodes) + [shot 02_profile 234 kB]. The shipped bundle agrees: the literal `"Toka"` appears **0** times ([bundle] grep -a; the only `Toka…` match is the garbage run `Tokavango…`), while `Sign out?` appears once. In the current source there **is** a real button — `profile-screen.tsx:442 <Button label={t("Sign out","Toka")} …/>` — but that line dates from commit `5eaca9e` (09-09), so this is **not** a stale-build gap; the shipped screen simply does not render a sign-out row where the source has one. Where a signed-in user *can* sign out in 1.6.24: only through the "session expired" error CTAs (`onAction={actionKind === "signin" ? signOut : refresh}` in `home-screen`, `cv-list-screen`, `ats-checker-screen`) — i.e. **a user with a healthy session has no way to sign out from that screen**.
- **The 8-digit email code: matches, and the app is not the broken side.** Verified from the source the build was compiled from and from the fix commit's own account: pre-fix `apps/native/src/lib/auth-code.ts` read `export const EMAIL_OTP_DIGITS = 8;`, the native suite asserts 8, and `c73992a` (18:37) states: *"The **web** sign-in field accepted 6 digits and the Android app accepted 8, while the server mails out exactly one length… Sumaiya production's Supabase project is configured for an 8-digit email OTP, so the web sign-in could never accept the code it was sent."* The commit moves the literal to `@sumaiya/utils/auth-code` (native re-exports it, its own suite "untouched and still asserts 8"). **So: app = 8, server = 8, they match; the mismatch was on the web**, and that is fixed in source (also `7ef4c4d` 18:42 adds the seam test). The field itself is 8 boxes with `maxLength={EMAIL_OTP_DIGITS}` [src sign-in-screen.tsx:37–73]. I could **not** type into it on the device, and my attempt to read the shipped constant out of the minified bundle did not resolve (grep for `EMAIL_OTP_DIGITS` / `maxLength` returns mangled runs only) — so the *device-level* "what does the field accept" remains **NOT VERIFIED**, with the source-level answer above.

---

## 3. PROFILE — layout as rendered

Dumped and screenshotted as a user (Profile tab). [dump] 02_profile.xml, [shot 02_profile 233,991 B]

Structure, top to bottom (kio):
1. Header `Wasifu`.
2. **Identity card**: a 45×60 px rounded orange square containing the initials **`HI`** (no photo), then `Hamis Iddy (Mweuc)` and `hamisiddy9@gmail.com`. **Nothing competes with the photo area** — there is no camera badge, no "Badilisha picha" control, no avatar upload affordance at all on this screen.
3. `TAARIFA ZAKO` → **Wasifu wa kazi** (career profile) row with chevron.
4. `MUONEKANO` → `Hali ya giza` (dark mode Switch), then `Lugha` with a two-button segmented control (**English** / **Kiswahili**, Kiswahili selected).
5. `ARIFA` → `Arifa za simu` (notifications Switch) + sublabel `Ajira zinazofaa, taarifa za usawazishaji`.
6. `SHIRIKISHA SUMAIYA` → `Mwalike rafiki`.
7. `SUMAIYA PREMIUM` → `Miundo ya hali ya juu na kozi za kina` / `Kila kitu muhimu kinabaki bure`.
8. `AKAAUNTI` → `Futa data iliyohifadhiwa`, `Toleo 1.6.24`.
9. `MSAADA NA USAIDIZI` → `Msaada na Maswali` / `Jinsi ya kuchanganua, kutoa alama, kuhamisha na zaidi` (the last row, partly under the tab bar).
10. Tab bar: Nyumbani · CV zangu · Sumaiya · Pakia · Wasifu.

**On the owner's two specific points:**
- **"Badilisha picha looks unnecessary once a photo is set"** → he was pointing at the **CV editor** (and the career-profile screen), not this tab — his words are quoted in the source as the reason for the change (`cv-editor-screen.tsx:547-552`, `career-profile-screen.tsx:90-95`). On the **shipped build I reproduced the defect exactly** in the CV editor: the editor shows a real **photo** *and* a text link **`Badilisha picha`** *and* a second link **`Ondoa`**, i.e. the photo (already tappable, desc `Badilisha picha`, bounds `[92,606][255,769]`) plus a redundant label (bounds `[291,643][1252,684]`). [dump] 06_newcv.xml, 12_reedit [shot 06_newcv 207,000 B — the photo, the "Badilisha picha" link and "Ondoa" are all visible]. It is **fixed in source** (see §11, commit `978b25c`) and **not in this build**.
- **Layout as rendered (Profile tab)**: no misalignment, clipping or dead space spotted; the identity card sits directly under the title, and the bottom-most Help row is partly obscured by the tab bar (a scroll, not a defect).

**Career profile screen** (`Wasifu wa kazi`, reached from the Profile tab) opens and is prefilled: `Hamis Iddy (Mweuc)`, `Customer Service & Support`, `Nairobi`, `hamisiddy9@gmail.com`, skills `Phone support`, experience `Just starting out.`. Photo row shows the **pre-photo** state correctly: a circle (desc `Weka picha yako`) **and** one text button `Weka picha yako` — [dump] 04_career_profile.xml, [shot 190,813 B]. (In this state the duplicate control is *intended* by the source; it is only after a photo exists that the second control must disappear — and that is what the build gets wrong in the editor.)

---

## 4. CREATION MODES — what each one actually did

### 4a. Manual editor (built by hand) — ✅ WORKS END TO END
- Opened from Home `CV mpya` → sectioned editor, header `CV mpya` + status pill `Haijahifadhiwa`, sections: **Maelezo binafsi**, **Muhtasari wa kikazi**, **Uzoefu**, **Elimu**, **Ujuzi** (scrolled to the very bottom to confirm there is no sixth section — **there is no Languages section in the native editor**, so a CV authored natively can never contain languages; the languages rows only ever come from the web/AI/sample data). [dump] 06/07/ed_0..3.xml
- **Typing works.** Tapped `Jina kamili`, `input text "QA%sSweep%s2026"` + `"Mwaka"` → field read back **`QA Sweep 2026Mwaka`** ([dump] 07_typed.xml). Spaces land, nothing dropped (mine to concatenate, the app's to render).
- **Saving works and is honest about state.** Tapped `Hifadhi` → status pill flipped **`Haijahifadhiwa` → `Imehifadhiwa`** ([dump] 08_saved.xml).
- **Survives leaving the screen, AND a process death.** Back → CV list shows `1` with card `QA Sweep 2026Mwaka · Ilibadilishwa Leo` ([dump] 10_cvlist_persist.xml). The app process was then killed by the system (see §8) and relaunched: Home showed `CV zako 1` and the recent-CV card `QA Sweep 2026Mwaka, Leo`, and the Home signal card had already picked it up: *"CV yako inaweza kukosa vigezo vya waajiri… 'QA Sweep 2026Mwaka' ina alama 14/100 ya usomekaji"* ([dump] 13_relaunch_home.xml, [shot 211,074 B]). Confirmed again on the CV list at the end of the sweep: count **1** — the failed import fallback did **not** leave a junk record.
- Empty-CV guard: a brand-new CV renders `Jina kamili` empty and the field labels as hints — no phantom data.

### 4b. AI assistant / chat (Sumaiya tab) — ❌ FAILS ON THE DEVICE, TWICE
Message sent and the app answered with a fallback, not an answer:
- t=0 typed `Nisaidie kuandika muhtasari mfupi wa CV ya huduma kwa mteja`, tapped `Tuma` → bubble appears **and** immediately `Sumaiya ana shughuli nyingi sasa hivi. Jaribu tena baada ya muda mfupi.` [dump] 20_chat_reply.xml
- **Retried 4 minutes later** with `Andika muhtasari mfupi wa CV` → **same reply** ([dump] 21_chat_retry.xml, [shot 128,173 B]). Two consecutive failures on the product's headline AI action is a finding, not a flake.
- The copy is the app's **502/503/504 branch** — `lib/app-errors.ts:151` maps exactly those three statuses to `"Nina shughuli nyingi sasa hivi…"`, and the shipped bundle contains the **third-person** `Sumaiya ana shughuli nyingi` (1 hit) but **not** the fixed first-person `Nina shughuli nyingi` (0 hits) [bundle]. So the build ships the pre-fix wording; the fixed wording is `cb29d9f` (11:12), **after** this build.
- Also present in the chat: ⚙ `Futa mazungumzo` (clear conversation), `Ongeza picha au faili` (attach), and a `Tengeneza CV yangu kutoka mazungumzo haya` button that appears once there is a conversation.
- **No `ReactNativeJS` output** to say *why* (release build strips it) — the server side of this is stated in §9.

### 4c. Import ("Pakia" → photo of a CV) — ❌ THE CORE FLOW FAILS, TWICE, AT ~75 s
This is the product's whole value proposition, so it is the headline finding.
- Flow: Pakia tab → camera gate → `Chagua kutoka kwenye picha badala yake` → system photo picker (multi-select: cell → `Done` at (1178,2800)) → picked a **1240×1754 PNG of a real CV** I generated and pushed into `/sdcard/Pictures` (`qa-cv-fixture.png`, MediaStore id 46900) [dump 24_picker2.xml, MediaStore query].
- The staged progress is real and readable: `Inapiga CV yako` → `Inasoma maandishi…` (t≈15 s) → `Inapanga CV yako…` (t≈35 s) → `Inatafuta uzoefu wako…` (t≈55 s) → **`Imeshindwa kupiga hiyo` + "Sumaiya ana shughuli nyingi sasa hivi…"** at **t≈74 s**, with three ways out: `Jaribu picha nyingine`, `Jaribu tena`, `Anza CV tupu badala yake`. [dumps] i_1..5.xml + 26_import_t15/35/55/74.png (79.8 kB → 103.5 kB as the error frame appears).
- **Pressed `Jaribu tena` and timed it again: failed at t≈75 s with the identical error** ([dumps] r_1..5.xml, 27_retry_t*.png). Two consecutive failures with a ~75 s wall-clock ceiling is the classic platform-shaped timeout, not a network flake.
- `Anza CV tupu badala yake` (start an empty CV instead) **works**: it opens a fresh empty editor (and did not create a second CV record — list count stayed 1).

### 4d. Snap-to-apply (`Omba kwa ujanja`) — ⚠️ SCREEN OPENS, PRIMARY ACTION COULD NOT BE TRIGGERED
- The screen opens (from the `Barua ya maombi` card and from other quick actions) with a real job advert already in the field — CCBRT `Sales Officer job`, `2335 herufi` — so the draft **persists across an app restart** [dump] d5.xml, sn_now3.xml.
- Header: `Omba kwa ujanja` — *"Bandika maelezo ya ajira. Narekebisha CV yako na kuandika barua ya maombi inayolingana — kwa kutumia ninachokifahamu kukuhusu."* Three-way selector `UNATAKA NINI?` = `Lenga CV yangu` / `Barua ya maombi` / `Zote mbili`, and the primary button **`Lenga ajira hii`**.
- **Three attempts to fire `Lenga ajira hii` did not start the flow.** Tapped its own reported bounds twice (`(672,2045)` then `(672,2624)` after the layout reflowed) and once more after a fresh dump; each tap **mutated the job-ad text instead** — the character counter went **2335 → 2339 → 2340**, and no progress state, no error, nothing for 40 s afterwards ([dumps] sn_now2.xml, s4.xml, s5.xml, s6.xml). So on this build the primary action of the snap surface **appears not to receive the touch** (or is disabled while the field holds focus) — I could not distinguish those two readings, and I therefore **cannot report whether the tailoring/cover-letter generation works**. This is exactly the kind of thing `978b25c`'s *"apply feedback"* item and `use-sumaiya-chat`/`attach-sheet` changes touch — i.e. work exists in source, uncommitted/recent, that this build lacks.
- Note: the AI-dependent backend was failing anyway (§4b/§4c) — a working button would likely have produced the same 502/503/504.

### 4e. Template gallery — ✅ opens, ⚠️ see §5 for what it renders

---

## 5. TEMPLATE SURFACES

### TemplateHub (opened by the Home `TemplateHub` quick action) — ✅ 224 designs
Header `TemplateHub` / `Miundo 224`, a search box `Tafuta miundo`, filter chips `Pembeni · Sahili · Kichwa · Ubunifu · Rasmi`, sections `Imependekezwa kwako` / `Kwa kazi yako · Huduma kwa mteja`, and a `TemplateHub Premium` section (Kiongozi, Fupi — padlocked). [dump] 29_gallery.xml (338 nodes, 170,828 B) + [shot 29_gallery 309,900 B].

### The owner's template complaint — **REPRODUCED (one half) and NOT REPRODUCED (the other half)**
Owner: *"a template rendering SCALED and pinned to the LEFT with a languages row showing the label hard left and 'Fluent' hard right."*

**(i) The languages row — REPRODUCED, with numbers.** Tapping the `Apex` card opens a full-page template detail (header `Apex` / `Kichwa · Bure`, a `Tumia muundo huu` button at the bottom) rendering **sample data with a LANGUAGES section** [shot 30_gallery_tap 126,792 B]. Measured in the gallery's own WebView text nodes for the sidebar (`Pembeni`) layouts:

```
Athens card (card cell x 0..446):
  'LANGUAGES' (100,1653)   'Swahili' (92,1668)  'Native' (428,1668)
                           'English' (92,1677)  'Fluent' (428,1678)
Atlanta card (cell 449..895):
  'LANGUAGES' (522,941)    'Swahili' (515,1014)  'Native' (851,1014)
                           'English' (515,1023)  'Fluent' (851,1023)
```
Label at x≈92 and level at x≈428 in a 446 px-wide card = **label hard left, level hard right, ~336 px of empty page between them**. That is verbatim the owner's description, on the device, in this build. [dump] 29_gallery.xml.

**(ii) "Scaled and pinned to the LEFT" — NOT reproduced in the three surfaces I measured.** I measured the page rectangle instead of eyeballing it:
- Template detail preview: screen 1344 px wide; the white page occupies **cols 51..1292** and **rows 494..2089** → left margin 51 px, right margin 52 px, page = 92 % of screen width. **Centred, full-bleed, not clipped.** [px over shot 30_gallery_tap]
- Full-screen CV preview from the editor (`Onyesho la skrini kamili`): the page spans **x 0..1343 of 1344** at mid-height — **full width, no left slice, no right gap** [px over shot 17_fullscreen_preview 74,015 B].
- Editor thumbnail (`Onyesho` modal): page **x 292..1052** → a centred 760 px thumbnail [px over shot 16_preview_modal 116,812 B].
So on this device the WebView's own viewport handling is currently doing the scaling, and I could not force the failure. **But the mechanism the owner is describing exists in the code and is documented as a defect**: the page is authored at a fixed **794 px** (`cv-html.ts`: `<meta name="viewport" content="width=794">`), and the *new, untracked* `apps/native/src/lib/cv-engine/fit.ts` says of the pre-fix state: *"until this file existed, nothing in the app did that scaling. The only thing standing between the user and **a left-hand slice of an unscaled 794px page** was the WebView's own handling of viewport width=794 — i.e. Android's useWideViewPort / loadWithOverviewMode defaults, behaviour the app never set and cannot rely on."* The shipped bundle contains **neither `fitSheet` nor `MIN_FIT_SCALE` (0 hits)** [bundle] — i.e. the deterministic fit is **not in this build**, and whether a user sees a clipped left slice depends on the WebView default on their device. That is the honest split: **not reproducible here, not defended in the build**.

### Does choosing a template confirm anything? — **NO, not in this build**
I tapped the `Apex` card and the sheet re-rendered into the detail view with the `Tumia muundo huu` button; after tapping the button band (twice) I got **no toast, no banner, no navigation, no visible change** — the sheet closed back to Home with nothing said (and with a healthy session there is no in-app state to inspect). [shots 30/31/32/33] The confirmation the owner asked for exists in source: `978b25c` §6 *"after choosing templatehub template user should get some feedback — new toast primitive… One honest line per scope: this CV / your profile default / the CV you're creating."* **Not in the build.**

---

## 6. OUTPUTS — produced and verified at the receiving end

| Output | Result | Evidence |
|---|---|---|
| **CV → PDF (`Pakua` on the CV card)** | **Works.** Tapping it opened the Android share sheet titled **`Sharing 1 file`** with the file named **`QA Sweep 2026Mwaka CV.pdf`** — i.e. a real PDF was produced, with the CV's name as the filename, and handed to be shared/saved. `topResumedActivity` became `com.android.intentresolver/.ChooserActivityLauncher` | [dump] 11_after_pakua.xml ("Sharing 1 file" + the filename), [shot 11_after_pakua 253,058 B] |
| Where the PDF lands | **NOT in `/sdcard/Download`.** `ls -l /sdcard/Download` before and after is byte-identical — nothing was written there. The button says **`Pakua`** ("Download") but the behaviour is **share** (`expo-sharing` `shareAsync` into the OS sheet). A user who taps "Download" is not given a download; they are given a chooser. | [shell] `ls -l /sdcard/Download` ×2 |
| PDF size / contents | **not measurable from the app side**: the file lives in the app's private cache behind a FileProvider URI, the build is a **release** build (`run-as` unavailable), and `adb` cannot read the private cache. I did **not** send it anywhere (that would have posted the owner's CV into one of his WhatsApp chats). Reproducible follow-up: pick *Files/Drive* in the chooser and read the size there. |
| Editor `Pakua PDF` (footer button of the editor) | Same code path as the card's `Pakua` (`expo-print` → `pdf-export` → named file → `Sharing.shareAsync`); I exercised the card path and left it at that | [src] `services/pdf-export.ts`, `job-apply-screen.tsx:133` |
| **Cover-letter / job-application share** | Not exercised end to end: it sits behind `Omba kwa ujanja` / an application record, and (a) the snap primary button would not fire, (b) the AI backend was down. Present in source as `Share.share({message: coverLetter})` and a named-PDF `shareAsync` | [src] `application-detail-screen.tsx:248`, `job-apply-screen.tsx:95,123-133` |
| **Share a profile/invite link (`Mwalike rafiki`)** | Screen reached from Profile; the share call is `Share.share({message: inviteText(url)})` + a `referralShared("link")` ping. I did **not** fire the share (it would message a real contact) | [src] `invite-screen.tsx:36-37` |
| "Share link" for a CV | **No such output found** in the native app (no share-link/URL export for a CV; outputs are PDF + text share + invite link) | [src] grep of `apps/native/src` for `Share.share`/`shareAsync` |

---

## 7. THE REST OF THE SYSTEM

| Surface | What rendered | Verdict |
|---|---|---|
| **Home (Nyumbani)** | Greeting `Habari za jioni,` → later `Habari za usiku,` (time-aware), name, a rotating signal card (`IMEPENDEKEZWA 1/5`, `Pendekezo lingine`, `Ona miundo`), the two big cards (`Ona CV zangu` with live count, `CV mpya` / `Tumia wasifu kuanza →`), `Shughuli za haraka` 2×3 grid (AI ya kazi, Tafuta kazi, Ukaguzi wa ATS, Maombi, Barua ya maombi, TemplateHub), `CV za hivi karibuni` | ✅ renders, counts are live; the signal card followed my new CV within one relaunch |
| **ATS check (`Ukaguzi wa ATS`)** | Full page: score **15/100**, verdict `Hatari kubwa`, note *"Alama hapa chini hupima kilichomo kwenye CV — kwa sasa ni jina lako pekee…"*, sub-scores `USOMAJI 31`, `ULINGANIFU WA KAZI 0`, `ATHARI 0`, `MAUDHUI 22`, and a `Rekebisha haya` list (contact info, summary 60+, photo, 8+ skills, experience, education, action verbs). It states it is local: *"Hakuna AI, hakuna kinachotumwa popote."* | ✅ works, and it is genuinely local (it scored my CV without the AI backend that was down). Copy/explainer items in `978b25c` (see §11) are the owner's follow-up on this page |
| **Jobs (`Tafuta kazi`)** | Opens `Ajira` / `Nafasi kwako`, a completeness nudge (`Ongeza kazi yako ya kwanza upate ulinganifu` → `Kamilisha wasifu`), `Nafasi zote`, then real listings — first row **`Sales Officer job` · `CCBRT · Tanzania`** | ✅ works [shot 40_jobs 290,122 B]. Note the title still reads **`Nafasi kwako`** — the source now says `Nafasi za kazi kwako` (`978b25c` §1) |
| **Applications (`Maombi`)** | Empty state `Ongeza ombi lako la kwanza` + `Ongeza ajira` and `Tafuta ajira za kuomba` | ✅ opens, no records to read |
| **Cover letter (`Barua ya maombi`)** | Routes to the same `Omba kwa ujanja` surface (mode selector `Lenga CV yangu / Barua ya maombi / Zote mbili`), empty field, `0 herufi` | ⚠️ surface works, generation not drivable (AI down + button issue) |
| **Help / FAQ (`Msaada na Maswali`)** | `Msaada` → `Maswali ya mara kwa mara` → `Majibu ya haraka… Gusa swali ili kulisoma.` with four questions: *Ninawezaje kuchanganua au kuleta CV yangu?* · *Alama ya ATS inafanyaje kazi?* · *Je, taarifa zangu ni salama?* · *Ninawezaje kuhamisha CV yangu kama PDF?* | ✅ opens and is populated [dump] v_msaada.xml |
| **Learning / lessons** | Not reached in this pass — no tab or Home card leads to it in this build's visible navigation; it is a source screen (`learning-hub-screen.tsx`, modified in the working tree) | ⚠️ NOT VERIFIED |
| **Settings** | Everything settings-like lives on the Profile tab (dark mode, language, notifications, clear data, version) | ✅ dumped (§3) |
| **Premium (`Miundo ya hali ya juu na kozi za kina`)** | Row present on Profile; the gallery's locked cards (`Kiongozi`, `Fupi`, padlock icons) are the paywall surface | ⚠️ not opened (would need a purchase flow) |
| **PDF tools** | A whole `pdf-tools-screen.tsx` exists in source (print + `shareAsync` with dialog title `Hifadhi au shiriki PDF`); no entry point was reachable from Home/Profile in this build | ⚠️ NOT VERIFIED on device |

---

## 8. CRASHES AND ERROR LOGS

- **`logcat -d -b crash` for `pro.sumaiya.app`: zero entries all evening** — no `FATAL EXCEPTION`, no ANR. The only crash-buffer content ever observed was the unrelated 19:31:25 vendor sensors-HAL SIGABRT ([logcat], full backtrace captured).
- **`ReactNativeJS`: 0 lines** (release build strips console) — so JS-side errors are invisible by design. Every JS failure above is reported from the **screen**, which is the ground truth here.
- **The app process died once at 21:02:12 and it was NOT a crash.** ActivityManager logged `Killing … (adj 905): remove task` for **eight** apps in the same second (VLC, taxsee, dialer, WhatsApp Business, Chrome + its sandboxes, Messages) — a task-removal event, not a fault of ours; `pro.sumaiya.app` was among the tasks removed. After relaunch the app came back signed in with the CV intact (§4a). Logged consequence for QA: local screen state (the editor draft) is gone after that.
- **The one error message the user actually sees** is the mapped 502/503/504 line, and it is the **third-person** copy in this build: `Sumaiya ana shughuli nyingi sasa hivi. Jaribu tena baada ya muda mfupi.` [screen, twice + twice in import] — the shipped bundle carries `Sumaiya ana shughuli nyingi` and **not** `Nina shughuli nyingi` [bundle].
- **Server side, probed from the host at the same time:** `https://sumaiya.app/api/health` → **200** (0.39 s) and `https://sumaiya.app/api/app/update` → **200** (0.96 s). So the origin was up while the app's AI paths were returning the 502/503/504 branch. That is stated as an observation, not a root cause: the app cannot tell me which of 502/503/504 it received (no logs), and the two sibling agents own the live web — if their web chat also fails, the fault is server/provider-side; if the web chat works while the Android app fails, this is app-side.

---

## 9. REAL DEFECTS IN THE SHIPPED BUILD (what a user hits today, 1.6.24)

1. **Importing a CV (the product's core flow) fails: `Imeshindwa kupiga hiyo` after ~75 s, twice.** Staged progress for ~55 s then the 502/503/504 branch, on a clean 1240×1754 image of a real CV. [two timed runs, dumps + screenshots]
2. **The AI chat fails the same way, twice, ~4 minutes apart.** No answer is ever produced; the user gets "I'm busy right now". [dumps 20_chat_reply, 21_chat_retry]
3. **CV editor shows a redundant `Badilisha picha` control on top of a photo that is itself the control** (photo + `Badilisha picha` + `Ondoa`). Owner-reported, reproduced. Fixed in source (`978b25c` §4), **not in this build**.
4. **A language row in the templates spreads label/level to opposite edges** — measured: label x≈92, level x≈428 inside a 446 px card in the gallery's sidebar layouts (`Athens`, `Atlanta`), which reads as two unrelated fragments. Fixed in source (§10/§11), **not in this build**.
5. **Choosing a template gives no confirmation at all** — no toast, no navigation, no state (owner explicitly asked for feedback). The toast primitive exists in source (`978b25c` §6), **not in this build**.
6. **The snap-to-apply primary button (`Lenga ajira hii`) did not fire in three attempts**, mutating the job-ad text instead (counter 2335→2339→2340). Consequence: on this build I cannot confirm the snap/tailor flow runs at all. Not reproducible with certainty as "broken" — it is *unfired*, and that is enough to report because the surface's only action did nothing.
7. **`Pakua` (Download) on a CV opens a share chooser and writes nothing to Downloads.** Label vs behaviour mismatch; a user hunting the PDF in Files will not find it. [`ls -l /sdcard/Download` identical before/after]
8. **No way to sign out with a healthy session.** The Profile screen has no sign-out row in this build (source has one at `profile-screen.tsx:442`, unchanged since 09-09), so sign-out only appears when the app thinks your session expired.
9. **`Toleo 1.6.24` is the last honest row** — good to note it *does* display the version, which made the baseline check trivial.
10. **In-place copy defects the owner has flagged and the build still ships:** `Nafasi kwako` (Jobs title), `Rangi ya mwangaza` (six colour swatches in the editor preview — should read `Rangi ya msisitizo`), `Msaada na Maswali` (Help row — should read `Maswali ya kawaida`), plus the third-person busy line. All corrected in source, none in this build.

## 10. ALREADY FIXED IN SOURCE BUT STILL IN THIS BUILD

The build is 1.6.24 of 10:12. Everything below is **on disk and not on the phone** — the owner's phone cannot show it until he clears a build. Prove-it check used throughout: the shipped `assets/index.android.bundle` (md5 `136f5699f0c0`) has **0** hits for the new strings and **1** hit for the old ones.

| # | Defect on the phone | Fix in source | Status | Proof it is not in the build |
|---|---|---|---|---|
| 1 | Busy/error line in third person: `Sumaiya ana shughuli nyingi sasa hivi.` | `cb29d9f` (11:12) → first-person `Nina shughuli nyingi sasa hivi.` | **committed** | [bundle] `Nina shughuli nyingi` 0, `Sumaiya ana shughuli nyingi` 1 — and the screen shows the old wording |
| 2 | Help row `Msaada na Maswali` + word-for-word sublabel | `cb29d9f` (11:12) → `Maswali ya kawaida` + `Jinsi ya kupakia, kukagua alama na kupakua` | **committed** | [bundle] `Maswali ya kawaida` 0, `Msaada na Maswali` 1; [dump] profile row still reads the old pair |
| 3 | Redundant `Badilisha picha` beside a set photo | `978b25c` §4 (21:18) — *"the photo is now the control … the separate button/text-link is gone once a photo exists"* | **committed (21:18, while this sweep ran)** | [dump] 06_newcv/12_reedit show photo + `Badilisha picha` + `Ondoa` |
| 4 | Languages row spread label/level apart | `978b25c`-adjacent work: old markup was `justifyContent: "space-between"`; the working tree adds a dotted leader + `flex` column (`cv-engine/sections.ts` +28, `cv-html.ts` +32) | **working tree, uncommitted** | [dump] pixel positions in §5(i); [bundle] old markup shipped |
| 5 | TemplateWebView scaling not deterministic → possible left-slice of an unscaled 794 px page | new `apps/native/src/lib/cv-engine/fit.ts` (`fitSheet`, `PAGE_W=794`) — *untracked* file | **working tree, uncommitted** | [bundle] `fitSheet` 0, `MIN_FIT_SCALE` 0 |
| 6 | No feedback after choosing a template | `978b25c` §6 — new toast primitive, one line per scope | **committed (21:18)** | [device] tapping the template produced no confirmation; [bundle] gallery has no toast primitive for this |
| 7 | Camera asked from three call sites, three behaviours, two of which silently no-op on refusal | `978b25c` §3 — `lib/permissions.ts` (one prompt/session, blocked vs refused, plain-Swahili reason, real alternative), 6 anti-nag tests, `permissions.test.ts` +103 | **committed (21:18)** | [device] the build still shows the per-entry camera gate; [src] `lib/permissions.ts` rewritten |
| 8 | `Nafasi kwako` (Jobs title), `Rangi ya mwangaza` (colour swatches), CV appearance copy | `978b25c` §1/§2 — 28 job-sense `nafasi` made explicit, `Muundo chaguo-msingi wa CV`, `Rangi ya msisitizo`, template names Asili/Kisasa/Safu Pembeni, + a closed-set lint guard in both apps | **committed (21:18)** | [dump] Jobs title `Nafasi kwako`; [dump] six `Rangi ya mwangaza` swatches in `Onyesho` |
| 9 | ATS page explains nothing in plain language | `978b25c` §7 — plain-language block at the top, no "ATS" in Swahili | **committed (21:18)** | [dump] page shows the old two-line explainer |
| 10 | Sign-in code length (web accepted 6) | `c73992a` (18:37) + `7ef4c4d` (18:42) seam test — one declaration, 8 digits, both surfaces | **committed** | Native was already correct at 8; **the app is not the broken side** |
| 11 | Gallery not smooth (36 WebViews mounted, re-filtering 218 designs on the JS thread) | `978b25c` §5 — `useDeferredValue`, 2 thumbnail rows instead of 4 (36→18 WebViews), Reduce Motion respected | **committed (21:18)** | [device] the build's gallery dump alone weighs 170 kB / 338 nodes; I did not measure frame timing, so "smoothness" stays unverified either way |

**The distinction the owner needs, in one line:** items 1–3, 6–11 were fixed today **between 11:12 and 21:18** and are *committed*; items 4–5 (the template fit and the languages row) are fixed **only in the working tree, uncommitted**; and none of the eleven is on his phone, because the phone runs a 10:12 build.

## 11. WHAT I COULD NOT DRIVE (and why)

1. **Onboarding / first run and the sign-in screen** — the device holds the owner's live session; the only route in is signing out, and re-entry needs an OTP only he can read. I did not lock him out.
2. **A system permission "deny"** — I took the in-app alternative (`Chagua kutoka kwenye picha badala yake`) instead of refusing the camera dialog. So the pre-fix "tap Camera, refuse, nothing happens" behaviour is reported from source, not from my own fingers.
3. **Typing into the 8-digit code field** — same lock-out reason.
4. **The snap-to-apply run itself** — the primary button would not fire (§4d). Not "the flow is broken" but "**the flow did not start**, three tries, text mutated instead".
5. **The PDF's bytes/size** — it lives in the app's private cache in a **release** build (no `run-as`) and I refused to send the owner's CV to a real contact to inspect it. The share sheet proves a named PDF exists; its size is not verifiable from adb.
6. **Left-behind state on the device:**
   - one CV now exists on his account: **`QA Sweep 2026Mwaka`** (saved to the server, 14/100 ATS score; contains a real photo and the name). It is his to delete (`Futa` on the CV card) — I did not delete it because deleting is destructive and he asked for a CV to be made.
   - the snap-to-apply draft's job text is 5 characters longer than I found it (2335→2340, from my tap attempts).
   - pushed test fixtures (`/sdcard/Download/qa-cv-*.pdf`, `/sdcard/Pictures/qa-cv-fixture.png`) were **removed** at the end.
   - animation scales were set to 0 for dump reliability and **restored to 1** (verified: all three read `1`).
   - the app was left on the CV list screen; the session was never signed out.
7. **Sibling-agent note:** at 21:18 — mid-sweep — `HEAD` moved from `97fa706` to `978b25c` and other native files changed under me. Everything I report as "in source" is at `978b25c` unless said otherwise; the **71 other uncommitted entries** in the tree (motion workstream) were left untouched, and I staged only this document.

---

## 12. EVIDENCE INDEX (this sweep's artifacts, on disk, untracked)

```
.qa-tmp/shots/
  01_launch 210779  02_profile 233991  03_profile_avatar 234335  04_career_profile 190813
  05_cvlist 96875   06_newcv 207000    08_saved 215739          09_cvlist_after 215173
  10_cvlist_persist 88963            11_after_pakua 253058     13_relaunch_home 211074
  14_preview 284662 15_after_back 216761 16_preview_modal 116812 17_fullscreen_preview 74015
  18_chat 82168     19b_chat_sent 107285 20_chat_reply 107265   21_chat_retry 128173
  22_import 96198   23_import_picker 2074709 24_picker2 1840086
  26_import_t15/35/55/74  79812/79078/78155/103520  27_retry_t15..75 (same shape)
  29_gallery 309900 30_gallery_tap 126792  31/32/33 apply attempt  36_snap_w25/50/80
  40_jobs 290122    41_barua 130231
.qa-tmp/*.xml    (uiautomator dumps named in the tables above)
.qa-tmp/shipped-bundle.js  (6,901,560 B — assets/index.android.bundle unzipped from the 10:12 APK)
```

*Report generated on the device, at `978b25c` in the repo, from build 1.6.24 (versionCode 10624) on a Pixel 8 Pro.*
