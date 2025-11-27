"use client";

import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn } from "react-icons/fa";
import Link from "next/link";

export default function Footer() {
  return (
    <>
      <footer
        className="text-white"
        style={{
          background: `linear-gradient(90deg, var(--footer-gradient-start), var(--footer-gradient-end))`,
        }}
      >
        <div className="container mx-auto px-6 py-10 grid sm:grid-cols-2 md:grid-cols-4 gap-8">
          {/* Left Section */}
          <div>
            <p className="mb-4 font-medium">
              Farm fresh local produce, delivered daily.
            </p>
            <div className="flex space-x-4 text-lg">
              <a href="#" aria-label="Facebook" className="hover:text-gray-300">
                <FaFacebookF />
              </a>
              <a href="#" aria-label="Twitter" className="hover:text-gray-300">
                <FaTwitter />
              </a>
              <a href="#" aria-label="Instagram" className="hover:text-gray-300">
                <FaInstagram />
              </a>
              <a href="#" aria-label="LinkedIn" className="hover:text-gray-300">
                <FaLinkedinIn />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-3">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="hover:underline">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/shop" className="hover:underline">
                  Shop
                </Link>
              </li>
              <li>
                <Link href="/vegetables" className="hover:underline">
                  Vegetable
                </Link>
              </li>
              <li>
                <Link href="/fruit" className="hover:underline">
                  Fruit
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:underline">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold mb-3">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/#about" className="hover:underline">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/#grade" className="hover:underline">
                  Product Grades
                </Link>
              </li>
              <li>
                <Link href="/#testimonials" className="hover:underline">
                  Review / Testimonials
                </Link>
              </li>
            </ul>

          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-3">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/faq" className="hover:underline">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:underline">
                  Customer Service
                </Link>
              </li>
              <li>
                <Link href="/order" className="hover:underline">
                  Track Order
                </Link>
              </li>
            </ul>
            <p className="mt-2"> © 2025 SSM | Shri Sawariya Mart</p>
          </div>
        </div>

        {/* Bottom border */}
        <div className="container mx-auto px-6">
          <hr className="border-white/50" />
        </div>
      </footer>
    </>
  );
}
