import { authorizeAdmin } from "@/lib/admin/guard";
import { createMessageListHandler } from "@/lib/admin/messages";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { MessageFilters } from "@/lib/admin/messages";
import type { ContactMessageRow } from "@/types/database";

const handleList = createMessageListHandler<ContactMessageRow>({
  authorize: authorizeAdmin,
  list: async ({ search, status, page }: MessageFilters) => {
    const { data, error } = await getSupabaseAdminClient().rpc(
      "admin_search_contact_messages",
      { p_search: search, p_status: status, p_page: page, p_page_size: 25 },
    );
    if (error) throw error;
    return {
      rows: (data ?? []).map(({ total_count: _total, ...message }) => message),
      total: data?.[0]?.total_count ?? 0,
    };
  },
});

export function GET(request: Request) {
  return handleList(request);
}
