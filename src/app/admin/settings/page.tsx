"use client";

import { useState } from "react";

type SettingSection = "general" | "profile" | "delivery" | "payment" | "notifications" ;

export default function SettingsPage() {
  const [active, setActive] = useState<SettingSection>("general");

  return (
    <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-color)" }}>
          Settings
        </h1>
      </header>

      {/* Tabs */}
      <nav className="flex flex-wrap gap-2 border-b pb-2" style={{ borderColor: "var(--border-color)" }}>
        {[
          { key: "general", label: "General" },
          { key: "delivery", label: "Delivery" },
          { key: "notifications", label: "Notifications" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key as SettingSection)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              active === tab.key ? "text-white" : ""
            }`}
            style={{
              backgroundColor: active === tab.key ? "var(--primary-color)" : "transparent",
              color: active === tab.key ? "#fff" : "var(--text-light)",
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <div className="rounded-xl p-4 border bg-white shadow-sm" style={{ borderColor: "var(--border-color)" }}>
        {active === "general" && <GeneralSettings />}
        {active === "delivery" && <DeliverySettings />}
        {active === "payment" && <PaymentSettings />}
        {active === "notifications" && <NotificationSettings />}
      </div>
    </div>
  );
}

function SectionWrapper({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold" style={{ color: "var(--text-color)" }}>
        {title}
      </h2>
      <div className="grid gap-4">{children}</div>
    </div>
  );
}

function InputField({
  label,
  type = "text",
  placeholder,
  defaultValue,
}: {
  label: string;
  type?: string;
  placeholder?: string;
  defaultValue?: string;
}) {
  return (
    <div>
      <label className="block text-sm mb-1" style={{ color: "var(--text-light)" }}>
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="w-full rounded-lg border px-3 py-2"
        style={{ borderColor: "var(--border-color)" }}
      />
    </div>
  );
}

function ToggleField({ label, defaultChecked }: { label: string; defaultChecked?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <input type="checkbox" defaultChecked={defaultChecked} className="h-4 w-4" />
      <span style={{ color: "var(--text-color)" }}>{label}</span>
    </div>
  );
}

/* === Individual Sections === */

function GeneralSettings() {
  return (
    <SectionWrapper title="General Settings">
      <InputField label="Website Name" defaultValue="My Shop" />
      <InputField label="Business Email" defaultValue="admin@myshop.com" />
      <InputField label="Business Phone" defaultValue="+91 9876543210" />
    </SectionWrapper>
  );
}



function DeliverySettings() {
  return (
    <SectionWrapper title="Delivery Settings">
      <InputField label="Free Delivery Above (₹)" type="number" defaultValue="500" />
      <InputField label="Delivery Time Window" defaultValue="9 AM - 9 PM" />
    </SectionWrapper>
  );
}

function PaymentSettings() {
  return (
    <SectionWrapper title="Payment Settings">
      <ToggleField label="Enable Cash on Delivery" defaultChecked />
      <InputField label="Razorpay API Key" placeholder="Enter Razorpay key" />
    </SectionWrapper>
  );
}

function NotificationSettings() {
  return (
    <SectionWrapper title="Notifications">
      <ToggleField label="Send Email Notifications" defaultChecked />
      <ToggleField label="Send SMS Notifications" />
    </SectionWrapper>
  );
}

