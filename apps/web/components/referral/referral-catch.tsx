"use client";

// Captures a ?ref=<code> link and redeems it once the visitor is signed in.
//
// Renders nothing. Mounted in both the marketing and app layouts:
//   - on the marketing side it stashes the code (the visitor isn't signed in
//     yet) and cleans the URL
//   - on the app side (or a later visit) it POSTs the claim; a 401 just means
//     "not signed in yet" — the stash stays for next time.

import { useEffect } from "react";

const KEY = "sumaiya_ref";

export function ReferralCatch() {
  useEffect(() => {
    let code: string | null = null;
    try {
      const params = new URLSearchParams(window.location.search);
      const fromUrl = params.get("ref");
      if (fromUrl && /^[a-z0-9]{4,16}$/i.test(fromUrl)) {
        code = fromUrl.toLowerCase();
        localStorage.setItem(KEY, code);
        params.delete("ref");
        const qs = params.toString();
        window.history.replaceState(
          {},
          "",
          window.location.pathname + (qs ? `?${qs}` : "") + window.location.hash,
        );
      } else {
        code = localStorage.getItem(KEY);
      }
    } catch {
      return;
    }
    if (!code) return;

    const controller = new AbortController();
    fetch("/api/referral/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
      signal: controller.signal,
    })
      .then((r) => {
        // 401 = not signed in yet — keep the stash. Anything else is final.
        if (r.status !== 401) {
          try {
            localStorage.removeItem(KEY);
          } catch {
            /* ignore */
          }
        }
      })
      .catch(() => {
        /* offline — try again next mount */
      });
    return () => controller.abort();
  }, []);

  return null;
}
