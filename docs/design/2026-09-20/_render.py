#!/usr/bin/env python
"""Render each mockup shot-file to a PNG at a true phone viewport, then trim.

Chrome headless at 390 CSS px wide, 2× device scale → 780 px PNG, so a vision
model judges the pixels the user would actually get.
"""
import pathlib, subprocess, sys, glob, os
from PIL import Image

HERE = pathlib.Path(__file__).parent
SHOT = HERE / "_shot"
PNG = HERE / "_png"
PNG.mkdir(exist_ok=True)
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
W, MAXH, SCALE = 418, 4200, 2


def render(src: pathlib.Path, dst: pathlib.Path):
    subprocess.run([
        CHROME, "--headless=old", "--disable-gpu", "--hide-scrollbars",
        "--default-background-color=FAF5EE00",
        f"--force-device-scale-factor={SCALE}",
        f"--window-size={W},{MAXH}",
        f"--screenshot={dst}",
        src.as_uri(),
    ], check=False, capture_output=True, timeout=180)
    if not dst.exists():
        return False
    im = Image.open(dst).convert("RGB")
    # trim the trailing flat background so the proposal is not 4200px of空白
    bg = im.getpixel((im.width // 2, im.height - 4))
    px = im.load()
    last = im.height - 1
    while last > 10:
        row = [px[x, last] for x in range(0, im.width, 24)]
        if any(abs(r - bg[0]) + abs(g - bg[1]) + abs(b - bg[2]) > 12 for r, g, b in row):
            break
        last -= 1
    im.crop((0, 0, im.width, min(im.height, last + 20))).save(dst)
    return True


if __name__ == "__main__":
    files = sorted(SHOT.glob("*.html"))
    if len(sys.argv) > 1:
        files = [f for f in files if sys.argv[1] in f.name]
    for f in files:
        out = PNG / (f.stem + ".png")
        ok = render(f, out)
        size = Image.open(out).size if ok else None
        print(f"{'OK ' if ok else 'FAIL'} {out.name}  {size}")
