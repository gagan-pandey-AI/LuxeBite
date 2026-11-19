"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { menuCategories, menuItems as defaultMenuItems } from "@/data/menu";
import type { MenuDish, MenuFilterCategory } from "@/types/menu";
import { MenuDetailDialog } from "@/components/menu/menu-detail-dialog";
import { MenuItemCard } from "@/components/menu/menu-item-card";

export function MenuListing({
  dishes = defaultMenuItems,
  isConceptPreview = true,
}: {
  dishes?: MenuDish[];
  isConceptPreview?: boolean;
}) {
  const [activeCategory, setActiveCategory] =
    useState<MenuFilterCategory>("All Items");
  const [selectedDish, setSelectedDish] = useState<MenuDish | null>(null);
  const reducedMotion = useReducedMotion();

  const visibleDishes = useMemo(
    () =>
      activeCategory === "All Items"
        ? dishes
        : dishes.filter((dish) => dish.category === activeCategory),
    [activeCategory, dishes],
  );

  return (
    <>
      <section
        aria-labelledby="menu-list-title"
        className="menu-listing-section"
        id="menu-list"
      >
        <div className="menu-listing-intro">
          <div>
            <span className="eyebrow">A little something for everyone</span>
            <h2 id="menu-list-title">
              The menu,
              <br />
              <em>in its own time.</em>
            </h2>
          </div>
          <p>
            Rooted in the season and made with care. Choose a course, follow a
            craving, or let us surprise you.
          </p>
        </div>

        <div
          aria-label="Filter menu by category"
          className="menu-category-list"
          role="group"
        >
          {menuCategories.map((category) => (
            <button
              aria-pressed={activeCategory === category}
              className={`menu-category-button${activeCategory === category ? " is-active" : ""}`}
              key={category}
              onClick={() => setActiveCategory(category)}
              type="button"
            >
              {activeCategory === category && (
                <motion.span
                  aria-hidden="true"
                  className="menu-category-active-bg"
                  layoutId="menu-category-active"
                  transition={{ duration: reducedMotion ? 0 : 0.22 }}
                />
              )}
              <span>{category}</span>
            </button>
          ))}
        </div>

        <p aria-live="polite" className="menu-result-count">
          {visibleDishes.length} {visibleDishes.length === 1 ? "selection" : "selections"}
          {activeCategory === "All Items" ? " from our concept menu" : ` in ${activeCategory}`}
        </p>

        {visibleDishes.length ? (
          <div className="menu-items-grid">
            <AnimatePresence initial={false} mode="popLayout">
              {visibleDishes.map((dish, index) => (
                <MenuItemCard
                  dish={dish}
                  index={index}
                  key={dish.id}
                  onSelect={setSelectedDish}
                  reducedMotion={Boolean(reducedMotion)}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <p className="menu-empty-state" role="status">
            This part of the menu is being prepared. Please check back soon.
          </p>
        )}
      </section>

      <MenuDetailDialog
        dish={selectedDish}
        isConceptPreview={isConceptPreview}
        onClose={() => setSelectedDish(null)}
      />
    </>
  );
}
