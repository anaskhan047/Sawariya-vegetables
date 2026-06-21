"use client";

import React, { useEffect, useState } from "react";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import Swal from "sweetalert2";
import { z } from "zod";

export const MessageSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  number: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number too long"),
  email: z.string().email("Invalid email address"),
  message: z.string().min(10, "Message must be at least 10 characters").max(500),
  status: z.enum(["New", "Replied"]).optional(),
  createdAt: z.string().optional(),
});

export type MessageSchemaType = z.infer<typeof MessageSchema>;

type SettingsShape = {
  businessEmail?: string;
  businessPhone?: string;
  deliveryTimeWindow?: string;
};

export default function ContactInfo() {
  const [form, setForm] = useState<MessageSchemaType>({
    name: "",
    email: "",
    number: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [businessEmail, setBusinessEmail] = useState<string>("contact@sawariyavegetable.com");
  const [businessPhone, setBusinessPhone] = useState<string>("+91 98765 43210");
  const [deliveryTimeWindow, setDeliveryTimeWindow] = useState<string>("Mon - Sat: 9:00 AM - 8:00 PM");

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      try {
        setSettingsLoading(true);
        const res = await fetch("/api/admin/settings", { cache: "no-store" });
        const data = await res.json();
        if (!cancelled && data?.success && data.settings) {
          const s = data.settings as SettingsShape;
          if (typeof s.businessEmail === "string" && s.businessEmail.trim()) setBusinessEmail(s.businessEmail);
          if (typeof s.businessPhone === "string" && s.businessPhone.trim()) setBusinessPhone(s.businessPhone);
          if (typeof s.deliveryTimeWindow === "string" && s.deliveryTimeWindow.trim()) setDeliveryTimeWindow(s.deliveryTimeWindow);
        }
      } catch (err) {
        console.warn("Failed to load settings for contact info:", err);
      } finally {
        if (!cancelled) setSettingsLoading(false);
      }
    }

    loadSettings();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    const validation = MessageSchema.safeParse(form);
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || "Invalid input";
      await Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: firstError,
        confirmButtonColor: "#0f766e",
      });
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (data?.success) {
        await Swal.fire({
          icon: "success",
          title: "Message Sent",
          text: "Your message has been sent successfully.",
          confirmButtonColor: "#0f766e",
        });
        setForm({ name: "", email: "", number: "", message: "" });
      } else {
        await Swal.fire({
          icon: "error",
          title: "Failed",
          text: data?.message || "Failed to send message. Try again.",
          confirmButtonColor: "#dc2626",
        });
      }
    } catch (err) {
      await Swal.fire({
        icon: "error",
        title: "Server Error",
        text: "Something went wrong. Please try later.",
        confirmButtonColor: "#dc2626",
      });
      console.error("Contact form submit error:", err);
    } finally {
      setLoading(false);
    }
  };

  const info = [
    {
      icon: MapPin,
      title: "Address",
      detail: "VIP PARSPAR NAGAR NEAR RYAN INTERNATIONAL SCHOOL, Indore, Madhya Pradesh, India",
    },
    { icon: Phone, title: "Phone", detail: settingsLoading ? "Loading..." : businessPhone },
    { icon: Mail, title: "Email", detail: settingsLoading ? "Loading..." : businessEmail },
    { icon: Clock, title: "Timing", detail: settingsLoading ? "Loading..." : deliveryTimeWindow },
  ];

  return (
    <section className="mx-auto w-full max-w-7xl px-3 py-8 sm:px-5 md:py-12">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-4 md:gap-4">
        {info.map(({ icon: Icon, title, detail }, i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-4"
          >
            <Icon size={20} className="mb-2 text-emerald-600" />
            <h3 className="text-sm font-semibold text-slate-900 sm:text-base">{title}</h3>
            <p className="mt-1 break-words text-[11px] text-slate-600 sm:text-xs md:text-sm">{detail}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <iframe
           src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d267.8657510129061!2d75.82224206886303!3d22.675447707375653!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sin!4v1780082669176!5m2!1sen!2sin" 
            width="100%"
            height="100%"
            loading="lazy"
            style={{ border: 0, minHeight: 320 }}
          />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="mb-1 text-xl font-bold text-slate-900">Send Us a Message</h2>
          <p className="mb-5 text-sm text-slate-600">We typically respond quickly during business hours.</p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="name" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Name
              </label>
              <input
                id="name"
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Your name"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Email
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                required
              />
            </div>

            <div>
              <label htmlFor="number" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Phone
              </label>
              <input
                id="number"
                type="tel"
                name="number"
                value={form.number}
                onChange={handleChange}
                placeholder="Your phone number"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                required
              />
            </div>

            <div>
              <label htmlFor="message" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder="Type your message"
                rows={5}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full rounded-xl py-2.5 text-sm font-semibold text-white transition ${
                loading ? "cursor-not-allowed bg-slate-400" : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              {loading ? "Sending..." : "Send Message"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
