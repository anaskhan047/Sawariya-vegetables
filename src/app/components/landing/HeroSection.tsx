"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

type Area = {
  _id: string;
  name: string;
  pincode: string;
};

export default function HeroSection() {
  const router = useRouter();
  const [areas, setAreas] = useState<Area[]>([]);
  const [showAreas, setShowAreas] = useState(false);
  const [isLoadingAreas, setIsLoadingAreas] = useState(false);

  const loadAreas = useCallback(async () => {
    if (areas.length > 0 || isLoadingAreas) return;
    setIsLoadingAreas(true);
    try {
      const res = await fetch("/api/delivery-area", { cache: "force-cache" });
      if (!res.ok) return;
      const data: Area[] = await res.json();
      setAreas(data);
    } finally {
      setIsLoadingAreas(false);
    }
  }, [areas.length, isLoadingAreas]);

  useEffect(() => {
    if (showAreas) loadAreas();
  }, [showAreas, loadAreas]);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#edf6ea] via-[#f4fbf2] to-[#e6f3df] pb-12 pt-4 ">
      <div className="pointer-events-none absolute -left-20 top-8 h-64 w-64 rounded-full bg-emerald-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-lime-200/40 blur-3xl" />

      <div className="relative mx-auto grid w-full max-w-[1280px] grid-cols-1 items-center gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:gap-10 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="order-2 lg:order-1"
        >
          <p className="mb-3 inline-block rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700 sm:text-xs">
            All Natural Products
          </p>

          <h1 className="max-w-xl text-3xl font-black leading-tight text-slate-900 sm:text-4xl lg:text-6xl">
            Fresh and Healthy
            <span className="block text-emerald-700">Veggies Market</span>
          </h1>

          <p className="mt-4 max-w-lg text-sm leading-6 text-slate-600 sm:text-base">
            Daily farm-picked vegetables and fruits, carefully packed and delivered fast across Indore.
            Pure quality, fair pricing, and freshness you can trust every day.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3 sm:gap-4">
            <button
              onClick={() => router.push("/shop")}
              className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(5,150,105,0.28)] transition hover:-translate-y-0.5 hover:bg-emerald-700"
            >
              Shop Now
            </button>
            <button
              onClick={() => setShowAreas((v) => !v)}
              className="rounded-xl border border-slate-300 bg-white/90 px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              {showAreas ? "Hide Delivery Areas" : "Check Delivery Areas"}
            </button>
          </div>

          {showAreas ? (
            <div className="mt-4 w-full max-w-md rounded-2xl border border-emerald-100 bg-white/95 p-3 shadow-sm">
              <p className="mb-2 text-sm font-semibold text-emerald-700">Available Areas</p>
              <div className="max-h-36 space-y-1 overflow-y-auto pr-1 text-sm text-slate-700">
                {isLoadingAreas ? (
                  <p className="text-slate-500">Loading areas...</p>
                ) : areas.length > 0 ? (
                  areas.map((area) => (
                    <div key={area._id} className="rounded-lg border border-slate-100 px-2 py-1.5">
                      {area.name} ({area.pincode})
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500">No areas found.</p>
                )}
              </div>
            </div>
          ) : null}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.05 }}
          className="relative order-1 lg:order-2"
        >
          <div className="relative mx-auto aspect-[4/3] w-full max-w-[620px] overflow-hidden rounded-[28px] border border-emerald-100 bg-white/60 p-3 shadow-[0_24px_40px_rgba(15,23,42,0.12)] sm:p-4">
            <div className="absolute right-4 top-4 h-10 w-10 rounded-full bg-white/80 shadow-sm" />
            <div className="absolute bottom-5 left-5 h-3 w-3 rounded-full bg-emerald-500" />
            <img
              src="/hero/hero.png"
              alt="Fresh vegetables and fruits"
              className="h-full w-full rounded-[22px] object-contain bg-[#eef6e9]"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
