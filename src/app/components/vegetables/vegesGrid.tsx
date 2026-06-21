"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { useCart } from "@/app/context/CartContext";
import Image from "next/image";
import Swal from "sweetalert2";
import { postAddToCart } from "@/app/lib/client/addToCart";
import { getOrderableMaxQty } from "@/app/lib/stock";
import { isVegetableCategory } from "@/app/lib/productCategory";

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

export default function VegetablePage() {
  const [sortOrder, setSortOrder] = useState<SortOrder>("low-high");
  const [vegetables, setVegetables] = useState<Product[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const { refreshCart } = useCart();

  useEffect(() => {
    const fetchVegetables = async () => {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();

        if (data?.success && Array.isArray(data.products)) {
          const onlyVegetables = (data.products as Product[]).filter((p) =>
            isVegetableCategory(p.category)
          );

          setVegetables(onlyVegetables);

          const initialQuantities: Record<string, number> = {};
          onlyVegetables.forEach((v) => {
            const key = v.id ?? v._id;
            initialQuantities[key] = v.minQty ?? (v.unit === "kg" ? 0.5 : 1);
          });
          setQuantities(initialQuantities);
        }
      } catch (err) {
        console.error("Error loading vegetables:", err);
      }
    };

    fetchVegetables().catch(() => undefined);
  }, []);

  const sortedVegetables = useMemo(() => {
    return [...vegetables].sort((a, b) => {
      if (sortOrder === "low-high") return a.price - b.price;
      if (sortOrder === "high-low") return b.price - a.price;
      if (sortOrder === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortOrder === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return 0;
    });
  }, [sortOrder, vegetables]);

  const handleQuantityChange = (item: Product, change: number) => {
    setQuantities((prev) => {
      const current = prev[item.id] ?? item.minQty ?? (item.unit === "kg" ? 0.5 : 1);
      let newQty = current + change;
      const cap = getOrderableMaxQty(item);

      if (item.unit === "kg") {
        const step = 0.5;
        if (newQty < (item.minQty ?? step)) newQty = item.minQty ?? step;
        if (newQty > cap) newQty = cap;
        newQty = Math.round(newQty * 10) / 10;
      } else {
        if (newQty < (item.minQty ?? 1)) newQty = item.minQty ?? 1;
        if (newQty > cap) newQty = cap;
        newQty = Math.floor(newQty);
      }

      return { ...prev, [item.id]: newQty };
    });
  };

  const handleAddToCart = async (item: Product) => {
    try {
      const qty = quantities[item.id] ?? item.minQty ?? 1;
      const result = await postAddToCart({ productId: item.id, quantity: qty });
      if (result.ok) {
        await refreshCart();
      } else {
        Swal.fire("Not available", result.error || "Failed to add to cart", "error");
      }
    } catch (error) {
      console.error("Add to cart error:", error);
      Swal.fire("Error", "Something went wrong", "error");
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-3 py-6 sm:px-5 md:py-8">
      <div className="mb-5 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-lime-50 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Fresh Collection</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">Vegetables</h2>
          </div>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as SortOrder)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 sm:w-auto sm:text-sm"
          >
            <option value="newest">Newest to Oldest</option>
            <option value="oldest">Oldest to Newest</option>
            <option value="low-high">Price: Low to High</option>
            <option value="high-low">Price: High to Low</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {sortedVegetables.map((veg) => {
          const imgUrl = veg.images && veg.images.length > 0 ? veg.images[0].url : "/placeholder.png";
          const qty = quantities[veg.id] ?? veg.minQty ?? (veg.unit === "kg" ? 0.5 : 1);

          return (
            <div
              key={veg._id}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-3"
            >
              <div className="relative aspect-square overflow-hidden rounded-xl bg-slate-100">
                <Image
                  src={imgUrl}
                  alt={veg.name}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-110"
                  sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
                />
                {veg.stockQty !== undefined && veg.stockQty <= 0 && (
                  <span className="absolute right-2 top-2 rounded bg-rose-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                    Out
                  </span>
                )}
              </div>

              <h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-5 text-slate-900">{veg.name}</h3>
              <p className="line-clamp-1 text-[11px] text-slate-500">{veg.inHindi}</p>

              <p className="mt-1 text-sm font-bold text-emerald-700">
                <span className="mr-1 text-[11px] text-rose-500 line-through">Rs {veg.marketPrice}</span>
                Rs {veg.price}
                <span className="ml-1 text-[11px] font-medium text-slate-500">/ {veg.unit}</span>
              </p>

              <div className="mt-2 flex items-center justify-center gap-1.5 sm:gap-2">
                <button
                  onClick={() => handleQuantityChange(veg, veg.unit === "kg" ? -0.5 : -1)}
                  className="rounded-lg border px-1.5 py-1 text-xs hover:bg-slate-50 sm:px-2"
                >
                  <Minus size={14} />
                </button>
                <span className="min-w-[56px] text-center text-[11px] font-semibold text-slate-700 sm:text-xs">
                  {qty} {veg.unit}
                </span>
                <button
                  onClick={() => handleQuantityChange(veg, veg.unit === "kg" ? 0.5 : 1)}
                  className="rounded-lg border px-1.5 py-1 text-xs hover:bg-slate-50 sm:px-2"
                >
                  <Plus size={14} />
                </button>
              </div>

              <button
                onClick={() => handleAddToCart(veg)}
                disabled={veg.stockQty !== undefined && veg.stockQty <= 0}
                className={`mt-2 flex w-full items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-semibold text-white transition sm:text-xs ${
                  veg.stockQty === undefined || veg.stockQty > 0
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
