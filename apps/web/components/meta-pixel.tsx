"use client";

// Meta (Facebook/Instagram) Pixel — the conversion tracker for paid ads. It is
// completely inert until NEXT_PUBLIC_META_PIXEL_ID is set, so shipping it costs
// nothing; the moment the owner pastes their Pixel ID in Vercel env vars, ad
// campaigns can track and optimize toward real conversions (CV downloads, sign-
// ups) instead of raw clicks.
//
// Usage for conversion events elsewhere in the app:  metaTrack("Lead")

import Script from "next/script";

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

type FbqParams = Record<string, string | number | boolean>;

// Safe fire-and-forget: no-ops when the pixel isn't configured or hasn't loaded,
// so callers never need to guard.
export function metaTrack(event: string, params?: FbqParams) {
  if (typeof window === "undefined") return;
  const fbq = (window as unknown as { fbq?: (...a: unknown[]) => void }).fbq;
  if (typeof fbq !== "function") return;
  try {
    fbq("track", event, params);
  } catch {
    /* never let analytics break the app */
  }
}

export function MetaPixel() {
  if (!PIXEL_ID) return null;
  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window,document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${PIXEL_ID}');
        fbq('track', 'PageView');`}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          alt=""
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}
