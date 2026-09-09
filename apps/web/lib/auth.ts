// Auth is now handled by Supabase — this file re-exports helpers for backwards compatibility
export { createSupabaseServerClient } from "@/lib/supabase/server";
export { createSupabaseBrowserClient } from "@/lib/supabase/client";
