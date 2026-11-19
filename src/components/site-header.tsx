"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const navigation = [
  { label: "Our story", homeHref: "#story", routeHref: "/#story", aboutHref: "/about" },
  { label: "The menu", homeHref: "#menu", routeHref: "/menu", aboutHref: "/menu" },
  { label: "The chef", homeHref: "#chef", routeHref: "/#chef", aboutHref: "#chef" },
  { label: "Visit us", homeHref: "#visit", routeHref: "/#visit", aboutHref: "/#visit" },
  { label: "Contact", homeHref: "/contact", routeHref: "/contact", aboutHref: "/contact" },
];

export function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const isAboutPage = pathname === "/about";
  const isContactPage = pathname === "/contact";
  const navigationItems = navigation.map((item) => ({
    ...item,
    href: isContactPage
      ? item.label === "Contact"
        ? "#contact-information"
        : item.label === "Visit us"
          ? "#contact-location"
          : item.routeHref
      : isHomePage
        ? item.homeHref
        : isAboutPage
          ? item.aboutHref
          : item.routeHref,
  }));
  const reservationHref = "/reservation";

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link
          aria-label="LuxeBite home"
          className="brand-mark"
          href="/"
          onClick={() => setIsMenuOpen(false)}
        >
          <span className="brand-name">LUXEBITE</span>
          <span className="brand-caption">NEW YORK · EST. 2014</span>
        </Link>

        <nav aria-label="Main navigation" className="desktop-nav">
          {navigationItems.map((item) => (
            <Link
              aria-current={
                (pathname === "/menu" && item.label === "The menu") ||
                (isAboutPage && item.label === "Our story") ||
                (isContactPage && item.label === "Contact")
                  ? "page"
                  : undefined
              }
              className="nav-link"
              href={item.href}
              key={item.label}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link className="header-reserve" href={reservationHref}>
          Reserve a table <span aria-hidden="true">↗</span>
        </Link>

        <button
          aria-controls="mobile-navigation"
          aria-expanded={isMenuOpen}
          aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          className="mobile-menu-toggle"
          onClick={() => setIsMenuOpen((open) => !open)}
          type="button"
        >
          {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {isMenuOpen && (
        <nav
          aria-label="Mobile navigation"
          className="mobile-nav"
          id="mobile-navigation"
        >
          {navigationItems.map((item) => (
            <a
              aria-current={
                (pathname === "/menu" && item.label === "The menu") ||
                (isAboutPage && item.label === "Our story") ||
                (isContactPage && item.label === "Contact")
                  ? "page"
                  : undefined
              }
              href={item.href}
              key={item.label}
              onClick={() => setIsMenuOpen(false)}
            >
              {item.label}
            </a>
          ))}
          <a href={reservationHref} onClick={() => setIsMenuOpen(false)}>
            Reserve a table <span aria-hidden="true">↗</span>
          </a>
        </nav>
      )}
    </header>
  );
}
