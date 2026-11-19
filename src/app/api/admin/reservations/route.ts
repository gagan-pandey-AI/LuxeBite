import { authorizeAdmin } from "@/lib/admin/guard";
import { createReservationListHandler } from "@/lib/admin/reservations";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ReservationRow } from "@/types/database";

const handleList = createReservationListHandler<ReservationRow>({
  authorize: authorizeAdmin,
  list: async ({ search, date, status, page }) => {
    const supabase = getSupabaseAdminClient();
    let query = supabase
      .from("reservations")
      .select("*", { count: "exact" })
      .order("reservation_date", { ascending: false })
      .order("reservation_time", { ascending: false })
      .range((page - 1) * 25, page * 25 - 1);

    if (search) {
      const escaped = search.replace(/[\\%_]/g, "\\$&");
      query = query.ilike("customer_name", `%${escaped}%`);
    }
    if (date) query = query.eq("reservation_date", date);
    if (status !== "all") query = query.eq("status", status);

    const { data, error, count } = await query;
    if (error) throw error;
    return { rows: data ?? [], total: count ?? 0 };
  },
});

export function GET(request: Request) {
  return handleList(request);
}
