"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";

export default function SettingsPage() {
  const [businessEmail, setBusinessEmail] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [deliveryCharge, setDeliveryCharge] = useState<number>(40);
  const [deliveryTimeWindow, setDeliveryTimeWindow] = useState("9 AM - 9 PM");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/admin/settings");
        const data = await res.json();
        if (data.success && data.settings) {
          const s = data.settings;
          setBusinessEmail(s.businessEmail);
          setBusinessPhone(s.businessPhone);
          setDeliveryCharge(s.deliveryCharge);
          setDeliveryTimeWindow(s.deliveryTimeWindow);
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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          businessEmail,
          businessPhone,
          deliveryCharge,
          deliveryTimeWindow,
        }),
      });

      const data = await res.json();
      setSaving(false);

      if (data.success) {
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

        <div>
          <label className="block text-sm mb-1 text-gray-600">Delivery Time Window</label>
          <input
            type="text"
            value={deliveryTimeWindow}
            onChange={(e) => setDeliveryTimeWindow(e.target.value)}
            className="w-full rounded-lg border px-3 py-2"
          />
          <p className="text-xs text-gray-500 mt-1">Example: 9 AM - 9 PM</p>
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
