import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { authorizeAdmin } from "@/lib/admin/guard";

export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const authorization = await authorizeAdmin();

  if (
    authorization.status === "unauthenticated" ||
    authorization.status === "forbidden"
  ) {
    redirect("/admin/login");
  }

  if (authorization.status === "unavailable") {
    return (
      <main className="admin-unavailable" role="alert">
        <h1>Administrator access is unavailable</h1>
        <p>
          We couldn&apos;t verify your account. Check the Supabase server
          configuration and administrator provisioning, then try again.
        </p>
      </main>
    );
  }

  return <AdminShell email={authorization.user.email}>{children}</AdminShell>;
}
