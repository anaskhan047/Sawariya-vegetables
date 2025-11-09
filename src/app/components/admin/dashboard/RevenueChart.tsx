"use client";

import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type RevenueData = {
  month: string;
  revenue: number;
};
type Order = {
  createdAt: string;
  date?: string;
  status: string;
  total?: number;
  amount?: number;
};


export default function RevenueChart() {
  const [data, setData] = useState<RevenueData[]>([]);

  useEffect(() => {
    const fetchRevenue = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/admin/orders", {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        const resJson = await res.json();
        const orders = Array.isArray(resJson)
          ? resJson
          : resJson.orders || [];

        // console.log("Fetched Orders:", orders); 

        const currentYear = new Date().getFullYear();

        // Initialize months
        const months: RevenueData[] = Array.from({ length: 12 }, (_, i) => ({
          month: new Date(0, i).toLocaleString("default", { month: "short" }),
          revenue: 0,
        }));

        orders.forEach((order: Order) => {
  const orderDate = new Date(order.createdAt || order.date!);
  if (
    !orderDate ||
    orderDate.getFullYear() !== currentYear ||
    !order.status ||
    ["cancelled", "refunded"].includes(order.status.toLowerCase())
  ) return;

  // Only delivered orders count
  if (order.status.toLowerCase() === "delivered") {
    const monthIndex = orderDate.getMonth();
    months[monthIndex].revenue += Number(order.total ?? order.amount ?? 0);
  }
});


        setData(months);
      } catch (error) {
        console.error("Failed to fetch revenue:", error);
      }
    };

    fetchRevenue();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-md p-5 border border-[var(--border-color)]">
      <h3 className="text-lg font-semibold mb-3">Revenue Performance</h3>
      <p className="text-sm text-[var(--text-light)] mb-4">
        Yearly revenue per month (Current Year)
      </p>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="month" stroke="#6B7280" />
          <YAxis stroke="#6B7280" />
          <Tooltip formatter={(value: number) => `₹${value.toFixed(2)}`} />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="var(--primary-color)"
            strokeWidth={3}
            dot={{ fill: "var(--primary-color)" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
