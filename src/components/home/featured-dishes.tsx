import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { featuredDishes } from "@/data/menu";
import { formatINR } from "@/lib/format-inr";

export function FeaturedDishes() {
  return (
    <section aria-labelledby="menu-title" className="featured-section" id="menu">
      <div className="section-shell">
        <div className="section-heading featured-heading">
          <div>
            <span className="eyebrow eyebrow-dark">From our kitchen</span>
            <h2 id="menu-title">
              A taste of
              <br />
              <em>what&apos;s in season.</em>
            </h2>
          </div>
          <p className="section-aside">
            Thoughtful ingredients, a little fire, and the kind of detail you
            can taste.
          </p>
        </div>

        <div className="dish-grid">
          {featuredDishes.map((dish, index) => (
            <article
              className={`dish-item dish-item-${index + 1}`}
              key={dish.id}
            >
              <div className="dish-image-wrap">
                <Image
                  alt={dish.imageAlt}
                  className="dish-image"
                  fill
                  quality={80}
                  sizes="(max-width: 700px) 90vw, (max-width: 1000px) 45vw, 30vw"
                  src={dish.image}
                />
                <span className="dish-number">0{index + 1}</span>
              </div>
              <div className="dish-meta">
                <div>
                  <span className="dish-category">{dish.category}</span>
                  <h3>{dish.name}</h3>
                  <p>{dish.description}</p>
                </div>
                <span className="dish-price">{formatINR(dish.price)}</span>
              </div>
            </article>
          ))}
        </div>

        <div className="menu-link-wrap">
          <Link className="text-link text-link-dark" href="#menu">
            Explore the featured dishes <ArrowUpRight aria-hidden="true" size={15} />
          </Link>
          <span>Concept menu · sample dishes &amp; prices</span>
        </div>
      </div>
    </section>
  );
}
