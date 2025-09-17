"use client";
import { useState } from "react";
import ShopSidebar from "../components/shop/sidebar";
import ShopGrid from "../components/shop/shopgrid";

export default function ShopPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <main className="min-h-screen bg-[var(--background-color)]">
      {/* Mobile Filter Button */}
      <div className="md:hidden p-4 flex justify-end">
        <button
          onClick={() => setSidebarOpen(true)}
          className="bg-green-600 text-white px-4 py-2 rounded mt-12"
        >
          Filter
        </button>
      </div>

      <div className="flex flex-col md:flex-row">
        {/* Sidebar */}
        <ShopSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Products grid */}
        <div className="flex-1">
          <ShopGrid />
        </div>
      </div>
    </main>
  );
}
