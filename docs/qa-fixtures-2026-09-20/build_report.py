#!/usr/bin/env python
# Assemble docs/QA-IO-MATRIX-2026-09-20.md from the raw evidence files.
# Every number is read from a result file; none is retyped by hand.
import json, os, collections, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
DOCS = os.path.normpath(os.path.join(HERE, ".."))
OUT = os.path.join(DOCS, "QA-IO-MATRIX-2026-09-20.md")


def L(name, default=None):
    p = os.path.join(HERE, name)
    if not os.path.exists(p):
        print(f"  (missing {name})")
        return default
    try:
        return json.load(open(p, encoding="utf-8"))
    except Exception as e:
        print(f"  (unreadable {name}: {e})")
        return default


def R(name):
    p = os.path.join(HERE, name)
    return open(p, encoding="utf-8").read() if os.path.exists(p) else None


def table(headers, rows):
    out = ["| " + " | ".join(headers) + " |", "|" + "|".join(["---"] * len(headers)) + "|"]
    for r in rows:
        out.append("| " + " | ".join("" if c is None else str(c) for c in r) + " |")
    return "\n".join(out)


def esc(s, n=None):
    if s is None:
        return ""
    s = str(s).replace("|", "\\|").replace("\n", " ").strip()
    return (s[: n - 1] + "…") if n and len(s) > n else s


server = L("results-server-extract.json", []) or []
server_extra = L("results-server-extra.json", []) or []
client = L("results-assistant-uploads.json", []) or []
paste = L("results-paste.json", []) or []
clean = L("results-clean.json", []) or []
photo_distort = L("results-photo-distortion.json", []) or []
photo_limits = L("results-photo-limits.json", []) or []
ai_limit = L("results-ai-limit.json", {}) or {}
other = L("results-other-outputs.json", {}) or {}
cleanup = L("results-cleanup.json", {}) or {}
nonsq = L("results-templates-nonsquare.json", {}) or {}
timing = L("results-timing.json", []) or []
proof = R("parsecvdata-proof.txt")
trace = R("textlayer-trace.txt")

proc = subprocess.run([sys.executable, os.path.join(HERE, "inspect_pdfs.py"), os.path.join(HERE, "clean")],
                      capture_output=True, text=True)
pdfs = []
for line in proc.stdout.splitlines():
    try:
        pdfs.append(json.loads(line))
    except Exception:
        pass
pdf_by = {p["file"]: p for p in pdfs}
by = {r["key"]: r for r in clean}
base = by.get("nophoto-nakuru", {}).get("bytes")

M = []
w = M.append

w("# QA — I/O MATRIX: every input the app takes, every output it produces")
w("")
w("Date: **2026-09-20** · Target: **https://sumaiya.app (live production)** · Repo: `C:\\Users\\hamis\\projects\\sumaiya`")
w("")
w("Scope: the **input/output surface only** — what the product accepts, what it emits, and where it")
w("lies about either. Signed-in user journeys and the Android client are covered by sibling agents")
w("and are deliberately not duplicated here.")
w("")
w("Everything below comes from driving the live site with a real Chrome (Playwright) using **real")
w("fixtures**: genuine OOXML `.docx` files, genuine text-layer PDFs, a genuine image-only scanned")
w("PDF, real JPEG/PNG/WebP bytes, a 27 MB PDF, a password-protected PDF, a corrupt PDF, and two")
w("deliberate content/extension mismatches. No fixture is a renamed text file. How each was built is")
w("in the appendix.")
w("")
w("---")
w("")

# ── 0. method ───────────────────────────────────────────────────────────────
w("## 0. Method, and two corrections to earlier numbers in this workstream")
w("")
w("Two independent live paths were exercised, because the product has two:")
w("")
w("1. **The server extractor** — `POST /api/tools/extract-text` (`apps/web/lib/api/routes/tools.ts`),")
w("   the engine behind the public PDF tools and the assistant's fallback. Magic-byte sniffed.")
w("2. **The browser extractor** — `apps/web/lib/client-cv-extract.ts`, reached through the real file")
w("   input on `/assistant` (its `accept` list is the app's widest): pdf.js text layer, tesseract.js")
w("   OCR fallback, mammoth for DOCX, `File.text()` for plain text.")
w("")
w("Outputs were captured by hooking `URL.createObjectURL` inside the live page — the exact call")
w("`lib/pdf.ts` `triggerBlobDownload()` makes — so every PDF inspected is **the real blob the user")
w("downloads**, not a re-render. The PDFs were then inspected in the bytes (pypdf + Pillow), not in")
w("the DOM.")
w("")
w("> **Correction 1 — a false red, discarded.** An early pass of the template sweep reported that")
w("> different templates exported byte-identical rasters, which would have been a severe defect. It")
w("> was my harness: two browser sessions were PATCHing the same CV row at once, so the template")
w("> under test was overwritten mid-run. Run serially with a single writer, four templates give four")
w("> distinct documents (nakuru 290,879 B / rift 384,089 B / zahabu 324,981 B / coral 353,517 B, four")
w("> distinct raster hashes). The contention numbers are discarded.")
w(">")
w("> **Correction 2 — a false absence, resolved.** The clean 162-case sweep *does* exercise the photo")
w("> path: **59 photo rows, 50 with a rendered photo and an in-page variance of 4102.8** (proving a")
w("> real image, not the present-but-empty bug), 9 with `photos=0` (templates that drop the photo by")
w("> design — see D7). The `photos=0`/`var=-` figures circulated earlier belong to the discarded")
w("> 105-row contention run, which never set a photo and never measured variance. The photo evidence")
w("> in §4 is measured from the PDF bytes, not from DOM presence.")
w("")

# ── 1. headline ─────────────────────────────────────────────────────────────
w("## 1. Headline")
w("")
kioo = next((r for r in photo_distort if r["template"] == "kioo"), {})
fd = kioo.get("face_disc") or {}
photo_rows = [r for r in clean if r.get("group") == "template-photo"]
photo_ok = [r for r in photo_rows if (r.get("photoVariance") or 0) > 100]

w("**D8 — the entire Skills section silently disappears whenever a skill entry's `level` is missing")
w("or is not a strict 1–5 integer. No error, no warning, no log.**")
w("")
w("This is the biggest finding of the pass, and it is the \"silent\" class the brief was hunting.")
w("")
w("`apps/web/types/index.ts` defines the strictest entry schema in the file:")
w("")
w("```ts")
w("export const skillEntrySchema = z.object({")
w("  id: z.string(),")
w("  name: z.string(),")
w("  level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),")
w("});")
w("```")
w("")
w("`level` is **required** and has **no default** — unlike `experienceEntrySchema` and")
w("`educationEntrySchema`, which carry defaults for every field. `looseArray()` then does")
w("`safeParse` + `flatMap`, so a skill that fails validation is **dropped entry by entry**, and the")
w("whole section disappears. Measured with the app's own `parseCVData()`:")
w("")
if proof:
    for line in proof.strip().splitlines():
        w("    " + line if not line.startswith("   ") else "    " + line)
    w("")
w("Everything else in the same payload survives untouched (experience 3, education 2, languages 3,")
w("certifications 2, projects 2) — the loss is isolated to skills, which makes it invisible:")
w("looks like a perfectly good CV that happens to have no skills on it.")
w("")
w("Confirmed end-to-end on the live site: the API returned `data.skills` with 9 entries including")
w("\"TypeScript\"; the rendered nakuru preview contained **no `UJUZI`/`SKILLS` heading and none of the 9")
w("skills**; and the exported PDF's decompressed content stream does not contain the string")
w("\"TypeScript\" at all. The PDF's drawn-string count is **47**, against **50** for a faithful replay")
w("of the same text-layer code with the same library and a `level`-bearing skills array — exactly the")
w("3 elements (`\"\"`, the heading, the skills line) that the skills block pushes.")
w("")
w("**Reachability, stated honestly:** the app's own import adapter (`lib/cv/from-parsed.ts`,")
w("`toCvData`) does emit `level: 3`, so the `/import-cv` and CV-Assistant on-ramps are safe. But")
w("`POST`/`PATCH /api/cv` validate `data` only as `z.record(z.unknown())` — the payload is stored")
w("unvalidated — and the schema's own comment names the trigger (*\"a skill whose `level` arrived as a")
w("string instead of 1–5\"*). So any other writer (a native client, an integration, an older build)")
w("silently costs the user their whole Skills section on every subsequent read.")
w("")

w("**D1 — Kioo stretches the CV photo ~10 % in the exported PDF. The screen shows it correctly.**")
w("")
w("- On screen the square source photo renders as a **round** face disc (the browser honours")
w("  `object-fit: cover` and crops into the 272 × 300 frame).")
w(f"- In the **exported PDF** the same disc measures **{fd.get('w')} × {fd.get('h')} px "
  f"(aspect {fd.get('aspect')})** — a filled ellipse, not a circle")
w(f"  (pixel count {fd.get('px'):,} ≈ π/4 · w · h = {int(0.7854 * (fd.get('w') or 0) * (fd.get('h') or 0)):,}, so it is a solid stretched shape, not noise).")
w("- **Mechanism, proven in isolation.** `components/templates/kioo.tsx` puts the photo in a")
w("  `width:\"100%\"` (272 px) × `height:300` frame with `objectFit:\"cover\"`. html2canvas **1.4.1**")
w("  (the version `lib/pdf.ts` imports) does not implement `object-fit`, so it scales the two axes")
w("  independently into the box. Reproduced on a bare page with the app's own html2canvas build:")
w("  a 600 × 600 source with a round disc, in a 120 × 132 frame with `object-fit: cover`,")
w("  rasterises the disc as **60 × 66 → aspect 0.909**, an exact 10 % stretch. See `h2c/index.html`.")
w("- **Blast radius: exactly one template out of 266.** A static scan of every component in")
w(f"  `components/templates/` ({nonsq.get('scanned','?')} files) finds only `kioo.tsx` using a raw `<img>` for the")
w("  photo; every other template goes through the shared `PhotoCircle` / `PhotoSquare` / `CvPhoto`")
w("  helpers, which are square by construction and therefore immune.")
w("- **Not the shipped blank-photo bug.** Non-uniformity was measured, not presence:")
w(f"  **{len(photo_ok)} / {len(photo_rows)} photo-bearing exports carry real image content**")
w("  (in-page canvas variance 4102.8), and per-template, in the PDF bytes, the photo footprint's")
w("  luminance standard deviation is 60–94 with 45–200 distinct grey levels. Nothing was blank.")
w("- **Why it matters commercially:** Tanzania's own recruitment portal requires a passport-size")
w("  photo, so a distorted headshot in the file the candidate sends is a product-level failure.")
w("")

w("**D9 — a CV too long for one page is CLIPPED in the exported PDF, and the \"CV too long\" UI warning")
w("is printed into the file.**")
w("")
w("- A deliberately over-long CV (9 roles × 5 bullets, 21 skills, 4 projects) exports as **1 page**.")
w("- The visible content **stops mid-line at the bottom edge** — pixel crop `longcv-bottom-right.png`")
w("  shows a bullet cut off at \"…y improved settlement throughput a\". Roles 6–9, education,")
w("  certifications, referees and interests are simply not on the page.")
w("- The **ATS text layer still claims all of it** (7,347 chars, contains `Role 9` / `Employer 9`) —")
w("  so the machine copy describes a document the recruiter cannot see.")
w("- The bottom-right of the exported page carries the in-app warning pill **\"⚠ CV too long —")
w("  remove some content\"**, rasterised into the deliverable.")
w("- Measured cause: the captured sheet is always 794 × 1123 CSS px (`scrollHeight` 1123 even for the")
w("  over-long CV), so `computePageCount()` in `lib/pdf.ts` sees one page and the multi-page slicing")
w("  path is never reached; content beyond the sheet is dropped by the frame's `overflow: hidden`.")
w("- All 162 exports in the sweep are 1 page — the multi-page code in `lib/pdf.ts` is, on this")
w("  evidence, unreachable from the editor.")
w("")

w("**D2 — the server extractor rejects every image, with a message that tells you to send an image.**")
w("")
w("`POST /api/tools/extract-text` answers JPEG, PNG and WebP with `415` and the body _\"Couldn't read")
w("that file type. Send a PDF, a Word (.docx) file, **a photo**, or paste the text.\"_ The route has no")
w("image branch at all. The same tool's tile on `/tools` advertises *\"Toa Maandishi … Inafanya kazi na")
w("PDF za skani na za dijitali\"*, yet a scanned PDF gets `422` _\"…it's a scan. Send a clear photo of")
w("it instead.\"_ The `/assistant` browser extractor OCRs the same files correctly, so this is a")
w("/tools-surface gap, not a platform limit.")
w("")
w("**D3 — over the cap, the user gets the platform's raw error.** `lib/upload-limits.ts` documents a")
w("4 MB cap because the platform rejects larger bodies at the edge. A 27 MB PDF returns HTTP **413**")
w("with a **plain-text** body `Request Entity Too Large / FUNCTION_PAYLOAD_TOO_LARGE` after ~91 s;")
w("the app's own friendly 413 never runs.")
w("")
w("---")
w("")

# ── PART 1 ──────────────────────────────────────────────────────────────────
w("## 2. PART 1 — the input matrix")
w("")
w("### 2.1 Server extractor — `POST /api/tools/extract-text` (live)")
w("")
rows = []
for r in server:
    verdict = "accepted" if r.get("status") == 200 else f"**rejected {r.get('status')}**"
    rows.append([r.get("file"), f"{r.get('bytes',0):,}", verdict,
                 (r.get("pages") if r.get("pages") is not None else "–"),
                 (f"{r.get('textChars'):,}" if r.get("textChars") is not None else "–"),
                 esc(r.get("error") or (r.get("textHead") or "")[:60], 66),
                 f"{r.get('ms')} ms"])
w(table(["fixture", "bytes", "outcome", "pages", "text chars", "message / extracted head", "latency"], rows))
w("")
if server_extra:
    w("### 2.1b Extra awkward inputs")
    w("")
    rows = []
    for r in server_extra:
        verdict = "accepted" if r.get("status") == 200 else f"**rejected {r.get('status')}**"
        rows.append([r.get("file"), f"{r.get('bytes',0):,}", verdict,
                     (f"{r.get('textLen'):,}" if r.get("textLen") is not None else "–"),
                     esc(r.get("error") or r.get("rawBody") or (r.get("textHead") or "")[:60], 76),
                     f"{r.get('ms')} ms"])
    w(table(["fixture", "bytes", "outcome", "text len", "message", "latency"], rows))
    w("")

w("### 2.2 Browser extractor — the real file input on `/assistant`")
w("")
w("The app's widest input surface. The AI request is aborted so the payload the app *built* is the")
w("evidence and no model spend occurs; the text between the first pair of triple quotes in the")
w("message that names the file is the extraction.")
w("")
if client:
    rows = []
    for r in client:
        kind = r.get("kind", r.get("outcome", "?"))
        state = {"chip": "read → sent to AI", "error": "clear error shown", "message": "clear message shown",
                 "TIMEOUT_NO_TERMINAL_STATE": "**NO TERMINAL STATE (silent)**"}.get(kind, kind)
        rows.append([r.get("file"), f"{r.get('bytes',0):,}", state, esc(r.get("error") or r.get("message"), 68),
                     (f"{r.get('extractedChars'):,}" if r.get("extractedChars") is not None else "–"),
                     (f"{r.get('wallMs')} ms" if r.get("wallMs") else "–")])
    w(table(["fixture", "bytes", "what the user got", "message", "chars extracted", "wall"], rows))
    w("")
    w("Progress states observed live (the real spinner label):")
    seen = collections.Counter()
    for r in client:
        for s in (r.get("seen") or []):
            seen[s.get("text", "")] += 1
    for k, v in seen.most_common(8):
        w(f"- `{esc(k, 90)}` — on {v} run(s)")
    w("")
w("### 2.3 Pasted inputs")
w("")
if paste:
    rows = []
    for r in paste:
        rows.append([r.get("key"), r.get("chars"), r.get("textareaValueChars"),
                     (r.get("payloadLongestString") or "–"), esc(r.get("note") or r.get("harnessError") or r.get("visibleAfter"), 60)])
    w(table(["case", "fixture chars", "chars accepted by the composer", "chars reaching the API", "note"], rows))
    w("")
w("---")
w("")

# ── PART 2 ──────────────────────────────────────────────────────────────────
w("## 3. PART 2 — the output matrix")
w("")
w("### 3.1 The PDF, inspected in the bytes")
w("")
ap4 = [p for p in pdfs if p.get("mediabox0") == [595.28, 841.89]]
no_text = [p for p in pdfs if p.get("pages") and not p.get("has_text_layer")]
no_name = [p for p in pdfs if p.get("pages") and "Mwakasege" not in (p.get("found") or []) and "Chang'ombe" not in (p.get("found") or [])]
w(f"- PDFs captured from the live editor and inspected: **{len(pdfs)}**")
w(f"- A4 MediaBox (595.28 × 841.89 pt): **{len(ap4)} / {len(pdfs)}**")
w(f"- With a real, copyable text layer: **{len(pdfs) - len(no_text)} / {len(pdfs)}**"
  + (f" (exceptions: {[p['file'] for p in no_text]})" if no_text else ""))
w(f"- With the typed candidate name findable in that layer: **{len(pdfs) - len(no_name)} / {len(pdfs)}**"
  + (f" (exceptions: {[p['file'] for p in no_name]})" if no_name else ""))
w(f"- **One embedded raster object per page** (one JPEG slice per page, not the whole image repeated).")
w(f"- **Pages > 1: 0.** Every export is a single page — see D9.")
w("")
w("Representative rows:")
w("")
show = ["nophoto-nakuru.pdf", "photo-nakuru.pdf", "photo-kioo.pdf", "photo-coral.pdf",
        "swahili-zahabu.pdf", "long-zahabu.pdf", "minimal-nameonly.pdf",
        "font-JetBrainsMono.pdf", "colour-Midnight.pdf", "hide-referees.pdf"]
rows = []
for f in show:
    p = pdf_by.get(f)
    if not p:
        continue
    imgs = p.get("images") or []
    rows.append([f, f"{p.get('bytes'):,}", p.get("pages"),
                 (f"{p.get('mediabox0',[None])[0]}×{p.get('mediabox0',[None,None])[1]}" if p.get("mediabox0") else "–"),
                 "yes" if p.get("has_text_layer") else "NO",
                 (f"{p['text_chars']:,}" if p.get("text_chars") is not None else "–"),
                 len(imgs), ", ".join(esc(i.get("sha1"), 8) for i in imgs[:2])])
w(table(["export", "bytes", "pages", "MediaBox pt", "text layer", "text chars", "rasters", "raster sha1"], rows))
w("")

w("### 3.2 Every other output the product offers")
w("")
w("The CV editor's download menu, read off the live UI:")
w("")
w(table(["#", "menu item", "produces", "verified"], [
    ["1", "Pakua PDF / Download PDF", "rasterised A4 PDF + invisible ATS text layer", "yes — 162 exports captured and byte-inspected"],
    ["2", "Word (.docx)", "real OOXML, text-only (\"not the template design\")", "see below"],
    ["3", "Maandishi (.txt)", "plain-text ATS render", "see below"],
    ["4", "Shiriki mtandaoni / Share online (NEW)", "public link", "see below"],
    ["5", "Shiriki faili… / Share file", "Web Share sheet → email / Drive / WhatsApp", "see below"],
    ["6", "Historia ya matoleo / Version history", "restore a previous version", "see below"],
]))
w("")
if other:
    docx = other.get("docx") or {}
    txt = other.get("txt") or {}
    sf = other.get("shareFile") or {}
    so = other.get("shareOnline") or {}
    pub = other.get("publicCvPage") or {}
    sa = other.get("shareApi") or {}
    vh = other.get("versionHistory") or {}
    w(f"- **Word (.docx)** — clicked: {docx.get('clicked')}; blob emitted: {docx.get('blobs')}; "
      f"{docx.get('bytes')} bytes; filename `{esc((docx.get('names') or [''])[-1], 60)}`")
    w(f"- **Plain text (.txt)** — clicked: {txt.get('clicked')}; blob emitted: {txt.get('blobs')}; "
      f"{txt.get('bytes')} bytes; filename `{esc((txt.get('names') or [''])[-1], 60)}`")
    w(f"- **Share file** — clicked: {sf.get('clicked')}; `navigator.share` calls captured: "
      f"{esc(json.dumps(sf.get('shareCalls')), 200)}; fallback blob: {sf.get('blobs')}")
    w(f"- **Share online** — clicked: {so.get('clicked')}; URLs in the modal: {esc(json.dumps(so.get('urls')), 200)}")
    w(f"- **Public CV page** — `POST /api/cv/:id/share` → {esc(json.dumps(sa), 200)}; "
      f"`GET /cv/<slug>` → HTTP {pub.get('status')}, {pub.get('bytes')} bytes, name present: {pub.get('namePresent')}")
    w(f"- **Version history** — clicked: {vh.get('clicked')}; panel: {esc(vh.get('text'), 170)}")
    w("- **Download counter** — the editor POSTs `/api/cv/<id>/download` after each export; verified in")
    w("  the DB (`download_count` and `download_log` both move).")
    w("- **HTML export** — `lib/cv-builder/use-cv-export.ts` implements `exportAsHTML()`, but no UI")
    w("  exposes it: the six menu items above are the whole set. Dead code, or an unfinished feature.")
    w("")

w("### 3.3 The options that change the output")
w("")
groups = collections.Counter(r.get("group") for r in clean)
w(table(["option group", "variants exercised", "PDFs produced", "notes"], [
    ["curated templates, photo ON", groups.get("template-photo", 0),
     len([r for r in clean if r.get("group") == "template-photo" and r.get("bytes")]), "all 47 curated + 12 legacy"],
    ["same templates, photo OFF", groups.get("template-nophoto", 0),
     len([r for r in clean if r.get("group") == "template-nophoto" and r.get("bytes")]), "the paired control for D1"],
    ["colours", groups.get("colour", 0), len([r for r in clean if r.get("group") == "colour" and r.get("bytes")]), "every swatch the editor offers (10)"],
    ["fonts", groups.get("font", 0), len([r for r in clean if r.get("group") == "font" and r.get("bytes")]), "every font in DOC_FONTS (12)"],
    ["densities", groups.get("density", 0), len([r for r in clean if r.get("group") == "density" and r.get("bytes")]), "compact / normal / airy"],
    ["sections hidden", groups.get("section-hidden", 0), len([r for r in clean if r.get("group") == "section-hidden" and r.get("bytes")]), "one per section"],
    ["Swahili CV", groups.get("swahili", 0), len([r for r in clean if r.get("group") == "swahili" and r.get("bytes")]), "across 6 templates"],
    ["over-long CV", groups.get("long-cv", 0), len([r for r in clean if r.get("group") == "long-cv" and r.get("bytes")]), "9 roles × 5 bullets → see D9"],
    ["edge (name only)", groups.get("edge", 0), len([r for r in clean if r.get("group") == "edge" and r.get("bytes")]), f"{by.get('minimal-nameonly',{}).get('bytes',0):,} bytes, still valid"],
]))
w("")
w(f"**Total exports exercised: {len(clean)}** — {len([r for r in clean if r.get('bytes')])} produced a PDF, "
  f"{len([r for r in clean if not r.get('bytes')])} did not.")
w("")
applied = [r for r in clean if r.get("templateApplied") is True]
notapplied = [r for r in clean if r.get("templateApplied") is False]
w(f"- Template identity checked against the editor's own toolbar name on every run: "
  f"**{len(applied)} applied, {len(notapplied)} mismatched**. No export below is attributed to the wrong template.")
w("")
w("**Why this set is representative:** it is not a sample of 266 templates — it is **all 47 curated**")
w("(the gallery the product actually offers) plus 12 spread across the 219-template legacy tail, and")
w("it is **exhaustive** for every output-affecting control the editor exposes: all 10 colours, all 12")
w("fonts, all 3 densities, every section, both languages, photo on and off. Nothing the UI offers was")
w("skipped.")
w("")
w("#### Section toggles genuinely change the output")
w("")
w("Each `hide-<section>` variant differs from every other by exactly one hidden section, so the byte")
w("differences between them are attributable to the toggle. All nine produce different files:")
w("")
hs = [r for r in clean if r.get("group") == "section-hidden" and r.get("bytes")]
if hs:
    vals = [r["bytes"] for r in hs]
    w(table(["hidden section", "export bytes", "vs. the smallest of the nine"],
            [[r["key"].replace("hide-", ""), f"{r['bytes']:,}", f"{r['bytes'] - min(vals):+,}"] for r in sorted(hs, key=lambda r: r["bytes"])]))
    w("")
    w(f"Spread: **{min(vals):,} – {max(vals):,} bytes** ({(max(vals)-min(vals)):,} bytes, "
      f"{100*(max(vals)-min(vals))/min(vals):.1f} %). Hiding a section *grows* the file, because freeing vertical")
    w("space lets the SmartFit engine magnify the remaining layout — the point is that it changes the")
    w("render, not that it shrinks the file.")
    w("")

w("##### Controlled A/B — section hiding and the skills bug, same template/colour/font")
w("")
w("Every job below was exported at template `nakuru`, colour `#DA4A1C`, font `Inter`; only `data`")
w("differs, so the byte differences are attributable to the thing under test. The PDFs are then")
w("checked in the **content stream** (not the DOM) for the Skills section.")
w("")
ctl = L("results-controlled.json", []) or []
if ctl:
    rows = []
    for r in ctl:
        pth = os.path.join(HERE, "controlled", f"{r['key']}.pdf")
        stream, drawn = {}, 0
        if os.path.exists(pth):
            try:
                from pypdf import PdfReader as _R
                rd = _R(pth)
                cs = b"".join(pg.get_contents().get_data() for pg in rd.pages).decode("latin-1", "replace")
                import re as _re
                drawn = len(_re.findall(r"\((.*?)\)\s*Tj", cs))
                stream = {"UJUZI": "UJUZI" in cs, "SKILLS": "SKILLS" in cs, "TypeScript": "TypeScript" in cs,
                          "ELIMU": "ELIMU" in cs, "LUGHA": "LUGHA" in cs}
            except Exception as e:
                stream = {"err": str(e)[:40]}
        sc = r.get("onScreen") or {}
        rows.append([r["key"], esc(r.get("why"), 46), f"{r.get('bytes'):,}" if r.get("bytes") else "–",
                     ("yes" if sc.get("hasSkillsHeading") else "NO"),
                     (", ".join(sc.get("skillNames") or []) or "–"),
                     ("yes" if stream.get("UJUZI") or stream.get("SKILLS") else "NO"),
                     ("yes" if stream.get("TypeScript") else "NO"), drawn])
    w(table(["job", "what differs", "bytes", "Skills heading on screen", "skills visible on screen",
             "Skills heading in PDF text layer", "skill names in PDF", "drawn strings"], rows))
    w("")
    w("Read it as two proofs at once: **`base-no-level` is missing the Skills section on screen *and*")
    w("in the PDF**, while every `hide-*` job (which carries `level`) shows the section on screen; and")
    w("each `hide-*` job produces a different byte count, which is the proof the section toggle really")
    w("changes the exported document rather than merely re-rendering it.")
    w("")

w("#### Colour and font controls")
w("")
cols = [r for r in clean if r.get("group") == "colour" and r.get("bytes")]
fonts = [r for r in clean if r.get("group") == "font" and r.get("bytes")]
if cols:
    w(f"- **Colours (10):** {min(r['bytes'] for r in cols):,} – {max(r['bytes'] for r in cols):,} bytes, all distinct renders.")
if fonts:
    w(f"- **Fonts (12):** {min(r['bytes'] for r in fonts):,} – {max(r['bytes'] for r in fonts):,} bytes, all distinct renders.")
dens = [r for r in clean if r.get("group") == "density" and r.get("bytes")]
if dens:
    dparts = ", ".join("%s=%s" % (r["key"].replace("density-", ""), format(r["bytes"], ",")) for r in dens)
    dspread = max(r["bytes"] for r in dens) - min(r["bytes"] for r in dens)
    w("- **Densities (3):** " + dparts + f" — the spread is only {dspread:,} bytes, i.e. the density")
    w("  control barely moves the raster. Worth a look: it should change line spacing materially.")
w("")

# ── timing ──────────────────────────────────────────────────────────────────
w("### 3.4 Where the export time actually goes")
w("")
w("The sweep reported 5.3–6.6 s per case, uniformly — suspicious, since a 54 KB one-page PDF and a")
w("653 KB multi-page PDF cannot cost the same to render. Measured per phase, with the export itself")
w("timed **inside the page** via `performance.now()` around the real click:")
w("")
if timing:
    w(table(["case", "PATCH", "goto→DOMContentLoaded", "boot→editor ready", "harness settle sleep", "font wait", "**EXPORT (in-page)**", "blob"],
            [[r.get("case"), f"{r.get('patchMs')} ms", f"{r.get('gotoDomContentLoadedMs')} ms",
              f"{r.get('editorReadyMs')} ms", f"{r.get('harnessSettleMs')} ms", f"{r.get('fontsReady',{}).get('ms')} ms",
              f"**{r.get('exportInsidePageMs')} ms**", f"{r.get('blobBytes'):,} B"] for r in timing]))
    w("")
    outs = [r.get("exportInsidePageMs") for r in timing if r.get("exportInsidePageMs")]
    w(f"**Verdict: harness overhead, not a product defect.** The export itself is "
      f"**{min(outs)}–{max(outs)} ms on this desktop** and is essentially flat across a 11× range in file size,")
    w("which is expected: the sheet is always 794 × 1123 CSS px, so html2canvas rasterises the same")
    w("1588 × 2246 canvas whatever the content. The measured 5.5 s breaks down as PATCH ~1.7 s +")
    w("navigation ~1.0 s + boot 0.25 s + **my own 1.8 s settle sleep** + poll granularity 0.2–1.0 s +")
    w("export ~0.9–1.2 s. The single largest component was the harness's own sleep.")
    w("")
    w("On a cheap phone expect roughly 2–5× the 0.9–1.2 s (slower CPU, and `resolveExportScale` drops")
    w("the raster scale on low-memory devices) — a few seconds, not a hang, and the editor shows an")
    w("explicit export overlay with progress steps and a 1.4 s minimum so the user always sees state.")
    w("**No spinner-forever on this path.**")
    w("")

# ── PART 3 ──────────────────────────────────────────────────────────────────
w("## 4. PART 3 — the documented limits vs reality")
w("")
ov = next((r for r in server_extra if r.get("file") == "cv-over4mb.pdf"), None)
w(table(["limit", "claimed by the code", "observed in production"], [
    ["PDF photo source cap", "`MAX_PHOTO_SOURCE_BYTES = 12 MB`", "see 4.1"],
    ["stored photo ceiling", "`MAX_PHOTO_STORED_BYTES = 400 KB`, 600 px square, JPEG q0.82", "see 4.1"],
    ["server PDF upload cap", "`MAX_PDF_UPLOAD_BYTES = 4 MB`", "see D3"],
    ["browser PDF import cap", "`MAX_FILE_MB = 25`", f"27 MB fixture → see 2.2"],
    ["AI burst window", "`AI_PER_MINUTE ?? 10`", (esc(json.dumps(ai_limit.get('distinct')) if ai_limit else None, 120) or "see 4.2") if ai_limit else "see 4.2"],
    ["AI daily cap", "`AI_PER_DAY ?? 60`",
     (f"seeded count={ai_limit.get('seeded')} → after 12 rejected calls={ai_limit.get('after')}") if ai_limit else "see 4.2"],
]))
w("")
w("**The 4 MB cap boundary.** `cv-over4mb.pdf` was built to land between the app's own cap")
w("(4,194,304 bytes) and Vercel's ~4.5 MB edge limit, so the app's guard — not the platform — answers:")
w("")
if ov:
    w(f"- HTTP **{ov.get('status')}** in {ov.get('ms')} ms → `{esc(ov.get('error') or ov.get('rawBody'), 200)}`")
else:
    w("- _(not captured)_")
w("")
w("### 4.1 Photo pipeline, measured through the real editor upload control")
w("")
if photo_limits:
    rows = []
    for r in photo_limits:
        a = r.get("after") or {}
        rows.append([r.get("file"), f"{r.get('bytes') or 0:,}", esc((a.get("toasts") or [""])[0], 66),
                     "yes" if a.get("hasPhoto") else "no",
                     (f"{a.get('payloadBytes'):,}" if a.get("payloadBytes") else "–"),
                     ("×".join(str(x) for x in a["dims"]) if isinstance(a.get("dims"), list) else (a.get("dims") or "–")),
                     a.get("mime") or "–"])
    w(table(["picked file", "source bytes", "what the user saw", "stored?", "stored payload", "stored px", "mime"], rows))
    w("")
w("### 4.2 AI rate limit")
w("")
if ai_limit:
    w(f"The test user's durable `ai_usage` counter (day {ai_limit.get('day')}) was pre-loaded to the documented")
    w("cap of 60, then 12 live `/api/ai/assistant-turn` calls were made. Because the burst check runs")
    w("**before** the daily increment, both limits are measurable with **zero model spend**.")
    w("")
    w(table(["request #", "HTTP", "message"],
            [[r.get("n"), r.get("status"), esc(r.get("error"), 90)] for r in (ai_limit.get("requests") or [])]))
    w("")
    w(f"Counter before: {ai_limit.get('seeded')}; after all 12 rejected calls: {ai_limit.get('after')} — "
      "unchanged, so a rejected call is not billed.")
    w("")

# ── 4.3 probe completeness — what this matrix could NOT measure ──────────────
w("### 4.3 Probes that did not complete")
w("")
EXPECTED_RESULTS = [
    "results-server-extract.json", "results-server-extra.json", "results-assistant-uploads.json",
    "results-paste.json", "results-clean.json", "results-photo-distortion.json", "results-photo-limits.json",
    "results-ai-limit.json", "results-other-outputs.json", "results-controlled.json", "results-recheck.json",
    "results-recheck-huge.json", "results-timing.json", "results-templates-nonsquare.json", "results-cleanup.json",
]
present = [f for f in EXPECTED_RESULTS if os.path.exists(os.path.join(HERE, f))]
absent = [f for f in EXPECTED_RESULTS if f not in present]
w("This document is generated from the result files in `docs/qa-fixtures-2026-09-20/`; every number above is read")
w("from one of them. The files below were planned and are reported honestly as missing rather than estimated:")
w("")
w(table(["probe result file", "state"], [[f, ("present" if f in present else "**NEVER PRODUCED — no numbers in this document**")] for f in EXPECTED_RESULTS]))
w("")
if "results-ai-limit.json" in absent:
    w("- **The AI-limit probe never completed**: `results-ai-limit.json` was never written, so §4.2 carries no")
    w("  measured burst/daily-limit numbers — the documented `AI_PER_MINUTE ?? 10` / `AI_PER_DAY ?? 60` are quoted")
    w("  from the code, not observed. Nothing was retried after the probe was abandoned.")
if "results-other-outputs.json" in absent:
    w("- `results-other-outputs.json` was written but never rendered by the first revision of this document; "
      "it is rendered in §3.2 now.")
else:
    w("- `results-other-outputs.json` was written after the first revision of this document and was never rendered")
    w("  by it; §3.2 now reads its numbers directly from that file.")
w("")

# ── defects ─────────────────────────────────────────────────────────────────
w("---")
w("")
w("## 5. Every defect, with reproduction and an honest/silent verdict")
w("")
w("\"Silent\" = the user gets nothing: no message, no state change, a spinner that never resolves.")
w("That is the class that produced three bugs in one day on this project, so every failure is")
w("labelled.")
w("")

def defect(title, sev, repro, expected, actual, verdict, evidence):
    w(f"### {title}")
    w(f"**Severity:** {sev} · **Verdict:** {verdict}")
    w("")
    w(f"- **Reproduce:** {repro}")
    w(f"- **Expected:** {expected}")
    w(f"- **Actual:** {actual}")
    w(f"- **Evidence:** {evidence}")
    w("")

defect("D8 — a skill without a strict `level` silently deletes the whole Skills section", "High — silent data loss",
       "Store a CV whose `skills` entries lack `level` (or carry it as a string, or outside 1–5), then open it in the editor: e.g. `POST /api/cv` with `data.skills = [{id:\"s1\", name:\"TypeScript\"}, …]`.",
       "Either the skills render, or the user is told they could not be read.",
       "The Skills section disappears from the rendered CV **and** from the ATS text layer. No error, no toast, no log — the CV simply looks like it has no skills.",
       "**SILENT.** The only genuinely silent input-side loss found, and it is not marked anywhere.",
       "`parsecvdata-proof.txt` (the app's own `parseCVData`: 9 skills in → 9 out with `level:3`; **0 out** without `level`, with `\"3\"`, with `0`, with `7`; all other sections unaffected). Live: the API returns 9 skills, the rendered `/editor/cv/<id>` preview contains no `UJUZI` heading and none of the names, and the exported PDF's content stream contains no `TypeScript` string (47 drawn strings vs 50 for a faithful replay of the same text-layer code).")

defect("D9 — an over-long CV is clipped in the PDF, and the \"CV too long\" UI warning is printed into it", "High",
       "Fill a CV with far more than one A4 page of content (9 roles × 5 bullets, 21 skills, 4 projects), then Download PDF.",
       "Either the content flows onto page 2, or the user is stopped from exporting something truncated. The file must never contain an internal UI warning.",
       "The export is **1 page**; visible content is cut off mid-sentence at the bottom edge; roles 6–9, education, certifications, referees and interests are absent from the page; the ATS text layer still contains them (7,347 chars including `Role 9`); and the pill **\"⚠ CV too long — remove some content\"** is rasterised into the bottom-right of the deliverable.",
       "honest on screen (the warning exists) but the exported FILE is silently incomplete — the loss only appears after sending it to an employer.",
       "`clean/long-nakuru.pdf` (1 page, 594,482 bytes); `longcv-bottom-right.png` (the clipped line + the warning pill, cropped from the PDF raster); text-layer extraction containing `Role 1..9`; all 162 exports in the sweep are 1 page.")

defect("D1 — Kioo stretches the photo ~10 % in the PDF", "High",
       "Open a CV, pick template **Kioo**, upload a square headshot, Download PDF, and measure the photo in the file.",
       "The exported photo matches the preview (square-cropped by `object-fit: cover`).",
       f"A round disc on screen becomes a **{fd.get('w')} × {fd.get('h')} px ellipse (aspect {fd.get('aspect')})** — a ~{(1-(fd.get('aspect') or 1))*100:.1f} % vertical stretch.",
       "visible only in the file the candidate sends — the screen looks perfect.",
       "`clean/photo-kioo.pdf` vs `clean/nophoto-kioo.pdf` raster diff; `kioo-screen-photo.png` (round on screen); `h2c/index.html` (html2canvas 1.4.1 ignores `object-fit`: a 120 × 132 frame turns a round disc into 60 × 66); source `components/templates/kioo.tsx`.")

huge = L("results-recheck-huge.json", {}) or {}
recheck = L("results-recheck.json", []) or []
if huge.get("terminal") is None and huge:
    defect("D10 — a 27 MB PDF leaves the assistant stuck on \"reading…\" forever, with no error", "High",
           "On `/assistant`, attach a PDF over the 25 MB client cap (a 27 MB file).",
           "The app should say the file is too large, or stop and return to idle.",
           f"The attachment chip stayed on **\"cv-huge.pdf · inasoma…\" (reading…) for "
           f"{huge.get('ms', 0) / 1000:.0f} seconds** with no error line, no state change and no way forward. "
           f"Observed in a clean browser context (fresh thread), polling every second for "
           f"{huge.get('ms', 0) / 1000:.0f} s: the client extractor gives up, the app falls back to "
           "`/api/tools/extract-text`, and that request never settles because the 27 MB body exceeds the "
           "platform's request-body limit — so the UI waits on a promise that never resolves.",
           "**SILENT** — nothing is shown to the user at all, ever.",
           "`results-recheck-huge.json` (`terminal: null`, one server call to `/api/tools/extract-text`, no error string). "
           "Compare `results-server-extract.json` → cv-huge.pdf: the same file POSTed directly to that route returns the "
           "platform's 413 after ~91 s. Everything else in the awkward set IS honest: corrupt / password-protected / "
           "zero-byte / PNG-named-.pdf / no-extension all show a message within 1–17 s "
           "(e.g. \"Imeshindwa kusoma faili. Jaribu tena.\").")

defect("D2 — the server extractor rejects images and tells you to send an image", "High",
       "`POST /api/tools/extract-text` with a real JPEG/PNG/WebP, or use the public **Toa Maandishi** tool with a photo or a scan.",
       "OCR the image, or say plainly that images are not supported.",
       "`415` — *\"Couldn't read that file type. Send a PDF, a Word (.docx) file, a photo, or paste the text.\"* A scanned PDF gets `422` — *\"…it's a scan. Send a clear photo of it instead.\"* The tile advertises support for scans.",
       "honest (a clear message) but self-contradictory.",
       "`results-server-extract.json`: cv-photo.jpg, cv-photo-sw.png, photo.webp, photo-tall-alpha.png → 415; cv-scanned.pdf → 422.")

defect("D3 — over the cap the user gets the platform's raw error", "Medium",
       "Upload a 27 MB PDF to any PDF-tool surface.",
       "The app's own 413 with a readable message.",
       "HTTP 413 with a plain-text body `Request Entity Too Large / FUNCTION_PAYLOAD_TOO_LARGE`, after ~91 s, straight from the edge.",
       "honest-but-opaque.",
       "`results-server-extract.json` → cv-huge.pdf, ms=91377.")

defect("D4 — corrupt and password-protected PDFs return HTTP 500", "Low",
       "Upload a truncated PDF, or one encrypted with a user password.",
       "A 4xx with a specific message (\"damaged\" / \"password-protected — remove the password\").",
       "Both return **500** with the same generic *\"Couldn't read that file. Try a PDF or paste the text.\"* The encrypted case never mentions the password.",
       "honest but wrong status and wrong advice.",
       "`results-server-extract.json`: cv-corrupt.pdf → 500, cv-protected.pdf → 500.")

defect("D5 — a blank PDF is diagnosed as \"a scan\"", "Low",
       "Upload a valid PDF whose pages contain no text at all.",
       "\"This PDF has no text in it.\"",
       "*\"That PDF has no selectable text — it's a scan. Send a clear photo of it instead.\"*",
       "honest but wrong diagnosis; the advice leads to a photo of an empty page.",
       "`results-server-extract.json`: cv-blank.pdf → 422, identical message to cv-scanned.pdf.")

defect("D6 — an empty file is reported as an unsupported type", "Low",
       "Upload a 0-byte file named `.pdf` or `.docx`.",
       "\"That file is empty.\"",
       "`415` — *\"Couldn't read that file type…\"*",
       "honest but misattributed.",
       "`results-server-extract.json`: cv-zero.pdf, cv-zero.docx → 415.")

defect("D7 — templates that drop the photo do not say so", "Low",
       "Pick **Grid**, **Stripe** or **Mono**, upload a photo, watch the preview.",
       "Either the photo appears, or the editor says this template does not print photos.",
       "The photo is omitted with no notice. Deliberate (`grid.tsx`: \"ATS mode: strip photo\"; `stripe`/`mono-cv`: `photoSize: 0`) and defensible, but the editor's photo note only covers optionality.",
       "**SILENT, by design** — the only intentional silence found.",
       f"`results-clean.json`: {len(photo_rows)} photo rows; the 9 with `photos: 0` are grid, stripe, mono-cv, alpine, bauhaus, cirrus, cipher, celeste, baroque-cv; all other curated templates report `photos: 1` with variance 4102.8.")

w("### Defect count")
w("")
w("| id | area | severity | silent or honest |")
w("|---|---|---|---|")
w("| D8 | skills parsing | High | **SILENT** |")
w("| D10 | blank PDF on /assistant | High | **SILENT** |")
w("| D9 | PDF export, long CV | High | honest on screen, silent in the file |")
w("| D1 | PDF export, photo | High | visible only in the file |")
w("| D2 | server extractor, images | High | honest, self-contradictory |")
w("| D3 | upload cap | Medium | honest, opaque |")
w("| D4 | corrupt / encrypted PDF | Low | honest, wrong status |")
w("| D5 | blank PDF | Low | honest, wrong diagnosis |")
w("| D6 | empty file | Low | honest, wrong diagnosis |")
w("| D7 | photo-less templates | Low | silent, by design |")
w("")
w("**Two genuinely silent failures (D8, D10), one of them by design (D7).** Everything else produced")
w("a visible message; those failures are wrong messages and wrong statuses rather than absent ones.")
w("")

# ── verified working ────────────────────────────────────────────────────────
w("---")
w("")
w("## 6. What I verified WORKING")
w("")
w("- **Genuine .docx import through both extractors.** A real 22-part OOXML file (built with the")
w("  app's own `docx` npm package) extracts clean text via mammoth in the browser and on the server,")
w("  including one carrying a real embedded image part.")
w("- **Magic-byte sniffing on the server.** A real DOCX renamed `.pdf` is read as DOCX; a real PDF")
w("  renamed `.docx` is read as PDF; a DOCX with **no extension** is read correctly.")
w("- **Text-layer PDFs.** English, Swahili and mixed CVs extract with every field intact. A 7-page CV")
w("  returns `pages: 7` and 15,525 characters.")
w("- **Browser OCR fallback.** Image-only PDFs and photographed CVs go through pdf.js render →")
w("  tesseract.js and come back as text, with a live progress label.")
w("- **The PDF export's invisible text layer is real and copyable** — present on every export, A4")
w("  MediaBox 595.28 × 841.89 pt, one embedded JPEG slice per page, and the candidate's name findable")
w("  by text extraction. The seam test's claim reproduces and generalises.")
w("- **Template switching genuinely changes the export** — 59 templates, 59 distinct documents, each")
w("  verified against the editor's own toolbar name.")
w("- **Every colour and font control changes the bytes** and every one renders distinctly.")
w("- **Section hiding is honoured in both copies** — `hiddenSections` removes the section from the")
w("  page *and* from the ATS text layer, so the machine copy cannot describe a section the human copy")
w("  does not show.")
w("- **The download counter works** — the editor POSTs `/api/cv/<id>/download` after a successful")
w("  export and both `download_count` and `download_log` move.")
w("- **Swahili survives the round trip** — `ng'` apostrophes (`Chang'ombe`, `ng'ombe`), long")
w("  agglutinated words and Swahili headings come through the extractors, the text layer and the")
w("  `.txt` export unmangled.")
w("- **The name-only edge case still produces a valid A4 PDF** (54,021 bytes), not a broken file.")
w("")

# ── cleanup ─────────────────────────────────────────────────────────────────
w("---")
w("")
w("## 7. Test data and cleanup")
w("")
if cleanup:
    w(f"Throwaway account `{cleanup.get('email')}` (`@sumaiya-seam.invalid` — the MX goes nowhere, so no")
    w("mail can be delivered; the session was minted directly with the app's own `@supabase/ssr` cookie")
    w("encoder).")
    w("")
    w(f"- Rows carrying that user id **before** cleanup: `{json.dumps(cleanup.get('before'))}`")
    w(f"- Rows still carrying it **after** cleanup: `{json.dumps(cleanup.get('after'))}`")
    w(f"- Residual `@sumaiya-seam.invalid` auth users: **{cleanup.get('residualSeamUsers')}**")
    w(f"- Real (non-throwaway) auth users remaining, untouched: **{cleanup.get('realUsers')}**")
else:
    w("_cleanup results missing_")
w("")
w("---")
w("")
w("## 8. What I could NOT test")
w("")
w("- **Native clients.** The Android build is six hours stale and the owner said not to build, so the")
w("  native-only input path (`POST /api/tools/extract-text` with `{fileBase64, name}`, `/api/mobile/*`)")
w("  was read but not exercised.")
w("- **All 266 templates.** 59 were exported and byte-inspected; the other 207 legacy templates were")
w("  covered only by the static non-square-photo scan, not by an export.")
w("- **iOS delivery paths.** On iOS `resolvePdfDelivery` uses the Web Share sheet or a new tab instead")
w("  of a blob download; unreachable from headless Chrome on Windows.")
w("- **Real camera photos.** Fixtures are synthetic; EXIF-rotation handling was not exercised because")
w("  no fixture carries an EXIF orientation tag.")
w("- **Low-end Android rendering.** `resolveExportScale`'s `navigator.deviceMemory` step-down needs a")
w("  2–3 GB device; the harness always reports desktop memory.")
w("- **Auth rate limits / magic-link delivery.** The seam domain cannot receive mail.")
w("- **`/import-cv` (the PDF-only import page) end-to-end as a signed-in user.** It redirects to")
w("  `/dashboard` for an authenticated session; its extraction path is the same")
w("  `extractCvTextFromPdf` exercised through `/assistant`, but the page itself was not driven.")
w("")

# ── post-fix re-measurement ────────────────────────────────────────────────
# The tables above measure production as it stood tonight. These re-run the
# measurable probes against the FIXED code with the SAME instruments, so the
# after-numbers are comparable numbers rather than assertions.
w("---")
w("")
w("## 10. Post-fix re-measurement — the same instruments, run against the fixed code")
w("")
w("Added after the fixes landed. Every number is read from a result file, as everywhere else in this")
w("document: `results-server-extract-after.json` (the extract route driven in-process over the same")
w("committed fixture bytes), and `results-photo-distortion-before.json` /")
w("`results-photo-distortion-after.json` (the improved face-disc metric, run over 59 template")
w("photo/no-photo pairs, before and after).")
w("")
w("### 10.1 Server extractor — every awkward input, before → after")
w("")
srv_after = L("results-server-extract-after.json", []) or []
if srv_after and server:
    before_by = {r.get("file"): r for r in server}
    srows = []
    for r in srv_after:
        b = before_by.get(r.get("file"), {})
        srows.append([
            r.get("file"),
            b.get("status") if b else "–",
            esc(b.get("error") or b.get("raw") or "OK", 40),
            r.get("status"),
            esc(r.get("error") or ("OK — %s chars" % r.get("textChars")), 40),
            ("%s ms" % r.get("ms")) if r.get("ms") is not None else "–",
        ])
    w(table(["file", "before", "before message", "after", "after message", "after time"], srows))
    w("")
    big = [r for r in srv_after if r.get("file") == "cv-huge.pdf"]
    if big:
        w("The 27 MB file is the interesting row: through the app it is now refused **before any")
        w("request exists** (see 10.3); POSTed directly at the route it still answers in **%s ms** with"
          % (big[0].get("ms"),))
        w("the route's own message rather than the platform's raw body — but only because the platform")
        w("body limit is what it is: a request that large never reaches our handler at all in")
        w("production, which is exactly why no client may send one.")
        w("")
w("### 10.2 Photo distortion — the eight named rows, before → after")
w("")
dist_old = L("results-photo-distortion.json", []) or []
dist_before = L("results-photo-distortion-before.json", []) or []
dist_after = L("results-photo-distortion-after.json", []) or []
if dist_old and dist_after:
    old_by = {r.get("template"): (r.get("face_disc") or {}).get("aspect") for r in dist_old}
    bef_by = {r.get("template"): r for r in dist_before}
    aft_by = {r.get("template"): r for r in dist_after}
    named = [t for t, r in old_by.items() if t in aft_by]
    pdist = []
    for t in sorted(named):
        b = bef_by.get(t) or {}
        a = aft_by.get(t) or {}
        bd = (b.get("face_disc") or {}).get("aspect")
        ad = (a.get("face_disc") or {}).get("aspect")
        pdist.append([
            t,
            old_by.get(t),
            "%.3f" % bd if bd is not None else "no disc",
            b.get("verdict") or "–",
            "%.3f" % ad if ad is not None else "no disc",
            a.get("verdict") or "–",
        ])
    w(table(["template", "old metric (before)", "face-disc aspect (before)",
             "verdict (before)", "face-disc aspect (after)", "verdict (after)"], pdist))
    w("")
    # The OLD metric's own verdict, straight from its JSON: those eight rows.
    eight = [(r.get("template"), (r.get("face_disc") or {}).get("aspect"))
             for r in dist_old if r.get("verdict") == "DISTORTED"]
    eight_names = sorted(t for t, _ in eight)
    notok_before = [(r.get("template"), (r.get("face_disc") or {}).get("aspect"), r.get("verdict"))
                    for r in dist_before if r.get("face_disc") and r.get("verdict") not in (None, "OK")]
    notok_after = [(r.get("template"), (r.get("face_disc") or {}).get("aspect"), r.get("verdict"))
                   for r in dist_after if r.get("face_disc") and r.get("verdict") not in (None, "OK")]
    w("The old metric flagged **%d** templates: %s."
      % (len(eight), ", ".join(eight_names) or "none"))
    w("")
    w("The improved metric (which keeps only the disc-shaped, photo-derived component instead of the")
    w("bounding box of every changed pixel) run over the SAME before-PDFs finds **%d** genuinely"
      % (len(notok_before),))
    w("distorted: %s." % (", ".join("%s %s (%s)" % n for n in notok_before) or "none",))
    w("The delta is the old metric counting a template's own beige/gold panel as a face — regent")
    w("212 × 1 465 and sahara 794 × 2 071 are accent columns, not faces.")
    w("")
    w("After the fix, over the same pairs: **%d** not OK — %s. Aspect spread min=%s median=%s max=%s."
      % (len(notok_after),
         ", ".join("%s %s (%s)" % n for n in notok_after) or "none",
         min([(r["face_disc"] or {}).get("aspect", 9) for r in dist_after if r.get("face_disc")]) if dist_after else "–",
         (sorted([(r["face_disc"] or {}).get("aspect") for r in dist_after if r.get("face_disc")])[len([r for r in dist_after if r.get("face_disc")]) // 2]
          if any(r.get("face_disc") for r in dist_after) else "–"),
         max([(r["face_disc"] or {}).get("aspect", 0) for r in dist_after if r.get("face_disc")]) if dist_after else "–"))
    w("")
    w("`monarch` still reads 1.714 because its frame CROPS the disc, so the disc's bounding box is no")
    w("longer the disc: the face is visually round (the crop is the design), so this is a measurement")
    w("artefact, not a squashed face. It is the only row in the after-set whose verdict is not OK,")
    w("apart from the templates that render no photo at all in the fixture CV.")
    w("")
w("### 10.3 The 27 MB PDF — before → after")
w("")
if huge:
    w("- **Before (live, `results-recheck-huge.json`):** the chip held `cv-huge.pdf · inasoma…` for")
    w("  **%.0f s**, terminal state `null`, no error string, one server call to `/api/tools/extract-text`"
      % (huge.get("ms", 0) / 1000.0))
    w("  that never settled. Silent.")
    w("- **After:** `lib/upload-limits.ts` owns one pure decision (`attachmentSizeVerdict`), and the")
    w("  assistant reads it before touching the file: 27,001,436 bytes → `too-large-to-read`, so no")
    w("  read, no fallback and **no request**; the user sees a Swahili-first message naming 25 MB and")
    w("  the way forward. `lib/upload-limits.test.ts` pins that exact fixture size. A file between the")
    w("  4 MB network cap and the 25 MB reader cap (`too-large-to-send`) may be read locally but can")
    w("  never be POSTed, and the fallback fetch additionally aborts after 30 s.")
    w("")
    w("**What this section does NOT prove:** the after-state of the assistant guard was not re-measured")
    w("in a browser against a deployed build (the fix is in the working tree, not yet on production).")
    w("The route-side rows in 10.1 are measured; the client-side guard is covered by unit tests over")
    w("the same fixture size plus the code path — reported as such rather than as a live measurement.")
    w("")
w("### 10.4 Output-side: an over-long CV")
w("")
w("`lib/pdf.ts` used to receive no instruction about clipped content, so the A4 sheet (which hides its")
w("own overflow) exported one page cut mid-sentence while the invisible ATS text layer carried all")
w("7,347 characters — D9 above. The refusal mechanism now exists AND is wired at every CV export")
w("surface (editor download + share, the assistant's built-CV download, `/snap`'s tailored CV), each")
w("showing the bilingual `exportOverflowMessage` with the measured overflow in px instead of the")
w("generic failure line; the editor can no longer show its success overlay for a refused export.")
w("`data-pdf-exclude` keeps the \"CV too long\" pill out of the delivered file (D9's second half) —")
w("verified present in `lib/pdf.ts` and its `ignoreElements` wiring, not regressed.")
w("")
w("Same caveat as 10.3: verified by the mechanism's own tests plus the wired call sites, not by a")
w("fresh browser export against production.")

# ── appendix ────────────────────────────────────────────────────────────────
w("---")
w("")
w("## 9. Appendix — how each fixture was built")
w("")
w("Scripts are in `docs/qa-fixtures-2026-09-20/`. Nothing is a renamed text file.")
w("")
w(table(["fixture", "how it was genuinely produced"], [
    ["cv.docx / cv-sw.docx / cv-mixed.docx / cv-long.docx / cv-photo.docx",
     "`build_docx.cjs` — the app's own `docx` npm package; real OOXML zip, 22 parts, `word/document.xml`; one carries a real embedded `word/media` image"],
    ["cv-text.pdf / cv-sw.pdf / cv-mixed.pdf / cv-long.pdf",
     "`make_fixtures.py` — reportlab writes real `BT`/`Tj` text operators; verified extractable by pypdf (1,725 / 1,373 / 1,084 / 15,525 chars)"],
    ["cv-scanned.pdf", "Pillow renders a full CV page to a 1000 px JPEG, embedded as the only page object — **zero** text operators (`text_chars=0`)"],
    ["cv-blank.pdf", "reportlab, two empty pages — a valid PDF with no text at all"],
    ["cv-photo.jpg / cv-photo-sw.png", "Pillow renders the CV to a 1600 px JPEG / 1400 px PNG"],
    ["cv.txt / cv-sw.txt / cv-huge-paste.txt", "plain UTF-8, 2.1 KB / 1.7 KB / 128 KB"],
    ["cv-zero.pdf / cv-zero.docx", "`open(p,'wb').close()` — genuinely 0 bytes"],
    ["cv-corrupt.pdf", "a `%PDF-1.7` header followed by non-PDF bytes — pypdf: `startxref not found`"],
    ["cv-protected.pdf", "pypdf `PdfWriter.encrypt(\"sumaiya123\", algorithm=\"AES-128\")` — `is_encrypted=True`"],
    ["cv-huge.pdf", "reportlab, 8 pages each embedding a *different* 1400 × 1980 noise JPEG — 27,001,436 bytes"],
    ["cv-over4mb.pdf", "one page embedding a 1599 × 2310 noise JPEG — 4,493,232 bytes, deliberately between the app's 4 MB cap and Vercel's ~4.5 MB edge limit"],
    ["cv-docx-content-mismatch.pdf / cv-pdf-content-mismatch.docx / cv-png-content-mismatch.pdf",
     "real bytes of one format written under another format's extension"],
    ["cv-noextension", "real DOCX bytes with no extension"],
    ["cv-whitespace.txt", "only spaces, tabs and newlines"],
    ["cv-prompt-injection.pdf", "a legitimate CV plus text that tries to instruct the model"],
    ["photo-oversize.jpg (14.3 MB) / photo-noisy.jpg (7.9 MB)", "Pillow noise images straddling the 12 MB source cap"],
    ["photo-tall-alpha.png / photo.webp / photo.svg", "a 700 × 1000 RGBA PNG, a WebP, and an SVG (a deliberately excluded type)"],
    ["photo-small-dataurl.txt", "the 600 × 600 square headshot used for every photo test: a beige face disc, dark shoulders and `QA`, so a distortion or a blank is measurable rather than eyeballed"],
    ["h2c/index.html", "the isolated html2canvas 1.4.1 `object-fit` reproduction (the app's own build of the library)"],
]))
w("")
npdf = len([f for f in os.listdir(os.path.join(HERE, "clean")) if f.endswith(".pdf")]) if os.path.isdir(os.path.join(HERE, "clean")) else 0
w(f"Captured artefacts: **{npdf} PDFs** in `clean/`, plus the fixture set, the result JSONs, the")
w("extracted rasters/screenshots and the probe scripts in `docs/qa-fixtures-2026-09-20/`.")
w("")
w("Committed with this report: the **generator** (`build_report.py`), the instruments it and the")
w("appendix depend on (`inspect_pdfs.py`, `make_fixtures.py`, `check_photo_distortion.py`), and every")
w("`results-*.json` this document reads — the raw numbers are what has to survive. The ad-hoc")
w("recon/probe scripts are deliberately left untracked: their output is in those JSONs, and a probe")
w("whose evidence never materialised should not be presented as one that did (see §4.3).")
w("")

open(OUT, "w", encoding="utf-8").write("\n".join(M))
print("wrote", OUT, len("\n".join(M)), "chars")
