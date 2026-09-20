You are a senior product designer reviewing Sumaiya (PRODUCT NAME: Sumaiya — a memorial to the owner's late sister; never rename it). Repo: C:\Users\hamis\projects\sumaiya

Product: AI career assistant for a first-time jobseeker in Tanzania on a cheap Android phone (Redmi/Tecno/Infinix class, 1-3GB RAM) on EXPENSIVE mobile data. Swahili-first. Two platforms: web (Next.js) + Android (React Native / Expo, the REAL product).

FIXED AND UNTOUCHABLE: the colour palette and the logo. Palette (Warm Confidence), from apps/web/tailwind.config.ts:
  ember #DA4A1C (DEFAULT), ember-shadow #A8330F, ember-hover #C13E14, ember-tint #FBE9E1
  pine #12433D, pine-tint #E4EDEA
  gold #F2A93B, gold-tint #FBF3E2, gold-text #96630F
  espresso #211A15, espresso-2 #2C231C, espresso-line #3A2E25
  cream #FAF5EE, sand #EFE7DA, sand-2 #F4EEE4, card #FFFFFF
  border #E9E0D4, border-input #9C8D7B, text-body #6B5F54, text-muted #756A5E
  error #C13E14, success #12766A, warning #96630F
  Native theme.ts also has accentFill #B83A12 (light) / #E5734A (dark) for FILLED accent surfaces, accentText cream/espresso.
Radii in use: input 8, input-lg 12, card 16, card-lg 20, pill 999, device 18.
Shadows: card 0 2px 8px rgba(33,26,21,.05); card-hover 0 8px 24px rgba(33,26,21,.12); floating 0 12px 30px -12px rgba(33,26,21,.25); ember-hard 0 3px 0 #A8330F.
Fonts: display "Bricolage Grotesque" (var --font-display); body "Hanken Grotesk" (var --font-body); mono "JetBrains Mono".
Existing type sizes in use: 11, 12, 12.5, 13, 13.5, 14, 14.5, 15, 15.5, 16, 18, 19, 20, 24, 26, 28, 30, 36. Letter-spacing -0.5 on ScreenTitle (fontSize 28, weight 800). Screen padding 20px horizontal both sides. Card padding 16. Grid gutter 12.

THE MOTION STANDARD (docs/MOTION-STANDARD-2026-09-20.md, already written by the owner's team — YOUR RULES MUST OBEY IT, "nothing appears, everything arrives"):
  durations: instant 1ms, micro 90, fast 140 (leaving), base 220 (in-place), slow 300 (entering), screen 260 (push/pop), field 340 (root cross-fade)
  easings: out cubic-bezier(0.33,1,0.68,1) for entering; in cubic-bezier(0.32,0,0.67,0) for leaving; inOut cubic-bezier(0.65,0,0.35,1); emphasized cubic-bezier(0.16,1,0.3,1)
  stagger: base 30ms, step 40ms, CAP 6 items, MAX 270ms, rise 12px
  springs only for dialog/sheet present + container reflow: gentle {damping:20,stiffness:180,mass:.9}, snappy {damping:22,stiffness:260,mass:.8}
  STAYS INSTANT (never animate): typing/keystrokes, tap acknowledgement, scroll offset, selection state, numbers the user is comparing, existing list text updating, keyboard avoidance
  Reduce Motion: collapses to 1ms (never removed)
  Budget is a Redmi-class device: timing curves not springs for per-item, transform+opacity only, no per-frame callbacks on invisible nodes, max ~100 simultaneously animated components on low-end Android (Reanimated docs)

WHAT I NEED FROM YOU — be concrete and terse, no preamble, no praise:

1. A DESIGN SYSTEM expressed as rules a developer can implement WITHOUT judgement calls. Cover: (a) a named type scale (roles with exact px size / line-height / weight / letter-spacing), (b) a spacing rhythm, (c) corner treatment (concentric radii — inner radius = outer radius − padding), (d) elevation/surface treatment (when a surface is cream vs white vs bordered vs shadowed), (e) density rules for a cheap phone, (f) iconography rules (stroke width, sizes, when filled vs outline), (g) motion rules that EXTEND the standard above (name the composites, give durations/easings, and say which are banned). Give the exact values. Number the rules so I can cite them.

2. For EACH of these screens, ONE-LINE biggest current weakness + the specific change: native HomeScreen (apps/native/src/screens/app/home-screen.tsx), CvEditor (src/screens/cv-editor-screen.tsx), JobsScreen (src/screens/jobs-screen.tsx), CvListScreen (src/screens/app/cv-list-screen.tsx), ProfileScreen (src/screens/app/profile-screen.tsx), FirstRun (src/screens/first-run-screen.tsx), Onboarding (src/screens/onboarding-screen.tsx), the chat (src/screens/sumaiya-chat-screen.tsx), plus web dashboard (apps/web/app/(app)/(dashboard)/dashboard/page.tsx) and web CV editor (apps/web/components/editor/cv-editor-client.tsx).

3. Which of these 2025-26 trends TRANSFER to a 1-3GB RAM Android on metered data, and which are FASHION that costs the user money/RAM for nothing: iOS 26 Liquid Glass / translucent materials, Material 3 Expressive motion+bold type, glassmorphism, video/animated hero, blur/backdrop-filter, skeleton shimmer, illustration-heavy empty states, parallax scroll, haptics everywhere, dark mode as default, large display type, bottom sheets vs full screens. One line each with the cost.

4. The 5 highest-value motion fixes for THIS app that obey the existing standard (no new "boom" appearances), each with the file it belongs in.

5. The single risk in this whole redesign that the owner is most likely to reject, and how to present it so he can say no cheaply.

DO NOT propose adding new features unless you also name the thing it replaces. Do not touch colours or the logo. Output plain markdown, no code fences around the whole thing.
