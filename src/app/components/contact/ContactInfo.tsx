"use client";

import React from "react";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

export default function ContactInfo() {
  const info = [
    {
      icon: <MapPin size={32} />,
      title: "Address",
      detail: "123 Green Street, Fresh City, India",
    },
    {
      icon: <Phone size={32} />,
      title: "Phone",
      detail: "+91 98765 43210",
    },
    {
      icon: <Mail size={32} />,
      title: "Email",
      detail: "contact@sawariyavegetable.com",
    },
    {
      icon: <Clock size={32} />,
      title: "Timing",
      detail: "Mon - Sat: 9:00 AM - 8:00 PM",
    },
  ];

  return (
    <section className="py-12 bg-[var(--background-color)] text-[var(--text-color)]">
      <div className="max-w-6xl mx-auto px-4">
        {/* Top 4 Info Boxes */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {info.map((item, i) => (
            <div
              key={i}
              className="flex flex-col items-center p-6 bg-white rounded-2xl border border-[var(--border-color)] shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 hover:bg-[var(--primary-color)] hover:text-white group"
            >
              <div className="mb-3 text-[var(--primary-color)] group-hover:text-white transition-colors duration-300">
                {item.icon}
              </div>
              <h3 className="text-lg font-semibold mb-1">{item.title}</h3>
              <p className="text-[var(--text-light)] group-hover:text-white text-center text-sm">
                {item.detail}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom Row - Map & Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Google Map */}
          <div className="rounded-2xl overflow-hidden shadow-lg border border-[var(--border-color)]">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d235527.49482607495!2d75.69903738855072!3d22.72388828988633!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3962fcad1b410ddb%3A0x96ec4da356240f4!2sIndore%2C%20Madhya%20Pradesh!5e0!3m2!1sen!2sin!4v1755254431695!5m2!1sen!2sin"
              width="100%"
              height="500"
              loading="lazy"
              style={{ border: 0 }}
            ></iframe>
          </div>

          {/* Contact Form */}
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-[var(--border-color)]">
            <h2 className="text-2xl font-bold mb-6 text-[var(--primary-color)]">
              Send Us a Message
            </h2>
            <form className="space-y-4">
              <input
                type="text"
                placeholder="Your Name"
                className="w-full p-3 border border-[var(--border-color)] rounded-lg focus:outline-none focus:border-[var(--primary-color)]"
              />
              <input
                type="email"
                placeholder="Your Email"
                className="w-full p-3 border border-[var(--border-color)] rounded-lg focus:outline-none focus:border-[var(--primary-color)]"
              />
              <input
                type="tel"
                placeholder="Your Phone Number"
                className="w-full p-3 border border-[var(--border-color)] rounded-lg focus:outline-none focus:border-[var(--primary-color)]"
              />
              <textarea
                placeholder="Your Message"
                rows={4}
                className="w-full p-3 border border-[var(--border-color)] rounded-lg focus:outline-none focus:border-[var(--primary-color)]"
              ></textarea>
              <button
                type="submit"
                className="w-full bg-[var(--primary-color)] hover:bg-[var(--secondary-color)] text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-300"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
