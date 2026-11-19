import Image from "next/image";
import { ArrowRight } from "lucide-react";

export function AboutStory() {
  return (
    <section aria-labelledby="about-story-title" className="about-story" id="story">
      <div className="about-story-image-wrap">
        <Image
          alt="A thoughtfully set dinner table in the LuxeBite dining room"
          className="about-story-image"
          fill
          quality={85}
          sizes="(max-width: 760px) 100vw, 50vw"
          src="/images/reservation-dinner.webp"
        />
        <span className="about-image-note">An evening at LuxeBite</span>
      </div>

      <div className="about-story-copy">
        <span className="eyebrow eyebrow-dark">Our story</span>
        <h2 id="about-story-title">
          A table made
          <br />
          for <em>togetherness.</em>
        </h2>
        <p>
          LuxeBite is a fictional neighborhood restaurant built around a
          simple idea: a meal can become a memory when someone has cared about
          every part of it.
        </p>
        <p>
          In our story, Chef Amara Ellis began with a market basket, a borrowed
          kitchen, and a few friends who stayed long after dinner. That spirit
          still guides the room: cook with the season, welcome people warmly,
          and never rush the good part.
        </p>
        <a className="text-link text-link-dark" href="#philosophy">
          What we believe <ArrowRight aria-hidden="true" size={15} />
        </a>
        <span aria-hidden="true" className="about-story-monogram">
          L<span>.</span>
        </span>
      </div>
    </section>
  );
}
