// app/components/Navbar.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { FiSearch, FiShoppingCart, FiUser, FiMenu, FiX } from "react-icons/fi";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/app/context/AuthContext";

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

  const [cartCount] = useState<number>(3);
  const [userOpen, setUserOpen] = useState<boolean>(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user, isLoading, isLoggedIn, logout, refresh } = useAuth();

  // close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    // Dynamically import SweetAlert2
    const Swal = (await import('sweetalert2')).default;
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to logout?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, logout',
    });

    if (result.isConfirmed) {
      await logout();
      await refresh();
      router.push("/login");
    }
  }

  const linkClass = (name: string) =>
    `relative inline-block pb-1 transition ${active === name ? "text-[var(--primary-color)] font-semibold" : "text-[var(--text-color)]"} hover:text-[var(--hover-color)]`;

  const underline = (name: string) =>
    active === name && <span className="absolute left-0 -bottom-[2px] h-[2px] w-full bg-[var(--primary-color)] transition-all duration-700"></span>;

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
              <Link href={link.href} className={linkClass(link.name)} onClick={() => setActive(link.name)}>
                {link.name}
                {underline(link.name)}
              </Link>
            </li>
          ))}
        </ul>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div ref={searchRef} className="relative flex items-center">
            {searchOpen ? (
              <input type="text" value={searchValue} onChange={(e) => setSearchValue(e.target.value)} placeholder="Search products..." className="border border-[var(--border-color)] rounded-lg px-3 py-1 w-[350px] max-w-[80vw] focus:outline-none focus:border-[var(--primary-color)]" autoFocus />
            ) : (
              <FiSearch className="cursor-pointer text-xl text-[var(--text-color)] hover:text-[var(--hover-color)]" onClick={() => setSearchOpen(true)} />
            )}
          </div>

          {/* Cart */}
          <div className="relative cursor-pointer" onClick={() => router.push("/cart")}>
            <FiShoppingCart className="text-xl text-[var(--text-color)] hover:text-[var(--hover-color)]" />
            {cartCount > 0 && <span className="absolute -top-2 -right-2 bg-[var(--primary-color)] text-white text-xs font-bold rounded-full px-2 py-0.5">{cartCount}</span>}
          </div>

          {/* User Dropdown */}
          <div ref={userRef} className="relative">
            <FiUser
              className="cursor-pointer text-xl text-[var(--text-color)] hover:text-[var(--hover-color)]"
              onClick={() => {
                if (isLoading) return;
                if (!isLoggedIn) router.push("/login");
                else setUserOpen((p) => !p);
              }}
            />

            {isLoggedIn && userOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-[var(--background-color)] shadow-lg rounded-xl border border-[var(--border-color)] overflow-hidden transform transition-all duration-200 origin-top-right">
                <ul className="flex flex-col">
                  <li>
                    <Link
                      href="/profile"
                      onClick={() => setUserOpen(false)}
                      className="flex items-center px-4 py-2 text-[var(--text-color)] hover:bg-[var(--primary-color)] hover:text-white transition-colors duration-150"
                    >
                      👤 Profile
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/orders"
                      onClick={() => setUserOpen(false)}
                      className="flex items-center px-4 py-2 text-[var(--text-color)] hover:bg-[var(--primary-color)] hover:text-white transition-colors duration-150"
                    >
                      📦 Orders
                    </Link>
                  </li>
                  <li>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2 text-[var(--text-color)] hover:bg-[var(--accent-color)] hover:text-[var(--text-color)] font-medium transition-colors duration-150"
                    >
                      🚪 Logout
                    </button>
                  </li>
                </ul>
              </div>
            )}

          </div>

          {/* Mobile Menu */}
          <button className="md:hidden text-2xl text-[var(--text-color)]" onClick={() => setIsOpen((p) => !p)} aria-label="Toggle Menu">
            {isOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>
    </nav>
  );
}
