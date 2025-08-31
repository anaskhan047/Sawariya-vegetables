// src/app/lib/api/products.ts
import { Product } from "../types";
async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}
export async function fetchProducts() {
  const res = await fetch("/api/products", { credentials: "same-origin" });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.error || `Failed to fetch products (${res.status})`);
  return data?.products || [];
}

export async function createProduct(payload: Product) {
  const res = await fetch("/api/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    credentials: "same-origin",
  });

  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.error || `Failed to create product (${res.status})`);
  return data?.product as Product;
}

export async function updateProduct(id: string, payload: Partial<Product>) {
  const res = await fetch(`/api/products/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    credentials: "same-origin",
  });

  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.error || `Failed to update product (${res.status})`);
  return data?.product as Product;
}


export async function deleteProduct(id: string) {
  const res = await fetch(`/api/products/${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "same-origin",
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.error || `Failed to delete product (${res.status})`);
  return data;
}
