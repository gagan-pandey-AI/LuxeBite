import Image from "next/image";

export function MeetTheChef() {
  return (
    <section
      aria-labelledby="about-chef-title"
      className="about-chef"
      id="chef"
    >
      <div className="about-chef-copy">
        <span className="eyebrow">The person behind the plate</span>
        <h2 id="about-chef-title">
          Meet Chef
          <br />
          <em>Amara Ellis.</em>
        </h2>
        <p>
          In the LuxeBite story, Amara learned early to let the market lead.
          Her cooking brings a fine touch to familiar ingredients: confident
          technique, bright seasonal flavors, and nothing on the plate without
          a reason to be there.
        </p>
        <blockquote>
          “The best dish is the one that makes everyone at the table lean in.”
        </blockquote>
        <span className="about-chef-role">FICTIONAL CHEF · LUXEBITE CONCEPT</span>
      </div>

      <div className="about-chef-image-wrap">
        <Image
          alt="Chef Amara Ellis working in a restaurant kitchen"
          className="about-chef-image"
          fill
          quality={85}
          sizes="(max-width: 760px) 100vw, 50vw"
          src="/images/chef-amara.webp"
        />
        <span>AMARA ELLIS · EXECUTIVE CHEF</span>
      </div>
    </section>
  );
}
