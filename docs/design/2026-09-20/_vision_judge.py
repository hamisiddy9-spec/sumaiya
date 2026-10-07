#!/usr/bin/env python
"""Judge the mockup PIXELS with free OpenRouter vision models.

The request body is built in Python and sent over the socket (urllib) — no
base64 ever touches argv, which is what tripped WinError 206.

Runtime only: the key is read from research.env and never printed or committed.
Model failures are recorded separately from product findings.
"""
import base64, io, json, pathlib, random, sys, time, urllib.error, urllib.request
from PIL import Image

HERE = pathlib.Path(__file__).parent
PNG = HERE / "_png"
OUT = HERE / "_vision"
OUT.mkdir(exist_ok=True)
ENV = pathlib.Path(r"C:\Users\hamis\projects\_hdd-data\env\research.env")

# :free ONLY — the account has no spend cap, so a paid id would bill the owner.
# Image-capable free models only (verified against /api/v1/models 2026-09-20:
# glm-5.2, nemotron-3.5-lightning and nemotron-3-ultra are TEXT-ONLY, so they
# cannot judge pixels). Rotate on failure; the JSONL records which model spoke.
MODELS = [
    "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",  # verified: answers
    "inclusionai/ling-3.0-flash-vl:free",
    "google/gemma-4-26b-a4b-it:free",
    "nex-agi/nex-n2.5-pro:free",
    "thinkingmachines/inkling-small:free",
    "dots-studio/dots-3-note-preview:free",
    "google/gemma-4-31b-it:free",
    "qwen/qwen3.8-27b:free",
]

PROMPT = """You are a senior mobile product designer judging a DESIGN PROPOSAL mockup for "Sumaiya", an AI career assistant for a first-time jobseeker in Tanzania on a cheap Android phone (1-3GB RAM) with expensive metered mobile data. Swahili-first.

Judge ONLY the actual pixels. Be specific and blunt. Do not praise.

Answer these, numbered:
1. HIERARCHY: What does the eye hit first, second, third? Is that the right order for this user?
2. SPACING/DENSITY: Any inconsistent gaps, cramped areas, or wasted vertical space? On an 844px-tall screen, what is pushed below the fold that should not be?
3. RENDERING DEFECTS: Any invisible/blank card, clipped text, overlapping elements, misaligned baselines, a widow (single word on its own line), or an element that looks unstyled?
4. CONTRAST: Any text that looks too low contrast against its background?
5. FINISHED OR WIREFRAME? Does it read as a finished design proposal or a wireframe? One sentence.
6. THE ONE THING TO FIX FIRST.
7. Would a first-time jobseeker who has never used a CV app understand what to do on this screen? What would they miss?

Keep it under 350 words. No preamble."""


def key():
    for line in ENV.read_text(encoding="utf-8", errors="replace").splitlines():
        if line.startswith("OPENROUTER_API_KEY="):
            return line.split("=", 1)[1].strip()
    raise SystemExit("no OPENROUTER_API_KEY in research.env")


def b64(path, width=480, q=80):
    """Phone-width JPEG — the judgement needs layout and hierarchy, not retina."""
    im = Image.open(path).convert("RGB")
    if im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, "JPEG", quality=q, optimize=True)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()


def ask(k, model, data_url, note="", attempts=1):
    body = json.dumps({
        "model": model, "max_tokens": 1000, "temperature": 0.3,
        "messages": [{"role": "user", "content": [
            {"type": "text", "text": PROMPT + (("\n\nCONTEXT: " + note) if note else "")},
            {"type": "image_url", "image_url": {"url": data_url}},
        ]}],
    }).encode("utf-8")
    req = urllib.request.Request(
        "https://openrouter.ai/api/v1/chat/completions", data=body,
        headers={"Authorization": "Bearer " + k, "Content-Type": "application/json"})
    for a in range(attempts):
        try:
            with urllib.request.urlopen(req, timeout=200) as r:
                j = json.loads(r.read().decode("utf-8", "replace"))
            if j.get("choices"):
                return j["choices"][0]["message"].get("content", ""), None
            return None, json.dumps(j.get("error", j))[:220]
        except urllib.error.HTTPError as e:
            detail = e.read().decode("utf-8", "replace")[:220]
            if e.code in (429, 502, 503) and a + 1 < attempts:
                time.sleep(7 + random.random() * 8)
                continue
            return None, f"HTTP {e.code} {detail}"
        except Exception as e:  # noqa: BLE001
            if a + 1 < attempts:
                time.sleep(5)
                continue
            return None, f"{type(e).__name__}: {e}"
    return None, "exhausted"


FRAMES = [
    ("01-home-frame1", "BEFORE: this is Sumaiya's home screen as it exists TODAY on Android."),
    ("01-home-frame2", "AFTER: this is the PROPOSED home screen."),
    ("02-cv-editor-frame1", "AFTER: proposed CV editor (a document editor on a small phone)."),
    ("03-jobs-feed-frame1", "AFTER: proposed jobs feed (a list with real data)."),
    ("04-profile-frame1", "AFTER: proposed profile screen."),
    ("05-empty-loading-error-frame2", "AFTER: proposed EMPTY state (no CVs yet)."),
    ("05-empty-loading-error-frame3", "AFTER: proposed ERROR state (load failed)."),
    ("06-chat-frame1", "AFTER: proposed AI chat surface."),
]

if __name__ == "__main__":
    k = key()
    only = sys.argv[1] if len(sys.argv) > 1 else ""
    log = OUT / "verdicts.jsonl"
    done = set()
    if log.exists():
        for line in log.read_text(encoding="utf-8").splitlines():
            try:
                r = json.loads(line)
                done.add((r["frame"], r["model"]))
            except Exception:
                pass
    for name, note in FRAMES:
        p = PNG / f"{name}.png"
        if not p.exists() or (only and only not in name):
            continue
        if any(f == name for f, _ in done):
            print(f"SKIP {name} (already judged)")
            continue
        du = b64(p)
        for m in MODELS:
            txt, err = ask(k, m, du, note)
            if txt:
                with log.open("a", encoding="utf-8") as fh:
                    fh.write(json.dumps({"frame": name, "model": m, "verdict": txt},
                                        ensure_ascii=False) + "\n")
                print(f"OK   {name}  <- {m}  ({len(txt)} chars)", flush=True)
                break
            print(f"FAIL {name}  <- {m}: {err}", flush=True)
            time.sleep(2 + random.random() * 3)
        else:
            print(f"!!! no verdict for {name}", flush=True)
    print("done")
