import { authorizeAdmin } from "@/lib/admin/guard";
import { authorizationFailure } from "@/lib/admin/http";
import { createRestaurantSettingsHandler } from "@/lib/admin/settings";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { RestaurantSettingsRow } from "@/types/database";

const handleUpdate = createRestaurantSettingsHandler<RestaurantSettingsRow>({
  authorize: authorizeAdmin,
  update: async (changes) => {
    const { data, error } = await getSupabaseAdminClient()
      .from("restaurant_settings")
      .update(changes)
      .eq("id", "default")
      .select("*")
      .maybeSingle();
    if (error) throw error;
    return data;
  },
});

export async function GET() {
  const authorization = await authorizeAdmin();
  if (authorization.status !== "authorized") {
    return authorizationFailure(authorization)!;
  }

  try {
    const { data, error } = await getSupabaseAdminClient()
      .from("restaurant_settings")
      .select("*")
      .eq("id", "default")
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      return Response.json(
        { error: { code: "NOT_FOUND", message: "Restaurant settings have not been provisioned." } },
        { status: 404 },
      );
    }
    return Response.json(
      { settings: data, profile: { email: authorization.user.email } },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { error: { code: "SETTINGS_UNAVAILABLE", message: "Restaurant settings could not be loaded." } },
      { status: 500 },
    );
  }
}

export function PATCH(request: Request) {
  return handleUpdate(request);
}
