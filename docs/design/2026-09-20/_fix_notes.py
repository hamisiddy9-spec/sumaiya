import pathlib
import re

base = pathlib.Path(__file__).parent

# ── 1 · the jobs mockup's now-false "feed is empty" note ────────────────────
p = base / "_build_part2.py"
s = p.read_text(encoding="utf-8")
pat = re.compile(r'\{note\("HONEST LIMIT . jobs-screen\.tsx:130.137".*?§9\)\.?\s*</p>"\)\}', re.S)
NEW = (
    '{note("CORRECTED ON THE LIVE DEVICE &middot; 2026-09-20",'
    '"</p>this feed is NOT empty &mdash; the earlier claim was wrong",'
    '"<p>An earlier draft of this page said the feed was empty in production, on the strength of "'
    '"<code>AREAS-AND-PARITY-2026-09-20.md</code> &sect;9. A capture of the running APK contradicts it: "'
    '"the feed is populated with real postings &mdash; <i>Sales Officer</i> (CCBRT), <i>Head of "'
    '"Marketing</i> (Ramada Resort by Wyndham Dar Es Salaam), <i>Loan officer with driving skills</i> "'
    '"(Hope Microcredit), <i>Senior Manager Credit</i> and <i>Manager IT Branches Supports</i> "'
    '"(CRDB Bank), <i>Loan Officer and Collection Officer</i> (Simplepay Capital) &mdash; each with "'
    '"<b>Lenga CV yangu</b> and <b>Fungua tangazo</b>. See <code>_device/device-07-jobs-live.png</code>.</p>"'
    '"<p>What the capture also shows: <b>not one card carried a match score</b>, because the account has "'
    '"no career profile yet, so every posting fell into <i>Nafasi zote za kazi</i> rather than "'
    '"<i>Zinazoendana na wasifu wako</i>. The unmatched list is the default for a new user &mdash; which is "'
    '"why the quiet status line and the profile nudge matter more than the badge.</p>")}'
)
s2, n = pat.subn(NEW, s)
print("jobs note replaced:", n)

# ── 2 · the real APK tab labels, from the live device a11y dump ─────────────
old_tabs = 'TABS = [("home","Nyumbani"),("file-text","CV"),("chat","Sumaiya"),("camera","Pakia"),("user","Wasifu")]'
new_tabs = (
    "# The APK's REAL tab labels, read off the live device 2026-09-20\n"
    "# (a11y dump, 1344x2992 @ density 408): Nyumbani / CV zangu / Sumaiya / Pakia / Wasifu\n"
    'TABS = [("home","Nyumbani"),("file-text","CV zangu"),("chat","Sumaiya"),'
    '("camera","Pakia"),("user","Wasifu")]'
)
s2 = s2.replace(old_tabs, new_tabs)
print("tab label patched:", "CV zangu" in s2)
if n or "CV zangu" in s2:
    p.write_text(s2, encoding="utf-8")

b = base / "_build_mockups.py"
t = b.read_text(encoding="utf-8")
t = t.replace(
    'TABS = [("home","Nyumbani"),("file-text","CV"),("chat","Sumaiya"),("camera","Pakia"),("user","Wasifu")]',
    "# Real APK tab labels, from the live device a11y dump 2026-09-20:\n"
    "# Nyumbani / CV zangu / Sumaiya / Pakia / Wasifu\n"
    'TABS = [("home","Nyumbani"),("file-text","CV zangu"),("chat","Sumaiya"),'
    '("camera","Pakia"),("user","Wasifu")]')
b.write_text(t, encoding="utf-8")
print("builder tabs patched:", "CV zangu" in t)

# ── 3 · the quick-action label the device showed is "Ukaguzi wa ATS" ───────
r = base / "_build_part2.py"
u = r.read_text(encoding="utf-8")
u = u.replace('qa("shield","Ukaguzi wa CV","var(--success)","well well--success")',
              'qa("shield","Ukaguzi wa ATS","var(--success)","well well--success")')
r.write_text(u, encoding="utf-8")
print("quick action label patched:", "Ukaguzi wa ATS" in u)
