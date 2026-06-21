"use client";

import { useAuth } from "@/app/context/AuthContext";
import { getFirebaseClientApp } from "@/app/lib/firebase/client";
import { registerFcmTokenClient } from "@/app/lib/notifications/registerFcmTokenClient";
import { FirebaseError } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FcGoogle } from "react-icons/fc";

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
    image?: string;
  };
};

type SuccessModalState = {
  title: string;
  message: string;
};

export default function AuthPage() {
  const router = useRouter();
  const { setUserDirect, refresh } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successModal, setSuccessModal] = useState<SuccessModalState | null>(null);

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
          void registerFcmTokenClient(data.token);
        }
        if (data.user) setUserDirect(data.user);
        router.push(data.redirectUrl || "/shop");
        void refresh();
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

  function getGoogleErrorMessage(err: unknown) {
    if (err instanceof FirebaseError) {
      if (err.code === "auth/popup-closed-by-user" || err.code === "auth/cancelled-popup-request") {
        return "Google sign-in was cancelled.";
      }
      if (err.code === "auth/network-request-failed") {
        return "Network error. Please check your connection and try again.";
      }
      if (err.code === "auth/popup-blocked") {
        return "The Google sign-in popup was blocked. Please allow popups and try again.";
      }
      return err.message || "Google authentication failed.";
    }

    return err instanceof Error ? err.message : "Google authentication failed.";
  }

  async function handleGoogleAuth() {
    if (isSubmitting || isGoogleSubmitting) return;

    setError(null);
    setMessage(null);
    setIsGoogleSubmitting(true);

    try {
      const app = getFirebaseClientApp();
      if (!app) {
        throw new Error("Google authentication is not configured.");
      }

      const auth = getAuth(app);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });

      const credential = await signInWithPopup(auth, provider);
      const idToken = await credential.user.getIdToken();

      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ idToken }),
      });

      const data = (await res.json().catch(() => ({}))) as AuthResponse;

      if (!res.ok) {
        const msg = Array.isArray(data.error) ? data.error.join(", ") : data.error || "Google authentication failed";
        setError(msg);
        return;
      }

      if (!data.token) {
        setError("Google authentication completed, but the session token was not returned.");
        return;
      }

      localStorage.setItem("token", data.token);
      void registerFcmTokenClient(data.token);
      if (data.user) setUserDirect(data.user);
      void refresh();

      const isNewGoogleAccount = data.message?.toLowerCase().includes("created");
      setSuccessModal({
        title: isNewGoogleAccount ? "Account Created Successfully" : "Login Successful",
        message: isNewGoogleAccount
          ? "Your Google account has been created. Redirecting you to the shop..."
          : "You are logged in with Google. Redirecting you to the shop...",
      });

      window.setTimeout(() => {
        router.push(data.redirectUrl || "/shop");
      }, 1400);
    } catch (err) {
      setError(getGoogleErrorMessage(err));
    } finally {
      setIsGoogleSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden pt-20 md:pt-24">
      <Image
        src="/hero/hero.png"
        alt="Fresh produce background"
        fill
        className="pointer-events-none object-cover"
        priority
      />
      <div className="pointer-events-none absolute inset-0 bg-slate-950/45" />
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
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
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
                disabled={isSubmitting || isGoogleSubmitting}
                className={`w-full rounded-xl py-2.5 text-sm font-semibold text-white transition ${
                  isSubmitting || isGoogleSubmitting ? "cursor-not-allowed bg-slate-400" : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {isSubmitting ? (isLogin ? "Logging in..." : "Creating account...") : isLogin ? "Login" : "Register"}
              </button>
            </form>

            <div className="mt-6">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                  Or continue with
                </span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={isSubmitting || isGoogleSubmitting}
                className={`mt-4 flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition ${
                  isSubmitting || isGoogleSubmitting
                    ? "cursor-not-allowed opacity-70"
                    : "hover:border-emerald-300 hover:bg-emerald-50/50 hover:text-slate-900"
                }`}
              >
                <FcGoogle className="h-5 w-5 shrink-0" />
                <span>{isGoogleSubmitting ? "Connecting to Google..." : "Continue with Google"}</span>
              </button>

              <p className="mt-2 text-center text-xs text-slate-500">
                {isLogin
                  ? "Existing accounts are matched by email and signed in securely."
                  : "New Google users are created automatically without duplicate records."}
              </p>
            </div>

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

      {successModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.22 }}
            className="w-full max-w-sm rounded-2xl border border-emerald-100 bg-white p-6 text-center shadow-2xl"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="h-8 w-8 text-emerald-600"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <h2 className="mt-4 text-xl font-bold text-slate-900">{successModal.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{successModal.message}</p>
            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-emerald-100">
              <div className="h-full w-full origin-left animate-pulse rounded-full bg-emerald-500" />
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
