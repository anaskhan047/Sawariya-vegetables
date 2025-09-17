// src/hooks/useAuth.ts
"use client";
import { useState, useEffect } from "react";

export function useAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // 👇 yahan aap apna login token / next-auth session check kar sakte ho
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);
  return { isLoggedIn };
}
