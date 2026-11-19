import { adminLoginSchema } from "./login-schema.ts";

interface LoginUser {
  id: string;
  email: string | null;
}

interface LoginDependencies {
  signIn: (
    email: string,
    password: string,
  ) => Promise<LoginUser | null>;
  isAdministrator: (userId: string) => Promise<boolean>;
  signOut: () => Promise<void>;
}

function jsonResponse(body: unknown, status: number) {
  return Response.json(body, {
    headers: { "Cache-Control": "no-store" },
    status,
  });
}

export function createAdminLoginHandler(dependencies: LoginDependencies) {
  return async function handleAdminLogin(request: Request) {
    if (!request.headers.get("content-type")?.includes("application/json")) {
      return jsonResponse(
        {
          error: {
            code: "UNSUPPORTED_CONTENT_TYPE",
            message: "Submit login details as JSON.",
          },
        },
        415,
      );
    }

    let payload: unknown;

    try {
      payload = await request.json();
    } catch {
      return jsonResponse(
        {
          error: {
            code: "INVALID_JSON",
            message: "The login request could not be read.",
          },
        },
        400,
      );
    }

    const result = adminLoginSchema.safeParse(payload);

    if (!result.success) {
      return jsonResponse(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Enter a valid email address and password.",
            fieldErrors: result.error.flatten().fieldErrors,
          },
        },
        400,
      );
    }

    let user: LoginUser | null;

    try {
      user = await dependencies.signIn(result.data.email, result.data.password);
    } catch {
      return jsonResponse(
        {
          error: {
            code: "AUTH_UNAVAILABLE",
            message: "Sign-in is temporarily unavailable. Please try again.",
          },
        },
        503,
      );
    }

    if (!user) {
      return jsonResponse(
        {
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Email or password is incorrect.",
          },
        },
        401,
      );
    }

    try {
      if (!(await dependencies.isAdministrator(user.id))) {
        await dependencies.signOut();
        return jsonResponse(
          {
            error: {
              code: "ADMIN_ACCESS_REQUIRED",
              message: "This account is not authorized for administration.",
            },
          },
          403,
        );
      }
    } catch {
      try {
        await dependencies.signOut();
      } catch {
        console.error("Unable to clear an unverified admin session.");
      }
      return jsonResponse(
        {
          error: {
            code: "AUTHORIZATION_UNAVAILABLE",
            message: "Administrator access could not be verified.",
          },
        },
        503,
      );
    }

    return jsonResponse({ user: { email: user.email } }, 200);
  };
}
