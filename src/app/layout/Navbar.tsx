"use client";

import { useState } from "react";
import { FiSearch, FiShoppingCart, FiUser, FiMenu, FiX } from "react-icons/fi";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface NavLink {
  name: string;
  href: string;
}

const navLinks: NavLink[] = [
  { name: "Home", href: "/" },
  { name: "Shop", href: "/shop" },
  { name: "Categories", href: "/categories" },
  { name: "Contact Us", href: "/contact" },
];

export default function Navbar() {
  const [active, setActive] = useState<string>("Home");
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const router = useRouter();
  const linkClass = (name: string) =>
    `relative inline-block pb-1 transition ${
      active === name
        ? "text-[var(--primary-color)] font-semibold"
        : "text-[var(--text-color)]"
    } hover:text-[var(--hover-color)]`;

  const underline = (name: string) =>
    active === name && (
      <span className="absolute left-0 -bottom-[2px] h-[2px] w-full bg-[var(--primary-color)] transition-all duration-300"></span>
    );

  return (
    <nav className="w-full bg-[var(--bg-color)] shadow-sm sticky top-0 left-0 z-50">
      <div className="container mx-auto flex items-center justify-between py-4 px-6">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <span className="text-[var(--primary-color)] text-xl font-semibold">
            <Image src="/favicon.ico" alt="Logo" width={40} height={40} />
          </span>
        </div>

        {/* Desktop Menu */}
        <ul className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => (
            <li key={link.name}>
              <Link
                href={link.href}
                className={linkClass(link.name)}
                onClick={() => setActive(link.name)}
              >
                {link.name}
                {underline(link.name)}
              </Link>
            </li>
          ))}
        </ul>

        {/* Right: Icons + Mobile Menu Button */}
        <div className="flex items-center space-x-4">
          <div className="flex space-x-4 text-xl text-[var(--text-color)]">
            <FiSearch className="cursor-pointer hover:text-[var(--hover-color)]" />
            <FiShoppingCart className="cursor-pointer hover:text-[var(--hover-color)]" />
            <FiUser className="cursor-pointer hover:text-[var(--hover-color)]" onClick={() => router.push('/login')}/>
          </div>
          <button
            className="md:hidden text-2xl text-[var(--text-color)]"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-label="Toggle Menu"
          >
            {isOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden bg-[var(--bg-color)] border-t border-gray-200 overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="container mx-auto px-6">
          <ul className="flex flex-col space-y-4 py-4">
            {navLinks.map((link) => (
              <li key={link.name}>
                <Link
                  href={link.href}
                  className={linkClass(link.name)}
                  onClick={() => {
                    setActive(link.name);
                    setIsOpen(false);
                  }}
                >
                  {link.name}
                  {underline(link.name)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
}
