"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import Swal from "sweetalert2";

type OrderStatus = "placed" | "packed" | "in_transit" | "delivered" | "cancelled" | "refunded";

type OrderItem = {
  name: string;
  quantity: number;
  price: number;
  unit: string;
  inHindi: string;
};

type OrderAddress = {
  name: string;
  phone: string;
  address: string;
  area: string | { name: string; pincode: string };
};

type Order = {
  _id: string;
  user: string;
  items: OrderItem[];
  address: OrderAddress;
  subTotal: number;
  deliveryCharge: number;
  total: number;
  status: OrderStatus;
  paymentMethod: string;
  upiId?: string;
  utr?: string;
  upiTxnInfo?: { paidTo?: string; txnRef?: string };
  paymentStatus: string;
  createdAt: string;
  otp?: string;
  coupon?: string;
  discount?: number;
  invoiceNumber?: string;
};

const statusFlow: OrderStatus[] = ["placed", "packed", "in_transit", "delivered"];

const getStatusLabel = (status: OrderStatus): string => {
  switch (status) {
    case "placed":
      return "Placed";
    case "packed":
      return "Packed";
    case "in_transit":
      return "In Transit";
    case "delivered":
      return "Delivered";
    case "cancelled":
      return "Cancelled";
    case "refunded":
      return "Refunded";
    default:
      return status;
  }
};

const getStatusPillClass = (status: OrderStatus): string => {
  if (status === "delivered") return "bg-green-100 text-green-700";
  if (status === "packed") return "bg-yellow-100 text-yellow-700";
  if (status === "placed") return "bg-slate-100 text-slate-700";
  if (status === "in_transit") return "bg-blue-100 text-blue-700";
  if (status === "cancelled") return "bg-red-100 text-red-700";
  if (status === "refunded") return "bg-purple-100 text-purple-700";
  return "bg-slate-100 text-slate-700";
};

const canChangeStatus = (current: OrderStatus, next: OrderStatus): boolean => {
  if (current === next) return false;

  if (current === "delivered" || current === "refunded") return false;

  if (next === "cancelled") {
    return current === "placed" || current === "packed" || current === "in_transit";
  }

  if (next === "refunded") {
    return current === "cancelled";
  }

  const currentIndex = statusFlow.indexOf(current);
  const nextIndex = statusFlow.indexOf(next);

  if (currentIndex === -1 || nextIndex === -1) return false;

  return nextIndex > currentIndex;
};

const getStatusButtonClass = (
  current: OrderStatus,
  candidate: OrderStatus,
  clickable: boolean,
): string => {
  const base =
    "inline-flex items-center justify-center rounded-full px-3 py-1 text-xs sm:text-[11px] font-medium border transition-all duration-150 whitespace-nowrap";

  if (!clickable) {
    if (current === candidate) {
      return `${base} ${getStatusPillClass(candidate)} cursor-default shadow-sm`;
    }
    return `${base} border-dashed border-slate-200 text-slate-400 bg-slate-50/60 cursor-not-allowed`;
  }

  if (current === candidate) {
    return `${base} ${getStatusPillClass(
      candidate,
    )} cursor-pointer shadow-sm ring-1 ring-slate-200`;
  }

  return [
    base,
    "border-slate-300 text-slate-700 bg-white",
    "hover:bg-slate-900 hover:text-white",
    "hover:-translate-y-0.5 hover:shadow-md hover:border-slate-900",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/30",
    "cursor-pointer",
  ].join(" ");
};

const formatINR = (value: number): string => {
  try {
    return "₹" + value.toFixed(2);
  } catch {
    return "₹0.00";
  }
};

const escapeHtml = (unsafe: string | number | null | undefined): string => {
  if (unsafe === null || unsafe === undefined) return "";
  const s = String(unsafe);
  return s.replace(/[&<>"'`=\/]/g, function (c) {
    return (
      {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
        "/": "&#x2F;",
        "`": "&#x60;",
        "=": "&#x3D;",
      }[c] || c
    );
  });
};

const calculateSubTotal = (items: Order["items"]): number => {
  return items.reduce((acc, it) => acc + (it.price || 0) * (it.quantity || 0), 0);
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [lastSyncAt, setLastSyncAt] = useState<string>("");

  useEffect(() => {
    let mounted = true;

    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await axios.get("/api/admin/orders", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.success && mounted) {
          setOrders(res.data.orders || []);
          setLastSyncAt(new Date().toLocaleTimeString());
        }
      } catch (err) {
        console.error("Error fetching orders:", err);
      }
    };

    const onVisibleOrFocus = () => {
      if (document.visibilityState === "visible") {
        fetchOrders();
      }
    };

    fetchOrders();
    const pollInterval = window.setInterval(fetchOrders, 10_000);
    window.addEventListener("focus", onVisibleOrFocus);
    document.addEventListener("visibilitychange", onVisibleOrFocus);

    return () => {
      mounted = false;
      window.clearInterval(pollInterval);
      window.removeEventListener("focus", onVisibleOrFocus);
      document.removeEventListener("visibilitychange", onVisibleOrFocus);
    };
  }, []);

  const filteredOrders = orders
    .filter((order) => {
      if (statusFilter === "All") return true;
      return order.status === statusFilter;
    })
    .filter((order) => {
      if (!dateFrom && !dateTo) return true;

      const orderDate = new Date(order.createdAt);
      if (Number.isNaN(orderDate.getTime())) return false;

      if (dateFrom) {
        const from = new Date(`${dateFrom}T00:00:00`);
        if (orderDate < from) return false;
      }

      if (dateTo) {
        const to = new Date(`${dateTo}T23:59:59`);
        if (orderDate > to) return false;
      }

      return true;
    })
    .filter((order) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const idMatch = order._id.toLowerCase().includes(q);
      const nameMatch = order.address.name.toLowerCase().includes(q);
      const phoneMatch = order.address.phone.toLowerCase().includes(q);
      const areaText =
        typeof order.address.area === "object"
          ? `${order.address.area.name ?? ""} ${order.address.area.pincode ?? ""}`
          : order.address.area ?? "";
      const areaMatch = areaText.toLowerCase().includes(q);
      return idMatch || nameMatch || phoneMatch || areaMatch;
    });

  const today = new Date();
  const todayString = today.toISOString().slice(0, 10);

  const totalOrders = orders.length;
  const todayOrders = orders.filter((o) => o.createdAt.slice(0, 10) === todayString).length;
  const deliveredCount = orders.filter((o) => o.status === "delivered").length;
  const pendingCount = orders.filter(
    (o) => o.status === "placed" || o.status === "packed" || o.status === "in_transit",
  ).length;
  const revenueDelivered = orders
    .filter((o) => o.status === "delivered")
    .reduce((sum, o) => sum + (o.total || 0), 0);
 const codAmount = orders
  .filter((o) => o.paymentMethod === "cod" && o.status === "delivered")
  .reduce((sum, o) => sum + (o.total || 0), 0);
  const upiAmount = orders
    .filter((o) => o.paymentMethod === "upi" && o.status === "delivered")
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      filteredOrders.map((o) => ({
        "Order ID": o._id,
        "Customer Name": o.address.name,
        Phone: o.address.phone,
        Address: o.address.address,
        Area:
          typeof o.address.area === "object"
            ? `${o.address.area.name ?? ""} (${o.address.area.pincode ?? ""})`
            : o.address.area,
        "Order Items": o.items.map((i) => `${i.name} (${i.quantity} ${i.unit})`).join(", "),
        Subtotal: o.subTotal,
        "Delivery Charge": o.deliveryCharge,
        Total: o.total,
        Status: o.status,
        "Payment Method": o.paymentMethod,
        "Payment Status": o.paymentStatus,
        "Order Date": new Date(o.createdAt).toLocaleString(),
        OTP: o.otp || "N/A",
      })),
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orders");
    XLSX.writeFile(wb, "Orders.xlsx");
  };

  const updateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

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
          body: JSON.stringify({ orderId, verifyOtp: otp }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          return Swal.fire("Error", data.message || "Invalid OTP", "error");
        }

        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? { ...o, status: "delivered" } : o)),
        );

        return Swal.fire("Delivered!", "Order marked as delivered.", "success");
      }

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
          prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o)),
        );
      }
    } catch (err) {
      console.error("Failed to update status:", err);
      Swal.fire("Error", "Failed to update status", "error");
    }
  };

  const handleStatusClick = async (order: Order, nextStatus: OrderStatus) => {
    if (!canChangeStatus(order.status, nextStatus)) return;

    if (nextStatus === "cancelled" || nextStatus === "refunded") {
      const result = await Swal.fire({
        title: `Confirm ${getStatusLabel(nextStatus)}?`,
        text:
          nextStatus === "cancelled"
            ? "This will cancel this order for the customer."
            : "Use this only after refund is processed.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, continue",
        cancelButtonText: "No",
      });

      if (!result.isConfirmed) return;
    }

    await updateStatus(order._id, nextStatus);
  };

  const printInvoice = (order: Order) => {
    const companyName = "Shri Sawariya Mart";
    const companySubHeading = "Quality Grocery & Essentials";
    const logoUrl = "/logo.png";
    const invoiceNumber = order.invoiceNumber ?? `INV-${order._id.slice(0, 8).toUpperCase()}`;
    const orderDate = new Date(order.createdAt);
    const orderDateStr = orderDate.toLocaleDateString();
    const orderTimeStr = orderDate.toLocaleTimeString();

    const discount = order.discount ?? 0;
    const couponCode = order.coupon ?? "N/A";

    const itemsHtml = order.items
      .map((it, idx) => {
        const lineTotal = (it.price || 0) * (it.quantity || 0);
        return `
        <tr>
          <td style="padding:6px 4px; text-align:center; font-size:12px;">${idx + 1}</td>
          <td style="padding:6px 4px; font-size:12px;">${escapeHtml(it.name)} ${
          it.unit ? `(${escapeHtml(it.unit)})` : ""
        }</td>
          <td style="padding:6px 4px; text-align:right; font-size:12px;">${formatINR(it.price)}</td>
          <td style="padding:6px 4px; text-align:center; font-size:12px;">${it.quantity}</td>
          <td style="padding:6px 4px; text-align:right; font-size:12px;">${formatINR(
            lineTotal,
          )}</td>
        </tr>
      `;
      })
      .join("");

    const address = order.address?.address ?? "--";
    const area =
      typeof order.address?.area === "object"
        ? `${order.address.area?.name ?? ""} (${order.address.area?.pincode ?? ""})`
        : order.address?.area ?? "--";

    const deliveryCharge = order.deliveryCharge ?? 0;
    const subTotal = order.subTotal ?? calculateSubTotal(order.items);
    const afterDiscount = Math.max(0, subTotal - (discount || 0));
    const grandTotal = afterDiscount + (deliveryCharge || 0);

    const html = `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Invoice - ${invoiceNumber}</title>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <style>
          @page { margin: 0; }
          html,body{
            margin:0;
            padding:0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans";
            color:#000;
          }
          .receipt {
            width: 320px;
            padding: 8px 12px;
            box-sizing: border-box;
          }
          .capitalize{ text-transform:capitalize; }
          .center { text-align:center; }
          .left { text-align:left; }
          .right { text-align:right; }
          h1 { margin:6px 0 2px; font-size:18px; letter-spacing:0.5px; }
          h2 { margin:0 0 6px; font-size:12px; color:#222; font-weight:600; }
          p { margin:2px 0; font-size:12px; }
          .line { border-top:1px dashed #000; margin:8px 0; }
          table { width:100%; border-collapse: collapse; }
          th, td { padding:4px 2px; }
          th { font-size:12px; text-align:left; }
          td { font-size:12px; vertical-align:top; }
          .totals td { font-weight:700; font-size:12px; }
          .small { font-size:11px; color:#333; }
          .note { font-size:11px; margin-top:6px; }
          @media print {
            body { -webkit-print-color-adjust: exact; }
            .receipt { width: 72mm; padding: 6px; }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="center">
            <img src="${logoUrl}" alt="${escapeHtml(
      companyName,
    )} Logo" style="max-width:120px; max-height:60px; object-fit:contain; margin-bottom:6px;" onerror="this.style.display='none'"/>
            <h1>${escapeHtml(companyName)}</h1>
            <h2>${escapeHtml(companySubHeading)}</h2>
            <p class="small">Invoice: <b>${escapeHtml(invoiceNumber)}</b></p>
            <p class="small">Order ID: <b>${escapeHtml(order._id)}</b></p>
            <p class="small">${escapeHtml(orderDateStr)} ${escapeHtml(orderTimeStr)}</p>
          </div>

          <div class="line"></div>

          <div>
            <p style="margin-bottom:6px;"><b>Bill To:</b> <b class="capitalize">${escapeHtml(
              order.address?.name ?? "Customer",
            )}</b></p>
            <p class="small">📞 ${escapeHtml(order.address?.phone ?? "--")}</p>
            <p class="small">📍 ${escapeHtml(address)}</p>
            <p class="small">Area: ${escapeHtml(area)}</p>
          </div>

          <div class="line"></div>

          <table>
            <thead>
              <tr>
                <th style="width:8%;">S.No</th>
                <th style="width:50%;">Product</th>
                <th style="width:18%; text-align:right;">Unit</th>
                <th style="width:8%; text-align:center;">Qty</th>
                <th style="width:16%; text-align:right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="line"></div>

          <table style="width:100%; margin-top:6px;">
            <tbody>
              <tr>
                <td class="small">Subtotal</td>
                <td class="right small">${formatINR(subTotal)}</td>
              </tr>
              <tr>
                <td class="small">Discount (${escapeHtml(String(couponCode))})</td>
                <td class="right small">-${formatINR(discount)}</td>
              </tr>
              <tr>
                <td class="small">Delivery Charge</td>
                <td class="right small">${formatINR(deliveryCharge)}</td>
              </tr>
              <tr class="totals">
                <td class="small">Grand Total</td>
                <td class="right small">${formatINR(grandTotal)}</td>
              </tr>
            </tbody>
          </table>

          <div class="line"></div>

          <p class="small"><b>Payment Mode:</b> ${escapeHtml(
            order.paymentMethod === "upi" ? "UPI" : "Cash On Delivery",
          )}</p>
          ${order.upiId ? `<p class="small"><b>UPI ID:</b> ${escapeHtml(order.upiId)}</p>` : ""}
          ${order.utr ? `<p class="small"><b>UTR:</b> ${escapeHtml(order.utr)}</p>` : ""}
          ${
            order.upiTxnInfo?.txnRef
              ? `<p class="small"><b>Txn Ref:</b> ${escapeHtml(order.upiTxnInfo.txnRef)}</p>`
              : ""
          }

          <div class="line"></div>

          <p class="center note">Thank you for shopping with ${escapeHtml(companyName)}!</p>

        </div>
        <script>
          function doPrint() {
            try {
              window.print();
            } catch(e) {
              console.error(e);
            }
            setTimeout(()=>{ window.close(); }, 500);
          }
          window.onload = function(){ setTimeout(doPrint, 200); };
        </script>
      </body>
      </html>
    `;

    const w = window.open("", "_blank", "width=420,height=800,scrollbars=yes");
    if (!w) {
      alert("Unable to open print window. Please allow popups for this site.");
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
  };

  const statsCards = [
    {
      label: "Total Orders",
      value: totalOrders.toString(),
      sub: "All-time",
    },
    {
      label: "Today",
      value: todayOrders.toString(),
      sub: "Created today",
    },
    {
      label: "Delivered",
      value: deliveredCount.toString(),
      sub: "Completed",
    },
    {
      label: "Pending",
      value: pendingCount.toString(),
      sub: "Placed / Packed / Transit",
    },
    {
      label: "Delivered Revenue",
      value: formatINR(revenueDelivered),
      sub: "Delivered only",
    },
    {
      label: "UPI Amount",
      value: formatINR(upiAmount),
      sub: "UPI value",
    },
    {
      label: "COD Amount",
      value: formatINR(codAmount),
      sub: "Cash value",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-3 sm:px-6 lg:px-8 space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Orders Overview</h1>
          <p className="text-xs sm:text-sm text-[var(--text-light)]">
            Track, filter and control every order with one premium panel.
          </p>
          {lastSyncAt && (
            <p className="text-[11px] text-slate-500 mt-1">Live sync: {lastSyncAt}</p>
          )}
        </div>
        <button
          onClick={exportToExcel}
          className="self-start rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs sm:text-sm font-medium hover:bg-slate-900 hover:text-white transition-colors shadow-sm"
        >
          Export Visible Orders
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {statsCards.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100 px-3 py-3 sm:px-4 sm:py-4 shadow-[0_1px_2px_rgba(15,23,42,0.08)] hover:shadow-[0_8px_24px_rgba(15,23,42,0.15)] transition-all hover:-translate-y-0.5"
          >
            <p className="text-[11px] sm:text-xs font-medium text-slate-500 uppercase tracking-wide">
              {stat.label}
            </p>
            <p className="mt-1 text-base sm:text-lg font-semibold text-slate-900">{stat.value}</p>
            {stat.sub && (
              <p className="mt-0.5 text-[11px] text-slate-500 truncate">{stat.sub}</p>
            )}
          </div>
        ))}
      </div>

      {/* FILTER BAR */}
      <div className="rounded-xl border border-[var(--border-color)] bg-white/80 backdrop-blur px-3 py-3 sm:px-4 sm:py-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm sm:text-base font-semibold">Filters</h2>
          <button
            onClick={() => {
              setStatusFilter("All");
              setDateFrom("");
              setDateTo("");
              setSearchQuery("");
            }}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs sm:text-sm hover:bg-slate-900 hover:text-white transition-colors"
          >
            Reset Filters
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Status</label>
            <select
              className="rounded-lg border border-[var(--border-color)] bg-white px-3 py-2 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-slate-900/10"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All statuses</option>
              <option value="placed">Placed</option>
              <option value="packed">Packed</option>
              <option value="in_transit">In Transit</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">From date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-lg border border-[var(--border-color)] bg-white px-3 py-2 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-slate-900/10"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">To date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-lg border border-[var(--border-color)] bg-white px-3 py-2 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-slate-900/10"
            />
          </div>

          <div className="flex flex-col gap-1 sm:col-span-2 lg:col-span-2">
            <label className="text-xs font-medium text-slate-600">
              Search (Order ID, name, phone, area)
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type to search..."
              className="rounded-lg border border-[var(--border-color)] bg-white px-3 py-2 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-slate-900/10"
            />
          </div>
        </div>
      </div>

      {/* ORDERS LIST */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-semibold">
            Orders ({filteredOrders.length})
          </h2>
        </div>

        {filteredOrders.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
            No orders found for the current filters.
          </div>
        )}

        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const created = new Date(order.createdAt);
            const createdDate = created.toLocaleDateString();
            const createdTime = created.toLocaleTimeString();

            const areaText =
              typeof order.address.area === "object"
                ? `${order.address.area.name ?? ""} (${order.address.area.pincode ?? ""})`
                : order.address.area ?? "--";

            const statuses: OrderStatus[] = [
              "placed",
              "packed",
              "in_transit",
              "delivered",
              "cancelled",
              "refunded",
            ];

            return (
              <div
                key={order._id}
                className="rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.08)] hover:shadow-[0_10px_30px_rgba(15,23,42,0.18)] transition-all px-3 py-3 sm:px-4 sm:py-4"
              >
                {/* Top row */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs sm:text-sm font-semibold text-slate-900 break-all">
                        {order._id}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {createdDate} · {createdTime}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">
                      {order.items.length} items · Subtotal {formatINR(order.subTotal)} · Delivery{" "}
                      {formatINR(order.deliveryCharge)}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                    <div className="text-right">
                      <p className="text-[11px] uppercase tracking-wide text-slate-500">
                        Order Total
                      </p>
                      <p className="text-base sm:text-lg font-semibold text-slate-900">
                        {formatINR(order.total)}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium ${getStatusPillClass(
                        order.status,
                      )}`}
                    >
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                </div>

                {/* Content grid */}
                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                  {/* Customer */}
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Customer
                    </p>
                    <p className="text-sm font-medium text-slate-900">{order.address.name}</p>
                    <p className="text-xs text-slate-600">📞 {order.address.phone}</p>
                    <p className="text-xs text-slate-600">
                      📍 {order.address.address}
                      <br />
                      <span className="text-[11px] text-slate-500">Area: {areaText}</span>
                    </p>
                  </div>

                  {/* Items */}
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Items
                    </p>
                    <div className="max-h-28 overflow-y-auto pr-1 space-y-0.5 text-xs text-slate-700">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between gap-2">
                          <span className="truncate">
                            {item.name} / {item.inHindi} ({item.quantity} {item.unit})
                          </span>
                          <span className="shrink-0 font-medium">
                            {formatINR(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Payment + actions */}
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Payment
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-700">
                      {order.paymentMethod === "upi" ? (
                        <span className="rounded-full bg-indigo-50 text-indigo-700 px-3 py-1 text-[11px] font-medium">
                          UPI · {order.paymentStatus}
                        </span>
                      ) : (
                        <span className="rounded-full bg-orange-50 text-orange-700 px-3 py-1 text-[11px] font-medium">
                          COD · {order.paymentStatus}
                        </span>
                      )}

                      {order.upiId && (
                        <span className="text-[11px] text-slate-600">
                          UPI ID: <span className="font-medium">{order.upiId}</span>
                        </span>
                      )}
                      {order.utr && (
                        <span className="text-[11px] text-slate-600">
                          UTR: <span className="font-medium">{order.utr}</span>
                        </span>
                      )}
                      {order.upiTxnInfo?.txnRef && (
                        <span className="text-[11px] text-slate-600">
                          Txn Ref: <span className="font-medium">{order.upiTxnInfo.txnRef}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        onClick={() => printInvoice(order)}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-900 hover:text-white transition-colors shadow-sm"
                      >
                        Print Invoice
                      </button>
                    </div>
                  </div>
                </div>

                {/* STATUS BUTTON ROW */}
                <div className="mt-3 pt-3 border-t border-slate-100 -mx-1 px-1">
                  <div className="flex flex-wrap gap-2 justify-start">
                    {statuses.map((st) => {
                      const clickable = canChangeStatus(order.status, st);
                      return (
                        <button
                          key={st}
                          type="button"
                          disabled={!clickable}
                          onClick={() => handleStatusClick(order, st)}
                          className={getStatusButtonClass(order.status, st, clickable)}
                        >
                          {getStatusLabel(st)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
