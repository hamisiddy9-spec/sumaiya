/**
 * Lightweight bilingual layer (EN / SW).
 *
 * This is NOT a full localization framework — the app UI stays mostly English
 * for now (see product direction doc, decision #5). What this gives us:
 *   - a single persisted source of truth for the user's language choice
 *   - `t("english", "kiswahili")` for the handful of high-visibility strings
 *   - a value Sumaiya + the speech layer read so she answers in the right
 *     language and greets correctly
 *
 * Before this, the Profile language toggle wrote `setSecureItem("language", …)`
 * and nothing ever read it back — a dead control.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getSecureItem, setSecureItem } from "@sumaiya/utils";
import { apiClient } from "./api-client";

export type Lang = "en" | "sw";

interface LangContextValue {
  lang: Lang;
  ready: boolean;
  setLang: (l: Lang) => void;
  /** Pick the string for the current language. */
  t: (en: string, sw: string) => string;
}

const LangContext = createContext<LangContextValue | null>(null);

// A plain module-level mirror of the current language, read by
// error-boundary.tsx. That component is deliberately dependency-free (a
// crash could come from this very provider), so it can't use useLang() —
// but a bare variable read via a plain function call carries none of
// React's own failure modes, and module state survives even if the
// LangProvider component itself has crashed and unmounted.
let lastKnownLang: Lang = "en";
export function getLastKnownLang(): Lang {
  return lastKnownLang;
}

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await getSecureItem("language");
        if (stored === "en" || stored === "sw") {
          setLangState(stored);
          lastKnownLang = stored;
        }
      } catch {
        /* non-fatal — default en */
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    lastKnownLang = l;
    setSecureItem("language", l).catch(() => {
      /* non-fatal */
    });
    // Best-effort — server-composed messages (push notifications from a
    // cron job) have no access to this device's local setting otherwise.
    // Silently ignored offline/signed-out; the local choice still applies.
    apiClient.setLangPreference(l).catch(() => {
      /* non-fatal */
    });
  }, []);

  const value = useMemo<LangContextValue>(
    () => ({
      lang,
      ready,
      setLang,
      t: (en, sw) => (lang === "sw" ? sw : en),
    }),
    [lang, ready, setLang],
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) {
    // Defensive: never crash a screen if the provider is missing in a test.
    return { lang: "en", ready: true, setLang: () => {}, t: (en) => en };
  }
  return ctx;
}

/** Sumaiya's opening line, in the user's language. */
export function greetingFor(lang: Lang): string {
  return lang === "sw"
    ? "Habari, mimi ni Sumaiya. Naweza kuandika CV yako, kuisawazisha na kazi fulani, kuandaa barua ya maombi, au tuongee tu. Unafanya nini leo?"
    : "Hi, I'm Sumaiya. I can write your CV, tailor it to a job, draft a cover letter, or just talk it through — in English or Kiswahili. What are you working on?";
}
