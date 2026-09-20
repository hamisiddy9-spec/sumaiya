#!/usr/bin/env python
"""Face-aspect (photo distortion) measurement — contamination-proof.

WHY THIS EXISTS
---------------
The first pass (check_photo_distortion.py) diffed the photo-on and photo-off page
rasters, took the BOUNDING BOX of every changed pixel, and measured the
beige face disc inside that box. That is wrong whenever adding a photo makes the
layout REFLOW (a name shifts right, a header grows): the changed-pixel box then
covers most of the page, and any beige/gold template accent inside it is counted
as part of the "face". Regent measured 212x1465 and sahara 794x2071 — both are
accent-coloured columns, not faces.

WHAT THIS DOES INSTEAD
----------------------
The fixture headshot is a 600x600 square holding an exact 300x300 beige DISC.
So the face is a *photo-derived, disc-shaped* blob:

  1. skin mask on the photo-ON raster (same tolerance as the first pass);
  2. remove pixels that are already skin-coloured in the photo-OFF raster —
     a template's own beige/gold rules and panels are static, the face is not;
  3. label connected components and keep the disc-shaped ones: a circle (or an
     ellipse) fills pi/4 = 0.785 of its bounding box, a bar or a panel fills ~1.0;
  4. report that component's width/height. On an undistorted render the disc is
     square (aspect 1.000) at ANY frame size; anything below ~0.9 is the face
     visibly squashed.

Usage:  python scripts/photo-face-aspect.py [--json out.json] [--dir <clean dir>]
"""
import argparse, io, json, os, sys
import numpy as np
from scipy import ndimage
from pypdf import PdfReader
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
DEFAULT_CLEAN = os.path.join(HERE, "..", "docs", "qa-fixtures-2026-09-20", "clean")
SKIN = np.array([205, 160, 125])
DISC_FILL_RANGE = (0.55, 0.92)   # pi/4 = 0.785 for a disc; ~1.0 for a bar/panel
MIN_DISC_AREA = 150


def raster(p):
    if p.lower().endswith(".png"):
        return np.array(Image.open(p).convert("RGB"))
    r = PdfReader(p)
    imgs = list(r.pages[0].images)
    if not imgs:
        return None
    return np.array(Image.open(io.BytesIO(imgs[0].data)).convert("RGB"))


def _ext(d):
    """Raster extension a capture dir uses (.png for the DOM harness, .pdf for
    the live-app captures). Chosen by which one actually has photo pairs, since
    a capture dir can hold stray PNGs of other sizes."""
    def count(ext):
        return sum(1 for f in os.listdir(d)
                   if f.startswith("photo-") and f.endswith(ext)
                   and os.path.exists(os.path.join(d, "nophoto-" + f[len("photo-"):-len(ext)] + ext)))
    return ".pdf" if count(".pdf") >= count(".png") else ".png"


def pairs(clean):
    ext = _ext(clean)
    out = []
    for f in sorted(os.listdir(clean)):
        if f.startswith("photo-") and f.endswith(ext):
            tid = f[len("photo-"):-len(ext)]
            if os.path.exists(os.path.join(clean, f"nophoto-{tid}{ext}")):
                out.append(tid)
    return out


def skin_mask(a):
    return np.abs(a.astype(int) - SKIN).sum(axis=2) < 70


def analyse(tid, clean):
    rec = {"template": tid}
    a = raster(os.path.join(clean, f"photo-{tid}.pdf"))
    b = raster(os.path.join(clean, f"nophoto-{tid}.pdf"))
    if a is None or b is None:
        rec["error"] = "no embedded image"
        return rec
    if a.shape != b.shape:
        h = min(a.shape[0], b.shape[0]); w = min(a.shape[1], b.shape[1])
        a, b = a[:h, :w], b[:h, :w]
        rec["note"] = "raster size differs when the photo is added (layout reflow)"

    changed = np.abs(a.astype(int) - b.astype(int)).sum(axis=2) > 40
    rec["changed_px"] = int(changed.sum())
    # photo-derived skin: skin-coloured now, not skin-coloured without the photo
    photo_skin = skin_mask(a) & changed & ~skin_mask(b)

    lab, n = ndimage.label(photo_skin, structure=np.ones((3, 3)))
    comps = []
    if n:
        for i, sl in enumerate(ndimage.find_objects(lab), start=1):
            sub = (lab[sl] == i)
            area = int(sub.sum())
            if area < MIN_DISC_AREA:
                continue
            h = sl[0].stop - sl[0].start
            w = sl[1].stop - sl[1].start
            comps.append({
                "area": area, "w": w, "h": h,
                "aspect": round(w / h, 3),
                "fill": round(area / float(w * h), 3),
                "y": int(sl[0].start), "x": int(sl[1].start),
            })
    comps.sort(key=lambda c: -c["area"])
    rec["disc_candidates"] = comps[:4]
    disc = next((c for c in comps if DISC_FILL_RANGE[0] <= c["fill"] <= DISC_FILL_RANGE[1]), None)
    if disc is None:
        rec["face_disc"] = None
        rec["verdict"] = "FACE_DISC_NOT_FOUND" if len(comps) == 0 else "NO_DISC_SHAPED_COMPONENT"
    else:
        rec["face_disc"] = {"w": disc["w"], "h": disc["h"], "aspect": disc["aspect"], "px": disc["area"]}
        if abs(disc["aspect"] - 1.0) > 0.06:
            rec["verdict"] = "DISTORTED"
        else:
            rec["verdict"] = "OK"
    return rec


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dir", default=os.path.normpath(DEFAULT_CLEAN))
    ap.add_argument("--json", default=None)
    args = ap.parse_args()

    rows = [analyse(t, args.dir) for t in pairs(args.dir)]
    bad = [r for r in rows if r.get("verdict") not in ("OK",)]
    print(f"templates with a photo/no-photo pair: {len(rows)}")
    print(f"  face disc square (undistorted): {len(rows) - len(bad)}")
    print(f"  problems: {len(bad)}")
    for r in bad:
        print("   ", r.get("verdict"), r["template"],
              json.dumps(r.get("face_disc") or r.get("disc_candidates")))
    asp = [(r["template"], (r.get("face_disc") or {}).get("aspect"))
           for r in rows if r.get("face_disc")]
    vals = sorted(v for _, v in asp if v is not None)
    if vals:
        below = [(t, v) for t, v in asp if v is not None and v < 0.9]
        above = [(t, v) for t, v in asp if v is not None and v > 1.06]
        print(f"\n  face-disc aspect: min={vals[0]} median={vals[len(vals)//2]} max={vals[-1]}")
        print(f"  squashed  (aspect < 0.90): {len(below)} {below}")
        print(f"  stretched (aspect > 1.06): {len(above)} {above}")
        print(f"  no disc found (photo absent / grayscale): "
              f"{[r['template'] for r in rows if not r.get('face_disc')]}")
    if args.json:
        json.dump(rows, open(args.json, "w", encoding="utf-8"), indent=1)
        print(f"  wrote {args.json}")


if __name__ == "__main__":
    main()
