import Link from "next/link";
import { headers } from "next/headers";
import { Logo } from "@/components/ui/logo";
import { Link2Off } from "lucide-react";

// Shown when a shared link points at a CV that is no longer public (owner turned
// sharing off) or a mistyped slug. A branded, localized dead-end that still does
// growth work — instead of a jarring generic 404 it invites the visitor to build
// their own CV.
export default async function CvNotFound() {
  const sw = ((await headers()).get("x-lang") ?? "sw") !== "en";
  return (
    <div className="min-h-dvh bg-sand-2 flex flex-col items-center justify-center px-6 text-center">
      <div className="mb-10">
        <Logo size="md" />
      </div>
      <div className="w-20 h-20 bg-cream rounded-3xl flex items-center justify-center mb-7 shadow-card">
        <Link2Off className="w-9 h-9 text-text-muted" />
      </div>
      <p className="text-xs font-semibold text-ember-hover uppercase tracking-widest mb-3">
        {sw ? "Kiungo hakipatikani" : "Link unavailable"}
      </p>
      <h1 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight text-espresso mb-3 max-w-md">
        {sw ? "CV hii haishirikiwi tena" : "This CV is no longer shared"}
      </h1>
      <p className="text-text-body leading-relaxed max-w-sm mb-9">
        {sw
          ? "Mmiliki huenda amezima kushiriki au kiungo kimeandikwa vibaya. Lakini unaweza kutengeneza CV yako mwenyewe — bila malipo."
          : "The owner may have turned off sharing, or the link was mistyped. But you can build your own CV — free."}
      </p>
      <Link
        href="/editor/cv/try?ref=cv-share-404"
        className="inline-flex items-center justify-center gap-1.5 bg-ember hover:bg-ember-hover text-cream font-semibold text-[15px] px-7 py-3 rounded-input-lg shadow-ember-hard active:shadow-ember-active active:translate-y-[2px] transition-all"
      >
        {sw ? "Tengeneza CV yako bure" : "Build your CV free"}
      </Link>
      <Link href="/" className="mt-5 text-sm text-text-muted hover:text-espresso transition">
        {sw ? "Nenda mwanzo" : "Go to homepage"}
      </Link>
    </div>
  );
}
