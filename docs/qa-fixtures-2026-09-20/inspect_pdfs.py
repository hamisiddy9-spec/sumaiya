#!/usr/bin/env python
"""Inspect every captured export PDF with real byte-level checks.

For each PDF: page count, MediaBox in points (A4 = 595.28 x 841.89pt), whether
the text layer is REAL copyable text (and which strings are findable), the
number/size/hash of embedded raster XObjects, and whether the embedded JPEGs
differ between variants that SHOULD differ (template/colour/font).
"""
import io, json, os, sys, hashlib
from pypdf import PdfReader

HERE = os.path.dirname(os.path.abspath(__file__))
EXP = os.path.join(HERE, "exports")

def inspect(fp):
    rec = {"file": os.path.basename(fp), "bytes": os.path.getsize(fp)}
    try:
        r = PdfReader(fp)
    except Exception as e:
        rec["error"] = f"{type(e).__name__}: {str(e)[:120]}"
        return rec
    rec["encrypted"] = bool(r.is_encrypted)
    try:
        rec["pages"] = len(r.pages)
        boxes = []
        for p in r.pages:
            b = p.mediabox
            boxes.append((round(float(b.width), 2), round(float(b.height), 2)))
        rec["mediabox0"] = boxes[0] if boxes else None
        rec["mediabox_all_same"] = len(set(boxes)) == 1
        text = ""
        for p in r.pages:
            try:
                text += (p.extract_text() or "") + "\n"
            except Exception as e:
                text += f"<EXTRACT_ERR {e}>"
        rec["text_chars"] = len("".join(text.split()))
        rec["has_text_layer"] = rec["text_chars"] > 20
        for probe in ["Mwakasege", "Chang'ombe", "Nala Payments", "TypeScript", "ng'ombe", "Nuru", "Rift"]:
            if probe in text:
                rec.setdefault("found", []).append(probe)
        rec["text_head"] = " ".join(text.split())[:110]
        rec["text_tail"] = " ".join(text.split())[-90:]
        # embedded raster XObjects: count, sizes, hashes
        imgs = []
        for pi, p in enumerate(r.pages):
            try:
                for im in p.images:
                    data = im.data
                    imgs.append({"page": pi, "len": len(data), "sha1": hashlib.sha1(data).hexdigest()[:16], "name": im.name})
            except Exception as e:
                imgs.append({"page": pi, "err": str(e)[:80]})
        rec["images"] = imgs
        rec["image_sha1s"] = sorted({i["sha1"] for i in imgs if "sha1" in i})
    except Exception as e:
        rec["error"] = f"late {type(e).__name__}: {str(e)[:120]}"
    return rec


def main():
    targets = sys.argv[1:]
    files = []
    for t in targets:
        if os.path.isdir(t):
            files += [os.path.join(t, f) for f in sorted(os.listdir(t)) if f.endswith(".pdf")]
        else:
            files.append(t)
    out = [inspect(f) for f in files]
    for r in out:
        print(json.dumps(r))

if __name__ == "__main__":
    main()
