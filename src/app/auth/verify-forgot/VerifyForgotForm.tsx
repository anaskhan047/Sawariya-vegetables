"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function VerifyForgotForm({ email }: { email: string }) {
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  async function handleResendOtp() {
    if (resending || cooldown > 0) return;
    setResending(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to resend OTP");
        return;
      }
      setMessage("New OTP sent to your email.");
      setCooldown(30);
    } catch {
      setError("Network error");
    } finally {
      setResending(false);
    }
  }

  async function handleResetPassword(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setMessage(null);

    if (!otp || !newPassword || !confirmPassword) {
      setError("Please fill all fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirm password must match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Password reset failed");
        return;
      }

      setMessage("Password reset successful. Redirecting to login...");
      window.setTimeout(() => router.push("/login"), 900);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden pt-20 md:pt-24">
      <Image src="/hero/hero.png" alt="Auth background" fill className="object-cover" priority />
      <div className="absolute inset-0 bg-slate-950/55" />

      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-xl items-center px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
          className="w-full rounded-2xl border border-white/30 bg-white/95 p-5 shadow-2xl backdrop-blur sm:p-7"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Reset Password</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900">Verify OTP & Set New Password</h2>
          <p className="mt-1 text-sm text-slate-600">OTP was sent to <strong>{email}</strong></p>

          {message && <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</div>}
          {error && <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}

          <form onSubmit={handleResetPassword} className="mt-5 space-y-4">
            <div>
              <label htmlFor="otp" className="mb-1 block text-sm font-medium text-slate-700">OTP</label>
              <input
                id="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6 digit OTP"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                required
              />
            </div>

            <div>
              <label htmlFor="newPassword" className="mb-1 block text-sm font-medium text-slate-700">New Password</label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                required
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-slate-700">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full rounded-xl py-2.5 text-sm font-semibold text-white transition ${loading ? "cursor-not-allowed bg-slate-400" : "bg-emerald-600 hover:bg-emerald-700"}`}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>

            <button
              type="button"
              disabled={resending || cooldown > 0}
              onClick={handleResendOtp}
              className={`w-full rounded-xl py-2.5 text-sm font-semibold transition ${(resending || cooldown > 0) ? "cursor-not-allowed bg-slate-200 text-slate-500" : "bg-slate-900 text-white hover:bg-slate-800"}`}
            >
              {resending ? "Sending..." : cooldown > 0 ? `Resend OTP in ${cooldown}s` : "Resend OTP"}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
