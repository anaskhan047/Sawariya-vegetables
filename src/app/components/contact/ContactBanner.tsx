"use client";

import Image from "next/image";
import React from "react";

export default function ContactBanner() {
  return (
    <section className="relative mx-auto mt-3 w-full max-w-7xl overflow-hidden rounded-3xl border border-emerald-100">
      <div className="relative h-[260px] sm:h-[340px] md:h-[420px]">
        <Image
          src="/contact/contact-banner.png"
          alt="Contact Shri Sawariya Mart"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/75 via-slate-900/45 to-emerald-600/35" />

        <div className="absolute inset-0 flex items-center px-4 py-6 sm:px-8 md:px-12">
          <div className="max-w-2xl text-white">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-100 sm:text-xs">
              Contact Support
            </p>
            <h1 className="mt-2 text-2xl font-extrabold leading-tight sm:text-3xl md:text-5xl" style={{ fontFamily: '"Poppins", "Segoe UI", sans-serif' }}>
              Let&apos;s Talk,
              <span className="block text-emerald-200">We Are Here To Help</span>
            </h1>
            <p className="mt-3 max-w-xl text-xs text-white/90 sm:text-sm md:text-base">
              Have questions about delivery, quality, or your order? Reach us instantly and our team will guide you quickly.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
