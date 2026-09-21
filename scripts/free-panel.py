#!/usr/bin/env python3
"""free-panel — send refinement work to OpenRouter :free models, read back only a digest.

Owner's rules (2026-09-21): *"you will keep sending free models for refinements dont burn
tokens yourself"* and *"more auto send two at a time free style scope"*.

So this harness:
  * dispatches TWO calls at a time by default (real concurrency, not a queue of one),
  * supports a free answer STYLE beside the terse digest style,
  * is SCOPED — --scope picks researched roles and the frame, so a panel is aimed,
  * runs AUTOMATICALLY over many targets (--auto <path>) with one compact digest.

The parent only ever reads the digest; full replies are written under --out and opened
only to check a specific claim.

  python scripts/free-panel.py --payload a.md --scope design --ask "..." --concurrency 2
  python scripts/free-panel.py --payload a.md --scope code   --ask "..." --style free
  python scripts/free-panel.py --auto apps/native/src/lib --scope copy --ask "..."

WHAT IT WILL NOT DO: print a secret; write outside --out; treat a verdict as a finding.
"""
import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from pathlib import Path

# Observed reliability on 2026-09-21, not prestige. thinkingmachines/*:free is 403
# ("only available on agentic harnesses") and qwen 429s upstream, so neither is listed.
FREE_MODELS = [
    "nvidia/nemotron-3-ultra-550b-a55b:free",      # answered, strongest, 1M ctx — workhorse
    "inclusionai/ling-3.0-flash-vl:free",          # answered
    "inclusionai/ling-3.0-flash-fin:free",         # answered
    "poolside/laguna-s-2.1:free",                  # answered
    "nex-agi/nex-n2.5-mini:free",                  # flaky — empty content under a 200
    "google/gemma-4-26b-a4b-it:free",              # 429 in practice
]

# A SCOPE names the roles AND the frame, so "--scope copy" is a researched panel rather
# than two strangers handed the same question.
SCOPES = {
    "copy": {
        "roles": [
            "a copy editor whose first language is Swahili (Tanzania), ruthless about ambiguity",
            "a tired reader on a cheap phone who reads Swahili as a second language",
            "a translator who knows when a calque has replaced meaning with word-for-word",
        ],
        "frame": "Judge the WORDING: what is ambiguous, what reads wrong, what a non-native would "
                 "have to reread. Quote the exact string you object to.",
    },
    "design": {
        "roles": [
            "a product designer judging legibility and hierarchy on cheap Android screens",
            "a typographer judging type scale and reading comfort",
            "a first-time user deciding in ten seconds whether this is for them",
        ],
        "frame": "Judge what a person SEES and understands, in order, at a 360-412px width.",
    },
    "code": {
        "roles": [
            "a senior engineer reviewing for correctness and hidden failure modes",
            "an engineer who maintained this kind of code and knows what breaks in six months",
            "a security reviewer looking for what an untrusted caller can do",
        ],
        "frame": "Judge CORRECTNESS and failure modes. Name the input that breaks it.",
    },
    "research": {
        "roles": [
            "an analyst who weighs evidence quality before conclusions",
            "a sceptic paid to find what the evidence does NOT support",
            "a domain operator with ten years in this market",
        ],
        "frame": "Judge whether the EVIDENCE supports the conclusion. Separate what is measured "
                 "from what is asserted.",
    },
    "product": {
        "roles": [
            "a product strategist who has launched consumer products in East Africa",
            "a user who is unemployed and applying for their first formal job",
            "someone who has watched many products fail by building features instead of outcomes",
        ],
        "frame": "Judge whether this is the thing a user actually needs, and what it should drop.",
    },
}

DIGEST_RULES = """Answer in EXACTLY this shape, nothing before VERDICT:

VERDICT: <one sentence, your ruling>
WHY: <at most 3 short bullets>
ACTION: <at most 3 imperative next steps, one per line, each starting with ACTION: >
RISK: <the one thing that would make your ruling wrong>
DOUBT: <what you could not judge from the material given>

No preamble, no restating the question, no apologies. If the material is insufficient, say so
in DOUBT and still give a VERDICT."""

FREE_RULES = """Answer freely and directly, in your own structure and your own voice. Say what
you actually think, including anything the question did not ask about. Be specific and concrete.
Skip preamble and restating. At most 450 words."""


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


def ask(model: str, prompt: str, key: str, timeout: int = 200):
    body = {"model": model, "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 1200, "temperature": 0.6}
    req = urllib.request.Request(
        "https://openrouter.ai/api/v1/chat/completions",
        data=json.dumps(body).encode("utf-8"),
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
        method="POST")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            d = json.load(r)
    except urllib.error.HTTPError as e:
        return None, f"HTTP {e.code}"
    except Exception as e:
        return None, type(e).__name__
    msg = (d.get("choices") or [{}])[0].get("message", {}).get("content")
    if not msg:
        # HTTP 200 with empty content is a FAILURE, not a pass. nex-agi does exactly this.
        return None, str((d.get("error") or {}).get("code") or "empty-200")
    return msg.strip(), None


def ask_with_rotation(model: str, prompt: str, key: str, tried: set):
    text, err = ask(model, prompt, key)
    if not err:
        return model, text, None
    tried.add(model)
    for alt in FREE_MODELS:
        if alt in tried:
            continue
        text, err = ask(alt, prompt, key)
        if not err:
            # label the substitution, so a swapped model is never read as the asked-for one
            return f"{alt} (rotated from {model.split('/')[-1]})", text, None
        tried.add(alt)
    return model, None, err


def verdict_line(text: str, label: str) -> str:
    """One line per answer: the verdict, or the first thing that stands in for one."""
    for line in text.splitlines():
        s = line.strip()
        if s.upper().startswith("VERDICT:"):
            return f"{label}  {s[8:].strip()}"
    return f"{label}  {' '.join(text.split())[:130]}"


def actions(text: str, limit: int = 3):
    out = []
    for line in text.splitlines():
        s = line.strip()
        if s.upper().startswith("ACTION:"):
            out.append(s[7:].strip())
            if len(out) >= limit:
                break
    return out


def run_one(target: str, payload: str, args, key: str, outdir: Path):
    spec = SCOPES[args.scope]
    rules = DIGEST_RULES if args.style == "digest" else FREE_RULES
    if len(payload) > args.max_chars:
        payload = payload[: args.max_chars] + "\n\n[…payload truncated…]"

    jobs = [(i + 1, spec["roles"][i % len(spec["roles"])], FREE_MODELS[i % len(FREE_MODELS)])
            for i in range(args.roles)]
    base = (f"{payload}\n\n---\n\nSCOPE: {args.scope}\nQUESTION: {args.ask}\n\n"
            f"{spec['frame']}\n\nYOUR ROLE: ")

    tried = set()

    def work(job):
        n, role, model = job
        prompt = base + role + "\n\n" + rules
        m, text, err = ask_with_rotation(model, prompt, key, tried)
        return n, role, m, text, err, prompt

    # ── two at a time, by default ──
    with ThreadPoolExecutor(max_workers=max(1, args.concurrency)) as pool:
        results = list(pool.map(work, jobs))

    safe = "".join(c if c.isalnum() or c in "-_." else "_" for c in target)[:60] or "panel"
    for n, role, model, text, err, prompt in results:
        if text:
            (outdir / f"{safe}.role{n}.md").write_text(
                f"# {target} — role {n}\nmodel: {model}\nrole: {role}\n\n{text}\n", encoding="utf-8")
        (outdir / f"{safe}.role{n}.prompt.txt").write_text(prompt, encoding="utf-8")
    return results


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--payload", help="file, directory, or - for stdin")
    ap.add_argument("--auto", help="run the panel automatically over every file under this path")
    ap.add_argument("--ask", required=True)
    ap.add_argument("--scope", default="design", choices=sorted(SCOPES))
    ap.add_argument("--style", default="digest", choices=["digest", "free"])
    ap.add_argument("--roles", type=int, default=2)
    ap.add_argument("--concurrency", type=int, default=2, help="calls in flight (default 2)")
    ap.add_argument("--limit", type=int, default=8, help="max targets in --auto mode")
    ap.add_argument("--out", default="docs/panels")
    ap.add_argument("--max-chars", type=int, default=40000)
    args = ap.parse_args()

    if not args.payload and not args.auto:
        sys.exit("  give --payload or --auto")

    key = api_key()
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    outdir = Path(args.out) / stamp
    outdir.mkdir(parents=True, exist_ok=True)

    if args.auto:
        root = Path(args.auto)
        files = [root] if root.is_file() else [
            f for f in sorted(root.rglob("*"))
            if f.is_file() and f.suffix in {".md", ".ts", ".tsx", ".py", ".sql", ".json", ".txt"}
            and ".test." not in f.name and ".spec." not in f.name
        ]
        targets = [(str(f), f.read_text(encoding="utf-8", errors="ignore")) for f in files[: args.limit]]
    else:
        targets = [(args.payload, read_payload(args.payload))]

    print(f"free-panel {stamp}  scope={args.scope}  style={args.style}  roles={args.roles}  "
          f"concurrency={args.concurrency}  targets={len(targets)}  -> {outdir}")
    print(f"QUESTION: {args.ask}\n")

    digest = [f"# free-panel {stamp}", f"scope={args.scope} style={args.style}",
              f"QUESTION: {args.ask}", ""]
    for target, payload in targets:
        results = run_one(target, payload, args, key, outdir)
        print(f"  ── {target}")
        for n, role, model, text, err, _prompt in results:
            if err:
                line = f"[{n}] FAILED ({err})"
            else:
                line = verdict_line(text, f"[{n} {model.split('/')[-1][:26]}]")
            print("    " + line)
            digest.append(f"- {target}  {line}")
            if text and args.style == "digest":
                for a in actions(text):
                    digest.append(f"    ACTION: {a}")
        acts = [a for _, _, _, t, _, _ in results if t for a in actions(t)]
        if acts and args.style == "digest":
            print("    actions:")
            for a in acts[:3]:
                print("     -", a[:140])
        print()

    (outdir / "digest.md").write_text("\n".join(digest) + "\n", encoding="utf-8")
    print(f"  full replies: {outdir}/*.role*.md (open one only to check a claim)")


if __name__ == "__main__":
    main()
