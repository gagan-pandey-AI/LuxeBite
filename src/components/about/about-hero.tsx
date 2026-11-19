"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { SiteHeader } from "@/components/site-header";

export function AboutHero() {
  const reducedMotion = useReducedMotion();

  return (
    <section aria-labelledby="about-hero-title" className="about-hero" id="top">
      <Image
        alt=""
        className="about-hero-image"
        fill
        priority
        quality={85}
        sizes="100vw"
        src="/images/dining-room.webp"
      />
      <div aria-hidden="true" className="about-hero-shade" />
      <SiteHeader />

      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="about-hero-copy"
        initial={reducedMotion ? false : { opacity: 0, y: 20 }}
        transition={{ duration: reducedMotion ? 0 : 0.7, delay: 0.1 }}
      >
        <span className="eyebrow">A little about us</span>
        <h1 id="about-hero-title">
          The Art of
          <br />
          <em>Exceptional Dining</em>
        </h1>
        <p>
          Where culinary craftsmanship meets unforgettable experiences.
        </p>
      </motion.div>

      <a aria-label="Scroll to our story" className="about-scroll-cue" href="#story">
        <span>Our story</span>
        <ArrowDown aria-hidden="true" size={15} />
      </a>
    </section>
  );
}
