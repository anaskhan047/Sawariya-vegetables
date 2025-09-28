"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import Swal from "sweetalert2"; // ✅ Import SweetAlert2

type OrderStatus = "placed" | "packed" | "in_transit" | "delivered" | "cancelled" | "refunded";

type Order = {
  _id: string;
  user: string;
  items: { name: string; quantity: number; price: number; unit: string; inHindi: string; }[];
  address: { name: string; phone: string; address: string; area: string | { name: string; pincode: string }; };
  subTotal: number;
  deliveryCharge: number;
  total: number;
  status: OrderStatus;
  paymentMethod: string;
  upiId?: string;
  utr?: string;            // ✅ add this
  upiTxnInfo?: { paidTo?: string; txnRef?: string };
  paymentStatus: string;
  createdAt: string;
  otp?: string;
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState("All");

  // ✅ Fetch all orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await axios.get("/api/admin/orders", {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log(res.data)
        if (res.data.success) setOrders(res.data.orders || []);
      } catch (err) {
        console.error("❌ Error fetching orders:", err);
      }
    };
    fetchOrders();
  }, []);

  const filteredOrders = statusFilter === "All" ? orders : orders.filter((o) => o.status === statusFilter);

  // ✅ Export to Excel
  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      filteredOrders.map((o) => ({
        "Order ID": o._id,
        "Customer Name": o.address.name,
        Phone: o.address.phone,
        Address: o.address.address,
        "Order Items": o.items.map((i) => `${i.name} (${i.quantity} ${i.unit})`).join(", "),
        Subtotal: o.subTotal,
        "Delivery Charge": o.deliveryCharge,
        Total: o.total,
        Status: o.status,
        "Payment Method": o.paymentMethod,
        "Payment Status": o.paymentStatus,
        "Order Date": new Date(o.createdAt).toLocaleString(),
        OTP: o.otp || "N/A",
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orders");
    XLSX.writeFile(wb, "Orders.xlsx");
  };

  // ✅ Update status with OTP confirmation if delivered
  const updateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      // ✅ If marking as delivered, ask for OTP
      if (newStatus === "delivered") {
        const { value: otp } = await Swal.fire({
          title: "Enter OTP to confirm delivery",
          input: "text",
          inputPlaceholder: "Enter OTP",
          showCancelButton: true,
          allowOutsideClick: false,
          allowEscapeKey: false,
        });

        if (!otp) return;

        const res = await fetch("/api/admin/orders", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ orderId, verifyOtp: otp }), // ✅ FIXED
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          return Swal.fire("Error", data.message || "Invalid OTP", "error");
        }

        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? { ...o, status: "delivered" } : o))
        );

        return Swal.fire("Delivered!", "Order marked as delivered.", "success");
      }


      // ✅ Normal status update (no OTP needed)
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId, status: newStatus }),
      });

      const data = await res.json();
      if (data.success) {
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o))
        );
      }
    } catch (err) {
      console.error("❌ Failed to update status:", err);
      Swal.fire("Error", "Failed to update status", "error");
    }
  };



  return (
    <div className="mx-auto max-w-6xl px-3 sm:px-6 lg:px-8 space-y-6">
      <h1 className="text-xl sm:text-2xl font-semibold">Orders</h1>

      {/* Filters */}
      <div className="rounded-lg border border-[var(--border-color)] bg-white p-4 shadow-sm w-full">
        <h2 className="mb-4 text-base sm:text-lg font-medium">Filter Orders</h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <select
            className="w-full sm:w-auto rounded-lg border border-[var(--border-color)] px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="placed">Placed</option>
            <option value="packed">Packed</option>
            <option value="in_transit">In Transit</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
          </select>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
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

      {/* Orders Table / Cards */}
      <div className="rounded-lg border border-[var(--border-color)] bg-white shadow-sm w-full">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base sm:text-lg font-medium">All Orders</h2>
          <button
            onClick={exportToExcel}
            className="rounded-lg border px-4 py-2 text-sm"
          >
            Export Orders
          </button>
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-auto text-sm table-auto">
            <thead className="bg-gray-50 text-[var(--text-light)]">
              <tr>
                <th className="px-4 py-2 text-left">Order ID</th>
                <th className="px-4 py-2 text-left">Customer</th>
                <th className="px-4 py-2 text-left">Items</th>
                <th className="px-4 py-2 text-left">Total</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Payment</th>
                <th className="px-4 py-2 text-left">Address</th>
                <th className="px-4 py-2 text-left">Area</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order._id} className="border-t border-[var(--border-color)] hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{order._id}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{order.address?.name ?? "No Name"}</div>
                    <div className="text-xs text-[var(--text-light)]">
                      📞 {order.address?.phone ?? "N/A"}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-light)]">
                    {order.items.map((i, idx) => (
                      <div key={idx}>{i.name} /{i.inHindi} ({i.quantity} {i.unit}) - ₹{i.price}</div>
                    ))}
                  </td>
                  <td className="px-4 py-3 font-medium">₹{order.total}</td>
                  <td className="px-4 py-3 flex flex-col gap-1">
                    <span
                      className={`rounded-full px-3 py-1 text-xs ${order.status === "delivered"
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

                    {/* Dropdown to update status */}
                    <select
                      value={order.status}
                      onChange={(e) => updateStatus(order._id, e.target.value as OrderStatus)}
                      className="mt-1 rounded border px-2 py-1 text-xs"
                    >
                      <option value="placed">Placed</option>
                      <option value="packed">Packed</option>
                      <option value="in_transit">In Transit</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    {order.paymentMethod === "upi" ? (
                      <div className="text-xs space-y-1">
                        <span className="rounded-full bg-indigo-100 text-indigo-700 px-3 py-1">
                          UPI
                        </span>

                        {order.upiId && (
                          <div className="text-gray-600">
                            <b>UPI ID:</b> {order.upiId}
                          </div>
                        )}

                        {order.utr && ( // ✅ utr direct show
                          <div className="text-gray-600">
                            <b>UTR:</b> {order.utr}
                          </div>
                        )}

                        {order.upiTxnInfo?.txnRef && (
                          <div className="text-gray-600">
                            <b>UTR:</b> {order.upiTxnInfo.txnRef}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="rounded-full bg-orange-100 text-orange-700 px-3 py-1">
                        COD
                      </span>
                    )}
                  </td>



                  <td className="px-4 py-3">{order.address?.address ?? "--"}</td>
                  <td className="px-4 py-3">
                    {typeof order.address?.area === "object"
                      ? `${order.address?.area?.name ?? ""} (${order.address?.area?.pincode ?? ""})`
                      : order.address?.area || "--"}
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="block lg:hidden p-4 space-y-4">
          {filteredOrders.map((order) => (
            <div key={order._id} className="rounded-lg border border-[var(--border-color)] p-4 bg-white shadow-sm space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">{order._id}</span>
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

              <div>
                <div className="font-medium">{order.address.name}</div>
                <div className="text-xs text-[var(--text-light)]">📞 {order.address.phone}</div>
              </div>

              <div className="text-sm text-[var(--text-light)]">
                {order.items.map((i, idx) => (
                  <div key={idx}>{i.name} ({i.quantity} {i.unit}) - ₹{i.price}</div>
                ))}
              </div>

              <div className="font-medium">₹ {order.total}</div>

              <div>
                {order.paymentMethod === "upi" ? (
                  <div className="text-xs space-y-1">
                    <span className="rounded-full bg-indigo-100 text-indigo-700 px-2 py-1 text-xs">
                      UPI
                    </span>

                    {order.upiId && (
                      <div className="text-gray-600">
                        <b>UPI ID:</b> {order.upiId}
                      </div>
                    )}

                    {order.utr && ( // ✅ utr show here too
                      <div className="text-gray-600">
                        <b>UTR:</b> {order.utr}
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="rounded-full bg-orange-100 text-orange-700 px-2 py-1 text-xs">
                    COD
                  </span>
                )}
              </div>



              <div className="text-xs text-[var(--text-light)]">📍 {order.address.address}</div>

              {/* Status Update Dropdown */}
              <div className="mt-2">
                <select
                  value={order.status}
                  onChange={(e) => updateStatus(order._id, e.target.value as OrderStatus)}
                  className="rounded border px-2 py-1 text-xs w-full"
                >
                  <option value="placed">Placed</option>
                  <option value="packed">Packed</option>
                  <option value="in_transit">In Transit</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
