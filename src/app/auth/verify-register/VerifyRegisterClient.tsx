"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { motion } from "framer-motion";

export default function VerifyRegisterClient() {
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Verification failed");
      } else {
        setMessage("Verification successful. Redirecting to login...");
        window.setTimeout(() => router.push("/login"), 900);
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden pt-20 md:pt-24">
      <Image src="/hero/hero.png" alt="Register verification background" fill className="object-cover" priority />
      <div className="absolute inset-0 bg-slate-900/55" />

      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-xl items-center px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
          className="w-full rounded-2xl border border-white/30 bg-white/95 p-5 shadow-2xl backdrop-blur sm:p-7"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Email Verification</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900">Verify Registration OTP</h2>
          <p className="mt-1 text-sm text-slate-600">Enter OTP sent to <strong>{email}</strong></p>

          {message && <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</div>}
          {error && <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}

          <form onSubmit={handleVerify} className="mt-5 space-y-4">
            <div>
              <label htmlFor="otp" className="mb-1 block text-sm font-medium text-slate-700">OTP</label>
              <input
                id="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter verification OTP"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                required
              />
            </div>

            <button
              disabled={loading}
              className={`w-full rounded-xl py-2.5 text-sm font-semibold text-white transition ${loading ? "cursor-not-allowed bg-slate-400" : "bg-emerald-600 hover:bg-emerald-700"}`}
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
