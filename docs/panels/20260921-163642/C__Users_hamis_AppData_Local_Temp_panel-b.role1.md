# C:\Users\hamis\AppData\Local/Temp/panel-b — role 1
model: nvidia/nemotron-3-ultra-550b-a55b:free
role: a copy editor whose first language is Swahili (Tanzania), ruthless about ambiguity

The user wants me to act as a Swahili-native copy editor reviewing the premium sheet strings. I need to check three things:
1. Does any string promise something that doesn't exist?
2. Is the Swahili correct, warm, unambiguous?
3. Does 'Premium' read as a reward or a toll gate?

Let me analyze the strings in the COPY object and the inline strings.

First, the COPY object strings:

**templates:**
- en: "The 7 flagship designs — colour sidebars, photo rings, timelines"
- sw: "Miundo 7 bora — sidebars za rangi, pete za picha, mistari ya muda"
- en: "Earned by inviting friends — 7 days each time one builds a CV"
- sw: "Inapatikana kwa kualika marafiki — siku 7 kila mmoja akijenga CV"
- en: "Everything else stays free"
- sw: "Kila kitu kingine kinabaki bure"

**courses:**
- en: "Deep courses: interview mastery, salary negotiation"
- sw: "Kozi za kina: umahiri wa usaili, majadiliano ya mshahara"
- en: "Step-by-step, built for East Africa"
- sw: "Hatua kwa hatua, kwa Afrika Mashariki"
- en: "The short guides stay free"
- sw: "Miongozo mifupi inabaki bure"

**verdict:**
- en: "A written verdict on your CV, in plain language"
- sw: "Uamuzi ulioandikwa kuhusu CV yako, kwa lugha rahisi"
- en: "Your 3 highest-impact fixes, ranked"
- sw: "Marekebisho matatu yenye athari kubwa, yaliyopangwa"
- en: "The deterministic ATS score stays free"
- sw: "Alama ya CV yako ya uhakika inabaki bure"

**general:**
- en: "The 7 flagship designs — colour sidebars, photo rings, timelines"
- sw: "Miundo 7 bora — sidebars za rangi, pete za picha, mistari ya muda"
- en: "Deep courses: interview mastery, salary negotiation"
- sw: "Kozi za kina: umahiri wa usaili, majadiliano ya mshahara"
- en: "Everything essential stays free"
- sw: "Kila kitu muhimu kinabaki bure"

Inline strings:
- "Paying isn't open yet — but you don't have to wait. Premium is earned by inviting friends: 7 days each time one of them builds their first CV."
- Sw: "Malipo bado hayajafunguliwa — lakini huna haja ya kusubiri. Premium inapatikana kwa kualika marafiki: siku 7 kila mmoja akijenga CV yake ya kwanza."
- "Earn Premium by inviting friends" / "Pata Premium kwa kualika marafiki"
- "We'll tell you when paying opens." / "Tutakujulisha malipo yanapofunguliwa."
- "Notify me when paying opens" / "Nijulishe malipo yanapofunguliwa"
- "Maybe later" / "Baadaye"
- "Sumaiya Premium" / "Sumaiya Premium"
- "Close" / "Funga"

Now let me analyze:

**1. Promises that don't exist:**
- "The 7 flagship designs" - need to verify if there are exactly 7 premium designs. The comment says "The 7 flagship designs — colour sidebars, photo rings, timelines" - this seems specific.
- "Deep courses: interview mastery, salary negotiation" - are these actually built?
- "A written verdict on your CV" - is this implemented?
- "The deterministic ATS score stays free" - implies ATS score exists and is free.
- "Everything else stays free" / "Everything essential stays free" - vague but not false.

**2. Swahili quality:**

Templates:
- "Miundo 7 bora" - "bora" means best/excellent, "flagship" might be better as "kuu" or "msingi" but "bora" works.
- "sidebars za rangi" - "sidebars" is English tech term, maybe "upande wa rangi" or keep as is since it's UI terminology.
- "pete za picha" - "pete" means ring/circle, good for "photo rings".
- "mistari ya muda" - "timelines" as "mistari ya muda" is literal but understandable.
- "Inapatikana kwa kualika marafiki" - "kualika" means to invite, correct. "Inapatikana" = it is obtained/available. Good.
- "siku 7 kila mmoja akijenga CV" - "kila mmoja" = each one, "akijenga" = when they build. Good.
- "Kila kitu kingine kinabaki bure" - "everything else remains free". Clear.

Courses:
- "Kozi za kina" - "deep courses" as "kozi za kina" (deep courses) works.
- "umahiri wa usaili" - "mastery of interview" - "umahiri" is mastery/expertise, "usaili" is interview. Good.
- "majadiliano ya
