"use client";
import React from "react";

type Order = {
  id: string;
  customer: string;
  amount: string;
  status: "Completed" | "Pending";
  date: string;
};

const orders: Order[] = [
  { id: "#SAW001", customer: "Priya Sharma", amount: "150.75", status: "Completed", date: "2024-08-01" },
  { id: "#SAW002", customer: "Rajesh Kumar", amount: "85.20", status: "Pending", date: "2024-08-01" },
  { id: "#SAW003", customer: "Anjali Devi", amount: "210.50", status: "Completed", date: "2024-07-31" },
  { id: "#SAW004", customer: "Sanjay Gupta", amount: "45.99", status: "Pending", date: "2024-07-31" },
  { id: "#SAW005", customer: "Meera Singh", amount: "120.00", status: "Completed", date: "2024-07-30" },
  { id: "#SAW006", customer: "Vikram Reddy", amount: "95.30", status: "Completed", date: "2024-07-30" },
  { id: "#SAW007", customer: "Pooja Mehta", amount: "60.10", status: "Pending", date: "2024-07-29" },
  { id: "#SAW008", customer: "Amit Sharma", amount: "180.40", status: "Completed", date: "2024-07-29" },
  { id: "#SAW009", customer: "Deepika Padukone", amount: "75.00", status: "Completed", date: "2024-07-28" },
  { id: "#SAW010", customer: "Ranveer Singh", amount: "130.25", status: "Pending", date: "2024-07-28" },
];

export default function RecentOrdersTable() {
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
              <tr key={order.id} className="border-b border-[var(--border-color)]">
                <td className="py-2 px-3">{order.id}</td>
                <td className="py-2 px-3">{order.customer}</td>
                <td className="py-2 px-3">{order.amount}</td>
                <td className="py-2 px-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      order.status === "Completed"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {order.status}
                  </span>
                </td>
                <td className="py-2 px-3">{order.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="space-y-4 md:hidden">
        {orders.map((order) => (
          <div
            key={order.id}
            className="border border-[var(--border-color)] rounded-lg p-4 shadow-sm"
          >
            <p className="text-sm text-[var(--text-light)]">{order.id}</p>
            <h4 className="font-semibold">{order.customer}</h4>
            <p className="text-sm">{order.amount}</p>
            <p className="text-sm">{order.date}</p>
            <span
              className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium ${
                order.status === "Completed"
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"
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
