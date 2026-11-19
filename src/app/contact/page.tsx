import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ContactFaq } from "@/components/contact/contact-faq";
import { ContactForm } from "@/components/contact/contact-form";
import { ContactHero } from "@/components/contact/contact-hero";
import { ContactInformation } from "@/components/contact/contact-information";
import { ContactLocation } from "@/components/contact/contact-location";
import { ContactSocialLinks } from "@/components/contact/contact-social-links";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "Contact | LuxeBite — An Experience Beyond Taste",
  description:
    "Contact LuxeBite with a question or note. This fictional restaurant concept uses demonstration-only contact details and location information.",
};

export default function ContactPage() {
  return (
    <main className="contact-page">
      <ContactHero />
      <ContactInformation />

      <section
        aria-labelledby="contact-message-title"
        className="contact-message-section"
        id="contact-message"
      >
        <div className="contact-message-layout">
          <div className="contact-message-intro">
            <span className="eyebrow">The start of a conversation</span>
            <h2 id="contact-message-title">
              Send us a
              <br />
              <em>little note.</em>
            </h2>
            <p>
              Questions, kind words, or a detail you&apos;d like us to know—we
              welcome them all. The form confirms only when your message has
              been saved.
            </p>
            <span className="contact-message-mark" aria-hidden="true">
              L<span>.</span>
            </span>
          </div>
          <div className="contact-form-panel">
            <ContactForm />
          </div>
        </div>
      </section>

      <ContactLocation />
      <ContactSocialLinks />
      <ContactFaq />

      <section
        aria-labelledby="contact-reservation-title"
        className="contact-reservation"
      >
        <Image
          alt=""
          className="contact-reservation-image"
          fill
          quality={85}
          sizes="100vw"
          src="/images/reservation-dinner.webp"
        />
        <div aria-hidden="true" className="contact-reservation-shade" />
        <div className="contact-reservation-copy">
          <span className="eyebrow">When the moment feels right</span>
          <h2 id="contact-reservation-title">
            Save a place
            <br />
            <em>at the table.</em>
          </h2>
          <p>Reservation requests remain pending until directly confirmed.</p>
          <Link className="button button-light" href="/reservation">
            Request a reservation <ArrowRight aria-hidden="true" size={15} />
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
