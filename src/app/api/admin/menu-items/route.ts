import { authorizeAdmin } from "@/lib/admin/guard";
import { authorizationFailure } from "@/lib/admin/http";
import { createMenuMutationHandler } from "@/lib/admin/menu";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { MenuItemRow } from "@/types/database";

const handleMutation = createMenuMutationHandler<MenuItemRow>({
  authorize: authorizeAdmin,
  create: async (item) => {
    const { data, error } = await getSupabaseAdminClient()
      .from("menu_items")
      .insert(item)
      .select("*")
      .single();
    if (error) throw error;
    return data;
  },
});

export async function GET() {
  const failure = authorizationFailure(await authorizeAdmin());
  if (failure) return failure;
  try {
    const { data, error } = await getSupabaseAdminClient()
      .from("menu_items")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    if (error) throw error;
    return Response.json({ items: data ?? [] }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json(
      { error: { code: "MENU_UNAVAILABLE", message: "Menu items could not be loaded." } },
      { status: 500 },
    );
  }
}

export function POST(request: Request) {
  return handleMutation(request);
}
