"use client";
import React, { Suspense, useState } from "react";
import ShopSidebarWrapper from "../components/shop/ShopSidebarWrapper";
import ShopGridWrapper from "../components/shop/ShopGridWrapper";
import Footer from "../layout/Footer";

export default function ShopPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <main className="min-h-screen bg-[var(--background-color)]">
      <div className="mx-auto w-full max-w-[1600px] px-3 pb-10 pt-14 sm:px-4 md:pt-16 lg:px-6">
        <div className="mb-3 mt-8 flex justify-end md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-xl bg-[var(--primary-color)] px-4 py-2 text-sm font-semibold text-white shadow-sm"
          >
            Open Filters
          </button>
        </div>

        <div className="flex flex-col gap-4 md:gap-6 lg:gap-8">
          <aside className="hidden md:block md:fixed md:left-4 md:top-24 md:z-30 md:h-[calc(100vh-7rem)] md:w-[clamp(240px,24vw,320px)] lg:left-6">
            <Suspense fallback={null}>
              <ShopSidebarWrapper isOpen={true} onClose={() => setSidebarOpen(false)} />
            </Suspense>
          </aside>

          {sidebarOpen && (
            <>
              <div
                className="fixed inset-0 z-40 bg-black/35 backdrop-blur-[2px] md:hidden"
                onClick={() => setSidebarOpen(false)}
              />
              <div className="fixed left-0 top-0 z-50 h-full w-[min(88vw,320px)] md:hidden">
                <Suspense fallback={null}>
                  <ShopSidebarWrapper isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                </Suspense>
              </div>
            </>
          )}

          <section className="min-w-0 flex-1 md:ml-[clamp(240px,24vw,320px)]">
            <Suspense fallback={<div>Loading...</div>}>
              <ShopGridWrapper />
            </Suspense>
            <Footer />
          </section>
        </div>
      </div>
    </main>
  );
}
