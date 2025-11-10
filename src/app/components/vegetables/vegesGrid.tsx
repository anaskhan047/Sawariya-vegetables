"use client";

import React, { useEffect, useState } from "react";
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

        console.log("API /api/products response:", data);

        if (data?.success && Array.isArray(data.products)) {
          // normalize category to lowercase and compare to "vegetables"
          const onlyVegetables = (data.products as Product[]).filter((p) => {
            const cat = (p.category ?? "").toString().trim().toLowerCase();
            return cat === "vegetable"; // <-- correct lowercase comparison
          });

          console.log("Filtered vegetables:", onlyVegetables);
          // If nothing matched, log unique category values to help debugging
          if (onlyVegetables.length === 0) {
            const categories = Array.from(
              new Set((data.products as Product[]).map((p) => (p.category ?? "").toString().trim()))
            );
            console.warn("No products matched category 'vegetables'. Categories found in data:", categories);
          }

          setVegetables(onlyVegetables);

          const initialQuantities: Record<string, number> = {};
          onlyVegetables.forEach((v) => {
            // prefer v.id, fallback to _id
            const key = v.id ?? v._id;
            initialQuantities[key] = v.minQty ?? (v.unit === "kg" ? 0.5 : 1);
          });
          setQuantities(initialQuantities);
        } else {
          console.warn("/api/products did not return products array:", data);
        }
      } catch (err) {
        console.error("Error loading vegetables:", err);
      }
    };
    fetchVegetables();
  }, []);

  const sortedVegetables = [...vegetables].sort((a, b) => {
    if (sortOrder === "low-high") return a.price - b.price;
    if (sortOrder === "high-low") return b.price - a.price;
    if (sortOrder === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortOrder === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return 0;
  });

  const handleQuantityChange = (item: Product, change: number) => {
    setQuantities((prev) => {
      const current = prev[item.id] ?? item.minQty ?? (item.unit === "kg" ? 0.5 : 1);
      let newQty = current + change;

      if (item.unit === "kg") {
        const step = 0.5;
        if (newQty < (item.minQty ?? step)) newQty = item.minQty ?? step;
        if (newQty > (item.maxQty ?? 1000)) newQty = item.maxQty ?? 1000;
        newQty = Math.round(newQty * 10) / 10;
      } else {
        if (newQty < (item.minQty ?? 1)) newQty = item.minQty ?? 1;
        if (newQty > (item.maxQty ?? 100000)) newQty = item.maxQty ?? 100000;
        newQty = Math.floor(newQty);
      }

      return { ...prev, [item.id]: newQty };
    });
  };

  const handleAddToCart = async (item: Product) => {
    try {
      const qty = quantities[item.id] ?? item.minQty ?? 1;
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: item.id,
          quantity: qty,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        await refreshCart();
      } else {
        alert(data?.message || "Failed to add to cart");
      }
    } catch (error) {
      console.error("Add to cart error:", error);
      alert("Something went wrong");
    }
  };

  return (
    <div className="bg-[var(--background-color)] min-h-screen py-6 text-[var(--text-color)]">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex justify-end mb-6">
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as SortOrder)}
            className="border border-[var(--border-color)] px-3 py-2 rounded-md cursor-pointer text-[var(--text-color)] bg-white shadow-sm"
          >
            <option value="newest">Newest → Oldest</option>
            <option value="oldest">Oldest → Newest</option>
            <option value="low-high">Price: Low → High</option>
            <option value="high-low">Price: High → Low</option>
          </select>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
          {sortedVegetables.map((veg) => {
            const imgUrl = veg.images && veg.images.length > 0 ? veg.images[0].url : "/placeholder.png";
            const qty = quantities[veg.id] ?? veg.minQty ?? (veg.unit === "kg" ? 0.5 : 1);

            return (
              <div
                key={veg._id}
                className="group bg-white border border-[var(--border-color)] rounded-lg overflow-hidden shadow-sm 
                           hover:shadow-lg hover:-translate-y-2 hover:scale-[1.02] transform transition duration-300 flex flex-col text-center pb-4"
              >
                <div className="w-full aspect-square bg-gray-100 overflow-hidden">
                  <img src={imgUrl} alt={veg.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                </div>

                <h3 className="text-lg font-semibold mt-3">{veg.name}</h3>

                <p className="text-green-700 font-bold">
                  <span className="line-through text-red-500 mx-3">₹{veg.marketPrice}</span>
                  ₹{veg.price} / {veg.unit}
                </p>

                <div className="flex items-center justify-center gap-3 mt-3">
                  <button onClick={() => handleQuantityChange(veg, veg.unit === "kg" ? -0.5 : -1)} className="p-2 border rounded-md hover:bg-gray-100">
                    <Minus size={18} />
                  </button>
                  <span className="font-semibold">
                    {qty} {veg.unit}
                  </span>
                  <button onClick={() => handleQuantityChange(veg, veg.unit === "kg" ? 0.5 : 1)} className="p-2 border rounded-md hover:bg-gray-100">
                    <Plus size={18} />
                  </button>
                </div>

                <button
                  onClick={() => handleAddToCart(veg)}
                  disabled={veg.stockQty !== undefined && veg.stockQty <= 0}
                  className={`mt-4 px-4 py-2 rounded-md flex items-center gap-2 mx-auto shadow-md transition transform duration-200
                    ${veg.stockQty === undefined || veg.stockQty > 0 ? "bg-[var(--primary-color)] text-white hover:opacity-90 hover:scale-105 active:scale-95" : "bg-gray-400 text-white cursor-not-allowed"}`}
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
