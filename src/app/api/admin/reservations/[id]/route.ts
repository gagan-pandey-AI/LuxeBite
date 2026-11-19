import { authorizeAdmin } from "@/lib/admin/guard";
import { createReservationStatusHandler } from "@/lib/admin/reservations";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ReservationRow } from "@/types/database";

const handleStatus = createReservationStatusHandler<ReservationRow>({
  authorize: authorizeAdmin,
  getStatus: async (id) => {
    const { data, error } = await getSupabaseAdminClient()
      .from("reservations")
      .select("status")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data?.status ?? null;
  },
  updateStatus: async (id, currentStatus, status) => {
    const { data, error } = await getSupabaseAdminClient()
      .from("reservations")
      .update({ status })
      .eq("id", id)
      .eq("status", currentStatus)
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
