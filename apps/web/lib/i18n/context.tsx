"use client";
import { createContext, useContext } from "react";
import { MotionConfig } from "framer-motion";
import { translations, type Lang } from "./translations";

const LangContext = createContext<Lang>("sw");

export function LangProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  return (
    <LangContext.Provider value={lang}>
      {/* reducedMotion="user" makes every framer-motion animation honour the
          viewer's OS "reduce motion" setting automatically. */}
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LangContext.Provider>
  );
}

export function useLang() { return useContext(LangContext); }
