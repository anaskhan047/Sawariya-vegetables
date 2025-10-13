"use client";

import Image from "next/image";
import React, { useEffect, useState } from "react";
import { Product } from "@/app/lib/types"; // <-- yeh aapke types.ts se le rahe hain
import { useCart } from "@/app/context/CartContext";

export default function ProductGrid() {
  const [products, setProducts] = useState<Product[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const { refreshCart } = useCart();
  //  API se products fetch karo
  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        if (data.success && Array.isArray(data.products)) {
          // Shuffle + first 8
          const shuffled = [...data.products].sort(() => Math.random() - 0.5);
          const selected = shuffled.slice(0, 8);
          setProducts(selected);

          // Initial quantities minQty se set
          const initial: Record<string, number> = {};
          selected.forEach((p) => {
            initial[p.id] = p.minQty ?? 1;
          });
          setQuantities(initial);
        }
      } catch (err) {
        console.error("Error fetching products:", err);
      }
    }
    fetchProducts();
  }, []);

  //  Quantity update
  const updateQuantity = (id: string, value: number) => {
    setQuantities((prev) => {
      const current = prev[id] ?? 1;
      const product = products.find((p) => p.id === id);
      if (!product) return prev;

      const newQty = Math.min(
        product.maxQty ?? 10,
        Math.max(product.minQty ?? 1, current + value)
      );

      return { ...prev, [id]: newQty };
    });
  };

  //  Add to Cart API
  const handleAddToCart = async (product: Product) => {
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          quantity: quantities[product.id] || product.minQty || 1,
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
    <section className="bg-[var(--background-color)] py-10 max-w-6xl mx-auto">
      <h2 className="text-center text-3xl font-bold text-[var(--text-color)] mb-8">
        Our Fresh Picks
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-white border border-[var(--border-color)] rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
          >
            <div className="relative w-full h-48">
              <Image
                src={product.images?.[0]?.url ?? "/placeholder.png"}
                alt={product.name}
                fill
                className="object-cover"
              />

              {/* Popular Badge */}
              {product.popular && (
                <span className="absolute top-2 right-2 bg-yellow-500 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-md flex items-center space-x-1">
                  <span>⭐</span>
                  <span>Popular</span>
                </span>
              )}

              {/* Grade Badge */}
              {product.grade && (
                <span
                  className={`absolute right-2 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md flex items-center space-x-1 ${
                    product.popular ? "top-12" : "top-2"
                  } ${
                    product.grade === "Standard"
                      ? "bg-gray-500"
                      : product.grade === "Silver"
                      ? "bg-slate-400"
                      : product.grade === "Gold"
                      ? "bg-yellow-400"
                      : product.grade === "Premium"
                      ? "bg-purple-600"
                      : "bg-blue-500"
                  }`}
                >
                  <span>⭐</span>
                  <span>{product.grade}</span>
                </span>
              )}
            </div>

            <div className="p-4">
              <h3 className="text-lg font-semibold text-[var(--text-color)] mb-1">
                {product.name} 
              </h3>
              <h3 className="text-lg font-semibold text-[var(--text-color)] mb-1">
                {product.inHindi} 
              </h3>
              <p className="text-sm text-[var(--text-light)] mb-3">
                ₹{product.price} / {product.unit}
              </p>

              {/* Quantity */}
              <div className="flex items-center gap-2 mb-3">
                <button
                  className="px-2 py-1 border border-[var(--border-color)] rounded"
                  onClick={() => updateQuantity(product.id, -0.5)}
                >
                  -
                </button>
                <span className="w-8 text-center">
                  {quantities[product.id]}
                </span>
                <button
                  className="px-2 py-1 border border-[var(--border-color)] rounded"
                  onClick={() => updateQuantity(product.id, 0.5)}
                >
                  +
                </button>
              </div>

              {/* Add to Cart Button with API + hover/click effects */}
              <button
                onClick={() => handleAddToCart(product)}
                disabled={product.stockQty !== undefined && product.stockQty <= 0}
                className={`w-full py-2 rounded font-medium transition-all duration-200 transform
                  ${
                    product.stockQty === undefined || product.stockQty > 0
                      ? "bg-[var(--primary-color)] text-white hover:bg-[var(--secondary-color)] hover:scale-105 active:scale-95"
                      : "bg-gray-400 text-white cursor-not-allowed"
                  }`}
              >
                Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center mt-8">
        <button
          className="px-6 py-2 border border-[var(--primary-color)] text-[var(--primary-color)]
             bg-transparent hover:bg-[var(--primary-color)] hover:text-white
             hover:border-[var(--secondary-color)]
             rounded transition-all duration-300 ease-in-out transform hover:scale-105"
          onClick={() => (window.location.href = "/shop")}
        >
          View All Products
        </button>
      </div>
    </section>
  );
}
