// app/shop/page.tsx
"use client";
import React, { useState, Suspense } from "react";
import ShopSidebarWrapper from "../components/shop/ShopSidebarWrapper";
import ShopGridWrapper from "../components/shop/ShopGridWrapper";

export default function ShopPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <main className="min-h-screen bg-[var(--background-color)] flex flex-col md:flex-row">
      {/* Mobile Filter Button */}
      <div className="md:hidden p-4 flex justify-end">
        <button
          onClick={() => setSidebarOpen(true)}
          className="bg-green-600 text-white px-4 py-2 rounded mt-12"
        >
          Filter
        </button>
      </div>

      {/* Sidebar (Sticky/Fix on Desktop) */}
      <div className="md:w-64 md:flex-shrink-0 z-50">
        <Suspense fallback={null}>
          <ShopSidebarWrapper isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        </Suspense>
      </div>

      {/* Products Grid */}
      <div className="flex-1">
        <Suspense fallback={<div>Loading...</div>}>
          <ShopGridWrapper />
        </Suspense>
      </div>
    </main>
  );
}
