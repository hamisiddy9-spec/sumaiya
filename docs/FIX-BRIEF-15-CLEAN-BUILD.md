# BRIEF 15 — the build must pass on a clean machine

Repo: `C:\Users\hamis\projects\sumaiya`. Work on a branch. Commit locally. **Do not push.**

## What is measured

`vercel --prod` fails, three times, with the same thing:

    An error occurred in `next/font`.
    TypeError: Cannot read properties of null (reading '1')
        at @next/font/dist/google/loader.js:112
    > Build failed because of webpack errors
    Error: Command "next build" exited with 1

and separately:

    ⚠ Invalid next.config.mjs options detected

`npm run build` on this machine **succeeds** — because `.next` already holds the downloaded fonts, so
the Google Fonts request is never made. Vercel builds clean, makes the request, gets an answer the
loader cannot parse, and the build dies. **The local green is a cache artefact, not evidence.** That is
the trap this brief removes.

The fonts, both in `app/(app)/layout.tsx` and `app/[locale]/layout.tsx`:

    Bricolage_Grotesque, Hanken_Grotesk, Inter, JetBrains_Mono   from "next/font/google"

## What to do

1. **Self-host the four fonts.** Move them to `next/font/local` with the font files committed to the
   repo, so no build ever depends on a network call to a third party. This is not a workaround: the
   product is used on cheap Android phones in Tanzania, and serving fonts from our own origin is
   faster and works where Google Fonts is slow or blocked.
   - Request only the weights the product actually uses; check the code before deciding.
   - Keep the exact same CSS variables and family names the app already exposes, so nothing visual
     changes. If a variable must change, say why in the commit.
   - Preserve `display: "swap"` and the fallback behaviour.
2. **Fix the config warnings**, because a config that warns is a config nobody trusts:
   `experimental.serverComponentsExternalPackages` and `experimental.instrumentationHook` are not
   where they used to be in this Next version; move them where the version expects, and remove any
   option the version no longer accepts rather than silencing the warning.
3. **Prove the build from cold**, which is the only measurement that counts here:

       rm -rf .next && rm -rf node_modules/.cache && npm run build

   A build that only passes warm has not been tested. Report the command and its result.
4. Then, and only then, run the full gates this repo already uses (tsc, the web vitest suite, evals)
   and report the numbers.

## Constraints
- **Do not change any visual output.** Same fonts, same weights, same sizes.
- Do not add a `--no-verify` style escape, do not pin a font CDN, do not silence the warning.
- Commit messages state what was measured before and after, not what was intended.

## Deliverable
The self-hosted fonts, the corrected config, and a note in the commit body recording the cold-build
command and its output. If a font file cannot be obtained, say so and stop rather than substituting.
