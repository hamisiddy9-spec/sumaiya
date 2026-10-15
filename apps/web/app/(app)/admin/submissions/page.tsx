import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { db, templateSubmission } from "@/lib/db";
import { desc, eq } from "drizzle-orm";
import { MARKETPLACE_ENABLED } from "@/lib/flags";

export const metadata = { title: "Submissions · Admin" };
export const dynamic = "force-dynamic";

async function getSubmissions() {
  try {
    return await db.select().from(templateSubmission).orderBy(desc(templateSubmission.createdAt)).limit(100);
  } catch {
    return []; // table may not exist until the 0003 migration runs
  }
}

async function moderate(formData: FormData) {
  "use server";
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!isAdmin(session?.user?.email)) return;
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !["approved", "rejected", "changes", "pending"].includes(status)) return;
  try {
    await db.update(templateSubmission)
      .set({ status, reviewNote: String(formData.get("note") ?? ""), updatedAt: new Date() })
      .where(eq(templateSubmission.id, id));
    revalidatePath("/admin/submissions");
  } catch {}
}

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-gold-tint text-gold-text",
  approved: "bg-pine-tint text-pine",
  rejected: "bg-ember-tint text-ember-hover",
  changes: "bg-sand text-text-body",
};

export default async function AdminSubmissions() {
  const subs = await getSubmissions();

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[2px] text-ember-hover">Moderation</p>
        <h1 className="font-display font-extrabold text-3xl text-espresso tracking-tight mt-1">Design Submissions</h1>
        {!MARKETPLACE_ENABLED && (
          <p className="text-xs text-text-muted mt-2">
            Marketplace submissions are currently <span className="font-semibold">disabled</span> for users
            (set <code className="font-mono">NEXT_PUBLIC_MARKETPLACE_ENABLED=true</code> and run the
            <code className="font-mono"> 0003_marketplace</code> migration to open it). Review tooling below is live.
          </p>
        )}
      </div>

      {subs.length === 0 ? (
        <div className="bg-card border-2 border-dashed border-border rounded-card-lg p-12 text-center">
          <h2 className="font-display font-bold text-lg text-espresso">No submissions yet</h2>
          <p className="text-sm text-text-body mt-1 max-w-md mx-auto">
            When users submit designs, they&apos;ll appear here to approve, reject, or request changes.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {subs.map((s) => (
            <div key={s.id} className="bg-card border border-border rounded-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="w-9 h-9 rounded-lg shrink-0 border border-border" style={{ background: s.primaryColor }} />
                  <div className="min-w-0">
                    <p className="font-semibold text-espresso truncate">{s.name}</p>
                    <p className="text-[11px] text-text-muted">
                      {s.docType} · base {s.baseTemplateId} · by {s.submitterName || "—"}
                      {s.category ? ` · ${s.category}` : ""}
                    </p>
                    {s.description && <p className="text-xs text-text-body mt-1 line-clamp-2">{s.description}</p>}
                  </div>
                </div>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-pill capitalize whitespace-nowrap ${STATUS_STYLE[s.status] ?? "bg-sand text-text-muted"}`}>{s.status}</span>
              </div>
              <form action={moderate} className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-border">
                <input type="hidden" name="id" value={s.id} />
                <input name="note" placeholder="Optional note to submitter…"
                  className="flex-1 min-w-[180px] rounded-input border border-border-input bg-sand-2 px-3 py-1.5 text-xs text-espresso focus:outline-none focus:ring-2 focus:ring-ember/30 focus:border-ember" />
                <button name="status" value="approved" className="rounded-input bg-pine text-cream px-3 py-1.5 text-xs font-semibold hover:opacity-90 transition">Approve</button>
                <button name="status" value="changes" className="rounded-input bg-sand text-text-body px-3 py-1.5 text-xs font-semibold hover:bg-sand-2 transition border border-border-input">Request changes</button>
                <button name="status" value="rejected" className="rounded-input bg-ember text-cream px-3 py-1.5 text-xs font-semibold hover:bg-ember-hover transition">Reject</button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
