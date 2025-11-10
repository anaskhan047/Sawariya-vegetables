"use client";

import React from "react";

export default function VegeBanner() {
  return (
    <section
      className="relative h-[300px] md:h-[70vh] flex items-center justify-center text-center"
      style={{
        backgroundImage: `url('/fruit/FruitBanner.png')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Overlay for better text visibility */}
      <div className="absolute inset-0 bg-black/40"></div>

      <div className="relative z-10 px-4">
        <h1 className="text-3xl md:text-5xl font-bold text-white drop-shadow-lg">
          Fresh & Organic Vegetables
        </h1>
        <p className="mt-4 text-lg md:text-xl text-white drop-shadow-md max-w-2xl mx-auto">
          Explore our wide variety of farm-fresh vegetables, handpicked for quality and taste.
        </p>
      </div>
    </section>
  );
}
