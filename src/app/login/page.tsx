"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [forgotOpen, setForgotOpen] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [otp, setOtp] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const { setUserDirect } = useAuth();

  // LOGIN / REGISTER
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const apiUrl = isLogin ? "/api/auth/login" : "/api/auth/register";
      const body = isLogin
        ? { email, password }
        : { name, email, password, role };

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      
      const data = await res.json();
      console.log(data.token)
      localStorage.setItem("token", data.token);

      if (!res.ok) {
        setError(data.error || "Something went wrong");
      } else {
        setMessage(data.message || "Success");
        if (isLogin) {
          setUserDirect(data.user);
          router.push(data.redirectUrl || "/");
        } else {
          router.push(`/auth/verify-register?email=${encodeURIComponent(email)}`);
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("Unknown error");
    } finally {
      setLoading(false);
    }
  }

  // SEND OTP
  async function handleSendOtp() {
    if (!email) return setError("Enter email first");
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setOtpSent(true);
        setMessage("OTP sent to your email");
      } else {
        setError(data.error);
      }
    } catch {
      setError("Server error");
    } finally {
      setLoading(false);
    }
  }

  // RESET PASSWORD
  async function handleResetPassword() {
    if (!otp || !newPass || !confirmPass) {
      return setError("All fields are required");
    }
    if (newPass !== confirmPass) {
      return setError("Passwords do not match");
    }
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/auth/forgot-password/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword: newPass }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage("Password reset successfully");
        setForgotOpen(false);
        setOtpSent(false);
        setOtp("");
        setNewPass("");
        setConfirmPass("");
      } else {
        setError(data.error);
      }
    } catch {
      setError("Server error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
      async function fetchUser() {
        try {
          const res = await fetch("/api/auth/me");
          const data = await res.json();
          if (data.loggedIn) {
            setImage(data.user.image || null);
          }
        } catch (err) {
          console.error("Error fetching user:", err);
        } finally {
          setLoading(false);
        }
      }
      fetchUser();
    }, []);
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background-color)] px-4">
      <div className="w-full max-w-md bg-[var(--background-color)] border border-[var(--border-color)] shadow-lg rounded-lg p-6 sm:p-8">
        <h2 className="text-2xl font-bold text-center text-[var(--text-color)] mb-2">
          {isLogin ? "Login" : "Register"}
        </h2>

        {message && <div className="mb-4 text-green-600 border border-green-300 rounded p-2 text-center">{message}</div>}
        {error && <div className="mb-4 text-red-600 border border-red-300 rounded p-2 text-center">{error}</div>}

        {!forgotOpen ? (
          <form className="space-y-4" onSubmit={handleSubmit}>
            {!isLogin && <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2 border border-[var(--border-color)] rounded-md" required />}
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 border border-[var(--border-color)] rounded-md" required />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 border border-[var(--border-color)] rounded-md" required />
            {!isLogin && (
              <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full px-4 py-2 border border-[var(--border-color)] rounded-md">
                <option value="user">User</option>
                <option value="delivery">Delivery Boy</option>
                <option value="admin">Admin</option>
              </select>
            )}
            {isLogin && (
              <div className="flex justify-end">
                <button type="button" className="text-sm text-[var(--primary-color)] hover:underline" onClick={() => setForgotOpen(true)}>Forgot Password?</button>
              </div>
            )}
            <button type="submit" disabled={loading} className="w-full py-2 rounded-md text-white bg-[var(--primary-color)] hover:bg-[var(--secondary-color)]">
              {loading ? (isLogin ? "Logging in..." : "Registering...") : isLogin ? "Login" : "Register"}
            </button>
          </form>
        ) : (
          // 🔑 Forgot Password Form
<div className="space-y-4">
  {!otpSent ? (
    <>
      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full px-4 py-2 border border-[var(--border-color)] rounded-md"
      />
      <button
        onClick={handleSendOtp}
        className="w-full py-2 rounded-md text-white bg-[var(--primary-color)] hover:bg-[var(--secondary-color)]"
      >
        Send OTP
      </button>
    </>
  ) : (
    <>
      <input
        type="text"
        placeholder="Enter OTP"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        className="w-full px-4 py-2 border border-[var(--border-color)] rounded-md"
      />
      <input
        type="password"
        placeholder="New Password"
        value={newPass}
        onChange={(e) => setNewPass(e.target.value)}
        className="w-full px-4 py-2 border border-[var(--border-color)] rounded-md"
      />
      <input
        type="password"
        placeholder="Confirm Password"
        value={confirmPass}
        onChange={(e) => setConfirmPass(e.target.value)}
        className="w-full px-4 py-2 border border-[var(--border-color)] rounded-md"
      />
      <button
        onClick={handleResetPassword}
        className="w-full py-2 rounded-md text-white bg-green-600 hover:bg-green-700"
      >
        Reset Password
      </button>
    </>
  )}
  <button
    onClick={() => { setForgotOpen(false); setOtpSent(false); }}
    className="w-full py-2 rounded-md text-white bg-gray-500 hover:bg-gray-600"
  >
    Cancel
  </button>
</div>

        )}

        <p className="text-center text-sm text-[var(--text-light)] mt-4">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button onClick={() => { setIsLogin(!isLogin); setMessage(null); setError(null); setName(""); setEmail(""); setPassword(""); setRole("user"); }} className="text-[var(--primary-color)] font-medium hover:underline">
            {isLogin ? "Register" : "Login"}
          </button>
        </p>
      </div>
    </div>
  );
}
