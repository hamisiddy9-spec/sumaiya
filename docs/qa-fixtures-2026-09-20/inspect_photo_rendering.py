#!/usr/bin/env python
"""Photo-rendering proof, from the PDF BYTES.

For every template we exported the same CV twice: once with a passport-style
photo and once without. The difference between the two page rasters IS the
rendered photo. This script measures it:

  * changed-pixel count and bounding box  -> was the photo drawn at all?
  * luminance variance + distinct colours INSIDE that box -> is it a real image
    or a blank hole? (the shipped bug produced a present-but-empty <img>, so
    presence alone proves nothing)
  * whether the changed box looks clipped (touching a page/column edge with a
    suspiciously thin or lopsided shape)

Also reports the embedded image objects in the PDF bytes (count + dimensions),
which is the check the DOM cannot give you.
"""
import io, json, os, sys, hashlib
from pypdf import PdfReader
from PIL import Image, ImageChops, ImageStat

HERE = os.path.dirname(os.path.abspath(__file__))
CLEAN = os.path.join(HERE, "clean")


def page_raster(fp):
    r = PdfReader(fp)
    pg = r.pages[0]
    imgs = list(pg.images)
    if not imgs:
        return None, 0, []
    im = Image.open(io.BytesIO(imgs[0].data)).convert("RGB")
    meta = [{"len": len(i.data), "w": Image.open(io.BytesIO(i.data)).size[0],
             "h": Image.open(io.BytesIO(i.data)).size[1],
             "sha1": hashlib.sha1(i.data).hexdigest()[:16]} for i in imgs]
    return im, len(r.pages), meta


def analyse(tid):
    on = os.path.join(CLEAN, f"photo-{tid}.pdf")
    off = os.path.join(CLEAN, f"nophoto-{tid}.pdf")
    rec = {"template": tid}
    if not (os.path.exists(on) and os.path.exists(off)):
        rec["error"] = "missing export pair"
        return rec
    a, pages_on, meta = page_raster(on)
    b, pages_off, _ = page_raster(off)
    rec["bytes_on"] = os.path.getsize(on)
    rec["bytes_off"] = os.path.getsize(off)
    rec["pages"] = pages_on
    rec["pdf_image_objects"] = meta
    if a is None or b is None:
        rec["error"] = "no embedded image"
        return rec
    if a.size != b.size:
        rec["note_size_mismatch"] = [a.size, b.size]
        b = b.resize(a.size)
    diff = ImageChops.difference(a, b).convert("L")
    bbox = diff.point(lambda p: 255 if p > 18 else 0).getbbox()
    if not bbox:
        rec["verdict"] = "PHOTO_NOT_RENDERED"
        rec["changed_pixels"] = 0
        return rec
    x0, y0, x1, y1 = bbox
    mask = diff.point(lambda p: 255 if p > 18 else 0)
    rec["changed_pixels"] = int(mask.histogram()[255])
    rec["changed_fraction"] = round(rec["changed_pixels"] / float(a.size[0] * a.size[1]), 5)
    rec["bbox"] = [x0, y0, x1, y1]
    rec["bbox_wh"] = [x1 - x0, y1 - y0]
    rec["bbox_aspect"] = round((x1 - x0) / max(1, (y1 - y0)), 3)
    crop = a.crop(bbox)
    g = crop.convert("L")
    stat = ImageStat.Stat(g)
    rec["photo_mean"] = round(stat.mean[0], 1)
    rec["photo_stddev"] = round(stat.stddev[0], 1)
    small = g.resize((min(64, g.width), min(64, g.height)))
    rec["photo_distinct_gray"] = len(set(small.getdata()))
    # edges of the page: is the changed region pressed against a margin?
    W, H = a.size
    rec["touches_edge"] = (x0 <= 2) or (y0 <= 2) or (x1 >= W - 2) or (y1 >= H - 2)
    std = stat.stddev[0]
    if rec["photo_distinct_gray"] <= 2 or std < 3:
        rec["verdict"] = "BLANK_PHOTO"
    elif std < 12:
        rec["verdict"] = "SUSPECT_FLAT"
    else:
        rec["verdict"] = "OK"
    return rec


def main():
    tids = json.load(open(os.path.join(HERE, "template-names.json"), encoding="utf-8"))
    ids = [c[0] for c in tids["curated"]] + ["aberdare", "alpine", "austin", "bauhaus", "carbon", "cascade",
                                             "chicago", "cirrus", "cipher", "celeste", "boston", "baroque-cv"]
    if len(sys.argv) > 1:
        ids = sys.argv[1].split(",")
    out = [analyse(t) for t in ids]
    json.dump(out, open(os.path.join(HERE, "results-photo-render.json"), "w", encoding="utf-8"), indent=1)
    ok = [r for r in out if r.get("verdict") == "OK"]
    bad = [r for r in out if r.get("verdict") not in (None, "OK")]
    err = [r for r in out if r.get("error")]
    print(f"templates analysed: {len(out)}")
    print(f"  photo OK (non-uniform, real image): {len(ok)}")
    print(f"  PROBLEMS: {len(bad)}")
    for r in bad:
        print("   ", r.get("verdict"), r["template"], "bbox", r.get("bbox"), "wh", r.get("bbox_wh"),
              "stddev", r.get("photo_stddev"), "distinct", r.get("photo_distinct_gray"), "changed", r.get("changed_pixels"))
    for r in err:
        print("    ERROR", r["template"], r["error"])
    # dedupe identical rendered photos (same pixels across templates)
    sigs = {}
    for r in out:
        if r.get("verdict") and r.get("bbox"):
            sigs.setdefault((tuple(r["bbox"]), r.get("photo_stddev")), []).append(r["template"])
    print("\nbbox+stddev signature groups (should be many distinct groups):")
    for k, v in sorted(sigs.items(), key=lambda x: -len(x[1]))[:8]:
        print("   ", k, "->", v[:12])


if __name__ == "__main__":
    main()
