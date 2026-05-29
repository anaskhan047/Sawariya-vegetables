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
    <section className="relative min-w-0 overflow-x-hidden bg-gradient-to-br from-[#edf6ea] via-[#f4fbf2] to-[#e6f3df] pb-6 pt-2 sm:pb-8 sm:pt-3 md:pb-10 md:pt-4 lg:pb-12">
      <div className="pointer-events-none absolute -left-16 top-4 h-48 w-48 rounded-full bg-emerald-200/40 blur-3xl sm:-left-20 sm:top-8 sm:h-64 sm:w-64" />
      <div className="pointer-events-none absolute -right-12 bottom-0 h-56 w-56 rounded-full bg-lime-200/40 blur-3xl sm:-right-16 sm:h-72 sm:w-72" />

      <div className="relative mx-auto grid w-full min-w-0 max-w-[1280px] grid-cols-1 items-center gap-4 px-3 min-[375px]:gap-5 min-[375px]:px-4 sm:gap-6 sm:px-6 md:gap-8 md:px-6 lg:grid-cols-2 lg:gap-10 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="order-2 min-w-0 lg:order-1"
        >
          <p className="mb-2 inline-block max-w-full rounded-full border border-emerald-200 bg-white/80 px-2.5 py-0.5 text-[0.625rem] font-semibold uppercase leading-snug tracking-[0.12em] text-emerald-700 min-[360px]:px-3 min-[360px]:py-1 min-[360px]:text-[0.6875rem] sm:mb-3 sm:text-xs sm:tracking-[0.14em]">
            All Natural Products
          </p>

          <h1
            className="max-w-xl text-[clamp(1.375rem,4.2vw+0.55rem,2.25rem)] font-black leading-[1.12] tracking-tight text-slate-900 min-[360px]:text-[clamp(1.5rem,4vw+0.65rem,2.5rem)] sm:text-4xl sm:leading-tight md:text-5xl lg:text-6xl"
            style={{ fontFamily: '"Poppins", "Segoe UI", sans-serif' }}
          >
            Fresh and Healthy
            <span className="mt-0.5 block text-emerald-700">Veggies Market</span>
          </h1>

          <p className="mt-2.5 max-w-lg text-[0.8125rem] leading-snug text-slate-600 min-[360px]:text-sm min-[360px]:leading-6 sm:mt-4 sm:text-base sm:leading-6">
            Daily farm-picked vegetables and fruits, carefully packed and delivered fast across Indore.
            Pure quality, fair pricing, and freshness you can trust every day.
          </p>

          <div className="mt-4 flex w-full min-w-0 flex-col gap-2 min-[400px]:flex-row min-[400px]:flex-wrap min-[400px]:items-center sm:mt-6 sm:gap-3 md:gap-4">
            <button
              type="button"
              onClick={() => router.push("/shop")}
              className="w-full min-h-[44px] rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-[0_8px_18px_rgba(5,150,105,0.28)] transition hover:-translate-y-0.5 hover:bg-emerald-700 min-[400px]:w-auto sm:px-5 sm:py-3 sm:text-sm"
            >
              Shop Now
            </button>
            <button
              type="button"
              onClick={() => setShowAreas((v) => !v)}
              className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white/90 px-4 py-2.5 text-xs font-semibold text-slate-800 transition hover:bg-slate-50 min-[400px]:w-auto sm:px-5 sm:py-3 sm:text-sm"
            >
              {showAreas ? "Hide Delivery Areas" : "Check Delivery Areas"}
            </button>
          </div>

          {showAreas ? (
            <div className="mt-3 w-full max-w-md rounded-2xl border border-emerald-100 bg-white/95 p-2.5 shadow-sm sm:mt-4 sm:p-3">
              <p className="mb-1.5 text-xs font-semibold text-emerald-700 sm:text-sm">Available Areas</p>
              <div className="max-h-32 space-y-1 overflow-y-auto overscroll-y-contain pr-1 text-xs text-slate-700 min-[360px]:max-h-36 min-[360px]:text-sm sm:max-h-36">
                {isLoadingAreas ? (
                  <p className="text-slate-500">Loading areas...</p>
                ) : areas.length > 0 ? (
                  areas.map((area) => (
                    <div key={area._id} className="rounded-lg border border-slate-100 px-2 py-1">
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
          className="relative order-1 min-w-0 lg:order-2"
        >
          <div className="relative mx-auto aspect-[4/3] w-full max-w-[min(100%,620px)] overflow-hidden rounded-2xl border border-emerald-100 bg-white/60 p-2 shadow-[0_24px_40px_rgba(15,23,42,0.12)] min-[375px]:rounded-[24px] min-[375px]:p-2.5 sm:rounded-[28px] sm:p-3 md:p-4">
            <div className="absolute right-2 top-2 h-8 w-8 rounded-full bg-white/80 shadow-sm min-[375px]:right-3 min-[375px]:top-3 min-[375px]:h-9 min-[375px]:w-9 sm:right-4 sm:top-4 sm:h-10 sm:w-10" />
            <div className="absolute bottom-3 left-3 h-2.5 w-2.5 rounded-full bg-emerald-500 min-[375px]:bottom-4 min-[375px]:left-4 sm:bottom-5 sm:left-5 sm:h-3 sm:w-3" />
            <img
              src="/hero/hero.png"
              alt="Fresh vegetables and fruits"
              className="h-full w-full rounded-xl object-contain bg-[#eef6e9] min-[375px]:rounded-[18px] sm:rounded-[22px]"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
