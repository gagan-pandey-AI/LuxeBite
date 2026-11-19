import Image from "next/image";
import { ArrowRight, Quote, Star } from "lucide-react";
import { FeaturedDishes } from "@/components/home/featured-dishes";
import { Hero } from "@/components/home/hero";
import { SiteFooter } from "@/components/site-footer";

const testimonials = [
  {
    quote:
      "The sort of place that reminds you why going out to dinner can still feel like an occasion.",
    name: "Mara L.",
    detail: "A regular since 2018",
  },
  {
    quote:
      "Every plate had a point of view. We stayed for one more glass, then another.",
    name: "James R.",
    detail: "Dinner, October 2025",
  },
  {
    quote:
      "Warm, unhurried hospitality and food that is quietly unforgettable.",
    name: "Priya S.",
    detail: "A guest from Brooklyn",
  },
];

export default function HomePage() {
  return (
    <main>
      <Hero />

      <section aria-labelledby="story-title" className="story-section" id="story">
        <div className="story-image-wrap">
          <Image
            alt="Warmly lit dining room prepared for an evening service"
            className="story-image"
            fill
            quality={80}
            sizes="(max-width: 800px) 100vw, 50vw"
            src="/images/dining-room.webp"
          />
          <span className="image-note">The room, just before service</span>
        </div>
        <div className="story-copy">
          <span className="eyebrow eyebrow-dark">A table with a point of view</span>
          <h2 id="story-title">
            Some things
            <br />
            are better
            <br />
            <em>shared.</em>
          </h2>
          <p>
            LuxeBite began with a simple belief: the best evenings are never
            rushed. We bring the market&apos;s best to the table, cook with
            intention, and leave plenty of room for one more story.
          </p>
          <a className="text-link text-link-dark" href="#chef">
            A little about us <ArrowRight aria-hidden="true" size={15} />
          </a>
          <span aria-hidden="true" className="story-monogram">
            L<span>.</span>
          </span>
        </div>
      </section>

      <FeaturedDishes />

      <section aria-labelledby="chef-title" className="chef-section" id="chef">
        <div className="chef-copy">
          <span className="eyebrow">From the chef&apos;s table</span>
          <h2 id="chef-title">
            Let the
            <br />
            ingredients
            <br />
            <em>lead.</em>
          </h2>
          <p>
            Chef Amara Ellis follows the seasons, trusts her instincts, and
            believes a beautiful plate should always have a little soul.
          </p>
          <span className="chef-signature">Amara Ellis</span>
          <span className="chef-role">EXECUTIVE CHEF</span>
        </div>
        <div className="chef-photo-wrap">
          <Image
            alt="Chef Amara Ellis at work in the restaurant kitchen"
            className="chef-photo"
            fill
            quality={80}
            sizes="(max-width: 800px) 100vw, 50vw"
            src="/images/chef-amara.webp"
          />
          <span className="chef-photo-index">01 / THE PEOPLE BEHIND THE PLATE</span>
        </div>
      </section>

      <section
        aria-labelledby="testimonials-title"
        className="testimonials-section"
      >
        <div className="testimonial-intro">
          <span className="eyebrow eyebrow-dark">Illustrative guest notes</span>
          <h2 id="testimonials-title">
            Good company.
            <br />
            <em>Great company.</em>
          </h2>
          <div aria-label="Sample guest testimonials" className="rating">
            {Array.from({ length: 5 }, (_, index) => (
              <Star aria-hidden="true" fill="currentColor" key={index} size={13} />
            ))}
            <span>CONCEPT PREVIEW · SAMPLE GUEST NOTES</span>
          </div>
        </div>
        <div className="testimonial-grid">
          {testimonials.map((testimonial) => (
            <figure className="testimonial" key={testimonial.name}>
              <Quote aria-hidden="true" className="quote-icon" size={19} />
              <blockquote>{testimonial.quote}</blockquote>
              <figcaption>
                <span>{testimonial.name}</span>
                <span>{testimonial.detail}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section aria-labelledby="reserve-title" className="reserve-section" id="reserve">
        <Image
          alt="An intimate candlelit dinner setting"
          className="reserve-image"
          fill
          quality={85}
          sizes="100vw"
          src="/images/reservation-dinner.webp"
        />
        <div aria-hidden="true" className="reserve-shade" />
        <div className="reserve-content">
          <span className="eyebrow">Your evening, well spent</span>
          <h2 id="reserve-title">
            There&apos;s a place
            <br />
            <em>at our table.</em>
          </h2>
          <p>Come hungry. Leave a little happier.</p>
          <a className="button button-light" href="/reservation">
            Find your table <ArrowRight aria-hidden="true" size={15} />
          </a>
          <span className="reserve-note">
            TUESDAY — SUNDAY <span>·</span> 5:00 PM — 10:30 PM
          </span>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
