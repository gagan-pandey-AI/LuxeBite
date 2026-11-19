import { createAdminLoginHandler } from "@/lib/admin/login-handler";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { consumeAdminLoginRequest } from "@/lib/admin/rate-limit";
import { getRequestIdentity } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rateLimit = consumeAdminLoginRequest(getRequestIdentity(request));
  if (rateLimit.limited) {
    return Response.json(
      { error: { code: "RATE_LIMITED", message: "Too many sign-in attempts. Please wait before trying again." } },
      {
        headers: {
          "Cache-Control": "no-store",
          "Retry-After": String(rateLimit.retryAfterSeconds),
        },
        status: 429,
      },
    );
  }

  try {
    const supabase = await createServerSupabaseClient();
    const handler = createAdminLoginHandler({
      signIn: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (
            typeof error.status === "number" &&
            (error.status === 400 || error.status === 401)
          ) {
            return null;
          }
          throw error;
        }

        if (!data.user) {
          return null;
        }

        return { id: data.user.id, email: data.user.email ?? null };
      },
      isAdministrator: async (userId) => {
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
      signOut: async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
          throw error;
        }
      },
    });

    return handler(request);
  } catch {
    return Response.json(
      {
        error: {
          code: "AUTH_UNAVAILABLE",
          message: "Sign-in is temporarily unavailable. Please try again.",
        },
      },
      { headers: { "Cache-Control": "no-store" }, status: 503 },
    );
  }
}
