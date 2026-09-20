import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from openrouter_pass import run_text, run_vision, TEXT_MODELS, VISION_MODELS

P6 = """You are an OPERATOR of mobile-first consumer products in East Africa. You have shipped
products used by people on TZS 250,000 Android phones with prepaid bundles, no bank card,
and WhatsApp as their primary internet. You think in terms of trust, bundle cost, and
whether a person comes back a second time.

CONTEXT (established by live QA of the running product, not a guess): Sumaiya
(https://sumaiya.app) is a Tanzania-first product with two clients - a web app and an
Android APK that is the REAL product for cheap phones. It genuinely does: CV build +
PDF/DOCX export (~47 templates), cover letters, business cards, formal letters, a
Tanzanian jobs feed (measured EMPTY on 2026-09-20), an on-device CV check, application
tracking, a career interview, learning lessons, 12 PDF tools, and a chat assistant. Its
AI runs on DeepSeek but the house rule is to NEVER name the mechanism and to sell the
outcome.

CURRENT PUBLIC FRAMING (fetched live 2026-09-20):
- page title SW: "Tengeneza CV Bila Malipo - Kwa Kiswahili | Sumaiya"
- H1 SW: "CV inayokufikisha kwa mwajiri." / EN: "The CV that reaches the employer."
- subhead SW: "Bandika tangazo la kazi. Sumaiya anakusaidia kuandika CV inayolingana
  nalo, kwa Kiswahili - kwenye simu yako, bila malipo, bila akaunti."
- nav SW: Nyumbani / Miundo / Sumaiya / Ajira / Zana za PDF / Kagua CV / Snap-to-Apply
- the WhatsApp share card (og:image) says: "Sumaiya / CV inayokupa ajira - kwa AI"
- Play Store listing name: "Sumaiya: CV & Career AI"
- JSON-LD: "Create ATS-optimized CVs, cover letters, business cards and professional
  letters with an AI assistant that helps you get hired."

The owner says the product still leads with "AI CV maker" and that this undersells what
it actually does. He wants to rebrand SYSTEM-WIDE and asked what to LEAD with. The name
Sumaiya is a memorial for his late sister and is fixed; no colour or logo changes;
Swahili-first.

ANSWER THESE, concretely, and mark inference as JUDGEMENT:
1. On a cheap Android phone in Tanzania, what does the user actually return for? Name
   the ONE job-to-be-done, and say whether "CV" is it.
2. Does the wider capability set (jobs, tracking, interview, learning) help or hurt
   acquisition and retention for THIS user? Be specific about what belongs on the first
   screen and what belongs three taps deep.
3. WhatsApp-first and mobile-money-first products in East Africa win on specific
   mechanics (no download, no account, a shareable artifact, airtime/mobile money,
   social proof inside a group). Which apply here, and which is the single most
   important one for Sumaiya that it is NOT using today?
4. The jobs feed is measured empty. Is leading with jobs ever defensible now? What is
   the honest middle path?
5. Give THREE candidate positioning directions. For each: a one-line promise, the
   headline in SWAHILI and in ENGLISH, what it leads with, what it must stop saying,
   who it attracts and who it loses.
6. Recommend ONE of your three, with reasons, and name the single decision that matters
   most.
No invented statistics. Label judgements as JUDGEMENT. Write in markdown."""

V = """You are a senior brand and conversion designer. Look at this image. It is the
og:image (social share card, 1200x630) of a Tanzania-first mobile product called Sumaiya.
This is the exact card a stranger sees when someone forwards the link in a WhatsApp group
in Tanzania - the single most important impression the product makes, because WhatsApp is
where its audience shares things.

Answer:
1. Transcribe every word in the image exactly.
2. Who is this card FOR, and for whom is it clearly not? Judge from the pixels only.
3. It contains no English at all. The product also serves an English locale. What breaks?
4. Judge the CALL TO ACTION: does this card give a stranger any reason to tap, and any
   idea what they will get for free? Be specific about what is missing.
5. There is no device mockup, no example CV, no price, no country, no phone, no proof of
   any kind. Is that restraint or is it a wasted impression? Argue it.
6. Rewrite what should appear on this card so a 24-year-old in Mwanza who has never paid
   for anything online would tap it. Give the Swahili line first, then the English.
   You may assume the logo/wordmark is fixed and cannot change.
Mark anything you are inferring as JUDGEMENT. Write in markdown."""

m6 = run_text('pass-6-east-africa-operator', P6, TEXT_MODELS,
              'pass-6-east-africa-operator.md', max_tokens=4000)
print("PASS6 MODEL:", m6, flush=True)

img = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'og-image-live.png')
mv = run_vision('pass-7-vision-ogcard', V, img, VISION_MODELS,
                'pass-7-vision-ogcard.md', max_tokens=2500)
print("PASS7 MODEL:", mv, flush=True)
print("ALLDONE", flush=True)
