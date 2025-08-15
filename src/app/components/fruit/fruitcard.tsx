"use client";
import React, { useState, useEffect } from "react";

export default function FruitsPage() {
  const [language, setLanguage] = useState<"en" | "hi">("en");
  const [sortOrder, setSortOrder] = useState<"low-high" | "high-low">("low-high");
  const [translatedNames, setTranslatedNames] = useState<{ [name: string]: string }>({});

  const fruits = [
    { name: "Apple", price: 120, unit: "kg", image: "/fruit/apple.jpg" },
    { name: "Banana", price: 60, unit: "dozen", image: "/fruit/banana.jpg" },
    { name: "Mango", price: 150, unit: "kg", image: "/fruit/mango.jpg" },
    { name: "Orange", price: 80, unit: "kg", image: "/fruit/orange.jpg" },
    { name: "Grapes", price: 90, unit: "kg", image: "/fruit/grapes.jpg" },
    { name: "Papaya", price: 70, unit: "kg", image: "/fruit/papaya.jpg" },
    { name: "Pineapple", price: 95, unit: "piece", image: "/fruit/pineapple.jpg" },
    { name: "Watermelon", price: 45, unit: "kg", image: "/fruit/watermelon.jpg" },
    { name: "Guava", price: 85, unit: "kg", image: "/fruit/guava.jpg" },
    { name: "Pomegranate", price: 160, unit: "kg", image: "/fruit/pomegranate.jpg" },
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
      const translations: { [name: string]: string } = {};
      for (const fruit of fruits) {
        const translated = await translateText(fruit.name);
        translations[fruit.name] = translated;
      }
      setTranslatedNames(translations);
    }
    loadTranslations();
  }, []);

  const sortedFruits = [...fruits].sort((a, b) =>
    sortOrder === "low-high" ? a.price - b.price : b.price - a.price
  );

  return (
    <div className="bg-[var(--background-color)] min-h-screen py-6 text-[var(--text-color)]">
      <div className="container mx-auto max-w-6xl px-4">
        
        {/* Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
          
          {/* Language Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setLanguage("en")}
              className={`px-4 py-2 rounded-md border border-[var(--border-color)] ${
                language === "en"
                  ? "bg-[var(--primary-color)] text-white"
                  : "bg-transparent text-[var(--text-color)]"
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLanguage("hi")}
              className={`px-4 py-2 rounded-md border border-[var(--border-color)] ${
                language === "hi"
                  ? "bg-[var(--primary-color)] text-white"
                  : "bg-transparent text-[var(--text-color)]"
              }`}
            >
              हिंदी
            </button>
          </div>

          {/* Sort Dropdown */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as "low-high" | "high-low")}
            className="border border-[var(--border-color)] px-3 py-2 rounded-md cursor-pointer text-[var(--text-color)]"
          >
            <option value="low-high">Price: Low → High</option>
            <option value="high-low">Price: High → Low</option>
          </select>
        </div>

        {/* Fruits Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {sortedFruits.map((fruit, index) => (
            <div
              key={index}
              className="bg-white border border-[var(--border-color)] rounded-lg overflow-hidden shadow-sm text-center pb-4"
            >
              <img
                src={fruit.image}
                alt={fruit.name}
                className="w-full h-40 object-cover"
              />
              <h3 className="text-lg font-semibold my-3">
                {language === "en"
                  ? fruit.name
                  : translatedNames[fruit.name] || "…"}
              </h3>
              <p className="text-[var(--text-light)]">
                ₹{fruit.price} / {fruit.unit}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
