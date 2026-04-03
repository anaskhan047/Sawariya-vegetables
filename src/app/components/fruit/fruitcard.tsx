"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { useCart } from "@/app/context/CartContext";
import Image from "next/image";

type SortOrder = "newest" | "oldest" | "low-high" | "high-low";

interface ProductImage {
  url: string;
  public_id: string;
}

interface Product {
  _id: string;
  id: string;
  name: string;
  inHindi: string;
  price: number;
  marketPrice: number;
  unit: "kg" | "dozen" | "piece";
  category: string;
  images: ProductImage[];
  createdAt: string;
  minQty: number;
  maxQty: number;
  stockQty?: number;
}

export default function FruitsPage() {
  const [sortOrder, setSortOrder] = useState<SortOrder>("low-high");
  const [fruits, setFruits] = useState<Product[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const { refreshCart } = useCart();

  useEffect(() => {
    const fetchFruits = async () => {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();

        if (data.success && data.products) {
          const onlyFruits = data.products.filter(
            (p: Product) => p.category.toLowerCase() === "fruits"
          );
          setFruits(onlyFruits);

          const initialQuantities: Record<string, number> = {};
          onlyFruits.forEach((f: Product) => {
            initialQuantities[f.id] = f.minQty || 1;
          });

          setQuantities(initialQuantities);
        }
      } catch (err) {
        console.error("Error loading fruits:", err);
      }
    };
    fetchFruits().catch(() => undefined);
  }, []);

  const sortedFruits = useMemo(() => {
    return [...fruits].sort((a, b) => {
      if (sortOrder === "low-high") return a.price - b.price;
      if (sortOrder === "high-low") return b.price - a.price;
      if (sortOrder === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortOrder === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return 0;
    });
  }, [fruits, sortOrder]);

  const handleQuantityChange = (fruit: Product, change: number) => {
    setQuantities((prev) => {
      const current = prev[fruit.id] || fruit.minQty || 1;
      let newQty = current + change;

      if (fruit.unit === "kg") {
        if (newQty < fruit.minQty) newQty = fruit.minQty;
        if (newQty > fruit.maxQty) newQty = fruit.maxQty;
        newQty = parseFloat(newQty.toFixed(1));
      } else {
        if (newQty < fruit.minQty) newQty = fruit.minQty;
        if (newQty > fruit.maxQty) newQty = fruit.maxQty;
      }

      return { ...prev, [fruit.id]: newQty };
    });
  };

  const handleAddToCart = async (fruit: Product) => {
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: fruit.id,
          quantity: quantities[fruit.id] || fruit.minQty || 1,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        await refreshCart();
      } else {
        alert(data.message || "Failed to add to cart");
      }
    } catch (error) {
      console.error("Add to cart error:", error);
      alert("Something went wrong");
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-3 py-6 sm:px-5 md:py-8">
      <div className="mb-5 rounded-2xl border border-amber-100 bg-gradient-to-r from-amber-50 via-white to-orange-50 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">Seasonal Picks</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">Fruits</h2>
          </div>

          <select
            value={sortOrder}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortOrder(e.target.value as SortOrder)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 sm:w-auto sm:text-sm"
          >
            <option value="newest">Newest to Oldest</option>
            <option value="oldest">Oldest to Newest</option>
            <option value="low-high">Price: Low to High</option>
            <option value="high-low">Price: High to Low</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {sortedFruits.map((fruit) => {
          const imgUrl = fruit.images && fruit.images.length > 0 ? fruit.images[0].url : "/placeholder.png";

          return (
            <div
              key={fruit._id}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-3"
            >
              <div className="relative aspect-square overflow-hidden rounded-xl bg-slate-100">
                <Image
                  src={imgUrl}
                  alt={fruit.name}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-110"
                  sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
                />
              </div>

              <h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-5 text-slate-900">{fruit.name}</h3>
              <p className="line-clamp-1 text-[11px] text-slate-500">{fruit.inHindi}</p>

              <p className="mt-1 text-sm font-bold text-emerald-700">
                <span className="mr-1 text-[11px] text-rose-500 line-through">Rs {fruit.marketPrice}</span>
                Rs {fruit.price}
                <span className="ml-1 text-[11px] font-medium text-slate-500">/ {fruit.unit}</span>
              </p>

              <div className="mt-2 flex items-center justify-center gap-1.5 sm:gap-2">
                <button
                  onClick={() => handleQuantityChange(fruit, fruit.unit === "kg" ? -0.5 : -1)}
                  className="rounded-lg border px-1.5 py-1 text-xs hover:bg-slate-50 sm:px-2"
                >
                  <Minus size={14} />
                </button>
                <span className="min-w-[56px] text-center text-[11px] font-semibold text-slate-700 sm:text-xs">
                  {quantities[fruit.id] || fruit.minQty} {fruit.unit}
                </span>
                <button
                  onClick={() => handleQuantityChange(fruit, fruit.unit === "kg" ? 0.5 : 1)}
                  className="rounded-lg border px-1.5 py-1 text-xs hover:bg-slate-50 sm:px-2"
                >
                  <Plus size={14} />
                </button>
              </div>

              <button
                onClick={() => handleAddToCart(fruit)}
                disabled={fruit.stockQty !== undefined && fruit.stockQty <= 0}
                className={`mt-2 flex w-full items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-semibold text-white transition sm:text-xs ${
                  fruit.stockQty === undefined || fruit.stockQty > 0
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "cursor-not-allowed bg-slate-400"
                }`}
              >
                <ShoppingCart size={14} /> Add to Cart
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
