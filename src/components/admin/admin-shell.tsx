"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarDays,
  LayoutDashboard,
  LogOut,
  Menu as MenuIcon,
  MessageSquareText,
  Settings,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { trapTabKey } from "@/components/admin/focus-trap";

const navigationItems = [
  { href: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/reservations", label: "Reservations", icon: CalendarDays },
  { href: "/admin/menu", label: "Menu Management", icon: UtensilsCrossed },
  { href: "/admin/messages", label: "Contact Messages", icon: MessageSquareText },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminShell({
  children,
  email,
}: {
  children: React.ReactNode;
  email: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [notice, setNotice] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const mobileToggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 780px)");
    const updateViewport = () => {
      setIsMobile(media.matches);
      if (!media.matches) setMobileOpen(false);
    };
    updateViewport();
    media.addEventListener("change", updateViewport);
    return () => media.removeEventListener("change", updateViewport);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.querySelector<HTMLElement>(".admin-sidebar .admin-nav-link")?.focus();
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      (previousFocus ?? mobileToggleRef.current)?.focus();
    };
  }, [mobileOpen]);

  async function logout() {
    setNotice("");
    setIsLoggingOut(true);

    try {
      const response = await fetch("/api/admin/logout", { method: "POST" });

      if (!response.ok) {
        setNotice("Sign-out failed. Please try again.");
        return;
      }

      router.replace("/admin/login");
      router.refresh();
    } catch {
      setNotice("We couldn't reach the sign-out service.");
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <div className="admin-app-shell">
      {mobileOpen && (
        <button
          aria-label="Close admin navigation"
          className="admin-mobile-backdrop"
          onClick={() => setMobileOpen(false)}
          type="button"
        />
      )}
      <aside
        aria-label="Admin sidebar"
        aria-hidden={isMobile && !mobileOpen}
        className={`admin-sidebar${mobileOpen ? " is-open" : ""}`}
        id="admin-sidebar"
        inert={isMobile && !mobileOpen}
        onKeyDown={isMobile && mobileOpen ? trapTabKey : undefined}
      >
        <Link className="admin-brand" href="/admin/dashboard">
          <span className="admin-brand-mark">L<span>.</span></span>
          <span>
            <strong>LUXEBITE</strong>
            <small>ADMINISTRATION</small>
          </span>
        </Link>

        <p className="admin-sidebar-label">WORKSPACE</p>
        <nav aria-label="Admin navigation" className="admin-nav">
          {navigationItems.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href ||
              (href !== "/admin/dashboard" && pathname.startsWith(`${href}/`));

            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={`admin-nav-link${active ? " is-active" : ""}`}
                href={href}
                key={href}
                onClick={() => setMobileOpen(false)}
              >
                <Icon aria-hidden="true" size={17} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="admin-sidebar-bottom">
          <div className="admin-account-summary">
            <span className="admin-avatar" aria-hidden="true">
              {email?.slice(0, 1).toUpperCase() ?? "A"}
            </span>
            <span>
              <strong>Administrator</strong>
              <small>{email ?? "Verified account"}</small>
            </span>
          </div>
          {notice && (
            <p className="admin-toast" role="status">
              {notice}
            </p>
          )}
          <button
            className="admin-logout-button"
            disabled={isLoggingOut}
            onClick={logout}
            type="button"
          >
            <LogOut aria-hidden="true" size={16} />
            {isLoggingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <button
            aria-controls="admin-sidebar"
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Close admin navigation" : "Open admin navigation"}
            className="admin-mobile-toggle"
            onClick={() => setMobileOpen((open) => !open)}
            ref={mobileToggleRef}
            type="button"
          >
            {mobileOpen ? <X size={20} /> : <MenuIcon size={20} />}
          </button>
          <div className="admin-breadcrumb">LuxeBite <span>/</span> Admin</div>
          <span className="admin-topbar-session">Secure workspace</span>
        </header>
        <div className="admin-page-content">{children}</div>
      </div>
    </div>
  );
}
