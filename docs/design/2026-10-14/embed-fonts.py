#!/usr/bin/env python3
"""
Close the last gap in the unified suite: make it genuinely offline.

Google Fonts serves this machine an anti-bot interstitial instead of the css, so
the first attempt could not embed anything. The same faces are published as plain
woff2 on jsDelivr via the @fontsource packages, which fetch fine.

After this runs the file has no external reference of any kind.
"""
import base64, os, re, subprocess, sys

OUT = os.path.expanduser(r"~/qa-sumaiya/suite-build/sumaiya-unified-suite.html")
CDN = "https://cdn.jsdelivr.net/npm/@fontsource/{pkg}@5/files/{file}"

FACES = [
    ("Bricolage Grotesque", "bricolage-grotesque", [600, 700, 800]),
    ("Hanken Grotesk",      "hanken-grotesk",      [400, 500, 600, 700]),
    ("JetBrains Mono",      "jetbrains-mono",      [500, 700]),
]

def fetch(url):
    r = subprocess.run(["curl", "-sSL", "--max-time", "45", "--fail", url],
                       capture_output=True)
    return r.stdout if r.returncode == 0 and r.stdout else None

html = open(OUT, encoding="utf-8").read()

# Idempotent: strip anything a previous run injected. Without this, re-running appends
# another full set — three passes left 27 @font-face blocks and a 746 KB file, and the
# duplication was invisible until the block count was checked.
html, stripped = re.subn(
    r"@font-face\{font-family:'[^']+';[^}]*data:font/woff2;base64,[^}]*\}", "", html)
if stripped:
    print(f"  removed {stripped} font blocks from an earlier run before re-injecting")

rules, files, missing = [], 0, []
for family, pkg, weights in FACES:
    for w in weights:
        name = f"{pkg}-latin-{w}-normal.woff2"
        data = fetch(CDN.format(pkg=pkg, file=name))
        if not data or data[:4] != b"wOF2":
            missing.append(name)
            continue
        b64 = base64.b64encode(data).decode()
        files += 1
        rules.append(
            f"@font-face{{font-family:'{family}';font-style:normal;font-weight:{w};"
            f"font-display:swap;src:url(data:font/woff2;base64,{b64}) format('woff2');}}"
        )
        print(f"  embedded {family} {w} ({len(data)//1024} KB)")

if not rules:
    sys.exit("!! no font could be fetched - leaving the stylesheet link in place")

print(f"\n  {files} faces, {sum(len(r) for r in rules)//1024} KB of base64")

html = html.replace('  <style id="sumaiya-css">',
                    '  <style id="sumaiya-css">\n' + "\n".join(rules) + "\n", 1)

for pat in [r'\s*<link rel="preconnect" href="https://fonts\.googleapis\.com">',
            r'\s*<link rel="preconnect" href="https://fonts\.gstatic\.com" crossorigin>',
            r'\s*<link href="https://fonts\.googleapis\.com/css2[^"]*" rel="stylesheet">']:
    html = re.sub(pat, "", html)

open(OUT, "w", encoding="utf-8").write(html)

left = re.findall(r'(?:src|href)="(https?://[^"]+)"', html)
print(f"  OUT {os.path.getsize(OUT)/1024:.0f} KB")
print(f"  external references: {left if left else 'NONE - fully offline'}")
if missing:
    print(f"  NOT embedded (404s): {missing}")
