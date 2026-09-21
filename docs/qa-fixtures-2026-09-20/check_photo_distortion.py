#!/usr/bin/env python
"""Distortion check on the RENDERED photo, measured inside the exported PDF.

The fixture headshot is a 600x600 square whose beige face disc is an exact
300x300 circle. If a template renders that image without distortion the disc
must come out square (aspect ~1.00) whatever size the frame is; objectFit
"cover" crops, it does not scale the two axes differently.

For every template with a photo/no-photo export pair we diff the two rasters to
locate the photo's footprint, then measure the beige disc inside it.
"""
import io, json, os
import numpy as np
from pypdf import PdfReader
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
CLEAN = os.path.join(HERE, "clean")
SKIN = np.array([205, 160, 125])
HAIR = np.array([40, 60, 90])


def raster(p):
    r = PdfReader(p)
    return np.array(Image.open(io.BytesIO(list(r.pages[0].images)[0].data)).convert("RGB"))


def pairs():
    out = []
    for f in sorted(os.listdir(CLEAN)):
        if f.startswith("photo-") and f.endswith(".pdf"):
            tid = f[len("photo-"):-4]
            if os.path.exists(os.path.join(CLEAN, f"nophoto-{tid}.pdf")):
                out.append(tid)
    return out


def analyse(tid):
    rec = {"template": tid}
    try:
        a = raster(os.path.join(CLEAN, f"photo-{tid}.pdf"))
        b = raster(os.path.join(CLEAN, f"nophoto-{tid}.pdf"))
    except Exception as e:
        rec["error"] = str(e)[:120]
        return rec
    if a.shape != b.shape:
        rec["note"] = f"raster size differs when the photo is added: {a.shape[:2]} vs {b.shape[:2]}"
        h = min(a.shape[0], b.shape[0]); w = min(a.shape[1], b.shape[1])
        a, b = a[:h, :w], b[:h, :w]
    d = np.abs(a.astype(int) - b.astype(int)).sum(axis=2)
    ys, xs = np.where(d > 40)
    if len(xs) == 0:
        rec["verdict"] = "PHOTO_NOT_RENDERED"
        return rec
    x0, x1, y0, y1 = int(xs.min()), int(xs.max()), int(ys.min()), int(ys.max())
    rec["changed_px"] = int(len(xs))
    rec["region_wh"] = [x1 - x0 + 1, y1 - y0 + 1]
    sub = a[y0:y1 + 1, x0:x1 + 1].astype(int)
    skin = np.abs(sub - SKIN).sum(axis=2) < 70
    hair = np.abs(sub - HAIR).sum(axis=2) < 90
    for name, mask in (("face_disc", skin), ("shoulders", hair)):
        my, mx = np.where(mask)
        if len(mx) == 0:
            rec[name] = None
            continue
        w = int(mx.max() - mx.min() + 1); h = int(my.max() - my.min() + 1)
        rec[name] = {"w": w, "h": h, "aspect": round(w / h, 3), "px": int(mask.sum())}
    fd = rec.get("face_disc")
    if not fd:
        rec["verdict"] = "PHOTO_PRESENT_DISC_NOT_FOUND"
    elif abs(fd["aspect"] - 1.0) > 0.06:
        rec["verdict"] = "DISTORTED"
    elif fd["px"] < 400:
        rec["verdict"] = "CLIPPED_TINY"
    else:
        rec["verdict"] = "OK"
    return rec


if __name__ == "__main__":
    tids = pairs()
    rows = [analyse(t) for t in tids]
    json.dump(rows, open(os.path.join(HERE, "results-photo-distortion.json"), "w", encoding="utf-8"), indent=1)
    ok = [r for r in rows if r.get("verdict") == "OK"]
    bad = [r for r in rows if r.get("verdict") not in ("OK",)]
    print(f"templates with a photo/no-photo pair: {len(rows)}")
    print(f"  photo renders correctly (disc square, not clipped): {len(ok)}")
    print(f"  problems: {len(bad)}")
    for r in bad:
        print("   ", r.get("verdict"), r["template"], {k: r.get(k) for k in ("face_disc", "region_wh", "changed_px", "error", "note") if r.get(k) is not None})
    print("\n  aspect spread of the rendered face disc (should all be ~1.00):")
    asp = sorted((r.get("face_disc") or {}).get("aspect", 0) for r in rows if r.get("face_disc"))
    if asp:
        print(f"    min={asp[0]} median={asp[len(asp)//2]} max={asp[-1]}")
