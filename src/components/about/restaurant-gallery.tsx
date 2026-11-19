import Image from "next/image";

const galleryImages = [
  {
    src: "/images/dining-room.webp",
    alt: "The LuxeBite dining room before evening service",
    caption: "The room",
  },
  {
    src: "/images/hero-dinner.webp",
    alt: "A chef finishing a dish at the table",
    caption: "At the table",
  },
  {
    src: "/images/heirloom-salad.webp",
    alt: "A bright seasonal salad with fresh vegetables",
    caption: "From the garden",
  },
  {
    src: "/images/chef-amara.webp",
    alt: "Chef Amara Ellis at work in the kitchen",
    caption: "Behind the pass",
  },
  {
    src: "/images/dayboat-scallops.webp",
    alt: "A signature dish, carefully plated",
    caption: "Made with care",
  },
  {
    src: "/images/reservation-dinner.webp",
    alt: "A candlelit dinner setting ready for guests",
    caption: "Come on in",
  },
];

export function RestaurantGallery() {
  return (
    <section
      aria-labelledby="about-gallery-title"
      className="about-gallery"
      id="gallery"
    >
      <div className="about-gallery-heading">
        <div>
          <span className="eyebrow">A glimpse of the evening</span>
          <h2 id="about-gallery-title">
            Gathered around
            <br />
            <em>the table.</em>
          </h2>
        </div>
        <p>Good food is only part of the story. Here are a few more frames.</p>
      </div>

      <div className="about-gallery-grid">
        {galleryImages.map((image, index) => (
          <figure
            className={`about-gallery-item about-gallery-item-${index + 1}`}
            key={image.src}
          >
            <Image
              alt={image.alt}
              className="about-gallery-image"
              fill
              quality={80}
              sizes="(max-width: 620px) 88vw, (max-width: 900px) 45vw, 30vw"
              src={image.src}
            />
            <figcaption>{image.caption}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
