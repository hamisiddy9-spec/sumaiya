#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Build the Sumaiya 2026 redesign mockups as standalone, self-contained HTML.

  docs/design/2026-09-20/_mockup.css   -> inlined into every output file
  docs/design/2026-09-20/_build_part2.py -> page bodies (imported)

Everything here is PROPOSAL chrome + the real product surfaces. No source files
of the app are touched. Palette values are read from the app; never invented.
"""
import io, os, sys, pathlib

HERE = pathlib.Path(__file__).parent
CSS = (HERE / "_mockup.css").read_text(encoding="utf-8")

# ── icon set: outline, 1.75 stroke, 24-viewBox (design system §6) ──────────
def ico(name, size=18, stroke="currentColor", sw="1.75"):
    p = {
      "file-text":'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 13h6M9 17h4"/>',
      "plus":'<path d="M12 5v14M5 12h14"/>',
      "target":'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4"/>',
      "shield":'<path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z"/><path d="M9 12l2 2 4-4"/>',
      "briefcase":'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 12h18"/>',
      "mail":'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
      "grid":'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
      "home":'<path d="M4 10.5L12 4l8 6.5"/><path d="M6 9.8V20h12V9.8"/><path d="M10 20v-5h4v5"/>',
      "chevron":'<path d="M9 18l6-6-6-6"/>',
      "camera":'<path d="M4 8h3l2-2h6l2 2h3v11H4z"/><circle cx="12" cy="13" r="3.2"/>',
      "user":'<circle cx="12" cy="8" r="3.6"/><path d="M5 20c0-3.4 3.1-5.6 7-5.6s7 2.2 7 5.6"/>',
      "chat":'<path d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.2A8 8 0 1 1 21 12z"/>',
      "alert":'<circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16.2v.1"/>',
      "wifioff":'<path d="M2 3l19 19"/><path d="M8.5 15.5a5 5 0 0 1 7 0"/><path d="M5 12.2a10 10 0 0 1 3-1.9M19 12.2a10 10 0 0 0-3-1.9"/><path d="M12 19.4v.1"/>',
      "check":'<path d="M4 12.5l5 5L20 6.5"/>',
      "download":'<path d="M12 4v11"/><path d="M7.5 11l4.5 4.5 4.5-4.5"/><path d="M5 20h14"/>',
      "edit":'<path d="M4 20h4l10-10-4-4L4 16z"/><path d="M14 6l4 4"/>',
      "trash":'<path d="M4 7h16"/><path d="M9 7V5h6v2"/><path d="M6 7l1 13h10l1-13"/>',
      "sparkle":'<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/>',
      "refresh":'<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 5v6h-6"/>',
      "eye":'<path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="2.8"/>',
      "more":'<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
      "pin":'<path d="M12 21s6-5.4 6-10a6 6 0 1 0-12 0c0 4.6 6 10 6 10z"/><circle cx="12" cy="11" r="2.2"/>',
      "building":'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2"/>',
      "clock":'<circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3.2 2"/>',
      "cloud":'<path d="M7 18h9.5a3.5 3.5 0 0 0 .4-7A5 5 0 0 0 7.4 9.4 4 4 0 0 0 7 18z"/>',
      "lightning":'<path d="M13 3L5 13h5l-1 8 8-10h-5z"/>',
    }[name]
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" '
            f'stroke="{stroke}" stroke-width="{sw}" stroke-linecap="round" '
            f'stroke-linejoin="round" aria-hidden="true">{p}</svg>')

# The Sumaiya mark — the FIXED logo. Reproduced as a neutral glyph in the
# mockup; the real asset lives in the app and is NOT changed by this proposal.
def mark(size=18, color="var(--ember)"):
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" '
            f'aria-hidden="true">'
            f'<circle cx="12" cy="12" r="3.1" fill="{color}"/>'
            f'<path d="M12 3.2c2.4 2.2 3.4 5 3.4 8.8s-1 6.6-3.4 8.8" stroke="{color}" '
            f'stroke-width="1.9" stroke-linecap="round" opacity=".82"/>'
            f'<path d="M20.8 12c-2.2 2.4-5 3.4-8.8 3.4s-6.6-1-8.8-3.4" stroke="{color}" '
            f'stroke-width="1.9" stroke-linecap="round" opacity=".6"/></svg>')

# The app's REAL five tabs (apps/native/src/navigation/stacks/app-tabs.tsx):
# Home · CVs · Sumaiya · Import · Profile
# Real APK tab labels, from the live device a11y dump 2026-09-20:
# Nyumbani / CV zangu / Sumaiya / Pakia / Wasifu
TABS = [("home","Nyumbani"),("file-text","CV zangu"),("chat","Sumaiya"),("camera","Pakia"),("user","Wasifu")]
TAB_HOME, TAB_CV, TAB_CHAT, TAB_IMPORT, TAB_PROFILE = 0, 1, 2, 3, 4

def statusbar(t="09:24"):
    return (f'<div class="statusbar"><span>{t}</span><span class="right">'
            f'<span class="bar" style="height:7px"></span><span class="bar" style="height:9px"></span>'
            f'<span class="bar" style="height:11px"></span><span class="bar lg"></span>'
            f'<span style="font-size:11px;margin-left:4px">86%</span></span></div>')

def tabbar(active=2):
    out = ['<div class="tabbar">']
    for i,(g,label) in enumerate(TABS):
        on = (i == active)
        gl = mark(22) if g=="chat" else ico(g,22)
        out.append(f'<div class="tab{" on" if on else ""}"><span class="glyph">{gl}</span>'
                   f'<span>{label}</span></div>')
    out.append('</div>')
    return "".join(out)

def phone(body, extra_screen_class="", active_tab=0):
    return f'''<div class="phone"><div class="phone__screen {extra_screen_class}">
  <div class="phone__notch"></div>
  {statusbar()}
  <div class="app">{body}</div>
  {tabbar(active_tab)}
</div></div>'''

def _extract_phones(html):
    """Pull each top-level <div class="phone"> block out of a built page."""
    body_at = html.find("<body>")
    src = html[body_at:] if body_at >= 0 else html
    key = '<div class="phone">'
    out, start = [], 0
    while True:
        i = src.find(key, start)
        if i < 0:
            break
        depth, j = 0, i
        while True:
            nd, nc = src.find("<div", j), src.find("</div>", j)
            if nc < 0:
                break
            if nd != -1 and nd < nc:
                depth += 1
                j = nd + 4
            else:
                depth -= 1
                j = nc + 6
                if depth == 0:
                    break
        out.append(src[i:j])
        start = j
    return out

def flush_shots(base, html):
    """Write one bare 390×844 render target per phone found on the page."""
    out_dir = HERE / "_shot"
    out_dir.mkdir(exist_ok=True)
    phones = _extract_phones(html)
    for i, ph in enumerate(phones):
        page = (f'<!DOCTYPE html><html lang="sw"><head><meta charset="utf-8">'
                f'<meta name="viewport" content="width=390,initial-scale=1">'
                f'<title>{base} frame {i+1}</title><style>{CSS}'
                f'body{{background:#EFE7DA;margin:0;padding:14px;width:418px}}'
                f'.phone__screen{{height:auto;min-height:844px;overflow:visible}}'
                f'.scroll{{overflow:visible}}'
                f'*,*::before,*::after{{animation:none!important;transition:none!important}}'
                f'.arrive,.handoff{{opacity:1!important;transform:none!important}}'
                f'.sk{{background:#EFE7DA!important}}'
                f'</style></head>'
                f'<body>{ph}</body></html>')
        (out_dir / f"{base}-frame{i+1}.html").write_text(page, encoding="utf-8")
    return len(phones)

def note(tag, title, body_html, kind=""):
    return (f'<div class="note {kind}"><span class="tag">{tag}</span>'
            f'<h4>{title}</h4>{body_html}</div>')

def doc(title, lede, sections_html, kicker="Sumaiya · Redesign proposal · 2026-09-20",
        extra_css="", foot=""):
    return f'''<!DOCTYPE html>
<html lang="sw"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title} — Sumaiya 2026 redesign</title>
<style>{CSS}{extra_css}</style>
</head><body>
<div class="wrap">
  <div class="masthead">
    <p class="kicker">{kicker}</p>
    <h1>{title}</h1>
    <p>{lede}</p>
    <p class="meta">Colours and the logo are <code>FIXED</code> — read from
      <code>apps/web/tailwind.config.ts</code> and
      <code>apps/native/src/components/ui/theme.ts</code>. Motion obeys
      <code>docs/MOTION-STANDARD-2026-09-20.md</code>. No source file is modified by this proposal.</p>
  </div>
  {sections_html}
  {foot}
</div>
</body></html>
'''

def write(name, html):
    out = HERE / name
    out.write_text(html, encoding="utf-8")
    shots = flush_shots(name.replace(".html", ""), html)
    print(f"{out.name}  {len(html):,} bytes   shots: {shots}")

if __name__ == "__main__":
    import _build_part2 as p2
    import _build_part3 as p3
    import _build_part4 as p4
    import _build_part5 as p5
    g = globals()
    p2.build(g)
    p3.build2(g)
    p4.build3(g)
    p5.build4(g)
