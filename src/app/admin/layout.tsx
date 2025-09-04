// app/admin/layout.tsx
import type { Metadata } from "next";
import "../../app/globals.css";
import Sidebar from "../components/admin/Sidebar";
import Topbar from "../components/admin/topbar";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Admin Panel",
  description: "Admin dashboard layout",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token =  (await cookies()).get("token")?.value;

  if (!token) {
    redirect("/login"); // no token → login पर redirect
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      role: string;
    };

    if (decoded.role !== "admin") {
      redirect("/unauthorized");
    }
  } catch (err) {
    redirect("/login"); // invalid token
  }

  return (
    <div className="flex h-screen w-screen bg-gray-100">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
