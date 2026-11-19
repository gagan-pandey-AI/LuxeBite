import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { ChefRecommendations } from "@/components/menu/chef-recommendations";
import { MenuHero } from "@/components/menu/menu-hero";
import { MenuListing } from "@/components/menu/menu-listing";
import { getPublicMenu } from "@/lib/menu/public-menu";

export const metadata: Metadata = {
  title: "Menu | LuxeBite — An Experience Beyond Taste",
  description:
    "Explore the LuxeBite concept menu: seasonal starters, thoughtful mains, chef specials, desserts, and drinks.",
};

export const dynamic = "force-dynamic";

export default async function MenuPage() {
  const { dishes, databaseError, isConceptPreview } = await getPublicMenu();

  return (
    <main className="menu-page">
      <MenuHero />
      {databaseError && (
        <p className="menu-data-warning" role="status">
          The live menu is temporarily unavailable. This concept preview is shown instead.
        </p>
      )}
      <MenuListing dishes={dishes} isConceptPreview={isConceptPreview} />
      <ChefRecommendations dishes={dishes} />

      <section aria-labelledby="menu-philosophy-title" className="menu-philosophy">
        <span className="eyebrow">The way we cook</span>
        <h2 id="menu-philosophy-title">
          Let the season speak.
          <br />
          <em>We&apos;ll set the table.</em>
        </h2>
        <p>
          We start with what is beautiful at the market, handle it with care,
          and bring it to the table with warmth. No two evenings need to taste
          quite the same.
        </p>
        <span className="menu-philosophy-mark">L<span>.</span></span>
      </section>

      <section
        aria-labelledby="menu-reservation-title"
        className="menu-reservation"
      >
        <Image
          alt=""
          className="menu-reservation-image"
          fill
          sizes="100vw"
          src="/images/reservation-dinner.webp"
        />
        <div aria-hidden="true" className="menu-reservation-shade" />
        <div className="menu-reservation-copy">
          <span className="eyebrow">The best part is sharing it</span>
          <h2 id="menu-reservation-title">
            Save a place
            <br />
            <em>for the evening.</em>
          </h2>
          <Link className="button button-light" href="/reservation">
            Join us at the table <ArrowRight aria-hidden="true" size={15} />
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
