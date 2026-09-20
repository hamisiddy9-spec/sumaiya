#!/usr/bin/env python3
"""OpenRouter free-model research passes for the Sumaiya rebrand brief.

Rules enforced here:
  * EVERY model id must end in ':free' (the account has no spend cap, so a
    non-:free id would bill the owner real money). Asserted, not assumed.
  * Rotate to a different model on 429/error instead of hammering one.
  * Record WHICH model produced WHICH finding.
  * The key is read at runtime from research.env and never printed or written
    into any output file.
  * The payload goes over the socket, never on the command line (Windows
    argv limit ~32K, WinError 206).

Research only: never referenced by product code.
"""
import base64, json, os, re, sys, time, urllib.error, urllib.request

ENV = r"C:\Users\hamis\projects\_hdd-data\env\research.env"
OUT = r"C:\Users\hamis\projects\sumaiya\docs\research\rebrand-2026-09-20"
API = "https://openrouter.ai/api/v1/chat/completions"


def load_key() -> str:
    with open(ENV, encoding="utf-8", errors="replace") as fh:
        for line in fh:
            m = re.match(r"^OPENROUTER_API_KEY=(.+)$", line.strip())
            if m:
                return m.group(1).strip().strip('"').strip("'")
    sys.exit("no OPENROUTER_API_KEY in research.env")


KEY = load_key()


def call(model: str, messages: list, max_tokens: int = 3000, temperature: float = 0.4,
         retries: int = 2) -> tuple[str | None, str]:
    """Return (content, note). content is None on failure."""
    assert model.endswith(":free"), f"REFUSING non-free model id: {model}"
    payload = json.dumps({
        "model": model, "messages": messages,
        "max_tokens": max_tokens, "temperature": temperature,
    }).encode("utf-8")
    last = ""
    for attempt in range(retries + 1):
        req = urllib.request.Request(
            API, data=payload,
            headers={"Authorization": f"Bearer {KEY}", "Content-Type": "application/json",
                     "HTTP-Referer": "https://sumaiya.app", "X-Title": "Sumaiya rebrand research"},
        )
        try:
            with urllib.request.urlopen(req, timeout=240) as r:
                d = json.loads(r.read().decode("utf-8", "replace"))
            txt = (d.get("choices") or [{}])[0].get("message", {}).get("content") or ""
            if txt.strip():
                return txt, f"ok attempt{attempt+1}"
            last = "empty content"
        except urllib.error.HTTPError as e:
            last = f"HTTP {e.code}: {e.read()[:300].decode('utf-8','replace')}"
        except Exception as e:  # noqa: BLE001
            last = f"{type(e).__name__}: {e}"
        time.sleep(3 + attempt * 5)
    return None, last


TEXT_MODELS = ["nvidia/nemotron-3-ultra-550b-a55b:free", "thinkingmachines/inkling:free",
               "z-ai/glm-5.2:free", "google/gemma-4-31b-it:free",
               "nex-agi/nex-n2.5-pro:free", "inclusionai/ling-3.0-flash-vl:free"]

VISION_MODELS = ["inclusionai/ling-3.0-flash-vl:free", "google/gemma-4-31b-it:free",
                 "nex-agi/nex-n2.5-pro:free", "google/gemma-4-26b-a4b-it:free",
                 "thinkingmachines/inkling:free", "dots-studio/dots-3-note-preview:free",
                 "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free"]


def run_text(name, prompt, models, out_file, max_tokens=3500):
    msgs = [{"role": "user", "content": prompt}]
    for m in models:
        print(f"[{name}] trying {m}", flush=True)
        txt, note = call(m, msgs, max_tokens=max_tokens)
        if txt:
            hdr = (f"<!-- PRODUCED BY: {m} (OpenRouter free tier) -->\n"
                   f"<!-- Claude CLI was session-limited at 01:40 EAT; this pass ran on OpenRouter. -->\n\n")
            p = os.path.join(OUT, out_file)
            with open(p, "w", encoding="utf-8", newline="\n") as fh:
                fh.write(hdr + txt)
            print(f"[{name}] OK {m} bytes={len(txt)} -> {out_file}", flush=True)
            return m
        print(f"[{name}] {m} failed: {note}", flush=True)
    with open(os.path.join(OUT, name + ".FAILED"), "w") as fh:
        fh.write("all models failed\n")
    return None


def run_vision(name, prompt, image_path, models, out_file, max_tokens=2500):
    b64 = base64.b64encode(open(image_path, "rb").read()).decode()
    msgs = [{"role": "user", "content": [
        {"type": "text", "text": prompt},
        {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64}"}},
    ]}]
    for m in models:
        print(f"[{name}] trying {m}", flush=True)
        txt, note = call(m, msgs, max_tokens=max_tokens)
        if txt:
            hdr = (f"<!-- PRODUCED BY: {m} (OpenRouter free tier, VISION) -->\n"
                   f"<!-- Image: the live https://sumaiya.app/og-image.png, 1200x630, fetched 2026-09-20 -->\n\n")
            with open(os.path.join(OUT, out_file), "w", encoding="utf-8", newline="\n") as fh:
                fh.write(hdr + txt)
            print(f"[{name}] OK {m} bytes={len(txt)} -> {out_file}", flush=True)
            return m
        print(f"[{name}] {m} failed: {note}", flush=True)
    with open(os.path.join(OUT, name + ".FAILED"), "w") as fh:
        fh.write("all vision models failed\n")
    return None
