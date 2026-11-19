import "server-only";
import { createClient } from "@supabase/supabase-js";
import {
  isSupabasePlaceholder,
  isValidSupabaseUrl,
} from "@/lib/supabase/config";
import type { Database } from "@/types/database";

let supabaseAdmin: ReturnType<typeof createClient<Database>> | undefined;

function getSupabaseAdminConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (
    !supabaseUrl ||
    isSupabasePlaceholder(supabaseUrl) ||
    !isValidSupabaseUrl(supabaseUrl) ||
    !serviceRoleKey ||
    isSupabasePlaceholder(serviceRoleKey)
  ) {
    return null;
  }

  return { supabaseUrl, serviceRoleKey };
}

export function hasSupabaseAdminConfig() {
  return getSupabaseAdminConfig() !== null;
}

export function getSupabaseAdminClient() {
  const config = getSupabaseAdminConfig();

  if (!config) {
    const issues: string[] = [];
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

    if (
      !supabaseUrl ||
      isSupabasePlaceholder(supabaseUrl)
    ) {
      issues.push("Check NEXT_PUBLIC_SUPABASE_URL.");
    } else if (!isValidSupabaseUrl(supabaseUrl)) {
      issues.push("NEXT_PUBLIC_SUPABASE_URL must be a valid HTTP(S) URL.");
    }

    if (!serviceRoleKey || isSupabasePlaceholder(serviceRoleKey)) {
      issues.push("Set SUPABASE_SERVICE_ROLE_KEY.");
    }

    throw new Error(
      `Supabase server credentials are unavailable. ${issues.join(" ")}`,
    );
  }

  if (!supabaseAdmin) {
    supabaseAdmin = createClient<Database>(
      config.supabaseUrl,
      config.serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
  }

  return supabaseAdmin;
}
