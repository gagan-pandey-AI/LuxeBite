export interface AdminIdentity {
  id: string;
  email: string | null;
}

export type AdminAuthorizationResult =
  | { status: "authorized"; user: AdminIdentity }
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "unavailable" };

export function createAdminAuthorizer(
  resolveUser: () => Promise<AdminIdentity | null>,
  isAdministrator: (userId: string) => Promise<boolean>,
) {
  return async function authorizeAdmin(): Promise<AdminAuthorizationResult> {
    try {
      const user = await resolveUser();

      if (!user) {
        return { status: "unauthenticated" };
      }

      if (!(await isAdministrator(user.id))) {
        return { status: "forbidden" };
      }

      return { status: "authorized", user };
    } catch {
      console.error("Admin authorization could not be verified.");
      return { status: "unavailable" };
    }
  };
}
