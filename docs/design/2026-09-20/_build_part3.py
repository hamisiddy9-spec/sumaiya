# -*- coding: utf-8 -*-
"""Index + design-system pages. Imported by _build_mockups.py after part 2."""


def build2(g):
    ico, mark, phone, note, doc, write = g["ico"], g["mark"], g["phone"], g["note"], g["doc"], g["write"]

    SWATCHES = [
        ("ember", "#DA4A1C", "FILL + ICON"), ("ember-shadow", "#A8330F", "TEXT"),
        ("ember-hover", "#C13E14", "STATE"), ("ember-tint", "#FBE9E1", "TINT"),
        ("pine", "#12433D", "FILL"), ("pine-tint", "#E4EDEA", "TINT"),
        ("gold", "#F2A93B", "ACCENT"), ("gold-tint", "#FBF3E2", "TINT"),
        ("gold-text", "#96630F", "TEXT"), ("espresso", "#211A15", "TEXT"),
        ("espresso-2", "#2C231C", "SURFACE"), ("espresso-line", "#3A2E25", "BORDER"),
        ("cream", "#FAF5EE", "PAGE"), ("sand", "#EFE7DA", "PAGE2"),
        ("sand-2", "#F4EEE4", "INSET"), ("card", "#FFFFFF", "SURFACE"),
        ("border", "#E9E0D4", "BORDER"), ("border-input", "#9C8D7B", "BORDER"),
        ("text-body", "#6B5F54", "TEXT"), ("text-muted", "#756A5E", "TEXT"),
        ("error", "#C13E14", "STATE"), ("success", "#12766A", "STATE"),
        ("warning", "#96630F", "STATE"), ("accentFill", "#B83A12", "FILL"),
    ]

    TYPES = [
        ("1.1", "Display", "30 / 36 &middot; 800 &middot; &minus;0.5", "r-display",
         "Onboarding hero, first-run step titles"),
        ("1.2", "ScreenTitle", "28 / 34 &middot; 800 &middot; &minus;0.5", "r-screen",
         "One per screen, top of Screen. Never two."),
        ("1.3", "SectionTitle", "18 / 24 &middot; 800 &middot; 0", "r-section",
         "SectionHeader, dashboard h2"),
        ("1.4", "CardTitle", "15.5 / 21 &middot; 700 &middot; 0", "r-cardtitle",
         "Job title, CV title &mdash; the row's primary line"),
        ("1.5", "Body", "14.5 / 21 &middot; 600-700 &middot; 0", "r-body",
         "Buttons, quick-action labels"),
        ("1.6", "BodySmall", "13.5 / 19 &middot; 600 &middot; 0", "r-bodysmall",
         "Secondary line under a CardTitle"),
        ("1.7", "Caption", "12.5 / 18 &middot; 400-600 &middot; 0", "r-caption",
         "Dates, counts, sublabels"),
        ("1.8", "Micro", "11.5 / 14 &middot; 700 &middot; +0.4", "r-micro",
         "Uppercase eyebrows, badge numerals"),
        ("1.9", "Stat", "26 / 1.0 &middot; 800 &middot; 0", "r-stat",
         "A headline number you read, not compare"),
    ]

    sw = "".join(
        '<div class="card" style="padding:0;overflow:hidden">'
        '<div style="height:56px;background:' + hexv + '"></div>'
        '<div style="padding:10px 12px">'
        '<div class="r-micro" style="letter-spacing:0">' + name + '</div>'
        '<div style="font-family:var(--font-mono);font-size:11.5px;color:var(--text-body);'
        'margin-top:2px">' + hexv + '</div>'
        '<div class="r-caption muted" style="margin-top:4px">' + role + '</div></div></div>'
        for name, hexv, role in SWATCHES)

    ty = "".join(
        '<div class="card pad-row" style="display:flex;align-items:baseline;gap:16px;margin-bottom:8px">'
        '<span style="font-family:var(--font-mono);font-size:11px;color:var(--text-muted);'
        'width:26px;flex:0 0 26px">' + n + '</span>'
        '<span class="' + cls + ' grow">' + label + '</span>'
        '<span style="font-family:var(--font-mono);font-size:11px;color:var(--text-muted);'
        'flex:0 0 auto">' + spec + '</span></div>'
        '<div class="note" style="border-left-color:var(--border);margin-bottom:20px">'
        '<p style="font-size:12.5px">' + use + '</p></div>'
        for n, label, spec, cls, use in TYPES)

    radii = "".join(
        '<div style="text-align:center"><div style="width:64px;height:64px;background:var(--card);'
        'border:1px solid var(--border);border-radius:' + v + '"></div>'
        '<div class="r-micro muted" style="letter-spacing:0;margin-top:8px">' + k + '</div>'
        '<div style="font-family:var(--font-mono);font-size:11px;color:var(--text-body)">' + v
        + '</div></div>'
        for k, v in [("pill", "999px"), ("card-lg", "20px"), ("card", "16px"),
                     ("input-lg", "12px"), ("input", "8px")])

    motion = "".join(
        '<div class="kv"><span>' + k + '</span><b>' + v + '</b></div>'
        for k, v in [("dur.instant", "1ms"), ("dur.micro", "90ms"), ("dur.fast (leaving)", "140ms"),
                     ("dur.base (in place)", "220ms"), ("dur.slow (entering)", "300ms"),
                     ("dur.screen (push/pop)", "260ms"), ("dur.field (root fade)", "340ms"),
                     ("stagger.base / .step", "30ms / 40ms"), ("stagger.cap", "6 items"),
                     ("MAX_STAGGER_MS", "270ms"), ("rise", "12px"),
                     ("ease.out (enter)", "cubic-bezier(.33,1,.68,1)"),
                     ("ease.in (leave)", "cubic-bezier(.32,0,.67,0)")])

    ds = ('<div class="sec">'
      '<h2><span class="n">&sect;1</span>The palette is fixed &mdash; what changes is which token '
      'does which job</h2>'
      '<p class="lede">Read verbatim from <code>apps/web/tailwind.config.ts</code> and '
      '<code>apps/native/src/components/ui/theme.ts</code>. 24 values, not one of them new. The only '
      'change is a <b>usage rule</b>, forced by measurement, not taste: <code>--ember #DA4A1C</code> '
      'measures <b>3.89:1</b> on cream and <b>4.22:1</b> on white &mdash; below WCAG AA 4.5:1 for '
      '14px text. <code>--ember-shadow #A8330F</code> measures <b>6.16:1</b> and <b>6.68:1</b>. So '
      'ember stays the fill and the icon; small ember <i>text</i> uses the darker existing token. '
      'Same family, same brand, legible.</p>'
      '<div class="rule-grid" style="grid-template-columns:repeat(auto-fit,minmax(140px,1fr))">'
      + sw + '</div></div>'

      '<div class="sec"><h2><span class="n">&sect;2</span>Type scale &mdash; nine roles, and every text '
      'node is exactly one of them</h2>'
      '<p class="lede">Consolidated from the sizes already in the tree (11, 12, 12.5, 13, 13.5, 14, '
      '14.5, 15, 15.5, 16, 18, 19, 20, 24, 26, 28, 30, 36). No new size is introduced. If a screen '
      'seems to need a tenth, it needs a different role, not a new number.</p>' + ty + '</div>'

      '<div class="sec"><h2><span class="n">&sect;3</span>Spacing rhythm &mdash; base 4px</h2>'
      '<div class="rule-grid">'
      '<div class="rule"><h4>Allowed gaps only</h4>'
      '<div class="kv"><span>scale</span><b>4 &middot; 8 &middot; 12 &middot; 16 &middot; 20 &middot; '
      '24 &middot; 32</b></div>'
      '<div class="kv"><span>screen padding</span><b>20</b></div>'
      '<div class="kv"><span>card padding</span><b>16</b></div>'
      '<div class="kv"><span>row padding</span><b>14-16</b></div>'
      '<div class="kv"><span>grid gutter</span><b>12</b></div>'
      '<div class="kv"><span>icon to label</span><b>8</b> (12 in an icon well)</div>'
      '<div class="kv"><span>section to section</span><b>20-24</b></div></div>'
      '<div class="rule"><h4>Round the ad-hoc values</h4>'
      '<p class="spec" style="margin:0">The tree carries <code>gap: 9</code>, <code>gap: 11</code>, '
      '<code>gap: 2</code> and <code>padding: 15</code> inline. Each rounds to the nearest allowed '
      'value &mdash; 8, 12, 4, 16. This is the single cheapest consistency win in the codebase: no '
      'layout changes, just one scale.</p></div>'
      '<div class="rule"><h4>Density: 844px is the budget</h4>'
      '<p class="spec" style="margin:0">Six quick-action tiles at 104px cost <b>336px</b> &mdash; more '
      'than a whole job card and more than a third of the screen. At 60px each as an icon-well row '
      'they cost <b>196px</b>, and the first job listing moves above the fold. <b>Confirmed on the '
      'live device:</b> the six tiles really do occupy about <b>875px of 2992</b> (&asymp;29% of the '
      'screen). Nothing was removed; it was made shorter.</p></div></div></div>'

      '<div class="sec"><h2><span class="n">&sect;4</span>Corner treatment &mdash; one formula, not a '
      'mood</h2>'
      '<p class="lede">The app already applies this correctly in the icon wells (16 &minus; 16 = 11-12 '
      'for a 38&times;38 well, 9 for a 30&times;30 well). It just needs to be the rule everywhere '
      'instead of a habit in some places.</p>'
      '<div class="note" style="border-left-color:var(--ember)">'
      '<span class="tag">RULE &sect;4.1</span><h4>inner radius = outer radius &minus; outer padding</h4>'
      '<p>Clamp to the nearest token <b>below</b>. A <code>card</code> (16) with 16px padding holding a '
      '38&times;38 element gets <code>input-lg</code> (12). A <code>card-lg</code> (20) with 20px '
      'padding gets <code>card</code> (16). <b>Never hand-write 14</b> &mdash; it is neither an outer '
      'nor an inner token, and it is used today by <code>ui/toast.tsx:133</code> and '
      '<code>ui/list-row.tsx:54</code>, and by <code>profile-screen.tsx</code> for a card-level '
      'container.</p></div>'
      '<div class="row g16" style="flex-wrap:wrap;margin-top:20px">' + radii + '</div></div>'

      '<div class="sec"><h2><span class="n">&sect;5</span>Elevation &mdash; the content plane is flat, '
      'the floating layer has shadow</h2><div class="rule-grid">'
      '<div class="rule"><h4>Content (the default)</h4>'
      '<div class="kv"><span>surface</span><b>card #FFFFFF</b></div>'
      '<div class="kv"><span>edge</span><b>1px border #E9E0D4</b></div>'
      '<div class="kv"><span>shadow</span><b>NONE at rest</b></div>'
      '<p class="spec" style="margin:8px 0 0">A shadow on every card is an offscreen compositing pass '
      'per card, per frame, on a GPU with a third of the throughput of a Pixel. For content that does '
      'not move it buys nothing.</p></div>'
      '<div class="rule"><h4>Pressable content</h4>'
      '<div class="kv"><span>at rest</span><b>flat, like content</b></div>'
      '<div class="kv"><span>on press</span><b>scale .975-.985</b></div>'
      '<div class="kv"><span>on hover (web)</span><b>shadow.card-hover</b></div></div>'
      '<div class="rule"><h4>The floating layer</h4>'
      '<div class="kv"><span>dialogs / sheets</span><b>shadow.floating</b></div>'
      '<div class="kv"><span>toasts</span><b>shadow.floating</b></div>'
      '<div class="kv"><span>sticky action bar</span><b>shadow.floating</b></div>'
      '<div class="kv"><span>ember CTA</span><b>shadow.ember-hard</b></div></div>'
      '<div class="rule"><h4>Two more surface rules</h4>'
      '<div class="kv"><span>page background</span><b>cream / sand only</b></div>'
      '<div class="kv"><span>dashed border</span><b>empty / placeholder only</b></div>'
      '<p class="spec" style="margin:8px 0 0"><code>home-screen.tsx:540</code> already uses dashed for '
      'exactly this and nowhere else &mdash; and the live device shows the same dashed '
      '&ldquo;Bado hakuna CV&rdquo; card. Keep it as the only meaning of dashed.</p></div>'
      '</div></div>'

      '<div class="sec"><h2><span class="n">&sect;6</span>Iconography</h2><div class="rule-grid">'
      '<div class="rule"><h4>Three sizes only</h4>'
      '<div class="kv"><span>14</span><b>inline with text, badges</b></div>'
      '<div class="kv"><span>18</span><b>row leading icon, header action</b></div>'
      '<div class="kv"><span>20</span><b>icon-well centrepiece, empty state</b></div>'
      '<p class="spec" style="margin:8px 0 0">The tree also uses 11, 15, 16 and 19. Each rounds to one '
      'of the three.</p></div>'
      '<div class="rule"><h4>Weight and fill</h4>'
      '<div class="kv"><span>stroke</span><b>outline, 1.75</b></div>'
      '<div class="kv"><span>filled</span><b>only 2 cases</b></div>'
      '<p class="spec" style="margin:8px 0 0">Filled is reserved for (a) the active tab-bar icon, '
      '(b) the <code>SumaiyaMark</code> glyph. Everything else in this set is outline, and a filled '
      'icon visibly changes its weight.</p></div>'
      '<div class="rule"><h4>Colour split (from &sect;1)</h4>'
      '<div class="kv"><span>icon on tint</span><b>ember #DA4A1C &middot; 3.59:1</b></div>'
      '<div class="kv"><span>text at 14px</span><b>ember-shadow &middot; 6.16:1</b></div>'
      '<p class="spec" style="margin:8px 0 0">Icons are non-text: WCAG asks 3:1 and ember passes. Text '
      'asks 4.5:1 and ember does not &mdash; which is why the two roles diverge. Stated as two rules so '
      'nobody has to remember the ratio.</p></div>'
      '<div class="rule"><h4>An icon never carries meaning alone</h4>'
      '<div class="kv"><span>ok</span><b>chevron, drag handle</b></div>'
      '<div class="kv"><span>not ok</span><b>an icon with no label</b></div>'
      '<div class="kv"><span>or</span><b>accessibilityLabel</b></div></div>'
      '</div></div>'

      '<div class="sec"><h2><span class="n">&sect;7</span>Motion &mdash; the existing standard, plus '
      'four named additions and a ban list</h2>'
      '<p class="lede"><code>docs/MOTION-STANDARD-2026-09-20.md</code> already names every composite '
      'the app needs. The gap is <b>adoption</b>, not missing rules &mdash; so this section adds only '
      'what the standard does not yet cover, and one honest ban list.</p>'
      '<div class="rule-grid">'
      '<div class="rule"><h4>The tokens (unchanged)</h4>' + motion + '</div>'
      '<div class="rule"><h4>ADDED &sect;7.1 &mdash; Metric refresh</h4>'
      '<p class="spec" style="margin:0">A match-score or ATS badge whose value changes while on screen '
      'updates its <b>digits</b> instantly (&sect;4 already bans animating compared numbers) but its '
      'container may take <code>dur.micro</code> / <code>ease.inOut</code> on the background tint only. '
      'A fresh score no longer looks identical to a stale one, and the number the user is comparing '
      'never moves.</p></div>'
      '<div class="rule"><h4>ADDED &sect;7.2 &mdash; Banner stack</h4>'
      '<p class="spec" style="margin:0">When more than one nudge renders above the fold (the web '
      'dashboard can render seven), they do <b>not</b> each animate. One <code>Reveal</code> on the '
      '<b>group</b>. Eight things arriving at once is noise pretending to be hierarchy.</p></div>'
      '<div class="rule"><h4>ADDED &sect;7.3 &mdash; Loading to content, enforced</h4>'
      '<p class="spec" style="margin:0">Every ternary loading branch in the tree resolves to the '
      'standard&rsquo;s &ldquo;Loading to content&rdquo; row: placeholder <code>FadeOut</code> '
      '140ms <code>ease.in</code> <b>while</b> content enters at 300ms <code>ease.out</code>. A '
      'code-review checklist item, not new design.</p></div>'
      '<div class="rule"><h4>ADDED &sect;7.4 &mdash; The ban list</h4>'
      '<p class="spec" style="margin:0">Banned outright: scroll parallax &middot; '
      '<code>backdrop-filter</code> / blur transitions &middot; spring-based list-item entrances '
      '(timing curves only) &middot; any <code>withRepeat</code> without a 2-cycle bound <b>and</b> a '
      '<code>cancelAnimation</code> cleanup &middot; more than about 100 simultaneously animated '
      'nodes.</p></div></div>'
      '<div class="note" style="border-left-color:var(--error);margin-top:20px">'
      '<span class="tag">STAYS INSTANT &mdash; do not add motion here</span>'
      '<h4>Typing &middot; taps &middot; scrolling &middot; selection &middot; numbers being compared '
      '&middot; list text updating &middot; keyboard avoidance</h4>'
      '<p>Apple-grade is not &ldquo;everything moves&rdquo;. Adding motion to any of these is a '
      'regression, and Reduce Motion collapses the rest to <b>1ms &mdash; never 0ms</b>, so '
      '<code>withTiming</code>&rsquo;s finished callback still fires.</p></div></div>')

    write("00-design-system.html", doc(
        "Mfumo wa kubuni (design system)",
        "The rules every screen obeys, written so a developer implements them without judgement calls. "
        "Palette and logo untouched &mdash; the palette is reproduced here verbatim as proof.",
        ds))

    CARDS = [
        ("00-design-system.html", "00", "Mfumo wa kubuni", "The design system",
         "Nine type roles, the 4px spacing scale, concentric radii, the elevation split between the "
         "content plane and the floating layer, three icon sizes, and the motion additions + ban list. "
         "Includes the measured contrast finding that drives the ember-as-text rule."),
        ("01-home.html", "01", "Nyumbani (home)", "Home / dashibodi",
         "Before and after side by side. The advert leaves the first slot, saved-state becomes "
         "visible, quick actions halve in height, and the loading boundary stops popping. "
         "<b>Approved by the owner as the reference for the system&rsquo;s direction.</b>"),
        ("02-cv-editor.html", "02", "Kihariri cha CV", "The document editor",
         "Section rail to jump between form sections, an autosave state the user can see, and the PDF "
         "export moved into the thumb zone."),
        ("03-jobs-feed.html", "03", "Ajira", "The jobs feed",
         "One entry point for the eye, a score badge that stops meaning two things, and a corrected "
         "note: the live device proves this feed is populated, and that a new account sees the "
         "<i>unmatched</i> list by default."),
        ("04-profile.html", "04", "Wasifu", "Profile",
         "Who is signed in, one scored prompt that explains why matching is weak, and destructive "
         "actions ordered by how recoverable they are. The device confirmed the DANGER ZONE split."),
        ("05-empty-loading-error.html", "05", "Hali tupu / kupakia / hitilafu",
         "Empty, loading and error", "One composite, three faces. The skeleton keeps the geometry of "
         "what replaces it; the error tells the user what is still available before asking them to retry."),
        ("06-chat.html", "06", "Sanduku la mazungumzo", "The chat box",
         "Four starter chips cut to two, the artefact rendered in the thread that produced it, and the "
         "composer held still because typing must stay instant. The assistant itself is live "
         "(DeepSeek), so nothing here assumes a broken one."),
        ("07-web-nav.html", "07", "Upau wa urambazaji wa wavuti", "Web navigation",
         "The nav that was never designed: four primaries + the assistant + Zaidi on desktop, the "
         "signed-out bar, the narrow-desktop band, and a mobile-web bar that mirrors the APK&rsquo;s "
         "five slots instead of fighting them."),
        ("08-overlays.html", "08", "Lugha moja ya madirisha", "One overlay language",
         "Five variants &mdash; bottom sheet, confirm dialog, toast, full-screen sheet, share sheet "
         "&mdash; plus the audit that shows three native sheet radii, six web scrims and seven "
         "z-indices where the theme already defines one."),
        ("09-welcome.html", "09", "Njia ya kukaribisha", "The welcoming sequence",
         "Launch to first arrival as ONE sequence: the audit of what each welcoming screen does "
         "differently (four origins, thirteen durations, five easing families), the six divergences "
         "named, and the hand-off that fixes &ldquo;different elements stacked together&rdquo;."),
    ]
    cards = "".join(
        '<a href="' + href + '" style="text-decoration:none;color:inherit;display:block">'
        '<div class="card pad pressable" style="display:flex;gap:16px;align-items:flex-start;'
        'margin-bottom:12px">'
        '<div style="font-family:var(--font-mono);font-size:13px;font-weight:700;'
        'color:var(--ember-text);flex:0 0 34px">' + num + '</div>'
        '<div class="grow"><div class="r-section" style="font-size:16px">' + sw_title + ' '
        '<span class="muted" style="font-weight:600;font-size:13px">&middot; ' + en_title + '</span></div>'
        '<div class="r-caption body" style="margin-top:6px;line-height:1.55">' + desc + '</div></div>'
        '<div style="color:var(--text-muted);flex:0 0 auto">' + ico("chevron", 18) + '</div></div></a>'
        for href, num, sw_title, en_title, desc in CARDS)

    idx = ('<div class="sec"><h2><span class="n">&rsaquo;</span>What this is</h2>'
      '<p class="lede">A screen and motion redesign <b>proposal</b> for both platforms &mdash; a spec '
      'plus mockups you can open and look at. It improves what exists; it adds no feature that does not '
      'replace one. The palette and the logo are untouched.</p>'
      '<div class="rule-grid">'
      '<div class="rule"><h4>Fixed by the owner</h4>'
      '<div class="kv"><span>colours</span><b>not changed</b></div>'
      '<div class="kv"><span>logo / SumaiyaMark</span><b>not changed</b></div>'
      '<div class="kv"><span>product name</span><b>Sumaiya</b></div>'
      '<div class="kv"><span>product AI</span><b>DeepSeek (live, verified)</b></div>'
      '<div class="kv"><span>language</span><b>Swahili-first</b></div></div>'
      '<div class="rule"><h4>What was measured, not assumed</h4>'
      '<div class="kv"><span>screens inventoried</span><b>99 (51 + 21 + 27)</b></div>'
      '<div class="kv"><span>contrast pairs computed</span><b>16</b></div>'
      '<div class="kv"><span>found below AA 4.5:1</span><b>4 (all text)</b></div>'
      '<div class="kv"><span>design pages</span><b>10</b></div>'
      '<div class="kv"><span>phone frames rendered</span><b>8</b></div>'
      '<div class="kv"><span>real-device captures</span><b>6 + a cold-start recording</b></div>'
      '<div class="kv"><span>frames judged by vision</span><b>14</b></div></div>'
      '<div class="rule"><h4>How to read a mockup</h4>'
      '<p class="spec" style="margin:0">Every page is a standalone HTML file &mdash; open it in a '
      'browser, no build step. The phone frames are real 390px layouts, and the animations run, so you '
      'see the entrances rather than a still. The notes beside each frame carry the '
      '<code>file:line</code> of the code that exists today.</p></div></div></div>'

      '<div class="sec"><h2><span class="n">&rsaquo;</span>The mockups</h2>' + cards + '</div>'

      '<div class="sec"><h2><span class="n">&rsaquo;</span>Honesty notes</h2>'
      '<div class="note note--before"><span class="tag">WHAT THESE ARE NOT</span>'
      '<h4>Mockups, not a shipped change</h4>'
      '<p>No source file was modified. Every proposal here is a description tied to a current '
      '<code>file:line</code>; the mockups are HTML that demonstrates the target, and the phone frames '
      'may show slightly different text lengths than a real 360dp budget phone would give.</p></div>'
      '<div class="note note--before"><span class="tag">CORRECTED ON THE LIVE DEVICE</span>'
      '<h4>the job feed is NOT empty &mdash; this document was wrong about that</h4>'
      '<p>An earlier draft said the job feed was empty in production. A capture of the running APK '
      'contradicts it: real postings from CCBRT, CRDB Bank, Ramada and others, each with '
      '<b>Lenga CV yangu</b> and <b>Fungua tangazo</b>. <b>What the capture also showed is more '
      'useful</b> &mdash; not one card carried a match score, because a new account has no career '
      'profile, so the unmatched list is the default. See '
      '<code>_device/device-07-jobs-live.png</code>. Two further corrections came from the device: the '
      'real tab label is <b>CV zangu</b> (not CV) and the real quick action is <b>Ukaguzi wa ATS</b> '
      '(not Ukaguzi wa CV). Both are fixed in the mockups.</p></div>'
      '<div class="note note--ban"><span class="tag">WHAT I COULD NOT VERIFY</span>'
      '<h4>Onboarding animation on the device, and a live chat turn</h4>'
      '<p>The onboarding slides and first-run steps could only be re-recorded by clearing app data on '
      'the owner&rsquo;s live phone, which I did not do &mdash; so the welcome audit is from source for '
      'those two screens and from pixels only for the cold start. I also did not send a message to the '
      'assistant, so the chat mockup is a design proposal rather than a live before/after. No claim in '
      'this proposal is a device measurement unless it says so.</p></div></div>')

    write("index.html", doc(
        "Sumaiya &mdash; pendekezo la muonekano 2026",
        "A screen and motion redesign proposal for the Android app and the web app: the spec, the "
        "design system, and mockups you can open. Colours and logo untouched.",
        idx,
        kicker="Sumaiya &middot; Redesign proposal &middot; 2026-09-20 &middot; docs/design/2026-09-20/"))
