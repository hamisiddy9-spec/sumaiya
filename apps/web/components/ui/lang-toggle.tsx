"use client";
import { useLang } from "@/lib/i18n/context";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";

export function LangToggle() {
  const lang = useLang();
  const router = useRouter();

  function toggle() {
    const next = lang === "en" ? "sw" : "en";
    document.cookie = `lang=${next};path=/;max-age=31536000`;
    // Refresh server components (which read the lang cookie via headers) instead
    // of a full page reload — keeps client state, scroll position and bundles.
    router.refresh();
    // Best-effort, fire-and-forget: persist server-side too, so anything
    // composed OUTSIDE this request (a cron job's push notification) can be
    // written in the right language. 401s silently for a guest — the cookie
    // still applies locally either way.
    fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lang: next }),
    }).catch(() => {});
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg border border-cream/20 hover:border-cream/40 hover:bg-espresso-2 transition focus-visible:outline-none focus-visible:shadow-focus-ember"
      title={lang === "en" ? "Switch to Swahili" : "Switch to English"}
      aria-label={lang === "en" ? "Switch to Swahili" : "Switch to English"}
    >
      <Icon name="globe-lang" size={15} className="text-cream/70" />
      {/* Label names the language the button switches TO, spelled out, so it's
          self-explanatory: in English it reads "Kiswahili", in Swahili "English". */}
      <span className="text-cream">{lang === "en" ? "Kiswahili" : "English"}</span>
    </button>
  );
}
