import type { Metadata } from "next";
import Image from "next/image";
import { ArrowDown, Clock3, MapPin } from "lucide-react";
import { ReservationForm } from "@/components/reservation/reservation-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Reservations | LuxeBite — An Experience Beyond Taste",
  description:
    "Request a table at LuxeBite. Share your preferred date, time, and party size. Requests remain pending until the restaurant confirms.",
};

export default function ReservationPage() {
  return (
    <main className="reservation-page">
      <section
        aria-labelledby="reservation-page-title"
        className="reservation-hero"
        id="top"
      >
        <Image
          alt=""
          className="reservation-hero-image"
          fill
          priority
          quality={85}
          sizes="100vw"
          src="/images/reservation-dinner.webp"
        />
        <div aria-hidden="true" className="reservation-hero-shade" />
        <SiteHeader />

        <div className="reservation-hero-copy">
          <span className="eyebrow">A place at our table</span>
          <h1 id="reservation-page-title">
            Make an evening
            <br />
            <em>of it.</em>
          </h1>
          <p>
            Tell us when you&apos;d like to join us. Your request will remain
            pending until the restaurant confirms it.
          </p>
          <a aria-label="Scroll to the reservation form" href="#reservation-request">
            <span>Request your table</span>
            <ArrowDown aria-hidden="true" size={15} />
          </a>
        </div>
      </section>

      <section
        aria-labelledby="reservation-request-title"
        className="reservation-content"
        id="reservation-request"
      >
        <div className="reservation-form-column">
          <div className="reservation-section-heading">
            <span className="eyebrow">Your evening, your way</span>
            <h2 id="reservation-request-title">
              Request a <em>reservation.</em>
            </h2>
            <p>
              We welcome reservations Tuesday through Sunday, from 5:00 PM to
              10:30 PM. Online requests are for 1–8 guests.
            </p>
          </div>
          <ReservationForm />
        </div>

        <aside aria-label="Restaurant details" className="reservation-aside">
          <div className="reservation-aside-image">
            <Image
              alt="LuxeBite dining room prepared for evening service"
              fill
              quality={85}
              sizes="(max-width: 760px) 90vw, 36vw"
              src="/images/dining-room.webp"
            />
          </div>
          <span className="eyebrow">A note before you arrive</span>
          <h2>Good evenings begin with a warm welcome.</h2>
          <p>
            A request is not a confirmed table. The restaurant must review and
            confirm it separately; please wait for direct confirmation before
            arriving. Include any timing or accessibility notes in your
            message.
          </p>
          <div className="reservation-aside-detail">
            <MapPin aria-hidden="true" size={17} />
            <span>
              18 West 27th Street
              <br />
              New York, NY 10001
            </span>
          </div>
          <div className="reservation-aside-detail">
            <Clock3 aria-hidden="true" size={17} />
            <span>
              Tuesday – Sunday
              <br />
              5:00 PM – 10:30 PM
            </span>
          </div>
        </aside>
      </section>

      <SiteFooter />
    </main>
  );
}
