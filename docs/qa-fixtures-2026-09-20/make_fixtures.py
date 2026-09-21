#!/usr/bin/env python
"""Build REAL test fixtures for the Sumaiya IO matrix QA.

Every fixture is a genuine file of its format:
  - PDFs are produced by reportlab (real text operators / real embedded images)
  - DOCX is produced by the `docx` npm package via build_docx.mjs (real OOXML zip)
  - JPEG/PNG are produced by Pillow from rendered text
Nothing here is a renamed file except the two deliberate MIME-lie fixtures,
which are named *_mismatch.*
"""
import os, io, sys
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from PIL import Image, ImageDraw, ImageFont

OUT = os.path.dirname(os.path.abspath(__file__))

FONT_CANDIDATES = [
    r"C:\Windows\Fonts\arial.ttf",
    r"C:\Windows\Fonts\calibri.ttf",
    r"C:\Windows\Fonts\segoeui.ttf",
]
FONT_PATH = next((f for f in FONT_CANDIDATES if os.path.exists(f)), None)
FONT_BOLD = next((f for f in [r"C:\Windows\Fonts\arialbd.ttf", r"C:\Windows\Fonts\calibrib.ttf",
                              r"C:\Windows\Fonts\segoeuib.ttf"] if os.path.exists(f)), FONT_PATH)
print("font:", FONT_PATH, "| bold:", FONT_BOLD)

EN_CV = {
    "name": "Amina Joseph Mwakasege",
    "title": "Software Engineer",
    "contact": "amina.mwakasege@example.co.tz | +255 712 345 678 | Dar es Salaam, Tanzania | linkedin.com/in/aminamwakasege",
    "summary": ("Software engineer with 6 years building payment and logistics platforms across East Africa. "
                "Led a team of four that cut settlement reconciliation time from 9 hours to 40 minutes. "
                "Comfortable across TypeScript, Postgres and AWS; strong on reliability and cost control."),
    "experience": [
        ("Senior Software Engineer", "Nala Payments", "Dar es Salaam, Tanzania", "Mar 2022 - Present",
         ["Rebuilt the merchant settlement ledger, cutting reconciliation time from 9h to 40min.",
          "Owned the uptime budget; raised availability from 99.2% to 99.95% over 18 months.",
          "Mentored four engineers and ran the weekly reliability review."]),
        ("Software Engineer", "Selcom", "Dar es Salaam, Tanzania", "Jul 2019 - Feb 2022",
         ["Shipped USSD and mobile-money integrations for 3 partner banks.",
          "Reduced the bill-payment API p95 from 2.4s to 380ms by adding a Redis read path."]),
        ("Junior Developer", "Tanzania Education Trust", "Morogoro, Tanzania", "Aug 2018 - Jun 2019",
         ["Built a school-fees tracking tool used by 42 schools."]),
    ],
    "education": [
        ("BSc", "Computer Science", "University of Dar es Salaam", "2014 - 2018", "Upper Second"),
        ("Certificate", "Project Management", "Institute of Finance Management", "2020", "Distinction"),
    ],
    "skills": ["TypeScript", "Node.js", "PostgreSQL", "AWS", "Docker", "Terraform", "Kafka", "React", "Go"],
    "languages": [("Swahili", "Native"), ("English", "Fluent"), ("French", "Basic")],
    "certifications": [("AWS Solutions Architect Associate", "Amazon Web Services", "2023"),
                       ("Certified Scrum Master", "Scrum Alliance", "2021")],
    "projects": [("Boda Route Optimiser", "Lead Developer", "2021",
                  "Open-source route planner for motorcycle couriers in Dar es Salaam."),
                 ("Fee Tracker", "Creator", "2019", "School-fees reconciliation tool for 42 schools.")],
    "referees": [("Dr. Neema Kimaro", "Head of Engineering", "Nala Payments", "neema.kimaro@example.co.tz", "+255 754 111 222"),
                 ("Mr. Baraka Mushi", "CTO", "Selcom", "baraka.mushi@example.co.tz", "+255 786 333 444")],
    "hobbies": "Long-distance running, chess, and Swahili literature.",
}

# Swahili CV — includes ng' apostrophes and long agglutinated words.
SW_CV = {
    "name": "Juma Hamisi Chang'ombe",
    "title": "Mhandisi wa Programu",
    "contact": "juma.chang'ombe@example.co.tz | +255 715 998 877 | Ubungo, Dar es Salaam",
    "summary": ("Mhandisi wa programu mwenye uzoefu wa miaka saba katika kujenga mifumo ya malipo na "
                "usimamizi wa taarifa kwa taasisi za kifedha Tanzania. Nimeliongoza timu ya watu watano "
                "kutengeneza mfumo unaotumika na wateja elfu hamsini. Nina ujuzi wa kompyuta, "
                "uchanganuzi wa taarifa na utawala wa mifumo."),
    "experience": [
        ("Mhandisi Mkuu wa Programu", "Benki ya NMB", "Dar es Salaam", "Januari 2021 - Hadi sasa",
         ["Nilijenga mfumo wa malipo wa kimataifa unaotumika na wateja elfu hamsini.",
          "Nilipunguza muda wa kuhakiki malipo kutoka saa nane hadi dakika arobaini.",
          "Nilifundisha wafanyakazi wapya wanne kuhusu usalama wa mifumo."]),
        ("Mhandisi wa Programu", "Vodacom Tanzania", "Dar es Salaam", "Machi 2018 - Desemba 2020",
         ["Nilitengeneza programu za simu za mkononi kwa ajili ya wakulima wa ng'ombe na mifugo.",
          "Niliboresha kasi ya mfumo kutoka sekunde mbili hadi milisekunde mia tatu."]),
    ],
    "education": [("Shahada ya Kwanza", "Sayansi ya Kompyuta", "Chuo Kikuu cha Dar es Salaam", "2012 - 2016", "Daraja la Pili")],
    "skills": ["Uhandisi wa Programu", "Usimamizi wa Hifadhidata", "Uchanganuzi wa Taarifa", "Usalama wa Mitandao"],
    "languages": [("Kiswahili", "Lugha ya Mama"), ("Kiingereza", "Vizuri")],
    "certifications": [("Uthibitisho wa Usalama wa Mtandao", "Taasisi ya Teknolojia", "2022")],
    "projects": [("Mfumo wa Ng'ombe", "Mtengenezaji", "2019", "Mfumo wa kufuatilia mifugo na mazao kwa wakulima wadogo.")],
    "referees": [("Dkt. Mwajuma Salum", "Mkuu wa Idara", "NMB", "mwajuma.salum@example.co.tz", "+255 713 555 666")],
    "hobbies": "Kuendesha baiskeli, kusoma vitabu vya Kiswahili na kufundisha vijana programu.",
}

# Mixed Swahili/English
MIXED_CV = dict(SW_CV)
MIXED_CV["name"] = "Grace Nyambura Mugo"
MIXED_CV["title"] = "Data Analyst / Mchanganuzi wa Taarifa"
MIXED_CV["summary"] = ("Data analyst with 5 years in fintech. Ninajua Python, SQL na Power BI vizuri. "
                       "Nilijenga dashibodi zinazotumiwa na timu ya mauzo kila siku. "
                       "Strong on storytelling with data; nina uzoefu wa kufundisha wengine.")
MIXED_CV["experience"] = [
    ("Data Analyst", "CRDB Bank", "Dar es Salaam", "2020 - Present",
     ["Built the executive dashboard used daily by the sales team.",
      "Nilipunguza muda wa kuripoti kutoka siku tatu hadi saa moja."]),
    ("Business Intelligence Intern", "Tigo Tanzania", "Mwanza", "2019 - 2020",
     ["Automated weekly reporting kwa kutumia SQL na Excel macros."]),
]
MIXED_CV["hobbies"] = "Blogging about data careers, na kupanda milima."


def lines_for(cv, kind="text"):
    L = [cv["name"], cv["title"], cv["contact"], ""]
    L += ["PROFESSIONAL SUMMARY", cv["summary"], ""]
    L += ["EXPERIENCE"]
    for pos, org, loc, period, bullets in cv["experience"]:
        L.append(f"{pos} | {org} | {loc} | {period}")
        L += [f"- {b}" for b in bullets]
        L.append("")
    L += ["EDUCATION"]
    for deg, fld, inst, period, grade in cv["education"]:
        L.append(f"{deg} {fld} | {inst} | {period} | {grade}")
    L.append("")
    L += ["SKILLS", " • ".join(cv["skills"]), ""]
    L += ["LANGUAGES", " • ".join(f"{n} ({p})" for n, p in cv["languages"]), ""]
    L += ["CERTIFICATIONS"]
    for n, i, d in cv["certifications"]:
        L.append(f"- {n} | {i} | {d}")
    L.append("")
    L += ["PROJECTS"]
    for n, r, d, desc in cv["projects"]:
        L += [f"{n} | {r} | {d}", f"- {desc}"]
    L.append("")
    L += ["REFEREES"]
    for n, t, c, e, ph in cv["referees"]:
        L += [f"{n} | {t}, {c}", f"{e} | {ph}"]
    L.append("")
    L += ["INTERESTS", cv["hobbies"]]
    return L


def wrap(text, maxchars):
    words, out, cur = text.split(), [], ""
    for w in words:
        if len(cur) + len(w) + 1 > maxchars:
            out.append(cur); cur = w
        else:
            cur = (cur + " " + w).strip()
    if cur:
        out.append(cur)
    return out


def make_text_pdf(path, cv, title, repeat=1):
    """A real text-layer PDF: reportlab writes BT/Tj text operators."""
    c = canvas.Canvas(path, pagesize=A4)
    W, H = A4
    y = H - 20 * mm
    c.setTitle(title)
    lines = lines_for(cv)
    if repeat > 1:  # deliberately over-long document
        lines = lines * repeat
    for i, ln in enumerate(lines):
        if y < 18 * mm:
            c.showPage(); y = H - 20 * mm
        wrapped = wrap(ln, 96) if ln else [""]
        for w in wrapped:
            if y < 18 * mm:
                c.showPage(); y = H - 20 * mm
            bold = ln in (cv["name"],) or (ln.isupper() and len(ln) < 40)
            c.setFont("Helvetica-Bold" if bold else "Helvetica", 13 if ln == cv["name"] else (10 if bold else 9))
            c.drawString(20 * mm, y, w)
            y -= 12 if ln else 8
    c.save()
    return os.path.getsize(path)


def make_blank_pdf(path, pages=2):
    """A valid PDF with NO extractable text at all (blank white pages)."""
    c = canvas.Canvas(path, pagesize=A4)
    for _ in range(pages):
        c.showPage()
    c.save()
    return os.path.getsize(path)


def render_cv_image(cv, w=1000, path=None, bg="white", fg="black"):
    """Render a CV page to an image of a fixed pixel size."""
    h = int(w * 1.414)
    img = Image.new("RGB", (w, h), bg)
    d = ImageDraw.Draw(img)
    fh = max(14, w // 46)
    big = ImageFont.truetype(FONT_BOLD, int(fh * 1.7))
    bf = ImageFont.truetype(FONT_BOLD, int(fh * 1.05))
    nf = ImageFont.truetype(FONT_PATH, fh)
    x, y = int(w * 0.06), int(h * 0.045)
    step = int(fh * 1.32)
    lines = lines_for(cv)
    for ln in lines:
        if y > h - step * 2:
            break
        if not ln:
            y += step // 2; continue
        wrapped = wrap(ln, int((w * 0.88) / (fh * 0.52)))
        first = True
        for wl in wrapped:
            if y > h - step * 2: break
            if ln == cv["name"] and first:
                d.text((x, y), wl, font=big, fill=fg)
            elif ln.isupper() and len(ln) < 40:
                d.text((x, y), wl, font=bf, fill=fg)
            else:
                d.text((x, y), wl, font=nf, fill=fg)
            y += step; first = False
    if path:
        img.save(path)
    return img


def make_image_only_pdf(path, cv):
    """Scanned-looking PDF: pages are embedded JPEGs, zero text operators."""
    img = render_cv_image(cv)
    tmp = path + ".jpg"
    img.save(tmp, "JPEG", quality=72)
    c = canvas.Canvas(path, pagesize=A4)
    W, H = A4
    c.drawImage(tmp, 0, 0, width=W, height=H)
    c.showPage()
    c.save()
    os.remove(tmp)
    return os.path.getsize(path)


def make_huge_pdf(path, target_mb=27):
    """A PDF bigger than the 25 MB client-side cap.

    Real mechanism: N pages, each embedding a DIFFERENT high-quality noise JPEG,
    so reportlab cannot share one image object and the file genuinely reaches
    the target size. Nothing is padded with junk bytes."""
    import random
    W, H = A4
    # one big noise JPEG, unique per page, so each page carries its own stream
    page_mb = 3.2
    per_page = max(2, int(round(target_mb / page_mb)))
    c = canvas.Canvas(path, pagesize=A4)
    for p in range(per_page):
        im = Image.frombytes("RGB", (1400, 1980), bytes(random.getrandbits(8) for _ in range(1400 * 1980 * 3)))
        tmp = f"{path}.p{p}.jpg"
        im.save(tmp, "JPEG", quality=92)
        c.drawImage(tmp, 0, 0, width=W, height=H)
        c.showPage()
        os.remove(tmp)
    c.save()
    return os.path.getsize(path)


def main():
    n = {}
    n["cv-text.pdf"] = make_text_pdf(os.path.join(OUT, "cv-text.pdf"), EN_CV, "Amina Mwakasege CV")
    n["cv-sw.pdf"] = make_text_pdf(os.path.join(OUT, "cv-sw.pdf"), SW_CV, "Juma Chang'ombe CV")
    n["cv-mixed.pdf"] = make_text_pdf(os.path.join(OUT, "cv-mixed.pdf"), MIXED_CV, "Grace Mugo CV")
    n["cv-long.pdf"] = make_text_pdf(os.path.join(OUT, "cv-long.pdf"), EN_CV, "Long CV", repeat=9)
    n["cv-blank.pdf"] = make_blank_pdf(os.path.join(OUT, "cv-blank.pdf"), 2)
    n["cv-scanned.pdf"] = make_image_only_pdf(os.path.join(OUT, "cv-scanned.pdf"), EN_CV)

    # text file
    tp = os.path.join(OUT, "cv.txt")
    with open(tp, "w", encoding="utf-8") as f:
        f.write("\n".join(lines_for(EN_CV)))
    n["cv.txt"] = os.path.getsize(tp)

    tp = os.path.join(OUT, "cv-sw.txt")
    with open(tp, "w", encoding="utf-8") as f:
        f.write("\n".join(lines_for(SW_CV)))
    n["cv-sw.txt"] = os.path.getsize(tp)

    # very long paste source (used for the paste tests, pasted from here)
    lp = os.path.join(OUT, "cv-huge-paste.txt")
    with open(lp, "w", encoding="utf-8") as f:
        f.write("\n".join(lines_for(EN_CV, "text") * 60))
    n["cv-huge-paste.txt"] = os.path.getsize(lp)

    # real photos of a CV
    render_cv_image(EN_CV, w=1600, path=os.path.join(OUT, "cv-photo.jpg"), bg="white") \
        if False else render_cv_image(EN_CV, w=1600, path=os.path.join(OUT, "cv-photo.jpg"))
    n["cv-photo.jpg"] = os.path.getsize(os.path.join(OUT, "cv-photo.jpg"))
    render_cv_image(SW_CV, w=1400, path=os.path.join(OUT, "cv-photo-sw.png"))
    n["cv-photo-sw.png"] = os.path.getsize(os.path.join(OUT, "cv-photo-sw.png"))

    # zero-byte + corrupt + mismatch + protected
    p = os.path.join(OUT, "cv-zero.pdf")
    open(p, "wb").close(); n["cv-zero.pdf"] = 0

    p = os.path.join(OUT, "cv-corrupt.pdf")
    with open(p, "wb") as f:
        f.write(b"%PDF-1.7\n" + b"garbage not a real pdf " * 500 + b"\n%%EOF")
    n["cv-corrupt.pdf"] = os.path.getsize(p)

    p = os.path.join(OUT, "cv-zero.docx")
    open(p, "wb").close(); n["cv-zero.docx"] = 0

    # password-protected
    from pypdf import PdfReader, PdfWriter
    r = PdfReader(os.path.join(OUT, "cv-text.pdf"))
    w = PdfWriter()
    for pg in r.pages:
        w.add_page(pg)
    w.encrypt("sumaiya123", algorithm="AES-128")
    with open(os.path.join(OUT, "cv-protected.pdf"), "wb") as f:
        w.write(f)
    n["cv-protected.pdf"] = os.path.getsize(os.path.join(OUT, "cv-protected.pdf"))

    # huge pdf
    n["cv-huge.pdf"] = make_huge_pdf(os.path.join(OUT, "cv-huge.pdf"), 27)

    print("BUILT:")
    for k, v in sorted(n.items()):
        print(f"  {k:24s} {v:>10,} bytes")


if __name__ == "__main__":
    main()
