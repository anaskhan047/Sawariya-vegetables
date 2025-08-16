"use client";

import { useState } from "react";
import * as XLSX from "xlsx";

type Order = {
  id: string;
  customer: { name: string; email: string; phone: string };
  products: string;
  total: string;
  status: "Delivered" | "Processing" | "Pending" | "Shipped" | "Cancelled";
  paymentMode: "Online" | "Cash on Delivery";
};

const orders: Order[] = [
  {
    id: "ORD001",
    customer: { name: "Radha Devi", email: "radha.d@example.com", phone: "+91-9876501234" },
    products: "Fresh Carrots (1kg), Organic Tomatoes (500g)",
    total: "₹ 150.75",
    status: "Delivered",
    paymentMode: "Online",
  },
  {
    id: "ORD002",
    customer: { name: "Krishna Prasad", email: "krishna.p@example.com", phone: "+91-9876543210" },
    products: "Spinach (250g), Potatoes (2kg), Onions (1kg)",
    total: "₹ 95.20",
    status: "Processing",
    paymentMode: "Cash on Delivery",
  },
  {
    id: "ORD003",
    customer: { name: "Meera Singh", email: "meera.s@example.com", phone: "+91-9988776655" },
    products: "Cabbage (1.5kg), Cauliflower (1 unit)",
    total: "₹ 70.00",
    status: "Pending",
    paymentMode: "Online",
  },
  {
    id: "ORD004",
    customer: { name: "Arjun Kumar", email: "arjun.k@example.com", phone: "+91-8765432109" },
    products: "Fresh Coriander (100g), Green Chillies (50g), Lemon (2pcs)",
    total: "₹ 45.50",
    status: "Shipped",
    paymentMode: "Cash on Delivery",
  },
  {
    id: "ORD005",
    customer: { name: "Sita Sharma", email: "sita.s@example.com", phone: "+91-9876001122" },
    products: "Brinjals (500g), Okra (250g), Capsicum (2 units)",
    total: "₹ 110.90",
    status: "Cancelled",
    paymentMode: "Online",
  },
];

export default function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState("All");

  const filteredOrders =
    statusFilter === "All" ? orders : orders.filter((o) => o.status === statusFilter);

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      filteredOrders.map((o) => ({
        "Order ID": o.id,
        "Customer Name": o.customer.name,
        Email: o.customer.email,
        Phone: o.customer.phone,
        Products: o.products,
        Total: o.total,
        Status: o.status,
        "Payment Mode": o.paymentMode,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orders");
    XLSX.writeFile(wb, "Orders.xlsx");
  };

  return (
    <div className="mx-auto max-w-6xl sm:px-6 lg:px-8 space-y-6">
      <h1 className="text-xl sm:text-2xl font-semibold">Orders</h1>

      {/* Filters */}
      <div className="rounded-lg border border-[var(--border-color)] bg-white p-4 shadow-sm w-55 sm:w-80 md:w-100 lg:w-full">
        <h2 className="mb-4 text-base sm:text-lg font-medium">Filter Orders</h2>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <select
            className="w-auto rounded-lg border border-[var(--border-color)] px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Delivered">Delivered</option>
            <option value="Processing">Processing</option>
            <option value="Pending">Pending</option>
            <option value="Shipped">Shipped</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <div className="flex flex-col sm:flex-row gap-2 w-auto sm:w-auto">
            <button
              className="w-full sm:w-auto rounded-lg bg-[var(--primary-color)] px-4 py-2 text-sm text-white"
              onClick={() => setStatusFilter(statusFilter)}
            >
              Filter
            </button>
            <button
              className="w-full sm:w-auto rounded-lg border px-4 py-2 text-sm"
              onClick={() => setStatusFilter("All")}
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="rounded-lg border border-[var(--border-color)] bg-white shadow-sm  w-70 sm:w-135 md:w-120 lg:w-full">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base sm:text-lg font-medium">All Orders</h2>
          <button
            onClick={exportToExcel}
            className="rounded-lg border px-4 py-2 text-sm"
          >
            Export Orders
          </button>
        </div>

        {/* Table wrapper */}
        <div className="overflow-x-auto w-auto">
          <table className="min-w-full text-sm table-auto">
            <thead className="bg-gray-50 text-[var(--text-light)]">
              <tr>
                <th className="px-4 py-2 text-left">Order ID</th>
                <th className="px-4 py-2 text-left">Customer</th>
                <th className="px-4 py-2 text-left">Products</th>
                <th className="px-4 py-2 text-left">Total Amount</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Payment Mode</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr
                  key={order.id}
                  className="border-t border-[var(--border-color)] hover:bg-gray-50"
                >
                  <td className="px-4 py-3 font-medium break-words whitespace-normal">{order.id}</td>
                  <td className="px-4 py-3 break-words whitespace-normal">
                    <div className="font-medium">{order.customer.name}</div>
                    <div className="max-w-[220px] truncate text-xs text-[var(--text-light)]">
                      ✉️ {order.customer.email}
                    </div>
                    <div className="text-xs text-[var(--text-light)]">
                      📞 {order.customer.phone}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-light)] break-words whitespace-normal">
                    <div className="max-w-[320px] truncate">{order.products}</div>
                  </td>
                  <td className="px-4 py-3 font-medium break-words whitespace-normal">{order.total}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs ${
                        order.status === "Delivered"
                          ? "bg-green-100 text-green-700"
                          : order.status === "Processing"
                          ? "bg-yellow-100 text-yellow-700"
                          : order.status === "Pending"
                          ? "bg-gray-100 text-gray-700"
                          : order.status === "Shipped"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {order.paymentMode === "Online" ? (
                      <span className="rounded-full bg-indigo-100 text-indigo-700 px-3 py-1 text-xs">
                        Online
                      </span>
                    ) : (
                      <span className="rounded-full bg-orange-100 text-orange-700 px-3 py-1 text-xs">
                        Cash on Delivery
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* End wrapper */}
      </div>
    </div>
  );
}