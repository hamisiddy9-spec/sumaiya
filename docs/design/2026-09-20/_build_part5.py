# -*- coding: utf-8 -*-
"""The welcoming path as ONE sequence. Imported by _build_mockups.py last."""

WCSS = """
.strip{display:flex;gap:14px;overflow-x:auto;padding:4px 0 14px}
.card6{flex:0 0 200px;width:200px}
.card6 .screen6{border:8px solid var(--espresso);border-radius:26px;background:var(--cream);
  height:404px;overflow:hidden;position:relative;display:flex;flex-direction:column}
.card6 .screen6.dark{background:#171009}
.card6 .screen6.k{background:var(--cream)}
.stepbar{display:flex;align-items:center;gap:6px;margin:0 0 8px}
.stepdot{height:5px;border-radius:999px;background:var(--border);flex:1}
.stepdot.on{background:var(--ember)}
.stepdot.done{background:var(--border-input)}
.now{font-size:10px;font-weight:800;letter-spacing:.3px;text-transform:uppercase;
  color:var(--ember-text);margin:0 0 4px}
.was{font-family:var(--font-mono);font-size:10.5px;line-height:1.5;color:var(--text-body);
  background:var(--sand-2);border-radius:8px;padding:6px 8px;margin-top:6px}
.was b{color:var(--espresso)}
.should{font-size:12.5px;line-height:1.5;color:var(--text-body);margin-top:6px}
.should b{color:var(--espresso)}
table.audit{width:100%;border-collapse:collapse;font-size:12.5px;background:var(--card);
  border:1px solid var(--border);border-radius:12px;overflow:hidden}
table.audit th{text-align:left;font-size:11px;letter-spacing:.3px;text-transform:uppercase;
  color:var(--text-muted);background:var(--sand-2);padding:9px 12px;border-bottom:1px solid var(--border)}
table.audit td{padding:9px 12px;border-bottom:1px solid var(--border);vertical-align:top;color:var(--text-body)}
table.audit tr:last-child td{border-bottom:0}
table.audit code{font-family:var(--font-mono);font-size:11px;color:var(--espresso)}
.bad{color:var(--error);font-weight:700}
.pill{display:inline-block;font-size:10.5px;font-weight:800;border-radius:999px;padding:2px 8px;white-space:nowrap}
.pill--chg{background:var(--gold-tint);color:var(--warning)}
.pill--ok{background:#E3F1EE;color:var(--success)}
.mk{display:grid;place-items:center;border-radius:22px;background:var(--ember);color:var(--cream)}
"""


def build4(g):
    ico, mark, note, doc, write = g["ico"], g["mark"], g["note"], g["doc"], g["write"]

    def frame6(caption, now, should, inner, dark=False, step=1, of_=6, was=""):
        dots = "".join('<div class="stepdot' + (' on' if i + 1 == step else
                       (' done' if i + 1 < step else '')) + '"></div>' for i in range(of_))
        return ('<div class="card6"><p class="now">' + str(step) + ' / ' + str(of_) + ' &middot; '
                + caption + '</p><div class="stepbar">' + dots + '</div>'
                '<div class="screen6' + (' dark' if dark else '') + '">' + inner + '</div>'
                '<div class="was"><b>today:</b> ' + now + '</div>'
                '<div class="should">' + should + '</div></div>')

    def centred(inner, pad="28px"):
        return ('<div style="flex:1;display:flex;flex-direction:column;align-items:center;'
                'justify-content:center;padding:' + pad + ';text-align:center">' + inner + '</div>')

    # 1 · launch
    f1 = frame6("Kuwasha (launch)", "cream mark at 480ms with <b>Easing.back(1.6)</b> &mdash; the only "
                "overshoot in the app; word at 240ms + 420ms; a 2-cycle breath at 900ms",
                "the mark arrives by <b>opacity + 12px rise</b> at <b>dur.slow</b>, no overshoot. "
                "The breath stays but is bounded and cancelled on unmount.",
                centred('<div class="mk" style="width:84px;height:84px">' + mark(40) + '</div>'
                        '<div style="font-family:var(--font-display);font-weight:800;font-size:17px;'
                        'margin-top:16px">Sumaiya</div>'
                        '<div class="r-caption muted" style="margin-top:6px">Kazi yako, kwa Kiswahili</div>'),
                step=1, was="480ms · back(1.6) overshoot · scale origin")

    # 2 · language
    def langcard(code, name, on=False):
        return ('<div class="card pad-row" style="display:flex;align-items:center;gap:10px;margin-bottom:8px;'
                + ('border-color:var(--ember);background:var(--ember-tint)' if on else '') + '">'
                '<div class="r-body" style="font-weight:800;font-size:13px;width:30px">' + code + '</div>'
                '<div class="grow r-bodysmall" style="font-weight:700">' + name + '</div>'
                + (ico("check", 16, "var(--ember-text)") if on else '') + '</div>')

    f2 = frame6("Lugha (language)", "cards <b>FadeInDown.delay(200 + i*80)</b>, 360ms &mdash; a <b>rise</b>, "
                "with an uncapped 80ms stagger",
                "same <b>rise</b> idiom as every other list in the app, stagger through "
                "<code>staggerDelayMs</code> so it is capped at 6 items.",
                '<div style="padding:24px 16px">'
                '<div class="r-section" style="font-size:15px;margin-bottom:12px">Chagua lugha</div>'
                + langcard("SW", "Kiswahili", True) + langcard("EN", "English")
                + '</div>',
                step=2, was="FadeInDown 360ms · rise · delay 200+i*80 uncapped")

    # 3 · a slide
    f3 = frame6("Onyesho (slides)", "container <b>FadeIn 360 / FadeOut 220</b>; art <b>FadeIn 420</b>; "
                "CTA <b>FadeInDown.delay(300)</b> default duration; scroll-linked <b>opacity interpolation</b> "
                "on 3 different ranges",
                "ONE origin for the slide (<b>rise 12px</b>, <code>dur.slow</code>) and one for the CTA "
                "(<code>dur.slow</code> + <code>dur.fast</code> delay). No scroll-linked opacity: the "
                "standard bans scroll-driven reveals on a phone.",
                '<div style="padding:24px 16px;text-align:center">'
                '<div class="well" style="width:64px;height:64px;border-radius:20px;margin:8px auto 14px">'
                + ico("file-text", 28) + '</div>'
                '<div class="r-section" style="font-size:15px">CV inayokufikisha mwajini</div>'
                '<div class="r-bodysmall muted" style="margin-top:8px;line-height:19px">'
                'Bandika tangazo la kazi, nami nitaandika CV inayolingana nalo.</div>'
                '<div class="row-tight" style="justify-content:center;gap:6px;margin-top:20px">'
                '<div style="width:6px;height:6px;border-radius:99px;background:var(--ember)"></div>'
                '<div style="width:6px;height:6px;border-radius:99px;background:var(--border)"></div>'
                '<div style="width:6px;height:6px;border-radius:99px;background:var(--border)"></div>'
                '</div></div>'
                '<div style="padding:0 16px 16px"><button class="btn btn--primary btn--sm btn--block">'
                'Endelea</button></div>',
                step=3, was="FadeIn 360 / FadeOut 220 · art 420 · CTA 300 · scroll-linked opacity")

    # 4 · a first-run step
    f4 = frame6("Hatua ya kwanza (first run)", "<b>FadeInRight 260 / FadeOutLeft 150</b> &mdash; a "
                "<b>horizontal</b> origin, and the only screen in the sequence that moves sideways",
                "the same <b>rise</b> as the slides, with a <b>progress bar that persists</b> across "
                "steps instead of a step counter that vanishes. Horizontal motion is reserved for "
                "push/pop.",
                '<div style="padding:20px 16px">'
                '<div class="r-micro muted" style="margin-bottom:10px">Hatua 3 kati ya 8</div>'
                '<div class="stepbar" style="margin-bottom:16px">'
                + "".join('<div class="stepdot' + (' on' if i < 3 else '') + '"></div>' for i in range(8))
                + '</div>'
                '<div class="r-section" style="font-size:15px;margin-bottom:12px">Uzoefu wako</div>'
                '<div style="min-height:44px;border:1px solid var(--border-input);border-radius:12px;'
                'background:var(--card);padding:11px 13px;font-size:14px">Mhasibu &middot; Azania Bank</div>'
                '<div style="min-height:44px;border:1px solid var(--border-input);border-radius:12px;'
                'background:var(--card);padding:11px 13px;font-size:14px;margin-top:8px">Miaka 3</div>'
                '</div>'
                '<div style="padding:0 16px 16px"><button class="btn btn--primary btn--sm btn--block">'
                'Endelea</button></div>',
                step=4, was="FadeInRight 260 / FadeOutLeft 150 · horizontal origin")

    # 5 · sign in
    f5 = frame6("Kuingia (sign-in)", "step <b>FadeInRight 200 / FadeOutLeft 140</b>; then inner blocks "
                "<b>FadeIn 240</b> and <b>FadeIn 200</b> &mdash; three durations for one screen",
                "one entry for the screen (<b>rise</b>, <code>dur.slow</code>) and one for the code "
                "field appearing (<code>dur.base</code>, in place). The email you typed "
                "<b>persists across the boundary</b> into the code step, as a visible chip.",
                '<div style="padding:24px 16px">'
                '<div class="r-section" style="font-size:15px;margin-bottom:4px">Ingia</div>'
                '<div class="r-caption muted" style="margin-bottom:14px">Tumetuma msimbo kwa '
                'asha@example.com</div>'
                '<div style="min-height:44px;border:1px solid var(--ember);border-radius:12px;'
                'background:var(--card);padding:11px 13px;font-family:var(--font-mono);'
                'font-size:16px;letter-spacing:6px">4 2 _ _ _ _</div>'
                '</div>'
                '<div style="padding:0 16px 16px"><button class="btn btn--primary btn--sm btn--block">'
                'Thibitisha</button></div>',
                step=5, was="FadeInRight 200 / FadeOutLeft 140 · inner 240 then 200")

    # 6 · arrival
    f6 = frame6("Kuwasili (arrival at home)",
                "root mode switch <b>fade 340</b>, and the home content then plays its own "
                "<b>FadeInDown 320</b> entrances at delays 40/60/120/170/180 &mdash; a second, "
                "unrelated arrival stacked on the first",
                "the root fade <b>is</b> the arrival: the home header is already painted as the "
                "colour field dissolves, and its blocks rise once, on the shared stagger. No second "
                "entrance.",
                '<div style="padding:18px 14px">'
                '<div class="r-caption muted">Habari za leo asubuhi,</div>'
                '<div class="r-screen" style="font-size:20px">Asha</div>'
                '<div class="card pad" style="margin-top:12px">'
                '<div class="r-bodysmall" style="font-weight:800">Mhasibu, Dar es Salaam</div>'
                '<div class="r-caption muted" style="margin-top:3px">Azania Bank &middot; Ulinganifu 78%</div>'
                '</div><div class="card pad" style="margin-top:10px">'
                '<div class="r-bodysmall" style="font-weight:800">Shughuli za haraka</div>'
                '<div class="r-caption muted" style="margin-top:3px">Tafuta kazi &middot; Miundo 224'
                '</div></div></div>',
                dark=True, step=6, was="root fade 340 + home FadeInDown 320 at 40…180")

    def row(cells, bad=False):
        return "<tr>" + "".join("<td>" + c + "</td>" for c in cells) + "</tr>"

    def head(cells):
        return "<tr>" + "".join("<th>" + c + "</th>" for c in cells) + "</tr>"

    audit = ('<table class="audit">'
             + head(["screen", "entry animation", "duration", "easing", "origin", "what it shares with "
                     "its neighbour"])
             + row(["splash mark <code>splash-screen.tsx:36</code>", "opacity + scale", 
                    "480ms", "back(1.6)", "<b class='bad'>scale, overshoot</b>", "nothing"])
             + row(["splash word <code>:37</code>", "opacity", "420ms after 240ms delay",
                    "out(cubic)", "fade", "nothing"])
             + row(["root mode switch <code>nav-config.ts:44-53</code>", "cross-fade", "340ms",
                    "platform", "fade", "duration only"])
             + row(["onboarding container <code>onboarding-screen.tsx:172</code>",
                    "FadeIn / FadeOut", "360 / 220", "default", "fade", "nothing"])
             + row(["onboarding language <code>:204</code>", "FadeInDown", "360ms, delay 200+i*80",
                    "default", "<b>rise from below</b>", "nothing"])
             + row(["onboarding art <code>:362</code>", "FadeIn", "420", "default", "fade", "nothing"])
             + row(["onboarding collapse <code>:318</code>", "withTiming on an interpolated value",
                    "320", "in(cubic)", "<b class='bad'>scroll-linked opacity</b>",
                    "banned by the standard"])
             + row(["onboarding CTA <code>:415</code>", "FadeInDown", "300 default", "default",
                    "<b>rise</b>", "origin with the language cards"])
             + row(["sign-in step <code>sign-in-screen.tsx:144</code>", "FadeInRight / FadeOutLeft",
                    "200 / 140", "default", "<b class='bad'>horizontal from the right</b>", "nothing"])
             + row(["sign-in inner <code>:241</code>", "FadeIn", "240", "default", "fade", "nothing"])
             + row(["sign-in inner <code>:265</code>", "FadeIn", "200", "default", "fade", "nothing"])
             + row(["first-run step <code>first-run-screen.tsx:553</code>",
                    "FadeInRight / FadeOutLeft", "260 / 150", "default",
                    "<b class='bad'>horizontal from the right</b>", "origin with sign-in's step"])
             + row(["home blocks <code>home-screen.tsx:305,366,401,432,466</code>", "FadeInDown",
                    "320ms at delays 40/60/120/170/180", "default", "<b>rise from below</b>",
                    "origin with nothing in the sequence above it"])
             + '</table>')

    def dv(code, why):
        return ('<tr><td><code>' + code + '</code></td><td>' + why + '</td></tr>')

    divergence = ('<table class="audit">' + head(["the divergence", "why it reads as a separate piece"])
                  + dv("480 / 420 / 340 / 360 / 360 / 420 / 320 / 300 / 200 / 240 / 200 / 260 / 320",
                       "Thirteen durations across six screens. The motion tokens define <b>seven</b> "
                       "(1, 90, 140, 220, 260, 300, 340). At least eight of these are not tokens, so "
                       "no two screens share a rhythm.")
                  + dv("scale-with-overshoot &middot; rise &middot; horizontal &middot; cross-fade",
                       "Four different <b>origins</b> in one sequence. An element that comes from the "
                       "side, then one that rises, then one that pops, then one that fades, reads as "
                       "four different apps.")
                  + dv("back(1.6) &middot; out(cubic) &middot; in(cubic) &middot; inOut(quad) &middot; default",
                       "Five easing families. The overshoot on the splash is the standard's single "
                       "sanctioned exception, but nothing else in the sequence is even on the same "
                       "curve family.")
                  + dv("cream &rarr; espresso &rarr; cream (measured on the device)",
                       "The splash is pinned light (<code>root-navigator.tsx:216,228</code> "
                       "<code>ThemeScope mode=\"light\"</code>) while the root container paints "
                       "<code>c.bg</code> from the <b>unpinned</b> theme (<code>nav-config.ts:44-53</code>). "
                       "On a dark-mode phone that is a dark, blank gap between two cream screens &mdash; "
                       "twice. <b>This is the one divergence the user sees as a flash.</b>")
                  + dv("the mark inside a circle, then inside a rounded square",
                       "Two renderings of the same mark on two different backgrounds, in the same "
                       "cold start. The logo is fixed; its container is not.")
                  + dv("each screen enters from zero",
                       "Nothing <b>persists</b> across a boundary. The screen you leave takes its "
                       "layout with it and the next builds its own from nothing, so there is no "
                       "object that travels &mdash; and without one travelling object there is no "
                       "sequence, only a queue.")
                  + '</table>')

    body = ('<div class="sec">'
      '<h2><span class="n">A</span>The welcoming path as ONE sequence</h2>'
      '<p class="lede">The owner&rsquo;s words: <i>&ldquo;the app onboarding animations and other '
      'welcoming screens &hellip; they don&rsquo;t match, like different elements stacked '
      'together.&rdquo;</i> That is a systems diagnosis, and the frames below are the evidence: six '
      'screens, four entry origins, thirteen durations, five easing families, and nothing that '
      'survives a boundary.</p>'
      '<div class="strip">' + f1 + f2 + f3 + f4 + f5 + f6 + '</div>'
      '<p class="spec">Read the strip left to right. Under each frame: what it does <b>today</b>, and '
      'what it should do under one shared language. The <code>today</code> values are read from the '
      'files named in the audit below.</p>'
      '</div>'

      '<div class="sec"><h2><span class="n">B</span>The audit &mdash; what each welcoming screen does '
      'differently from its neighbours</h2>'
      '<p class="lede">This list of divergences <i>is</i> the &ldquo;stacked together&rdquo;. Every '
      'row is a place where two adjacent screens disagree about how a thing arrives.</p>'
      + audit + '</div>'

      '<div class="sec"><h2><span class="n">C</span>The six divergences, named</h2>'
      + divergence + '</div>'

      '<div class="sec"><h2><span class="n">D</span>The shared language that binds the sequence</h2>'
      '<div class="rule-grid">'
      '<div class="rule"><h4>D1 &middot; ONE entry idiom</h4>'
      '<div class="kv"><span>the idiom</span><b>rise</b></div>'
      '<div class="kv"><span>distance</span><b>12px</b> (the standard&rsquo;s <code>rise</code>)</div>'
      '<div class="kv"><span>entering</span><b>dur.slow 300ms &middot; ease.out</b></div>'
      '<div class="kv"><span>leaving</span><b>dur.fast 140ms &middot; ease.in</b></div>'
      '<p class="spec" style="margin:8px 0 0">If something rises, <b>everything</b> rises. Horizontal '
      'motion is reserved for push/pop between screens, and the splash&rsquo;s overshoot stays the '
      'standard&rsquo;s one sanctioned exception &mdash; it is the only element allowed to be '
      'different, and that is what makes it feel like a signature rather than a mistake.</p></div>'
      '<div class="rule"><h4>D2 &middot; ONE duration family</h4>'
      '<div class="kv"><span>entering</span><b>300 (dur.slow)</b></div>'
      '<div class="kv"><span>in place</span><b>220 (dur.base)</b></div>'
      '<div class="kv"><span>leaving</span><b>140 (dur.fast)</b></div>'
      '<div class="kv"><span>a screen push</span><b>260 (dur.screen)</b></div>'
      '<div class="kv"><span>the root mode switch</span><b>340 (dur.field)</b></div>'
      '<p class="spec" style="margin:8px 0 0">Five tokens replace thirteen ad-hoc numbers. Nothing in '
      'the welcoming path needs a duration that is not already defined.</p></div>'
      '<div class="rule"><h4>D3 &middot; ONE progress treatment</h4>'
      '<div class="kv"><span>form</span><b>a bar that persists across steps</b></div>'
      '<div class="kv"><span>slides</span><b>the same bar, same height, same colour</b></div>'
      '<div class="kv"><span>never</span><b>a per-screen counter that resets</b></div>'
      '<p class="spec" style="margin:8px 0 0">Today the slides use three dots, first-run uses a '
      '&ldquo;Hatua 3 kati ya 8&rdquo; line, and neither survives its screen. One bar, one geometry, '
      'carried across every step &mdash; it is the cheapest possible continuity signal and the one '
      'the user reads as &ldquo;I am X% of the way in&rdquo;.</p></div>'
      '<div class="rule"><h4>D4 &middot; ONE type and spacing rhythm</h4>'
      '<div class="kv"><span>screen heading</span><b>Display 30/36/800/-0.5</b></div>'
      '<div class="kv"><span>body</span><b>Body 14.5 or BodySmall 13.5</b></div>'
      '<div class="kv"><span>padding</span><b>20 screen &middot; 16 card</b></div>'
      '<div class="kv"><span>gaps</span><b>4 &middot; 8 &middot; 12 &middot; 16 &middot; 20 &middot; 24 &middot; 32</b></div>'
      '<p class="spec" style="margin:8px 0 0">The welcoming path currently rolls its own sizes per '
      'screen. Under the design system it is the same nine roles as everywhere else, which is what '
      'makes six screens look like one product.</p></div>'
      '<div class="rule"><h4>D5 &middot; THE HAND-OFF &mdash; what makes it continuous</h4>'
      '<p class="spec" style="margin:0">This is the rule that actually fixes his complaint. '
      '<b>One object travels.</b> At every boundary something from the outgoing screen is still '
      'present in the incoming frame:</p>'
      '<div class="kv"><span>launch &rarr; language</span><b>the mark shrinks to the header and stays</b></div>'
      '<div class="kv"><span>language &rarr; slides</span><b>the chosen language&rsquo;s code persists as a chip</b></div>'
      '<div class="kv"><span>slides &rarr; first run</span><b>the progress bar is the same object</b></div>'
      '<div class="kv"><span>step &rarr; step</span><b>the entered value persists where it was typed</b></div>'
      '<div class="kv"><span>first run &rarr; sign-in</span><b>the name/email already typed is shown, not asked again</b></div>'
      '<div class="kv"><span>sign-in &rarr; home</span><b>the root fade arrives over an already-painted home</b></div>'
      '<p class="spec" style="margin:8px 0 0">No new animation is required for any of these. Each is '
      'a <b>layout</b> decision: keep one element mounted across the boundary and the sequence stops '
      'being a queue of screens. The outgoing content leaves at <code>dur.fast</code> <i>while</i> '
      'the incoming arrives at <code>dur.slow</code> &mdash; never one after the other, which is what '
      'produces the blank beat the user reads as a new app starting.</p></div>'
      '<div class="rule"><h4>D6 &middot; One theme across the whole path</h4>'
      '<p class="spec" style="margin:0">The pre-auth path is legitimately a light brand runway '
      '(<code>root-navigator.tsx</code> pins <code>ThemeScope mode="light"</code> and that is a good '
      'decision). The defect is that the <b>container</b> does not share it: '
      '<code>rootScreenOptions(c)</code> paints <code>c.bg</code> from the unpinned theme, so on a '
      'dark-mode phone the gaps between the light screens are dark. <b>One fix:</b> the root '
      'container&rsquo;s <code>contentStyle.backgroundColor</code> must be the same cream the pinned '
      'screens use. Nothing else changes, and the flash disappears.</p></div>'
      '</div></div>'

      '<div class="sec"><h2><span class="n">E</span>What it costs on a cheap phone</h2>'
      '<div class="rule-grid">'
      '<div class="rule"><h4>Downloads</h4>'
      '<div class="kv"><span>the whole welcoming path</span><b>0 new bytes</b></div>'
      '<div class="kv"><span>new images</span><b>none</b></div>'
      '<div class="kv"><span>new fonts</span><b>none</b></div>'
      '<p class="spec" style="margin:8px 0 0">This proposal is layout and timing only. It removes '
      'screens from the path rather than adding any, so it makes the first session <b>cheaper</b>: '
      'four onboarding slides collapse to one (behind a flag, per &sect;6 of the spec).</p></div>'
      '<div class="rule"><h4>What it paints</h4>'
      '<div class="kv"><span>simultaneous animated nodes</span><b>fewer than today</b></div>'
      '<div class="kv"><span>the removed scroll-linked opacity</span><b>one continuous per-frame '
      'interpolation deleted</b></div>'
      '<div class="kv"><span>the removed doubled entrance</span><b>a second full set of '
      'FadeInDown blocks deleted</b></div>'
      '<div class="kv"><span>animation class</span><b>transform + opacity only</b></div>'
      '<p class="spec" style="margin:8px 0 0">The two things removed are both per-frame work: the '
      'onboarding collapse drives an interpolated opacity from the scroll position, and home replays '
      'five block entrances on top of the root fade. Deleting both makes the arrival '
      '<b>cheaper</b> than the current one.</p></div>'
      '<div class="rule"><h4>What stays instant</h4>'
      '<div class="kv"><span>typing the code</span><b>never animated</b></div>'
      '<div class="kv"><span>the language tap</span><b>selected on the frame it is tapped</b></div>'
      '<div class="kv"><span>the progress bar</span><b>moves once per step, not per frame</b></div>'
      '</div>'
      '<div class="rule"><h4>Reduced motion</h4>'
      '<div class="kv"><span>every duration</span><b>1ms, never 0</b></div>'
      '<div class="kv"><span>the sequence</span><b>still legible: six static screens</b></div>'
      '<div class="kv"><span>nothing</span><b>is understood only by watching it move</b></div>'
      '<p class="spec" style="margin:8px 0 0">The hand-off objects (the chip, the bar, the typed '
      'value) are <b>static</b> evidence of continuity, so a user with motion off gets the strongest '
      'part of this proposal and loses only the pleasure of the travel.</p></div>'
      '</div></div>'

      '<div class="sec"><h2><span class="n">F</span>What the device showed, and what it disagreed '
      'with</h2>'
      '<p class="lede">A 6.3 MB <code>screenrecord</code> of a real cold start on the owner&rsquo;s '
      'phone (1344&times;2992, density 408), 12 frames extracted at 0.5s spacing, judged by a free '
      'vision model. The frames are in <code>_device/welcome-contact-sheet.png</code>.</p>'
      '<div class="rule-grid">'
      '<div class="rule"><h4>What the frames show (measured, not inferred)</h4>'
      '<div class="kv"><span>frame 1</span><b>cream background, mark in a CIRCLE</b></div>'
      '<div class="kv"><span>frames 2-3</span><b>dark background, COMPLETELY BLANK (~1s)</b></div>'
      '<div class="kv"><span>frame 4</span><b>cream background, mark in a ROUNDED SQUARE</b></div>'
      '<div class="kv"><span>frames 5-12</span><b>dark home with content</b></div>'
      '<div class="kv"><span>background order</span><b>cream &rarr; dark &rarr; dark &rarr; cream &rarr; dark</b></div>'
      '<p class="spec" style="margin:8px 0 0">The model read the background order as '
      '<i>&ldquo;white &rarr; black &rarr; black &rarr; white &rarr; black&rdquo;</i> and said '
      '<i>&ldquo;the white-to-black switch would be perceived as a flash&rdquo;</i>, and that the '
      'logo <i>&ldquo;appears twice &hellip; the symbol is identical, but the container differs '
      '(circle vs. square), so it is not identical&rdquo;</i>. Both are its readings of real pixels '
      'and both corroborate the owner.</p></div>'
      '<div class="rule"><h4>Where the model disagreed with the owner</h4>'
      '<p class="spec" style="margin:0">Asked whether the sequence reads as one arrival or as '
      'unrelated screens, it answered: <i>&ldquo;It reads as ONE continuous cold-start arrival. The '
      'only possible break is frames 2-3 (blank black), but they are part of the loading sequence, '
      'not unrelated screens&rdquo;</i> and <i>&ldquo;This is a designed welcome sequence, not a '
      'disjointed stack of separate pieces.&rdquo;</i></p>'
      '<p class="spec" style="margin:8px 0 0"><b>I am reporting the owner&rsquo;s read over the '
      'model&rsquo;s.</b> Two reasons, stated so he can judge: the model was shown the cold start '
      'only &mdash; the part of the path he is most likely to be describing is the <i>slides and '
      'first-run steps</i>, which I could not re-trigger without clearing his app data (forbidden). '
      'And its factual readings (the flash, the two containers, the blank second) support the '
      'complaint even where its verdict did not. A judgement of &ldquo;does this feel like one '
      'arrival&rdquo; is also precisely the kind of impression a vision transcript is weakest at.</p></div>'
      '<div class="rule"><h4>What I could not record</h4>'
      '<div class="kv"><span>onboarding slides</span><b>UNRECORDED &mdash; needs a first run</b></div>'
      '<div class="kv"><span>first-run steps</span><b>UNRECORDED &mdash; needs a first run</b></div>'
      '<div class="kv"><span>why</span><b>re-triggering needs clearing app data</b></div>'
      '<p class="spec" style="margin:8px 0 0">Reproducing them requires clearing the app&rsquo;s data '
      'on the owner&rsquo;s live phone, which would destroy his session and his data. I did not do it. '
      'The audit in B is therefore from source for those two screens, and from pixels only for the '
      'cold start.</p></div>'
      '</div></div>')

    write("09-welcome.html", doc(
        "Njia ya kukaribisha (the welcoming sequence)",
        "The owner&rsquo;s words: &ldquo;the app onboarding animations and other welcoming screens "
        "&hellip; they don&rsquo;t match, like different elements stacked together.&rdquo; This treats "
        "the welcoming path as ONE sequence, audits what each screen does differently, and gives the "
        "six divergences a single fix each.",
        body, extra_css=WCSS))
