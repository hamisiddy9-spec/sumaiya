# -*- coding: utf-8 -*-
"""Page bodies for the Sumaiya 2026 redesign mockups. Imported by _build_mockups.py."""
import html as _h


def build(g):
    ico, mark, phone, note, doc, write = g["ico"], g["mark"], g["phone"], g["note"], g["doc"], g["write"]

    # ═══════════════════════════════════════════════════════════════════════
    # HOME — before / after
    # ═══════════════════════════════════════════════════════════════════════
    def qa(icon, label, tint="var(--ember)", well="well"):
        # Compact row tile: icon well + one-line label, 60px tall. The old grid
        # tile was 104px; six of them cost 336px of a 844px screen — more than a
        # whole job card (design system §5.4: density beats decoration).
        return (f'<div class="card pressable row" style="flex:1 1 0;min-height:60px;padding:10px 12px;gap:10px">'
                f'<div class="{well}" style="width:30px;height:30px;border-radius:9px">{ico(icon,16)}</div>'
                f'<div class="r-bodysmall truncate" style="font-weight:700;font-size:13.5px">{label}</div>'
                f'</div>')

    home_before = f'''
<div class="scroll">
  <div style="margin:8px 0 20px">
    <div class="eyebrow" style="margin-bottom:2px">Habari za asubuhi,</div>
    <div class="r-screen">Asha</div>
  </div>

  <div class="card pad arrive" style="background:var(--ember-tint);border-color:#F6C9B6;display:flex;gap:12px;align-items:center">
    <div class="well" style="width:38px;height:38px;border-radius:11px">{ico("grid",18)}</div>
    <div class="grow">
      <div class="r-micro muted">TemplateHub</div>
      <div class="r-body" style="font-weight:700;margin-top:2px">Miundo 224 kwa kila nyaraka</div>
      <div class="r-caption muted" style="margin-top:2px">Miundo halisi na makusanyo ya premium, yanayolingana na uwanja wako.</div>
    </div>
    <div class="stack" style="align-items:flex-end;gap:10px">
      {ico("refresh",16,"var(--text-muted)")}
      <div class="row-tight" style="gap:2px">
        <span style="color:var(--ember-text);font-size:12.5px;font-weight:800">Gundua</span>
        {ico("chevron",18,"var(--ember)")}
      </div>
    </div>
  </div>

  <div class="row g12" style="margin-top:24px;align-items:stretch">
    <div class="card pad stack" style="flex:1;min-height:116px;justify-content:space-between">
      {ico("file-text",18,"var(--ember)")}
      <div><div class="r-stat">3</div><div class="r-caption muted">CV zako</div></div>
    </div>
    <div class="card pad stack" style="flex:1;min-height:116px;justify-content:space-between;background:var(--ember);border-color:transparent">
      {ico("plus",18,"var(--cream)")}
      <div>
        <div class="r-section" style="color:var(--cream);font-size:18px">Jenga CV yako</div>
        <div style="color:var(--cream);opacity:.9;font-size:12px;font-weight:600">Tumia wasifu kuanza →</div>
      </div>
    </div>
  </div>

  <div class="sec-head"><div class="r-section">Shughuli za haraka</div></div>
  <div class="stack g12">
    <div class="row g12">{qa("file-text","AI ya kazi")}{qa("target","Tafuta kazi","var(--pine)","well well--pine")}</div>
    <div class="row g12">{qa("shield","Ukaguzi wa ATS","var(--success)","well well--success")}{qa("briefcase","Maombi")}</div>
    <div class="row g12">{qa("mail","Barua ya maombi","var(--warning)","well well--gold")}{qa("grid","TemplateHub")}</div>
  </div>

  <div class="sec-head"><div class="r-section">CV za hivi karibuni</div><div class="act">Ona zote</div></div>
  <div class="stack g12">
    <div class="card pad" style="display:flex;gap:12px;align-items:center">
      <div class="sk" style="width:42px;height:42px;border-radius:12px"></div>
      <div class="grow"><div class="sk sk-line w60"></div><div class="sk sk-line w40" style="margin:0"></div></div>
    </div>
    <div class="card pad" style="display:flex;gap:12px;align-items:center">
      <div class="sk" style="width:42px;height:42px;border-radius:12px"></div>
      <div class="grow"><div class="sk sk-line w80"></div><div class="sk sk-line w40" style="margin:0"></div></div>
    </div>
  </div>
</div>'''

    home_after = f'''
<div class="scroll">
  <div style="margin:8px 0 20px">
    <div class="eyebrow" style="margin-bottom:2px">Habari za asubuhi,</div>
    <div class="r-screen">Asha</div>
  </div>

  <div class="card pad arrive arrive-1" style="border-left:3px solid var(--ember);display:flex;flex-direction:column;gap:12px">
    <div class="row-tight">
      <span class="badge badge--ember">{ico("target",12)} Ulinganifu 78%</span>
      <span class="r-caption muted">Nafasi 3 mpya</span>
    </div>
    <div>
      <div class="r-body" style="font-weight:800;font-size:15.5px">Mhasibu, Dar es Salaam</div>
      <div class="r-caption muted" style="margin-top:2px">Azania Bank · Ajira kamili · Inakufaa zaidi ya nafasi nyingi</div>
    </div>
    <div class="row g8">
      <div style="flex:1"><button class="btn btn--primary btn--sm btn--block">Lenga CV yako</button></div>
      <button class="btn btn--secondary btn--sm">{ico("eye",15)} Angalia</button>
    </div>
  </div>

  <div class="card pad arrive arrive-2" style="margin-top:12px;display:flex;gap:12px;align-items:center;background:var(--sand-2);border-color:var(--border)">
    <div class="well well--success" style="width:30px;height:30px;border-radius:9px">{ico("cloud",16)}</div>
    <div class="grow">
      <div class="r-bodysmall" style="font-weight:700">Kila kitu kimehifadhiwa</div>
      <div class="r-caption muted">CV zako 3 ziko kwenye akaunti yako.</div>
    </div>
    <span class="savepill savepill--saved">{ico("check",12)} Sasa</span>
  </div>

  <div class="row g12 arrive arrive-3" style="margin-top:24px;align-items:stretch">
    <div class="card pad stack pressable" style="flex:1;min-height:112px;justify-content:space-between">
      {ico("file-text",18,"var(--ember)")}
      <div><div class="r-stat">3</div><div class="r-caption muted">CV zako</div></div>
    </div>
    <div class="card pad stack pressable" style="flex:1;min-height:112px;justify-content:space-between;background:var(--ember);border-color:transparent">
      {ico("plus",18,"var(--cream)")}
      <div>
        <div style="color:var(--cream);font-size:16px;font-weight:800;font-family:var(--font-display);line-height:20px">Jenga CV yako</div>
        <div style="color:var(--cream);opacity:.92;font-size:12px;font-weight:600;margin-top:2px">Tumia wasifu →</div>
      </div>
    </div>
  </div>

  <div class="sec-head"><div class="r-section">Shughuli za haraka</div></div>
  <div class="arrive arrive-3">
    <div class="row g12">{qa("target","Tafuta kazi","var(--pine)","well well--pine")}{qa("grid","Miundo 224")}</div>
    <div class="row g12" style="margin-top:8px">{qa("shield","Ukaguzi wa ATS","var(--success)","well well--success")}{qa("briefcase","Maombi")}</div>
    <div class="row g12" style="margin-top:8px">{qa("mail","Barua ya maombi","var(--warning)","well well--gold")}{qa("chat","Ongea na Sumaiya".replace("Ongea na Sumaiya","Sumaiya"))}</div>
  </div>

  <div class="sec-head"><div class="r-section">Nafasi mpya za kazi</div><div class="act">Ona zote</div></div>
  <div class="arrive arrive-4">
    <div class="card pad-row" style="display:flex;gap:12px;align-items:center">
      <div class="well well--pine" style="width:38px;height:38px;border-radius:11px">{ico("building",18)}</div>
      <div class="grow truncate">
        <div class="r-cardtitle truncate">Mhudumu wa duka</div>
        <div class="r-caption muted truncate">Nakumatt · Arusha · Siku 2</div>
      </div>
      <span class="badge badge--success">{ico("target",11)} 82%</span>
    </div>
    <div class="card pad-row" style="display:flex;gap:12px;align-items:center;margin-top:8px">
      <div class="well well--pine" style="width:38px;height:38px;border-radius:11px">{ico("building",18)}</div>
      <div class="grow truncate">
        <div class="r-cardtitle truncate">Karani wa mauzo</div>
        <div class="r-caption muted truncate">Vodacom · Mwanza · Siku 4</div>
      </div>
      <span class="badge badge--warn">{ico("target",11)} 61%</span>
    </div>
  </div>

  <div class="sec-head"><div class="r-section">CV za hivi karibuni</div><div class="act">Ona zote</div></div>
  <div class="arrive arrive-5">
    <div class="card pad-row" style="display:flex;gap:12px;align-items:center;opacity:1;transition:opacity var(--dur-base)">
      <div class="well" style="width:44px;height:44px;border-radius:12px">{ico("file-text",19)}</div>
      <div class="grow truncate">
        <div class="r-cardtitle truncate">CV ya Mhasibu 2026</div>
        <div class="r-caption muted">Ilibadilishwa leo</div>
      </div>
      {ico("chevron",18,"var(--text-muted)")}
    </div>
  </div>
</div>'''

    home_body = f'''
<div class="stage">
  <div style="flex:0 0 auto">
    <div class="r-micro muted" style="margin-bottom:8px;letter-spacing:.4px">Kabla · leo</div>
    {phone(home_before, active_tab=0)}
  </div>
  <div style="flex:0 0 auto">
    <div class="r-micro" style="margin-bottom:8px;letter-spacing:.4px;color:var(--ember)">Baada · pendekezo</div>
    {phone(home_after, active_tab=0)}
  </div>
  <div class="notes">
    {note("BEFORE · home-screen.tsx:304–363","The first card is an advertisement, not a job",
      "<p>The rotating hint slot mixes a genuine signal with the hardcoded TemplateHub promo "
      "(<code>home-screen.tsx:220–234</code>). On a first run the <em>first</em> thing a jobseeker "
      "reads on the main screen is an advert for 224 designs &mdash; a number this app shows a "
      "user who has not yet made one CV.</p>")}
    {note("BEFORE · home-screen.tsx:299–363","</p>Nothing states whether the work is saved",
      "<p>There is no sync/offline status anywhere on the screen. The app has "
      "<code>useOfflineSync()</code>, an offline queue and an <code>isOfflineOnly</code> flag "
      "(<code>cv-list-screen.tsx:171</code>) &mdash; and Home tells the user none of it. On a "
      "Tanzanian 3G connection the user cannot tell whether the CV they just wrote exists.</p>")}
    {note("BEFORE · home-screen.tsx:473–482 (audit N6, sev H)","</p>The skeleton does not hand off",
      "<p><code>{{loading &amp;&amp; cvs.length===0 ? &lt;SkeletonList/&gt; : …}}</code> unmounts the "
      "skeleton and mounts the list in the same frame. The watched slot blanks and the rows pop "
      "into it &mdash; the exact &ldquo;boom&rdquo; the motion standard forbids.</p>")}
  </div>
</div>
'''

    # ═══════════════════════════════════════════════════════════════════════
    # CV EDITOR
    # ═══════════════════════════════════════════════════════════════════════
    def field(label, value, hint=""):
        return (f'<div class="stack g4"><label class="r-caption" style="font-weight:700;color:var(--espresso)">{label}</label>'
                f'<div style="min-height:48px;border:1px solid var(--border-input);border-radius:var(--r-input-lg);'
                f'padding:12px 14px;background:var(--card);font-size:15px">{value or ""}</div>'
                + (f'<span class="r-caption muted">{hint}</span>' if hint else "") + '</div>')

    def section_card(title, icon, open_=True, count=""):
        inner = ""
        if open_:
            inner = f'''
      <div style="padding:0 16px 16px" class="stack g12">
        {field("Jina kamili","Asha Mwangi")}
        {field("Barua pepe","asha.mwangi@gmail.com")}
        {field("Simu","+255 712 445 118")}
        {field("Mahali","Dar es Salaam, Tanzania")}
      </div>'''
        return f'''
    <div class="card" style="margin-bottom:12px;overflow:hidden">
      <div class="row" style="padding:15px">
        <div class="well well--30" style="width:30px;height:30px;border-radius:9px">{ico(icon,16)}</div>
        <div class="r-body grow" style="font-weight:700;font-size:15.5px">{title}</div>
        {f'<span class="badge badge--muted">{count}</span>' if count else ""}
        {ico("chevron" if not open_ else "clock",18,"var(--text-muted)")}
      </div>{inner}
    </div>'''

    editor_after = f'''
<div class="scroll" style="padding-top:8px;display:flex;flex-direction:column;min-height:0">
  <div class="row" style="margin-bottom:12px">
    <div class="row-tight" style="color:var(--ember-text)">{ico("chevron",18)}<span class="r-bodysmall" style="font-weight:700">CV zako</span></div>
    <div class="grow"></div>
    <span class="savepill savepill--dirty">{ico("edit",12)} Hifadhi…</span>
  </div>
  <div class="r-screen" style="font-size:24px;margin-bottom:14px">CV ya Mhasibu</div>

  <div class="card pad" style="border-left:3px solid var(--success);display:flex;gap:12px;align-items:center;margin-bottom:12px">
    <div class="well well--success well--30" style="width:30px;height:30px;border-radius:9px">{ico("check",16)}</div>
    <div class="grow">
      <div class="r-bodysmall" style="font-weight:700">Hatua 3 kati ya 5 zimejazwa</div>
      <div class="r-caption muted">Ongeza uzoefu wa kazi ili CV ikamilike</div>
    </div>
    <div style="font-size:12.5px;font-weight:800;color:var(--success)">60%</div>
  </div>

  {section_card("Taarifa binafsi","user",True)}
  {section_card("Muhtasari wako","edit",False,"Bado")}
  {section_card("Uzoefu wa kazi","briefcase",False,"2")}
  {section_card("Elimu","file-text",False,"1")}
  {section_card("Ujuzi","target",False,"7")}
</div>
<div class="sticky-foot">
  <div class="row g8">
    <button class="btn btn--secondary btn--sm" style="flex:0 0 auto">{ico("eye",16)} Onyesha</button>
    <div style="flex:1"><button class="btn btn--primary btn--sm btn--block">{ico("download",16)} Pakua PDF</button></div>
  </div>
  <div class="r-micro muted" style="text-align:center;margin-top:8px;letter-spacing:0">
    Inahifadhiwa yenyewe kwenye akaunti yako
  </div>
</div>'''

    editor_rail = f'''
<div class="rail">
  <span class="chip on">Taarifa binafsi</span><span class="chip">Muhtasari</span>
  <span class="chip">Uzoefu</span><span class="chip">Elimu</span>
  <span class="chip">Ujuzi</span><span class="chip">Miundo</span>
</div>'''

    editor_body = f'''
<div class="stage">
  <div class="phone"><div class="phone__screen">
    <div class="phone__notch"></div>
    {g["statusbar"]()}
    <div class="app">
      <div style="display:flex;align-items:center;gap:12px;padding:12px 20px 10px">
        <div class="row-tight" style="color:var(--ember-text)">{ico("chevron",18)}<span class="r-bodysmall" style="font-weight:700">CV zako</span></div>
        <div class="grow"></div>
        <span class="savepill savepill--saved">{ico("check",12)} Imehifadhiwa</span>
      </div>
      <div style="padding:0 20px 10px">
        <div class="r-screen" style="font-size:24px">CV ya Mhasibu</div>
        <div class="r-caption muted" style="margin-top:2px">Mhasibu · Dar es Salaam · Miundo: Classic</div>
      </div>
      {editor_rail}
      <div class="scroll" style="padding-top:16px">
        <div class="card pad" style="border-left:3px solid var(--success);display:flex;gap:12px;align-items:center">
          <div class="well well--success" style="width:30px;height:30px;border-radius:9px">{ico("check",16)}</div>
          <div class="grow">
            <div class="r-bodysmall" style="font-weight:700">Hatua 3 kati ya 5 zimejazwa</div>
            <div class="r-caption muted">Ongeza uzoefu wa kazi ili CV ikamilike</div>
          </div>
          <div style="font-size:12.5px;font-weight:800;color:var(--success)">60%</div>
        </div>
        <div style="margin-top:12px">
        {section_card("Taarifa binafsi","user",True)}
        {section_card("Muhtasari wako","edit",False,"Bado")}
        {section_card("Uzoefu wa kazi","briefcase",False,"2")}
        {section_card("Elimu","file-text",False,"1")}
        {section_card("Ujuzi","target",False,"7")}
        </div>
      </div>
      <div class="sticky-foot">
        <div class="row g8">
          <button class="btn btn--secondary btn--sm" style="flex:0 0 auto">{ico("eye",16)} Onyesha</button>
          <div style="flex:1"><button class="btn btn--primary btn--sm btn--block">{ico("download",16)} Pakua PDF</button></div>
        </div>
        <div class="r-micro muted" style="text-align:center;margin-top:8px;letter-spacing:0">
          Inahifadhiwa yenyewe kwenye akaunti yako
        </div>
      </div>
    </div>
    {g["tabbar"](1)}
  </div></div>

  <div class="notes">
    {note("BEFORE · cv-editor-screen.tsx:26–73","</p>Finding the section you want costs scrolling a form",
      "<p>The editor is a stack of five collapsible cards with no way to jump. "
      "<code>Section</code> (line 26) is a disclosure, not navigation: to reach "
      "&ldquo;Ujuzi&rdquo; the user opens cards or scrolls. On a 5&quot; screen with a soft keyboard up, "
      "the editable area is roughly four rows tall.</p>")}
    {note("BEFORE · cv-editor-screen.tsx:96–98,499–507","</p>Dirty state is a word, never a signal",
      "<p><code>dirty</code> is tracked (line 98) and used to block an exit &mdash; but the user only "
      "learns their work is unsaved when they try to <em>leave</em>. There is no autosave and no "
      "persistent &ldquo;not saved yet&rdquo; indicator while they are still on the screen.</p>")}
    {note("BEFORE · cv-editor-screen.tsx:499–507","</p>Four controls fight for the top row",
      "<p>Back, sync pill, Preview pill and ATS pill all sit in the first 44px of a 20px-padded "
      "screen. The most-used action of a CV app &mdash; get the PDF out &mdash; is not in that row at all: "
      "it is <code>exporting</code>, driven from a footer that is only visible at the bottom of a "
      "long scroll.</p>")}
  </div>
</div>
'''

    # ═══════════════════════════════════════════════════════════════════════
    # JOBS FEED
    # ═══════════════════════════════════════════════════════════════════════
    def job_row(title, co, loc, score, when, tone="success", reason=None):
        bc = {"success":"badge--success","warn":"badge--warn","muted":"badge--muted"}[tone]
        r = (f'<div class="r-caption body" style="margin-top:6px;line-height:1.45">{reason}</div>'
             if reason else "")
        return f'''
    <div class="card" style="margin-bottom:10px;overflow:hidden">
      <div style="padding:14px 16px 12px">
        <div class="row" style="align-items:flex-start">
          <div class="grow">
            <div class="r-cardtitle" style="font-weight:800;font-size:15.5px">{title}</div>
            <div class="r-caption muted" style="margin-top:2px">{co} · {loc}</div>
          </div>
          <span class="badge {bc}">{ico("target",11)} Ulinganifu {score}%</span>
        </div>
        {r}
        <div class="row-tight" style="margin-top:8px;gap:10px">
          <span class="r-caption muted row-tight" style="gap:4px">{ico("clock",12)} {when}</span>
          <span class="r-caption muted row-tight" style="gap:4px">{ico("pin",12)} Mbali: siyo lazima</span>
        </div>
      </div>
      <div class="row g8" style="padding:0 16px 14px">
        <div style="flex:1"><button class="btn btn--primary btn--sm btn--block">Lenga CV yako</button></div>
        <div style="flex:1"><button class="btn btn--secondary btn--sm btn--block">Fungua tangazo</button></div>
      </div>
    </div>'''

    jobs_body = f'''
<div class="stage">
  {phone(f"""
<div class="scroll">
  <div style="margin:8px 0 14px">
    <div class="eyebrow" style="margin-bottom:2px">Ajira</div>
    <div class="r-screen">Nafasi za kazi kwako</div>
  </div>

  <div class="row g8" style="overflow:auto;margin-bottom:16px">
    <span class="chip" style="background:var(--ember-tint);border-color:var(--ember);color:var(--ember)">{ico("pin",14)} Karibu nami</span>
    <span class="chip">{ico("briefcase",14)} Ajira kamili</span>
    <span class="chip">Uzoefu: mdogo</span>
  </div>

  <div class="card pad arrive arrive-1" style="background:var(--sand-2);display:flex;gap:12px;align-items:center;margin-bottom:16px">
    <div class="well well--success" style="width:30px;height:30px;border-radius:9px">{ico("check",16)}</div>
    <div class="grow">
      <div class="r-bodysmall" style="font-weight:700">Nafasi 2 tu zinaendana nawe vizuri</div>
      <div class="r-caption muted">Ongeza ujuzi mmoja ili kupata nafasi zaidi</div>
    </div>
    {ico("chevron",18,"var(--text-muted)")}
  </div>

  <div class="sec-head"><div class="r-section">Zinazoendana na wasifu wako</div></div>
  <div class="arrive arrive-2">
  {job_row("Mhasibu","Azania Bank","Dar es Salaam",78,"Siku 1 iliyopita","success",
           "Unahesabu, Excel na uzoefu wa miaka 3 &mdash; vinavyolingana na tangazo.")}
  {job_row("Karani wa fedha","NMB","Dodoma",61,"Siku 3 zilizopita","warn",
           "Ujuzi wako wa Excel unatosha; hawataja QuickBooks.")}
  </div>

  <div class="sec-head" style="margin-top:24px"><div class="r-section">Nafasi zote za kazi</div></div>
  <div class="arrive arrive-3">
  {job_row("Mhudumu wa duka","Nakumatt","Arusha",44,"Siku 5 zilizopita","muted")}
  {job_row("Dereva wa gari","TBL","Mbeya",31,"Siku 6 zilizopita","muted")}
  </div>
</div>""")}
  <div class="notes">
    {note("BEFORE · jobs-screen.tsx:14–23","</p>&ldquo;82%&rdquo; means two unrelated things",
      "<p><code>MatchBadge</code> renders identically to the ATS-score badge on the ATS screen: same "
      "pill, same <code>score&gt;=60</code> green / <code>&gt;=35</code> amber thresholds. A user who "
      "has seen &ldquo;82%&rdquo; on an ATS check reads this as the same measurement. It is not &mdash; one is "
      "job fit, one is parsability.</p>")}
    {note("BEFORE · jobs-screen.tsx:44,120–122","</p>Every listing is the same height, so nothing is a priority",
      "<p>Matched and unmatched listings use the same card with the same weight; the only "
      "difference is a badge. A wall of equal cards gives the eye no entry point, which on a "
      "cheap phone with a slow scroll is where the user quits.</p>")}
    {note("BEFORE · jobs-screen.tsx:120 (audit N4, sev H)","</p>The skeleton is a hard swap",
      "<p><code>{{loading ? &lt;SkeletonList count=3&gt; : …}}</code> replaces the skeleton with the "
      "whole feed in one frame. Same class of defect as Home.</p>")}
    {note("CORRECTED ON THE LIVE DEVICE &middot; 2026-09-20","</p>this feed is NOT empty &mdash; the earlier claim was wrong",
      "<p>An earlier draft of this page said the feed was empty in production, on the strength of "
      "<code>AREAS-AND-PARITY-2026-09-20.md</code> &sect;9. A capture of the running APK contradicts it: "
      "the feed is populated with real postings &mdash; <i>Sales Officer</i> (CCBRT), <i>Head of Marketing</i> "
      "(Ramada Resort by Wyndham Dar Es Salaam), <i>Loan officer with driving skills</i> (Hope Microcredit), "
      "<i>Senior Manager Credit</i> and <i>Manager IT Branches Supports</i> (CRDB Bank), <i>Loan Officer and "
      "Collection Officer</i> (Simplepay Capital) &mdash; each with <b>Lenga CV yangu</b> and "
      "<b>Fungua tangazo</b>. See <code>_device/device-07-jobs-live.png</code>.</p>"
      "<p>What the capture also shows: <b>not one card carried a match score</b>, because the account has no "
      "career profile yet, so every posting fell into <i>Nafasi zote za kazi</i> rather than "
      "<i>Zinazoendana na wasifu wako</i>. The unmatched list is the default for a new user &mdash; which is why "
      "the quiet status line and the profile nudge matter more than the badge.</p>")}
  </div>
</div>
'''

    # ═══════════════════════════════════════════════════════════════════════
    # PROFILE
    # ═══════════════════════════════════════════════════════════════════════
    def lrow(icon, label, sub="", right="", danger=False, first=False):
        return f'''
  <div class="row" style="padding:14px 16px;{'border-top:1px solid var(--border)' if not first else ''}">
    <div class="well {'well--38' if not danger else ''}" style="width:38px;height:38px;border-radius:11px;
      {'background:#FBE9E1;color:var(--error)' if danger else ''}">{ico(icon,18)}</div>
    <div class="grow">
      <div class="r-body" style="font-weight:700;{'color:var(--error)' if danger else ''}">{label}</div>
      {f'<div class="r-caption muted">{sub}</div>' if sub else ""}
    </div>
    {f'<span class="r-caption muted">{right}</span>' if right else ""}
    {ico("chevron",18,"var(--text-muted)")}
  </div>'''

    profile_body = f'''
<div class="stage">
  {phone(f"""
<div class="scroll">
  <div class="r-screen" style="margin:8px 0 20px">Wasifu</div>

  <div class="card pad arrive arrive-1" style="display:flex;gap:14px;align-items:center">
    <div style="width:56px;height:56px;border-radius:18px;background:var(--ember);color:var(--cream);
      display:grid;place-items:center;font-family:var(--font-display);font-size:22px;font-weight:800">A</div>
    <div class="grow">
      <div class="r-cardtitle" style="font-size:16px">Asha Mwangi</div>
      <div class="r-caption muted">asha.mwangi@gmail.com</div>
    </div>
    <span class="badge badge--success">{ico("check",11)} Imethibitishwa</span>
  </div>

  <div class="card pad arrive arrive-2" style="margin-top:12px;border-left:3px solid var(--ember)">
    <div class="row-tight" style="margin-bottom:6px">
      <span class="badge badge--ember">{ico("target",11)} 60%</span>
      <span class="r-caption muted">Wasifu wa kazi</span>
    </div>
    <div class="r-bodysmall" style="font-weight:700">Ongeza uzoefu wa kazi mmoja</div>
    <div class="r-caption muted" style="margin-top:2px;margin-bottom:12px">
      Sumaiya anaoanisha ajira na ujuzi kwa kutumia haya. Bila uzoefu, ulinganifu unabaki chini.
    </div>
    <button class="btn btn--primary btn--sm btn--block">Kamilisha wasifu</button>
  </div>

  <div class="r-micro muted" style="margin:24px 0 8px">Taarifa zako</div>
  <div class="card">{lrow("user","Wasifu wa kazi","Ujuzi, uzoefu, malengo — ninatumia haya",first=True)}</div>

  <div class="r-micro muted" style="margin:24px 0 8px">Muonekano</div>
  <div class="card">
    {lrow("sparkle","Hali ya giza","", "Imewashwa", first=True)}
    {lrow("chat","Lugha","", "Kiswahili")}
  </div>

  <div class="r-micro muted" style="margin:24px 0 8px">Arifa</div>
  <div class="card">{lrow("alert","Arifa za simu","Ajira zinazofaa, taarifa za usawazishaji","Bado", first=True)}</div>

  <div class="r-micro muted" style="margin:24px 0 8px">Shirikisha Sumaiya</div>
  <div class="card">{lrow("mail","Mwalike rafiki","Ni bure — msaidie mtu mwingine apate ajira",first=True)}</div>

  <div class="r-micro muted" style="margin:24px 0 8px">Eneo la hatari</div>
  <div class="card">
    {lrow("trash","Futa data iliyohifadhiwa","CV zilizopakuliwa kwenye simu hii",first=True)}
    {lrow("alert","Futa akaunti","Inaondoa CV, barua na taarifa zote kabisa","",danger=True)}
  </div>
</div>""", active_tab=4)}
  <div class="notes">
    {note("BEFORE · profile-screen.tsx:401,450","</p>Two destructive actions, two different kinds of place",
      "<p>&ldquo;Futa data iliyohifadhiwa&rdquo; sits inside the neutral &ldquo;Akaunti&rdquo; group while "
      "&ldquo;Futa akaunti&rdquo; gets its own &ldquo;Danger zone&rdquo;. Severity does not read as a "
      "gradient, so the cheaper, reversible action carries the same visual weight as the "
      "irreversible one.</p>")}
    {note("BEFORE · profile-screen.tsx:237–278","</p>The screen never says who is signed in usefully",
      "<p><code>home-screen.tsx:276–281</code> works hard to detect a device name masquerading as a "
      "person (Hisense/Tecno/Infinix…) and falls back to an email local-part. Profile shows the raw "
      "value with no indication whether it is a real name. That detection already exists &mdash; it is "
      "just not used here.</p>")}
    {note("ADDED · profile-screen.tsx:285–286","</p>One next step instead of a list of settings",
      "<p>The career-profile row already knows the profile is incomplete. Surfacing it as a single "
      "scored prompt with its own action replaces nothing &mdash; the row stays below, unchanged &mdash; but "
      "turns the profile from a settings drawer into the place the app explains why its "
      "matching is weak.</p>")}
  </div>
</div>
'''

    # ═══════════════════════════════════════════════════════════════════════
    # EMPTY / LOADING / ERROR
    # ═══════════════════════════════════════════════════════════════════════
    def empty_state(icon, title, body, primary, secondary=None, tone="ember", extra=""):
        well = {"ember":"well","warn":"well well--gold","pine":"well well--pine"}[tone]
        return f'''
  <div style="display:flex;flex-direction:column;justify-content:center;align-items:center;
       min-height:620px;padding:32px 28px;text-align:center">
    <div class="{well} well--72" style="width:72px;height:72px;border-radius:22px;margin-bottom:18px">{ico(icon,30)}</div>
    <div class="r-section" style="letter-spacing:-.3px">{title}</div>
    <div class="r-bodysmall muted" style="margin-top:8px;line-height:20px;max-width:320px">{body}</div>
    {extra}
    <button class="btn btn--primary btn--block arrive arrive-4" style="margin-top:20px">{primary}</button>
    {f'<button class="btn btn--ghost arrive arrive-5">{secondary}</button>' if secondary else ""}
  </div>'''

    sk_list = '''
  <div class="stack g12">
    <div class="card pad" style="display:flex;gap:12px;align-items:center">
      <div class="sk" style="width:44px;height:44px;border-radius:12px"></div>
      <div class="grow"><div class="sk sk-line w60"></div><div class="sk sk-line w40" style="margin:0"></div></div>
    </div>
    <div class="card pad" style="display:flex;gap:12px;align-items:center">
      <div class="sk" style="width:44px;height:44px;border-radius:12px"></div>
      <div class="grow"><div class="sk sk-line w80"></div><div class="sk sk-line w40" style="margin:0"></div></div>
    </div>
    <div class="card pad" style="display:flex;gap:12px;align-items:center">
      <div class="sk" style="width:44px;height:44px;border-radius:12px"></div>
      <div class="grow"><div class="sk sk-line w60"></div><div class="sk sk-line w40" style="margin:0"></div></div>
    </div>
  </div>'''

    # The reassuring line belongs ABOVE the retry button: the user must learn
    # what is still available before being asked to try again. — verified real
    # state: offlineStorage.isOfflineOnly (cv-list-screen.tsx:171).
    offline_note = (
        '<div class="card pad" style="background:var(--sand-2);display:flex;gap:12px;'
        'align-items:center;margin-top:20px;text-align:left">'
        '<div class="well well--success" style="width:30px;height:30px;border-radius:9px">'
        + ico("cloud", 16) +
        '</div><div class="grow">'
        '<div class="r-bodysmall" style="font-weight:700">Nakala ya mwisho ipo kwenye simu</div>'
        '<div class="r-caption muted">CV 2 zinaweza kufunguliwa bila mtandao sasa.</div>'
        '</div></div>'
    )
    states_body = f'''
<div class="stage">
  {phone(f"""
<div class="scroll">
  <div class="r-screen" style="margin:8px 0 20px">CV zako</div>
  {sk_list}
  <div class="row-tight" style="justify-content:center;margin-top:20px;gap:8px">
    <span class="savepill">{ico("refresh",12)} Tunapakia…</span>
  </div>
</div>""", active_tab=1)}
  {phone(f"""
<div class="scroll">
  <div class="r-screen" style="margin:8px 0 8px">CV zako</div>
  {empty_state("file-text","Huna CV bado",
    "Huna CV, rasimu wala iliyokamilika. Ongea nami nikutengenezee moja, au pakia CV uliyonayo ili kuanza.",
    "Ongea nami","Pakia CV")}
</div>""", active_tab=1)}
  {phone(f"""
<div class="scroll">
  <div class="r-screen" style="margin:8px 0 8px">CV zako</div>
  {empty_state("wifioff","Imeshindwa kufikia server",
    "CV zako ziko salama kwenye akaunti yako — tumeshindwa kufikia server.",
    "Jaribu tena", tone="warn", extra=offline_note)}
</div>""", active_tab=1)}
  <div class="notes">
    {note("THE PROBLEM · empty-state.tsx:25–84 vs applications-screen.tsx:58","</p>Three different loading truths, one screen type",
      "<p>Loading is currently three separate implementations: <code>SkeletonList</code> "
      "(<code>cv-list-screen.tsx:118</code>), a bare <code>&lt;Text&gt;Loading your CVs…&lt;/Text&gt;</code> "
      "(<code>ats-checker-screen.tsx:125</code>, and the standard itself calls it &ldquo;the worst loading "
      "state in the app, in both senses&rdquo;), and <code>SkeletonCard</code> triples inlined by hand "
      "(<code>applications-screen.tsx:58</code>, <code>jobs-screen.tsx:120</code>).</p>")}
    {note("THE CHANGE · one composite, three states","</p>Loading never sits alone and never vanishes",
      "<ul>"
      "<li><b>Loading</b> &mdash; the skeleton occupies the exact geometry of the content that replaces it "
      "(same 44px well, same two text lines), so nothing below it moves.</li>"
      "<li><b>Hand-off</b> &mdash; skeleton <code>FadeOut</code> 140ms <code>ease.in</code> <i>while</i> the "
      "content enters at 300ms <code>ease.out</code> with a capped stagger. Never empty, never a pop "
      "(motion standard §3.5 row 7).</li>"
      "<li><b>Empty</b> &mdash; icon, title, body settle first; the action arrives at 140ms. Hierarchy is "
      "the point: here is the situation, then here is the way out.</li>"
      "</ul>")}
    {note("HONEST · cv-list-screen.tsx:119–130","</p>The error state must never claim data loss",
      "<p>The code already got this right and the comment says why: <em>&ldquo;Never claim the user has "
      "no CVs when the real problem is that we couldn't reach the server &mdash; that is indistinguishable "
      "from data loss.&rdquo;</em> The redesign keeps that and adds the one thing it is missing: what is "
      "<em>still available offline</em>, read from the existing <code>offlineStorage</code> path. A user "
      "on 2G learns they can still open two CVs instead of only learning what they cannot do.</p>")}
    {note("BANNED · the motion standard","</p>What these states must not do",
      "<ul><li>No full-screen spinner as the only signal &mdash; a spinner on a metered 3G link is "
      "indistinguishable from a failure.</li>"
      "<li>No illustration-heavy empty state: an SVG costs bundle bytes and decode time for no "
      "information over the existing icon + two lines.</li>"
      "<li>No infinite shimmer &mdash; the shimmer is bounded to 2 cycles and cancelled on unmount "
      "(<code>skeleton.tsx</code>, audit N15).</li></ul>")}
  </div>
</div>
'''

    # ═══════════════════════════════════════════════════════════════════════
    # CHAT — the owner named this explicitly
    # ═══════════════════════════════════════════════════════════════════════
    def bubble(who, text, meta="sasa"):
        if who == "me":
            return (f'<div style="display:flex;justify-content:flex-end;margin-bottom:12px">'
                    f'<div style="max-width:76%;background:var(--ember-fill);color:var(--cream);'
                    f'border-radius:16px 16px 4px 16px;padding:12px 14px;font-size:14.5px;line-height:1.45">'
                    f'{text}</div></div>')
        return (f'<div class="row" style="align-items:flex-start;gap:10px;margin-bottom:12px">'
                f'<div style="width:28px;height:28px;border-radius:9px;background:var(--ember-tint);'
                f'display:grid;place-items:center;flex:0 0 auto">{mark(16)}</div>'
                f'<div style="max-width:78%">'
                f'<div style="background:var(--card);border:1px solid var(--border);'
                f'border-radius:16px 16px 16px 4px;padding:12px 14px;font-size:14.5px;line-height:1.5">'
                f'{text}</div>'
                f'<div class="r-micro muted" style="margin-top:4px;margin-left:2px;letter-spacing:0;'
                f'text-transform:none;font-weight:400;font-size:11.5px">{meta}</div></div></div>')

    chat_body = f'''
<div class="stage">
  {phone(f"""
<div class="scroll" style="padding-bottom:12px">
  <div style="margin:8px 0 18px">
    <div class="eyebrow" style="margin-bottom:2px">Sumaiya</div>
    <div class="r-screen" style="font-size:24px">Nisaidie kupata kazi</div>
  </div>

  {bubble("her","Habari Asha. Nimeona CV yako ya Mhasibu — una uzoefu wa miaka 3 wa kuhasibu. Unataka nikulengee CV kwa nafasi fulani, au tuongeze ujuzi unaokosekana?")}
  {bubble("me","Nataka kuomba kazi ya Mhasibu Azania Bank.")}
  {bubble("her","Vizuri. Tangazo linaomba Excel ya hali ya juu na QuickBooks. CV yako ina Excel. "
                 "Sijaona QuickBooks — unaweza kuisema kama umeitumia, au niiache?")}

  <div class="card pad" style="margin-top:6px;margin-bottom:12px;border-left:3px solid var(--ember)">
    <div class="row-tight" style="margin-bottom:8px">
      <span class="badge badge--ember">{mark(12)} Ulinganifu 78%</span>
      <span class="r-caption muted">Azania Bank</span>
    </div>
    <div class="r-caption body" style="margin-bottom:10px">
      Nimeandaa CV iliyolengwa. Rekebisha kabla ya kuipakua.
    </div>
    <button class="btn btn--primary btn--sm btn--block">{ico("eye",15)} Fungua CV iliyolengwa</button>
  </div>

  <div class="row g8" style="overflow:auto;padding-bottom:4px">
    <span class="chip" style="min-height:36px;font-size:12.5px;padding:0 12px;white-space:nowrap">Nionyeshe ajira zinazofaa</span>
    <span class="chip" style="min-height:36px;font-size:12.5px;padding:0 12px;white-space:nowrap">Andika barua ya maombi</span>
  </div>
</div>
<div style="flex:0 0 auto;border-top:1px solid var(--border);background:var(--cream);padding:10px 16px 14px">
  <div class="row g8">
    <div style="width:44px;height:44px;border-radius:12px;border:1px solid var(--border);background:var(--card);
      display:grid;place-items:center;color:var(--text-muted)">{ico("plus",18)}</div>
    <div class="grow" style="min-height:44px;border:1px solid var(--border-input);border-radius:var(--r-input-lg);
      background:var(--card);display:flex;align-items:center;padding:0 14px">
      <span style="color:var(--text-muted);font-size:14.5px">Andika hapa…</span>
      <div class="grow"></div>
      <span style="color:var(--text-muted)">{ico("camera",18)}</span>
    </div>
    <div style="width:44px;height:44px;border-radius:12px;background:var(--ember-fill);color:var(--cream);
      display:grid;place-items:center">{ico("chevron",18)}</div>
  </div>
  <div class="r-micro muted" style="text-align:center;margin-top:8px;letter-spacing:0">
    Majibu hutumwa kwa DeepSeek · usikubali kuweka namba yako ya siri
  </div>
</div>""", active_tab=2)}
  <div class="notes">
    {note("BEFORE · sumaiya-chat-screen.tsx","</p>The first screen is a decision grid, not an invitation",
      "<p><code>INITIAL_QUICK_ACTIONS</code> puts four parallel chips in front of a user who has not "
      "said anything yet, next to a free-text composer that already affords free typing. Two of the "
      "chips duplicate what the composer does; the screen reads as a menu, so a first-time user "
      "picks instead of talking.</p>")}
    {note("THE CHANGE · sumaiya-chat-screen.tsx","</p>Cut to the two chips that produce the two artefacts",
      "<ul><li><b>Keep</b> the two that end in a document the user can send: a tailored CV and a "
      "cover letter. Both are the app's actual value (<code>job-apply-screen.tsx</code>).</li>"
      "<li><b>Replace</b> the &ldquo;free chat&rdquo; chip with nothing &mdash; the composer is right there.</li>"
      "<li><b>Replace</b> the &ldquo;My CV&rdquo; chip with the in-thread result card below: the artefact "
      "shows up where the conversation produced it, instead of in a third place.</li></ul>")}
    {note("ADDED · motion standard §4,”typing stays instant“","</p>The composer must stay still",
      "<p>No animation may wrap the <code>onChangeText</code> path. The chip row scrolls with the "
      "platform scroller; it is not a scroll-linked reveal. The result card above enters at 300ms "
      "<code>ease.out</code> with a 12px rise &mdash; it is the one new arrival on the screen, so it is the "
      "one thing allowed to arrive.</p>")}
    {note("HONEST · the mechanism is never the pitch","</p>DeepSeek is named once, in the smallest type on the screen",
      "<p>Product AI is DeepSeek and stays DeepSeek. The note under the composer is a trust line "
      "(&ldquo;usikubali kuweka namba yako ya siri&rdquo;), not a sales line &mdash; the app sells the "
      "outcome, and the model name is disclosure rather than feature.</p>")}
  </div>
</div>
'''

    # ═══════════════════════════════════════════════════════════════════════
    # WRITE
    # ═══════════════════════════════════════════════════════════════════════
    write("01-home.html", doc(
        "Home / dashibodi",
        "The screen a jobseeker opens most often. Before and after, at the phone viewport, because the "
        "phone is the product. Both frames use the app's real Swahili copy and the real palette.",
        '<div class="sec"><h2><span class="n">01</span>Home &mdash; the one screen that decides whether the app is trusted</h2>'
        '<p class="lede">Three changes, all of them subtractions or replacements: the advert leaves the '
        'first slot, the saved-state of the user&rsquo;s work becomes visible, and the loading-to-content '
        'boundary stops popping. Nothing is added that is not a restatement of something the app '
        'already does.</p>' + home_body + '</div>'))

    write("02-cv-editor.html", doc(
        "Kihariri cha CV (CV editor)",
        "The document editor on a 5-inch screen: section navigation, autosave the user can see, and the "
        "export where the thumb already is.",
        '<div class="sec"><h2><span class="n">02</span>The CV editor &mdash; a form on a phone is a scrolling problem</h2>'
        '<p class="lede">The editor already stores everything it needs: <code>dirty</code>, the section '
        'list, the offline queue, the export call. What it lacks is a way to move between sections and a '
        'truthful answer to &ldquo;is my work saved?&rdquo;. Both are fixed without a new dependency.</p>'
        + editor_body + '</div>'))

    write("03-jobs-feed.html", doc(
        "Ajira (jobs feed)",
        "A list with real data on a slow connection: one entry point for the eye, an unambiguous score, "
        "and an honest empty state for the state most users will actually see.",
        '<div class="sec"><h2><span class="n">03</span>The jobs feed &mdash; a list is a ranking, not a wall</h2>'
        '<p class="lede">On a slow connection a scroll is the most expensive gesture the user makes, so '
        'the feed has to put its best row first and say why. The score badge must also stop sharing its '
        'shape with a different score on a different screen.</p>' + jobs_body + '</div>'))

    write("04-profile.html", doc(
        "Wasifu (profile)",
        "Settings that say who you are, one prompt that says why matching is weak, and destructive "
        "actions ordered by how recoverable they are.",
        '<div class="sec"><h2><span class="n">04</span>Profile &mdash; the place the app admits what it does not know</h2>'
        '<p class="lede">Matching quality is driven by the career profile, and the profile screen is the '
        'only place that can explain the connection. It currently says nothing about it.</p>'
        + profile_body + '</div>'))

    write("05-empty-loading-error.html", doc(
        "Hali tupu, kupakia na hitilafu",
        "The three states a cheap phone on expensive data lives in most of the time: waiting, nothing "
        "yet, and failed. Built as one composite so they cannot drift apart.",
        '<div class="sec"><h2><span class="n">05</span>Empty, loading, error &mdash; one composite, three faces</h2>'
        '<p class="lede">The motion standard calls <code>ats-checker-screen.tsx:125</code> &ldquo;the worst '
        'loading state in the app, in both senses&rdquo;. That is a symptom: there are three loading '
        'implementations and no shared rule. This section is the rule.</p>' + states_body + '</div>'))

    write("06-chat.html", doc(
        "Sumaiya &mdash; sanduku la mazungumzo",
        "The chat surface and the things inside it: starter chips, the in-thread result, the composer, "
        "and the boundary the typing path must never cross.",
        '<div class="sec"><h2><span class="n">06</span>The chat box &mdash; where the product is a conversation</h2>'
        '<p class="lede">The owner named this surface explicitly. It is the one screen where the app is '
        'not a form, so it is the one screen where the user should be talking, not choosing.</p>'
        + chat_body + '</div>'))
