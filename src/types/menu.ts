export type MenuCategory =
  | "Starters"
  | "Main Course"
  | "Chef Specials"
  | "Desserts"
  | "Beverages";

export type MenuFilterCategory = "All Items" | MenuCategory;

export interface MenuDish {
  id: string;
  name: string;
  description: string;
  price: number;
  category: MenuCategory;
  image: string;
  imageAlt: string;
  ingredients: string[];
  isVegetarian: boolean;
  isBestseller: boolean;
  isChefRecommended: boolean;
  isFeatured: boolean;
}
