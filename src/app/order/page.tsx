"use client";

import React, { JSX, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

const ORDER_STATUSES = [
  { key: "placed", label: "Placed", color: "bg-gray-400" },
  { key: "packed", label: "Packed", color: "bg-yellow-400" },
  { key: "in_transit", label: "In Transit", color: "bg-blue-400" },
  { key: "delivered", label: "Delivered", color: "bg-green-500" },
  { key: "cancelled", label: "Cancelled", color: "bg-red-500" },
  { key: "refunded", label: "Refunded", color: "bg-purple-500" },
] as const;

type OrderStatus = (typeof ORDER_STATUSES)[number]["key"];

type OrderItem = {
  name: string;
  quantity: number;
  price: number;
  unit: string;
  inHindi?: string;
};

type OrderAddressArea = {
  name?: string;
  pincode?: string;
};

type OrderAddress =
  | {
      name?: string;
      phone?: string;
      address?: string;
      area?: string | OrderAddressArea;
      inHindi?: string;
    }
  | null
  | undefined;

type OrderUpiTxnInfo = {
  txnRef?: string;
};

type Order = {
  _id: string;
  user: string;
  items: OrderItem[];
  address?: OrderAddress;
  subTotal: number;
  deliveryCharge: number;
  total: number;
  status: OrderStatus;
  paymentMethod: "online" | "cod" | "upi";
  paymentStatus: string;
  createdAt: string;
  otp?: string;
  otpExpiresAt?: string;

  // extra fields used in invoice/bill design
  couponCode?: string;
  discount?: number;
  upiId?: string;
  utr?: string;
  upiTxnInfo?: OrderUpiTxnInfo;
};

function toStr(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return fallback;
}

function toNum(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function normalizeOrder(raw: unknown): Order | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;

  const id = toStr(o._id);
  if (!id) return null;

  const rawItems = Array.isArray(o.items) ? o.items : [];
  const items: OrderItem[] = rawItems.reduce<OrderItem[]>((acc, it) => {
    if (!it || typeof it !== "object") return acc;
    const item = it as Record<string, unknown>;
    const name = toStr(item.name);
    if (!name) return acc;
    acc.push({
      name,
      inHindi: toStr(item.inHindi) || undefined,
      quantity: toNum(item.quantity, 0),
      price: toNum(item.price, 0),
      unit: toStr(item.unit, "unit"),
    });
    return acc;
  }, []);

  const addressRaw = (o.address && typeof o.address === "object"
    ? (o.address as Record<string, unknown>)
    : {}) as Record<string, unknown>;

  let normalizedArea: string | OrderAddressArea | undefined = undefined;
  if (typeof addressRaw.area === "string") {
    normalizedArea = addressRaw.area;
  } else if (addressRaw.area && typeof addressRaw.area === "object") {
    const a = addressRaw.area as Record<string, unknown>;
    normalizedArea = {
      name: toStr(a.name) || undefined,
      pincode: toStr(a.pincode) || undefined,
    };
  }

  const statusRaw = toStr(o.status, "placed") as OrderStatus;
  const safeStatus: OrderStatus = ORDER_STATUSES.some((s) => s.key === statusRaw)
    ? statusRaw
    : "placed";

  const paymentRaw = toStr(o.paymentMethod, "cod");
  const safePayment: "online" | "cod" | "upi" =
    paymentRaw === "online" || paymentRaw === "upi" ? paymentRaw : "cod";

  return {
    _id: id,
    user: toStr(o.user),
    items,
    address: {
      name: toStr(addressRaw.name) || undefined,
      phone: toStr(addressRaw.phone) || undefined,
      address: toStr(addressRaw.address) || undefined,
      area: normalizedArea,
    },
    subTotal: toNum(o.subTotal, items.reduce((s, it) => s + it.price * it.quantity, 0)),
    deliveryCharge: toNum(o.deliveryCharge, 0),
    total: toNum(o.total, 0),
    status: safeStatus,
    paymentMethod: safePayment,
    paymentStatus: toStr(o.paymentStatus, "pending"),
    createdAt: toStr(o.createdAt, new Date().toISOString()),
    otp: toStr(o.otp) || undefined,
    otpExpiresAt: toStr(o.otpExpiresAt) || undefined,
    couponCode: toStr(o.couponCode) || undefined,
    discount: toNum(o.discount, 0),
    upiId: toStr(o.upiId) || undefined,
    utr: toStr(o.utr) || undefined,
    upiTxnInfo:
      o.upiTxnInfo && typeof o.upiTxnInfo === "object"
        ? { txnRef: toStr((o.upiTxnInfo as Record<string, unknown>).txnRef) || undefined }
        : undefined,
  };
}

function normalizeOrdersList(input: unknown): Order[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((entry) => normalizeOrder(entry))
    .filter((x): x is Order => Boolean(x));
}

function isOrderItem(x: unknown): x is OrderItem {
  if (typeof x !== "object" || x === null) return false;
  const obj = x as Record<string, unknown>;
  return (
    typeof obj.name === "string" &&
    typeof obj.quantity === "number" &&
    typeof obj.price === "number" &&
    typeof obj.unit === "string"
  );
}

function isAddressArea(x: unknown): x is OrderAddressArea {
  if (typeof x !== "object" || x === null) return false;
  const obj = x as Record<string, unknown>;
  return (
    (obj.name === undefined || typeof obj.name === "string") &&
    (obj.pincode === undefined || typeof obj.pincode === "string")
  );
}

function isAddress(x: unknown): x is OrderAddress {
  if (x === null || x === undefined) return true;
  if (typeof x !== "object") return false;
  const obj = x as Record<string, unknown>;
  const area = obj.area;
  const areaOk =
    area === undefined || typeof area === "string" || isAddressArea(area);
  return (
    (obj.name === undefined || typeof obj.name === "string") &&
    (obj.phone === undefined || typeof obj.phone === "string") &&
    (obj.address === undefined || typeof obj.address === "string") &&
    areaOk
  );
}

function isOrder(x: unknown): x is Order {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;
  if (typeof o._id !== "string") return false;
  if (typeof o.user !== "string") return false;
  if (!Array.isArray(o.items) || o.items.some((i) => !isOrderItem(i)))
    return false;
  if (!isAddress(o.address)) return false;
  if (typeof o.subTotal !== "number") return false;
  if (typeof o.deliveryCharge !== "number") return false;
  if (typeof o.total !== "number") return false;
  if (typeof o.status !== "string") return false;
  if (!["online", "cod", "upi"].includes(String(o.paymentMethod))) return false;
  if (typeof o.paymentStatus !== "string") return false;
  if (typeof o.createdAt !== "string") return false;
  return true;
}

function isOrdersArray(x: unknown): x is Order[] {
  return Array.isArray(x) && x.every(isOrder);
}

function getOrderTimelineHtml(order: Order) {
  const statusIdx = ORDER_STATUSES.findIndex((s) => s.key === order.status);
  return `
    <div class="flex flex-col gap-4 py-2">
      ${ORDER_STATUSES.map(
        (s, idx) => `
        <div class="flex items-center gap-3">
          <div class="flex items-center justify-center h-5 w-5 rounded-full ${
            idx <= statusIdx ? s.color : "bg-gray-200"
          }">
            ${
              idx <= statusIdx
                ? `
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="5" fill="white" />
              </svg>
            `
                : ``
            }
          </div>
          <div class="text-sm ${
            idx <= statusIdx ? "font-bold text-black" : "text-gray-400"
          }">${s.label}</div>
        </div>
      `
      ).join("")}
    </div>
  `;
}

// ===== Invoice helpers (for bill PDF/print) =====

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

function generateInvoiceNumber(order: Order): string {
  const datePart = new Date(order.createdAt)
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "");
  const idPart = order._id.slice(-4).toUpperCase();
  return `SSM-${datePart}-${idPart}`;
}

function buildInvoiceHtml(order: Order): string {
  const companyName = "Shri Sawariya Mart";
  const companySubHeading = "Fresh Vegetables & Fruits";
  const logoUrl = `${window.location.origin}/logo/logo.png`;

  const invoiceNumber = generateInvoiceNumber(order);

  const createdDate = new Date(order.createdAt);
  const orderDateStr = createdDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const orderTimeStr = createdDate.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const address = order.address?.address ?? "--";
  const area =
    typeof order.address?.area === "object"
      ? `${order.address?.area?.name ?? ""}${
          order.address?.area?.pincode
            ? ` (${order.address?.area?.pincode})`
            : ""
        }`.trim() || "--"
      : order.address?.area ?? "--";

  const subTotal = order.subTotal;
  const deliveryCharge = order.deliveryCharge;
  const discount = order.discount ?? 0;
  const grandTotal = order.total;
  const couponCode = order.couponCode ?? "N/A";

  const itemsHtml = order.items
    .map((item, idx) => {
      const productName = `${item.name}${
        item.inHindi ? ` / ${item.inHindi}` : ""
      }`;
      // price is already for that quantity (as used in UI)
      const unitLabel = `${item.quantity} ${item.unit}`;
      const lineTotal = item.price;
      return `
        <tr>
          <td>${idx + 1}</td>
          <td>${escapeHtml(productName)}</td>
          <td class="right">${escapeHtml(unitLabel)}</td>
          <td class="center">1</td>
          <td class="right">${formatINR(lineTotal)}</td>
        </tr>
      `;
    })
    .join("");

  const paymentModeLabel =
    order.paymentMethod === "upi"
      ? "UPI"
      : order.paymentMethod === "online"
      ? "Online"
      : "Cash On Delivery";

  const html = `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Invoice - ${invoiceNumber}</title>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <style>
          /* Thermal / receipt style */
          @page { margin: 0; }
          html,body{
            margin:0;
            padding:0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans";
            color:#000;
          }
          .receipt {
            width: 320px; /* ~72mm thermal width; adjust if needed */
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
          .no-print { display:none; }
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
    companyName
  )} Logo" style="max-width:120px; max-height:60px; object-fit:contain; margin-bottom:6px;" onerror="this.style.display='none'"/>
            <h1>${escapeHtml(companyName)}</h1>
            <h2>${escapeHtml(companySubHeading)}</h2>
            <p class="small">Invoice: <b>${escapeHtml(invoiceNumber)}</b></p>
            <p class="small">Order ID: <b>${escapeHtml(order._id)}</b></p>
            <p class="small">${escapeHtml(orderDateStr)} ${escapeHtml(
    orderTimeStr
  )}</p>
          </div>

          <div class="line"></div>

          <div>
            <p style="margin-bottom:6px;"><b>Bill To:</b> <b class="capitalize">${escapeHtml(
              order.address?.name ?? "Customer"
            )}</b></p>
            <p class="small">ðŸ“ž ${escapeHtml(order.address?.phone ?? "--")}</p>
            <p class="small">ðŸ“ ${escapeHtml(address)}</p>
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
                <td class="small">Discount (${escapeHtml(String(
                  couponCode
                ))})</td>
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
            paymentModeLabel
          )}</p>
          ${
            order.upiId
              ? `<p class="small"><b>UPI ID:</b> ${escapeHtml(order.upiId)}</p>`
              : ""
          }
          ${
            order.utr
              ? `<p class="small"><b>UTR:</b> ${escapeHtml(order.utr)}</p>`
              : ""
          }
          ${
            order.upiTxnInfo?.txnRef
              ? `<p class="small"><b>Txn Ref:</b> ${escapeHtml(
                  order.upiTxnInfo.txnRef
                )}</p>`
              : ""
          }

          <div class="line"></div>

          <p class="center note">Thank you for shopping with ${escapeHtml(
            companyName
          )}!</p>

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

  return html;
}

function openInvoiceWindow(order: Order) {
  const html = buildInvoiceHtml(order);
  const win = window.open("", "_blank", "width=400,height=600");
  if (!win) {
    void Swal.fire(
      "Popup blocked",
      "Please allow popups to download the bill.",
      "warning"
    );
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}

// ===== Countdown component (same as before) =====

function Countdown({
  createdAt,
  onExpired,
}: {
  createdAt: string;
  onExpired?: () => void;
}) {
  const FIVE_MIN_MS = 5 * 60 * 1000;
  const createdTs = new Date(createdAt).getTime();
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = Math.max(0, FIVE_MIN_MS - (now - createdTs));
  useEffect(() => {
    if (remaining === 0 && onExpired) onExpired();
  }, [remaining, onExpired]);

  const mm = Math.floor(remaining / 60000)
    .toString()
    .padStart(2, "0");
  const ss = Math.floor((remaining % 60000) / 1000)
    .toString()
    .padStart(2, "0");
  return <span className="text-xs text-gray-500">{mm}:{ss}</span>;
}

export default function UserOrderList(): JSX.Element {
  const PAGE_SIZE = 20;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const token = localStorage.getItem("token");

    (async () => {
      try {
        const headers: HeadersInit = {};
        if (token) headers.Authorization = `Bearer ${token}`;
        const res = await fetch("/api/orders", {
          method: "GET",
          headers,
          cache: "no-store",
          signal: controller.signal,
        });

        const text = await res.text();
        let parsed: unknown = {};
        try {
          parsed = text ? JSON.parse(text) : {};
        } catch (err) {
          console.warn("Could not parse /api/orders JSON:", err);
          parsed = {};
        }

        if (!mounted) return;

        if (res.status === 401) {
          localStorage.removeItem("token");
          setOrders([]);
          return;
        }

        if (typeof parsed === "object" && parsed !== null && "orders" in parsed) {
          const candidate = (parsed as Record<string, unknown>).orders;
          const normalized = normalizeOrdersList(candidate);
          if (normalized.length > 0 || (Array.isArray(candidate) && candidate.length === 0)) {
            setOrders(normalized);
            return;
          }
        }

        const normalizedDirect = normalizeOrdersList(parsed);
        if (normalizedDirect.length > 0 || (Array.isArray(parsed) && parsed.length === 0)) {
          setOrders(normalizedDirect);
          return;
        }

        console.warn("/api/orders responded but no valid orders array found", {
          status: res.status,
          parsed,
        });
        setOrders([]);
      } catch (err) {
        if (!mounted) return;
        const name = (err as Error).name;
        if (name === "AbortError") return;
        console.error("Fetch /api/orders failed:", err);
        setOrders([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [orders.length]);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node) return;
    if (visibleCount >= orders.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first?.isIntersecting) return;
        setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, orders.length));
      },
      { root: null, rootMargin: "320px 0px", threshold: 0.1 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [orders.length, visibleCount]);

  const cancelOrder = async (orderId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        await Swal.fire("Error", "Please login again", "error");
        return;
      }

      setCancellingId(orderId);
      const res = await fetch("/api/orders/cancel", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId }),
      });

      const text = await res.text();
      let parsed: unknown = {};
      try {
        parsed = text ? JSON.parse(text) : {};
      } catch (err) {
        console.warn("Could not parse /api/orders/cancel JSON:", err);
        parsed = {};
      }

      setCancellingId(null);

      if (!res.ok) {
        const message =
          typeof parsed === "object" && parsed !== null && "message" in parsed
            ? String((parsed as Record<string, unknown>).message)
            : "Failed to cancel";
        await Swal.fire("Error", message, "error");
        return;
      }

      if (typeof parsed === "object" && parsed !== null && "order" in parsed) {
        const candidate = (parsed as Record<string, unknown>).order;
        if (isOrder(candidate)) {
          setOrders((prev) =>
            prev.map((o) => (o._id === orderId ? candidate : o))
          );
          await Swal.fire(
            "Cancelled",
            "Your order has been cancelled and stock restored.",
            "success"
          );
          return;
        }
      }

      if (isOrdersArray(parsed)) {
        setOrders(parsed);
        await Swal.fire(
          "Cancelled",
          "Your order has been cancelled and stock restored.",
          "success"
        );
        return;
      }

      await Swal.fire(
        "Cancelled",
        "Your order cancellation was processed.",
        "success"
      );
    } catch (err) {
      console.error(err);
      setCancellingId(null);
      await Swal.fire("Error", "Something went wrong", "error");
    }
  };

  const canCancelLocal = (order: Order) => {
    if (order.status !== "placed") return false;
    const createdTs = new Date(order.createdAt).getTime();
    return Date.now() - createdTs <= 5 * 60 * 1000;
  };

  const visibleOrders = orders.slice(0, visibleCount);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <p className="text-gray-600">Loading your orders...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-slate-50 px-1.5 py-3 sm:px-3 md:px-6 md:py-6">
      <div className="mx-auto w-full max-w-6xl rounded-2xl border border-emerald-100 bg-white/90 p-2 shadow-sm backdrop-blur-sm sm:p-3 md:p-6">
        <h1 className="mt-2 mb-4 text-xl font-bold tracking-tight text-slate-900 sm:mt-6 sm:text-2xl">
          My Orders
        </h1>

        {orders.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            No orders yet
          </div>
        )}

        <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full table-fixed border-separate border-spacing-y-1.5 text-sm">
            <thead>
              <tr className="bg-emerald-600 text-white">
                <th className="w-[13%] px-3 py-2 text-left">Customer</th>
                <th className="w-[19%] px-3 py-2 text-left">Items</th>
                <th className="w-[8%] px-3 py-2 text-left">Total</th>
                <th className="w-[10%] px-3 py-2 text-left">Status</th>
                <th className="w-[10%] px-3 py-2 text-left">Payment</th>
                <th className="w-[16%] px-3 py-2 text-left">Address</th>
                <th className="w-[10%] px-3 py-2 text-left">Area</th>
                <th className="w-[8%] px-3 py-2 text-left">OTP</th>
                <th className="w-[16%] px-3 py-2 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleOrders.map((order) => {
                const canCancel = canCancelLocal(order);
                return (
                  <tr
                    key={order._id}
                    className="rounded-xl border bg-white align-top transition hover:bg-slate-50/70"
                  >
                    <td className="px-4 py-2">
                      <div className="font-medium">
                        {order.address?.name ?? "Unknown"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {order.address?.phone ?? "N/A"}
                      </div>
                      {canCancel && (
                        <div className="mt-1 text-xs">
                          <Countdown createdAt={order.createdAt} />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2 text-gray-600">
                      {order.items.map((i, idx) => (
                        <div
                          key={idx}
                          className="mb-1 break-words text-xs leading-4 last:mb-0"
                        >
                          {i.name}
                          {i.inHindi ? ` / ${i.inHindi}` : ""} ({i.quantity}{" "}
                          {i.unit}) - Rs {i.price}
                        </div>
                      ))}
                    </td>
                    <td className="px-4 py-2 font-semibold text-slate-900">
                      Rs {order.total}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs
                        ${
                          order.status === "delivered"
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
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {order.paymentMethod === "online" ? (
                        <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs text-indigo-700">
                          Online
                        </span>
                      ) : order.paymentMethod === "upi" ? (
                        <span className="rounded-full bg-purple-100 px-3 py-1 text-xs text-purple-700">
                          UPI
                        </span>
                      ) : (
                        <span className="rounded-full bg-orange-100 px-3 py-1 text-xs text-orange-700">
                          COD
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {order.address?.address ?? "--"}
                    </td>
                    <td className="px-4 py-2">
                      {typeof order.address?.area === "object"
                        ? `${order.address?.area?.name ?? ""} (${order.address?.area?.pincode ?? ""})`
                        : order.address?.area || "--"}
                    </td>
                    <td className="px-4 py-2">
                      {order.otp ? (
                        <span className="rounded bg-yellow-100 px-3 py-1 font-mono text-yellow-700">
                          {order.otp}
                        </span>
                      ) : (
                        "- -"
                      )}
                      {/* {order.otpExpiresAt && (
                        <div className="text-xs text-gray-400">
                          Exp:{" "}
                          {new Date(order.otpExpiresAt).toLocaleTimeString([], {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      )} */}
                    </td>
                    <td className="px-4 py-2">
                      <button
                        className="mb-2 inline-flex w-full items-center justify-center rounded-md bg-emerald-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                        onClick={() => openInvoiceWindow(order)}
                      >
                        Download Bill
                      </button>

                      <button
                        className="mb-2 inline-flex w-full items-center justify-center rounded-md bg-sky-500 px-2 py-1.5 text-xs font-medium text-white hover:bg-sky-700"
                        onClick={() => {
                          Swal.fire({
                            title: "Order Details",
                            html: `
                              ${getOrderTimelineHtml(order)}
                              <div class="mt-4 text-left capitalize">
                                <b>Name:</b> ${order.address?.name ?? "N/A"} <br/>
                                <b>Phone:</b> ${order.address?.phone ?? "N/A"} <br/>
                                <b>Address:</b> ${order.address?.address ?? "--"} <br/>
                                <b>Area:</b> ${
                                  typeof order.address?.area === "object"
                                    ? `${order.address?.area?.name ?? ""} (${order.address?.area?.pincode ?? ""})`
                                    : order.address?.area || "--"
                                } <br/>
                                <b>Product(s):</b> ${order.items
                                  .map(
                                    (i) =>
                                      `${i.name}${i.inHindi ? ` / ${i.inHindi}` : ""} (${i.quantity} ${i.unit}) - Rs ${i.price}`
                                  )
                                  .join(", ")} <br/>
                                <b>Total:</b> Rs ${order.total} <br/>
                                <b>Payment:</b> ${order.paymentMethod.toUpperCase()}<br/>
                                <b>Status:</b> ${order.status}<br/>
                                <b>Placed at:</b> ${new Date(order.createdAt).toLocaleString()}<br/>
                              </div>
                            `,
                            showCloseButton: true,
                            confirmButtonText: "Close",
                            width: 400,
                            customClass: { popup: "swal2-rounded" },
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
                              if (res.isConfirmed) void cancelOrder(order._id);
                            });
                          }}
                          className="inline-flex w-full items-center justify-center rounded-md bg-red-500 px-2 py-1.5 text-xs font-medium text-white disabled:opacity-60"
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

        <div className="grid grid-cols-1 gap-3 md:hidden">
          {visibleOrders.map((order, index) => {
            const canCancel = canCancelLocal(order);
            return (
              <motion.div
                key={order._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, delay: Math.min(index * 0.03, 0.24) }}
                className="rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm"
              >
                <div className="mb-1 text-base font-semibold leading-5 text-slate-900">
                  {order.address?.name ?? "Unknown"}
                </div>
                <div className="mb-1 text-xs text-slate-500">
                  {order.address?.phone ?? "N/A"}
                </div>
                <div className="mb-2 rounded-lg bg-slate-50 p-2 text-xs leading-5 text-slate-700">
                  <div>
                    <span className="font-medium">Address: </span>
                    {order.address?.address ?? "--"}
                  </div>
                  <div>
                    <span className="font-medium">Area: </span>
                    {typeof order.address?.area === "object"
                      ? `${order.address?.area?.name ?? ""} (${order.address?.area?.pincode ?? ""})`
                      : order.address?.area || "- -"}
                  </div>
                </div>
                <div className="mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Products
                  </span>
                  <ul className="mt-1 space-y-1">
                    {order.items.map((i, idx) => (
                      <li
                        key={idx}
                        className="rounded-md bg-slate-50 px-2 py-1 text-xs text-slate-700"
                      >
                        {i.name}
                        {i.inHindi ? ` / ${i.inHindi}` : ""} ({i.quantity}{" "}
                        {i.unit}) - Rs {i.price}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mb-2 text-sm">
                  <span className="font-medium">Total: </span>Rs {order.total}
                </div>
                <div className="mb-2 text-xs">
                  <span className="font-medium">OTP: </span>
                  {order.otp ? (
                    <span className="rounded bg-amber-100 px-2 py-0.5 font-mono text-amber-700">
                      {order.otp}
                    </span>
                  ) : (
                    "- -"
                  )}
                </div>
                <div className="mb-2 text-xs">
                  <span className="font-medium">Payment: </span>
                  {order.paymentMethod === "online"
                    ? "Online"
                    : order.paymentMethod === "upi"
                    ? "UPI"
                    : "COD"}
                </div>
                <div className="mb-2 text-xs">
                  <span className="font-medium">Status: </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs ${
                      order.status === "delivered"
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
                    }`}
                  >
                    {order.status}
                  </span>
                  {canCancel && (
                    <div className="mt-1">
                      <Countdown createdAt={order.createdAt} />
                    </div>
                  )}
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    className="rounded-md bg-emerald-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                    onClick={() => openInvoiceWindow(order)}
                  >
                    Download Bill
                  </button>

                  <button
                    className="rounded-md bg-sky-500 px-2 py-1.5 text-xs font-medium text-white hover:bg-sky-700"
                    onClick={() => {
                      Swal.fire({
                        title: "Order Details",
                        html: `
                          ${getOrderTimelineHtml(order)}
                          <div class="mt-4 text-left capitalize">
                            <b>Name:</b> ${order.address?.name ?? "N/A"} <br/>
                            <b>Phone:</b> ${order.address?.phone ?? "N/A"} <br/>
                            <b>Address:</b> ${order.address?.address ?? "--"} <br/>
                            <b>Area:</b> ${
                              typeof order.address?.area === "object"
                                ? `${order.address?.area?.name ?? ""} (${order.address?.area?.pincode ?? ""})`
                                : order.address?.area || "--"
                            } <br/>
                            <b>Product(s):</b> ${order.items
                              .map(
                                (i) =>
                                  `${i.name}${i.inHindi ? ` / ${i.inHindi}` : ""} (${i.quantity} ${i.unit}) - Rs ${i.price}`
                              )
                              .join(", ")} <br/>
                            <b>Total:</b> Rs ${order.total} <br/>
                            <b>Payment:</b> ${order.paymentMethod.toUpperCase()}<br/>
                            <b>Status:</b> ${order.status}<br/>
                            <b>Placed at:</b> ${new Date(order.createdAt).toLocaleString()}<br/>
                          </div>
                        `,
                        showCloseButton: true,
                        confirmButtonText: "Close",
                        width: 400,
                        customClass: { popup: "swal2-rounded" },
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
                          if (res.isConfirmed) void cancelOrder(order._id);
                        });
                      }}
                      className="col-span-2 rounded-md bg-red-500 px-2 py-1.5 text-xs font-medium text-white disabled:opacity-60"
                      disabled={cancellingId === order._id}
                    >
                      {cancellingId === order._id ? "Cancelling..." : "Cancel"}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {visibleCount < orders.length && (
          <div className="mt-4 flex flex-col items-center justify-center gap-2">
            <div ref={loadMoreRef} className="h-3 w-full" />
            <p className="text-xs text-slate-500">
              Loading more orders... ({visibleCount}/{orders.length})
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
