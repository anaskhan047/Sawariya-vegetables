"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";

interface User {
  id?: string;
  _id?: string;
  name?: string;
  email?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<void>;
  setUserDirect: (user: User | null) => void;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  /* 🔹 Load token from localStorage on mount */
  useEffect(() => {
    const savedToken =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (savedToken) {
      console.log("🔑 Loaded token from storage:", savedToken);
      setToken(savedToken);
    }
    refresh();
  }, []);

  /* 🔹 Login */
  const login = useCallback(
    async (email: string, password: string) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data?.token) {
        //  Token save to localStorage
        localStorage.setItem("token", data.token);
        setToken(data.token);

        console.log(" Token saved in localStorage:", data.token);

        await refresh();
        router.push("/shop");
      } else {
        throw new Error(data?.error || "Login failed");
      }
    },
    [router]
  );

  /* 🔹 Logout */
  const logout = useCallback(async () => {
    try {
      const storedToken = localStorage.getItem("token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (storedToken) headers.Authorization = `Bearer ${storedToken}`;

      await fetch("/api/auth/logout", { method: "POST", headers });
    } catch (err) {
      console.warn("Logout request failed:", err);
    } finally {
      localStorage.removeItem("token");
      setToken(null);
      setUser(null);
      setIsLoggedIn(false);
      router.push("/login");
    }
  }, [router]);

  /* 🔹 Refresh user from token */
  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const storedToken =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

      if (!storedToken) {
        setUser(null);
        setIsLoggedIn(false);
        return;
      }

      setToken(storedToken);

      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${storedToken}` },
      });

      if (res.status === 401) {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
        setIsLoggedIn(false);
        return;
      }

      const data = await res.json();
      if (res.ok && data?.user) {
        setUser(data.user as User);
        setIsLoggedIn(true);
      } else {
        setUser(null);
        setIsLoggedIn(false);
      }
    } catch (err) {
      console.error("  Refresh error:", err);
      setUser(null);
      setIsLoggedIn(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setUserDirect = useCallback((u: User | null) => {
    setUser(u);
    setIsLoggedIn(!!u);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isLoggedIn,
        login,
        setUserDirect,
        logout,
        refresh,
        token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
