#!/usr/bin/env python3
"""free-panel — send refinement work to OpenRouter :free models, read back only a digest.

WHY THIS EXISTS (owner's rule, 2026-09-21): *"you will keep sending free models for
refinements dont burn tokens yourself"*. Judgement and polish passes are bulk work — they
belong on :free models. The trap is that a panel reply is 1-2k tokens each, and reading
four of them costs more than the panel saved. So every model is REQUIRED to lead with a
machine-readable verdict, and this script prints only those lines. The full replies are
written next to them for when a claim needs checking.

Usage:
  python scripts/free-panel.py --payload path/to/thing.md \
      --ask "Should the legibility floor be wired into the 47 templates or deleted?" \
      [--roles 3] [--task copy|code|design|research] [--out docs/panels]

Payload may be a file, a directory (files are concatenated with headers), or "-" for stdin.
Reads OPENROUTER_API_KEY from the environment or from the repo's env store.

WHAT IT WILL NOT DO: print a secret; write anywhere outside --out; take the models' word
for anything (a verdict is an opinion and is labelled as one in the digest).
"""
import argparse
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime
from pathlib import Path

# Which :free models actually answered on 2026-09-21, and which did not — this list is
# ordered by observed reliability, not prestige, because a panel that fails silently is
# worse than no panel.
FREE_MODELS = [
    "nvidia/nemotron-3-ultra-550b-a55b:free",      # answered, strong, 1M ctx
    "inclusionai/ling-3.0-flash-vl:free",          # answered
    "inclusionai/ling-3.0-flash-fin:free",         # answered
    "poolside/laguna-s-2.1:free",                  # answered
    "nex-agi/nex-n2.5-mini:free",                  # flaky
    "google/gemma-4-26b-a4b-it:free",              # 429 in practice
    # NOT usable: thinkingmachines/*:free is 403 ("only available on agentic harnesses"),
    # qwen/qwen3.8-27b:free was 429 upstream on every attempt.
]

ROLE_FRAMES = {
    "design": [
        "a product designer who judges legibility and hierarchy on cheap Android screens",
        "a typographer who cares about type scale and reading comfort",
    ],
    "copy": [
        "a copy editor whose first language is Swahili (Tanzania) and who is ruthless about ambiguity",
        "a reader on a cheap phone who is tired, half-reading, and reads Swahili as a second language",
    ],
    "code": [
        "a senior engineer reviewing for correctness and hidden failure modes",
        "an engineer who has maintained this exact kind of code and knows what breaks in six months",
    ],
    "research": [
        "an analyst who weighs evidence quality before conclusions",
        "a sceptic paid to find what the evidence does not support",
    ],
}

FORMAT_RULES = """Answer in EXACTLY this shape, nothing before VERDICT:

VERDICT: <one sentence, your ruling>
WHY: <at most 3 short bullets>
ACTION: <at most 3 imperative next steps, one per line, each starting with ACTION: >
RISK: <the one thing that would make your ruling wrong>
DOUBT: <what you could not judge from the material given>

No preamble, no restating the question, no apologies. If the material is insufficient, say so
in DOUBT and still give a VERDICT."""


def read_payload(p: str) -> str:
    if p == "-":
        return sys.stdin.read()
    path = Path(p)
    if path.is_dir():
        parts = []
        for f in sorted(path.rglob("*")):
            if f.is_file() and f.suffix in {".md", ".ts", ".tsx", ".py", ".sql", ".json", ".txt"}:
                parts.append(f"\n\n===== {f.as_posix()} =====\n{f.read_text(encoding='utf-8', errors='ignore')}")
        return "".join(parts)
    return path.read_text(encoding="utf-8", errors="ignore")


def api_key() -> str:
    k = os.environ.get("OPENROUTER_API_KEY")
    if k:
        return k
    for cand in (
        Path.home() / "projects/_hdd-data/env/research.env",
        Path("/c/Users/hamis/projects/_hdd-data/env/research.env"),
    ):
        if cand.exists():
            for line in cand.read_text(encoding="utf-8", errors="ignore").splitlines():
                if line.startswith("OPENROUTER_API_KEY="):
                    return line.split("=", 1)[1].strip().strip('"').strip("'")
    sys.exit("  no OPENROUTER_API_KEY (env or the repo env store)")


def ask(model: str, prompt: str, key: str, timeout: int = 180):
    body = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 1200,
        "temperature": 0.6,
    }
    req = urllib.request.Request(
        "https://openrouter.ai/api/v1/chat/completions",
        data=json.dumps(body).encode("utf-8"),
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            d = json.load(r)
    except urllib.error.HTTPError as e:
        return None, f"HTTP {e.code}"
    except Exception as e:
        return None, type(e).__name__
    msg = (d.get("choices") or [{}])[0].get("message", {}).get("content")
    if not msg:
        return None, str((d.get("error") or {}).get("code") or "empty")
    return msg.strip(), None


def digest_line(text: str, label: str) -> str:
    """One line per answer: the verdict, or the first thing that looks like one."""
    for line in text.splitlines():
        s = line.strip()
        if s.upper().startswith("VERDICT:"):
            return f"{label}  {s[8:].strip()}"
    return f"{label}  (no VERDICT — first line: {text.splitlines()[0][:100] if text else 'EMPTY'})"


def actions(text: str, limit: int = 3) -> list:
    out = []
    for line in text.splitlines():
        s = line.strip()
        if s.upper().startswith("ACTION:"):
            out.append(s[7:].strip())
        if len(out) >= limit:
            break
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--payload", required=True, help="file, directory, or - for stdin")
    ap.add_argument("--ask", required=True, help="the question the panel answers")
    ap.add_argument("--roles", type=int, default=2)
    ap.add_argument("--task", default="design", choices=sorted(ROLE_FRAMES))
    ap.add_argument("--out", default="docs/panels")
    ap.add_argument("--max-chars", type=int, default=40000, help="payload cap, keeps the call cheap")
    args = ap.parse_args()

    payload = read_payload(args.payload)
    if len(payload) > args.max_chars:
        payload = payload[: args.max_chars] + "\n\n[…payload truncated…]"

    key = api_key()
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    outdir = Path(args.out) / stamp
    outdir.mkdir(parents=True, exist_ok=True)

    frames = ROLE_FRAMES[args.task]
    jobs = []
    for i in range(args.roles):
        model = FREE_MODELS[i % len(FREE_MODELS)]
        jobs.append((i + 1, frames[i % len(frames)], model))

    prompt_base = (
        f"{payload}\n\n---\n\nQUESTION: {args.ask}\n\nYOUR ROLE: "
    )
    results = []
    for n, role, model in jobs:
        prompt = prompt_base + role + "\n\n" + FORMAT_RULES
        text, err = ask(model, prompt, key)
        # one rotation attempt on failure: :free models flake, and a silent gap is worse
        if err:
            for alt in FREE_MODELS:
                if alt == model:
                    continue
                text, err = ask(alt, prompt, key)
                if not err:
                    model = alt + " (rotated)"
                    break
                time.sleep(1)
        if text:
            (outdir / f"role{n}.md").write_text(f"# role {n}\nmodel: {model}\nrole: {role}\n\n{text}\n", encoding="utf-8")
            results.append((n, model, role, text, None))
        else:
            results.append((n, model, role, "", err))
        (outdir / f"role{n}.prompt.txt").write_text(prompt, encoding="utf-8")

    (outdir / "digest.md").write_text(
        f"# free-panel {stamp}\n\nQUESTION: {args.ask}\nTASK: {args.task}  ROLES: {args.roles}\n\n"
        + "\n".join(digest_line(t, f"[{n} {m}]") for n, m, _, t, e in results if t)
        + "\n\n--- actions ---\n"
        + "\n".join("- " + a for n, _, _, t, _ in results if t for a in actions(t))
        + "\n",
        encoding="utf-8",
    )

    # ---- the only thing that reaches the parent's context ----
    print(f"free-panel {stamp}  ({args.task}, {args.roles} roles)  -> {outdir}")
    print(f"QUESTION: {args.ask}")
    print()
    for n, model, role, text, err in results:
        if err:
            print(f"  [{n}] {model} — FAILED ({err})")
        else:
            print("  " + digest_line(text, f"[{n} {model.split('/')[-1][:28]}]"))
    allact = [a for _, _, _, t, _ in results if t for a in actions(t)]
    if allact:
        print("\n  suggested actions (unverified — opinions, not findings):")
        for a in allact[:6]:
            print("   -", a[:150])
    print(f"\n  full replies: {outdir}/role*.md (read them only to check a claim)")


if __name__ == "__main__":
    main()
