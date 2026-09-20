"use client";

/**
 * TemplateHub Pro — the front door at sumaiya.app.
 *
 * This is the page a visitor sees when they land on the TemplateHub domain. Its
 * whole job is to sell the app, so it leads with the thing people came for
 * (the designs), shows them rendered for real and not as swatches, then asks for
 * the one action that matters: install on Android.
 *
 * Two honesty rules are baked in:
 *   1. The designs shown are the REAL templates, rendered from the same
 *      components the product uses. Nothing here is a mockup of a layout we do
 *      not actually ship.
 *   2. Testimonials come from lib/testimonials.ts and the section hides itself
 *      when that list is empty. Nothing is invented to fill the space.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { CVData, TemplateId } from "@/types";
import { TEMPLATE_COMPONENTS } from "@/components/templates/registry";
import { TEMPLATES } from "@/types";
import { useLang } from "@/lib/i18n/context";
import { Icon, type IconName } from "@/components/ui/icon";
import { CreateEntryButton } from "@/components/editor/create-entry-options";
import { TESTIMONIALS } from "@/lib/testimonials";
import { INTER_STACK } from "@/lib/fonts";

const APK_HREF = "/downloads/sumaiya.apk";

/**
 * Early-access and referral terms, with a leash on both.
 *
 * ⚠️ Every number here must be TRUE or null. There is no fake countdown, no
 * invented "only 3 left", no testimonial from a person who does not exist.
 * The reason is not squeamishness: Play's policies, consumer law and, more
 * practically, word of mouth all punish fake scarcity harder than no scarcity.
 *
 * The seat counter is NOT a constant — it is counted from the database by
 * /api/stats/early-access, so it cannot drift from reality.
 *
 * Referral design (the leash), matching what is already shipped server-side:
 *   • the reward is paid on ACTIVATION — the invited friend builds a CV — not
 *     on sign-up. This is the single most important anti-abuse choice: it makes
 *     a fake account worthless, because a fake account that never builds a CV
 *     never pays out.
 *   • REFERRAL_MAX_REWARDED caps how many friends can ever pay a given person.
 *     Without a ceiling, a determined referrer farms Premium indefinitely and
 *     the programme has no upper bound on cost.
 *   • REFERRAL_FOREVER_AT is how "forever" is EARNED rather than farmed: enough
 *     genuine activations converts to Pro for life, and after that referrals
 *     stop paying — so permanent Pro has a fixed, bounded price (five real
 *     people), and the ceiling can never float upward.
 */
const REFERRAL_DAYS_PER_FRIEND = 7;
/** Leash 1 — hard ceiling on rewarded referrals per person (12 × 7 = 84 days). */
const REFERRAL_MAX_REWARDED = 12;
/** Leash 2 — this many ACTIVATED friends converts to Pro for life. */
const REFERRAL_FOREVER_AT = 5;

const SAMPLE_PHOTO =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23e8d5c0'/%3E%3Ccircle cx='100' cy='75' r='45' fill='%238B5E3C'/%3E%3Cellipse cx='100' cy='46' rx='32' ry='20' fill='%233D2314'/%3E%3Cpath d='M15 200 C15 148 55 130 100 130 C145 130 185 148 185 200Z' fill='%238B5E3C'/%3E%3C/svg%3E";

/** A real, complete CV so each design renders as the finished thing. */
const SAMPLE_CV: CVData = {
  personal: {
    fullName: "Neema Joseph",
    jobTitle: "Operations Manager",
    email: "neema.joseph@example.co.tz",
    phone: "+255 712 000 111",
    location: "Mikocheni, Dar es Salaam",
    linkedin: "linkedin.com/in/neemajoseph",
    website: "neemajoseph.co.tz",
    photo: SAMPLE_PHOTO,
  },
  summary:
    "Operations manager with nine years in logistics across East Africa. Cut dispatch turnaround from 9h to 6h at a 40-person depot and now run three of them.",
  experience: [
    {
      id: "e1",
      company: "Pwani Logistics",
      position: "Operations Manager",
      location: "Dar es Salaam",
      startDate: "2019-03",
      endDate: "",
      current: true,
      description:
        "Ran a 40-person warehouse team.\nRebuilt the dispatch rota, cutting turnaround from 9h to 6h.\nIntroduced weekly stock counts.",
    },
    {
      id: "e2",
      company: "Mwanza Freight",
      position: "Depot Supervisor",
      location: "Mwanza",
      startDate: "2015-06",
      endDate: "2019-02",
      current: false,
      description: "Covered three depots and a fleet of 22 trucks.",
    },
  ],
  education: [
    {
      id: "d1",
      institution: "University of Dar es Salaam",
      degree: "BCom",
      field: "Logistics & Transport",
      startDate: "2011-08",
      endDate: "2015-11",
      grade: "Upper second",
    },
  ],
  skills: [
    { id: "s1", name: "Fleet planning", level: 5 },
    { id: "s2", name: "Inventory control", level: 4 },
    { id: "s3", name: "Excel & Power BI", level: 4 },
    { id: "s4", name: "Team leadership", level: 5 },
    { id: "s5", name: "Customs clearance", level: 3 },
  ],
  languages: [
    { id: "l1", name: "Swahili", proficiency: "Native" },
    { id: "l2", name: "English", proficiency: "Fluent" },
    { id: "l3", name: "French", proficiency: "Basic" },
  ],
  certifications: [
    { id: "c1", name: "CIPS Level 4", issuer: "CIPS", date: "2021-06" },
    { id: "c2", name: "First Aid at Work", issuer: "Red Cross Tanzania", date: "2023-01" },
  ],
  projects: [
    {
      id: "p1",
      name: "Depot merger",
      role: "Project lead",
      date: "2022-04",
      description: "Merged two Dar depots. Kept 100% of staff through the move.",
    },
  ],
  referees: [
    {
      id: "r1",
      name: "Joseph Mkapa",
      title: "Regional Director",
      company: "Pwani Logistics",
      email: "j.mkapa@example.co.tz",
      phone: "+255 754 000 222",
    },
  ],
  hobbies: "Long-distance running, chess, film photography",
};

/** One real design per family, so the shelf reads as "different kinds of CV". */
const SHOWCASE: TemplateId[] = [
  "rift",
  "malachite",
  "nuru",
  "aberdare",
  "apex",
  "altus",
  "pemba",
  "nordic-minimal",
];

const PAGE_W = 794;
const PAGE_H = 1123;

function DesignCard({ id, scale, label }: { id: TemplateId; scale: number; label: string }) {
  const Component = TEMPLATE_COMPONENTS[id];
  if (!Component) return null;
  const meta = TEMPLATES.find((t) => t.id === id);
  const w = Math.round(PAGE_W * scale);
  const h = Math.round(PAGE_H * scale);
  return (
    <Link
      href={`/templates/${id}`}
      className="group block overflow-hidden rounded-xl border border-[#E9E0D4] bg-white transition-shadow hover:shadow-[0_18px_40px_rgba(33,26,21,0.12)]"
      aria-label={label}
    >
      <div style={{ width: "100%", height: h, overflow: "hidden", position: "relative" }}>
        <div
          style={{
            width: PAGE_W,
            height: PAGE_H,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            position: "absolute",
            top: 0,
            left: 0,
          }}
        >
          <Component data={SAMPLE_CV} primaryColor={meta?.previewColor ?? "#DA4A1C"} fontFamily={INTER_STACK} />
        </div>
      </div>
      <div className="flex items-center justify-between px-3 py-2.5">
        <span className="text-[13px] font-semibold text-[#211A15]">{meta?.name ?? id}</span>
        <span className="text-[11px] uppercase tracking-wider text-[#756A5E]">{meta?.style ?? ""}</span>
      </div>
    </Link>
  );
}

export function TemplateHubProLanding() {
  const lang = useLang();
  const sw = lang === "sw";
  const [showAll, setShowAll] = useState(false);
  const shown = showAll ? SHOWCASE : SHOWCASE.slice(0, 4);

  // The early-access counter is fetched, never hardcoded — see the constants
  // comment above. While it is loading (or if it fails) the offer still renders,
  // just without a number.
  const [early, setEarly] = useState<{
    taken: number | null;
    seats: number;
    remaining: number | null;
    full: boolean;
  } | null>(null);
  useEffect(() => {
    let alive = true;
    fetch("/api/stats/early-access")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (alive && d) setEarly(d);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const seatsFull = early?.full === true;
  const seatsPct =
    early && early.taken !== null && early.seats > 0
      ? Math.min(100, Math.round((early.taken / early.seats) * 100))
      : null;

  const steps = sw
    ? [
        { n: "1", t: "Chagua muundo", b: "Chagua muundo unaokufaa. Kwa kazi yako, tunapendekeza wenyewe." },
        { n: "2", t: "Sumaiya anaandika", b: "Ongea naye kwa Kiswahili au Kiingereza. Anajaza sehemu zote, anarekebisha ujuzi, na anakuambia kilichokosekana." },
        { n: "3", t: "Pakua PDF", b: "Pakua PDF inayopitishwa na mifumo ya kuajiri, tuma kwa barua pepe, au shiriki moja kwa moja kwenye WhatsApp." },
      ]
    : [
        { n: "1", t: "Pick a design", b: "Choose the design that fits. For your job, we suggest one." },
        { n: "2", t: "Sumaiya writes", b: "Talk to her in Swahili or English. She fills every section, sharpens your skills, and tells you what's missing." },
        { n: "3", t: "Download the PDF", b: "Export an ATS-ready PDF, email it, or share it straight to WhatsApp." },
      ];

  // Typed rather than inferred: `IconName` is a closed union, so a typo here is
  // a compile error instead of an icon that silently renders nothing.
  const features: { icon: IconName; t: string; b: string }[] = sw
    ? [
        { icon: "shapes", t: "Miundo 260+", b: "Kila muundo unafanya kazi kwenye simu. Hakuna kupanga kwa vidole." },
        { icon: "check", t: "Kikagua cha CV", b: "Inakuambia hasa kilichokosekana kabla ya kutuma maombi." },
        { icon: "mail", t: "Barua za maombi", b: "Barua inayolingana na kazi husika, kwa dakika." },
        { icon: "globe-lang", t: "Kiswahili na Kiingereza", b: "Kila kitu kinaonekana katika lugha uliyochagua." },
      ]
    : [
        { icon: "shapes", t: "260+ designs", b: "Every design works on a phone. No fiddling with columns." },
        { icon: "check", t: "ATS checker", b: "Tells you exactly what's missing before you apply." },
        { icon: "mail", t: "Cover letters", b: "A letter matched to the specific job, in minutes." },
        { icon: "globe-lang", t: "Swahili & English", b: "Everything renders in the language you chose." },
      ];

  // Two ways in, stated plainly: the web is where you use Sumaiya today; the
  // app is the full experience and is on its way to Play Store. Leading with
  // the download alone would hide that the web already works.
  const paths = sw
    ? [
        {
          badge: "Sasa — mtandaoni",
          title: "Tumia Sumaiya hapa",
          body: "Chagua muundo na uanze mara moja kwenye sumaiya.app. Ongea na Sumaiya, andika sehemu zote, pakua PDF. Hakuna kupakua kitu.",
          cta: "web" as const,
          label: "Anza mtandaoni — bure",
        },
        {
          badge: "Inakuja Play Store",
          title: "Uzoefu kamili kwenye app",
          body: "Sumaiya wote, mfukoni mwako: inafanya kazi bila intaneti, inatumia kamera kusoma vyeti, na inajipakia yenyewe. Pakua APK sasa; Play Store hivi karibuni.",
          cta: "app" as const,
          label: "Pakua app ya Android",
        },
      ]
    : [
        {
          badge: "Now — online",
          title: "Use Sumaiya right here",
          body: "Pick a design and start immediately on sumaiya.app. Talk to Sumaiya, write every section, download the PDF. Nothing to install.",
          cta: "web" as const,
          label: "Start online — free",
        },
        {
          badge: "Coming to Play Store",
          title: "The full experience in the app",
          body: "All of Sumaiya, in your pocket: works offline, uses the camera to read your certificates, and updates itself. Grab the APK now; Play Store soon.",
          cta: "app" as const,
          label: "Get the Android app",
        },
      ];

  return (
    <main className="bg-[#FAF5EE]">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 pt-28 pb-14 sm:pt-36">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="max-w-3xl"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-[#DA4A1C]/30 bg-[#DA4A1C]/8 px-3 py-1 text-[12px] font-bold uppercase tracking-[0.14em] text-[#DA4A1C]">
            TemplateHub Pro
          </span>

          <h1 className="mt-5 text-[38px] font-extrabold leading-[1.08] tracking-tight text-[#211A15] sm:text-[54px]">
            {sw ? (
              <>
                Miundo ya CV iliyoundwa kwa
                <br />
                zama za AI.
              </>
            ) : (
              <>
                CV designs built for
                <br />
                the age of AI.
              </>
            )}
          </h1>

          <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-[#4A3F36]">
            {sw
              ? "Karibu Sumaiya Pro. Tumia Sumaiya hapa mtandaoni — chagua muundo, kisha Sumaiya anaandika kila sehemu na kukupatia PDF inayopitishwa na mifumo ya kuajiri. Uzoefu kamili wa Sumaiya unakuja kwenye app ya Android, na Play Store hivi karibuni."
              : "Welcome to Sumaiya Pro. Use Sumaiya online, right here — pick a design, and she writes every section and hands you an ATS-ready PDF. The full Sumaiya experience is coming to the Android app, and to Play Store soon."}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <CreateEntryButton
              docType="cv"
              lang={sw ? "sw" : "en"}
              className="inline-flex items-center gap-2.5 rounded-xl bg-[#DA4A1C] px-5 py-3.5 text-[15px] font-bold text-white shadow-[0_10px_24px_rgba(218,74,28,0.28)] transition-transform hover:-translate-y-0.5"
            >
              <Icon name="spark" size={18} />
              {sw ? "Anza mtandaoni — bure" : "Start online — free"}
            </CreateEntryButton>
            <a
              href={APK_HREF}
              className="inline-flex items-center gap-2 rounded-xl border border-[#E9E0D4] bg-white px-5 py-3.5 text-[15px] font-bold text-[#211A15] transition-colors hover:border-[#DA4A1C]/40"
            >
              <Icon name="download" size={17} />
              {sw ? "Pakua app" : "Get the app"}
            </a>
            <a
              href="#designs"
              className="inline-flex items-center gap-2 px-2 py-3.5 text-[15px] font-bold text-[#DA4A1C]"
            >
              {sw ? "Ona miundo" : "See the designs"}
              <Icon name="chevron-right" size={16} />
            </a>
          </div>

          <p className="mt-4 text-[13px] text-[#756A5E]">
            {sw
              ? "Mtandaoni sasa, bila kupakua kitu. App ya Android inapatikana kama APK ya bure; Play Store hivi karibuni."
              : "Online now, nothing to install. The Android app is available as a free APK; Play Store soon."}
          </p>
        </motion.div>
      </section>

      {/* ── Two ways in ──────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 pb-6">
        <div className="grid gap-5 sm:grid-cols-2">
          {paths.map((p) => (
            <div
              key={p.title}
              className="flex flex-col rounded-2xl border border-[#E9E0D4] bg-white p-6"
            >
              <span className="inline-flex w-fit rounded-full bg-[#211A15]/6 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#4A3F36]">
                {p.badge}
              </span>
              <h3 className="mt-3 text-[19px] font-extrabold text-[#211A15]">{p.title}</h3>
              <p className="mt-2 flex-1 text-[14.5px] leading-relaxed text-[#4A3F36]">{p.body}</p>
              <div className="mt-5">
                {p.cta === "web" ? (
                  <CreateEntryButton
                    docType="cv"
                    lang={sw ? "sw" : "en"}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#DA4A1C] px-5 py-3 text-[14.5px] font-bold text-white"
                  >
                    <Icon name="spark" size={16} />
                    {p.label}
                  </CreateEntryButton>
                ) : (
                  <a
                    href={APK_HREF}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#DA4A1C]/40 bg-[#DA4A1C]/6 px-5 py-3 text-[14.5px] font-bold text-[#DA4A1C]"
                  >
                    <Icon name="download" size={16} />
                    {p.label}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Designs ──────────────────────────────────────────────────────── */}
      <section id="designs" className="mx-auto max-w-6xl px-5 py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-[27px] font-extrabold tracking-tight text-[#211A15]">
              {sw ? "Angalia miundo kabla ya kuchagua" : "Look at the designs before you pick"}
            </h2>
            <p className="mt-2 max-w-2xl text-[15px] text-[#4A3F36]">
              {sw
                ? "Hizi ni miundo halisi, zimechorwa na kifaa hicho tunachokupa. Gusa yoyote kuiona kamili."
                : "These are the real designs, rendered by the same components the product uses. Tap any one to see it whole."}
            </p>
          </div>
          <Link
            href="/templates"
            className="text-[14px] font-bold text-[#DA4A1C] underline underline-offset-4"
          >
            {sw ? "Miundo yote" : "All designs"}
          </Link>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {shown.map((id) => (
            <DesignCard
              key={id}
              id={id}
              scale={0.28}
              label={sw ? `Ona muundo ${id}` : `View the ${id} design`}
            />
          ))}
        </div>

        {!showAll && SHOWCASE.length > 4 ? (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="mt-6 w-full rounded-xl border border-dashed border-[#E9E0D4] py-3.5 text-[14px] font-bold text-[#DA4A1C]"
          >
            {sw ? "Onyesha miundo zaidi" : "Show more designs"}
          </button>
        ) : null}
      </section>

      {/* ── Story ────────────────────────────────────────────────────────── */}
      <section className="border-y border-[#E9E0D4] bg-white">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="text-[27px] font-extrabold tracking-tight text-[#211A15]">
            {sw ? "Inafanyaje kazi" : "How it works"}
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="rounded-2xl bg-[#FAF5EE] p-6">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#DA4A1C] text-[15px] font-extrabold text-white">
                  {s.n}
                </span>
                <h3 className="mt-4 text-[17px] font-bold text-[#211A15]">{s.t}</h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-[#4A3F36]">{s.b}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div key={f.t} className="flex gap-3.5">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#DA4A1C]/10">
                  <Icon name={f.icon} size={18} className="text-[#DA4A1C]" />
                </span>
                <div>
                  <h4 className="text-[15px] font-bold text-[#211A15]">{f.t}</h4>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-[#4A3F36]">{f.b}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Social proof (hides itself when the list is empty) ───────────── */}
      {TESTIMONIALS.length > 0 ? (
        <section className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="text-[27px] font-extrabold tracking-tight text-[#211A15]">
            {sw ? "Wanachosema" : "What people say"}
          </h2>
          <div className="mt-7 grid gap-5 sm:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <figure key={t.name} className="rounded-2xl border border-[#E9E0D4] bg-white p-6">
                <blockquote className="text-[14.5px] leading-relaxed text-[#211A15]">
                  “{sw ? t.quote.sw : t.quote.en}”
                </blockquote>
                <figcaption className="mt-4 text-[13px] text-[#756A5E]">
                  <span className="font-bold text-[#211A15]">{t.name}</span>
                  {" · "}
                  {sw ? t.detail.sw : t.detail.en}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      ) : null}

      {/* ── Early access + referral ──────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 pb-16">
        <div className="grid gap-5 sm:grid-cols-2">
          {/* Early access. The scarcity here is real: there is no Play Store
              listing yet, so "early" is a statement of fact, not a trick. */}
          <div className="rounded-2xl border border-[#DA4A1C]/25 bg-[#DA4A1C]/5 p-6">
            <span className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.13em] text-[#DA4A1C]">
              <Icon name="flame" size={14} />
              {sw ? "Ufikiaji wa mapema" : "Early access"}
            </span>
            <h3 className="mt-3 text-[20px] font-extrabold text-[#211A15]">
              {seatsFull
                ? sw
                  ? "Nafasi 50 zimechukuliwa"
                  : "All 50 places taken"
                : sw
                  ? "Wapatao 50 wa kwanza hupata wiki ya Pro"
                  : "The first 50 get a week of Pro"}
            </h3>
            <p className="mt-2 text-[14.5px] leading-relaxed text-[#4A3F36]">
              {seatsFull
                ? sw
                  ? "Nafasi zote za waanzilishi 50 zimechukuliwa. Bado unaweza kupakua app, na ukikaribisha rafiki unapata siku za Pro."
                  : "All 50 founder places are gone. You can still install the app, and referrals still earn Pro days."
                : sw
                  ? "App haijafika Play Store bado. Wapatao 50 wa kwanza wanapata wiki moja ya Sumaiya Pro, na wanakuwa Wanachama wa Mwanzo kwenye ufikiaji wa mapema."
                  : "The app is not on Play Store yet. The first 50 installers get a week of Sumaiya Pro, and Founding Member status through early access."}
            </p>

            {seatsPct !== null && early && early.remaining !== null ? (
              <div className="mt-4">
                <div className="h-2 w-full overflow-hidden rounded-full bg-[#DA4A1C]/15">
                  <div className="h-full rounded-full bg-[#DA4A1C]" style={{ width: `${seatsPct}%` }} />
                </div>
                <p className="mt-2 text-[12.5px] font-semibold text-[#756A5E]">
                  {sw
                    ? `Nafasi ${early.remaining} zimebaki kati ya ${early.seats}`
                    : `${early.remaining} of ${early.seats} places left`}
                </p>
              </div>
            ) : null}

            <a
              href={APK_HREF}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#DA4A1C] px-5 py-3 text-[14.5px] font-bold text-white"
            >
              <Icon name="download" size={16} />
              {seatsFull
                ? sw
                  ? "Pakua app"
                  : "Install the app"
                : sw
                  ? "Pakua APK ya mapema"
                  : "Get the early APK"}
            </a>
          </div>

          {/* Referral. Real, already implemented, and paid on activation. */}
          <div className="rounded-2xl border border-[#E9E0D4] bg-white p-6">
            <span className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.13em] text-[#12433D]">
              <Icon name="user" size={14} />
              {sw ? "Karibisha na upate" : "Invite and earn"}
            </span>
            <h3 className="mt-3 text-[20px] font-extrabold text-[#211A15]">
              {sw
                ? `Siku ${REFERRAL_DAYS_PER_FRIEND} za Pro kwa kila rafiki`
                : `${REFERRAL_DAYS_PER_FRIEND} days of Pro per friend`}
            </h3>
            <p className="mt-2 text-[14.5px] leading-relaxed text-[#4A3F36]">
              {sw
                ? `Karibisha rafiki kwa kiungo chako. Ukisha tengeneza CV yake, unapata siku ${REFERRAL_DAYS_PER_FRIEND} za Sumaiya Pro — na yeye anaipata pia. Rafiki ${REFERRAL_FOREVER_AT} walioamilika wanakupa Pro ya maisha, na kila mtu anaweza kupata hadi marafiki ${REFERRAL_MAX_REWARDED}.`
                : `Share your link with a friend. Once they build their first CV you get ${REFERRAL_DAYS_PER_FRIEND} days of Sumaiya Pro — and so do they. ${REFERRAL_FOREVER_AT} completed friends converts it to Pro for life, and each person can be rewarded for up to ${REFERRAL_MAX_REWARDED} friends.`}
            </p>
            <p className="mt-3 rounded-lg bg-[#FAF5EE] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[#756A5E]">
              {sw
                ? `Siku zinalipwa rafiki akishatengeneza CV yake ya kwanza — si kwa kujiandikisha tu. Hivyo ndivyo tunavyohakikisha zawadi inaenda kwa watu wa kweli.`
                : `Days are paid once your friend has built their first CV — not for signing up. That is how we make sure the reward goes to real people.`}
            </p>
            <a
              href={APK_HREF}
              className="mt-5 inline-flex items-center gap-2 rounded-xl border border-[#12433D]/30 bg-[#12433D]/6 px-5 py-3 text-[14.5px] font-bold text-[#12433D]"
            >
              <Icon name="share" size={16} />
              {sw ? "Pakua app, kisha karibisha" : "Install, then invite"}
            </a>
          </div>
        </div>

        <p className="mt-5 text-[13px] leading-relaxed text-[#756A5E]">
          {sw
            ? "Hakuna malipo yanayohitajika kwa sasa. Pro inapatikana kwa ufikiaji wa mapema na kwa kukaribisha rafiki."
            : "No payment is being taken yet. Pro is earned through early access and referrals."}
        </p>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section className="bg-[#211A15]">
        <div className="mx-auto max-w-4xl px-5 py-16 text-center">
          <h2 className="text-[29px] font-extrabold tracking-tight text-[#FAF5EE] sm:text-[34px]">
            {sw ? "Anza na muundo wako leo" : "Start with your design today"}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[15.5px] leading-relaxed text-[#C9BDB2]">
            {sw
              ? "Anza mtandaoni hapa hapa, au pakua app kwa uzoefu kamili. Bure kuanza — maliza CV yako kabla ya chakula cha mchana."
              : "Start online right here, or install the app for the full experience. Free to start — finish your CV before lunch."}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <CreateEntryButton
              docType="cv"
              lang={sw ? "sw" : "en"}
              className="inline-flex items-center gap-2.5 rounded-xl bg-[#DA4A1C] px-6 py-4 text-[16px] font-bold text-white transition-transform hover:-translate-y-0.5"
            >
              <Icon name="spark" size={19} />
              {sw ? "Anza mtandaoni — bure" : "Start online — free"}
            </CreateEntryButton>
            <a
              href={APK_HREF}
              className="inline-flex items-center gap-2.5 rounded-xl border border-[#FAF5EE]/25 px-6 py-4 text-[16px] font-bold text-[#FAF5EE] transition-colors hover:border-[#FAF5EE]/50"
            >
              <Icon name="download" size={19} />
              {sw ? "Pakua app ya Android" : "Get the Android app"}
            </a>
          </div>
          <p className="mt-4 text-[13px] text-[#8C7F73]">
            {sw ? "Play Store hivi karibuni." : "Play Store soon."}
          </p>
        </div>
      </section>
    </main>
  );
}
