"use client";
import React, { useState, useEffect } from "react";
import { Minus, Plus, ShoppingCart } from "lucide-react";

type SortOrder = "newest" | "oldest" | "low-high" | "high-low";

interface Fruit {
  name: string;
  price: number;
  unit: "kg" | "dozen" | "piece";
  image: string;
  date: string;
}

export default function FruitsPage() {
  const [sortOrder, setSortOrder] = useState<SortOrder>("low-high");
  const [translatedNames, setTranslatedNames] = useState<Record<string, string>>({});
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const fruits: Fruit[] = [
    { name: "Kashmiri Apple", price: 120, unit: "kg", image: "https://assets.clevelandclinic.org/transform/LargeFeatureImage/cd71f4bd-81d4-45d8-a450-74df78e4477a/Apples-184940975-770x533-1_jpg", date: "2025-08-10" },
    { name: "Banana", price: 60, unit: "dozen", image: "https://nutritionsource.hsph.harvard.edu/wp-content/uploads/2018/08/bananas-1354785_1920.jpg", date: "2025-08-12" },
    { name: "Mango Fruit", price: 150, unit: "kg", image: "https://www.shutterstock.com/image-photo/ripe-mango-isolated-on-white-600w-2500576635.jpg", date: "2025-08-14" },
    { name: "Orange", price: 80, unit: "kg", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Ambersweet_oranges.jpg/1200px-Ambersweet_oranges.jpg", date: "2025-08-08" },
    { name: "Grapes", price: 90, unit: "kg", image: "https://extension.psu.edu/media/catalog/product/i/m/image_3777_1_2_1_262_1_23_1_28_2_11_2_2_2_38_1_94_7_2_24_46_6_414_49_21_45_2_25_15_1_9_1_18_9_6_5_1_21_3_29_8_2_1_13_5_1_2232.jpg", date: "2025-08-11" },
    { name: "Papaya", price: 70, unit: "kg", image: "https://www.metropolisindia.com/upgrade/blog/upload/25/04/papaya-benefits1744030669.webp", date: "2025-08-15" },
    { name: "Pineapple", price: 95, unit: "piece", image: "https://royalsplant.com/wp-content/uploads/2023/12/71Ozj99xTBL.jpg", date: "2025-08-09" },
    { name: "Watermelon", price: 45, unit: "kg", image: "https://www.watermelon.org/wp-content/uploads/2020/07/Seeded-Wedge-scaled.jpg", date: "2025-08-13" },
    { name: "Guava", price: 85, unit: "kg", image: "https://www.health.com/thmb/XlWTD8TZF5574DVtMEfD-XSj5Lg=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/Guava-15d1050d22034909bfca038ef1f8aaa2.jpg", date: "2025-08-07" },
    { name: "Pomegranate", price: 160, unit: "kg", image: "https://m.media-amazon.com/images/I/611a1wD9ZGL._UF894,1000_QL80_.jpg", date: "2025-08-16" },
  ];

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
    async function loadTranslations() {
      const translations: Record<string, string> = {};
      for (const fruit of fruits) {
        const translated = await translateText(fruit.name);
        translations[fruit.name] = translated;
      }
      setTranslatedNames(translations);
    }
    loadTranslations();
  }, []);

  // sorting logic
  const sortedFruits = [...fruits].sort((a, b) => {
    if (sortOrder === "low-high") return a.price - b.price;
    if (sortOrder === "high-low") return b.price - a.price;
    if (sortOrder === "newest") return new Date(b.date).getTime() - new Date(a.date).getTime();
    if (sortOrder === "oldest") return new Date(a.date).getTime() - new Date(b.date).getTime();
    return 0;
  });

  // increment/decrement quantity depending on unit
  const handleQuantityChange = (fruitName: string, unit: Fruit["unit"], change: number) => {
    setQuantities((prev) => {
      const current = prev[fruitName] || 1;
      let newQty = current + change;

      if (unit === "kg") {
        if (newQty < 0.5) newQty = 0.5;
        if (newQty > 10) newQty = 10;
        newQty = parseFloat(newQty.toFixed(1));
      } else {
        if (newQty < 1) newQty = 1;
        if (newQty > 20) newQty = 20;
      }

      return { ...prev, [fruitName]: newQty };
    });
  };

  const handleAddToCart = (fruit: Fruit) => {
    const qty = quantities[fruit.name] || 1;
    alert(`${fruit.name} (${qty} ${fruit.unit}) added to cart!`);
  };

  return (
    <div className="bg-[var(--background-color)] min-h-screen py-6 text-[var(--text-color)]">
      <div className="container mx-auto max-w-6xl px-4">

        {/* Sort Dropdown */}
        <div className="flex justify-end mb-6">
          <select
            value={sortOrder}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortOrder(e.target.value as SortOrder)}
            className="border border-[var(--border-color)] px-3 py-2 rounded-md cursor-pointer text-[var(--text-color)]"
          >
            <option value="newest">Newest → Oldest</option>
            <option value="oldest">Oldest → Newest</option>
            <option value="low-high">Price: Low → High</option>
            <option value="high-low">Price: High → Low</option>
          </select>
        </div>

        {/* Fruits Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {sortedFruits.map((fruit, index) => (
            <div
              key={index}
              className="bg-white border border-[var(--border-color)] rounded-lg overflow-hidden shadow-sm text-center pb-4"
            >
              {/* Fixed image ratio */}
              <div className="w-full aspect-[3/3] bg-gray-100">
                <img
                  src={fruit.image}
                  alt={fruit.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-lg font-semibold my-3">
                {fruit.name} / {translatedNames[fruit.name] || "…"}
              </h3>
              <p className="text-[var(--text-light)]">
                ₹{fruit.price} / {fruit.unit}
              </p>

              {/* Quantity Counter */}
              <div className="flex items-center justify-center gap-3 mt-3">
                <button
                  onClick={() => handleQuantityChange(fruit.name, fruit.unit, fruit.unit === "kg" ? -0.5 : -1)}
                  className="p-2 border rounded-md hover:bg-gray-100"
                >
                  <Minus size={18} />
                </button>
                <span className="font-semibold">
                  {quantities[fruit.name] || 1} {fruit.unit}
                </span>
                <button
                  onClick={() => handleQuantityChange(fruit.name, fruit.unit, fruit.unit === "kg" ? 0.5 : 1)}
                  className="p-2 border rounded-md hover:bg-gray-100"
                >
                  <Plus size={18} />
                </button>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={() => handleAddToCart(fruit)}
                className="mt-4 px-4 py-2 bg-[var(--primary-color)] text-white rounded-md hover:opacity-90 flex items-center gap-2 mx-auto"
              >
                <ShoppingCart size={18} /> Add to Cart
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
