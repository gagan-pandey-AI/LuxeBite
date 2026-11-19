"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { SiteHeader } from "@/components/site-header";

export function ContactHero() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      aria-labelledby="contact-hero-title"
      className="contact-hero"
      id="top"
    >
      <Image
        alt=""
        className="contact-hero-image"
        fill
        priority
        quality={85}
        sizes="100vw"
        src="/images/dining-room.webp"
      />
      <div aria-hidden="true" className="contact-hero-shade" />
      <SiteHeader />

      <div className="contact-hero-copy">
        <motion.p
          animate={{ opacity: 1, y: 0 }}
          className="eyebrow"
          initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
          transition={{ duration: 0.6 }}
        >
          A note is always welcome
        </motion.p>
        <motion.h1
          animate={{ opacity: 1, y: 0 }}
          id="contact-hero-title"
          initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
          transition={{ duration: 0.75, delay: 0.1 }}
        >
          We&apos;d Love to
          <br />
          <em>Hear From You</em>
        </motion.h1>
        <motion.p
          animate={{ opacity: 1 }}
          className="contact-hero-subtitle"
          initial={shouldReduceMotion ? false : { opacity: 0 }}
          transition={{ duration: 0.65, delay: 0.25 }}
        >
          Every exceptional experience begins with a conversation.
        </motion.p>
        <a aria-label="Scroll to contact information" href="#contact-information">
          <span>Get in touch</span>
          <ArrowDown aria-hidden="true" size={15} />
        </a>
      </div>
      <p className="contact-hero-demo-note">
        FICTIONAL RESTAURANT CONCEPT · CONTACT DETAILS ARE DEMONSTRATION ONLY
      </p>
    </section>
  );
}
