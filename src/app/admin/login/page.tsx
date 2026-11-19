import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { authorizeAdmin } from "@/lib/admin/guard";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Admin Sign In | LuxeBite",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function safeNextPath(value: string | undefined) {
  if (
    !value ||
    !value.startsWith("/admin/") ||
    value.startsWith("//") ||
    value.startsWith("/admin/login") ||
    value.includes("\\")
  ) {
    return "/admin/dashboard";
  }
  return value;
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const authorization = await authorizeAdmin();

  if (authorization.status === "authorized") {
    redirect("/admin/dashboard");
  }

  return (
    <main className="admin-login-page">
      <div aria-hidden="true" className="admin-login-orb admin-login-orb-one" />
      <div aria-hidden="true" className="admin-login-orb admin-login-orb-two" />
      <Link className="admin-login-home-link" href="/">
        <ArrowLeft aria-hidden="true" size={15} />
        Return to LuxeBite
      </Link>
      <section aria-labelledby="admin-login-title" className="admin-login-card">
        <span className="admin-login-eyebrow">PRIVATE WORKSPACE</span>
        <h1 id="admin-login-title">
          Welcome
          <br />
          <em>back.</em>
        </h1>
        <p className="admin-login-description">
          Sign in with an administrator account to manage the restaurant.
        </p>
        <AdminLoginForm nextPath={safeNextPath(next)} />
      </section>
      <p className="admin-login-footer">
        LuxeBite · Concept administration portal
      </p>
    </main>
  );
}
