import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";
import {
  getSupabasePublicConfig,
  getSupabasePublicConfigurationIssue,
} from "@/lib/supabase/config";

export async function createServerSupabaseClient() {
  const config = getSupabasePublicConfig();

  if (!config) {
    throw new Error(
      getSupabasePublicConfigurationIssue() ??
        "Supabase authentication configuration is unavailable.",
    );
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot set cookies; the proxy refreshes sessions.
        }
      },
    },
  });
}
