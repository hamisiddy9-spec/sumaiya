#!/usr/bin/env python3
"""
Web overhaul, groundwork lane: purge the foreign palette.

Ten files still carry amber/emerald/blue. The config already holds the end-points
(success #186A22, warning #B45309, error #BA1A1A), so this maps by WEIGHT to those
tokens rather than inventing colours:

    amber-*   -> warning   (soft weights become opacity variants)
    emerald-* -> success
    blue-*    -> ember     (the primary; these were links/info accents)

Deliberately weight-based, not hue-based: the mapping is reviewable, and every soft
tint stays a tint of the right token instead of a flat slab of colour.
"""
import io, os, re, sys

ROOT = r"C:\Users\hamis\projects\sumaiya\apps\web"

# Discover the files rather than trusting a hand-written list: the first inventory
# named 10 files, but it was built from a narrower pattern that never looked for
# `amber-`, and 12 MORE files were carrying a foreign palette behind it.
import subprocess as _sp
_r = _sp.run(["grep", "-rlE",
              r"emerald-|indigo-|slate-[0-9]|blue-[0-9]{3}|amber-[0-9]|teal-[0-9]|green-[0-9]",
              "--include=*.tsx", "--include=*.ts", "components", "app"],
             cwd=ROOT, capture_output=True)
FILES = [l.strip() for l in _r.stdout.decode().splitlines() if l.strip()]

# weight -> tailwind suffix on the destination token
WEIGHT = {
    "50": "/10", "100": "/15", "200": "/25", "300": "/40", "400": "/60",
    "500": "", "600": "", "700": "", "800": "/90", "900": "/90", "950": "/90",
}
FAMILY = {"amber": "warning", "emerald": "success", "blue": "ember", "teal": "success", "green": "success"}

PREFIXES = ("bg", "text", "border", "ring", "from", "to", "via", "fill", "stroke",
            "outline", "divide", "shadow", "accent", "caret", "decoration", "placeholder")

pattern = re.compile(
    r"\b(" + "|".join(PREFIXES) + r")-(" + "|".join(FAMILY) + r")-(\d{2,3})\b"
)

def convert(text):
    def sub(m):
        prefix, fam, weight = m.group(1), m.group(2), m.group(3)
        dest = FAMILY[fam]
        suffix = WEIGHT.get(weight, "")
        return f"{prefix}-{dest}{suffix}"
    return pattern.subn(sub, text)

total_before = total_after = 0
changed = []
for rel in FILES:
    path = os.path.join(ROOT, rel.replace("/", os.sep))
    if not os.path.exists(path):
        print(f"  MISSING {rel}")
        continue
    src = io.open(path, encoding="utf-8").read()
    before = len(pattern.findall(src))
    out, n = convert(src)
    if n:
        io.open(path, "w", encoding="utf-8", newline="").write(out)
    after = len(pattern.findall(out))
    total_before += before
    total_after += after
    changed.append((rel, before, after))
    print(f"  {rel.split('/')[-1]:38} {before:3} -> {after}")

print(f"\n  converted {total_before - total_after} classes across {len(changed)} files")
print(f"  foreign classes remaining: {total_after}")

# A whole-tree confirmation, which is the claim that matters.
import subprocess
r = subprocess.run(["grep", "-rlE", r"emerald-|indigo-|slate-[0-9]|blue-[0-9]{3}|amber-[0-9]",
                    "--include=*.tsx", "--include=*.ts", "components", "app"],
                   cwd=ROOT, capture_output=True)
left = [l for l in r.stdout.decode().splitlines() if l.strip()]
print(f"  files across the whole app still carrying a foreign palette: {len(left)}")
for l in left[:8]:
    print("    ", l)
sys.exit(0 if not left else 1)
