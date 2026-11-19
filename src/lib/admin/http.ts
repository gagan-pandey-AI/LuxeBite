import type { AdminAuthorizationResult } from "@/lib/admin/authorization";

export function authorizationFailure(
  authorization: { status: AdminAuthorizationResult["status"] },
): Response | null {
  switch (authorization.status) {
    case "authorized":
      return null;
    case "unauthenticated":
      return Response.json(
        { error: { code: "UNAUTHENTICATED", message: "Sign in to continue." } },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      );
    case "forbidden":
      return Response.json(
        { error: { code: "FORBIDDEN", message: "Administrator access is required." } },
        { status: 403, headers: { "Cache-Control": "no-store" } },
      );
    case "unavailable":
      return Response.json(
        { error: { code: "AUTH_UNAVAILABLE", message: "Access could not be verified." } },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
  }
}
