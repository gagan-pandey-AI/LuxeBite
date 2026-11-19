import { authorizeAdmin } from "@/lib/admin/guard";
import { createMessageStatusHandler } from "@/lib/admin/messages";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ContactMessageRow } from "@/types/database";

const handleStatus = createMessageStatusHandler<ContactMessageRow>({
  authorize: authorizeAdmin,
  getStatus: async (id) => {
    const { data, error } = await getSupabaseAdminClient()
      .from("contact_messages")
      .select("status")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data?.status ?? null;
  },
  updateStatus: async (id, current, status) => {
    const { data, error } = await getSupabaseAdminClient()
      .from("contact_messages")
      .update({ status })
      .eq("id", id)
      .eq("status", current)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    return data;
  },
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return handleStatus(id, request);
}
