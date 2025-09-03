"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function VerifyForgotForm({ email }: { email: string }) {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Verification failed");
      } else {
        router.push("/auth/reset-password"); // 👈 after forgot verify, go reset password
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white border p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Verify Forgot OTP</h2>
        <p className="text-sm text-gray-600 mb-3">
          Enter the OTP sent to <strong>{email}</strong>
        </p>
        {error && <div className="mb-3 text-red-600">{error}</div>}
        <form onSubmit={handleVerify} className="space-y-3">
          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="OTP"
            className="w-full px-3 py-2 border rounded"
            required
          />
          <button
            disabled={loading}
            className="w-full py-2 bg-blue-600 text-white rounded"
          >
            {loading ? "Verifying..." : "Verify"}
          </button>
        </form>
      </div>
    </div>
  );
}
