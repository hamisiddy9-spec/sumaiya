# Sumaiya — marketing ad assets

Source + script for the Sumaiya app install ad (9:16 vertical, ~34s, Swahili VO).

## Files
- `ad-vo-script.md` — the bilingual voiceover script, scene timing, and recording guide.
- `sumaiya-app-ad.html` — the self-contained ad **render source**. Animated phone UI
  (AI writing a CV → ATS score → templates → "interview invite" payoff → price → QR end
  card). No build step; opens in any browser. Timeline + copy live in the `<script>` at
  the bottom.

The rendered `.mp4` files are delivered separately (large binaries, kept out of git).

## Concept
Problem hook first (paying ~2,000 TSh at a stationery shop just to *type* a CV), then the
app does the work: AI writes/tailors the CV, passes ATS, offers professional templates —
ending on the outcome (an interview invite). Benefit-led, works muted with on-screen
Swahili captions, explicit CTA + QR to `sumaiya.app/pakua`.

## Reproduce the video
Rendered headlessly with the pre-installed Chromium + ffmpeg:

1. **Record** the HTML to webm (Playwright, 1080×1920): load `sumaiya-app-ad.html`, wait
   for `window.__done === true`, then close the context to flush the video.
2. **Transcode** webm → mp4: `fps=30, scale=1080:1920, yuv420p, libx264 -crf 20`.
   The headless screencast stops capturing a few seconds early, so freeze-extend the last
   (end-card) frame with `tpad=stop_mode=clone` for the QR hold.
3. **Voiceover**: one audio clip per scene, placed at its scene-start time with ffmpeg
   `adelay`, mixed (`amix`) with an optional pad/whoosh bed, then `alimiter`.
4. **Mux** the audio onto the video (`-c:v copy -c:a aac -shortest`).

Scene start times are in the `T = {…}` object in the HTML `<script>`; the VO offsets in
the mix must match those.
