#!/usr/bin/env python
"""Measure whether a UI transition INTERPOLATES or is a two-frame pop.

Objective method: decode the clip at 1/4 scale (VFR-safe, uses real per-frame
timestamps from ffprobe), then print per frame:
    ms           - timestamp from clip start
    act_px / %   - pixels that changed vs the PREVIOUS frame   (is anything moving?)
    to_final / % - pixels different from the LAST frame        (how far from settled?)
A real transition ramps: many consecutive frames with moderate activity and a
monotonically shrinking distance-to-final.
A 'boom'/pop shows 0,0,0..., one huge jump, then 0,0,0.

Usage: python motion-frames.py <clip.mp4> [--tag NAME] [--scale 4] [--from MS] [--to MS]
"""
import os, sys, subprocess, glob, shutil, argparse, json
import numpy as np
from PIL import Image

OUTROOT = os.path.join(os.environ.get("LOCALAPPDATA", "."), "Temp", "motion-qa")
THRESH = 24


def probe(clip):
    r = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0",
                        "-show_entries", "frame=best_effort_timestamp_time",
                        "-of", "json", clip], capture_output=True, text=True)
    ts = [float(f["best_effort_timestamp_time"]) for f in json.loads(r.stdout)["frames"]]
    w = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0",
                        "-show_entries", "stream=width,height", "-of", "csv=p=0", clip],
                       capture_output=True, text=True).stdout.strip()
    return ts, w


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("clip")
    ap.add_argument("--tag", default="clip")
    ap.add_argument("--scale", type=int, default=4, help="downscale divisor for analysis")
    ap.add_argument("--from", dest="frm", type=float, default=0.0)
    ap.add_argument("--to", dest="to", type=float, default=1e9)
    a = ap.parse_args()

    ts, wh = probe(a.clip)
    W0, H0 = map(int, wh.split(","))
    print(f"# clip={os.path.basename(a.clip)} frames={len(ts)} panel={W0}x{H0} "
          f"duration={ts[-1]:.3f}s span={ts[1]-ts[0]:.4f}s step")

    framdir = os.path.join(OUTROOT, f"frames-{a.tag}")
    if os.path.isdir(framdir):
        shutil.rmtree(framdir)
    os.makedirs(framdir)
    sw, sh = W0 // a.scale, H0 // a.scale
    subprocess.run(["ffmpeg", "-v", "error", "-i", a.clip, "-fps_mode", "passthrough",
                    "-vf", f"scale={sw}:{sh}",
                    os.path.join(framdir, "f%05d.png")], check=True)
    files = sorted(glob.glob(os.path.join(framdir, "*.png")))
    imgs = [np.asarray(Image.open(f).convert("L")).astype(np.int16) for f in files]
    n = min(len(imgs), len(ts))
    print(f"# analysed {n} frames at {sw}x{sh} (1/{a.scale})  changed-threshold={THRESH}")

    final = imgs[n - 1]
    prev = None
    npix = sw * sh
    print(f"{'i':>4} {'ms':>7} {'act_px':>8} {'act%':>6} {'tofinal':>8} {'tof%':>6}  bar")
    rows = []
    for i in range(n):
        ms = ts[i] * 1000
        act = 0 if prev is None else int(((np.abs(imgs[i] - prev) > THRESH).sum()))
        tof = int(((np.abs(imgs[i] - final) > THRESH).sum()))
        rows.append((i, ms, act, tof))
        if a.frm <= ms <= a.to:
            bar = "#" * min(60, int(60 * act / max(1, npix)))
            print(f"{i:>4} {ms:>7.0f} {act:>8} {100*act/npix:>5.2f}% {tof:>8} {100*tof/npix:>5.2f}%  {bar}")
        prev = imgs[i]

    w = [r for r in rows if r[1] >= a.frm]
    active = [r for r in w if r[2] > 0.001 * npix]
    print()
    print(f"# window frames={len(w)}  frames with >0.1% activity={len(active)}")
    if active:
        acts = sorted(r[2] for r in active)
        print(f"# active-frame activity: min={acts[0]} median={acts[len(acts)//2]} max={acts[-1]} (px of {npix})")
        print(f"# first active frame: i={active[0][0]} t={active[0][1]:.0f}ms   "
              f"last active: i={active[-1][0]} t={active[-1][1]:.0f}ms   "
              f"span={active[-1][1]-active[0][1]:.0f}ms")
    if len(active) <= 2:
        print("# VERDICT: POP — the whole change is carried by <=2 frames, no interpolation")
    else:
        print(f"# VERDICT: INTERPOLATED across {len(active)} frames")


if __name__ == "__main__":
    main()
