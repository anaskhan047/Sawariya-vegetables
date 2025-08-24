"use client";
import React from "react";
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

export default function StatsCard({ title, value, icon }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-md p-5 flex flex-col gap-2 border border-[var(--border-color)]">
      <div className="flex items-center justify-between">
        <h3 className="text-[var(--text-light)] text-sm">{title}</h3>
        <div className="text-[var(--primary-color)]">{icons[icon]}</div>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <button className="text-[var(--primary-color)] text-sm font-medium hover:underline">
        View Details
      </button>
    </div>
  );
}
