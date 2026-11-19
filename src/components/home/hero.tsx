"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";

export function Hero() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section aria-labelledby="hero-title" className="hero" id="top">
      <Image
        alt="A chef finishing a beautifully plated dish at the table"
        className="hero-image"
        fill
        priority
        quality={85}
        sizes="100vw"
        src="/images/hero-dinner.webp"
      />
      <div aria-hidden="true" className="hero-shade" />
      <SiteHeader />

      <div className="hero-content">
        <motion.p
          animate={{ opacity: 1, y: 0 }}
          className="eyebrow hero-eyebrow"
          initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          A little more than dinner
        </motion.p>
        <motion.h1
          animate={{ opacity: 1, y: 0 }}
          id="hero-title"
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          transition={{ duration: 0.85, delay: 0.35 }}
        >
          An Experience
          <br />
          <em>Beyond Taste.</em>
        </motion.h1>
        <motion.p
          animate={{ opacity: 1 }}
          className="hero-description"
          initial={shouldReduceMotion ? false : { opacity: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
        >
          A neighborhood table for the beautifully curious.
          <br className="desktop-break" /> Rooted in season, made to be shared.
        </motion.p>
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="hero-actions"
          initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
          transition={{ duration: 0.7, delay: 0.85 }}
        >
          <a className="button button-light" href="#story">
            Discover our story <ArrowRight aria-hidden="true" size={15} />
          </a>
          <a className="button button-outline" href="#menu">
            Explore the menu
          </a>
        </motion.div>
      </div>

      <div className="hero-bottom">
        <span>18 WEST 27TH STREET · NEW YORK</span>
        <a aria-label="Scroll to discover LuxeBite" href="#story">
          <ArrowDown aria-hidden="true" size={16} />
        </a>
        <span>OPEN TUE — SUN · FROM 5 PM</span>
      </div>
    </section>
  );
}
