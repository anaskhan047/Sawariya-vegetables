"use client";

import React, { useState } from "react";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!email.trim()) {
      setMessage("Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setMessage("🎉 Subscribed successfully!");
        setEmail("");
      } else {
        setMessage(data.message || "⚠️ Subscription failed. Try again.");
      }
    } catch (err) {
      console.error("Subscription error:", err);
      setMessage("  Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
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
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading}
            className={`${
              loading ? "opacity-70 cursor-not-allowed" : ""
            } bg-[var(--primary-color)] hover:bg-[var(--secondary-color)] text-white px-6 py-2 rounded-lg transition-colors`}
          >
            {loading ? "Subscribing..." : "Subscribe"}
          </button>
        </form>

        {message && (
          <p
            className={`mt-4 text-sm ${
              message.startsWith("🎉")
                ? "text-green-600"
                : message.startsWith("⚠️") || message.startsWith(" ")
                ? "text-red-600"
                : "text-yellow-600"
            }`}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
