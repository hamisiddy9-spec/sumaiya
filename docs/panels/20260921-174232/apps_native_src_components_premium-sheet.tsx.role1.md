# apps/native/src/components/premium-sheet.tsx — role 1
model: nvidia/nemotron-3-ultra-550b-a55b:free
role: a copy editor whose first language is Swahili (Tanzania), ruthless about ambiguity

The user wants me to act as a Swahili (Tanzania) copy editor reviewing the copy in this React Native component. I need to check if any strings promise something that doesn't exist (payments not open, premium earned by inviting friends), and whether Premium reads as a reward or a toll gate.

Let me analyze the strings in the code:

English strings:
1. "The 7 flagship designs — colour sidebars, photo rings, timelines"
2. "Earned by inviting friends — 7 days each time one builds a CV"
3. "Everything else stays free"
4. "Deep courses: interview mastery, salary negotiation"
5. "Step-by-step, built for East Africa"
6. "The short guides stay free"
7. "A written verdict on your CV, in plain language"
8. "Your 3 highest-impact fixes, ranked"
9. "The deterministic ATS score stays free"
10. "Everything essential stays free"
11. "Paying isn't open yet — but you don't have to wait. Premium is earned by inviting friends: 7 days each time one of them builds their first CV."
12. "Earn Premium by inviting friends"
13. "We'll tell you when paying opens."
14. "Notify me when paying opens"
15. "Maybe later"
16. "Sumaiya Premium"
17. "Close"

Swahili strings:
1. "Miundo 7 bora — sidebars za rangi, pete za picha, mistari ya muda"
2. "Inapatikana kwa kualika marafiki — siku 7 kila mmoja akijenga CV"
3. "Kila kitu kingine kinabaki bure"
4. "Kozi za kina: umahiri wa usaili, majadiliano ya mshahara"
5. "Hatua kwa hatua, kwa Afrika Mashariki"
6. "Miongozo mifupi inabaki bure"
7. "Uamuzi ulioandikwa kuhusu CV yako, kwa lugha rahisi"
8. "Marekebisho matatu yenye athari kubwa, yaliyopangwa"
9. "Alama ya CV yako ya uhakika inabaki bure"
10. "Kila kitu muhimu kinabaki bure"
11. "Malipo bado hayajafunguliwa — lakini huna haja ya kusubiri. Premium inapatikana kwa kualika marafiki: siku 7 kila mmoja akijenga CV yake ya kwanza."
12. "Pata Premium kwa kualika marafiki"
13. "Tutakujulisha malipo yanapofunguliwa."
14. "Nijulishe malipo yanapofunguliwa"
15. "Baadaye"
16. "Sumaiya Premium"
17. "Funga"

Now let me analyze for issues:

1. "Earned by inviting friends — 7 days each time one builds a CV" / "Inapatikana kwa kualika marafiki — siku 7 kila mmoja akijenga CV"
   - "Inapatikana" means "is available/obtainable" - this is good, frames as reward
   - But "siku 7" (7 days) - is this 7 days of premium access per friend? That's what the English says. But is it clear it's 7 days *per friend*? The Swahili "kila mmoja" covers "each one".

2. "Paying isn't open yet — but you don't have to wait. Premium is earned by inviting friends: 7 days each time one of them builds their first CV." / "Malipo bado hayajafunguliwa — lakini huna haja ya kusubiri. Premium inapatikana kwa kualika marafiki: siku 7 kila mmoja akijenga CV yake ya kwanza."
   - "huna haja ya kusubiri" = "you don't need to wait" - good
   - "Premium inapatikana" = "Premium is obtainable/available" - good, reward framing
   - "siku 7 kila mmoja akijenga CV yake ya kwanza" - "7 days each one builds their first CV" - clear

3. "Earn Premium by inviting friends" / "Pata Premium kwa kualika marafiki"
   - "Pata" = "get/obtain" - neutral, could be reward or transaction
   - "kwa kualika" = "by inviting" - clear mechanism

4. "We'll tell you when paying opens." / "Tutakujulisha malipo yanapofunguliwa."
   - "Tutakujulisha" = "we will inform you" - good
   - "malipo yanapofunguliwa" = "when payments open" - implies payments WILL open, which may be a promise

5. "Notify me when paying opens" / "Nijulishe malipo yanapofunguliwa"
   - Same issue - assumes payments will open

Key concerns:
- The waitlist copy ("Notify me when paying opens", "We'll tell you when paying opens") implies payments WILL open. But the code comment says "The waitlist flag is stored locally and is NOT entitlement". This could
