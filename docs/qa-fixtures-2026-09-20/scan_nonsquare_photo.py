#!/usr/bin/env python
"""Static scan of every template component for a NON-SQUARE photo frame.

Why: html2canvas 1.4.1 (proven in h2c/index.html) ignores `object-fit`, so it
stretches any <img> to its element box. A photo frame whose width != height
therefore exports a distorted photo even though the on-screen preview is correct
— that is the kioo defect. This scan finds every template that could have it, so
the finding is not limited to the 59 exercised by the export sweep.

Heuristics, strongest first:
  A. an explicit non-square frame around a photo: `width: N` / `height: M` with
     N != M in the same style object as a photo <img>, or numeric size props.
  B. a photo <img> whose CSS width/height are percentages inside a frame defined
     elsewhere (needs the frame's numbers to differ) — reported as "check".
  C. use of the shared helpers (PhotoCircle / PhotoSquare) which are always
     square by construction, or CvPhoto (also square) - NOT at risk.
"""
import os, re, json, glob

HERE = os.path.dirname(os.path.abspath(__file__))
TPL = os.path.join(HERE, "..", "..", "..", "sumaiya", "apps", "web", "components", "templates")
TPL = os.path.normpath(os.path.join(os.path.dirname(HERE), "..", "apps", "web", "components", "templates"))

SAFE_HELPERS = ("PhotoCircle", "PhotoSquare", "CvPhoto")


def scan_file(path):
    src = open(path, encoding="utf-8", errors="replace").read()
    name = os.path.basename(path)
    out = {"template": name[:-4], "rawImg": False, "safeHelper": any(h in src for h in SAFE_HELPERS), "flags": []}
    # raw <img ... photo ...> inside this file (not via the shared helpers)
    for m in re.finditer(r"<img[^>]{0,400}?/>", src, re.S):
        tag = m.group(0)
        if "photo" not in tag.lower():
            continue
        out["rawImg"] = True
        # style object on the img
        wm = re.search(r"width:\s*\"?([0-9.]+)(px|%|)\"?", tag)
        hm = re.search(r"height:\s*\"?([0-9.]+)(px|%|)\"?", tag)
        of = re.search(r"objectFit:\s*\"?([a-zA-Z]+)", tag)
        out["flags"].append({
            "kind": "img-style",
            "width": wm.group(1) + wm.group(2) if wm else None,
            "height": hm.group(1) + hm.group(2) if hm else None,
            "objectFit": of.group(1) if of else None,
        })
    # numeric photo size props:  size={N} / photoSize={N} / width={N} height={M}
    for m in re.finditer(r"(photoSize|photoW|photoH|photoWidth|photoHeight)\s*[=:]\s*\{?([0-9]+)", src):
        out["flags"].append({"kind": "numeric", "prop": m.group(1), "value": int(m.group(2))})
    # a photo frame wrapper with explicit px width/height that differ
    for m in re.finditer(r"(width|minWidth)\s*:\s*([0-9]{2,3})[,\s]*\n?\s*(height|minHeight)\s*:\s*([0-9]{2,3})", src):
        a, b = int(m.group(2)), int(m.group(4))
        if a != b and "photo" in src[max(0, m.start() - 600):m.start() + 600].lower():
            out["flags"].append({"kind": "frame-wxh", "w": a, "h": b})
    return out


def main():
    files = sorted(glob.glob(os.path.join(TPL, "*.tsx")))
    rows = []
    for f in files:
        if os.path.basename(f).startswith(("template-", "fit-frame", "index")):
            continue
        rows.append(scan_file(f))
    withimg = [r for r in rows if r["rawImg"]]
    flagged = []
    for r in withimg:
        w = h = None
        for fl in r["flags"]:
            if fl["kind"] == "img-style":
                if fl["width"] and fl["width"].endswith("px") and fl["height"] and fl["height"].endswith("px"):
                    if fl["width"] != fl["height"]:
                        w, h = fl["width"], fl["height"]
            if fl["kind"] == "frame-wxh" and fl["w"] != fl["h"]:
                w, h = fl["w"], fl["h"]
        if w and h:
            flagged.append({"template": r["template"], "frame": f"{w} x {h}"})
    print(f"template components scanned: {len(rows)}")
    print(f"  with a RAW <img> for the photo (not the shared square helpers): {len(withimg)}")
    print(f"  of those, with a detected NON-SQUARE photo frame: {len(flagged)}")
    for f in flagged:
        print("   ", f["template"], f["frame"])
    json.dump({"scanned": len(rows), "rawImg": len(withimg), "flagged": flagged,
               "rawImgTemplates": [r["template"] for r in withimg]},
              open(os.path.join(HERE, "results-templates-nonsquare.json"), "w", encoding="utf-8"), indent=1)


if __name__ == "__main__":
    main()
