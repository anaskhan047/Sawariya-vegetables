// app/admin/layout.tsx
import type { Metadata } from "next";
import "../../app/globals.css";
import Sidebar from "../components/admin/Sidebar";
import Topbar from "../components/admin/topbar";

export const metadata: Metadata = {
  title: "Admin Panel",
  description: "Admin dashboard layout",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Section */}
      <div className="flex flex-col flex-1">
        {/* Topbar */}
        <Topbar />

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
