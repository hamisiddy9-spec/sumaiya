#!/usr/bin/env python
"""Generate the face-aspect fixtures: a square headshot and a portrait one.

Both are a beige face DISC on a white canvas with dark shoulders, the same
geometry as docs/qa-fixtures-2026-09-20/photo-small-dataurl.txt (600x600, beige
disc, dark shoulders) that the live-app captures used — so the before numbers
(measured on those PDFs) and the after numbers (measured on freshly rendered
PDFs) describe the same source image.

The portrait one is the case that matters commercially: a passport photo is
35x45mm, so it is NOT square and every square frame has to crop it.
"""
import os
from PIL import Image, ImageDraw

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "docs", "photo-face")
SKIN = (205, 160, 125)
SHOULDERS = (40, 60, 90)


def headshot(w, h, disc_cx, disc_cy, radius, path):
    im = Image.new("RGB", (w, h), (255, 255, 255))
    d = ImageDraw.Draw(im)
    # shoulders: a wide ellipse anchored to the bottom edge
    d.ellipse([disc_cx - int(radius * 2.1), h - int(radius * 1.1),
               disc_cx + int(radius * 2.1), h + int(radius * 1.6)], fill=SHOULDERS)
    d.ellipse([disc_cx - radius, disc_cy - radius, disc_cx + radius, disc_cy + radius], fill=SKIN)
    im.save(path, "JPEG", quality=90)
    print(f"{os.path.basename(path)}  {w}x{h}  disc d={radius * 2} at ({disc_cx},{disc_cy})  {os.path.getsize(path)} B")


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    headshot(600, 600, 300, 300, 150, os.path.join(OUT, "photo-square-fixture.jpg"))
    headshot(600, 900, 300, 380, 150, os.path.join(OUT, "photo-portrait-fixture.jpg"))
