// app/auth/verify-forgot/page.tsx
"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function VerifyForgotPage() {
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Reset failed");
      } else {
        // success — redirect to login
        router.push("/auth");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white border p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Reset password</h2>
        <p className="text-sm text-gray-600 mb-3">Enter the OTP sent to <strong>{email}</strong></p>
        {error && <div className="mb-3 text-red-600">{error}</div>}
        <form onSubmit={handleReset} className="space-y-3">
          <input value={otp} onChange={(e)=>setOtp(e.target.value)} placeholder="OTP" className="w-full px-3 py-2 border rounded" />
          <input value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} type="password" placeholder="New password" className="w-full px-3 py-2 border rounded" />
          <button disabled={loading} className="w-full py-2 bg-blue-600 text-white rounded">{loading ? "Resetting..." : "Reset Password"}</button>
        </form>
      </div>
    </div>
  );
}
