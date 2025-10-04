// app/admin/layout.tsx
import type { Metadata } from "next";
import "../../app/globals.css";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Delivery Boy Panel",
  description: "Delivery boy dashboard layout",
};

export default async function DeliveryBoyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = (await cookies()).get("token")?.value;

  if (!token) {
    redirect("/login"); // no token → login पर redirect
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      role: string;
    };

    if (decoded.role !== "delivery") {
      redirect("/unauthorized");
    }
  } catch (err) {
    redirect("/login"); // invalid token
  }

  return (
      <div className="flex flex-col flex-1">
       
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
