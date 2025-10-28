"use client";
import React, { useState, Suspense } from "react";
import ShopSidebarWrapper from "../components/shop/ShopSidebarWrapper";
import ShopGridWrapper from "../components/shop/ShopGridWrapper";

export default function ShopPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <main className="min-h-screen bg-[var(--background-color)] flex flex-col md:flex-row relative">
      {/* 🔹 Mobile Filter Button */}
      <div className="md:hidden p-4 flex justify-end">
        <button
          onClick={() => setSidebarOpen(true)}
          className="bg-green-600 text-white px-4 py-2 rounded mt-12"
        >
          Filter
        </button>
      </div>

      {/* 🔹 Desktop Sidebar (Fixed Left, Scrollable Inside) */}
      <div className="hidden md:block fixed top-0 left-0 w-64 h-screen bg-white border-r border-gray-200 z-40">
        <Suspense fallback={null}>
          <div className="h-full overflow-y-auto">
            <ShopSidebarWrapper
              isOpen={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
            />
          </div>
        </Suspense>
      </div>

      {/* 🔹 Mobile Sidebar (Slide-in + Transparent Background Overlay) */}
      {sidebarOpen && (
        <>
          {/* Overlay (Dim Background) */}
          <div
            className="fixed inset-0  backdrop-blur-sm z-40"
            onClick={() => setSidebarOpen(false)}
          ></div>

          {/* Sliding Sidebar Panel */}
          <div
            className="fixed top-0 left-0 w-60 h-full bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out translate-x-0"
          >
            <Suspense fallback={null}>
              <ShopSidebarWrapper
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
              />
            </Suspense>
          </div>
        </>
      )}

      {/* 🔹 Product Grid (Shifted Right on Desktop) */}
      <div className="flex-1 md:ml-64 overflow-y-auto mt-0 ">
        <Suspense fallback={<div>Loading...</div>}>
          <ShopGridWrapper />
        </Suspense>
      </div>
    </main>
  );
}
