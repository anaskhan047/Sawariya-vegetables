"use client";

import { useState, useRef, useEffect } from "react";
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
  { name: "shop", href: "/shop" },
  { name: "fruit", href: "/fruit" },
  { name: "contact us", href: "/contact" },
];

export default function Navbar() {
  const [active, setActive] = useState<string>("Home");
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [searchValue, setSearchValue] = useState<string>("");

  // 🔥 cart count (replace with global state / context later)
  const [cartCount, setCartCount] = useState<number>(3);

  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const linkClass = (name: string) =>
    `relative inline-block pb-1 transition ${
      active === name
        ? "text-[var(--primary-color)] font-semibold"
        : "text-[var(--text-color)]"
    } hover:text-[var(--hover-color)]`;

  const underline = (name: string) =>
    active === name && (
      <span className="absolute left-0 -bottom-[2px] h-[2px] w-full bg-[var(--primary-color)] transition-all duration-700"></span>
    );

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on Esc key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSearchOpen(false);
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, []);

  return (
    <nav className="w-full sticky top-0 left-0 z-50 bg-[var(--background-color)] shadow-sm">
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
            <li className="capitalize" key={link.name}>
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

        {/* Right: Search + Icons + Mobile Menu Button */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div ref={searchRef} className="relative flex items-center">
            {searchOpen ? (
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Search products..."
                className="border border-[var(--border-color)] rounded-lg px-3 py-1 w-[350px] max-w-[80vw] focus:outline-none focus:border-[var(--primary-color)]"
                autoFocus
              />
            ) : (
              <FiSearch
                className="cursor-pointer text-xl text-[var(--text-color)] hover:text-[var(--hover-color)]"
                onClick={() => setSearchOpen(true)}
              />
            )}
          </div>

          {/* Cart with badge */}
          <div className="relative cursor-pointer" onClick={() => router.push("/cart")}>
            <FiShoppingCart className="text-xl text-[var(--text-color)] hover:text-[var(--hover-color)]" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-[var(--primary-color)] text-white text-xs font-bold rounded-full px-2 py-0.5">
                {cartCount}
              </span>
            )}
          </div>

          {/* User */}
          <FiUser
            className="cursor-pointer text-xl text-[var(--text-color)] hover:text-[var(--hover-color)]"
            onClick={() => router.push("/login")}
          />

          {/* Mobile Menu */}
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
        className={`md:hidden bg-[var(--background-color)] border-t border-[var(--border-color)] overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="container mx-auto px-6">
          <ul className="flex flex-col space-y-4 py-4">
            {navLinks.map((link) => (
              <li key={link.name} className="capitalize">
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
