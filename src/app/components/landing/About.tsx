"use client";

import React from "react";
import Link from "next/link";

export default function AboutUs() {
  return (
    <section
      id="about"
      className="relative w-full min-w-0 overflow-x-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 py-8 sm:py-10 md:py-14 lg:py-16"
    >
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -left-24 top-0 h-48 w-48 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute -right-20 bottom-0 h-56 w-56 rounded-full bg-lime-400/15 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto w-full min-w-0 max-w-6xl px-3 min-[375px]:px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[0.625rem] font-semibold uppercase tracking-[0.2em] text-emerald-400/90 min-[360px]:text-xs">
            Our story
          </p>
          <h2
            className="mt-1.5 text-[clamp(1.25rem,3.5vw+0.5rem,2rem)] font-bold leading-tight text-[var(--accent-color)] sm:mt-2 sm:text-3xl md:text-4xl lg:text-5xl"
          >
            About Shri Sawariya Mart
          </h2>
          <p className="mt-2.5 text-[0.8125rem] leading-relaxed text-white/90 min-[360px]:text-sm sm:mt-4 sm:text-base md:text-lg lg:text-xl">
            At Shri Sawariya Mart, we believe freshness is trust. Every morning,
            our team handpicks farm-fresh vegetables, seasonal fruits, and
            groceries to bring you the best quality at affordable prices. With a
            warm, family-oriented environment, we are more than just a store — we
            are your daily partner in health, happiness, and savings.
          </p>
          <Link
            href="/shop"
            className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-2xl px-5 py-2.5 text-sm font-semibold shadow-lg transition hover:scale-[1.02] active:scale-[0.98] sm:mt-6 sm:px-6 sm:py-3"
            style={{
              backgroundColor: "var(--primary-color)",
              color: "var(--background-color)",
            }}
          >
            Visit Us Today
          </Link>
        </div>

        <div className="relative mx-auto mt-6 w-full max-w-4xl min-w-0 sm:mt-8 md:mt-10">
          <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-black/40 shadow-[0_20px_50px_rgba(0,0,0,0.35)] ring-1 ring-white/5 sm:rounded-2xl md:rounded-3xl">
            <video
              className="absolute inset-0 h-full w-full object-cover"
              src="/video/1.mp4"
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />
          </div>
        </div>
      </div>
    </section>
  );
}
