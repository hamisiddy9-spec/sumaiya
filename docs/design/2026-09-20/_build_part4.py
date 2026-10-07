# -*- coding: utf-8 -*-
"""Web navigation + overlay language. Imported by _build_mockups.py last.

Rule for this file: no backslashes and no triple-quoted strings inside an
f-string expression — Python <3.12 rejects the backslash and the nested quotes
tokenize badly. Fragments are therefore built with single-quoted concatenation.
"""

NAV_CSS = """
.browser{width:100%;max-width:1250px;background:#fff;border:1px solid var(--border);
  border-radius:14px;overflow:hidden;box-shadow:var(--shadow-float)}
.browser__bar{display:flex;align-items:center;gap:8px;padding:9px 12px;background:var(--sand-2);
  border-bottom:1px solid var(--border)}
.dot{width:9px;height:9px;border-radius:50%;background:var(--border-input);opacity:.55}
.url{flex:1;background:var(--card);border:1px solid var(--border);border-radius:999px;
  padding:4px 12px;font-family:var(--font-mono);font-size:11px;color:var(--text-muted)}
.viewport{position:relative;background:var(--cream)}
.nav{display:flex;align-items:center;gap:18px;padding:0 20px;height:64px;
  background:var(--cream);border-bottom:1px solid var(--border)}
.nav__logo{display:flex;align-items:center;gap:8px;font-family:var(--font-display);
  font-weight:800;font-size:15px;letter-spacing:-.3px;color:var(--espresso);white-space:nowrap}
.nav__items{display:flex;align-items:center;gap:4px}
.nav__item{display:flex;align-items:center;gap:7px;height:38px;padding:0 12px;
  border-radius:10px;font-size:13.5px;font-weight:600;color:var(--text-body);white-space:nowrap}
.nav__item.on{color:var(--espresso);font-weight:800;background:var(--sand-2)}
.nav__assist{display:flex;align-items:center;gap:8px;height:38px;padding:0 14px;
  border-radius:999px;background:var(--ember-tint);color:var(--ember-text);
  font-size:13.5px;font-weight:800;white-space:nowrap}
.nav__right{display:flex;align-items:center;gap:10px;margin-left:auto}
.nav__avatar{width:34px;height:34px;border-radius:11px;background:var(--ember);color:var(--cream);
  display:grid;place-items:center;font-family:var(--font-display);font-weight:800;font-size:14px}
.nav__ghost{display:flex;align-items:center;gap:7px;height:38px;padding:0 12px;border-radius:10px;
  font-size:13.5px;font-weight:700;color:var(--espresso);white-space:nowrap}
.nav__cta{display:flex;align-items:center;gap:6px;height:38px;padding:0 16px;border-radius:12px;
  background:var(--ember-fill);color:var(--cream);font-size:13.5px;font-weight:800;white-space:nowrap}
.page{display:grid;grid-template-columns:200px 1fr;gap:20px;padding:20px}
.rail{border-right:1px solid var(--border);padding-right:16px}
.rail__h{font-size:11px;font-weight:700;letter-spacing:.4px;text-transform:uppercase;
  color:var(--text-muted);margin:0 0 10px}
.rail__i{display:flex;align-items:center;gap:9px;font-size:13px;color:var(--text-body);padding:6px 0}
.main{display:flex;flex-direction:column;gap:12px}
.block{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:14px}
.block__t{font-size:13.5px;font-weight:800;color:var(--espresso);margin:0 0 4px}
.block__b{font-size:12.5px;color:var(--text-body);margin:0;line-height:1.5}
.navframe{width:412px;flex:0 0 412px}
.mobweb{border:10px solid var(--espresso);border-radius:34px;overflow:hidden;background:var(--cream)}
.mobweb__bar{display:flex;align-items:center;gap:10px;height:52px;padding:0 16px;
  background:var(--cream);border-bottom:1px solid var(--border)}
.mobbar{display:flex;justify-content:space-between;padding:8px 8px 18px;background:var(--card);
  border-top:1px solid var(--border)}
.mobtab{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;
  color:var(--text-muted);font-size:10.5px;font-weight:700;padding-top:4px}
.mobtab.on{color:var(--ember-text)}
.avatar30{width:30px;height:30px;border-radius:10px;background:var(--ember);color:var(--cream);
  display:grid;place-items:center;font-weight:800;font-size:12.5px}
"""

OV_CSS = """
.ov-row{display:flex;align-items:center;gap:12px;padding:12px 4px;border-top:1px solid var(--border)}
.ov-row.first{border-top:0}
.grid2{display:grid;grid-template-columns:repeat(auto-fit,minmax(310px,1fr));gap:24px}
.varlabel{font-size:11px;font-weight:700;letter-spacing:.4px;text-transform:uppercase;
  color:var(--text-muted);margin:16px 0 8px}
.varlabel.first{margin-top:0}
.spec{font-size:12.5px;color:var(--text-body)}
.spec .kv{border-bottom:1px dashed var(--border)}
.spec .kv:last-child{border-bottom:0}
table.audit{width:100%;border-collapse:collapse;font-size:12.5px;background:var(--card);
  border:1px solid var(--border);border-radius:12px;overflow:hidden}
table.audit th{text-align:left;font-size:11px;letter-spacing:.3px;text-transform:uppercase;
  color:var(--text-muted);background:var(--sand-2);padding:9px 12px;border-bottom:1px solid var(--border)}
table.audit td{padding:9px 12px;border-bottom:1px solid var(--border);vertical-align:top;color:var(--text-body)}
table.audit tr:last-child td{border-bottom:0}
table.audit code{font-family:var(--font-mono);font-size:11px;color:var(--espresso)}
.pill{display:inline-block;font-size:10.5px;font-weight:800;border-radius:999px;padding:2px 8px;white-space:nowrap}
.pill--ok{background:#E3F1EE;color:var(--success)}
.pill--chg{background:var(--gold-tint);color:var(--warning)}
.audit h3{font-family:var(--font-display);font-size:15px;margin:26px 0 10px}
.scrimbox{position:relative;overflow:hidden;border-radius:12px;border:1px solid var(--border)}
.scrimbox__bg{position:absolute;inset:0;background:var(--sand);padding:16px}
.scrimbox__veil{position:absolute;inset:0;background:rgba(33,26,21,.45)}
.sheet{position:absolute;left:0;right:0;bottom:0;background:var(--card);padding:16px 16px 20px;
  border-radius:20px 20px 0 0;box-shadow:var(--shadow-float)}
.sheet__grip{width:36px;height:4px;border-radius:999px;background:var(--border);margin:0 auto 14px}
.dlgwrap{position:absolute;inset:0;display:grid;place-items:center;padding:20px}
.dlg{width:100%;max-width:300px;background:var(--card);border-radius:20px;padding:20px;
  box-shadow:var(--shadow-float);text-align:center}
.dlg .row{margin-top:18px}
.fullov{position:absolute;inset:0;background:var(--cream);display:flex;flex-direction:column}
.fullov__bar{display:flex;align-items:center;gap:12px;padding:14px 16px;
  border-bottom:1px solid var(--border)}
"""


def build3(g):
    ico, mark, phone, note, doc, write = g["ico"], g["mark"], g["phone"], g["note"], g["doc"], g["write"]

    # ── reusable fragments ────────────────────────────────────────────────
    def navitem(icon, label, on=False):
        return ('<div class="nav__item' + (' on' if on else '') + '">'
                + ico(icon, 16) + '<span>' + label + '</span></div>')

    def nav_desktop(on=0, signed_in=True, items=None):
        items = items or [("home", "Nyumbani"), ("file-text", "CV"),
                          ("briefcase", "Ajira"), ("target", "Maombi")]
        out = ['<div class="nav">',
               '<div class="nav__logo">' + mark(18) + ' Sumaiya</div>',
               '<div class="nav__items">']
        for i, (gl, lb) in enumerate(items):
            out.append(navitem(gl, lb, i == on))
        out.append('</div>')
        out.append('<div class="nav__assist">' + mark(15) + ' Sumaiya</div>')
        out.append('<div class="nav__right">')
        if signed_in:
            out.append('<div class="nav__ghost">' + ico("more", 16) + ' Zaidi</div>')
            out.append('<div class="nav__avatar">A</div>')
        else:
            out.append('<div class="nav__ghost">Ingia</div>')
            out.append('<div class="nav__cta">' + ico("lightning", 14) + ' Anza bure</div>')
        out.append('</div></div>')
        return "".join(out)

    def frame(url, inner, h=340):
        return ('<div class="browser"><div class="browser__bar">'
                '<span class="dot"></span><span class="dot"></span><span class="dot"></span>'
                '<span class="url">' + url + '</span></div>'
                '<div class="viewport" style="min-height:' + str(h) + 'px">' + inner + '</div></div>')

    rail_items = [("file-text", "Muhtasari wa siku"), ("chat", "Mahojiano"), ("sparkle", "Kozi"),
                  ("grid", "Miundo"), ("user", "Mipangilio"), ("lightning", "Premium")]
    rail = '<div class="rail"><p class="rail__h">Zaidi</p>' + "".join(
        '<div class="rail__i">' + ico(gl, 14) + ' ' + lb + '</div>' for gl, lb in rail_items) + '</div>'

    blocks = ('<div class="main">'
              '<div class="block"><p class="block__t">Habari za asubuhi, Asha</p>'
              '<p class="block__b">Nafasi 3 mpya zinaendana nawe. CV yako ya Mhasibu ina 78% '
              'ulinganifu na Mhasibu wa Azania Bank.</p></div>'
              '<div class="block"><p class="block__t">CV zako (3)</p>'
              '<p class="block__b">Mhasibu &middot; Mhudumu wa duka &middot; Karani wa mauzo</p></div>'
              '</div>')

    desktop = frame("sumaiya.app/dashboard",
                    nav_desktop(0) + '<div class="page">' + rail + blocks + '</div>', 350)

    signed_out = frame("sumaiya.app/sw",
                       nav_desktop(signed_in=False, items=[("grid", "Miundo"),
                                                           ("shield", "Ukaguzi wa CV"),
                                                           ("briefcase", "Ajira")])
                       + '<div class="page" style="grid-template-columns:1fr">'
                       + '<div class="main"><div class="block">'
                         '<p class="block__t">CV inayokufikisha mwajini.</p>'
                         '<p class="block__b">Bandika tangazo la kazi. Sumaiya anakusaidia kuandika '
                         'CV inayolingana nalo, kwa Kiswahili, kwenye simu yako, bila malipo, bila '
                         'akaunti.</p></div></div></div>', 240)

    narrow = frame("sumaiya.app/dashboard  &middot;  dirisha jembamba (768-1023px)",
                   nav_desktop(1, items=[("home", "Nyumbani"), ("file-text", "CV")])
                   + '<div class="page" style="grid-template-columns:1fr">'
                   + '<div class="main">'
                     '<div class="block" style="border-left:3px solid var(--ember)">'
                     '<p class="block__t">Nyumbani &middot; CV &middot; Sumaiya &middot; Zaidi</p>'
                     '<p class="block__b">In this band the labels drop, never the objects: '
                     '<b>Ajira</b> and <b>Maombi</b> fold into <b>Zaidi</b>, the assistant keeps its '
                     'pill and its name, and the account keeps its avatar. Nothing becomes an '
                     'icon-only mystery item &mdash; every collapsed destination is still named '
                     'inside <b>Zaidi</b>.</p></div>'
                     '<div class="block"><p class="block__t">Kwa nini</p>'
                     '<p class="block__b">A 768px window cannot hold four words plus an assistant '
                     'without crowding the thumb zone or wrapping. Two primaries plus the assistant '
                     'is the number that survives translation: Swahili labels are longer than their '
                     'English originals (<i>Nyumbani</i>, <i>Mipangilio</i>, '
                     '<i>Mahojiano</i>).</p></div></div></div>', 350)

    # ── mobile web ────────────────────────────────────────────────────────
    mobtabs = [("home", "Nyumbani", True), ("file-text", "CV", False),
               ("chat", "Sumaiya", False), ("camera", "Pakia", False), ("user", "Wasifu", False)]
    mobbar = '<div class="mobbar">' + "".join(
        '<div class="mobtab' + (' on' if on else '') + '">'
        + (mark(21, "var(--ember-text)") if gl == "chat" else ico(gl, 21))
        + '<span>' + lb + '</span></div>' for gl, lb, on in mobtabs) + '</div>'

    mobile_web = ('<div class="navframe">'
                  '<p class="r-micro muted" style="margin:0 0 10px">Mobile web &lt; 768px &mdash; the '
                  'same five slots as the APK</p>'
                  '<div class="mobweb">'
                  '<div class="mobweb__bar">'
                  '<div class="row-tight" style="gap:7px">' + mark(17)
                  + '<span style="font-family:var(--font-display);font-weight:800;font-size:14px">'
                    'Sumaiya</span></div>'
                  '<div style="margin-left:auto;display:flex;align-items:center;gap:10px">'
                  + ico("alert", 19, "var(--text-muted)")
                  + '<div class="avatar30">A</div></div></div>'
                  '<div style="padding:14px 16px 18px">'
                  '<div class="block" style="margin-bottom:10px">'
                  '<p class="block__t">Habari za asubuhi, Asha</p>'
                  '<p class="block__b">Nafasi 3 mpya zinaendana nawe.</p></div>'
                  '<div class="block"><p class="block__t">CV zako (3)</p>'
                  '<p class="block__b">Mhasibu &middot; Mhudumu wa duka</p></div></div>'
                  + mobbar + '</div></div>')

    nav_body = ('<div class="sec">'
      '<h2><span class="n">A</span>Desktop, signed in &mdash; four destinations, the assistant, '
      'then everything else</h2>'
      '<p class="lede">Nine destinations cannot be a nav row. The recommendation is a hard split '
      'between <b>what you do every session</b> and <b>what you do sometimes</b>.</p>'
      + desktop +
      '<div class="rule-grid" style="margin-top:20px">'
      '<div class="rule"><h4>The bar, left to right</h4>'
      '<div class="kv"><span>1 &middot; logo</span><b>the mark + Sumaiya</b></div>'
      '<div class="kv"><span>2 &middot; four primaries</span><b>Nyumbani &middot; CV &middot; Ajira &middot; Maombi</b></div>'
      '<div class="kv"><span>3 &middot; the assistant</span><b>a pill, not a tab</b></div>'
      '<div class="kv"><span>4 &middot; Zaidi</span><b>the long tail</b></div>'
      '<div class="kv"><span>5 &middot; account</span><b>avatar into a menu</b></div></div>'
      '<div class="rule"><h4>Why four, and which four</h4>'
      '<p class="spec" style="margin:0">The four that map to what this product is <i>for</i>: see '
      'the state (<b>Nyumbani</b>), write the document (<b>CV</b>), find the opening '
      '(<b>Ajira</b>), track it (<b>Maombi</b>). <b>Muhtasari wa siku</b>, <b>Mahojiano</b>, '
      '<b>Kozi</b>, <b>Mipangilio</b> and <b>Premium</b> are real but occasional, so they live in '
      '<b>Zaidi</b> &mdash; and they are still <i>named</i> there, never reduced to a bare icon.</p></div>'
      '<div class="rule"><h4>Why the assistant is a pill, not a fifth tab</h4>'
      '<p class="spec" style="margin:0">On desktop the assistant is a destination <b>and</b> a mode: '
      'you may want it beside what you are looking at rather than instead of it. A pill separates it '
      'from the four peers without spending a fifth slot. It is also the honest reading of the '
      'existing web app, where Sumaiya is already a top-level destination.</p></div>'
      '<div class="rule"><h4>Where the current route reads from</h4>'
      '<div class="kv"><span>item state</span><b>usePathname() prefix match</b></div>'
      '<div class="kv"><span>active treatment</span><b>espresso text + sand-2 fill</b></div>'
      '<div class="kv"><span>never</span><b>colour alone</b></div>'
      '<p class="spec" style="margin:8px 0 0">The active item changes <b>weight</b> and gets a '
      '<b>fill</b>, so the state survives greyscale and a sunlit screen. Ember is deliberately not '
      'the nav colour: it measures <b>3.89:1</b> on cream and a nav label is 13.5px.</p></div>'
      '</div></div>'

      '<div class="sec"><h2><span class="n">B</span>Signed out &mdash; three destinations and one '
      'verb</h2>' + signed_out +
      '<div class="rule-grid" style="margin-top:16px">'
      '<div class="rule"><h4>The differences, and only these</h4>'
      '<div class="kv"><span>destinations</span><b>Miundo &middot; Ukaguzi wa CV &middot; Ajira</b></div>'
      '<div class="kv"><span>right side</span><b>Ingia (ghost) + Anza bure (filled)</b></div>'
      '<div class="kv"><span>account menu</span><b>absent</b></div>'
      '<div class="kv"><span>assistant pill</span><b>absent &mdash; it needs a session</b></div></div>'
      '<div class="rule"><h4>The signed-out nav is the marketing nav</h4>'
      '<p class="spec" style="margin:0">The marketing surface already has its own nav '
      '(<code>marketing-nav.tsx</code>) with a logo + destinations + CTA shape. It keeps that role, '
      'and the signed-in bar must not leak into it. The two share the bar geometry (64px, 20px '
      'padding, cream) so the transition into the product is a change of contents, not a change of '
      'object.</p></div></div></div>'

      '<div class="sec"><h2><span class="n">C</span>Narrow desktop &mdash; 768 to 1023px</h2>'
      + narrow +
      '<div class="note" style="margin-top:16px">'
      '<span class="tag">DECISION</span><h4>Labels drop before objects do</h4>'
      '<p>Two primaries (<b>Nyumbani</b>, <b>CV</b>) plus the assistant and <b>Zaidi</b>. The reason '
      'is measurable, not aesthetic: Swahili labels are longer than their English originals, so a '
      'four-word bar wraps or crowds earlier here than it would in English. Nothing is ever an '
      'unlabelled icon. The account keeps its avatar at every width, because "who am I signed in as" '
      'is not a finding-a-destination task.</p></div></div>'

      '<div class="sec"><h2><span class="n">D</span>Mobile web &mdash; the nav must not fight the '
      'APK</h2><div class="stage">' + mobile_web + '<div class="notes">'
      + note("AUDIT &middot; dashboard/mobile-tab-bar.tsx:81",
             "the web already has a phone tab bar",
             "<p><code>mobile-tab-bar.tsx</code> exists and is <code>md:hidden</code>. It is already "
             "the right idea; what it is not yet is <b>the same five slots as the APK</b>. If the "
             "labels or the order differ, a user who has both surfaces learns two navigations for one "
             "product &mdash; and <code>docs/AREAS-AND-PARITY-2026-09-20.md</code> names exactly this "
             "drift as the failure mode to prevent.</p>")
      + note("THE RULE", "one product, one set of five",
             "<ul><li>Same five labels, same order, same icons as <code>app-tabs.tsx:1-146</code>: "
             "<b>Nyumbani &middot; CV &middot; Sumaiya &middot; Pakia &middot; Wasifu</b>.</li>"
             "<li>The active state is the same weight change, not a different treatment per "
             "platform.</li>"
             "<li>The mobile-web top bar holds only the logo and the account, so it is not a second "
             "nav competing for the same thumb zone.</li>"
             "<li>Its height clears <code>env(safe-area-inset-bottom)</code> exactly as the APK does; "
             "<code>globals.css</code> already defines <code>.safe-bottom-nav</code> and "
             "<code>.pb-tabbar</code>.</li></ul>")
      + note("HONEST LIMIT", "this does not make the web app the product",
             "<p>The APK is the product for this user. The web nav matters because a link shared on "
             "WhatsApp lands here first &mdash; and WhatsApp is the connective tissue in this market. "
             "So the mobile-web nav's job is to be <b>recognisable</b>, then hand the user to the "
             "APK, not to compete with it.</p>")
      + '</div></div></div>')

    write("07-web-nav.html", doc(
        "Upau wa urambazaji wa wavuti (web navigation)",
        "The web nav was never designed &mdash; every mockup so far has been a phone surface. This is "
        "the desktop bar, the signed-out bar, the narrow-desktop band, and the mobile-web bar that "
        "mirrors the APK's five slots.",
        nav_body, extra_css=NAV_CSS))

    # ═══════════════════════════════════════════════════════════════════════
    # 08 · OVERLAYS
    # ═══════════════════════════════════════════════════════════════════════
    def scrimbox(inner, h=430):
        return ('<div class="scrimbox" style="height:' + str(h) + 'px">'
                '<div class="scrimbox__bg">'
                '<div class="card pad" style="margin-bottom:10px">'
                '<div class="r-cardtitle">CV zako</div>'
                '<div class="r-caption muted" style="margin-top:2px">Mhasibu &middot; '
                'Ilibadilishwa leo</div></div>'
                '<div class="card pad"><div class="r-cardtitle">Mhudumu wa duka</div>'
                '<div class="r-caption muted" style="margin-top:2px">Ilibadilishwa jana</div></div>'
                '</div><div class="scrimbox__veil"></div>' + inner + '</div>')

    def ovrow(icon, label, sub="", variant="", first=False):
        return ('<div class="ov-row' + (' first' if first else '') + '">'
                '<div class="well ' + variant + '" style="width:38px;height:38px;border-radius:11px">'
                + ico(icon, 18) + '</div><div class="grow">'
                '<div class="r-bodysmall" style="font-weight:700">' + label + '</div>'
                + ('<div class="r-caption muted">' + sub + '</div>' if sub else '')
                + '</div>' + ico("chevron", 18, "var(--text-muted)") + '</div>')

    def ovrow44(icon, label, variant=""):
        return ('<div class="ov-row' + (' first' if not variant and label == "WhatsApp" else '') + '">'
                '<div class="well ' + variant + '" style="width:44px;height:44px;border-radius:12px">'
                + ico(icon, 20) + '</div><div class="grow">'
                '<div class="r-bodysmall" style="font-weight:700">' + label + '</div></div></div>')

    bottom_sheet = scrimbox(
        '<div class="sheet">'
        '<div class="sheet__grip"></div>'
        '<div class="r-cardtitle" style="margin-bottom:10px">Shiriki CV hii</div>'
        + ovrow("download", "Pakua PDF", "Faili tayari kutumwa", "", True)
        + ovrow("mail", "Tuma kwa barua pepe", "", "well--pine")
        + ovrow("eye", "Fungua kiungo cha kushiriki", "", "well--gold")
        + '<button class="btn btn--secondary btn--sm btn--block" style="margin-top:12px">'
          'Ghairi</button></div>', 440)

    def confirm(icon, title, body, safe, risky, destructive=True, variant=""):
        risky_bg = ('background:var(--error);color:var(--cream)' if destructive
                    else 'background:var(--ember-fill);color:var(--cream)')
        return scrimbox(
            '<div class="dlgwrap"><div class="dlg">'
            '<div class="well ' + variant + '" style="width:56px;height:56px;border-radius:18px;'
            'margin:0 auto 14px' + (';background:#FBE9E1;color:var(--error)' if destructive else '')
            + '">' + ico(icon, 24) + '</div>'
            '<div class="r-section" style="font-size:16px">' + title + '</div>'
            '<div class="r-bodysmall muted" style="margin-top:6px;line-height:19px">' + body + '</div>'
            '<div class="row g8">'
            '<div style="flex:1"><button class="btn btn--secondary btn--sm btn--block">' + safe
            + '</button></div>'
            '<div style="flex:1"><button class="btn btn--sm btn--block" style="' + risky_bg + '">'
            + risky + '</button></div></div></div></div>', 380)

    confirm_destructive = confirm(
        "trash", "Ufute CV hii?",
        "&ldquo;CV ya Mhasibu&rdquo; itafutwa kabisa. Haliwezi kurudishwa.",
        "Ghairi", "Futa", True)
    confirm_soft = confirm(
        "clock", "Tuache haya kwa sasa?",
        "Mabadiliko yako yako salama kwenye akaunti yako na yatakuwa hapa utakaporudi.",
        "Endelea kuhariri", "Hifadhi na toka", False)

    toast_box = scrimbox(
        '<div class="toast" style="bottom:24px">' + ico("check", 18, "var(--success)")
        + '<div class="grow"><div style="font-weight:700">Imeshirikiwa</div>'
          '<div style="font-size:12.5px;opacity:.85">CV ya Mhasibu imetumwa.</div></div>'
          '<span style="font-size:12.5px;font-weight:800;color:var(--gold)">Ondoa</span></div>', 250)

    full_sheet = scrimbox(
        '<div class="fullov">'
        '<div class="fullov__bar">'
        '<span class="r-bodysmall" style="font-weight:800">Ghairi</span>'
        '<div class="grow" style="text-align:center">'
        '<div class="r-bodysmall" style="font-weight:800">Chagua muundo</div></div>'
        '<span class="r-bodysmall" style="font-weight:800;color:var(--ember-text)">Tumia</span></div>'
        '<div style="padding:14px 16px">'
        '<div class="card pad" style="margin-bottom:10px;display:flex;gap:12px;align-items:center">'
        '<div style="width:44px;height:56px;border-radius:6px;background:var(--sand)"></div>'
        '<div class="grow"><div class="r-bodysmall" style="font-weight:700">Classic</div>'
        '<div class="r-caption muted">Safisha kwa waajiri</div></div>'
        '<span class="badge badge--ember">' + ico("check", 11) + ' Imechaguliwa</span></div>'
        '<div class="card pad" style="display:flex;gap:12px;align-items:center">'
        '<div style="width:44px;height:56px;border-radius:6px;background:var(--sand)"></div>'
        '<div class="grow"><div class="r-bodysmall" style="font-weight:700">Executive</div>'
        '<div class="r-caption muted">Kwa nafasi za uongozi</div></div></div>'
        '</div></div>', 430)

    share_sheet = scrimbox(
        '<div class="sheet"><div class="sheet__grip"></div>'
        '<div class="r-cardtitle" style="margin-bottom:10px">Sumaiya &mdash; shiriki</div>'
        + ovrow44("chat", "WhatsApp")
        + ovrow44("mail", "Barua pepe", "well--pine")
        + ovrow44("download", "Hifadhi kwenye simu", "well--gold")
        + '</div>', 300)

    def spec(rows):
        return '<div class="card pad" style="margin-top:12px"><div class="spec">' + "".join(
            '<div class="kv"><span>' + k + '</span><b>' + v + '</b></div>' for k, v in rows
        ) + '</div></div>'

    overlays_body = ('<div class="sec">'
      '<h2><span class="n">A</span>Five variants, and only five</h2>'
      '<p class="lede">Every overlay in both apps maps to one of these. If a new need appears that '
      'does not fit one of the five, the answer is the nearest variant, not a sixth shape.</p>'
      '<div class="grid2">'

      '<div><p class="varlabel first">1 &middot; Bottom sheet &mdash; the default for choices</p>'
      + bottom_sheet
      + spec([("when", "a choice of 2-6 actions, or a short form"),
              ("corners", "20px top, 0 bottom"),
              ("scrim", "overlay = rgba(33,26,21,.45)"),
              ("entry", "translateY 360 to 0 &middot; 220ms &middot; ease.out"),
              ("exit", "160ms &middot; ease.in"),
              ("drag to dismiss", "yes, only under 60% height"),
              ("reduced motion", "1ms + a visible Ghairi")])
      + '</div>'

      '<div><p class="varlabel first">2a &middot; Confirm dialog &mdash; destructive</p>'
      + confirm_destructive
      + '<p class="varlabel">2b &middot; Confirm dialog &mdash; not destructive</p>'
      + confirm_soft
      + spec([("when", "an irreversible or surprising action"),
              ("corners", "20px all round &middot; max-width 300"),
              ("entry", "scale .94 to 1 + scrim &middot; spring.gentle"),
              ("exit", "140ms &middot; ease.in"),
              ("drag to dismiss", "never"),
              ("destructive", "error fill + haptics.error()"),
              ("default focus", "the safe action, never Futa")])
      + '</div>'

      '<div><p class="varlabel first">3 &middot; Toast &mdash; transient confirmation</p>'
      + toast_box
      + spec([("when", "the action already succeeded; nothing to decide"),
              ("corners", "12px (input-lg), not 14"),
              ("entry / exit", "220ms ease.out / 140ms ease.in"),
              ("dwell", "4s, and it pauses on focus"),
              ("drag to dismiss", "no &mdash; swipe to dismiss yes"),
              ("a11y", "never the only signal of success")])
      + '<p class="varlabel">4 &middot; Full-screen sheet &mdash; a task, not a choice</p>'
      + full_sheet
      + spec([("when", "picking, cropping, reading - it needs the screen"),
              ("corners", "0 (it is the screen)"),
              ("scrim", "none"),
              ("entry / exit", "slide, 260ms / 260ms (dur.screen)"),
              ("drag to dismiss", "never &mdash; use the pair in the bar")])
      + '</div>'

      '<div><p class="varlabel first">5 &middot; Share sheet &mdash; the one that differs by '
      'platform, on purpose</p>'
      + share_sheet
      + spec([("APK", "the OS sheet (Share.share)"),
              ("web", "this sheet; navigator.share if present"),
              ("rows", "44px, first is the most likely"),
              ("why they differ", "the APK's is trusted and logged in")])
      + '<p class="spec" style="margin:0 0 0">'
        '<b>WhatsApp first is not decoration.</b> In this market WhatsApp is the connective tissue, '
        'so the first row is the channel the user is already in &mdash; on both platforms. On the APK '
        'the OS supplies the rows and the app must not reimplement them; on the web the app supplies '
        'them, in the same order, so the two read as one behaviour.</p></div>'
      '</div></div>'

      '<div class="sec"><h2><span class="n">B</span>The shared rules &mdash; identical on both '
      'platforms</h2><div class="rule-grid">'
      '<div class="rule"><h4>One scrim, from the theme</h4>'
      '<div class="kv"><span>light</span><b>rgba(33,26,21,.45)</b></div>'
      '<div class="kv"><span>dark</span><b>rgba(0,0,0,.6)</b></div>'
      '<p class="spec" style="margin:8px 0 0">Both already exist as <code>overlay</code> in '
      '<code>theme.ts:59,84</code>. No overlay may invent its own scrim and none may use pure '
      'black &mdash; see the audit in C.</p></div>'
      '<div class="rule"><h4>Corner treatment</h4>'
      '<div class="kv"><span>sheet top</span><b>20 (card-lg)</b></div>'
      '<div class="kv"><span>dialog</span><b>20 (card-lg)</b></div>'
      '<div class="kv"><span>toast</span><b>12 (input-lg)</b></div>'
      '<div class="kv"><span>full-screen</span><b>0</b></div>'
      '<p class="spec" style="margin:8px 0 0">Concentric, per the design system. The sheet&rsquo;s '
      'inner rows follow from the 20: a 38px well inside 16px padding is <b>11-12</b>.</p></div>'
      '<div class="rule"><h4>Focus and keyboard</h4>'
      '<div class="kv"><span>web</span><b>focus trap; Escape closes if cancelable</b></div>'
      '<div class="kv"><span>initial focus</span><b>the dialog body; the safe button</b></div>'
      '<div class="kv"><span>return focus</span><b>to the trigger on close</b></div>'
      '<div class="kv"><span>APK</span><b>hardware back = Escape; dialog.isOpen() guards it</b></div>'
      '<p class="spec" style="margin:8px 0 0"><code>dialog.isOpen()</code> '
      '(<code>ui/dialog.tsx:84-86</code>) already exists for exactly this arbitration and is the '
      'reference behaviour.</p></div>'
      '<div class="rule"><h4>Reduced motion &mdash; the same contract everywhere</h4>'
      '<div class="kv"><span>durations</span><b>collapse to 1ms, never 0</b></div>'
      '<div class="kv"><span>drag-to-dismiss</span><b>disabled</b></div>'
      '<div class="kv"><span>in exchange</span><b>Close / Ghairi always visible</b></div>'
      '<p class="spec" style="margin:8px 0 0">1 ms so <code>withTiming</code>&rsquo;s finished '
      'callback still fires and nothing hangs. Nothing here is motion-only: every overlay is legible '
      'with motion off.</p></div>'
      '<div class="rule"><h4>One stacking order</h4>'
      '<div class="kv"><span>1 &middot; content</span><b>&mdash;</b></div>'
      '<div class="kv"><span>2 &middot; sticky / tab bar</span><b>z 40</b></div>'
      '<div class="kv"><span>3 &middot; toast</span><b>z 60</b></div>'
      '<div class="kv"><span>4 &middot; sheet</span><b>z 70</b></div>'
      '<div class="kv"><span>5 &middot; dialog</span><b>z 80</b></div>'
      '<div class="kv"><span>6 &middot; full-screen task</span><b>z 90</b></div>'
      '<p class="spec" style="margin:8px 0 0">Six levels, replacing the seven ad-hoc values in the '
      'audit below.</p></div>'
      '<div class="rule"><h4>Dismissal</h4>'
      '<div class="kv"><span>scrim tap</span><b>closes sheet and toast; not full-screen</b></div>'
      '<div class="kv"><span>dialog + scrim tap</span><b>only if cancelable</b></div>'
      '<div class="kv"><span>destructive</span><b>never dismiss without an explicit choice</b></div>'
      '<div class="kv"><span>swipe down</span><b>sheet yes &middot; dialog no &middot; toast yes</b></div>'
      '</div></div></div>' + _audit_sections())

    write("08-overlays.html", doc(
        "Lugha moja ya madirisha (one overlay language)",
        "The popups are a zoo: three native sheet radii for the same object, six web scrims and "
        "seven z-indices where the theme already defines one scrim. This is one system, five variants, "
        "and an audit of every real overlay by file:line.",
        overlays_body, extra_css=OV_CSS))


def _audit_sections():
    def row(cells):
        return "<tr>" + "".join("<td>" + c + "</td>" for c in cells) + "</tr>"

    def head(cells):
        return "<tr>" + "".join("<th>" + c + "</th>" for c in cells) + "</tr>"

    C = '<span class="pill pill--chg">CHANGE</span>'
    K = '<span class="pill pill--ok">KEEP</span>'
    NATIVE = [
        ("<code>ui/dialog.tsx:103-200</code>", "the confirm dialog host",
         "spring <code>damping 20, stiffness 240, mass .8</code> (:122) &mdash; matches neither "
         "<code>spring.gentle</code> (20/180) nor <code>snappy</code> (22/260)",
         C + " <code>spring.gentle</code>, 140ms out on <code>ease.in</code>. Behaviour is already "
         "the reference apart from the stiffness"),
        ("<code>chat/attach-sheet.tsx:69</code>", "chat attachment choices", "top radius <b>24</b>",
         C + " 20 + the <code>overlay</code> scrim"),
        ("<code>chat/attachment-preview-sheet.tsx:92</code>", "preview a file before send",
         "top radius <b>24</b>", C + " 20"),
        ("<code>chat/job-choice-sheet.tsx:195</code>", "pick which job to tailor for",
         "top radius <b>24</b>", C + " 20"),
        ("<code>premium-sheet.tsx:150</code>", "the Premium pitch", "top radius <b>24</b>",
         C + " 20 &mdash; and it must become the SAME object as the web's "
         "<code>premium-template-modal.tsx</code>"),
        ("<code>learning/lesson-sheet.tsx:121</code>", "one lesson",
         "top radius <b>22</b> &mdash; the odd one out",
         C + " a lesson is a <b>full-screen sheet</b> (variant 4), not a 22px bottom sheet"),
        ("<code>ui/toast.tsx:133</code>", "transient confirmation",
         "radius <b>14</b> (not a token); motion is already correct &mdash; FadeIn 220 / FadeOut 140 "
         "(:94-100)",
         C + " 12 (<code>input-lg</code>). The motion stays: this is the one overlay already fully "
         "inside the standard"),
        ("<code>ui/list-row.tsx:54</code>", "grouped row corners", "<code>first ? 14 : 0</code>",
         C + " 16 (<code>card</code>) on the first row"),
        ("<code>chat/chat-composer.tsx:30</code>", "composer reflow",
         "<code>springify().damping(18).stiffness(200)</code> &mdash; <b>damping 18 breaks the "
         "standard's own &ldquo;damping &ge; 20 everywhere&rdquo;</b>",
         C + " <code>spring.snappy</code> (22/260)"),
        ("<code>components/portal-transition.tsx</code>", "the onboarding portal",
         "the 340ms colour-field dissolve",
         K + " this is the standard's <code>dur.field</code> and it is correct"),
        ("<code>components/update-prompt.tsx</code>", "update available", "its own shape",
         C + " variant 2b (not destructive)"),
        ("<code>components/connectivity-gate.tsx</code>", "the offline gate",
         "correct per the motion audit", K),
        ("<code>components/cv/template-gallery.tsx</code>", "pick a design", "a modal over Home",
         C + " variant 4: it is a picking task, not a choice of five"),
    ]
    WEB = [
        ("<code>editor/share-cv-modal.tsx:69</code>", "share a CV", "<code>bg-black/50</code>", "80",
         C + " <code>espresso/45</code>, z 70, variant 5"),
        ("<code>editor/ai-suggestion-modal.tsx:46</code>", "AI suggestion",
         "<code>bg-black/40</code>", "80",
         C + " scrim from the theme; the bottom-sheet-on-mobile behaviour is already right"),
        ("<code>editor/template-selection-modal.tsx:82</code>", "pick a template",
         "<code>bg-black/50</code>", "50",
         C + " variant 4 &mdash; and its spinner-to-grid hard swap is audit W2"),
        ("<code>editor/create-entry-options.tsx:108</code>", "what to create",
         "<code>bg-black/50</code>", "50", C + " variant 1"),
        ("<code>premium-template-modal.tsx:69</code>", "Premium template",
         "<code>bg-black/40</code>", "50",
         C + " the twin of native <code>premium-sheet</code>; both become one object"),
        ("<code>jobs/targeted-cv-drawer.tsx:240</code>", "tailor for a job",
         "<code>bg-espresso/50 backdrop-blur-[2px]</code>", "50",
         C + " drop the blur (banned); scrim from the theme; its every-branch hard swap is audit W5"),
        ("<code>editor/cv-editor-client.tsx:384</code>", "a failure dialog",
         "<code>bg-black/50 backdrop-blur-[3px]</code>", "50",
         C + " drop the blur; 20px radius; add a focus trap"),
        ("<code>editor/cv-editor-client.tsx:890</code>", "a large sheet",
         "<code>bg-black/60</code>", "50",
         C + " <code>espresso/45</code>. The <code>rounded-t-2xl sm:rounded-2xl</code> responsive "
         "idea is right &mdash; keep it and make 20px the token"),
        ("<code>editor/cv-editor-client.tsx:2712</code>", "history panel",
         "<code>bg-black/40</code>", "70", C + " variant 1"),
        ("<code>editor/cv-editor-client.tsx:2760</code>", "enhance preview",
         "<code>bg-black/40</code>", "70", C + " variant 1"),
        ("<code>editor/cv-editor-client.tsx:3617,3654</code>", "two centred dialogs",
         "<code>bg-espresso/40</code>", "100",
         C + " z 80 and the theme scrim &mdash; these are the closest to correct already"),
        ("<code>editor/cv-editor-client.tsx:385</code>", "a small centred dialog",
         "<code>bg-black/50</code>", "50",
         C + " <code>shadow-2xl</code> to <code>shadow.floating</code>; it is the only "
         "<code>shadow-2xl</code> on the web"),
        ("<code>dashboard/applications-grid.tsx:465</code>", "application sheet",
         "<b>none</b>", "70",
         C + " add the scrim &mdash; an overlay with no scrim reads as a layout bug at phone width"),
        ("<code>dashboard/*-grid.tsx:63,64,106,165</code> &middot; "
         "<code>dashboard-header.tsx:192</code> &middot; <code>editor-profile-menu.tsx:262</code>",
         "click-outside backstops", "<b>none</b> (transparent)", "40",
         K + " these are invisible hit-areas for a menu, not overlays. Correct as-is, and they set "
         "the z floor of 40"),
        ("<code>ui/marketing-nav.tsx:173</code>", "mobile marketing menu",
         "<code>bg-espresso/60 backdrop-blur-sm</code>", "65",
         C + " drop the blur; the only marketing overlay, and it should match the product's"),
        ("<code>dashboard/mobile-tab-bar.tsx:81</code>", "phone tab bar", "&mdash;", "60",
         C + " z 40 per the ladder; see <code>07-web-nav.html</code>"),
        ("<code>app/globals.css</code>", "the reduced-motion net",
         "collapses all animation to .01ms", "&mdash;",
         K + " note it collapses rather than removes &mdash; the same contract as 1ms on native"),
    ]

    return (
        '<div class="sec">'
        '<h2><span class="n">C</span>The audit &mdash; every real overlay, and what it must '
        'become</h2>'
        '<p class="lede">Read from the tree. Native sheet tops use <b>three different radii for the '
        'same object</b> (24, 24, 24, 24, 22, 14) and the web uses <b>six different scrims and seven '
        'different z-indices where the theme already defines one scrim.</b> That is the zoo, stated '
        'as numbers.</p>'
        '<div class="audit"><h3>Android &mdash; sheets and overlays</h3>'
        '<table class="audit">' + head(["file:line", "what it is", "today", "becomes"])
        + "".join(row(r) for r in NATIVE) + '</table>'
        '<h3>Web &mdash; scrim, z-index and shape</h3>'
        '<table class="audit">' + head(["file:line", "overlay", "scrim today", "z", "becomes"])
        + "".join(row(r) for r in WEB) + '</table></div>'
        '<div class="rule-grid" style="margin-top:24px">'
        '<div class="rule"><h4>The five numbers that are the whole finding</h4>'
        '<div class="kv"><span>scrims defined in the theme</span><b>1 (overlay)</b></div>'
        '<div class="kv"><span>scrims actually used on web</span><b>6</b></div>'
        '<div class="kv"><span>of those, pure black</span><b>3</b></div>'
        '<div class="kv"><span>distinct z-index values</span><b>7 (40, 50, 60, 65, 70, 80, 100)</b></div>'
        '<div class="kv"><span>native sheet-top radii</span><b>3 (24, 22, 14)</b></div>'
        '<div class="kv"><span>spring configs on overlays</span><b>3 (18, 20, and 20/240)</b></div>'
        '</div>'
        '<div class="rule"><h4>Why this is worth fixing now</h4>'
        '<p class="spec" style="margin:0">Every one of these overlays is a moment where the user is '
        'being asked something or told something important &mdash; a destructive confirm, a share, a '
        'paywall. Those are exactly the moments the app must read as one object rather than as a '
        'collection of one-off components. The fix is small and mechanical: <b>one scrim constant, '
        'one z-ladder, three radii, five variants.</b> No new dependency, no new screen, and the web '
        'and the APK become recognisably the same product at the moment the user is deciding '
        'something.</p></div></div></div>')
