// components/shop/ShopGridWrapper.tsx
"use client";
import { Suspense } from "react";
import ShopGrid from "./shopgrid";

export default function ShopGridWrapper() {
  return (
    <Suspense fallback={<div>Loading products...</div>}>
      <ShopGrid />
    </Suspense>
  );
}
