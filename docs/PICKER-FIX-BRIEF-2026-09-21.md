# FIX BRIEF — the silent photo no-ops, and the gallery that hides photo support

2026-09-21. Two owner-reported symptoms, traced to code. Hand to Claude Code; **queue it — do not
run two `claude -p` invocations at once, they get killed.**

Owner's words (verbatim): *"kutoka kwenye picha vibrates and does nothing"* ·
*"picha kuwa pdf na buttons zake hazifanyi kitu"* ·
*"templates are similar na sioni zile zenye option ya profile pic"*

## Defect 1 — a haptic, then nothing (verified in code)

`apps/native/src/screens/pdf-tools-screen.tsx`, `add()`:

```js
add = async (fromCamera) => {
  haptics.light();                                        // the buzz, always
  ...
  const opts = { quality: 0.7, base64: true };
  const res = fromCamera
    ? await ImagePicker.launchCameraAsync(opts)
    : await ImagePicker.launchImageLibraryAsync({ ...opts, allowsMultipleSelection: true, selectionLimit: 20 });
  if (res.canceled) return;                               // silent exit #1
  const next = res.assets.filter(a => a.base64)           // silent exit #2 — see below
         .map(a => ({ uri: a.uri, base64: a.base64! }));
  setPics(p => [...p, ...next].slice(0, 30));
}
```

Two paths produce a buzz and **zero** feedback:

1. `if (res.canceled) return;` — a silent exit with no message and no alternative.
2. **`res.assets.filter(a => a.base64)` can empty the list.** The installed typings are
   `base64?: string | null` (`node_modules/expo-image-picker/build/ImagePicker.types.d.ts`, v57.0.16)
   — **base64 is nullable by contract**, and nothing here handles its absence. If every asset
   lacks it, `next` is `[]`, `setPics` adds nothing, and the screen looks like it ignored the tap.
   A likely trigger in this exact call is asking for `base64: true` alongside
   `allowsMultipleSelection: true` on Android — **hypothesis, confirm by reproducing on the device
   before assuming it.**

Note the file's own comments show this class was already fixed once ("Never a silent return. The
old code did `if (!perm.granted) return;`") — these are two instances it missed.

**Fix:** never return without either a result or a message. If assets came back with no base64,
say so (bilingual alert) — or read the bytes from `asset.uri` instead of depending on base64.
Also handle the zero-assets case explicitly.

## Defect 2 — the same class in the profile-photo path

`apps/native/src/lib/pick-photo.ts:38-67`: `compressPhotoUri()` returns `null` on any manipulator
failure (`:46-47`), and `pickAndCompressPhoto()` returns `null` when the picker is cancelled or the
compress fails (`:66-67`). **Check every caller** — the CV editor's photo control and the first-run
wizard's avatar prefill — and confirm each one surfaces something when it receives `null` rather
than silently leaving the photo unset. This is a strong candidate for *"kutoka kwenye picha
vibrates and does nothing"*.

## Defect 3 — `exportPdf` is silent on the empty case

Same file, `:68-69`: `if (pics.length === 0) return;` — no message. Low severity if the button is
hidden at zero pictures (check that), but it is the same class.

## Defect 4 — the gallery never says which designs take a photo

Owner: *"sioni zile zenye option ya profile pic"*. Verified: **204 of 269 web templates reference a
photo**, and `cv-html.ts:131-133` (`photoTag`) renders it whenever `profilePhoto` is set — but
grep finds **no mention of photo at all** in `template-gallery.tsx` or `template-thumb.tsx`. So the
phone's gallery shows 224 designs with no indication that any of them can carry a photo, and
because the sample CV has no avatar the thumbnails show none either. (Related, already recorded:
`kioo` ships as a large empty rectangle for the same reason.)

**Fix, smallest honest version:** mark the designs that support a photo in the gallery cell, and
make at least the featured/premium thumbnails render *with* an avatar so the capability is visible.
Do not build a new gallery — the existing `templateLayout(id)` already knows the shape.

## Boundary — unchanged and non-negotiable

Verify each claim against the code before changing anything; if one is false, say so and stop on
that item. Minimal change, no refactors, no new dependencies. **Never push, build, deploy, migrate
or touch a database.** Commit named paths only — never `git add -A`. Run `npx tsc --noEmit` and
`npx jest` in `apps/native` (jest, **not** vitest). Flag Swahili for the owner rather than
rewriting it. Report: verified / changed / refused / exact test output / sha.
