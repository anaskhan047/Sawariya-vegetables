"use client";

import React, { useEffect, useState } from "react";

type Order = {
  _id: string;
  address: { name: string };
  total: number;
  status: "Delivered" | "Pending" | "Cancelled" | "In_Transit" | "Packed" | "Placed" | string;
  isCancelled?: boolean;
  isRefunded?: boolean;
  updatedAt: string;
};

export default function RecentOrdersTable() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/admin/orders", {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        const data = await res.json();
        const ordersData: Order[] = data.success ? data.orders || [] : [];

        // Filter out cancelled/refunded, sort by latest, take top 10
        const filtered = ordersData
          .filter((o) => !o.isCancelled && !o.isRefunded)
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, 10);

        setOrders(filtered);
      } catch (error) {
        console.error("Failed to fetch recent orders:", error);
      }
    };

    fetchOrders();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-md p-5 border border-[var(--border-color)] mt-6">
      <h3 className="text-lg font-semibold mb-3">Recent Orders</h3>
      <p className="text-sm text-[var(--text-light)] mb-4">
        A quick look at the latest transactions.
      </p>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-[var(--background-color)] border-b border-[var(--border-color)]">
            <tr>
              <th className="py-2 px-3">Order ID</th>
              <th className="py-2 px-3">Customer</th>
              <th className="py-2 px-3">Amount</th>
              <th className="py-2 px-3">Status</th>
              <th className="py-2 px-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id} className="border-b border-[var(--border-color)]">
                <td className="py-2 px-3">{order._id}</td>
                <td className="py-2 px-3">{order.address.name}</td>
                <td className="py-2 px-3">₹{order.total}</td>
                <td className="py-2 px-3">
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${order.status === "delivered"
                    ? "bg-green-100 text-green-700"
                    : order.status === "packed"
                      ? "bg-yellow-100 text-yellow-700"
                      : order.status === "placed"
                        ? "bg-gray-100 text-gray-700"
                        : order.status === "in_transit"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-red-100 text-red-700"
                    }`}
                  >
                    {order.status}
                  </span>
                </td>
                    <td className="py-2 px-3">{new Date(order.updatedAt).toLocaleDateString("en-GB") // DD/MM/YYYY
}</td>

                </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="space-y-4 md:hidden">
        {orders.map((order) => (
          <div
            key={order._id}
            className="border border-[var(--border-color)] rounded-lg p-4 shadow-sm"
          >
            <p className="text-sm text-[var(--text-light)]">{order._id}</p>
            <h4 className="font-semibold">{order.address.name}</h4>
            <p className="text-sm">₹{order.total}</p>
            <p className="text-sm">{new Date(order.updatedAt).toLocaleDateString("en-GB")}</p>
            <span
             className={`rounded-full px-2 py-1 text-xs ${order.status === "delivered"
                    ? "bg-green-100 text-green-700"
                    : order.status === "packed"
                      ? "bg-yellow-100 text-yellow-700"
                      : order.status === "placed"
                        ? "bg-gray-100 text-gray-700"
                        : order.status === "in_transit"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-red-100 text-red-700"
                    }`}
            >
              {order.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
