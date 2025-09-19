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
  price: number;
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
  // ✅ Fetch fruits from API
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

  // ✅ Sorting
  const sortedFruits = [...fruits].sort((a, b) => {
    if (sortOrder === "low-high") return a.price - b.price;
    if (sortOrder === "high-low") return b.price - a.price;
    if (sortOrder === "newest")
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortOrder === "oldest")
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return 0;
  });

  // ✅ Quantity Change
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

  // ✅ Add to Cart (API integration)
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
          {sortedFruits.map((fruit) => {
            const imgUrl =
              fruit.images && fruit.images.length > 0
                ? fruit.images[0].url
                : "/placeholder.png";

            return (
              <div
                key={fruit._id}
                className="group bg-white border border-[var(--border-color)] rounded-lg overflow-hidden shadow-sm 
                           hover:shadow-lg hover:-translate-y-2 hover:scale-[1.02] transform transition duration-300 flex flex-col text-center pb-4"
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
                <h3 className="text-lg font-semibold mt-3">{fruit.name}</h3>
                <p className="text-green-700 font-bold">
                  ₹{fruit.price} / {fruit.unit}
                </p>

                {/* Quantity Counter */}
                <div className="flex items-center justify-center gap-3 mt-3">
                  <button
                    onClick={() =>
                      handleQuantityChange(fruit, fruit.unit === "kg" ? -0.5 : -1)
                    }
                    className="p-2 border rounded-md hover:bg-gray-100"
                  >
                    <Minus size={18} />
                  </button>
                  <span className="font-semibold">
                    {quantities[fruit.id] || fruit.minQty} {fruit.unit}
                  </span>
                  <button
                    onClick={() =>
                      handleQuantityChange(fruit, fruit.unit === "kg" ? 0.5 : 1)
                    }
                    className="p-2 border rounded-md hover:bg-gray-100"
                  >
                    <Plus size={18} />
                  </button>
                </div>

                {/* Add to Cart */}
                <button
                  onClick={() => handleAddToCart(fruit)}
                  disabled={fruit.stockQty !== undefined && fruit.stockQty <= 0}
                  className={`mt-4 px-4 py-2 rounded-md flex items-center gap-2 mx-auto shadow-md transition transform duration-200
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
