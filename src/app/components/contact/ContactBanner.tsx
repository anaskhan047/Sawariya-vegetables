"use client";

import React from "react";

export default function ContactBanner() {
  return (
    <section className="contact-banner relative flex items-center justify-center h-[300px] md:h-[650px] text-center">
      <div className="relative z-10 px-4">
        <h1 className="text-3xl md:text-5xl font-bold text-white drop-shadow-md">
          Get in Touch with{" "}
          <span className="text-[var(--accent-color)]">Sawariya Vegetable</span>
        </h1>
        <p className="mt-4 text-lg md:text-xl max-w-3xl mx-auto drop-shadow text-[var(--background-color)]">
          Have questions or need assistance? Our team is here to help! Reach out to us
          through our contact form or find our location on the map.
        </p>
      </div>
    </section>
  );
}
