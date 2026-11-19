import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    return Response.json(
      { success: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      {
        error: {
          code: "LOGOUT_UNAVAILABLE",
          message: "Unable to end this session. Please try again.",
        },
      },
      { headers: { "Cache-Control": "no-store" }, status: 503 },
    );
  }
}
