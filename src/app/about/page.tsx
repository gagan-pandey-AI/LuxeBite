import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { AboutHero } from "@/components/about/about-hero";
import { AboutStory } from "@/components/about/about-story";
import { CulinaryPhilosophy } from "@/components/about/culinary-philosophy";
import { ExperienceStats } from "@/components/about/experience-stats";
import { MeetTheChef } from "@/components/about/meet-the-chef";
import { OurValues } from "@/components/about/our-values";
import { RestaurantGallery } from "@/components/about/restaurant-gallery";

export const metadata: Metadata = {
  title: "Our Story | LuxeBite — An Experience Beyond Taste",
  description:
    "Discover the fictional story, culinary philosophy, and people behind LuxeBite, a fine-dining restaurant concept.",
};

export default function AboutPage() {
  return (
    <main className="about-page">
      <AboutHero />
      <AboutStory />
      <CulinaryPhilosophy />
      <MeetTheChef />
      <ExperienceStats />
      <RestaurantGallery />
      <OurValues />

      <section
        aria-labelledby="about-reservation-title"
        className="about-reservation"
      >
        <Image
          alt=""
          className="about-reservation-image"
          fill
          quality={85}
          sizes="100vw"
          src="/images/reservation-dinner.webp"
        />
        <div aria-hidden="true" className="about-reservation-shade" />
        <div className="about-reservation-copy">
          <span className="eyebrow">An evening worth remembering</span>
          <h2 id="about-reservation-title">
            Make Every
            <br />
            <em>Moment Memorable</em>
          </h2>
          <Link className="button button-light" href="/reservation">
            Reserve your evening <ArrowRight aria-hidden="true" size={15} />
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
