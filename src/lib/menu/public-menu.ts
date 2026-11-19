import "server-only";
import { menuItems } from "@/data/menu";
import {
  getSupabaseAdminClient,
  hasSupabaseAdminConfig,
} from "@/lib/supabase/admin";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import type { MenuDish } from "@/types/menu";

export async function getPublicMenu(): Promise<{
  dishes: MenuDish[];
  databaseError: boolean;
  isConceptPreview: boolean;
}> {
  const configured = Boolean(
    getSupabasePublicConfig() && hasSupabaseAdminConfig(),
  );
  if (!configured) {
    return { dishes: menuItems, databaseError: false, isConceptPreview: true };
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("menu_items")
      .select("*")
      .eq("is_available", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    if (error) throw error;

    return {
      dishes: (data ?? []).map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        image:
          item.image_storage_path
            ? supabase.storage.from("menu-images").getPublicUrl(item.image_storage_path).data.publicUrl
            : item.image_url,
        imageAlt: item.image_alt,
        ingredients: item.ingredients,
        isVegetarian: item.is_vegetarian,
        isBestseller: item.is_bestseller,
        isChefRecommended: item.is_chef_recommended,
        isFeatured: item.is_featured,
      })),
      databaseError: false,
      isConceptPreview: false,
    };
  } catch {
    console.error("The live menu could not be loaded; showing the concept menu.");
    return { dishes: menuItems, databaseError: true, isConceptPreview: true };
  }
}
