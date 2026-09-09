import { db, profile, cv, coverLetter, businessCard, letter, application, subscription, aiUsage } from "@/lib/db";
import { count, eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

async function safeCount(table: Parameters<typeof count>[0] extends never ? never : any): Promise<number> {
  try {
    const [row] = await db.select({ c: count() }).from(table);
    return row?.c ?? 0;
  } catch {
    return 0;
  }
}

async function getMetrics() {
  const [profiles, cvs, coverLetters, cards, letters, apps, ai] = await Promise.all([
    safeCount(profile), safeCount(cv), safeCount(coverLetter),
    safeCount(businessCard), safeCount(letter), safeCount(application), safeCount(aiUsage),
  ]);

  let activeSubs = 0;
  try {
    const [row] = await db.select({ c: count() }).from(subscription).where(eq(subscription.status, "active"));
    activeSubs = row?.c ?? 0;
  } catch {}

  let recent: { id: string; name: string; email: string; createdAt: Date }[] = [];
  try {
    recent = await db.select({ id: profile.id, name: profile.name, email: profile.email, createdAt: profile.createdAt })
      .from(profile).orderBy(desc(profile.createdAt)).limit(8);
  } catch {}

  return { profiles, cvs, coverLetters, cards, letters, apps, ai, activeSubs, docs: cvs + coverLetters + cards + letters, recent };
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="bg-card border border-border rounded-card p-5">
      <p className="font-mono text-[10px] uppercase tracking-[1.5px] text-text-muted">{label}</p>
      <p className={`font-display font-extrabold text-4xl mt-1 tracking-tight ${accent ?? "text-espresso"}`}>{value.toLocaleString()}</p>
    </div>
  );
}

export default async function AdminDashboard() {
  const m = await getMetrics();
  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[2px] text-ember-hover">Overview</p>
        <h1 className="font-display font-extrabold text-3xl text-espresso tracking-tight mt-1">Dashboard</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Users" value={m.profiles} />
        <Stat label="Documents" value={m.docs} accent="text-ember" />
        <Stat label="Active subs" value={m.activeSubs} accent="text-pine" />
        <Stat label="Applications" value={m.apps} />
      </div>

      <div>
        <h2 className="font-display font-bold text-lg text-espresso mb-3">By document type</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Stat label="CVs" value={m.cvs} />
          <Stat label="Cover letters" value={m.coverLetters} />
          <Stat label="Business cards" value={m.cards} />
          <Stat label="Formal letters" value={m.letters} />
          <Stat label="AI calls" value={m.ai} accent="text-purple-glow" />
        </div>
      </div>

      <div>
        <h2 className="font-display font-bold text-lg text-espresso mb-3">Recent signups</h2>
        <div className="bg-card border border-border rounded-card overflow-hidden">
          {m.recent.length === 0 ? (
            <p className="p-6 text-sm text-text-muted">No profiles yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-text-muted border-b border-border">
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {m.recent.map((u) => (
                  <tr key={u.id} className="border-b border-border last:border-0">
                    <td className="px-5 py-3 font-medium text-espresso">{u.name || "—"}</td>
                    <td className="px-5 py-3 text-text-body">{u.email || "—"}</td>
                    <td className="px-5 py-3 text-text-muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
