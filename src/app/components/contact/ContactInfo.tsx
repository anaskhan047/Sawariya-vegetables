"use client";

import React, { useEffect, useState } from "react";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import Swal from "sweetalert2";
import { z } from "zod";

// Zod validation schema
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
  // other fields may exist but we only care above
};

export default function ContactInfo() {
  const [form, setForm] = useState<MessageSchemaType>({
    name: "",
    email: "",
    number: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);

  // settings state (fetched from server)
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [businessEmail, setBusinessEmail] = useState<string>("contact@sawariyavegetable.com");
  const [businessPhone, setBusinessPhone] = useState<string>(" +91 98765 43210");
  const [deliveryTimeWindow, setDeliveryTimeWindow] = useState<string>("Mon - Sat: 9:00 AM - 8:00 PM");

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      try {
        setSettingsLoading(true);
        const res = await fetch("/api/admin/settings");
        const data = await res.json();
        if (!cancelled && data?.success && data.settings) {
          const s = data.settings as SettingsShape;
          if (typeof s.businessEmail === "string" && s.businessEmail.trim().length > 0) {
            setBusinessEmail(s.businessEmail);
          }
          if (typeof s.businessPhone === "string" && s.businessPhone.trim().length > 0) {
            setBusinessPhone(s.businessPhone);
          }
          if (typeof s.deliveryTimeWindow === "string" && s.deliveryTimeWindow.trim().length > 0) {
            setDeliveryTimeWindow(s.deliveryTimeWindow);
          }
        }
      } catch (err) {
        console.warn("Failed to load settings for contact info:", err);
        // keep defaults
      } finally {
        if (!cancelled) setSettingsLoading(false);
      }
    }

    loadSettings();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate form using Zod
    const validation = MessageSchema.safeParse(form);
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || "Invalid input";
      await Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: firstError,
        confirmButtonColor: "#3085d6",
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
          title: "Message Sent!",
          text: "Your message has been sent successfully.",
          confirmButtonColor: "#3085d6",
        });
        setForm({ name: "", email: "", number: "", message: "" });
      } else {
        await Swal.fire({
          icon: "error",
          title: "Failed",
          text: data?.message || "Failed to send message. Try again.",
          confirmButtonColor: "#d33",
        });
      }
    } catch (err) {
      await Swal.fire({
        icon: "error",
        title: "Server Error",
        text: "Something went wrong. Please try later.",
        confirmButtonColor: "#d33",
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
      detail: "123 Green Street, Fresh City, India",
    },
    { icon: Phone, title: "Phone", detail: settingsLoading ? "Loading..." : businessPhone },
    { icon: Mail, title: "Email", detail: settingsLoading ? "Loading..." : businessEmail },
    { icon: Clock, title: "Timing", detail: settingsLoading ? "Loading..." : deliveryTimeWindow },
  ];

  const formFields = [
    { name: "name", type: "text", placeholder: "Your Name" },
    { name: "email", type: "email", placeholder: "Your Email" },
    { name: "number", type: "tel", placeholder: "Your Phone Number" },
  ];

  return (
    <section className="py-12 bg-[var(--background-color)] text-[var(--text-color)]">
      <div className="max-w-6xl mx-auto px-4">
        {/* Info Boxes */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {info.map(({ icon: Icon, title, detail }, i) => (
            <div
              key={i}
              className="flex flex-col items-center p-6 bg-white rounded-2xl border border-[var(--border-color)] shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 hover:bg-[var(--primary-color)] hover:text-white group"
            >
              <Icon
                size={32}
                className="mb-3 text-[var(--primary-color)] group-hover:text-white transition-colors duration-300"
              />
              <h3 className="text-lg font-semibold mb-1">{title}</h3>
              <p className="text-[var(--text-light)] group-hover:text-white text-center text-sm">
                {detail}
              </p>
            </div>
          ))}
        </div>

        {/* Map + Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Google Map */}
          <div className="rounded-2xl overflow-hidden shadow-lg border border-[var(--border-color)]">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d29449.372780342186!2d75.80101993924276!3d22.68465512206235!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3962fc4df8240b37%3A0x62933de14560b8f0!2sSudama%20Nagar%2C%20Indore%2C%20Madhya%20Pradesh%20452009!5e0!3m2!1sen!2sin!4v1755442156614!5m2!1sen!2sin"
              width="100%"
              height="500"
              loading="lazy"
              style={{ border: 0 }}
            ></iframe>
          </div>

          {/* Contact Form */}
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-[var(--border-color)]">
            <h2 className="text-2xl font-bold mb-6 text-[var(--primary-color)]">Send Us a Message</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {formFields.map(({ name, type, placeholder }) => (
                <input
                  key={name}
                  type={type}
                  name={name}
                  value={form[name as keyof MessageSchemaType] as string}
                  onChange={handleChange}
                  placeholder={placeholder}
                  className="w-full p-3 border border-[var(--border-color)] rounded-lg focus:outline-none focus:border-[var(--primary-color)]"
                  required
                />
              ))}

              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder="Your Message"
                rows={4}
                className="w-full p-3 border border-[var(--border-color)] rounded-lg focus:outline-none focus:border-[var(--primary-color)]"
                required
              ></textarea>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[var(--primary-color)] hover:bg-[var(--secondary-color)] text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-300 disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send Message"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
