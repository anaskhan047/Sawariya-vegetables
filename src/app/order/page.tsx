"use client";

import React from "react";

interface Order {
  id: string;
  date: string;
  status: "Pending" | "Processing" | "Delivered" | "Cancelled";
  total: number;
  items: number;
}

const orders: Order[] = [
  { id: "ORD123456", date: "30 Aug 2025", status: "Delivered", total: 190, items: 3 },
  { id: "ORD123457", date: "25 Aug 2025", status: "Processing", total: 250, items: 4 },
  { id: "ORD123458", date: "20 Aug 2025", status: "Pending", total: 120, items: 2 },
  { id: "ORD123459", date: "15 Aug 2025", status: "Cancelled", total: 80, items: 1 },
];

export default function UserOrderList() {
  const userName = "Rahul Sharma";

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "Delivered":
        return "bg-green-100 text-green-700 border-green-300";
      case "Processing":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "Pending":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "Cancelled":
        return "bg-red-100 text-red-700 border-red-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background-color)] p-6 flex justify-center">
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-lg border border-[var(--border-color)] p-6">
        
        {/* Header */}
        <div className="border-b pb-4 mb-6">
          <h1 className="text-2xl font-bold text-[var(--primary-color)]">
            {userName} - Recent Orders
          </h1>
          <p className="text-[var(--text-light)] mt-1">
            Here is a list of all recent orders placed by the user.
          </p>
        </div>

        {/* TABLE for large screens */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full border border-[var(--border-color)] rounded-xl overflow-hidden">
            <thead className="bg-[var(--primary-color)] text-white">
              <tr>
                <th className="text-left py-3 px-4">Order ID</th>
                <th className="text-left py-3 px-4">Date</th>
                <th className="text-left py-3 px-4">Items</th>
                <th className="text-left py-3 px-4">Total (₹)</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-[var(--border-color)] hover:bg-gray-50 transition-colors"
                >
                  <td className="py-3 px-4 font-medium text-[var(--text-color)]">{order.id}</td>
                  <td className="py-3 px-4 text-[var(--text-light)]">{order.date}</td>
                  <td className="py-3 px-4 text-[var(--text-light)]">{order.items}</td>
                  <td className="py-3 px-4 text-[var(--primary-color)] font-semibold">₹{order.total}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button className="text-sm px-4 py-1 rounded-lg bg-[var(--accent-color)] text-black hover:scale-105 transition">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* CARD/GRID for small screens */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
          {orders.map((order) => (
            <div
              key={order.id}
              className="border border-[var(--border-color)] rounded-xl p-4 shadow-sm hover:shadow-md hover:scale-[1.01] transition bg-white"
            >
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-semibold text-[var(--text-color)]">{order.id}</h2>
                <span
                  className={`px-2 py-1 rounded-full border text-xs font-medium ${getStatusColor(
                    order.status
                  )}`}
                >
                  {order.status}
                </span>
              </div>
              <p className="text-sm text-[var(--text-light)]">📅 {order.date}</p>
              <p className="text-sm text-[var(--text-light)]">🛒 Items: {order.items}</p>
              <p className="text-base font-semibold text-[var(--primary-color)] mt-2">
                ₹{order.total}
              </p>
              <button className="mt-3 w-full py-2 rounded-lg bg-[var(--accent-color)] text-black font-medium hover:scale-105 transition">
                View Details
              </button>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
