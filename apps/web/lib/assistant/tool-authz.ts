// Tool authorization — row ownership (system blueprint: "RLS as tool authz").
//
// The entitlement check (can()) answers "may this subject use this capability".
// This answers the other half: "does the row this call names actually belong to
// them". A tool that takes an applicationId / docId must not act on another
// user's record, whatever the caller.
//
// Runs as one step in the run-tool pipeline, right after entitlement. Guests
// (userId null) can't own rows, so any owned-resource tool is refused for them.
//
// Fail model: a row that is found but owned by someone else → refuse (closed).
// A lookup that *errors* (no DB in a unit test, a transient outage) → allow
// (open) — we can't prove a violation, and the downstream write is itself
// user-scoped. Only a definitive "found, wrong owner" blocks.

import { eq } from "drizzle-orm";
import { db, application, cv, coverLetter, letter, businessCard } from "@/lib/db";

const DOC_TABLES = {
  cv,
  cover_letter: coverLetter,
  letter,
  business_card: businessCard,
} as const;

type OwnerLookup = { ok: true; userId: string | null } | { ok: false };

async function ownerOfApplication(id: string): Promise<OwnerLookup> {
  try {
    const r = await db.select({ userId: application.userId }).from(application).where(eq(application.id, id)).limit(1);
    return { ok: true, userId: r[0]?.userId ?? null };
  } catch {
    return { ok: false };
  }
}

async function ownerOfDoc(docType: string, id: string): Promise<OwnerLookup> {
  const table = DOC_TABLES[docType as keyof typeof DOC_TABLES];
  if (!table) return { ok: true, userId: null };
  try {
    const r = await db.select({ userId: table.userId }).from(table).where(eq(table.id, id)).limit(1);
    return { ok: true, userId: r[0]?.userId ?? null };
  } catch {
    return { ok: false };
  }
}

/**
 * Returns null when the call is allowed, or "not_owner" when the subject
 * demonstrably does not own a row the args reference. Doc ownership is only
 * enforced when the caller marks the doc as an existing target
 * (extra.docExists), since a brand-new docId a tool is about to create won't
 * exist yet.
 */
export async function checkRowOwnership(
  userId: string | null,
  args: Record<string, unknown>,
  extra: Record<string, unknown> | undefined,
): Promise<"not_owner" | null> {
  const applicationId = typeof args.applicationId === "string" ? args.applicationId : null;
  const docId = extra && typeof extra.docId === "string" ? extra.docId : null;
  const docType = extra && typeof extra.docType === "string" ? extra.docType : null;
  const docExists = extra?.docExists === true;

  const needsApp = !!applicationId;
  const needsDoc = !!(docId && docType && docExists);
  if (!needsApp && !needsDoc) return null;
  if (!userId) return "not_owner";

  if (needsApp) {
    const owner = await ownerOfApplication(applicationId);
    if (owner.ok && owner.userId !== null && owner.userId !== userId) return "not_owner";
  }
  if (needsDoc) {
    const owner = await ownerOfDoc(docType, docId);
    if (owner.ok && owner.userId !== null && owner.userId !== userId) return "not_owner";
  }
  return null;
}
