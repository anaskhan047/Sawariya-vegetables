"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Auth() {
    const [isLogin, setIsLogin] = useState(true);

    // Controlled inputs state
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("user");
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setMessage(null);
        setLoading(true);

        try {
            const apiUrl = isLogin ? "/api/auth/login" : "/api/auth/register";
            const body = isLogin ? { email, password } : { name, email, password, role };

            const res = await fetch(apiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Something went wrong");
            } else {
                setMessage(data.message || (isLogin ? "Logged in successfully" : "Registered successfully"));

                // Save token to localStorage or cookie (basic example localStorage)
                localStorage.setItem("token", data.token);
                localStorage.setItem("role", data.user.role);

                // Redirect based on role
                if (isLogin) {
                    if (data.user.role === "admin") {
                        router.push("/admin");
                    } else if (data.user.role === "delivery") {
                        router.push("/deliveryBoy"); // aapka delivery boy ka page
                    } else {
                        router.push("/shop");
                    }
                } else {
                    // After registration, redirect to login or dashboard
                    router.push("/login");
                }
            }
        } catch (err: any) {
            setError(err.message || "Network error");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--background-color)] px-4">
            <div className="w-full max-w-md bg-[var(--background-color)] border border-[var(--border-color)] shadow-lg rounded-lg p-6 sm:p-8">
                {/* Title */}
                <h2 className="text-2xl font-bold text-center text-[var(--text-color)] mb-2">
                    {isLogin ? "Login" : "Register"}
                </h2>
                <p className="text-center text-sm text-[var(--text-light)] mb-6">
                    {isLogin
                        ? "Access your dashboard to manage orders and products."
                        : "Create an account to start ordering and managing deliveries."}
                </p>

                {/* Message / Error */}
                {message && (
                    <div className="mb-4 text-green-600 border border-green-300 rounded p-2 text-center">
                        {message}
                    </div>
                )}
                {error && (
                    <div className="mb-4 text-red-600 border border-red-300 rounded p-2 text-center">
                        {error}
                    </div>
                )}

                {/* Form */}
                <form className="space-y-4" onSubmit={handleSubmit}>
                    {!isLogin && (
                        <input
                            type="text"
                            placeholder="Full Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-2 border border-[var(--border-color)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                            required={!isLogin}
                        />
                    )}

                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2 border border-[var(--border-color)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                        required
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-[var(--border-color)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                        required
                    />

                    {!isLogin && (
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full px-4 py-2 border border-[var(--border-color)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                        >
                            <option value="user">User</option>
                            <option value="delivery">Delivery Boy</option>
                            <option value="admin">Admin</option>
                        </select>
                    )}

                    {isLogin && (
                        <div className="flex justify-end">
                            <a
                                href="#"
                                className="text-sm text-[var(--primary-color)] hover:underline"
                            >
                                Forgot Password?
                            </a>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-2 rounded-md text-white ${loading
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-[var(--primary-color)] hover:bg-[var(--secondary-color)] transition"
                            }`}
                    >
                        {loading ? (isLogin ? "Logging in..." : "Registering...") : (isLogin ? "Login" : "Register")}
                    </button>
                </form>

                {/* Toggle */}
                <p className="text-center text-sm text-[var(--text-light)] mt-4">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                    <button
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setMessage(null);
                            setError(null);
                            setName("");
                            setEmail("");
                            setPassword("");
                            setRole("user");
                        }}
                        className="text-[var(--primary-color)] font-medium hover:underline"
                    >
                        {isLogin ? "Register" : "Login"}
                    </button>
                </p>
            </div>
        </div>
    );
}
