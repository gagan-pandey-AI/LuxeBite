"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Leaf, X } from "lucide-react";
import type { MenuDish } from "@/types/menu";
import { formatINR } from "@/lib/format-inr";

type MenuDetailDialogProps = {
  dish: MenuDish | null;
  isConceptPreview?: boolean;
  onClose: () => void;
};

export function MenuDetailDialog({
  dish,
  isConceptPreview = true,
  onClose,
}: MenuDetailDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (dish && !dialog.open) {
      dialog.showModal();
    } else if (!dish && dialog.open) {
      dialog.close();
    }
  }, [dish]);

  return (
    <dialog
      aria-describedby={dish ? "menu-dialog-description" : undefined}
      aria-labelledby={dish ? "menu-dialog-title" : undefined}
      className="menu-detail-dialog"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          dialogRef.current?.close();
        }
      }}
      onCancel={(event) => {
        event.preventDefault();
        dialogRef.current?.close();
      }}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          dialogRef.current?.close();
        }
      }}
      ref={dialogRef}
    >
      {dish && (
        <motion.div
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="menu-dialog-content"
          initial={reducedMotion ? false : { opacity: 0, scale: 0.98, y: 12 }}
          transition={{ duration: reducedMotion ? 0 : 0.24 }}
        >
          <div className="menu-dialog-image-wrap">
            <Image
              alt={dish.imageAlt}
              className="menu-dialog-image"
              fill
              sizes="(max-width: 760px) 100vw, 46vw"
              src={dish.image}
              unoptimized
            />
            <button
              aria-label="Close dish details"
              className="menu-dialog-close"
              onClick={() => dialogRef.current?.close()}
              type="button"
            >
              <X aria-hidden="true" size={19} />
            </button>
          </div>

          <div className="menu-dialog-copy">
            <div className="menu-dialog-meta">
              <span className="menu-item-category">{dish.category}</span>
              {dish.isVegetarian && (
                <span className="menu-vegetarian">
                  <Leaf aria-hidden="true" size={12} />
                  Vegetarian
                </span>
              )}
            </div>
            <div className="menu-dialog-title-row">
              <h2 id="menu-dialog-title">{dish.name}</h2>
              <span>{formatINR(dish.price)}</span>
            </div>
            <p className="menu-dialog-description" id="menu-dialog-description">
              {dish.description}
            </p>
            <div className="menu-dialog-ingredients">
              <span className="menu-dialog-label">At the heart of it</span>
              <ul>
                {dish.ingredients.map((ingredient) => (
                  <li key={ingredient}>{ingredient}</li>
                ))}
              </ul>
            </div>
            {isConceptPreview && (
              <p className="menu-dialog-note">
                Our menu is a concept preview. Ingredients and prices are sample
                content.
              </p>
            )}
          </div>
        </motion.div>
      )}
    </dialog>
  );
}
