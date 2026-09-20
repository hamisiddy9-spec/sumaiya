#!/usr/bin/env python
"""Judge the REAL DEVICE renders with free vision models.

Same runtime-only key discipline: read from research.env, sent over the socket,
never printed, never committed. :free models only.
"""
import base64, io, json, pathlib, random, sys, time, urllib.error, urllib.request
from PIL import Image

HERE = pathlib.Path(__file__).parent
DEV = HERE / "_device"
OUT = HERE / "_vision"
OUT.mkdir(exist_ok=True)
ENV = pathlib.Path(r"C:\Users\hamis\projects\_hdd-data\env\research.env")

MODELS = [
    "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
    "inclusionai/ling-3.0-flash-vl:free",
    "google/gemma-4-26b-a4b-it:free",
    "nex-agi/nex-n2.5-pro:free",
    "dots-studio/dots-3-note-preview:free",
]

PROMPT = """This is a REAL Android phone screen: 1344x2992 pixels, display density 408 (about 2.55 px per dp), dark mode, real system status bar and real bottom navigation. It is "Sumaiya", an AI career assistant for a first-time jobseeker in Tanzania on a cheap Android phone with expensive metered mobile data. Swahili-first.

Judge the actual pixels. Be specific and blunt. No praise. Answer numbered:

1. FOLD: At this height, what sits above the first screen of content and what is pushed below? Is the primary action above or below the fold?
2. CHROME COST: The status bar and the bottom tab bar together occupy how much of the screen? Does that cost the design anything?
3. DENSITY: Name any region that is large and nearly empty, and say roughly what fraction of the screen it wastes.
4. LEGIBILITY: Text rendered at this density - is anything too small, too dim, or too crowded to read comfortably one-handed in daylight?
5. DEFECTS: Anything unfinished, broken, misaligned, or visibly wrong. If a name, label or number looks like a placeholder, an internal value, or a machine default rather than a human word, say so and quote it exactly.
6. ONE FIX FIRST.
7. Would a first-time jobseeker in Tanzania know what to do on this screen within five seconds? What would they miss?

Under 350 words, numbered, no preamble."""

FRAMES = {
    "device-tab-Nyumbani": "This is the HOME screen (Nyumbani tab).",
    "device-tab-CVzangu": "This is the CV LIST screen (CV zangu tab).",
    "device-tab-Sumaiya": "This is the AI CHAT screen (Sumaiya tab).",
    "device-tab-Wasifu": "This is the PROFILE screen (Wasifu tab).",
    "device-06-tailor": "This is the JOB-TAILORING screen (Omba kwa ujanja).",
    "device-01-launch": "This is the app immediately after cold start.",
}


def key():
    for line in ENV.read_text(encoding="utf-8", errors="replace").splitlines():
        if line.startswith("OPENROUTER_API_KEY="):
            return line.split("=", 1)[1].strip()
    raise SystemExit("no key")


def b64(path, width=520, q=80):
    im = Image.open(path).convert("RGB")
    if im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, "JPEG", quality=q, optimize=True)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()


def ask(k, model, data_url, note):
    body = json.dumps({
        "model": model, "max_tokens": 1000, "temperature": 0.3,
        "messages": [{"role": "user", "content": [
            {"type": "text", "text": PROMPT + "\n\nCONTEXT: " + note},
            {"type": "image_url", "image_url": {"url": data_url}},
        ]}],
    }).encode("utf-8")
    req = urllib.request.Request(
        "https://openrouter.ai/api/v1/chat/completions", data=body,
        headers={"Authorization": "Bearer " + k, "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=200) as r:
            j = json.loads(r.read().decode("utf-8", "replace"))
        if j.get("choices"):
            return j["choices"][0]["message"].get("content", ""), None
        return None, json.dumps(j.get("error", j))[:200]
    except urllib.error.HTTPError as e:
        return None, f"HTTP {e.code} {e.read().decode('utf-8','replace')[:180]}"
    except Exception as e:  # noqa: BLE001
        return None, f"{type(e).__name__}: {e}"


if __name__ == "__main__":
    k = key()
    log = OUT / "device-verdicts.jsonl"
    done = set()
    if log.exists():
        for line in log.read_text(encoding="utf-8").splitlines():
            try:
                r = json.loads(line)
                done.add(r["frame"])
            except Exception:
                pass
    for name, note in FRAMES.items():
        if name in done:
            print("SKIP", name, flush=True)
            continue
        p = DEV / f"{name}.png"
        if not p.exists():
            print("MISSING", name, flush=True)
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
            print("!!! no verdict for", name, flush=True)
    print("done")
