#!/usr/bin/env python3
"""
Build the Sumaiya unified single-file suite from the Stitch prototype.

Input : ~/qa-sumaiya/stitch-web/code.html          (4 viewports, Tailwind CDN)
Output: ~/qa-sumaiya/suite-build/sumaiya-unified-suite.html

What it does
  1. Removes the Tailwind CDN + its inline config, and compiles a real static
     stylesheet from the SAME config, so the file needs no network at all.
  2. Enforces the inviolable laws on the markup (no pure-white surfaces, no
     "ATS" in the Swahili document, no fabricated scores/counts in chrome).
  3. Adds the behavioural layer: data-wiring annotations on the real elements,
     a reveal toggle, and a Blueprint view carrying the runtime manual.

Failures are loud: every law fix asserts its match, because a silent miss here
is a law shipped broken.
"""
import base64
import os
import re
import subprocess
import sys
import urllib.request

WEB = r"C:\Users\hamis\projects\sumaiya\apps\web"
SRC = os.path.expanduser(r"~/qa-sumaiya/stitch-web/code.html")
OUTDIR = os.path.expanduser(r"~/qa-sumaiya/suite-build")
OUT = os.path.join(OUTDIR, "sumaiya-unified-suite.html")
os.makedirs(OUTDIR, exist_ok=True)

html = open(SRC, encoding="utf-8").read()
log = []

# ─────────────────────────────────────────────────────────────────────────────
# 1. LIFT THE TAILWIND CONFIG, DROP THE CDN
# ─────────────────────────────────────────────────────────────────────────────
# Locate the block that ASSIGNS the config, then cut to the first </script> after
# it. A regex here is a trap: the block ends with `};`, so a `\}`-anchored pattern
# runs past it and can swallow the whole document.
i = html.find("tailwind.config")
assert i > 0, "could not find the inline tailwind.config"
s = html.rfind("<script>", 0, i)
e = html.find("</script>", i)
assert s >= 0 and e > i, "could not bound the config script block"
e += len("</script>")
config_block = html[s:e]
config_obj = config_block[config_block.find("tailwind.config"):config_block.rfind("</script>")].rstrip().rstrip(";").rstrip()
assert config_obj.startswith("tailwind.config") and config_obj.endswith("}"), "config block misread"
config_obj = config_obj.replace("tailwind.config", "module.exports", 1)
cfg_path = os.path.join(OUTDIR, "tailwind.config.js")
open(cfg_path, "w", encoding="utf-8").write(
    "// lifted verbatim from the Stitch prototype's inline config\n" + config_obj + ";\n"
)
html = html.replace(config_block, "")
cdn = re.search(r'\s*<script src="https://cdn\.tailwindcss\.com[^"]*"></script>', html)
assert cdn, "could not find the Tailwind CDN tag"
html = html.replace(cdn.group(0), "")
assert "Ukaguzi wa CV (Score: 84)" in html, "the document body did not survive extraction"
html = html.replace("</head>", '  <style id="sumaiya-css">/*__SUMAIYA_CSS__*/</style>\n</head>', 1)
log.append("config lifted, CDN removed, css placeholder inserted")

# ─────────────────────────────────────────────────────────────────────────────
# 2. THE LAWS
# ─────────────────────────────────────────────────────────────────────────────
# Law 2 — no pure white as a SURFACE. White stays legal as text/icons on ember
# (the inline `color:#ffffff` in <style> is exactly that, and is left alone).
white = html.count("bg-[#FFFFFF]") + len(re.findall(r'\bbg-white\b', html))
html = html.replace("bg-[#FFFFFF]", "bg-[#F5F3EF]")
html = re.sub(r'\bbg-white\b', "bg-[#F5F3EF]", html)
assert html.count("bg-[#FFFFFF]") == 0 and not re.search(r'\bbg-white\b', html), "white surface survived"
log.append(f"law 2: {white} pure-white surfaces -> #F5F3EF (raised)")

# Law 3 — no fabricated number in chrome. A score in the navigation is the worst
# kind: it is unconditional, so it ships as a lie no matter what the engine knows.
before = html
html = html.replace("Ukaguzi wa CV (Score: 84)", "Ukaguzi wa CV")
assert html != before, "sidebar score not found"
html, n = re.subn(r"Matokeo ya Ukaguzi \(3 Findings\)", "Matokeo ya Ukaguzi", html)
assert n == 1, "findings count not found"
log.append("law 3: sidebar 'Score: 84' and '(3 Findings)' removed (fabricated counts)")

# Law 1 — no "ATS" in the Swahili document. The one hit sits on the extension
# badge, whose audience is the same Tanzanian user, so it goes to the feature's
# name rather than the English acronym.
ats = 'Instant 1-Click Autofill &amp; Live ATS Matching'
if ats not in html:
    ats = "Instant 1-Click Autofill & Live ATS Matching"
assert ats in html, "extension badge copy not found"
html = html.replace(ats, "Kujaza fomu kwa mbofyo mmoja &middot; Ulinganisho wa moja kwa moja")
log.append("law 1: extension badge reworded in Swahili ('ATS' removed)")

# Law 6 — no version pills. The prototype carries exactly two: `v1.7 Web & Ext` in the
# master chrome and `Sumaiya Web 1.7.0` in the rail footer. The chip's anchor must use a
# literal `&` (the source is not entity-escaped there) — an `&amp;` anchor silently
# matched nothing and cost a build. The guard is deliberately NOT a blanket x.y.z test:
# SVG path data is full of `3.332.477`, which is a coordinate, not a version.
before = html
html = html.replace('>v1.7 Web & Ext</span>', '>Web &middot; Android &middot; Extension</span>')
assert html != before, "master-chrome version chip not found"
html, n = re.subn(r'(<span>)Sumaiya Web \d+\.\d+\.\d+(</span>)', r'\1Sumaiya Web\2', html)
assert n == 1, "rail version string not found"
assert "v1.7 Web" not in html and not re.search(r"Sumaiya Web \d+\.\d+", html), "a version survived"
log.append("law 6: both version pills removed (chrome chip + rail footer)")

# The design's own copy, checked rather than assumed. An earlier pass of this script
# "fixed" a "Kamil 100%" typo that does not exist: the source already reads "Kamili".
# So this asserts the copy instead of editing it - a false fix is worse than no fix.
assert "Kamili 100%" in html, "the completeness label went missing"
log.append("copy verified: 'Kamili 100%' is already correct in the source")

# ─────────────────────────────────────────────────────────────────────────────
# 3. THE WIRING LAYER — annotations on the elements that actually exist
# ─────────────────────────────────────────────────────────────────────────────
def attach(doc, anchor, note, nth=0):
    """Put data-wiring on the tag that contains `anchor`."""
    idx = -1
    for _ in range(nth + 1):
        idx = doc.find(anchor, idx + 1)
        if idx < 0:
            return doc, False
    j = doc.rfind("<", 0, idx)
    if j < 0:
        return doc, False
    k = j + 1
    while k < len(doc) and doc[k] not in " \t\r\n>":
        k += 1
    if k < len(doc) and doc[k - 1] == "<":
        return doc, False
    esc = note.replace('"', "&quot;").replace("<", "&lt;").replace(">", "&gt;")
    return doc[:k] + f' data-wiring="{esc}"' + doc[k:], True

WIRING = [
    ("Kihariri cha CV",      "click &rarr; open editor | draft read from IndexedDB BEFORE first paint, so no empty flash"),
    ("Ukaguzi wa CV",        "click &rarr; review | a score renders ONLY from a real evaluation; empty draft shows the honest state, never a placeholder number", 1),
    ("Nafasi za Kazi",       "click &rarr; GET /api/jobs?light=1 | posted_at + salary reach the card; no period = number withheld"),
    ("Maombi Yangu",         "click &rarr; read local applications store | useFocusEffect refresh, so a save made elsewhere appears on return"),
    ("Kituo cha Mafunzo",    "click &rarr; catalogue | progress read from the local store; a course never started gets no bar"),
    ("Sumaiya AI Assistant", "click &rarr; chat session | memory is local, honours the master toggle, individual entries deletable"),
    ("Imehifadhiwa (Otomatiki)", "field blur &rarr; zod validate &rarr; local write (&lt;2ms) &rarr; micro-toast | offline: same write, plus an outbox row"),
    ("Matokeo ya Ukaguzi",   "rendered from stored findings | severities are Kikubwa / Wastani / Kidogo, never re-worded"),
    ("Hamisha PDF",          "click &rarr; print pipeline | @page A4 210&times;297mm, margins locked, no margin drift"),
    ("Tuma WhatsApp",        "click &rarr; share sheet | nothing leaves the device until the user picks a target"),
    ("currentLocale",        "click &rarr; swap SW/EN dictionary | both ship in the bundle; no string is fetched at runtime"),
    ("toggleTheme",          "click &rarr; toggles .dark on &lt;html&gt; | the warm scale inverts; pure white stays illegal in both themes"),
]

applied, missed = 0, []
for spec in WIRING:
    anchor, note = spec[0], spec[1]
    nth = spec[2] if len(spec) > 2 else 0
    html, ok = attach(html, anchor, note, nth)
    if ok:
        applied += 1
    else:
        missed.append(anchor)
log.append(f"wiring: {applied}/{len(WIRING)} annotations attached")
if missed:
    log.append("wiring MISSED (anchor not found): " + ", ".join(missed))

# The pin goes on the elements whose behaviour is a promise, not a preference.
for anchor, note in [
    ("Paste advert",   "paste &rarr; parse locally &rarr; the advert becomes a document | the pasted text is the user's, not uploaded as a sample"),
    ("Start your Engineering CV", "click &rarr; the CV AST already determines the design; changing it never rewrites content"),
]:
    html, ok = attach(html, anchor, note)
    log.append(f"  pin {'ok' if ok else 'MISSED'}: {anchor[:28]}")

# ─────────────────────────────────────────────────────────────────────────────
# 4. THE TOGGLE + THE BLUEPRINT VIEW
# ─────────────────────────────────────────────────────────────────────────────
TOGGLE_CSS = """
    /* ── wiring reveal: pure CSS, works with the file offline ───────────── */
    [data-wiring] { position: relative; }
    body.wiring [data-wiring] { outline: 1px dashed rgba(218,74,28,.6); outline-offset: 2px; }
    /* The note itself shows on hover/focus, not all at once: two wired controls
       sitting side by side stacked their notes on top of each other and clipped
       at the viewport edge. The outline marks WHAT is wired; the note explains it
       when asked. The full list lives in the Blueprint view. */
    body.wiring [data-wiring]:hover::after,
    body.wiring [data-wiring]:focus-visible::after {
      content: attr(data-wiring);
      position: absolute; left: 0; top: calc(100% + 5px); z-index: 70;
      width: max-content; max-width: 300px; padding: 7px 9px; border-radius: 9px;
      background: #1B1C1A; color: #F2F0ED;
      font-family: 'JetBrains Mono', ui-monospace, Menlo, monospace;
      font-size: 10px; line-height: 1.5; font-weight: 500;
      box-shadow: 0 10px 28px rgba(0,0,0,.38); pointer-events: none;
      white-space: normal; text-transform: none; letter-spacing: 0;
    }
    /* A control near the right edge opens its note leftwards instead of clipping. */
    body.wiring [data-wiring].wire-right:hover::after { left: auto; right: 0; }
    body.wiring #wiring-toggle { background: #DA4A1C; color: #FFFFFF; border-color: #DA4A1C; }
    #wiring-toggle {
      position: fixed; left: 16px; bottom: 16px; z-index: 80;
      padding: 9px 14px; border-radius: 999px; cursor: pointer;
      background: #1B1C1A; color: #F2F0ED; border: 1px solid #3A3430;
      font-family: 'Hanken Grotesk', system-ui, sans-serif; font-weight: 600; font-size: 12px;
      box-shadow: 0 8px 22px rgba(0,0,0,.28);
    }
    @media print { #wiring-toggle { display: none; } body.wiring [data-wiring]::after { display: none; } }
"""
html = html.replace("  </style>", TOGGLE_CSS + "  </style>", 1)

BLUEPRINT_TAB = '''        <button onclick="switchView('blueprint')" id="tab-blueprint" class="viewport-tab text-[#C9C0B8] hover:text-white px-3.5 py-1.5 rounded-lg transition-all flex items-center space-x-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h10"/></svg>
          <span class="hidden sm:inline">Behavior &amp; Wiring (Blueprint)</span>
          <span class="sm:hidden">Blueprint</span>
        </button>
'''

def row(el, event, effect, where):
    return f'''          <tr class="border-t border-[#E2BFB5]">
            <td class="py-2.5 pr-4 font-mono text-[11px] text-[#1B1C1A] whitespace-nowrap">{el}</td>
            <td class="py-2.5 pr-4 text-[12px] text-[#5A413A] whitespace-nowrap">{event}</td>
            <td class="py-2.5 pr-4 text-[12px] text-[#1B1C1A]">{effect}</td>
            <td class="py-2.5 font-mono text-[11px] text-[#8E7068]">{where}</td>
          </tr>'''

ELEMENT_WIRING = [
    ("rail / Kihariri cha CV", "click", "Opens the editor for the active document. The draft is read from the local store <em>before</em> first paint, so the form never flashes empty then fills.", "IndexedDB / expo-sqlite"),
    ("rail / Ukaguzi wa CV", "click", "Runs the review against stored fields. With nothing to measure it renders the honest empty state — there is no placeholder score anywhere in the system.", "local evaluator"),
    ("rail / Nafasi za Kazi", "click", "Fetches the feed (light projection). A posting date prints only when the source gave one; a salary prints only with its period.", "GET /api/jobs"),
    ("rail / Maombi Yangu", "click", "Reads the applications store; refreshes on focus so a save made on another surface appears on return.", "local store"),
    ("editor field", "input &rarr; blur", "Debounced parse, then a local write, then the micro-toast. The toast is confirmation of a completed write, never of an intent.", "zod &rarr; local"),
    ("editor preview", "render", "Draws from the same document AST as every export, so what is previewed is what is printed — the phone, the PDF and the browser agree by construction.", "shared renderer"),
    ("Hamisha PDF", "click", "Print pipeline with A4 page isolation and locked margins; zero margin drift between preview and paper.", "@media print"),
    ("Tuma WhatsApp", "click", "Hands the file to the share sheet. Nothing leaves the device until the user chooses a destination.", "platform share"),
    ("locale toggle", "click", "Swaps the SW/EN dictionary. Both ship in the bundle; no string is fetched at runtime, so the app is complete offline.", "i18n dictionary"),
    ("theme toggle", "click", "Inverts the warm scale. This is the theme that most tempts a developer to reach for pure white — and it stays illegal in both.", "CSS class"),
    ("extension badge", "DOM observe", "Watches a verified job domain, extracts the advert, and scores it locally against the cached CV. The score is computed or absent — never drawn from nothing.", "content script"),
    ("extension / tailored CV", "click", "Messages the app, clones the active CV and applies targeted edits. The user's original document is not overwritten in place.", "service worker bridge"),
    ("offline indicator", "network change", "Online: drains the outbox. Offline: queues and keeps working. The pipeline is local-first; the network is an enhancement, not a dependency.", "outbox queue"),
]

BP = '''      <section id="view-blueprint" class="surface-view hidden max-w-[1240px] mx-auto px-6 py-10 space-y-10">
        <header class="space-y-3">
          <p class="font-mono text-[11px] uppercase tracking-[0.18em] text-[#DA4A1C]">Muundo wa Kiufundi &middot; System &amp; Wiring Blueprint</p>
          <h2 class="font-display font-bold text-3xl text-[#1B1C1A]">Behavior &amp; wiring manual</h2>
          <p class="text-sm text-[#5A413A] max-w-[70ch]">The four screens above are the design. This section is the contract: what each element does when it is touched, where the state lands, and which rules are enforced by a test rather than by goodwill.</p>
        </header>

        <section class="space-y-4">
          <h3 class="font-display font-bold text-xl text-[#1B1C1A]">1 &middot; The inviolable laws</h3>
          <div class="grid gap-4 md:grid-cols-2">
            <div class="p-5 rounded-2xl bg-[#F5F3EF] border border-[#E2BFB5] space-y-2">
              <p class="font-mono text-[10px] uppercase tracking-wider text-[#DA4A1C]">Law 1 &middot; CI check</p>
              <h4 class="font-display font-semibold text-base text-[#1B1C1A]">Never &ldquo;ATS&rdquo; in Kiswahili copy</h4>
              <p class="text-[13px] text-[#5A413A]">The Swahili surface says <strong>Ukaguzi wa CV</strong>, and findings are grouped strictly as <strong>Kikubwa</strong>, <strong>Wastani</strong>, <strong>Kidogo</strong>. English surfaces may keep the acronym where an English reader expects it.</p>
            </div>
            <div class="p-5 rounded-2xl bg-[#F5F3EF] border border-[#E2BFB5] space-y-2">
              <p class="font-mono text-[10px] uppercase tracking-wider text-[#DA4A1C]">Law 2 &middot; CI check</p>
              <h4 class="font-display font-semibold text-base text-[#1B1C1A]">No pure white as a surface</h4>
              <p class="text-[13px] text-[#5A413A]">Base <span class="font-mono text-[12px]">#FBF9F5</span>, raised <span class="font-mono text-[12px]">#F5F3EF</span>, sunken <span class="font-mono text-[12px]">#EFEEEA</span>. Espresso dark: <span class="font-mono text-[12px]">#1B1C1A</span> / <span class="font-mono text-[12px]">#24201C</span> / <span class="font-mono text-[12px]">#141210</span>. White is for text and icons <em>on</em> ember, nothing else.</p>
            </div>
            <div class="p-5 rounded-2xl bg-[#F5F3EF] border border-[#E2BFB5] space-y-2">
              <p class="font-mono text-[10px] uppercase tracking-wider text-[#DA4A1C]">Law 3 &middot; CI check</p>
              <h4 class="font-display font-semibold text-base text-[#1B1C1A]">No fabricated data or scores</h4>
              <p class="text-[13px] text-[#5A413A]">A score appears only when a real evaluation produced it. An empty draft gets the honest line, not a zero. Counts are dynamic or read <strong>Miundo yote</strong>; a literal template count is illegal.</p>
            </div>
            <div class="p-5 rounded-2xl bg-[#F5F3EF] border border-[#E2BFB5] space-y-2">
              <p class="font-mono text-[10px] uppercase tracking-wider text-[#DA4A1C]">Law 4 &middot; CI check</p>
              <h4 class="font-display font-semibold text-base text-[#1B1C1A]">House mark, 3 blades at 120&deg;</h4>
              <p class="text-[13px] text-[#5A413A]">Opacities 1.0 / 0.9 / 0.8, wells at <span class="font-mono text-[12px]">128dp</span> (hero), <span class="font-mono text-[12px]">96dp</span> (dialogs), <span class="font-mono text-[12px]">80dp</span> (bars). Never redrawn, never recoloured, never rotated.</p>
            </div>
            <div class="p-5 rounded-2xl bg-[#DA4A1C]/[0.06] border border-[#DA4A1C]/30 space-y-2 md:col-span-2">
              <p class="font-mono text-[10px] uppercase tracking-wider text-[#DA4A1C]">Law 5 &middot; Held by people, not by a test</p>
              <h4 class="font-display font-semibold text-base text-[#1B1C1A]">Memorial dignity</h4>
              <p class="text-[13px] text-[#5A413A]">Sumaiya is named in loving memory of the founder&rsquo;s late sister. Microcopy stays warm, respectful and empowering. No cynical tech jargon, no humour at the user&rsquo;s expense, nothing a family would wince at. This is the one law a linter cannot check, so it is written here on purpose.</p>
            </div>
          </div>
        </section>

        <section class="space-y-4">
          <h3 class="font-display font-bold text-xl text-[#1B1C1A]">2 &middot; Viewport behavior</h3>
          <div class="overflow-x-auto rounded-2xl border border-[#E2BFB5] bg-[#F5F3EF]">
            <table class="w-full text-left">
              <thead><tr class="bg-[#EFEEEA]">
                <th class="py-2.5 px-4 font-mono text-[10px] uppercase tracking-wider text-[#8E7068]">Viewport</th>
                <th class="py-2.5 px-4 font-mono text-[10px] uppercase tracking-wider text-[#8E7068]">Navigation</th>
                <th class="py-2.5 px-4 font-mono text-[10px] uppercase tracking-wider text-[#8E7068]">Editor</th>
                <th class="py-2.5 px-4 font-mono text-[10px] uppercase tracking-wider text-[#8E7068]">Preview</th>
              </tr></thead>
              <tbody class="px-4">
                <tr class="border-t border-[#E2BFB5]"><td class="py-2.5 px-4 text-[12px] font-semibold text-[#1B1C1A]">Desktop &ge;1280px</td><td class="py-2.5 px-4 text-[12px] text-[#5A413A]">Persistent 240px rail</td><td class="py-2.5 px-4 text-[12px] text-[#5A413A]">Split: form left, A4 right</td><td class="py-2.5 px-4 text-[12px] text-[#5A413A]">Live, keystroke-level; Ctrl/Cmd+S, Ctrl/Cmd+P</td></tr>
                <tr class="border-t border-[#E2BFB5]"><td class="py-2.5 px-4 text-[12px] font-semibold text-[#1B1C1A]">Tablet 768&ndash;1279px</td><td class="py-2.5 px-4 text-[12px] text-[#5A413A]">Collapsible rail with tooltips</td><td class="py-2.5 px-4 text-[12px] text-[#5A413A]">Stacked or tabbed</td><td class="py-2.5 px-4 text-[12px] text-[#5A413A]">Hariri / Hakiki toggle + quick-action pill</td></tr>
                <tr class="border-t border-[#E2BFB5]"><td class="py-2.5 px-4 text-[12px] font-semibold text-[#1B1C1A]">Mobile &le;480px</td><td class="py-2.5 px-4 text-[12px] text-[#5A413A]">5-tab bar, raised ember disc</td><td class="py-2.5 px-4 text-[12px] text-[#5A413A]">Accordion sections, 48dp targets</td><td class="py-2.5 px-4 text-[12px] text-[#5A413A]">Bottom sheet drawer</td></tr>
                <tr class="border-t border-[#E2BFB5]"><td class="py-2.5 px-4 text-[12px] font-semibold text-[#1B1C1A]">Extension 380px</td><td class="py-2.5 px-4 text-[12px] text-[#5A413A]">Header badge + contextual drawer</td><td class="py-2.5 px-4 text-[12px] text-[#5A413A]">Scraped advert card</td><td class="py-2.5 px-4 text-[12px] text-[#5A413A]">Score, then 1-click tailored CV</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="space-y-4">
          <h3 class="font-display font-bold text-xl text-[#1B1C1A]">3 &middot; Element wiring index</h3>
          <p class="text-[13px] text-[#5A413A] max-w-[70ch]">Turn on <strong>Show wiring</strong> (bottom left) to see these notes pinned to the elements themselves. This table is the same contract in one place.</p>
          <div class="overflow-x-auto rounded-2xl border border-[#E2BFB5] bg-[#F5F3EF]">
            <table class="w-full text-left">
              <thead><tr class="bg-[#EFEEEA]">
                <th class="py-2.5 px-4 font-mono text-[10px] uppercase tracking-wider text-[#8E7068]">Element</th>
                <th class="py-2.5 px-4 font-mono text-[10px] uppercase tracking-wider text-[#8E7068]">Event</th>
                <th class="py-2.5 px-4 font-mono text-[10px] uppercase tracking-wider text-[#8E7068]">What fires</th>
                <th class="py-2.5 px-4 font-mono text-[10px] uppercase tracking-wider text-[#8E7068]">State lands in</th>
              </tr></thead>
              <tbody>
''' + "\n".join(row(*r) for r in ELEMENT_WIRING) + '''
              </tbody>
            </table>
          </div>
        </section>

        <section class="space-y-4">
          <h3 class="font-display font-bold text-xl text-[#1B1C1A]">4 &middot; Offline-first pipeline</h3>
          <div class="p-6 rounded-2xl bg-[#F5F3EF] border border-[#E2BFB5] space-y-3 font-mono text-[11px] text-[#5A413A] leading-relaxed">
            <p class="text-[#1B1C1A]">[ input event ]</p>
            <p class="pl-4">&darr;</p>
            <p class="pl-4 text-[#1B1C1A]">[ zod validate ]</p>
            <p class="pl-4">&darr;</p>
            <p class="pl-4 text-[#1B1C1A]">[ local write &lt;2ms ] &rarr; IndexedDB (web) / expo-sqlite (phone)</p>
            <p class="pl-4">&darr;</p>
            <p class="pl-4 text-[#DA4A1C]">[ micro-toast: &ldquo;Imehifadhiwa (Otomatiki)&rdquo; ] &mdash; confirmation of a completed write</p>
            <p class="pl-4">&darr;</p>
            <p class="pl-4 text-[#1B1C1A]">[ network health ]</p>
            <p class="pl-8">online &rarr; drain outbox &rarr; PUT delta &rarr; server broadcast</p>
            <p class="pl-8">offline &rarr; queue in outbox, keep working</p>
            <p class="pt-2 text-[#8E7068]">The local write is the save. The upload is a copy. That ordering is what makes the product usable on a phone with no bundle.</p>
          </div>
        </section>

        <section class="space-y-4">
          <h3 class="font-display font-bold text-xl text-[#1B1C1A]">5 &middot; Extension runtime contract (Manifest V3)</h3>
          <div class="grid gap-4 md:grid-cols-2">
            <div class="p-5 rounded-2xl bg-[#F5F3EF] border border-[#E2BFB5] space-y-2">
              <h4 class="font-display font-semibold text-sm text-[#1B1C1A]">Verified domains only</h4>
              <p class="text-[13px] text-[#5A413A]">The content script mounts on an explicit allow-list of job domains and nowhere else. No ambient reading of the user&rsquo;s browsing.</p>
            </div>
            <div class="p-5 rounded-2xl bg-[#F5F3EF] border border-[#E2BFB5] space-y-2">
              <h4 class="font-display font-semibold text-sm text-[#1B1C1A]">Scoring is local</h4>
              <p class="text-[13px] text-[#5A413A]">Cosine similarity against the CV cached on the device. The advert text is not uploaded to be scored, so the score reflects the user&rsquo;s real fields or it is absent.</p>
            </div>
            <div class="p-5 rounded-2xl bg-[#F5F3EF] border border-[#E2BFB5] space-y-2">
              <h4 class="font-display font-semibold text-sm text-[#1B1C1A]">Autofill never invents</h4>
              <p class="text-[13px] text-[#5A413A]">Form injection writes the user&rsquo;s stored answers. A field with no answer is left for the user — a guessed value in a job application is worse than an empty one.</p>
            </div>
            <div class="p-5 rounded-2xl bg-[#F5F3EF] border border-[#E2BFB5] space-y-2">
              <h4 class="font-display font-semibold text-sm text-[#1B1C1A]">The original is preserved</h4>
              <p class="text-[13px] text-[#5A413A]">A tailored CV is a clone. The user&rsquo;s master document is never edited in place by a one-click action.</p>
            </div>
          </div>
        </section>

        <section class="space-y-4">
          <h3 class="font-display font-bold text-xl text-[#1B1C1A]">6 &middot; Export mechanics</h3>
          <div class="p-5 rounded-2xl bg-[#F5F3EF] border border-[#E2BFB5] space-y-3 text-[13px] text-[#5A413A]">
            <p><strong class="text-[#1B1C1A]">Single file, no network.</strong> This document carries its own stylesheet and its fonts. Open it on a train, on an intranet, in five years &mdash; it renders the same.</p>
            <p><strong class="text-[#1B1C1A]">Print isolation.</strong> <span class="font-mono text-[12px]">@media print</span> locks the document canvas to ISO A4 (210&times;297mm) with margins fixed, so paper output cannot drift from the preview.</p>
            <p><strong class="text-[#1B1C1A]">Four viewports, one artefact.</strong> Desktop, tablet, mobile and extension are the same components at different breakpoints &mdash; not four separate designs that must be kept in sync by hand.</p>
          </div>
        </section>
      </section>
'''

# Insert the tab after the last existing viewport tab, and the view before the
# wiring toggle script's closing.
last_tab_anchor = '<span class="sm:hidden">Extension</span>'
assert last_tab_anchor in html, "extension tab anchor not found"
i = html.find(last_tab_anchor)
j = html.find("</button>", i) + len("</button>")
html = html[:j] + "\n" + BLUEPRINT_TAB + html[j:]

html = html.replace("  <script>\n    function switchView(viewId) {", BP + "\n  <script>\n    function switchView(viewId) {", 1)
assert 'id="view-blueprint"' in html, "blueprint view not inserted"

TOGGLE_HTML = '''<button id="wiring-toggle" onclick="document.body.classList.toggle('wiring'); this.innerText = document.body.classList.contains('wiring') ? 'Ficha wiring' : 'Onyesha wiring';">Onyesha wiring</button>
'''
html = html.replace("  <script>\n    function switchView(viewId) {", TOGGLE_HTML + "  <script>\n    function switchView(viewId) {", 1)

open(OUT, "w", encoding="utf-8").write(html)
log.append(f"blueprint view + wiring toggle added ({len(ELEMENT_WIRING)} wired elements documented)")
print("\n".join("  • " + l for l in log))

# ─────────────────────────────────────────────────────────────────────────────
# 5. COMPILE THE STYLESHEET (no CDN at runtime)
# ─────────────────────────────────────────────────────────────────────────────
subprocess.run(
    ["npx", "--yes", "tailwindcss@3.4.6", "-c", cfg_path, "-i",
     os.path.join(OUTDIR, "in.css"), "-o", os.path.join(OUTDIR, "out.css"),
     "--content", OUT, "--minify"],
    cwd=WEB, shell=True, check=True,
)

# ─────────────────────────────────────────────────────────────────────────────
# 6. EMBED THE FONTS (so "offline" is true rather than approximate)
# ─────────────────────────────────────────────────────────────────────────────
def embed_fonts():
    req = urllib.request.Request(
        "https://fonts.googleapis.com/css2"
        "?family=Bricolage+Grotesque:opsz,wght@12..96,600;700"
        "&family=Hanken+Grotesk:wght@400;500;600;700"
        "&family=JetBrains+Mono:wght@500;700&display=swap",
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                               "(KHTML, like Gecko) Chrome/120.0 Safari/537.36"},
    )
    css = urllib.request.urlopen(req, timeout=30).read().decode()
    blocks = re.findall(r"/\*\s*([a-z0-9-]+)\s*\*/\s*(@font-face\s*\{.*?\})", css, re.S)
    keep = [(n, b) for n, b in blocks if n in ("latin", "latin-ext")]
    out, done = [], {}
    for name, block in keep:
        url = re.search(r"url\((https://[^)]+\.woff2)\)", block)
        if not url:
            continue
        u = url.group(1)
        if u not in done:
            done[u] = base64.b64encode(urllib.request.urlopen(u, timeout=30).read()).decode()
        out.append(block.replace(u, "data:font/woff2;base64," + done[u]))
    return "\n".join(out), len(done)

font_css, n_fonts = "", 0
try:
    font_css, n_fonts = embed_fonts()
    log.append(f"fonts embedded: {n_fonts} woff2 files, fully offline")
except Exception as e:                                     # network is optional
    log.append(f"font embed skipped ({type(e).__name__}) - system fallbacks used")

css = open(os.path.join(OUTDIR, "out.css"), encoding="utf-8").read()
final = open(OUT, encoding="utf-8").read().replace("/*__SUMAIYA_CSS__*/", font_css + "\n" + css)
open(OUT, "w", encoding="utf-8").write(final)

kb = os.path.getsize(OUT) / 1024
external = re.findall(r'(?:src|href)="(https?://[^"]+)"', final)
print("\n".join("  • " + l for l in log[3:]))
print(f"\n  OUT: {OUT}\n  {kb:.0f} KB, stylesheet inline ({len(css)//1024} KB), "
      f"{n_fonts} fonts embedded")
print(f"  external references remaining: {external if external else 'NONE'}")
