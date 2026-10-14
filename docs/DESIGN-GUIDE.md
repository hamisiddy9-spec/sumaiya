# SUMAIYA — DESIGN GUIDE

**Source of structure:** the Stitch package `stitch_android_apk_specification_prompt` (9 screens +
`warm_earth_editorial/DESIGN.md`). Its **layout, hierarchy, screen inventory and copy are adopted as
the guide.**
**Source of brand:** the shipped application. Where the two disagree, **this file wins** — Stitch
regenerated the palette from a Material tonal algorithm and the brand colour was lost in the process
(`#DA4A1C` appeared **0 times** across its 8 HTML files).

> Read this before touching a screen. Every value here is a decision, not a starting point.

---

## 1. COLOUR — ember is the root, everything else derives from it

Stitch's palette was built from `primary: #ab2e00`. **That is not our colour.** Ours is ember, and the
whole warm scale must be re-derived from it. Do not keep both.

### Core (pin these — do not regenerate)
| Token | Value | Use |
|---|---|---|
| `ember` | **`#DA4A1C`** | Primary actions, active tab, focus, the mark |
| `emberPressed` | `#B93C13` | Pressed state only |
| `emberHover` | `#C2410C` | Web parity |
| `emberTint` | `#DA4A1C` @ 8–14% | Pills, wells, selected rows, tinted cards |
| `onEmber` | `#FFFFFF` | Text/icons **on ember only** |

### Surfaces (warm — never neutral)
| Token | Value | Use |
|---|---|---|
| `surface` | `#FBF9F5` | Page background — **keep this from Stitch**, it is right |
| `surfaceRaised` | `#F5F3EF` | Cards, sheets |
| `surfaceSunken` | `#EFEEEA` | Inset wells, tracks |
| `border` | `#E2BFB5` @ low alpha | Card hairlines, dividers |
| `borderStrong` | `#8E7068` | Pending rings, unselected borders |

> ⚠️ **No `#ffffff` as a surface.** Stitch used `surface-container-lowest: #ffffff` and pure white
> appears **40 times** across its screens. In a warm palette a white card reads as a hole. The
> lightest surface is `surface` at `#FBF9F5`. White is permitted **only** as `onEmber` text.

### Text
| Token | Value |
|---|---|
| `espresso` | `#211A15` — headings, values |
| `text` | `#1B1C1A` — body |
| `textMuted` | `#5A413A` — labels, timestamps, captions |

### Status
| Token | Value | Use |
|---|---|---|
| `success` | `#186A22` | Completed steps, "Imekamilika" |
| `successTint` | `#186A22` @ 10% | Success chips |
| `warning` | `#B45309` | Needs-attention checks ("Inahitajika") |
| `error` | `#BA1A1A` | Failed steps/checks |
| `errorTint` | `#BA1A1A` @ 10% | — |

### Dark mode — `Hali ya giza`
Warm parity, **not an invert**. Base `#1B1C1A`; raised `#24201C`; sunken `#141210`; text `#F2F0ED`;
muted `#C9C0B8`; ember unchanged. **No pure-white cards, no cool greys, ever.**

---

## 2. TYPOGRAPHY

Three families, three jobs — as Stitch declared, and as the app already ships.

| Role | Family | Notes |
|---|---|---|
| Display / headings | **Bricolage Grotesque** | Geometric grotesque, weight **800** |
| Body / UI | **Hanken Grotesk** → Inter | Warm, humanist, excellent small |
| Numeric / eyebrows | **JetBrains Mono** | Elapsed times, tracked uppercase |

### The literal spec — copy it, never round it to a tidy scale
```
Welcome greeting   29 / 800 / -0.6     (one word: "Karibu")
Welcome body       15 / 22 / maxW 290  (bilingual, Swahili first)
Slide title        26 / 800 / -0.5
Slide body      15.5 / 23 / maxW 320
```
> These are quoted from the native welcome screen. **29 is not 30. 15.5 is not 16. −0.6 is not −0.5.**
> The web landing once drifted to "the same idea a few steps off" and read as vibe-coded.

### ⚠️ Verify before building
Stitch's `Karibu` **renders as a serif** in its `screen.png`. Bricolage Grotesque is a geometric
grotesque. Either the font is not loading in the renderer or the spec is wrong — **prove which** before
anyone builds headings. If it is a loading issue, pin the `@font-face`/`expo-font` registration.

---

## 3. THE HOUSE MARK

**Three blades at 120°**, opacity 1.0 / 0.9 / 0.8, inside a well.

```
Well     size 128, radius 40, fill emberTint  (mark/size = 0.5625, r/size = 0.3125)
Mark     size 72
States   idle      slow drift + gentle breathing   ← the resting state
         thinking  continuous rotation + pulsing core ← ONLY while an AI call is genuinely out
         static    no motion
```

⚠️ **Stitch drew a single curved blade.** That is not the mark. Use the shipped geometry from
`components/ui/sumaiya-mark.tsx`. A wrong mark reads as a different company faster than any other
single error.

**The welcome entrance** uses `thinking → idle` after **1600 ms**. This is the shared brand greeting,
identical on Nuru, Faraja and Sumaiya — do not alter it per product.

---

## 4. MOTION — one table

```
instant 1 · micro 90 · fast 140 · base 220 · slow 300 · screen 260 · field 340
stagger 30 / 40 / 6
```
Rules:
- **Nothing repeats forever.** Every loop is bounded (the processing glyph beats 2 cycles ≈ 1.05 s).
  Unbounded motion is a WCAG 2.2.2 Level-A failure.
- **Reduce Motion** switches off every mark animation and every beat; **all words remain**.
- Entrance for the processing surface: 300 ms, rise 12 dp (instant under Reduce Motion).
- Progress bars grow from their **left edge** (`transformOrigin: left`) — a centred scaleX reads as
  half-done before anything has finished.

---

## 5. SCREEN INVENTORY — adopted from Stitch

| # | Screen | Stitch folder | Status |
|---|---|---|---|
| 1 | Onboarding — Karibu & language | `onboarding_karibu_lugha` | structure ✓, remove the confirm CTA |
| 2 | Home | `nyumbani_home` | structure ✓, colour + chrome fixes |
| 3 | Home — refined spacing | `nyumbani_home_apple_polish` | **preferred variant** — adopt its spacing |
| 4 | Assistant | `sumaiya_msaidizi_wa_kazi` | rail ✓ correct |
| 5 | Documents & templates | `cv_zako_nyaraka_na_miundo` | ✓ |
| 6 | Profile & settings | `wasifu_mipangilio` | ✓ |
| 7 | Premium paywall modal | `sumaiya_premium_paywall_modal` | copy fix (see §6) |
| 8 | Export / share sheet | `export_shiriki_modal_sheet` | ✓ |

**Adopt from the "apple polish" variant:** more generous vertical rhythm, softer card radii, subtler
borders instead of shadows. It is the same information with better air.

---

## 6. COPY RULES

### ⛔ `ATS` is BANNED from Swahili-facing copy — 9 occurrences must be replaced
Stitch wrote `Alama ya ATS`, `Uchambuzi wa ATS`, `kaguzi wa Kina wa ATS`, `ATS Card`.

| Replace | With |
|---|---|
| `Alama ya ATS` | **`Alama ya ukaguzi`** |
| `Uchambuzi wa ATS` | **`Ukaguzi wa CV`** |
| `kaguzi wa Kina wa ATS` | **`Ukaguzi wa kina wa CV`** |
| `ATS Card` (internal label) | **`Ukaguzi wa CV`** |

The product says **"Ukaguzi wa CV"**. English surfaces may say "ATS" — Swahili ones never do. Faraja
enforces this with a test; Sumaiya's strings must pass it too.

### Other copy rules
- **Swahili leads, English follows.** Write the Swahili first; the English is the translation, never
  the reverse.
- **Address the user as the beneficiary** — `nitakuandikia` (*I will write for you*). A verb pointing
  back at the speaker (`atanisaidia` — *will help me*) reads wrong to a native ear.
- **No generic AI vocabulary** — no "prompt", "model", "token", "AI-powered". It is a coach.
- **No false promises** — never imply an employer will reply.
- **Errors state the situation and the next action**, and never scold.

---

## 7. CHROME — what Stitch added that must come out

| Added | Where | Verdict |
|---|---|---|
| `v1.6` version pill in the header | 5 screens | **Remove.** A version number is not user-facing chrome. |
| Bell / notification icon | 4 screens | **Remove.** Notifications are local-only and currently unavailable; nothing may demand attention. |
| Header avatar on every screen | several | **Keep only on Home and Profile.** |
| Confirm CTA on the language step | onboarding | **Remove.** One tap enters the user's language. |

---

## 8. LAYOUT RULES (from the shipped app — these are not negotiable)

- **Bottom tab bar, 5 tabs, no drawer, no nested submenus.** Max depth: tab → screen → one sheet.
- The bar publishes its **real measured height**; floating overlays read it. Never hard-code it — the
  bar grows under large text and the overlay then creeps over the navigation.
- Onboarding renders **outside** the tab navigator and reserves **no** bar space.
- **One floating element only** — the update pill. It must never cover content or swallow a tap.
- **No tap target below 44 dp.** Layout holds at **200% text scale**.
- Every list has **three** states built: loading (`"Inasoma rekodi…"` or a skeleton — never blank),
  empty (one line + one action), failed (reason + **"Jaribu tena"**).

---

## 9. THE PROCESSING SURFACE — Stitch kept the panel; decide once

Stitch built the **content** correctly and it must be preserved:

```
 ✦ Sumaiya anaandika…                          4s      Acha
─────────────────────────────────────────────────────────────
 ✓ Kuandika CV yako        herufi 2,340 zimekamilika   TAYARI
 △ Kuilinganisha na tangazo Inachanganya ujuzi wa…     INAKAGUA
 ○ Kuandaa barua ya maombi  Itaundwa kwa Kiswahili…    BAADAYE
```

The information is right: real step states, real results, real elapsed time, and **"Acha" present from
the first second**. That last part is the whole reason the surface exists — three pulsing dots look
identical whether a request is healthy or dead, and on metered data a user who cannot tell re-sends
and **pays twice**. Never remove the stop control or the real steps.

**DECIDED (2026-10-14): Stitch's panel is the shipped surface — always visible, bordered, with the
real steps.** Recorded here so it stops being drift:

- The panel is what ships at HEAD and it is what the interface is being built to. The *content* above
  is preserved exactly: real step states, real results (`herufi 2,340 zimekamilika`), real elapsed
  time, and **`Acha` in the header row beside the elapsed time, ≥44 dp, live from the first second**.
  (It was buried at the panel's foot at 40 dp — that is the one placement the guide calls
  non-negotiable, because a user who cannot stop a metered request re-sends and pays twice.)
- The quiet one-line default that expands is **not** adopted. It remains a viable future variant and
  the machinery for it exists on the unmerged branch `feat/progress-rail-proportional`
  (`e0a86f8`, escalation on ≥8 s or a failed step) — but a branch is not a decision, and shipping two
  different processing affordances is exactly the drift this section exists to prevent.
- Missing from the panel at HEAD and now required: the `TAYARI` / `INAKAGUA` / `BAADAYE` state chips,
  the per-row backgrounds, and the `✦ Sumaiya anaandika…` sentence (the header said only `SUMAIYA`).

---

## 10. DO NOT

- Regenerate the palette from a tonal algorithm. **Ember is root.**
- Introduce `#ffffff` as a surface, or any cool grey.
- Add desktop patterns — sidebar, multi-column, data table, hover, right-click.
- Add nested submenus, streak counters, badges or red notification dots.
- Add countdown timers, "3 people are viewing this job", or any manufactured urgency.
- Show a login wall before value. A CV and a PDF require no account.
- Require a card. Payments are mobile money only, when they arrive.
- Fabricate progress — no fake ramps, no animated percentage untied to a real step.
- Ship an English-only surface. Both languages, every screen.
- Claim an employer will reply, or show a statistic nobody measured.
