"use client";

import { Download } from "lucide-react";
import { capture } from "@/lib/analytics";

/** The APK download CTA. Fires `app_download_clicked` so the ad → install step
 *  is measurable, then lets the browser handle the real download. */
export function DownloadApkButton({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      download
      onClick={() => {
        try {
          capture("app_download_clicked");
        } catch {
          /* analytics must never block the download */
        }
      }}
      className="inline-flex items-center gap-2.5 rounded-2xl bg-espresso px-8 py-4 font-display font-bold text-lg text-cream shadow-sm hover:opacity-90 transition-opacity"
    >
      <Download className="h-5 w-5" aria-hidden="true" />
      {label}
    </a>
  );
}
