# apps/native/src/components/premium-sheet.tsx — role 2
model: nvidia/nemotron-3-ultra-550b-a55b:free (rotated from ling-3.0-flash-vl:free)
role: a tired reader on a cheap phone who reads Swahili as a second language

The user wants me to analyze the copy in this React Native component for a PremiumSheet modal. They want me to judge the wording from the perspective of a tired reader on a cheap phone who reads Swahili as a second language. I need to check if any strings promise something that doesn't exist (payments not open, premium earned by inviting friends), and whether Premium reads as a reward or a toll gate.

Let me examine the copy strings in the component:

1. COPY object with feature-specific copy in English and Swahili
2. The explanatory text about paying not being open but earning by inviting friends
3. Button labels and waitlist messages

Key strings to analyze:

English:
- "The 7 flagship designs — colour sidebars, photo rings, timelines"
- "Earned by inviting friends — 7 days each time one builds a CV"
- "Everything else stays free"
- "Deep courses: interview mastery, salary negotiation"
- "Step-by-step, built for East Africa"
- "The short guides stay free"
- "A written verdict on your CV, in plain language"
- "Your 3 highest-impact fixes, ranked"
- "The deterministic ATS score stays free"
- "Paying isn't open yet — but you don't have to wait. Premium is earned by inviting friends: 7 days each time one of them builds their first CV."
- "Earn Premium by inviting friends"
- "We'll tell you when paying opens."
- "Notify me when paying opens"
- "Maybe later"

Swahili:
- "Miundo 7 bora — sidebars za rangi, pete za picha, mistari ya muda"
- "Inapatikana kwa kualika marafiki — siku 7 kila mmoja akijenga CV"
- "Kila kitu kingine kinabaki bure"
- "Kozi za kina: umahiri wa usaili, majadiliano ya mshahara"
- "Hatua kwa hatua, kwa Afrika Mashariki"
- "Miongozo mifupi inabaki bure"
- "Uamuzi ulioandikwa kuhusu CV yako, kwa lugha rahisi"
- "Marekebisho matatu yenye athari kubwa, yaliyopangwa"
- "Alama ya CV yako ya uhakika inabaki bure"
- "Malipo bado hayajafunguliwa — lakini huna haja ya kusubiri. Premium inapatikana kwa kualika marafiki: siku 7 kila mmoja akijenga CV yake ya kwanza."
- "Pata Premium kwa kualika marafiki"
- "Tutakujulisha malipo yanapofunguliwa."
- "Nijulishe malipo yanapofunguliwa"
- "Baadaye"

Now, analyzing from the perspective of a tired reader on a cheap phone with Swahili as second language:

Issues I see:

1. "Earned by inviting friends — 7 days each time one builds a CV" - "builds a CV" is ambiguous. Does it mean creates a CV? Completes a CV? Publishes a CV? For a non-native speaker, "builds" is odd phrasing.

2. "Premium is earned by inviting friends: 7 days each time one of them builds their first CV" - Similar issue. "Builds their first CV" - what counts as "building"? The Swahili "akijenga CV yake ya kwanza" is clearer (when they build their first CV).

3. "Paying isn't open yet — but you don't have to wait." - This creates confusion. If paying isn't open, but I don't have to wait... then what? The next sentence explains, but the contrast is jarring.

4. "We'll tell you when paying opens." - This implies paying WILL open. But the code comment says "Paying is not open — saying only that would leave the user with no move when there is one." There's a tension: the waitlist is for when paying opens, but the primary way to get premium is referrals. The waitlist message "We'll tell you when paying opens" makes paying sound like the main/only future path.

5. "Notify me when paying opens" - Same issue. This positions paying as the thing to wait for, not referrals.

6. The Swahili "Malipo bado hayajafunguliwa — lakini huna haja ya kusubiri" translates to "Payments haven't opened yet — but you don't need to wait." Then "Premium inapatikana kwa kualika marafiki" - "Premium is obtained by inviting friends." This is clearer than English.

7. "Earn Premium by inviting friends" / "Pata Premium kwa kualika marafiki" - "Pata" means "get/obtain", not specifically "earn". Could be interpreted as "get premium by inviting friends" which is accurate.

8. The general copy says "Everything essential stays free" / "Kila kitu muhimu kinabaki bure" - Good, clear.

9. "The deterministic ATS score stays free" / "Alama ya CV yako ya uhakika inabaki bure" - "Uhakika" means certainty/accuracy, not deterministic. But "your CV's certain score" is weird. Might confuse.

10. "Flagship designs" / "Miundo 7 bora" - "Bora" means best/excellent. "
