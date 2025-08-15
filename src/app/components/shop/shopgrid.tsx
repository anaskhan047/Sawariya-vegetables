"use client";

import { useState, useRef, useEffect } from "react";
import ShopSidebar from "./sidebar";
import Image from "next/image";

export const products = [
  { id: 1, name: "Tomato", price: 80, unit: "per KG", image: "https://i.pinimg.com/474x/05/e5/04/05e504b09c18c8312ae69d6a9c022dea.jpg", stock: true },
  { id: 2, name: "Spinach", price: 60, unit: "per KG", image: "https://www.goodfoodtoall.com/wp-content/uploads/2021/05/spinach.jpg", stock: true },
  { id: 3, name: "Yellow Capsicum", price: 120, unit: "per KG", image: "https://png.pngtree.com/png-clipart/20210308/original/pngtree-yellow-pepper-hand-drawn-cartoon-material-png-image_5762947.jpg", stock: false },
  { id: 4, name: "Potato", price: 45, unit: "per KG", image: "https://4.imimg.com/data4/KM/KQ/ANDROID-46853165/product-500x500.jpeg", stock: true },
  { id: 5, name: "Kashmiri Apple", price: 150, unit: "per KG", image: "https://www.collinsdictionary.com/images/full/apple_158989157.jpg", stock: true },
  { id: 6, name: "Carrot", price: 70, unit: "per KG", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTba3FfUO6CI9cySnHdGt1roZY60bdUInxLXQ&s", stock: true },
  { id: 7, name: "Cabbage", price: 55, unit: "per KG", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTNo5Oa1YsmtqVXGDDmrXgSU7JSXfGIPFsApA&s", stock: true },
  { id: 8, name: "Orange", price: 90, unit: "per KG", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Ambersweet_oranges.jpg/1200px-Ambersweet_oranges.jpg", stock: true },
  { id: 9, name: "Spring Onion", price: 30, unit: "per bunch", image: "https://www.bbassets.com/media/uploads/p/l/20000981_9-fresho-spring-onion-with-roots.jpg", stock: true },
  { id: 10, name: "Green Beans", price: 40, unit: "per KG", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRYyLI5FIrNhr1DJOFlhhUxRy7hKYIvRIK0eA&s", stock: true },
];

export default function ShopGrid() {
  const [translatedNames, setTranslatedNames] = useState<{ [id: number]: string }>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [quantities, setQuantities] = useState<{ [id: number]: number }>(
    products.reduce((acc, p) => {
      acc[p.id] = 1; // default 1 kg
      return acc;
    }, {} as { [id: number]: number })
  );

  async function translateText(text: string) {
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data = await res.json();
      return data.translatedText;
    } catch (err) {
      console.error("Translation error:", err);
      return text;
    }
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setSidebarOpen(false);
      }
    }
    if (sidebarOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [sidebarOpen]);

  useEffect(() => {
    async function loadTranslations() {
      const translations: { [id: number]: string } = {};
      for (const product of products) {
        const translated = await translateText(product.name);
        translations[product.id] = translated;
      }
      setTranslatedNames(translations);
    }
    loadTranslations();
  }, []);

  function increaseQty(id: number) {
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.min(prev[id] + 0.5, 10),
    }));
  }

  function decreaseQty(id: number) {
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.max(prev[id] - 0.5, 0.5),
    }));
  }

  return (
    <>
      {/* Mobile Filter Button */}
      <button
        className="md:hidden bg-green-600 text-white px-4 py-2 mt-13 fixed top-4 left-4 z-50 rounded shadow"
        onClick={() => setSidebarOpen(true)}
      >
        Filters
      </button>

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`fixed md:static top-0 left-0 h-full bg-white z-40 transform transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <ShopSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Products */}
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold text-[var(--primary-color)] mb-6 mt-5">Our Products</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="border border-[var(--border-color)] rounded-lg p-4 flex flex-col items-center shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="relative w-full h-40">
                <Image
                  width={300}
                  height={160}
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover rounded-md"
                />
                {!product.stock && (
                  <span className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
                    Out of Stock
                  </span>
                )}
              </div>
              <h3 className="mt-3 text-lg font-semibold text-gray-800">
                {product.name} / {translatedNames[product.id] || "…"}
              </h3>
              <p className="text-green-700 font-bold mt-1">
                ₹{product.price}
                <span className="text-sm text-gray-500 font-normal ml-1">{product.unit}</span>
              </p>

              <div className="flex items-center mt-3">
                <button
                  onClick={() => decreaseQty(product.id)}
                  className="px-2 py-1 bg-gray-200 rounded-l"
                >
                  -
                </button>
                <input
                  type="number"
                  step={0.5}
                  min={0.5}
                  max={10}
                  value={quantities[product.id]}
                  onChange={(e) =>
                    setQuantities((prev) => ({
                      ...prev,
                      [product.id]: Math.min(
                        Math.max(parseFloat(e.target.value) || 0.5, 0.5),
                        10
                      ),
                    }))
                  }
                  className="w-16 text-center border-t border-b border-gray-300"
                />
                <button
                  onClick={() => increaseQty(product.id)}
                  className="px-2 py-1 bg-gray-200 rounded-r"
                >
                  +
                </button>
              </div>

              <button
                disabled={!product.stock}
                className={`mt-4 w-full py-2 rounded text-white font-semibold transition-colors ${
                  product.stock
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-gray-400 cursor-not-allowed"
                }`}
              >
                Add to Cart
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
