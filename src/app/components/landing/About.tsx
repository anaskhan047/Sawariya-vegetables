// components/AboutUs.tsx
"use client";

import React from "react";

export default function AboutUs() {
  return (
    <section id="about" className="relative w-full h-screen flex items-center justify-center text-center overflow-hidden">
      {/* Background Video */}
      <video
        className="absolute inset-0 w-full h-full object-cover"
        src="/video/1.mp4" // 🔹 Place your video file in public/videos/
        autoPlay
        loop
        muted
        playsInline
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Content */}
      <div className="relative z-10 max-w-3xl px-6">
        <h2
          className="text-4xl md:text-5xl font-bold mb-4"
          style={{ color: "var(--accent-color)" }}
        >
          About Shri Sawariya Mart
        </h2>
        <p
          className="text-lg md:text-xl leading-relaxed mb-6"
          style={{ color: "var(--background-color)" }}
        >
          At Shri Sawariya Mart, we believe freshness is trust. Every morning,
          our team handpicks farm-fresh vegetables, seasonal fruits, and
          groceries to bring you the best quality at affordable prices. With a
          warm, family-oriented environment, we are more than just a store — we
          are your daily partner in health, happiness, and savings.
        </p>
        <button
        onClick={() => {
          window.location.href = "/shop"; // Navigate to the About page
        }}
          className="px-6 py-3 rounded-2xl font-semibold shadow-lg transition transform hover:scale-105"
          style={{
            backgroundColor: "var(--primary-color)",
            color: "var(--background-color)",
          }}
        >
          Visit Us Today
        </button>
      </div>
    </section>
  );
};

