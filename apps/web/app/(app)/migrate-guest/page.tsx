"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2 } from "lucide-react";
import { getSession } from "@/lib/auth-client";

// Module-level guard so a double-invoked effect (React strict mode) or a
// re-mount while the POST is in flight can't create a duplicate CV. Reset on
// failure so the user can still retry.
let migrating = false;

export default function MigrateGuestPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [sw, setSw] = useState(false);

  useEffect(() => {
    setSw(document.cookie.includes("lang=sw"));
  }, []);

  useEffect(() => {
    async function migrate() {
      if (migrating) return;
      migrating = true;
      try {
        const guestData = localStorage.getItem("sumaiya-guest-cv");

        if (!guestData) {
          setNotFound(true);
          return;
        }

        const { data: { session } } = await getSession();
        if (!session) {
          router.replace("/sign-in");
          return;
        }

        const parsed = JSON.parse(guestData) as {
          cv?: Record<string, unknown>;
          title?: string;
          templateId?: string;
          primaryColor?: string;
          fontFamily?: string;
          migrationId?: string;
          downloadIntent?: string;
        };

        // A stable idempotency key for this draft. Persist it back so that if the
        // POST succeeds but its response is lost (mobile drop, tab killed) and
        // localStorage isn't cleared, a later migration reuses the SAME key —
        // the server derives the same CV id and no-ops instead of duplicating.
        let migrationId = parsed.migrationId;
        if (!migrationId) {
          migrationId = crypto.randomUUID();
          try {
            localStorage.setItem("sumaiya-guest-cv", JSON.stringify({ ...parsed, migrationId }));
          } catch {}
        }

        const res = await fetch("/api/cv", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            title: parsed.title ?? "My CV",
            templateId: parsed.templateId ?? "nakuru",
            primaryColor: parsed.primaryColor ?? "#DA4A1C",
            fontFamily: parsed.fontFamily ?? "Inter",
            data: parsed.cv ?? {},
            clientId: migrationId,
          }),
        });

        if (!res.ok) throw new Error("Failed to save CV");

        const result = await res.json() as { success: boolean; data: { id: string } };
        localStorage.removeItem("sumaiya-guest-cv");
        // Carry the download intent into the editor so it resumes the download
        // the guest was trying to do when the sign-up wall interrupted them.
        const suffix = parsed.downloadIntent === "pdf" ? "?download=pdf" : "";
        router.replace(`/editor/cv/${result.data.id}${suffix}`);
      } catch {
        migrating = false; // allow a retry
        const swErr = document.cookie.includes("lang=sw");
        setError(swErr
          ? "Imeshindwa kuhifadhi CV yako. Tafadhali jaribu tena."
          : "Failed to save your CV. Please try again.");
      }
    }

    migrate();
  }, [router]);

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sand p-4">
        <div className="bg-card rounded-card-lg shadow-card p-8 text-center max-w-sm border border-border">
          <div className="w-16 h-16 bg-sand rounded-2xl flex items-center justify-center mx-auto mb-5">
            <FileText className="w-8 h-8 text-text-muted" />
          </div>
          <h1 className="font-display text-espresso text-xl font-semibold mb-1">
            {sw ? "Hatukupata rasimu yako" : "We couldn't find your draft"}
          </h1>
          <p className="text-text-body text-sm mb-6">
            {sw
              ? "Huenda CV yako ya mgeni ilianzishwa kwenye kivinjari kingine au tayari imehifadhiwa. Unaweza kuanza mpya kutoka dashibodi yako."
              : "Your guest CV may have been started in a different browser or already saved. You can start a new one from your dashboard."}
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center justify-center bg-ember text-cream font-semibold px-5 py-2.5 rounded-card-lg transition text-sm shadow-ember-hard hover:bg-ember-hover active:shadow-ember-active"
          >
            {sw ? "Nenda Dashibodi" : "Go to Dashboard"}
          </a>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sand p-4">
        <div className="bg-card rounded-card-lg shadow-card p-8 text-center max-w-sm border border-border">
          <p className="text-ember-hover font-semibold mb-4">{error}</p>
          <a
            href="/dashboard"
            className="inline-flex items-center justify-center bg-ember text-cream font-semibold px-5 py-2.5 rounded-card-lg transition text-sm shadow-ember-hard hover:bg-ember-hover active:shadow-ember-active"
          >
            {sw ? "Nenda Dashibodi" : "Go to Dashboard"}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-sand p-4">
      <div className="bg-card rounded-card-lg shadow-card p-8 text-center max-w-sm border border-border">
        <div className="w-16 h-16 bg-ember-tint rounded-2xl flex items-center justify-center mx-auto mb-5">
          <FileText className="w-8 h-8 text-ember" />
        </div>
        <Loader2 className="w-6 h-6 text-ember animate-spin mx-auto mb-3" />
        <h1 className="font-display text-espresso text-xl font-semibold">
          {sw ? "Inahifadhi CV yako kwenye akaunti yako…" : "Saving your CV to your account…"}
        </h1>
        <p className="text-text-muted text-sm mt-1">
          {sw ? "Utapelekwa kwenye kihariri baada ya muda mfupi." : "You'll be taken to the editor in a moment."}
        </p>
      </div>
    </div>
  );
}
