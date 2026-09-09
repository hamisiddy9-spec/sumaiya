import { db, profile, subscription } from "@/lib/db";
import { desc, ilike, or, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

interface Props { searchParams: { q?: string } }

async function getUsers(q?: string) {
  try {
    const rows = await db
      .select({
        id: profile.id,
        name: profile.name,
        email: profile.email,
        createdAt: profile.createdAt,
        plan: subscription.plan,
        status: subscription.status,
      })
      .from(profile)
      .leftJoin(subscription, eq(subscription.userId, profile.id))
      .where(q ? or(ilike(profile.name, `%${q}%`), ilike(profile.email, `%${q}%`)) : undefined)
      .orderBy(desc(profile.createdAt))
      .limit(100);
    return rows;
  } catch {
    return [];
  }
}

export default async function AdminUsers({ searchParams }: Props) {
  const q = searchParams.q?.trim() || "";
  const users = await getUsers(q || undefined);

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[2px] text-ember-hover">Manage</p>
        <h1 className="font-display font-extrabold text-3xl text-espresso tracking-tight mt-1">Users</h1>
      </div>

      <form className="flex gap-2" action="/admin/users">
        <input name="q" defaultValue={q} placeholder="Search name or email…"
          className="flex-1 max-w-sm rounded-input border border-border-input bg-card px-4 py-2.5 text-sm text-espresso placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-ember/30 focus:border-ember" />
        <button className="rounded-input bg-espresso text-cream px-5 py-2.5 text-sm font-semibold hover:bg-espresso-2 transition">Search</button>
      </form>

      <div className="bg-card border border-border rounded-card overflow-x-auto">
        {users.length === 0 ? (
          <p className="p-6 text-sm text-text-muted">{q ? "No users match that search." : "No users yet."}</p>
        ) : (
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="text-left text-text-muted border-b border-border">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Plan</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 font-medium text-espresso">{u.name || "—"}</td>
                  <td className="px-5 py-3 text-text-body">{u.email || "—"}</td>
                  <td className="px-5 py-3 text-text-body capitalize">{u.plan ?? "—"}</td>
                  <td className="px-5 py-3">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-pill ${
                      u.status === "active" ? "bg-pine-tint text-pine"
                        : u.status === "trialing" ? "bg-gold-tint text-gold-text"
                        : "bg-sand text-text-muted"
                    }`}>{u.status ?? "free"}</span>
                  </td>
                  <td className="px-5 py-3 text-text-muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="text-xs text-text-muted">Showing up to 100 most recent users with a saved profile.</p>
    </div>
  );
}
