import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { chefRecommendedDishes as defaultRecommendations } from "@/data/menu";
import { formatINR } from "@/lib/format-inr";
import type { MenuDish } from "@/types/menu";

export function ChefRecommendations({
  dishes = defaultRecommendations,
}: {
  dishes?: MenuDish[];
}) {
  const recommendations = dishes.filter((dish) => dish.isChefRecommended);
  const featuredRecommendation = recommendations[0];
  if (!featuredRecommendation) return null;

  return (
    <section
      aria-labelledby="chef-recommendations-title"
      className="menu-chef-section"
    >
      <div className="menu-chef-image-wrap">
        <Image
          alt={featuredRecommendation.imageAlt}
          className="menu-chef-image"
          fill
          unoptimized
          sizes="(max-width: 760px) 100vw, 50vw"
          src={featuredRecommendation.image}
        />
        <span>Chef&apos;s recommendation</span>
      </div>

      <div className="menu-chef-copy">
        <span className="eyebrow eyebrow-dark">A word from the pass</span>
        <h2 id="chef-recommendations-title">
          A little extra
          <br />
          <em>from Amara.</em>
        </h2>
        <p>
          A few plates Chef Amara returns to when the market is at its best.
          Thoughtful, generous, and made to be shared.
        </p>

        <div className="menu-chef-picks">
          {recommendations.map((dish) => (
            <a className="menu-chef-pick" href="#menu-list" key={dish.id}>
              <span>
                <span className="menu-chef-pick-category">{dish.category}</span>
                <span className="menu-chef-pick-name">{dish.name}</span>
              </span>
              <span className="menu-chef-pick-price">
                {formatINR(dish.price)}
              </span>
            </a>
          ))}
        </div>

        <a className="text-link text-link-dark" href="#menu-list">
          Explore the menu <ArrowUpRight aria-hidden="true" size={15} />
        </a>
      </div>
    </section>
  );
}
