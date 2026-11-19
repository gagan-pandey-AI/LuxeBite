import "server-only";
import { createAdminAuthorizer } from "@/lib/admin/authorization";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const authorizeAdmin = createAdminAuthorizer(
  async () => {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      throw error;
    }

    return data.user
      ? { id: data.user.id, email: data.user.email ?? null }
      : null;
  },
  async (userId) => {
    const { data, error } = await getSupabaseAdminClient()
      .from("admin_users")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return Boolean(data);
  },
);
