"use client";

import { useAuth } from "@/app/context/AuthContext";
import { registerFcmTokenClient } from "@/app/lib/notifications/registerFcmTokenClient";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { motion } from "framer-motion";

type AuthResponse = {
  success?: boolean;
  message?: string;
  error?: string | string[];
  token?: string;
  redirectUrl?: string;
  user?: {
    id?: string;
    name?: string;
    email?: string;
    role?: string;
  };
};

export default function AuthPage() {
  const router = useRouter();
  const { setUserDirect, refresh } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const title = useMemo(() => (isLogin ? "Welcome Back" : "Create Account"), [isLogin]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isSubmitting) return;

    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      const url = isLogin ? "/api/auth/login" : "/api/auth/register";
      const payload = isLogin
        ? { email: email.trim(), password }
        : { name: name.trim(), email: email.trim(), password, role: "user" };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = (await res.json().catch(() => ({}))) as AuthResponse;

      if (!res.ok) {
        const msg = Array.isArray(data.error) ? data.error.join(", ") : data.error || "Something went wrong";
        setError(msg);
        return;
      }

      if (isLogin) {
        if (data.token) {
          localStorage.setItem("token", data.token);
          await registerFcmTokenClient(data.token);
        }
        if (data.user) setUserDirect(data.user);
        await refresh();
        router.push(data.redirectUrl || "/shop");
        return;
      }

      setMessage("OTP sent to your email. Verify to complete signup.");
      router.push(`/auth/verify-register?email=${encodeURIComponent(email.trim())}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Server error";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden pt-20 md:pt-24">
      <Image
        src="/hero/hero.png"
        alt="Fresh produce background"
        fill
        className="object-cover"
        priority
      />
      <div className="absolute inset-0 bg-slate-950/45" />
      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl items-center px-3 py-6 sm:px-5 md:min-h-[calc(100vh-6rem)]">
        <div className="grid w-full overflow-hidden rounded-3xl border border-white/30 bg-white/90 shadow-[0_30px_90px_rgba(15,23,42,0.45)] backdrop-blur md:grid-cols-2">
          <div className="relative hidden min-h-[620px] md:block">
            <Image src="/hero/hero.png" alt="Vegetable showcase" fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/75 via-emerald-700/45 to-sky-700/30" />
            <div className="absolute inset-x-0 bottom-0 p-8 text-white">
              <p className="mb-2 text-xs uppercase tracking-[0.28em] text-emerald-100">Shri Sawariya Mart</p>
              <h2 className="text-3xl font-bold leading-tight">Farm Fresh Quality, Every Single Day.</h2>
              <p className="mt-3 max-w-sm text-sm text-emerald-50/90">
                Fast delivery, verified quality, and smooth checkout experience for your daily essentials.
              </p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="p-5 sm:p-7 md:p-9"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Secure Access</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900 md:text-3xl">{title}</h1>
            <p className="mt-1 text-sm text-slate-600">
              {isLogin ? "Login to continue your shopping journey." : "Register and start ordering quickly."}
            </p>

            {message && (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {message}
              </div>
            )}
            {error && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {!isLogin && (
                <div>
                  <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700">
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              )}

              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 pr-12 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                {isLogin ? (
                  <Link href="/auth/forgot-password" className="text-sm font-medium text-emerald-700 hover:underline">
                    Forgot password?
                  </Link>
                ) : (
                  <span />
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full rounded-xl py-2.5 text-sm font-semibold text-white transition ${
                  isSubmitting ? "cursor-not-allowed bg-slate-400" : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {isSubmitting ? (isLogin ? "Logging in..." : "Creating account...") : isLogin ? "Login" : "Register"}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-slate-600">
              {isLogin ? "Don\'t have an account?" : "Already have an account?"}{" "}
              <button
                onClick={() => {
                  setIsLogin((prev) => !prev);
                  setError(null);
                  setMessage(null);
                  setPassword("");
                }}
                className="font-semibold text-emerald-700 hover:underline"
              >
                {isLogin ? "Sign up" : "Login"}
              </button>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
