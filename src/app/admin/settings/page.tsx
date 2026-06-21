"use client";

import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { buildDeliveryTimeLabel, formatTime12h, normalizeTime24h } from "@/app/lib/orderWindow";

export default function SettingsPage() {
  const [businessEmail, setBusinessEmail] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [deliveryCharge, setDeliveryCharge] = useState<number>(40);
  const [orderWindowStart, setOrderWindowStart] = useState("08:00");
  const [orderWindowEnd, setOrderWindowEnd] = useState("00:00");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  function applySettingsToForm(s: Record<string, unknown>) {
    setBusinessEmail(typeof s.businessEmail === "string" ? s.businessEmail : "");
    setBusinessPhone(typeof s.businessPhone === "string" ? s.businessPhone : "");
    setDeliveryCharge(typeof s.deliveryCharge === "number" ? s.deliveryCharge : 40);
    setOrderWindowStart(normalizeTime24h(s.orderWindowStart, "08:00"));
    setOrderWindowEnd(normalizeTime24h(s.orderWindowEnd, "00:00"));
  }

  const previewLabel = useMemo(
    () => buildDeliveryTimeLabel(orderWindowStart, orderWindowEnd),
    [orderWindowStart, orderWindowEnd]
  );

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/admin/settings", { cache: "no-store" });
        const data = await res.json();
        if (data.success && data.settings) {
          applySettingsToForm(data.settings as Record<string, unknown>);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  async function saveSettings() {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        return Swal.fire("Unauthorized", "Login as admin first", "warning");
      }

      setSaving(true);
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          businessEmail,
          businessPhone,
          deliveryCharge,
          orderWindowStart: normalizeTime24h(orderWindowStart, "08:00"),
          orderWindowEnd: normalizeTime24h(orderWindowEnd, "00:00"),
        }),
      });

      const data = await res.json();
      setSaving(false);

      if (data.success && data.settings) {
        applySettingsToForm(data.settings as Record<string, unknown>);
        Swal.fire("Saved", "Settings updated successfully", "success");
      } else if (data.success) {
        Swal.fire("Saved", "Settings updated successfully", "success");
      } else {
        Swal.fire("Error", data.message || "Failed to save", "error");
      }
    } catch (err) {
      console.error("Save error:", err);
      setSaving(false);
      Swal.fire("Error", "Failed to save settings", "error");
    }
  }

  if (loading) return <div className="text-center py-10">Loading settings...</div>;

  return (
    <div className="container mx-auto max-w-4xl p-6 space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
        <div>
          <label className="block text-sm mb-1 text-gray-600">Business Email</label>
          <input
            type="email"
            value={businessEmail}
            onChange={(e) => setBusinessEmail(e.target.value)}
            className="w-full rounded-lg border px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm mb-1 text-gray-600">Business Phone</label>
          <input
            type="text"
            value={businessPhone}
            onChange={(e) => setBusinessPhone(e.target.value)}
            className="w-full rounded-lg border px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm mb-1 text-gray-600">Delivery Charge (₹)</label>
          <input
            type="number"
            value={deliveryCharge}
            onChange={(e) => setDeliveryCharge(Number(e.target.value || 0))}
            className="w-full rounded-lg border px-3 py-2"
          />
        </div>

        <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-emerald-900">Order acceptance window</h2>
            <p className="text-xs text-gray-600 mt-1">
              Customers can add to cart anytime. Checkout is allowed only between these times (24-hour clock).
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="orderWindowStart" className="block text-sm mb-1 text-gray-600">
                Opens at
              </label>
              <input
                id="orderWindowStart"
                type="time"
                value={orderWindowStart}
                onChange={(e) => setOrderWindowStart(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 bg-white"
              />
              <p className="text-xs text-gray-500 mt-1">{formatTime12h(orderWindowStart)}</p>
            </div>
            <div>
              <label htmlFor="orderWindowEnd" className="block text-sm mb-1 text-gray-600">
                Closes at
              </label>
              <input
                id="orderWindowEnd"
                type="time"
                value={orderWindowEnd}
                onChange={(e) => setOrderWindowEnd(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 bg-white"
              />
              <p className="text-xs text-gray-500 mt-1">
                {orderWindowEnd === "00:00"
                  ? "12:00 AM (midnight) — end of day"
                  : formatTime12h(orderWindowEnd)}
              </p>
            </div>
          </div>

          <p className="text-sm text-slate-700">
            Shown to customers: <span className="font-semibold text-emerald-800">{previewLabel}</span>
          </p>
        </div>

        <div className="flex justify-end">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
