# WEB UI INCONSISTENCY AUDIT — measured, 2026-10-14

Every number here came from a command in `apps/web`, not from looking at screens. Re-run
them before trusting them; the tree moves.

---

## 1. Typography is not a ramp — ~520 arbitrary sizes

```
text-[10px]  198      text-[13px]   37      text-[8px]    5
text-[11px]  195      text-[12px]   30      text-[27px]   3
text-[9px]    45      text-[15px]   12
```

**This is the inconsistency a user actually sees.** The design guide specifies one type
ramp (Bricolage display / Hanken body / JetBrains numeric) with a defined scale;
`tailwind.config.ts` has no `fontSize` extension at all, so every screen has been inventing
its own sizes — and half of them land on 10px or 11px, which is a two-pixel difference no
one chose and everybody notices.

**Risk: HIGH.** Changing a font size changes line height, which changes wrapping, which
changes layout. A find-and-replace here cannot be verified by tsc or by the test suite —
only by looking at the surfaces. Do it with eyes on every screen, not in a sweep.

**Fix shape:** add a `fontSize` scale to the config (caption / body / label / title /
display), migrate one surface at a time, and check that surface at 360 / 768 / 1280 / 1440
before moving on. The 10px-and-11px pair is the first thing to collapse to one value.

## 2. 92 raw brand hex values where a token exists

The ember palette is declared in `tailwind.config.ts` and then bypassed in 92 places as
`bg-[#DA4A1C]` and friends.

**Risk: NONE** — replacing `bg-[#DA4A1C]` with `bg-ember` renders the identical colour.
This is the safe one, and it should go first precisely because it cannot break anything.

**One trap that makes it unsafe if rushed:** Tailwind silently drops a class it cannot
resolve. A typo'd token name (`bg-ember-hover` when the config says `emberPressed`) does not
error — the element simply loses its colour. So the token names must be read out of the
config and asserted, not guessed from the hex.

## 3. 42 pure-white surfaces

The brand law is that white is for text and icons **on** ember, never a surface. 42
`bg-white` occurrences say that law has never been enforced on the web.

**Risk: MEDIUM, and it needs a judgement call first.** Not every one of the 42 is a
violation: a white card inside the editor's A4 preview is paper, and paper is legitimately
white. Marketing pages may also have chosen it deliberately. So this is a review, not a
sweep — each of the 42 gets classified as *paper* (keep), *surface* (change to the warm
scale), or *unknown* (ask).

## 4. ~43 arbitrary radii

`rounded-[10px]` ×26, `rounded-[9px]` ×7, `rounded-[14px]` ×4, `rounded-[3px]` ×4, plus
one-offs at 8px and 4px — against a `borderRadius` layer that already exists in the config.

**Risk: LOW.** Radii do not reflow text. Consolidate to the token scale in the same pass as
the hex migration, since both are the same kind of edit to the same strings.

---

## Order of work, chosen by risk rather than by size

1. **Tokens first** (§2 + §4): zero visual change, ~135 edits, verifiable by tsc and by a
   grep that must return zero. Ship it immediately.
2. **White review** (§3): classify the 42, change only the *surface* ones, look at each.
3. **Type ramp** (§1): the real work, one surface at a time, at four widths.
4. **Then** the shell from the design's desktop view, on top of a colour and type layer that
   is finally trustworthy.

Doing them in any other order means re-deciding the same values in every later commit —
which is how a codebase arrives at 520 arbitrary font sizes in the first place.
