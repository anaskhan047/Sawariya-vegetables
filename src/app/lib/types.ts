export type Unit = "kg" | "piece" | "dozen";
export type Grade = "Premium" | "Gold" | "Silver" | "Standard";

export type ImageRef = {
  url: string;
  public_id: string;
};

export interface Product {
  id: string;
  name: string;
    hindiName?: string;
  description?: string;
  category: string;
  price: number;

  images?: ImageRef[];  
  imageData?: string;   

  unit: Unit;
  minQty: number;
  maxQty: number;
  stockQty: number;

  grade: Grade;
  popular: boolean;

  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  image?: string;
}
