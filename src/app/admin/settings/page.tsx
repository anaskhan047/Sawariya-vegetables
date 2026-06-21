"use client";

import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import {
  buildDeliveryTimeLabel,
  formatTime12h,
  normalizeOrderWindowEnd24h,
  normalizeTime24h,
  time12hPartsTo24h,
  time24hTo12hParts,
} from "@/app/lib/orderWindow";

const HOUR_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, i) => i);

function Time12hPicker({
  label,
  hour,
  minute,
  period,
  onChange,
}: {
  label: string;
  hour: number;
  minute: number;
  period: "AM" | "PM";
  onChange: (next: { hour: number; minute: number; period: "AM" | "PM" }) => void;
}) {
  const preview24 = time12hPartsTo24h(hour, minute, period);

  return (
    <div>
      <p className="block text-sm mb-2 text-gray-600">{label}</p>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={hour}
          onChange={(e) => onChange({ hour: Number(e.target.value), minute, period })}
          className="rounded-lg border px-2 py-2 bg-white text-sm"
          aria-label={`${label} hour`}
        >
          {HOUR_OPTIONS.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
        <span className="text-slate-500">:</span>
        <select
          value={minute}
          onChange={(e) => onChange({ hour, minute: Number(e.target.value), period })}
          className="rounded-lg border px-2 py-2 bg-white text-sm"
          aria-label={`${label} minute`}
        >
          {MINUTE_OPTIONS.map((m) => (
            <option key={m} value={m}>
              {String(m).padStart(2, "0")}
            </option>
          ))}
        </select>
        <select
          value={period}
          onChange={(e) => onChange({ hour, minute, period: e.target.value as "AM" | "PM" })}
          className="rounded-lg border px-2 py-2 bg-white text-sm font-medium"
          aria-label={`${label} AM or PM`}
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
      <p className="text-xs text-gray-500 mt-1.5">
        {formatTime12h(preview24)} <span className="text-slate-400">({preview24})</span>
      </p>
    </div>
  );
}

export default function SettingsPage() {
  const [businessEmail, setBusinessEmail] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [deliveryCharge, setDeliveryCharge] = useState<number>(40);
  const [startHour, setStartHour] = useState(8);
  const [startMinute, setStartMinute] = useState(0);
  const [startPeriod, setStartPeriod] = useState<"AM" | "PM">("AM");
  const [endHour, setEndHour] = useState(11);
  const [endMinute, setEndMinute] = useState(59);
  const [endPeriod, setEndPeriod] = useState<"AM" | "PM">("PM");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const orderWindowStart = useMemo(
    () => time12hPartsTo24h(startHour, startMinute, startPeriod),
    [startHour, startMinute, startPeriod]
  );
  const orderWindowEnd = useMemo(
    () => normalizeOrderWindowEnd24h(orderWindowStart, time12hPartsTo24h(endHour, endMinute, endPeriod)),
    [orderWindowStart, endHour, endMinute, endPeriod]
  );

  const previewLabel = useMemo(
    () => buildDeliveryTimeLabel(orderWindowStart, orderWindowEnd),
    [orderWindowStart, orderWindowEnd]
  );

  function applySettingsToForm(s: Record<string, unknown>) {
    setBusinessEmail(typeof s.businessEmail === "string" ? s.businessEmail : "");
    setBusinessPhone(typeof s.businessPhone === "string" ? s.businessPhone : "");
    setDeliveryCharge(typeof s.deliveryCharge === "number" ? s.deliveryCharge : 40);

    const start24 = normalizeTime24h(s.orderWindowStart, "08:00");
    const end24 = normalizeOrderWindowEnd24h(
      start24,
      normalizeTime24h(s.orderWindowEnd, "23:59")
    );
    const startParts = time24hTo12hParts(start24);
    const endParts = time24hTo12hParts(end24);
    setStartHour(startParts.hour);
    setStartMinute(startParts.minute);
    setStartPeriod(startParts.period);
    setEndHour(endParts.hour);
    setEndMinute(endParts.minute);
    setEndPeriod(endParts.period);
  }

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
          orderWindowStart,
          orderWindowEnd,
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
              Set opening and closing time with <strong>AM / PM</strong>. Example: 8:00 AM to 11:59 PM.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Time12hPicker
              label="Opens at"
              hour={startHour}
              minute={startMinute}
              period={startPeriod}
              onChange={({ hour, minute, period }) => {
                setStartHour(hour);
                setStartMinute(minute);
                setStartPeriod(period);
              }}
            />
            <Time12hPicker
              label="Closes at"
              hour={endHour}
              minute={endMinute}
              period={endPeriod}
              onChange={({ hour, minute, period }) => {
                setEndHour(hour);
                setEndMinute(minute);
                setEndPeriod(period);
              }}
            />
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
