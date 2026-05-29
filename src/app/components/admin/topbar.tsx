"use client";
import { Settings, LogOut } from "lucide-react";
import "../../../app/globals.css"; // Ensure global styles are imported
import { useRouter } from "next/navigation";

export default function Topbar() {
  const router = useRouter();

  async function handleLogout() {
  try {
    await fetch("/api/auth/logout", { method: "POST" });

    // Clear localStorage token on the client
    localStorage.removeItem("token");

    router.push("/login");
  } catch (err) {
    console.error("Logout failed:", err);
  }
}

  return (
    <header className="w-full bg-[var(--secondary-color)] flex items-center justify-end px-6 py-3 shadow-sm">
      <div className="flex items-center gap-4 text-white">
        {/* Settings Icon */}
        <button
          aria-label="Settings"
          className="hover:text-gray-200 transition"
        >
          <Settings size={20} />
        </button>

        {/* Logout Button */}
        <button
          onClick={handleLogout} //  moved here
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded flex items-center gap-2 transition"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </header>
  );
}
