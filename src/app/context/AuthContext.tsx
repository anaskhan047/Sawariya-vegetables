'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// 👇 Define your User type here (customize fields as per your backend response)
interface User {
  id: string;
  name: string;
  email: string;
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
  token: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
  const savedToken = localStorage.getItem("token");
  console.log("Loaded token:", savedToken);  // ✅ check karo
  if (savedToken) setToken(savedToken);
  refresh();
}, []);
  const login = async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok && data.token) {
      setToken(data.token);               // ✅ context me save
      localStorage.setItem("token", data.token); // persist bhi
      await refresh();
    } else {
      throw new Error(data.error || "Login failed");
    }
    console.log("Saved token in context:", data.token);
  };

  const setUserDirect = (user: User | null) => {
    setUser(user);
    setIsLoggedIn(!!user);
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setIsLoggedIn(false);
    setToken(null);
    localStorage.removeItem("token");  // ✅ clear
  };

  const refresh = async () => {

    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();

      if (data.loggedIn) {
        setUser(data.user as User);
        setIsLoggedIn(true);
      } else {
        setUser(null);
        setIsLoggedIn(false);
      }
    } catch (err) {
      setUser(null);
      setIsLoggedIn(false);
    } finally {
      setIsLoading(false);
    }
  };

  // 👇 Run refresh on mount
  useEffect(() => {
    refresh();
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isLoggedIn, login, setUserDirect, logout, refresh, token }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
