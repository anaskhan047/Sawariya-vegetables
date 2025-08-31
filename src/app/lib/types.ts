export type Unit = "kg" | "piece" | "dozen";

export type ImageRef = {
  url: string;
  public_id: string;
};

export interface Product {
  id: string;
  name: string;
  description?: string;
  category: string;
  price: number;

  images?: ImageRef[];   // from backend
  imageData?: string;    // for frontend preview (not stored in DB)

  unit: Unit;
  minQty: number;
  maxQty: number;
  stockQty: number;

  createdAt?: string;
  updatedAt?: string;
}

export const CATEGORIES = [
  "Leafy Greens",
  "Fruits",
  "Vegetables",
  "Herbs",
  "Other",
] as const;
