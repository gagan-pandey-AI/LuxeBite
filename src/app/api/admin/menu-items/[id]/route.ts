import { authorizeAdmin } from "@/lib/admin/guard";
import { createMenuMutationHandler } from "@/lib/admin/menu";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { MenuItemRow } from "@/types/database";

const handleMutation = createMenuMutationHandler<MenuItemRow>({
  authorize: authorizeAdmin,
  update: async (id, changes) => {
    const { data, error } = await getSupabaseAdminClient()
      .from("menu_items")
      .update(changes)
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    return data;
  },
  remove: async (id) => {
    const { data, error } = await getSupabaseAdminClient()
      .from("menu_items")
      .delete()
      .eq("id", id)
      .select("image_storage_path")
      .maybeSingle();
    if (error) throw error;
    return data ? { imageStoragePath: data.image_storage_path } : null;
  },
  cleanupImage: async (path) => {
    const { error } = await getSupabaseAdminClient()
      .storage.from("menu-images")
      .remove([path]);
    if (error) throw error;
  },
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return handleMutation(request, id);
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return handleMutation(request, id);
}
