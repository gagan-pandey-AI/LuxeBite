import Image from "next/image";
import { ArrowDown } from "lucide-react";
import { SiteHeader } from "@/components/site-header";

export function MenuHero() {
  return (
    <section aria-labelledby="menu-page-title" className="menu-hero" id="top">
      <Image
        alt=""
        className="menu-hero-image"
        fill
        priority
        sizes="100vw"
        src="/images/hero-dinner.webp"
      />
      <div aria-hidden="true" className="menu-hero-shade" />
      <SiteHeader />

      <div className="menu-hero-copy">
        <span className="eyebrow">A note from our kitchen</span>
        <h1 id="menu-page-title">
          A Symphony
          <br />
          of <em>Flavours</em>
        </h1>
        <p>
          Seasonal ingredients, thoughtful technique, and a little room for
          surprise. Made for sharing, best enjoyed slowly.
        </p>
        <span className="menu-concept-note">
          CONCEPT MENU · SAMPLE DISHES &amp; PRICES IN INR
        </span>
      </div>

      <a
        aria-label="Scroll to explore the menu"
        className="menu-scroll-cue"
        href="#menu-list"
      >
        <span>Explore the menu</span>
        <ArrowDown aria-hidden="true" size={15} />
      </a>
    </section>
  );
}
