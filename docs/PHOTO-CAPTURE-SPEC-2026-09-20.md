# Guided profile-photo capture — camera, live guides, AI adjustment (all versions)

**Date:** 2026-09-20 · **Status:** PROPOSAL, ready to implement · **Author:** research agent (not a
native Swahili speaker — every Swahili string here is a proposal for Hamis to approve, per
`docs/SWAHILI-STANDARD-2026-09-20.md` §3)

**The ask (verbatim):** *"thought a take profile picture and AI adjust so camera and guides for a
good profile photo feature research and add to list for all versions"*

**What already exists (do not rebuild):** a CV photo is supported end-to-end since commit `12f2d9f`.
`apps/web/lib/photo-upload.ts` owns the whole client pipeline — 12 MB source cap, EXIF-aware decode,
centre-crop via the pure `computeSquareCrop`, 600px square, JPEG q0.82, 400 KB stored ceiling.
`apps/web/components/editor/cv-editor-client.tsx:2056-2115` is the current upload/change/remove
control with its consent note. `apps/native/src/lib/pick-photo.ts` is the native counterpart
(gallery-picker only). Nothing in either path takes a photo **in the product**, and nothing helps
the user take a **good** one.

**The five decisions this document makes, up front:**

1. The capture surface is new; the compress/crop/store pipeline is **not** — every capture route
   feeds the *same* `downscalePhotoFile()` (web) / `compressPhotoUri()` (native) path.
2. All guides are **advisory**. There is no state in which the shutter is disabled. Every hint is
   one plain-Swahili line, one at a time.
3. **Nothing about the face is ever edited** — no smoothing, no slimming, no whitening, no skin-tone
   shift. The adjustment is background, exposure, white balance, straighten, crop. The original is
   kept and every change is a toggle with a Swahili explanation.
4. The product AI (`deepseek-flash`, which **does** have Vision — verified below) can *critique* a
   photo and explain it in Swahili; it **cannot produce an edited image**. Pixel edits need an
   image pipeline: canvas on web (free, offline), `expo-image-manipulator` + optionally a hosted
   matting model on native.
5. Default to **on-device** everything. A 400 KB upload per adjustment is a real cost on metered
   Tanzanian data; off-device send is opt-in, consented, and rare.

---

## 0. Repo facts this spec is built on (file:line)

| Fact | Evidence |
|---|---|
| Web photo pipeline, caps and reasoning | `apps/web/lib/photo-upload.ts:28` (12 MB), `:35` (600px), `:39` (q0.82), `:44` (400 KB), `:95-113` (`computeSquareCrop`), `:191-231` (`downscalePhotoFile`) |
| Pure crop arithmetic is deliberately DOM-free so it is unit-testable | `apps/web/lib/photo-upload.ts:22-23`, test at `apps/web/lib/photo-upload.test.ts` |
| Editor photo control + bilingual consent note | `apps/web/components/editor/cv-editor-client.tsx:2056-2115` (upload at `:2070-2099`, remove at `:2101-2106`, consent note at `:2108-2115`) |
| Native photo path (gallery only, 400px wide, q0.7) | `apps/native/src/lib/pick-photo.ts:44-47`, `:60-67` |
| Native CV editor photo control | `apps/native/src/screens/cv-editor-screen.tsx:268-291`, `:537-556` |
| Native camera capability that exists today | `expo-camera ^57.0.4` (`apps/native/package.json:29`), used as `CameraView` + `useCameraPermissions` in the document-scan screen: `apps/native/src/screens/app/scan-screen.tsx:5`, `:20`, `:125` (`facing="back" enableTorch={torch}`), capture at `:28-42` |
| `expo-image-manipulator` already a dependency (geometry-only edits available on-device, offline) | `apps/native/package.json:32` |
| Shared pure-logic package both apps import | `packages/utils/src/*` + `packages/utils/package.json` exports map; web resolves it via `apps/web/tsconfig.json` `paths` `@sumaiya/utils`, native via `"@sumaiya/utils": "file:../../packages/utils"` |
| Precedent for one pure module tested from both apps' runners | `packages/utils/src/cv-shape.ts` → `apps/web/lib/cv-shape-boundary.test.ts` + `apps/native/src/lib/cv-shape.test.ts` |
| Web tests | vitest, co-located `apps/web/lib/*.test.ts` (39 of them) |
| Native tests | jest + `jest-expo` (`apps/native/jest.config.js`), `@sumaiya/*` deliberately not in `transformIgnorePatterns` ignore list |
| Native app is a prebuild (has `android/`), not Expo Go | `apps/native/android/**` present; `expo run:android` in `apps/native/package.json:6` |
| Swahili copy is lint-guarded (banned words, ATS naming, malformed verbs) | `apps/web/lib/swahili-lint.test.ts` (guard table, 7 audited classes), mirrored in `apps/native/src/lib/swahili-lint.test.ts` |
| Cross-border AI transfer is already an open compliance item | `docs/ai-memory-disclosure.md` — PDPA 2022 Part V: *"we send data to DeepSeek abroad"*, and s.23(2): notice **before** collection |

---

## 1. Research — what the world actually does (with citations)

### 1.1 LinkedIn: the pop-market baseline

Fetched live 2026-09-20 from LinkedIn Help:

- LinkedIn's own photo *rules* are about **likeness, not aesthetics**: the photo "must reflect your
  likeness"; LinkedIn removes photos that consist solely of company logos, emojis, landscapes,
  animals, words/phrases, flags, baby photos, or other people's likenesses (including stock
  imagery). Illustrations/caricatures are allowed.
  <https://www.linkedin.com/help/linkedin/answer/a1377087/profile-photo-guidelines-and-conditions>
- LinkedIn's own photo *funnel data* claim: a profile with a picture is **14× more likely to be
  viewed**. <https://www.linkedin.com/business/talent/blog/product-tips/tips-for-taking-professional-linkedin-profile-pictures>
  (that page returns 403 to automated fetch; the quote is from the search snippet that reproduces
  the LinkedIn sentence — treat as LinkedIn's own unverified claim, not a measured fact.)
- The widely repeated **"face should fill ~60% of the frame"** framing advice is *third-party*
  career-services material, not a LinkedIn requirement. Example: Illinois Institute of Technology
  LinkedIn guide, *"Make sure your face takes up at least 60% of the frame."*
  <https://www.iit.edu/sites/default/files/2021-09/linkedin_guide.pdf>

**Takeaway for Sumaiya:** the market baseline for a *profile* photo is "recognisably you, face
reasonably large, neutral uncluttered background". That is a mild constraint — much milder than
what follows — and it is the right ambition for a CV photo.

### 1.2 Photoroom / Canva-style background cleanup: what the category actually sells

- **Photoroom** is a subscription app (Free → Pro → Max → Ultra) plus a developer API metered per
  image; third-party pricing summaries put the Remove Background API at **~$0.02/image** (after a
  reported 90% cut) and generative edits at ~$0.10. Sources are aggregator pages, not Photoroom's
  own: <https://usagepricing.com/blueprint/photoroom> ·
  <https://aivario.com/tools/photoroom>. Photoroom's own pricing docs page returned **HTTP 403** to
  automated fetch, so the $0.02 figure is **unverified against the vendor**.
- **remove.bg** — official API page, fetched live: *"Your first 50 API calls per month are on us"*;
  rate limits 50 or 250 images/minute; up to 50 MP.
  <https://www.remove.bg/api> Third-party summaries put pay-as-you-go at **~$1/image** and Lite
  subscriptions from ~$9/mo: <https://comparedge.com/tools/remove-bg/pricing>. **Rejected on cost.**
- **Replicate, `851-labs/background-remover`** — official model page, fetched live: *"This model
  costs approximately $0.00045 to run on Replicate, or 2222 runs per $1"*. That is the realistic
  paid fallback: **~$0.45 per 1,000 photos**, i.e. two orders of magnitude under remove.bg.
  <https://replicate.com/851-labs/background-remover>
- **On-device is real and small.** Measured today with `curl -I` against the official MediaPipe
  model store (byte-exact, not a quote):
  - BlazeFace short-range face detector: **229,746 bytes (~224 KB)**
    <https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite>
  - MediaPipe selfie segmenter: **249,537 bytes (~244 KB)**
    <https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite>
  A 244 KB matting model is a *download-once, works-offline* background normaliser — for a product
  whose users are on metered data and whose phones are cheap, that matters more than the extra
  quality a server model buys.
- **The heavyweight browser option to avoid:** `@imgly/background-removal` ships its ONNX model at
  **"small (~40 MB)"** (its own npm README) <https://www.npmjs.com/package/@imgly/background-removal>.
  40 MB on a metered Tanzanian connection is not a feature, it is a denial of service.
- **Canva** offers a one-click Background Remover in-browser (subscription), i.e. the mainstream
  expectation is now "tap once, background gone". That expectation is worth *meeting*, not
  exceeding.

### 1.3 Passport / visa tools — the strictest version of this problem (and the limits of editing)

This is where the industry is most prescriptive, and where the lesson is a **prohibition**:

- **US Department of State** (fetched live): one colour photo, taken in the last 6 months, "clear
  image of your face", **"Do not change your photo using computer software, phone apps or filters,
  or artificial intelligence"**, face the camera without tilting your head, no eyeglasses, white or
  off-white background without shadows, uniform lighting — overhead or far-off-side lights "can cast
  shadows on your face", "lighting that is too bright may cause your image to be overexposed, while
  lighting that is too dim may make it underexposed". Size 2×2 in (51×51 mm) with the head
  1–1⅜ in (**25–35 mm**) chin-to-crown, i.e. the head is **~49–69% of the photo height**.
  <https://travel.state.gov/content/travel/en/passports/how-apply/photos.html>
- **UK HMPO** (fetched live): digital photo at least 600×750 px, 50 KB–10 MB, "unaltered by computer
  software", plain light-coloured background, no shadows, no red eye; for self-taken photos
  "include your head, shoulders and upper body — **do not crop your photo, it will be done for
  you**". <https://www.gov.uk/photos-for-passports>
- **Religious headwear is explicitly protected** in both rule sets: US — a hat/head covering may be
  worn for religious purposes provided the full face is visible with no shadows or blocked parts and
  the covering is one colour without patterns or holes (travel.state.gov, above); UK — head covering
  permitted for religious or medical reasons (gov.uk, above).
- **The ICAO 35×45 mm convention** wants the face (chin-to-crown) at **32–36 mm of a 45 mm photo ≈
  70–80% of frame height**. Cited from a commercial ID-photo tool that tabulates the standard
  (<https://id-wizard.com/en/blog/passport-photo-head-size-guide>) — the primary ICAO Doc 9303 Part 3
  text could not be fetched from here, so treat the exact 70–80% band as **secondary-sourced**.
- Related: commercial passport-photo tools (PhotoAiD, id-wizard, Persofoto, ID Photo Maker)
  universally ship: an oval/rectangle face guide, "eyes in this band", a background-uniformity check,
  and an auto-crop to the id format. **That UI pattern — overlay + one instruction at a time — is the
  proven shape of this feature** and is what §2 specifies.

**The prohibition that becomes a product rule:** identity documents forbid AI-altered photos. A CV
photo is not an identity document — but Tanzanian public-sector applications route through the
Ajira Portal, which demands a *passport-size* photo (§1.4), and passport/visa applications demand an
unaltered one. So the app must (a) never alter the face, and (b) tell the user, in Swahili, that for
passport/visa/Ajira uploads they should use **"Tumia picha ya awali"** (use the original) rather than
the adjusted version.

### 1.4 Tanzania: the real, checkable demand

**Tanzania's Public Service Recruitment Secretariat (PSRS) application conditions, quoted verbatim
from the official announcement PDF on ajira.go.tz** (fetched live today, `pdftotext` of the
Tanzanian government's own advert):

> *"vii. An applicant must upload recent Passport Size Photo in the Recruitment Portal"*

<https://www.ajira.go.tz/baseattachments/advertisementattachments/20240803301953TANGAZO%20LA%20NAFASI%20ZA%20KAZI.pdf>

That single sentence is the strongest Tanzania-specific justification for this feature: for public
service applications — the largest formal employer in the country — a *passport-size* photograph is
**mandatory on upload**, and the portal gives the applicant no tool to produce one. A guided capture
with a face-size guide and a straighten guide is exactly the tool the condition presumes.

Honest limits on the Tanzanian evidence: the platforms that would show *private-sector* practice are
unreachable or foreign-owned. `docs/SWAHILI-STANDARD-2026-09-20.md` §2 already records the same
finding — BrighterMonday Tanzania is dead (301 to an unrelated business), Fuzu returns 403,
ZoomTanzania's successor loads mostly in English. **Do not state a Tanzanian private-sector
photo-requirement statistic; none is verifiable from here.** The defensible statement is: public
service (Ajira Portal) requires a photo; private employers vary, so the photo stays optional in the
product (which is what `cv-editor-client.tsx:2108-2115` already says).

### 1.5 The Gulf — where the photo is expected (the growth path)

- **Bayt.com**, the largest MENA job site, has a house position: a photo "may be appropriate in the
  GCC" in customer-facing roles such as hospitality, sales, cabin crew or media.
  <https://www.bayt.com/en/blog/32214/should-you-put-your-photo-on-your-cv-in-the-gcc> — **Cloudflare
  blocked automated fetch** (verified: the response is a `Just a moment...` challenge page), so this
  is snippet-level evidence, not a full read. Flag it as such.
- UAE government / semi-government channels (Dubai Careers, TAMM, FAHR) reportedly expect a photo as
  part of initial eligibility screening — <https://www.labeeb.ae/should-you-include-photo-nationality-visa-status-on-a-uae-government-cv>.
  This is a **commercial career-advice site**, i.e. marketing content: directional, not authoritative.
- Gulf CV-format guides are near-unanimous that a professional photo is standard in GCC markets and
  that this inverts US/UK convention:
  <https://www.applyvita.com/resume-format-guide/gulf> ·
  <https://tailormycv.app/blog/gcc-expat-cv-guide-2026> ·
  <https://saudiexpatguide.com/salary-finance/cv-for-saudi-jobs> · all commercial guides.
- The counter-evidence that must temper the copy: **a photo can cost a candidate too.** Peer-reviewed
  experimental evidence exists that appearance/religious practice changes callback decisions — a CV
  headscarf experiment (J. Labour Market Research, doi
  [10.1186/s40172-018-0071-x](https://doi.org/10.1186/s40172-018-0071-x)) — and that ethnic-minority
  applicants strategically *omit* photos depending on the majority norm (Oxford Review of Economic
  Policy, doi [10.1093/oxrep/grae032](https://doi.org/10.1093/oxrep/grae032)). Automated screening
  also tends to strip images entirely, which is why a photo is never a substitute for a plain-text
  CV (commercial source, low weight:
  <https://atsverification.com/blog/ats-resume-uae-job-applicants/>).

**Conclusion for the copy:** the photo is a **market-specific choice, presented as a choice** —
"Gulf countries often expect one, but it is never required of you" is already the shipped note
(`cv-editor-client.tsx:2112-2115`) and is the right register. Nothing in the new feature may imply
that a photo is globally required.

### 1.6 What is appropriate for a Tanzanian jobseeker — and what is NOT

**Appropriate (ship it):**

| Do | Why |
|---|---|
| Guided capture with a face oval, distance hint, lighting hint, straighten cue | The proven passport-tool pattern (§1.3); Ajira Portal requires a passport-size photo with no tooling (§1.4) |
| Plain-wall / plain-background normalisation offered as an *option* | Removes the single most common defect in home photos without altering the person |
| Everything on-device by default, works offline, download-once models measured in hundreds of KB | Cheap Android front camera, metered data (§0, §1.2 measurements) |
| Keep the photo optional and keep saying so | Private-sector demand is unverifiable here; peer-reviewed evidence says a photo can hurt (§1.5) |
| Say, in Swahili, that passport/visa/Ajira uploads should use the unaltered original | Identity documents forbid AI-altered photos (§1.3); Ajira wants a passport-size photo (§1.4) |
| One instruction at a time, in the language the user reads | Same reason the whole product is Swahili-first |

**NOT appropriate (do not build, do not write):**

| Don't | Why |
|---|---|
| Any face alteration: skin smoothing, blemish removal, eye/teeth whitening, jaw slimming, skin-tone shift | Changes identity; the US explicitly forbids AI-altered photos for identity documents (§1.3); and it is the one change a recruiter compares against the interview |
| Telling users to remove a hijab, kofia, or any religious covering — or "religious dress is fine, but…" framing | US and UK rules explicitly permit religious headwear with the full face visible (§1.3). Tanzania includes a large Muslim population (Zanzibar is overwhelmingly Muslim); this instruction would be offensive and wrong |
| Western studio-headshot dogma: shirt-and-tie, "smile with visible teeth", studio backdrop | That advice comes from US tech-market career blogs (e.g. capturely.com — marketing content) and is unattainable for most users; a clean phone photo against a plain wall clears the actual bar (§1.1) |
| Requiring a *white* background (ID-photo strictness) for a CV photo | Unattainable at home; ID rules are being borrowed where they don't apply — offer background normalisation instead |
| A "professional example" photo of a white/foreign model | Sets an aspirational target the user is not; use a neutral illustration |
| Any claim that a photo is required for Tanzanian private-sector jobs, or statistics on "X% of recruiters" | Unverifiable from here (§1.4); inventing a number is the one thing that would make this document worthless |
| Auto-editing, auto-uploading, or editing the stored photo without an explicit tap | PDPA s.23(2) wants notice *before* collection, and a face is personal data (§0); silently editing a face is unacceptable to the owner in plain terms |
| Shipping the Swahili strings below as final | Not one of them is written by a native speaker; the owner reviews them (Swahili standard §3) |

---

## 2. Live guides — exact specification

### 2.1 The screen, in one picture

```
┌──────────────────────────────┐
│  Piga picha ya wasifu    ✕   │   ← sheet title, close top-right
│                              │
│      ╭──────────────╮        │   ← face oval (guide, 2px, white 80%)
│     ╱   ·      ·     ╲       │      · eye-line ticks (headroom cue)
│    │     ┌──────┐     │      │   ← head-size box: dashed inner guide
│    │     │ face │     │      │      (your head should fill this)
│     ╲    └──────┘    ╱       │
│      ╰──────╥───────╯        │   ← chin/shoulder line
│             ╨                │
│  Nyuma yako kuna vitu vingi. │   ← ONE plain-Swahili hint line (max 2 lines)
│  Tafuta ukuta safi.          │
│                              │
│  [taa]        ⟳      [Piga]  │   ← torch / switch camera / shutter (always enabled)
│  ────────●───────────        │   ← live "readiness" bar (advisory only)
└──────────────────────────────┘
```

Rules that make this implementable rather than aspirational:

- **Exactly one hint at a time**, chosen by the priority order in §2.3. A stack of simultaneous
  complaints is how guidance becomes noise.
- **The shutter is never disabled.** No guide state blocks capture. (Passport tools do block; a CV
  photo does not deserve that, and a blocked shutter on a first try is how a feature gets abandoned.)
- **The readiness bar is a courtesy, not a gate**: pass/warn per check, no score out of 100, no
  "9/10 professional".
- **Nothing is uploaded to render a guide.** All measurement is local.

### 2.2 The measurement contract (what the guides are computed from)

One pure function, one input shape, no DOM — so it is unit-testable in this repo's node-only vitest
environment exactly like `computeSquareCrop` is (`apps/web/lib/photo-upload.ts:22-23`).

```ts
// packages/utils/src/photo-guides.ts  (shared: web + native import this)
export interface FaceBox { x: number; y: number; w: number; h: number }   // normalised 0..1
export interface FrameStats {
  face: FaceBox | null;        // null = no face detected this tick
  rollDeg: number | null;      // in-plane head tilt, +ve = clockwise, from the eye line
  yawRatio: number | null;     // |d(nose,leftEye) - d(nose,rightEye)| / face.w, 0 = frontal
  faceLuma: number;            // 0..255 mean luma of the face ROI
  bgLuma: number;              // 0..255 mean luma of the frame MINUS the face ROI and a 10% margin
  leftLuma: number;            // 0..255 mean luma of the left half of the face ROI
  rightLuma: number;           // 0..255 mean luma of the right half of the face ROI
  deviceRollDeg: number | null;// device tilt in degrees, from the orientation sensor (phone only)
}
export function evaluateGuides(s: FrameStats): GuideResult;
export interface GuideResult {
  hint: GuideHint;             // see the table
  severity: "ok" | "warn" | "tip";
  sw: string;                  // the ONE Swahili line to show
  en: string;                  // for the English UI mode
}
```

Luma is computed on a **64×64** downsampled copy of the frame (4,096 pixels/tick, trivial on a cheap
phone) using `0.2126R + 0.7152G + 0.0722B`, sampled every **250 ms** (4 Hz). The loop pauses while
the torch toggles and while the shutter is firing.

### 2.3 Thresholds (all constants in one exported object)

| Check | Constant | Value | Pass / warn / tip | Swahili line (proposal) |
|---|---|---|---|---|
| Face present | `FACE_MISS` | `face === null` | tip | `Hakuna uso unaoonekana. Weka uso wako kwenye mviringo.` |
| Brightness | `LUMA_HARD_DARK` / `LUMA_MIN` / `LUMA_MAX` / `LUMA_HARD_BRIGHT` | 60 / **80** / **185** / 210 (target band 80–185, midpoint 128) | ok 80–185 · warn 60–80 or 185–210 · tip <60 or >210 | dark: `Mwanga hafifu. Karibia dirisha au washa taa.` · bright: `Mwanga ni mwingi mno. Tafuta kivuli kidogo.` |
| Backlit | `BACKLIT_DELTA` | `bgLuma - faceLuma > 55` | tip | `Mwanga mkali uko nyuma yako. Geuka, mwanga uwe mbele.` |
| Side-lit | `SIDE_LIT_DELTA` | `|leftLuma - rightLuma| > 40` | warn | `Mwanga unatoka upande mmoja. Geuka kidogo kuelekea mwanga.` |
| Distance (head size) | `FACE_H_MIN` / `FACE_H_MAX` | **0.35 / 0.68** of frame height | tip outside | far: `Sogeza karibu kidogo.` · close: `Sogeza mbali kidogo.` |
| Head width sanity | `FACE_W_MIN` / `FACE_W_MAX` | **0.25 / 0.60** of frame width | warn outside | `Geuza uso kuelekea kamera.` |
| Edge margin | `EDGE_MARGIN` | face box must start ≥ **0.04** from every edge | tip | `Uso umegusa ukingo. Sogeza simu nyuma kidogo.` |
| Centring | `CENTRE_X_TOL` | `|cx - 0.5| ≤ 0.08` | warn | `Weka uso katikati.` |
| Headroom | `EYE_LINE_Y_MIN` / `MAX` | eye line between **0.30** and **0.48** of frame height | warn | `Punguza nafasi juu ya kichwa.` |
| Head tilt (roll) | `ROLL_OK` / `ROLL_WARN` | ≤ **5°** ok, 5–10° warn, >10° tip | by band | `Simamisha kichwa, tazama kamera moja kwa moja.` |
| Not frontal (yaw) | `YAW_MAX` | `yawRatio > 0.20` | warn | `Geuza uso kuelekea kamera moja kwa moja.` |
| Phone tilt | `DEVICE_ROLL_OK` / `WARN` | ≤ **3°** ok, 3–8° warn | warn | `Shikilia simu wima.` |
| Background busy | `BG_VARIANCE_MAX` | std-dev of the background luma sampled at 64×64 > **45** | tip | `Nyuma yako kuna vitu vingi. Tafuta ukuta usio na vitu.` |
| All pass | — | — | ok | `Nzuri! Unaweza kupiga picha.` |
| Torch offered | `TORCH_LUMA` | `faceLuma < 80` → show the torch button as the *primary* affordance | — | `Washa taa ya mbele.` |

**Where these numbers come from — stated honestly, because they are the part a reviewer must be able
to challenge:**

- The **head-size band (0.35–0.68 of frame height)** is *judgement*, anchored on the strictest
  published bands: US passport 25–35 mm of 51 mm ≈ **49–69%** (travel.state.gov), ICAO 35×45 mm
  convention 32–36 mm ≈ **71–80%** (secondary source, 1.3), and the third-party profile-photo advice
  "face ≥60% of frame" (IIT guide, 1.1). A CV portrait wants head **and** shoulders, so the band's
  lower edge is loosened below the passport floor while the upper edge stays under the ID ceiling.
  Chosen band: **35–68%**.
- **Brightness 80–185 with a 128 midpoint** is *judgement*: 128 is sRGB mid-grey, the conventional
  exposure target for a mid-tone, and skin sits on/above it. Bands are deliberately wide because
  phone auto-exposure on a dark-skinned subject in shade legitimately lands low — see the bias
  warning below.
- **Head tilt ≤5°** is *judgement*, but its purpose is doctrinal: US rules require the subject to
  face the camera "without tilting your head" (travel.state.gov) — 5° is the point where a
  portrait reads as upright rather than as a tilt you have to fix in post.
- **Backlit Δ55 / side-lit Δ40 / background variance 45** are *judgement* on first principles
  (backlight = background ≥ ~1/5 stop brighter in mean luma; the exact values are the kind of thing
  that should be tuned against 20 real user photos before being treated as settled).

**Bias rule (must be in the code, not just this document):** face-detection accuracy is measurably
uneven across demographic groups — NIST's FRVT demographic-effects work is the reference
(<https://pages.nist.gov/frvt/html/frvt_demographics.html>, NIST IR 8280/8429). Tanzanian users are
predominantly dark-skinned and often photographed in shade or against bright outdoor light. So:

- `face === null` is a **tip**, never a warning or an error, and never blocks capture — the most
  likely cause is a detector limitation or an extreme angle, not a bad photo.
- There is **no** "quality score" that can read as "your photo is unacceptable".
- Where a threshold is arguable, the guide errs **permissive**; the only thing the product insists on
  is that the face is visible and reasonably large.
- Any skin-tone-based heuristic (e.g. skin-pixel segmentation to find the face) is **banned** from
  the design: it is exactly the technique that fails dark skin. Detection must come from a face
  detector; exposure measurement must come from the face box the detector returns.

### 2.4 How each surface meets these thresholds

**(a) Native app — the honest state of it today.** The app already has a working camera:
`expo-camera ^57.0.4` (`apps/native/package.json:29`), `CameraView` + `useCameraPermissions` +
`takePictureAsync` in the scan screen (`apps/native/src/screens/app/scan-screen.tsx:5,20,28-42,125`),
and a prebuilt `android/` tree so native modules are on the table. What it does **not** have is
per-frame analysis:

- `expo-camera`'s `CameraView` in this SDK exposes no face boxes and no pixel access — the API
  surface is props/`takePictureAsync` only (docs: <https://docs.expo.dev/versions/latest/sdk/camera/>).
- `expo-face-detector` is **deprecated and removed** — Expo's own FYI page says it was withdrawn
  from Expo Go and that you need a dev build/prebuild; the package page states it was unavailable
  from SDK 51 and recommends **react-native-vision-camera**.
  <https://github.com/expo/fyi/blob/main/face-detector-removed.md> ·
  <https://www.npmjs.com/package/expo-face-detector>

So the native path is two phases, and the queue items say so explicitly:

- **Phase 1 (no new native dependency):** `expo-camera` `CameraView` with `facing="front"`, an
  in-app-drawn overlay (oval + head-size box + hint line), a torch button (`enableTorch`), and
  `takePictureAsync` → the existing `compressPhotoUri()` path. Guides are **instructional only**
  (the oval, the printed tip) plus torch-when-dark, because no per-frame measurement is available.
  This is a genuinely useful screen: the framing guide alone fixes the most common defects
  (too far, off-centre, crooked).
- **Phase 2 (real measurement, offline, free):** add `react-native-vision-camera` and run ML Kit /
  BlazeFace face detection in a **frame processor** on-device, feeding the *same*
  `evaluateGuides()` from `packages/utils`. Face detection on-device costs nothing per frame and
  needs no network — the right answer for this product. **Compatibility with RN 0.86.3 /
  Expo SDK 57 must be verified before installing** (see §6 unverified list); if it does not line up,
  the fallback is to keep Phase 1 on native and put measurement only on web.
- Model choice, if a bundled model is preferred over a library: the measured BlazeFace short-range
  `.tflite` is **229,746 bytes** (§1.2) — small enough to ship inside the APK, so the feature works
  with no network at all.

**(b) Mobile web — `getUserMedia`.** Everything here runs in the browser, on-device, over HTTPS:

```ts
const stream = await navigator.mediaDevices.getUserMedia({
  video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 } },
  audio: false,
});
```
Hard constraints and how they are met:

| Constraint | Rule in code |
|---|---|
| `getUserMedia` is a **secure-context** API (MDN: <https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia>) | Feature-detect `navigator.mediaDevices?.getUserMedia`; if absent (HTTP, old WebView, permission policy) the capture sheet falls back to the existing file input — never a dead end |
| iOS Safari requires the `<video>` element to be `muted` + `playsInline` (and effectively visible) or the stream does not render — WebKit bug 260345 documents the `playsinline` requirement | Always render a real, visible `<video muted playsInline autoPlay>`; never a hidden one |
| **`ImageCapture` is not available on iOS Safari** (caniuse: `ios_saf` = "not supported" for current versions; `safari` unsupported through 27 except behind flag). Verified against the raw caniuse data today: `https://github.com/Fyrd/caniuse` → `features-json/imagecapture.json` | **Never** call `ImageCapture.takePhoto()`. Capture is always `canvas.drawImage(video, …)` → `canvas.toBlob("image/jpeg", 0.9)`. This works everywhere and is what the existing pipeline already does with decoded images |
| iOS Safari's orientation/permission quirks | `DeviceOrientationEvent.requestPermission()` must be called from a user gesture on iOS (<https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent/requestPermission_static>); if refused, the phone-tilt check is simply skipped — the head-tilt (roll) check from the detector still works |
| Detection on Android-Chrome vs iOS Safari | Android Chrome: the native `FaceDetector` shape-detection API gives real face boxes + landmarks cheaply. iOS Safari / Firefox: no `FaceDetector`; use **MediaPipe Tasks Vision FaceDetector** (BlazeFace short-range, 224 KB measured) loaded lazily from WASM — download-once, then offline. If that download is not worth it on a metered connection, the sheet degrades to: oval overlay + our own luma/variance maths (which needs no model at all) + instructional tips. **That degraded mode must exist and must be good**, because it is what a first-time user on 2G gets |
| No `FaceDetector` capability probe | `if ('FaceDetector' in window)`, else MediaPipe, else degraded mode. Three tiers, all shipping |

**(c) Desktop web.** The primary route stays the **file input that already exists**
(`cv-editor-client.tsx:2070-2099`), because on desktop the realistic photo source is a file the user
already has (sent over WhatsApp, taken on a phone, saved from a studio). Two additions:

1. A secondary "Tumia kamera ya kompyuta" button (`getUserMedia`, same component, same maths) for the
   minority with a webcam.
2. A **post-decode photo check**: after `validatePhotoFile()` and before encode, measure the same
   `FrameStats` from the decoded image (via a face detector on a downscaled copy) and show the same
   Swahili guidance as a *report*, not a gate — "Uso ni mdogo kwenye picha. Picha itakatwa
   kuzunguka uso wako." The user can proceed regardless; the guided crop then honours the detected
   face instead of cropping blindly to the centre.

---

## 3. AI adjustment — what it does, where it runs, what it costs, and the rules

### 3.1 Exactly what "adjust" means (and what it never means)

| Adjustment | What it does | Where it runs | Cost |
|---|---|---|---|
| **Guided crop** | Replaces the blind centre crop with a face-anchored square crop; falls back to `computeSquareCrop` when no face is found | Pure maths, shared (`packages/utils`) — no pixels | $0 |
| **Straighten** | Rotates by the measured head roll, clamped to ±6°, then re-crops the square to avoid empty corners | Pure maths + canvas (web) / `expo-image-manipulator` rotate+crop (native) | $0 |
| **Exposure** | One gamma/level move on the whole image so the face ROI mean luma moves toward 128, **clamped to ±0.5 stop equivalent** | Canvas (web) on-device; native: server-side only (see below) | $0 (web) |
| **White balance** | Grey-world channel gains computed **on the face ROI**, gains clamped to **±12%**, and skin is never neutralised (the gains are attenuated toward 1.0 by the skin-pixel share so a warm skin tone is not corrected into grey) | Canvas (web) on-device | $0 |
| **Background normalisation** | MediaPipe selfie segmenter (224/244 KB models, measured) produces a person mask; the background is replaced with a flat, user-chosen light colour. Hair/shoulder edges are feathered by a 1–2 px blur on the mask | Web: on-device WASM, **lazy-loaded only when tapped**. Native: server-side (or a native module added later) | $0 on-device; **$0.00045/image** if offloaded to Replicate `<https://replicate.com/851-labs/background-remover>` |
| ~~Face retouching of any kind~~ | **Never built.** No smoothing, no whitening, no slimming, no skin-tone shift, no "beautify" toggle | — | — |
| **AI critique (optional, consented)** | `deepseek-flash` Vision reads the (already 600px, ≤400 KB) JPEG and returns a structured verdict + the Swahili explanation a human would give | Server-side, Next.js API route, one call, cached | **≈$0.0002–0.0003 per photo** (see 3.3) |

### 3.2 Can DeepSeek do this? Plainly: it can *see*, it cannot *edit*

Verified today against DeepSeek's own documentation, fetched live:

- **`deepseek-flash` supports image input.** The Vision guide states: *"The `deepseek-flash` model
  accepts images alongside text, so you can ask the model to describe pictures, read text from
  screenshots, analyze charts, and more"*; JPEG/PNG/GIF/WebP; three input methods (base64 `data:`
  URL, `http(s)` URL, Files API), all OpenAI-compatible Chat Completions `content` arrays.
  <https://api-docs.deepseek.com/guides/vision/>
- The pricing/model table lists **Vision ✓ for `deepseek-flash`** and **"Not supported" for
  `deepseek-v4-pro`**. <https://api-docs.deepseek.com/quick_start/pricing>
- The legacy name `deepseek-v4-flash-vision-exp` is still accepted but the model is retired and
  served by the current Flash model. <https://api-docs.deepseek.com/news/news260821>
- Images are **resized before inference** (small images upscaled toward ~384×384, larger ones scaled
  down) and billed as input tokens at the text rate. Third-party developer write-ups report a
  **384-token ceiling per image** (<https://apidog.com/blog/deepseek-v4-flash-vision-api/>,
  <https://rohitraj.tech/en/notes/deepseek-v4-flash-vision-exp-api-guide-2026>) — the cap itself is
  **not** stated on the page I fetched, so treat "384 tokens" as strongly-sourced but secondary.

**What that means, with no hedging:**

- DeepSeek **can** look at the finished photo and answer the questions a career adviser would:
  *is the face visible, is it turned away, is the background busy, is the lighting from behind, does
  the framing look like a CV photo?* — and it can write that back in plain Swahili, in the user's
  register, which is the difference between a feature that feels Tanzanian and one that feels
  imported.
- DeepSeek **cannot** produce an edited image. Its API returns **text** (Chat Completions /
  Responses); there is no image-output endpoint in the documentation. Any claim that "the AI fixes
  the photo" is false. The edits are done by deterministic image code (§3.1); the AI explains and
  critiques.
- Two further operational caveats for whoever implements the critique call:
  1. The image the model sees is **downscaled by design** (~384 tokens ≈ a few hundred pixels on a
     side). It is a sanity check on composition, **not** a measurement device — all numeric
     measurement is the deterministic maths in §2. Never let the model's prose contradict a
     measurement the code made.
  2. A face is personal data leaving Tanzania. The repo already flags cross-border transfer as an
     open PDPA item (*"we send data to DeepSeek abroad"*, `docs/ai-memory-disclosure.md` Part V), and
     PDPA s.23(2) requires notice **before** collection. So the critique is **opt-in, after** the
     on-device path has already finished, with the consent line shown first (§3.5).

### 3.3 Cost at low volume (per 1,000 photos, from published prices)

| Path | Unit cost | Per 1,000 | Source |
|---|---|---|---|
| Everything on-device (crop, straighten, exposure, WB, matting) | $0 | **$0** | measured model sizes, §1.2 — no server call at all |
| DeepSeek vision critique | 384 image tokens × $0.15/1M (off-peak, cache-miss) ≈ $0.000058 + ~250 output tokens × $0.60/1M ≈ $0.00015 | **≈ $0.20–0.30** | <https://api-docs.deepseek.com/quick_start/pricing> |
| Background matting offloaded to Replicate | $0.00045/image | **≈ $0.45** | <https://replicate.com/851-labs/background-remover> |
| Photoroom Remove Background API | ~$0.02/image (vendor page returned 403; aggregator-sourced) | **≈ $20** | <https://usagepricing.com/blueprint/photoroom> |
| remove.bg paid tier | first **50 calls/month free**, then ~$1/image (PAYG, aggregator-sourced) | **≈ $1,000** | <https://www.remove.bg/api> (free tier) · <https://comparedge.com/tools/remove-bg/pricing> (PAYG) |

**The cost that matters more than any of these: bandwidth.** The stored photo is a ≤400 KB base64
data URL (`photo-upload.ts:44`). Sending it to a server for an adjustment costs the user **400 KB of
their own metered data, per adjustment, in the upload direction** — on a cheap Tanzanian bundle that
is a real, felt cost, and it is why the default is on-device and the server path is a tap the user
opts into once. If the server path is used, cache the result and never re-send the same photo.

### 3.4 The hard rules (non-negotiable, from the brief and from the passport evidence)

1. **The original is always preserved.** The bytes the user captured/picked are kept in memory for
   the session; the stored photo is always a *derived* copy. The `undo` path never needs a re-encode
   of a re-encode.
2. **Every change is discardable, individually.** Each adjustment is a toggle with its own label;
   `Rudisha kama ilivyokuwa` restores the untouched original in one tap. The user can keep the crop
   and refuse the background change.
3. **Every change is explained, in plain Swahili, on screen,** next to the toggle (§3.5), not in a
   collapsed "how it works" link.
4. **Face-integrity rule (code-level):** no operation in the adjustment module may write pixels
   inside the face box other than a global exposure/white-balance transform, and those transforms are
   clamped (§3.1) so they cannot change identity. The matting mask is applied to the background only.
5. **Identity-document off-switch:** the adjustment panel carries a permanent line — for passport,
   visa, or Ajira Portal uploads, use the unaltered original (§1.3, §1.4). The app must not offer a
   "passport photo" mode that silently alters an image destined for an identity document.
6. **Consent before any off-device send**, in Swahili, naming the recipient and the country of
   processing, consistent with `docs/ai-memory-disclosure.md` (PDPA s.23(2) — notice *before*
   collection) and with the existing editor note at `cv-editor-client.tsx:2108-2115`.

### 3.5 The Swahili copy (proposal — must be approved by a native speaker)

Explanations shown next to each toggle, one line each, no jargon, no borrowed English where a plain
Swahili word exists (and respecting the lint's banned words — notably `tajriba`, `ujanja`):

| Toggle | Swahili line shown |
|---|---|
| Crop | `Nimekata picha kuzunguka uso wako. Uso umebaki katikati.` |
| Straighten | `Nimeinyoosha picha kidogo kwa sababu kichwa kilikuwa kimeinama.` |
| Exposure | `Nimeongeza mwanga kwa sababu picha ilikuwa na giza.` |
| White balance | `Nimerekebisha rangi ili ngozi yako ionekane kama ilivyo.` |
| Background | `Nimebadilisha mandhari ya nyuma kuwa rangi moja. Uso wako haujabadilishwa.` |
| Undo (all) | `Rudisha kama ilivyokuwa` |
| Undo (one) | `Ondoa marekebisho haya` |
| Reassurance (always visible under the buttons) | `Picha yako ya awali imehifadhiwa. Uso wako haubadilishwi.` |
| Identity-document warning | `Kwa picha ya paspoti, visa, au maombi ya Ajira Portal — tumia picha ya awali bila marekebisho.` |
| Consent before the AI critique | `Ukitaka, tunaweza kumuuliza AI (DeepSeek, nje ya Tanzania) kama picha yako inafaa. Picha itatumwa kwa ajili hii tu. Unaweza kukataa.` |
| Panel title | `Rekebisha picha` |
| Capture sheet title | `Piga picha ya wasifu` |
| Shutter | `Piga picha` |

Before merge: `apps/web/lib/swahili-lint.test.ts` and `apps/native/src/lib/swahili-lint.test.ts` must
pass, and the owner approves the strings (none of them is written by a native speaker — the Swahili
standard says so about everything in this document, and it applies here too).

---

## 4. All versions — the surface matrix

| Surface | Capture route | Guide measurement | Capture mechanics | Adjustment |
|---|---|---|---|---|
| **Native app (Android, the offline product)** | `expo-camera` `CameraView` in a new capture screen (Phase 1) → vision-camera + ML Kit frame processor (Phase 2) | Phase 1: instructional only (oval, head-size box, printed tips, torch-when-dark). Phase 2: real `FrameStats` from the frame processor, same `evaluateGuides()` as web | `takePictureAsync({ quality: 0.85 })` (`scan-screen.tsx:34` pattern) → existing `compressPhotoUri()` | Geometry only on-device (`expo-image-manipulator`: rotate/crop/resize — it does **not** do exposure/WB). Exposure/WB/background = optional server path. Must switch `pick-photo.ts:44-47`'s 400px/q0.7 to the web's 600px/q0.82 so both apps store the same thing (§5, item 0.8.8) |
| **Mobile web (the reachable one)** | `getUserMedia` capture sheet, HTTPS + secure context required | Tier 1 Android Chrome: native `FaceDetector` + luma maths. Tier 2 iOS Safari: MediaPipe BlazeFace (224 KB, downloaded once) + luma maths. Tier 3 (no model / refused): oval overlay + luma maths only | `drawImage(video)` → canvas → `toBlob("image/jpeg", 0.9)`; **never** `ImageCapture` (§2.4) | Full on-device: crop, straighten, exposure, WB, MediaPipe selfie-segmenter background (244 KB). All of it free, all offline after first load |
| **Desktop web** | Primary: the **existing file input** (`cv-editor-client.tsx:2070-2099`). Secondary: webcam via `getUserMedia` | Post-decode check on the picked file (same `FrameStats`, computed after `validatePhotoFile()`); guidance shown as a report, never a gate | Canvas capture as mobile, or the file the user already has | Same code as mobile web — one component, one maths module |
| **Shared (write once)** | — | `packages/utils/src/photo-guides.ts`: `FrameStats`, thresholds, `evaluateGuides()`, `computeGuidedSquareCrop()`, `computeAdjustments()` — pure, DOM-free, unit-tested, imported by web (`@sumaiya/utils` tsconfig path) and native (`file:../../packages/utils`) | — | The image maths (gamma curve, clamped channel gains, straighten crop geometry) also lives here; only the *application* of it is platform-specific |
| **Platform-specific (write twice, deliberately)** | — | Frame *sampling*: web reads its `<video>` into a 64×64 canvas; native needs a frame processor (no pixel access in `expo-camera`) | Capture mechanics; iOS Safari quirks | Pixel *application*: canvas vs `expo-image-manipulator`; and the model loading (WASM vs TFLite/native module) |

**The pipeline is not reinvented — it is extended at exactly one seam.** `downscalePhotoFile()`
(`photo-upload.ts:191-231`) already does: validate → decode (EXIF-aware) → `computeSquareCrop` →
canvas draw → stepped-quality JPEG encode → byte ceiling. The feature adds two optional inputs to
that same function and nothing else:

1. `faceBox?: FaceBox | null` — when present, `computeGuidedSquareCrop()` replaces the blind centre
   crop (identical output when absent → existing tests stay green).
2. `adjustments?: AdjustmentPlan` — applied on the *same* canvas between decode and encode, so the
   stored image is still produced by one function, still ≤400 KB, still 600px square, still EXIF-
   correct. No second pipeline, no parallel format, no "capture photo" type to reconcile later.

---

## 5. Verification plan (what proves this shipped)

| Check | Command / evidence |
|---|---|
| Shared threshold logic | `cd apps/web && npx vitest run lib/photo-guides.test.ts` — table-driven cases for every hint code, including the bias rule (`face === null` ⇒ `tip`, never a block) |
| Existing pipeline unbroken | `cd apps/web && npx vitest run lib/photo-upload.test.ts` — must stay green; `computeSquareCrop` behaviour unchanged when no face box is supplied |
| Swahili copy | `npx vitest run lib/swahili-lint.test.ts` (web) and `cd apps/native && npx jest src/lib/swahili-lint.test.ts` |
| Native | `cd apps/native && npx tsc --noEmit && npx jest` |
| Real-device truth (the only real proof) | Cheap Android front camera: capture in a dark room (torch hint fires), backlit against a window (backlight hint fires), too far (distance hint fires), tilted phone (tilt hint fires) — screenshots attached to the queue item. iOS Safari: confirm the stream renders (`muted playsInline`), capture succeeds **without** `ImageCapture`, and the guides still work in degraded mode |
| Metered-data honesty | Chrome DevTools → Network, "Slow 4G" + 3G throttling: the capture sheet with the degraded (no-model) path must be usable with **zero** extra downloads beyond the page's own JS; assert no request to a model CDN unless the user taps the background button |

---

## 6. Unverified / open (stated plainly rather than smoothed over)

1. **`react-native-vision-camera` + ML Kit compatibility with RN 0.86.3 / Expo SDK 57** — not
   verified here. Check before installing (item 0.8.5 gates on it).
2. **MediaPipe Tasks Vision on iOS Safari** — WASM support is well established, but the specific
   face-detector task on a low-end iPhone has not been timed. Treat the iOS tier as
   "expect degraded mode to be the common path" until measured.
3. **"384 tokens per image"** is secondary-sourced (third-party dev write-ups); DeepSeek's own page
   confirms resize-based token billing but not the cap.
4. **Photoroom's $0.02/image** — vendor page returned 403 to automated fetch; the number comes from
   aggregators. It is not load-bearing: the recommendation already rejects it on cost.
5. **Bayt.com's GCC photo guidance** — Cloudflare-challenged; quoted from the search snippet only.
6. **The exact ICAO 70–80% head band** — commercial ID-photo tool, not the primary ICAO Doc 9303 text.
7. **Threshold constants** (backlit Δ55, side-lit Δ40, background variance 45, luma band 80–185) are
   judgement calls that should be tuned against ~20 real user photos from the actual target phones
   before being treated as final.
8. **Tanzanian private-sector photo expectations** — no verifiable statistic exists from here (the
   reachable-platform problem is documented in `docs/SWAHILI-STANDARD-2026-09-20.md` §2). No number
   is claimed anywhere in this document.
9. **Swahili strings** — proposals, not approved copy.
