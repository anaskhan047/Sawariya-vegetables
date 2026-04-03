"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (sending || cooldown > 0) return;

    setSending(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send OTP");
        return;
      }

      setMessage("OTP sent. Redirecting to verification...");
      setCooldown(30);
      window.setTimeout(() => {
        router.push(`/auth/verify-forgot?email=${encodeURIComponent(email.trim())}`);
      }, 700);
    } catch (err) {
      console.error(err);
      setError("Server error");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden pt-20 md:pt-24">
      <Image src="/hero/hero.png" alt="Auth background" fill className="object-cover" priority />
      <div className="absolute inset-0 bg-slate-900/50" />

      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-xl items-center px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
          className="w-full rounded-2xl border border-white/30 bg-white/95 p-5 shadow-2xl backdrop-blur sm:p-7"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Password Recovery</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Forgot Password</h1>
          <p className="mt-1 text-sm text-slate-600">Enter your registered email and we will send OTP.</p>

          {message && <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</div>}
          {error && <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}

          <form onSubmit={handleSend} className="mt-5 space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">Email Address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                required
              />
            </div>

            <button
              type="submit"
              disabled={sending || cooldown > 0}
              className={`w-full rounded-xl py-2.5 text-sm font-semibold text-white transition ${(sending || cooldown > 0) ? "cursor-not-allowed bg-slate-400" : "bg-emerald-600 hover:bg-emerald-700"}`}
            >
              {sending ? "Sending OTP..." : cooldown > 0 ? `Resend in ${cooldown}s` : "Send OTP"}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
