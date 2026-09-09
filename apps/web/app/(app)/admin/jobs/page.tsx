import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { db, job } from "@/lib/db";
import { desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export const metadata = { title: "Jobs · Admin" };
export const dynamic = "force-dynamic";

const STATUS_META: Record<string, { label: string; cls: string }> = {
  published: { label: "Published", cls: "bg-pine-tint text-pine" },
  expiring: { label: "Expiring", cls: "bg-ember/10 text-ember-hover" },
  draft: { label: "Draft", cls: "bg-[#F5E9D6] text-[#8a5a00]" },
  expired: { label: "Expired", cls: "bg-sand text-text-muted" },
  rejected: { label: "Rejected", cls: "bg-red-50 text-red-600" },
};

async function getJobs() {
  try {
    return await db.select().from(job).orderBy(desc(job.createdAt)).limit(400);
  } catch {
    return []; // table may not exist until the 0004_jobs_lifecycle migration runs
  }
}

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isAdmin(user?.email)) return null;
  return user;
}

async function createJob(formData: FormData) {
  "use server";
  const user = await requireAdmin();
  if (!user) return;
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  // Only accept http(s) apply links; drop anything else so a javascript:/data:
  // URL can't be stored and later execute when a visitor clicks Apply.
  const rawApplyUrl = String(formData.get("applyUrl") ?? "").trim();
  const applyUrl = /^https?:\/\//i.test(rawApplyUrl) ? rawApplyUrl : "";
  const rawDeadline = String(formData.get("applicationDeadline") ?? "").trim();
  const applicationDeadline = rawDeadline ? new Date(rawDeadline) : null;
  const source = String(formData.get("source") ?? "").trim() || "admin";
  try {
    await db.insert(job).values({
      id: nanoid(),
      title,
      company: String(formData.get("company") ?? "").trim(),
      location: String(formData.get("location") ?? "").trim(),
      category: String(formData.get("category") ?? "").trim(),
      employmentType: String(formData.get("employmentType") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      applyUrl,
      source,
      sourceName: source === "jobicy" ? "Jobicy" : source === "remotive" ? "Remotive" : "Manual",
      postedBy: user.id,
      status: "published",
      applicationDeadline,
      lastVerifiedAt: new Date(),
    });
    revalidatePath("/admin/jobs");
  } catch {}
}

async function setJobStatus(formData: FormData) {
  "use server";
  const user = await requireAdmin();
  if (!user) return;
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !["draft", "published", "expiring", "expired", "rejected"].includes(status)) return;
  try {
    await db.update(job).set({ status, updatedAt: new Date() }).where(eq(job.id, id));
    revalidatePath("/admin/jobs");
  } catch {}
}

async function toggleFeatured(formData: FormData) {
  "use server";
  const user = await requireAdmin();
  if (!user) return;
  const id = String(formData.get("id") ?? "");
  const featured = String(formData.get("featured") ?? "") === "true";
  if (!id) return;
  try {
    await db.update(job).set({ featured, updatedAt: new Date() }).where(eq(job.id, id));
    revalidatePath("/admin/jobs");
  } catch {}
}

async function verifyJob(formData: FormData) {
  "use server";
  const user = await requireAdmin();
  if (!user) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  try {
    // Manual re-verification: mark as live + refresh the stamp so the lifecycle
    // doesn't expire it for another grace period.
    await db
      .update(job)
      .set({ status: "published", lastVerifiedAt: new Date(), updatedAt: new Date() })
      .where(eq(job.id, id));
    revalidatePath("/admin/jobs");
  } catch {}
}

async function deleteJob(formData: FormData) {
  "use server";
  const user = await requireAdmin();
  if (!user) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  try {
    await db.delete(job).where(eq(job.id, id));
    revalidatePath("/admin/jobs");
  } catch {}
}

const inputCls =
  "w-full rounded-input border border-border-input bg-sand-2 px-3 py-2 text-sm text-espresso focus:outline-none focus:ring-2 focus:ring-ember/30 focus:border-ember placeholder:text-text-muted/60";

export default async function AdminJobs() {
  const jobs = await getJobs();
  const count = (s: string) => jobs.filter((j) => j.status === s).length;
  const liveCount = count("published") + count("expiring");

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[2px] text-ember-hover">Feed</p>
        <h1 className="font-display font-extrabold text-3xl text-espresso tracking-tight mt-1">Jobs</h1>
        <p className="text-xs text-text-muted mt-2">
          {jobs.length} total · {liveCount} live. Listings appear on the public{" "}
          <a href="/jobs" className="text-ember-hover font-medium hover:underline">/jobs</a> feed, matched against each seeker&apos;s CV.
        </p>
      </div>

      {/* Status overview */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {["published", "expiring", "draft", "expired", "rejected"].map((s) => (
          <div key={s} className="bg-card border border-border rounded-card px-3 py-2.5">
            <p className="text-xl font-display font-extrabold text-espresso">{count(s)}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">{STATUS_META[s]?.label ?? s}</p>
          </div>
        ))}
      </div>

      {/* New job */}
      <form action={createJob} className="bg-card border border-border rounded-card p-4 space-y-3">
        <p className="font-semibold text-espresso text-sm">Post a job</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <input name="title" required placeholder="Job title *" className={inputCls} />
          <input name="company" placeholder="Company" className={inputCls} />
          <input name="location" placeholder="Location (e.g. Dar es Salaam, TZ)" className={inputCls} />
          <input name="category" placeholder="Category (e.g. Sales, IT, Health)" className={inputCls} />
          <input name="employmentType" placeholder="Type (e.g. Full-time)" className={inputCls} />
          <input name="applyUrl" placeholder="Apply URL (optional)" className={inputCls} />
          <input name="applicationDeadline" type="date" placeholder="Application deadline" className={inputCls} />
          <input name="source" placeholder="Source (default: admin)" className={inputCls} />
        </div>
        <textarea name="description" rows={5} placeholder="Job description — paste the full posting so CV matching works well." className={inputCls} />
        <div className="flex justify-end">
          <button className="rounded-input bg-ember text-cream px-4 py-2 text-sm font-semibold hover:bg-ember-hover transition">
            Publish job
          </button>
        </div>
      </form>

      {/* Existing jobs */}
      {jobs.length === 0 ? (
        <div className="bg-card border-2 border-dashed border-border rounded-card-lg p-12 text-center">
          <h2 className="font-display font-bold text-lg text-espresso">No jobs yet</h2>
          <p className="text-sm text-text-body mt-1 max-w-md mx-auto">
            Post the first role above, or run the jobs ingestion cron. If this stays empty after posting, run the{" "}
            <code className="font-mono">0004_jobs_lifecycle</code> migration in Supabase.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((j) => {
            const meta = STATUS_META[j.status] ?? STATUS_META.draft;
            return (
              <div key={j.id} className="bg-card border border-border rounded-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-espresso truncate">
                      {j.featured && <span className="text-gold mr-1">★</span>}
                      {j.title}
                    </p>
                    <p className="text-[11px] text-text-muted">
                      {[j.company, j.location, j.category, j.employmentType].filter(Boolean).join(" · ") || "—"}
                    </p>
                    {j.description && <p className="text-xs text-text-body mt-1 line-clamp-2">{j.description}</p>}
                    <p className="text-[10px] text-text-muted/70 mt-1.5">
                      {j.sourceName || j.source || "—"}
                      {j.applicationDeadline ? ` · deadline ${j.applicationDeadline.toISOString().slice(0, 10)}` : ""}
                      {j.lastVerifiedAt ? ` · verified ${j.lastVerifiedAt.toISOString().slice(0, 10)}` : ""}
                      {j.externalId ? ` · ext:${j.externalId}` : ""}
                    </p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-pill whitespace-nowrap ${meta.cls}`}>
                    {meta.label}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-border">
                  {j.applyUrl && (
                    <a href={j.applyUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-ember-hover font-medium hover:underline mr-auto">
                      Apply link ↗
                    </a>
                  )}
                  {j.status === "draft" && (
                    <form action={setJobStatus}>
                      <input type="hidden" name="id" value={j.id} />
                      <input type="hidden" name="status" value="published" />
                      <button className="rounded-input bg-pine text-cream px-3 py-1.5 text-xs font-semibold hover:opacity-90 transition">
                        Approve
                      </button>
                    </form>
                  )}
                  {j.status !== "expired" && j.status !== "rejected" && (
                    <>
                      <form action={setJobStatus}>
                        <input type="hidden" name="id" value={j.id} />
                        <input type="hidden" name="status" value="expired" />
                        <button className="rounded-input bg-sand text-text-body px-3 py-1.5 text-xs font-semibold hover:bg-sand-2 transition border border-border-input">
                          Expire
                        </button>
                      </form>
                      <form action={setJobStatus}>
                        <input type="hidden" name="id" value={j.id} />
                        <input type="hidden" name="status" value="rejected" />
                        <button className="rounded-input bg-sand text-red-600 px-3 py-1.5 text-xs font-semibold hover:bg-red-50 transition border border-border-input">
                          Reject
                        </button>
                      </form>
                    </>
                  )}
                  {j.status !== "published" && j.status !== "expiring" && (
                    <form action={verifyJob}>
                      <input type="hidden" name="id" value={j.id} />
                      <button className="rounded-input bg-sand text-pine px-3 py-1.5 text-xs font-semibold hover:bg-pine-tint transition border border-border-input">
                        Publish
                      </button>
                    </form>
                  )}
                  <form action={toggleFeatured}>
                    <input type="hidden" name="id" value={j.id} />
                    <input type="hidden" name="featured" value={j.featured ? "false" : "true"} />
                    <button className="rounded-input bg-sand text-text-body px-3 py-1.5 text-xs font-semibold hover:bg-sand-2 transition border border-border-input">
                      {j.featured ? "Unfeature" : "Feature"}
                    </button>
                  </form>
                  <form action={deleteJob}>
                    <input type="hidden" name="id" value={j.id} />
                    <button className="rounded-input bg-ember text-cream px-3 py-1.5 text-xs font-semibold hover:bg-ember-hover transition">
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
