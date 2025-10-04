"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Users, MessageSquare, ClipboardList } from "lucide-react";

type Props = {
  title: string;
  value: string | number;
  icon: "orders" | "users" | "subscriptions" | "pending";
};

const icons = {
  orders: <ShoppingCart className="w-6 h-6" />,
  users: <Users className="w-6 h-6" />,
  subscriptions: <MessageSquare className="w-6 h-6" />,
  pending: <ClipboardList className="w-6 h-6" />,
};

// Map icon/type to route
const routeMap: { [key in Props["icon"]]: string } = {
  orders: "/admin/orders",
  users: "/admin/users",
  subscriptions: "/admin/subscriptions",
  pending: "/admin/orders", // pending orders also go to orders page
};

export default function StatsCard({ title, value, icon }: Props) {
  const router = useRouter();

  const handleClick = () => {
    const route = routeMap[icon];
    router.push(route);
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-5 flex flex-col gap-2 border border-[var(--border-color)]">
      <div className="flex items-center justify-between">
        <h3 className="text-[var(--text-light)] text-sm">{title}</h3>
        <div className="text-[var(--primary-color)]">{icons[icon]}</div>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <button
        onClick={handleClick}
        className="text-[var(--primary-color)] text-sm font-medium hover:underline"
      >
        View Details
      </button>
    </div>
  );
}
