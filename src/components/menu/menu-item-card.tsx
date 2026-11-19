"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Leaf, Sparkles } from "lucide-react";
import type { MenuDish } from "@/types/menu";
import { formatINR } from "@/lib/format-inr";

type MenuItemCardProps = {
  dish: MenuDish;
  index: number;
  reducedMotion: boolean;
  onSelect: (dish: MenuDish) => void;
};

export function MenuItemCard({
  dish,
  index,
  reducedMotion,
  onSelect,
}: MenuItemCardProps) {
  return (
    <motion.article
      animate={{
        opacity: 1,
        y: 0,
        transition: {
          duration: reducedMotion ? 0 : 0.32,
          delay: reducedMotion ? 0 : index * 0.025,
        },
      }}
      className="menu-item-card"
      exit={{
        opacity: 0,
        y: reducedMotion ? 0 : 12,
        transition: { duration: reducedMotion ? 0 : 0.18 },
      }}
      initial={reducedMotion ? false : { opacity: 0, y: 18 }}
      layout
      transition={{ layout: { duration: reducedMotion ? 0 : 0.32 } }}
    >
      <button
        aria-haspopup="dialog"
        aria-label={`${dish.name}, ${formatINR(dish.price)}. View dish details`}
        className="menu-item-trigger"
        onClick={() => onSelect(dish)}
        type="button"
      >
        <span className="menu-item-image-wrap">
          <Image
            alt={dish.imageAlt}
            className="menu-item-image"
            fill
            sizes="(max-width: 620px) 88vw, (max-width: 950px) 45vw, 29vw"
            src={dish.image}
            unoptimized
          />
          {dish.isBestseller && (
            <span className="menu-bestseller">
              <Sparkles aria-hidden="true" size={12} />
              Bestseller
            </span>
          )}
          <span aria-hidden="true" className="menu-view-detail">
            View details <span>↗</span>
          </span>
        </span>

        <span className="menu-item-copy">
          <span className="menu-item-topline">
            <span className="menu-item-category">{dish.category}</span>
            {dish.isVegetarian && (
              <span className="menu-vegetarian">
                <Leaf aria-hidden="true" size={12} />
                Vegetarian
              </span>
            )}
          </span>
          <span className="menu-item-title-row">
            <span className="menu-item-name">{dish.name}</span>
            <span className="menu-item-price">{formatINR(dish.price)}</span>
          </span>
          <span className="menu-item-description">{dish.description}</span>
        </span>
      </button>
    </motion.article>
  );
}
