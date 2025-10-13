'use client';
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import 'sweetalert2/dist/sweetalert2.min.css';

const ORDER_STATUSES = [
  { key: "placed", label: "Placed", color: "bg-gray-400" },
  { key: "packed", label: "Packed", color: "bg-yellow-400" },
  { key: "in_transit", label: "In Transit", color: "bg-blue-400" },
  { key: "delivered", label: "Delivered", color: "bg-green-500" },
  { key: "cancelled", label: "Cancelled", color: "bg-red-500" },
  { key: "refunded", label: "Refunded", color: "bg-purple-500" },
];

type OrderStatus = typeof ORDER_STATUSES[number]['key'];

type Order = {
  _id: string;
  user: string;
  items: { name: string; quantity: number; price: number; unit: string; inHindi: string }[];
  address?: {
    name?: string;
    phone?: string;
    address?: string;
    area?: string | { name?: string; pincode?: string };
    inHindi?: string;
  } | null;
  subTotal: number;
  deliveryCharge: number;
  total: number;
  status: OrderStatus;
  paymentMethod: "online" | "cod" | "upi";
  paymentStatus: string;
  createdAt: string;
  otp?: string;
  otpExpiresAt?: string;
};

function getOrderTimelineHtml(order: Order) {
  const statusIdx = ORDER_STATUSES.findIndex(s => s.key === order.status);
  return `
    <div class="flex flex-col gap-4 py-2">
      ${ORDER_STATUSES.map((s, idx) => `
        <div class="flex items-center gap-3">
          <div class="flex items-center justify-center h-5 w-5 rounded-full ${idx <= statusIdx ? s.color : 'bg-gray-200'}">
            ${idx <= statusIdx ? `
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="5" fill="white" />
              </svg>
            ` : ``}
          </div>
          <div class="text-sm ${idx <= statusIdx ? 'font-bold text-black' : 'text-gray-400'}">${s.label}</div>
        </div>
      `).join("")}
    </div>
  `;
}

/** Countdown component:
 *  shows mm:ss remaining from createdAt until 5 minutes,
 *  returns expired boolean via prop function or you can compute from remaining <= 0.
 */
function Countdown({ createdAt, onExpired }: { createdAt: string; onExpired?: () => void }) {
  const FIVE_MIN_MS = 5 * 60 * 1000;
  const createdTs = new Date(createdAt).getTime();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = Math.max(0, FIVE_MIN_MS - (now - createdTs));
  useEffect(() => {
    if (remaining === 0 && onExpired) onExpired();
  }, [remaining, onExpired]);

  const mm = Math.floor(remaining / 60000).toString().padStart(2, "0");
  const ss = Math.floor((remaining % 60000) / 1000).toString().padStart(2, "0");
  return <span className="text-xs text-gray-500">{mm}:{ss}</span>;
}

export default function UserOrderList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    fetch("/api/orders", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        const data = await res.json();
        if (data.success) {
          setOrders(data.orders || []);
        }
      })
      .catch((err) => console.error("  Fetch Error:", err))
      .finally(() => setLoading(false));
  }, []);

  const cancelOrder = async (orderId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return Swal.fire("Error", "Please login again", "error");

      setCancellingId(orderId);
      const res = await fetch("/api/orders/cancel", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      setCancellingId(null);

      if (!res.ok || !data.success) {
        return Swal.fire("Error", data?.message || "Failed to cancel", "error");
      }
      // update UI: replace order in state
      setOrders((prev) => prev.map((o) => (o._id === orderId ? data.order : o)));
      Swal.fire("Cancelled", "Your order has been cancelled and stock restored.", "success");
    } catch (err) {
      console.error(err);
      setCancellingId(null);
      Swal.fire("Error", "Something went wrong", "error");
    }
  };

  // helper to check if order can be cancelled (server will validate again)
  const canCancelLocal = (order: Order) => {
    if (order.status !== "placed") return false;
    const createdTs = new Date(order.createdAt).getTime();
    return (Date.now() - createdTs) <= 5 * 60 * 1000;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <p className="text-gray-600">Loading your orders...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-2 md:p-6 flex justify-center bg-gray-50">
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-lg p-2 md:p-6">
        <h1 className="text-2xl font-bold mb-4 mt-10">📦 My Orders</h1>

        {orders.length === 0 && <p>No orders yet</p>}

        {/* Table for Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-2 text-sm md:text-base">
            <thead>
              <tr className="bg-green-600 text-white">
                <th className="px-4 py-2 text-left">Customer</th>
                <th className="px-4 py-2 text-left">Items</th>
                <th className="px-4 py-2 text-left">Total</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Payment</th>
                <th className="px-4 py-2 text-left">Address</th>
                <th className="px-4 py-2 text-left">Area</th>
                <th className="px-4 py-2 text-left">OTP</th>
                <th className="px-4 py-2 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const canCancel = canCancelLocal(order);
                return (
                  <tr key={order._id} className="bg-white border rounded-xl hover:bg-gray-50 transition">
                    <td className="px-4 py-2">
                      <div className="font-medium">{order.address?.name ?? "Unknown"}</div>
                      <div className="text-xs text-gray-500">📞 {order.address?.phone ?? "N/A"}</div>
                      {canCancel && (
                        <div className="text-xs mt-1">
                          <Countdown createdAt={order.createdAt} />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2 text-gray-600">
                      {order.items.map((i, idx) => (
                        <div key={idx}>
                          {i.name}{i.inHindi ? ` / ${i.inHindi}` : ""} ({i.quantity} {i.unit}) – ₹{i.price}
                        </div>
                      ))}
                    </td>
                    <td className="px-4 py-2 font-medium">₹ {order.total}</td>
                    <td className="px-4 py-2">
                      <span className={`
                        rounded-full px-3 py-1 text-xs
                        ${order.status === "delivered"
                          ? "bg-green-100 text-green-700"
                          : order.status === "packed"
                            ? "bg-yellow-100 text-yellow-700"
                            : order.status === "placed"
                              ? "bg-gray-100 text-gray-700"
                              : order.status === "in_transit"
                                ? "bg-blue-100 text-blue-700"
                                : order.status === "cancelled"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-purple-100 text-purple-700"
                        }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {order.paymentMethod === "online" ? (
                        <span className="rounded-full bg-indigo-100 text-indigo-700 px-3 py-1 text-xs">Online</span>
                      ) : order.paymentMethod === "upi" ? (
                        <span className="rounded-full bg-purple-100 text-purple-700 px-3 py-1 text-xs">UPI</span>
                      ) : (
                        <span className="rounded-full bg-orange-100 text-orange-700 px-3 py-1 text-xs">COD</span>
                      )}
                    </td>
                    <td className="px-4 py-2">{order.address?.address ?? "--"}</td>
                    <td className="px-4 py-2">
                      {typeof order.address?.area === "object"
                        ? `${order.address?.area?.name ?? ""} (${order.address?.area?.pincode ?? ""})`
                        : order.address?.area || "--"}
                    </td>
                    <td className="px-4 py-2">
                      {order.otp ? (
                        <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded font-mono">{order.otp}</span>
                      ) : "- -"}
                      {order.otpExpiresAt && (
                        <div className="text-xs text-gray-400">
                          Exp: {new Date(order.otpExpiresAt).toLocaleTimeString([], { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2 flex items-center gap-2">
                      <button
                        className="text-white bg-blue-500 hover:bg-blue-700 rounded px-3 py-1"
                        onClick={() => {
                          Swal.fire({
                            title: 'Order Details',
                            html: `
                              ${getOrderTimelineHtml(order)}
                              <div class="mt-4 text-left capitalize">
                                <b>Name:</b> ${order.address?.name ?? "N/A"} <br/>
                                <b>Phone:</b> ${order.address?.phone ?? "N/A"} <br/>
                                <b>Address:</b> ${order.address?.address ?? "--"} <br/>
                                <b>Area:</b> ${typeof order.address?.area === "object"
                                  ? `${order.address?.area?.name ?? ""} (${order.address?.area?.pincode ?? ""})`
                                  : order.address?.area || "--"} <br/>
                                <b>Product(s):</b> ${order.items.map((i) =>
                                  `${i.name} ${i.inHindi ? `/ ${i.inHindi}` : ""} (${i.quantity} ${i.unit}) - ₹${i.price}`
                                ).join(", ")} <br/>
                                <b>Total:</b> ₹${order.total} <br/>
                                <b>Payment:</b> ${order.paymentMethod.toUpperCase()}<br/>
                                <b>Status:</b> ${order.status}<br/>
                                <b>Placed at:</b> ${new Date(order.createdAt).toLocaleString()}<br/>
                              </div>
                            `,
                            showCloseButton: true,
                            confirmButtonText: "Close",
                            width: 400,
                            customClass: { popup: 'swal2-rounded' },
                          });
                        }}
                      >
                        Details
                      </button>

                      {canCancel && (
                        <button
                          onClick={() => {
                            Swal.fire({
                              title: "Cancel order?",
                              text: "You can cancel only within 5 minutes. Proceed?",
                              showCancelButton: true,
                            }).then((res) => {
                              if (res.isConfirmed) cancelOrder(order._id);
                            });
                          }}
                          className="px-3 py-1 bg-red-500 text-white rounded disabled:opacity-60"
                          disabled={cancellingId === order._id}
                        >
                          {cancellingId === order._id ? "Cancelling..." : "Cancel"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Cards for Mobile */}
        <div className="md:hidden flex flex-col gap-4">
          {orders.map((order) => {
            const canCancel = canCancelLocal(order);
            return (
              <div key={order._id} className="rounded-xl shadow border bg-white px-4 py-3">
                <div className="font-bold text-lg mb-1">{order.address?.name ?? "Unknown"}</div>
                <div className="text-sm text-gray-500 mb-1">📞 {order.address?.phone ?? "N/A"}</div>
                <div className="mb-2"><span className="font-medium">Address: </span>{order.address?.address ?? "--"}</div>
                <div className="mb-2">
                  <span className="font-medium">Area: </span>
                  {typeof order.address?.area === "object"
                    ? `${order.address?.area?.name ?? ""} (${order.address?.area?.pincode ?? ""})`
                    : order.address?.area || "- -"}
                </div>
                <div className="mb-2">
                  <span className="font-medium">Products: </span>
                  <ul className="list-disc pl-4">
                    {order.items.map((i, idx) => (
                      <li key={idx}>
                        {i.name}{i.inHindi ? ` / ${i.inHindi}` : ""} ({i.quantity} {i.unit}) – ₹{i.price}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mb-2"><span className="font-medium">Total: </span>₹ {order.total}</div>
                <div className="mb-2">
                  <span className="font-medium ">OTP: </span>
                  {order.otp ? (
                    <span className="bg-yellow-100 text-yellow-700 px-2">{order.otp}</span>
                  ) : "- -"}
                </div>
                <div className="mb-2">
                  <span className="font-medium">Payment: </span>
                  {order.paymentMethod === "online" ? "Online" : order.paymentMethod === "upi" ? "UPI" : "COD"}
                </div>
                <div className="mb-2">
                  <span className="font-medium">Status: </span>
                  <span className={`rounded-full px-3 py-1 text-xs ${order.status === "delivered"
                    ? "bg-green-100 text-green-700"
                    : order.status === "packed"
                      ? "bg-yellow-100 text-yellow-700"
                      : order.status === "placed"
                        ? "bg-gray-100 text-gray-700"
                        : order.status === "in_transit"
                          ? "bg-blue-100 text-blue-700"
                          : order.status === "cancelled"
                            ? "bg-red-100 text-red-700"
                            : "bg-purple-100 text-purple-700"
                    }`}>{order.status}</span>
                  {canCancel && <div className="mt-1"><Countdown createdAt={order.createdAt} /></div>}
                </div>
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    className="text-white bg-blue-500 hover:bg-blue-700 rounded px-3 py-1"
                    onClick={() => {
                      Swal.fire({
                        title: 'Order Details',
                        html: `
                          ${getOrderTimelineHtml(order)}
                          <div class="mt-4 text-left capitalize">
                            <b>Name:</b> ${order.address?.name ?? "N/A"} <br/>
                            <b>Phone:</b> ${order.address?.phone ?? "N/A"} <br/>
                            <b>Address:</b> ${order.address?.address ?? "--"} <br/>
                            <b>Area:</b> ${typeof order.address?.area === "object"
                              ? `${order.address?.area?.name ?? ""} (${order.address?.area?.pincode ?? ""})`
                              : order.address?.area || "--"} <br/>
                            <b>Product(s):</b> ${order.items.map((i) =>
                              `${i.name} ${i.inHindi ? `/ ${i.inHindi}` : ""} (${i.quantity} ${i.unit}) - ₹${i.price}`
                            ).join(", ")} <br/>
                            <b>Total:</b> ₹${order.total} <br/>
                            <b>Payment:</b> ${order.paymentMethod.toUpperCase()}<br/>
                            <b>Status:</b> ${order.status}<br/>
                            <b>Placed at:</b> ${new Date(order.createdAt).toLocaleString()}<br/>
                          </div>
                        `,
                        showCloseButton: true,
                        confirmButtonText: "Close",
                        width: 400,
                        customClass: { popup: 'swal2-rounded' },
                      });
                    }}
                  >
                    Details
                  </button>

                  {canCancel && (
                    <button
                      onClick={() => {
                        Swal.fire({
                          title: "Cancel order?",
                          text: "You can cancel only within 5 minutes. Proceed?",
                          showCancelButton: true,
                        }).then((res) => {
                          if (res.isConfirmed) cancelOrder(order._id);
                        });
                      }}
                      className="px-3 py-1 bg-red-500 text-white rounded disabled:opacity-60"
                      disabled={cancellingId === order._id}
                    >
                      {cancellingId === order._id ? "Cancelling..." : "Cancel"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
