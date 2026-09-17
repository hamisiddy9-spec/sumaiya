"use client";

import { useLang } from "@/lib/i18n/context";

/**
 * "Scan hapa kupata kazi" — the bridge from a desktop browser to the phone.
 *
 * WHY A QR AND NOT JUST A DOWNLOAD BUTTON
 * Most people meet Sumaiya on a laptop and actually use it on a phone. So the
 * desktop visitor is not the person who installs the app — they are the person
 * who points a camera at the screen. A download button does nothing for them;
 * a QR finishes the job in one gesture.
 *
 * WHERE IT POINTS, AND WHY NOT THE APK
 * The QR goes to the free ATS checker, not straight to a .apk:
 *   - an APK URL is a dead end on iPhone and on desktop, so a poster or a
 *     landing page that links only to it loses a slice of every audience
 *   - "download our app" gives nobody a reason to raise their phone; "find out
 *     why you are not getting hired" does. The checker proves value first, then
 *     offers the app as the way to keep it.
 *   - the checker is device-agnostic, so one printed poster works everywhere.
 *
 * The downloadable poster carries the same code, so what is on the website and
 * what ends up on a shop noticeboard stay identical.
 */
export function ScanToApp() {
  const lang = useLang();
  const sw = lang === "sw";

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-16">
      <div className="grid gap-10 rounded-3xl bg-espresso px-6 py-12 text-cream sm:px-12 md:grid-cols-[1fr_auto] md:items-center">
        <div className="max-w-xl">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-cream/60">
            {sw ? "Pata app" : "Get the app"}
          </p>
          <h2 className="mb-4 font-serif text-3xl font-bold leading-tight sm:text-4xl">
            {sw ? "Scan hapa kupata kazi" : "Scan here to get a job"}
          </h2>
          <p className="mb-6 text-base leading-relaxed text-cream/80">
            {sw
              ? "Fungua kamera ya simu yako, ilenge kwenye mraba huu. Utaona kwa nini CV yako haipati majibu — na jinsi ya kuirekebisha. Bure, bila malipo."
              : "Open your phone camera and point it at the square. You'll see why your CV isn't getting replies — and how to fix it. Free."}
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <a
              href="/downloads/sumaiya.apk"
              className="rounded-full bg-ember px-6 py-3 text-sm font-bold text-cream shadow-[0_2px_0_#A8330F] transition hover:brightness-110"
            >
              {sw ? "Pakua app ya Android" : "Download the Android app"}
            </a>
            {/* The printable version, so anyone can put this in a shop, a
                college noticeboard or a printing kiosk. */}
            <a
              href="/qr/poster-scan-kazi.svg"
              download
              className="text-sm font-semibold text-cream/80 underline decoration-cream/30 underline-offset-4 transition hover:text-cream"
            >
              {sw ? "Pakua bango la kuchapisha" : "Download the printable poster"}
            </a>
          </div>
        </div>

        {/* White plate: a QR printed on a dark background fails more often,
            and the quiet zone is part of the code whether people know it or not. */}
        <div className="flex justify-center md:justify-end">
          <div className="rounded-2xl bg-white p-4 shadow-[0_18px_40px_-18px_rgba(0,0,0,0.55)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/qr/scan-kazi-branded.svg"
              alt={
                sw
                  ? "Msimbo wa QR — scan kupata kazi"
                  : "QR code — scan to get a job"
              }
              width={220}
              height={220}
              className="block h-[220px] w-[220px]"
            />
            <p className="mt-3 text-center text-xs font-semibold text-espresso">
              {sw ? "sumaiya.app" : "sumaiya.app"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
