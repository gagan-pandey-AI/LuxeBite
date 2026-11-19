import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

let supabaseAdmin: ReturnType<typeof createClient<Database>> | undefined;

export function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase server credentials are not configured.");
  }

  if (!supabaseAdmin) {
    supabaseAdmin = createClient<Database>(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return supabaseAdmin;
}
