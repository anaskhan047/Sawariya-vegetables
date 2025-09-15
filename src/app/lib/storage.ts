// import { Product } from "./types";

// export const STORAGE_KEY = "veg_products_v2";

// const SEED: Product[] = [
//   {
//     id: "PRD001",
//     name: "Spinach",
//     category: "Leafy Greens",
//     price: 60,
//     unit: "dozen",
//     stockQty: 100,
//     description: "Fresh spinach bunch, crisp and green.",
//     minQty: 0.5,
//     maxQty: 10,
//   },
//   {
//     id: "PRD002",
//     name: "Tomato",
//     category: "Fruit Vegetables",
//     price: 45,
//     unit: "kg",
//     stockQty: 100,
//     description: "Ripe, juicy tomatoes perfect for salads.",
//     minQty: 0.5,
//     maxQty: 10,
//   },
//   {
//     id: "PRD003",
//     name: "Carrot",
//     category: "Root Vegetables",
//     price: 40,
//     unit: "kg",
//     stockQty: 0,
//     description: "Sweet crunchy carrots.",
//     minQty: 0.5,
//     maxQty: 10,
//   },
// ];

// export function readProducts(): Product[] {
//   if (typeof window === "undefined") return SEED;
//   try {
//     const raw = localStorage.getItem(STORAGE_KEY);
//     if (!raw) {
//       localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED));
//       return SEED;
//     }
//     const parsed = JSON.parse(raw) as Product[];
//     return Array.isArray(parsed) ? parsed : SEED;
//   } catch {
//     return SEED;
//   }
// }

// export function writeProducts(products: Product[]): void {
//   if (typeof window === "undefined") return;
//   try {
//     localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
//   } catch {
//     // ignore
//   }
// }
