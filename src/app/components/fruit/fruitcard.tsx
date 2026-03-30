"use client";
import React, { useState, useEffect } from "react";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { useCart } from "@/app/context/CartContext";

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
  //  Fetch fruits from API
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

          // Initialize quantities with minQty
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
    fetchFruits();
  }, []);

  //  Sorting
  const sortedFruits = [...fruits].sort((a, b) => {
    if (sortOrder === "low-high") return a.price - b.price;
    if (sortOrder === "high-low") return b.price - a.price;
    if (sortOrder === "newest")
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortOrder === "oldest")
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return 0;
  });

  //  Quantity Change
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

  //  Add to Cart (API integration)
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
    <div className="bg-[var(--background-color)] min-h-screen py-6 text-[var(--text-color)]">
      <div className="container mx-auto max-w-7xl px-4">
        {/* Sort Dropdown */}
        <div className="flex justify-end mb-6">
          <select
            value={sortOrder}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setSortOrder(e.target.value as SortOrder)
            }
            className="border border-[var(--border-color)] px-3 py-2 rounded-md cursor-pointer text-[var(--text-color)] bg-white shadow-sm"
          >
            <option value="newest">Newest → Oldest</option>
            <option value="oldest">Oldest → Newest</option>
            <option value="low-high">Price: Low → High</option>
            <option value="high-low">Price: High → Low</option>
          </select>
        </div>

        {/* Fruits Grid */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 md:grid-cols-4 md:gap-5">
          {sortedFruits.map((fruit) => {
            const imgUrl =
              fruit.images && fruit.images.length > 0
                ? fruit.images[0].url
                : "/placeholder.png";

            return (
              <div
                key={fruit._id}
                className="group flex flex-col overflow-hidden rounded-xl border border-[var(--border-color)] bg-white p-1.5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md md:p-3"
              >
                {/* Image */}
                <div className="w-full aspect-square bg-gray-100 overflow-hidden">
                  <img
                    src={imgUrl}
                    alt={fruit.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                  />
                </div>

                {/* Name */}
                <h3 className="mt-2 line-clamp-2 text-center text-[11px] font-semibold leading-4 md:mt-3 md:text-sm">{fruit.name}</h3>
                <p className="line-clamp-1 text-center text-[10px] text-[var(--text-light)] md:text-xs">{fruit.inHindi}</p>
                <p className="text-green-700 font-bold">
                  <span className="line-through text-red-500 mx-3">₹{fruit.marketPrice} </span>
                  ₹{fruit.price} / {fruit.unit}
                </p>

                {/* Quantity Counter */}
                <div className="mt-2 flex items-center justify-center gap-1.5 md:gap-2">
                  <button
                    onClick={() =>
                      handleQuantityChange(fruit, fruit.unit === "kg" ? -0.5 : -1)
                    }
                    className="rounded border px-1.5 py-1 text-xs hover:bg-gray-100 md:px-2"
                  >
                    <Minus size={18} />
                  </button>
                  <span className="text-[11px] font-semibold md:text-xs">
                    {quantities[fruit.id] || fruit.minQty} {fruit.unit}
                  </span>
                  <button
                    onClick={() =>
                      handleQuantityChange(fruit, fruit.unit === "kg" ? 0.5 : 1)
                    }
                    className="rounded border px-1.5 py-1 text-xs hover:bg-gray-100 md:px-2"
                  >
                    <Plus size={18} />
                  </button>
                </div>

                {/* Add to Cart */}
                <button
                  onClick={() => handleAddToCart(fruit)}
                  disabled={fruit.stockQty !== undefined && fruit.stockQty <= 0}
                  className={`mt-2 mx-auto flex items-center gap-1 rounded-md px-2 py-1.5 text-[10px] shadow-md transition duration-200 md:mt-3 md:gap-2 md:px-4 md:py-2 md:text-sm
                    ${
                      fruit.stockQty === undefined || fruit.stockQty > 0
                        ? "bg-[var(--primary-color)] text-white hover:opacity-90 hover:scale-105 active:scale-95"
                        : "bg-gray-400 text-white cursor-not-allowed"
                    }`}
                >
                  <ShoppingCart size={18} /> Add to Cart
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
