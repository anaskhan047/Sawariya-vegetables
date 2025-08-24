export type Category =
  | "Leafy Greens"
  | "Root Vegetables"
  | "Fruit Vegetables"
  | "Legumes"
  | "Herbs";

export const CATEGORIES: Category[] = [
  "Leafy Greens",
  "Root Vegetables",
  "Fruit Vegetables",
  "Legumes",
  "Herbs",
];

export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: "kg" | "piece" | "dozen";
  stockQty: number; // ✅ total stock (e.g., 100 kg, 50 dozen)
  description?: string;
  imageData?: string;
  minQty: number;
  maxQty: number;
};
