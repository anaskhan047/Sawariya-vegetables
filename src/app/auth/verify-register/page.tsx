// src/app/auth/verify-register/page.tsx
"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function VerifyRegisterPage() {
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
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
        // success — server sets cookie and returns redirectUrl
        router.push(data.redirectUrl || "/shop");
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
        <h2 className="text-xl font-semibold mb-4">Verify account</h2>
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
            className="w-full py-2 bg-[var(--primary-color)] text-white rounded"
          >
            {loading ? "Verifying..." : "Verify"}
          </button>
        </form>
      </div>
    </div>
  );
}
