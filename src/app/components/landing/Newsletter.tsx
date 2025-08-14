"use client";
import React, { useState } from "react";

export default function Newsletter() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    console.log("Subscribed with:", email);
    setEmail("");
  };

  return (
    <div className="flex">
        
    <div className="max-w-4xl mx-auto p-8 bg-[#f8fdf8] rounded-lg text-center">
      <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-color)] mb-2">
        Stay Updated with Fresh Deals!
      </h2>
      <p className="text-[var(--text-light)] mb-6">
        Subscribe to our newsletter and get the latest updates on fresh arrivals,
        exclusive offers, and healthy recipes.
      </p>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row justify-center items-center gap-3"
      >
        <input
          type="email"
          placeholder="Enter your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full sm:w-auto flex-1 border border-[var(--border-color)] rounded-lg px-4 py-2 outline-none focus:border-[var(--primary-color)]"
        />
        <button
          type="submit"
          className="bg-[var(--primary-color)] hover:bg-[var(--secondary-color)] text-white px-6 py-2 rounded-lg transition-colors"
        >
          Subscribe
        </button>
      </form>
    </div>
    </div>
  );
}
