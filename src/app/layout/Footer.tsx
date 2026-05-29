"use client";

import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn } from "react-icons/fa";
import Link from "next/link";

export default function Footer() {
  return (
    <footer
      className="relative overflow-hidden text-[var(--text-color)]"
      style={{
        background:
          "linear-gradient(180deg, color-mix(in srgb, var(--background-color) 88%, #f0fdf4 12%) 0%, color-mix(in srgb, var(--background-color) 92%, #ecfdf5 8%) 100%)",
      }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -left-20 top-0 h-44 w-44 rounded-full bg-emerald-200/45 blur-3xl" />
        <div className="absolute right-0 top-20 h-52 w-52 rounded-full bg-lime-100/60 blur-3xl" />
        <div className="absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-green-100/55 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-10 sm:px-6 md:px-8 md:pb-6">
        <div className="mb-8 grid gap-6 rounded-3xl border border-[var(--border-color)] bg-[var(--background-color)]/95 p-5 shadow-[0_18px_45px_rgba(22,163,74,0.14)] backdrop-blur-xl sm:p-6 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <img
                src="/logo/logo.png"
                alt="Shri Sawariya Mart"
                className="h-12 w-12 rounded-xl border border-emerald-200 bg-white object-cover p-1"
              />
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-600">Fresh Everyday</p>
                <h3 className="text-lg font-black text-[var(--text-color)]">Shri Sawariya Mart</h3>
              </div>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-6 text-[var(--text-light)]">
              Farm-fresh vegetables and fruits delivered quickly with quality checks at every step.
            </p>
            <div className="mt-5 flex items-center gap-3 text-lg">
              <a href="#" aria-label="Facebook" className="rounded-full border border-emerald-200 bg-white p-2.5 text-emerald-700 transition hover:bg-emerald-50">
                <FaFacebookF />
              </a>
              <a href="#" aria-label="Twitter" className="rounded-full border border-emerald-200 bg-white p-2.5 text-emerald-700 transition hover:bg-emerald-50">
                <FaTwitter />
              </a>
                <a href="https://www.instagram.com/shri_sawariya_mart?utm_source=qr&igsh=ZHB6NmR4NjFpZGp1" target="_blank" aria-label="Instagram" className="rounded-full border border-emerald-200 bg-white p-2.5 text-emerald-700 transition hover:bg-emerald-50">
                  <FaInstagram />
                </a>
              <a href="#" aria-label="LinkedIn" className="rounded-full border border-emerald-200 bg-white p-2.5 text-emerald-700 transition hover:bg-emerald-50">
                <FaLinkedinIn />
              </a>
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-emerald-600">Quick Links</h4>
            <ul className="space-y-2.5 text-sm text-[var(--text-light)]">
              <li><Link href="/" className="transition hover:text-[var(--primary-color)]">Home</Link></li>
              <li><Link href="/shop" className="transition hover:text-[var(--primary-color)]">Shop</Link></li>
              <li><Link href="/vegetables" className="transition hover:text-[var(--primary-color)]">Vegetables</Link></li>
              <li><Link href="/fruit" className="transition hover:text-[var(--primary-color)]">Fruit</Link></li>
              <li><Link href="/contact" className="transition hover:text-[var(--primary-color)]">Contact Us</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-emerald-600">Company</h4>
            <ul className="space-y-2.5 text-sm text-[var(--text-light)]">
              <li><Link href="/#about" className="transition hover:text-[var(--primary-color)]">About Us</Link></li>
              <li><Link href="/#grade" className="transition hover:text-[var(--primary-color)]">Product Grades</Link></li>
              <li><Link href="/#testimonials" className="transition hover:text-[var(--primary-color)]">Testimonials</Link></li>
              <li><Link href="/order" className="transition hover:text-[var(--primary-color)]">Track Order</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-emerald-600">Support</h4>
            <div className="space-y-2.5 text-sm text-[var(--text-light)]">
              <p>Daily support for order and payment help.</p>
              <p className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-[var(--text-color)]">Phone: +91 7523 666 366</p>
              <p className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-[var(--text-color)]">Email: shri@shrisawariyamart.com</p>
              <Link href="/contact" className="inline-flex rounded-xl bg-[var(--primary-color)] px-4 py-2 font-semibold text-white transition hover:bg-[var(--secondary-color)]">
                Get Support
              </Link>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-2 border-t border-[var(--border-color)] pt-5 text-xs text-[var(--text-light)] sm:flex-row">
          <p>Copyright {new Date().getFullYear()} Shri Sawariya Mart. All rights reserved.</p>
          <p>Made for fast mobile ordering and fresh local delivery.</p>
        </div>
      </div>
    </footer>
  );
}
