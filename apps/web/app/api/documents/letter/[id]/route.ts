import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { db, letter } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { cookies } from "next/headers";
import { z } from "zod";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Validate the PATCH body (matches the color regex used across the CV/cover
// letter routes) instead of a raw cast.
const patchSchema = z.object({
  title: z.string().max(200).optional(),
  templateId: z.string().max(100).optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  data: z.record(z.unknown()).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const cookieStore = await cookies();

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server Component — middleware handles cookie refresh
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = user.id;
  const id = params.id;

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const body = parsed.data;

  const [existing] = await db
    .select({ id: letter.id })
    .from(letter)
    .where(and(eq(letter.id, id), eq(letter.userId, userId)))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db
    .update(letter)
    .set({
      ...(body.title !== undefined && { title: body.title }),
      ...(body.templateId !== undefined && { templateId: body.templateId }),
      ...(body.primaryColor !== undefined && { primaryColor: body.primaryColor }),
      ...(body.data !== undefined && { data: body.data }),
      updatedAt: new Date(),
    })
    .where(and(eq(letter.id, id), eq(letter.userId, userId)));

  return NextResponse.json({ success: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const cookieStore = await cookies();

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server Component — middleware handles cookie refresh
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = user.id;
  const id = params.id;

  const [existing] = await db
    .select({ id: letter.id })
    .from(letter)
    .where(and(eq(letter.id, id), eq(letter.userId, userId)))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.delete(letter).where(and(eq(letter.id, id), eq(letter.userId, userId)));

  return NextResponse.json({ success: true });
}
