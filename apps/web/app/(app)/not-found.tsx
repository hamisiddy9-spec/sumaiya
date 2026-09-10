import Link from "next/link";
import { headers } from "next/headers";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export default async function NotFound() {
  const sw = ((await headers()).get("x-lang") ?? "sw") === "sw";
  return (
    <div className="min-h-screen bg-sand flex flex-col items-center justify-center px-4 text-center font-sans">
      <div className="mb-16">
        <Logo size="md" />
      </div>

      <div className="w-24 h-24 bg-cream rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-card">
        <Search className="w-10 h-10 text-text-muted" />
      </div>

      <p className="text-sm font-semibold text-ember-hover uppercase tracking-widest mb-3">{sw ? "404 — Ukurasa haupatikani" : "404 — Page not found"}</p>
      <h1 className="text-4xl font-display font-extrabold tracking-tight text-espresso mb-4">
        {sw ? "Samahani, ukurasa huu haupo" : "Oops, this page doesn't exist"}
      </h1>
      <p className="text-lg text-text-body max-w-md leading-relaxed mb-10">
        {sw
          ? "Ukurasa unaoutafuta huenda umehamishwa au umeondolewa. Turudi kwenye njia."
          : "The page you're looking for may have moved or been removed. Let's get you back on track."}
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/">
          <Button variant="primary" size="lg">
            {sw ? "Rudi Mwanzo" : "Back to Home"}
          </Button>
        </Link>
        <Link href="/editor/cv/try">
          <Button variant="secondary" size="lg">
            {sw ? "Unda CV" : "Create a CV"}
          </Button>
        </Link>
      </div>

      <div className="mt-16 grid grid-cols-3 gap-6 max-w-sm text-sm">
        {[
          { href: "/templates", label: sw ? "Ona miundo" : "See the looks" },
          { href: "/contact", label: sw ? "Pata msaada" : "Get help" },
        ].map(({ href, label }) => (
          <Link key={href} href={href} className="text-ember hover:text-ember-hover font-medium hover:underline">
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
