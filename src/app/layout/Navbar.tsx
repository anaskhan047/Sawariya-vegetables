"use client";

import { useState, useRef, useEffect } from "react";
import { FiSearch, FiShoppingCart, FiUser, FiMenu, FiX } from "react-icons/fi";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { useAuth } from "@/app/context/AuthContext";
import { useCart } from "@/app/context/CartContext";
import type { Product } from "@/app/lib/types";

interface NavLink {
  name: string;
  href: string;
}

const navLinks: NavLink[] = [
  { name: "Home", href: "/" },
  { name: "Shop", href: "/shop" },
  { name: "Vegetables", href: "/vegetables" },
  { name: "Fruit", href: "/fruit" },
  { name: "Contact Us", href: "/contact" },
];

export default function Navbar() {
  const [active, setActive] = useState<string>("Home");
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [searchValue, setSearchValue] = useState<string>("");
  const [userOpen, setUserOpen] = useState<boolean>(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const router = useRouter();
  const { user, isLoading, isLoggedIn, logout, refresh } = useAuth();
  const { cartCount } = useCart();
  const [image, setImage] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // fetch user image for avatar (keeps existing behavior)
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) return;
        const data = await res.json();
        if (data.loggedIn) setImage(data.user?.image || null);
      } catch (err) {
        console.error("Error fetching user:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  async function handleLogout() {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to logout?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, logout",
    });

    if (result.isConfirmed) {
      await logout();
      await refresh();
      localStorage.removeItem("token");
      router.push("/login");
    }
  }

  const linkClass = (name: string) =>
    `relative inline-block pb-1 transition ${
      active === name ? "text-[var(--primary-color)] font-semibold" : "text-[var(--text-color)]"
    } hover:text-[var(--hover-color)]`;

  const underline = (name: string) =>
    active === name && (
      <span className="absolute left-0 -bottom-[2px] h-[2px] w-full bg-[var(--primary-color)] transition-all duration-700" />
    );

  // Debounced product search
  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!searchValue.trim()) {
        setSearchResults([]);
        return;
      }

      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(searchValue)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.products) {
            const filtered = (data.products as Product[]).filter((p) => {
              const q = searchValue.toLowerCase();
              const nameMatch = p.name?.toLowerCase().includes(q);
              const hindiMatch = p.inHindi?.toLowerCase().includes(q);
              const tagsMatch = p.tags?.some((tag) => tag.toLowerCase().includes(q));
              return nameMatch || hindiMatch || tagsMatch;
            });
            setSearchResults(filtered);
          }
        }
      } catch (err) {
        console.error("Search error:", err);
      }
    };

    const delay = setTimeout(fetchSearchResults, 400);
    return () => clearTimeout(delay);
  }, [searchValue]);

  function handleProductClick(product: Product) {
    setSearchOpen(false);
    setSearchResults([]);
    setSearchValue("");
    router.push(`/shop?search=${encodeURIComponent(product.name)}`);
  }

  function handleSeeMore() {
    setSearchOpen(false);
    setSearchResults([]);
    router.push(`/shop?search=${encodeURIComponent(searchValue)}`);
  }

  return (
    <nav className="w-full fixed top-0 left-0 z-50 bg-[var(--background-color)] shadow-sm">
      <div className="container mx-auto flex items-center justify-between py-3 px-4 md:py-4 md:px-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <Link href="/" aria-label="Shri Sawariya Mart - Home" className="flex items-center">
            <img
              src="/logo/logo.png"
              alt="Shri Sawariya Mart logo"
              className="w-10 h-10 object-cover rounded"
              loading="lazy"
            />
            <span className="ml-2 font-bold text-lg text-[var(--primary-color)] leading-tight hidden md:block">
              Shri Sawariya Mart
            </span>
          </Link>
        </div>

        {/* Desktop Menu */}
        <ul className="hidden md:flex items-center space-x-6">
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

        {/* Right Section */}
        <div className="flex items-center space-x-3 md:space-x-4">
          {/* Search */}
          <div ref={searchRef} className="relative flex items-center">
            {searchOpen ? (
              <div className="relative">
                <input
                  type="search"
                  aria-label="Search products"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="Search products..."
                  className="border border-[var(--border-color)] rounded-lg px-3 py-1 w-[220px] sm:w-[320px] max-w-[70vw] focus:outline-none focus:border-[var(--primary-color)]"
                  autoFocus
                />
                {searchValue && searchResults.length > 0 && (
                  <div className="absolute left-0 mt-2 w-full bg-white shadow-lg border border-gray-200 rounded-lg max-h-80 overflow-y-auto z-50">
                    {searchResults.slice(0, 7).map((product) => (
                      <div
                        key={product._id}
                        onClick={() => handleProductClick(product)}
                        className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-100 transition"
                      >
                        <div className="flex items-center space-x-3">
                          <img
                            src={product.images?.[0]?.url || "/placeholder.png"}
                            alt={product.name}
                            className="w-10 h-10 rounded object-cover"
                          />
                          <div>
                            <p className="font-medium text-gray-800">{product.name}</p>
                            <p className="text-sm text-gray-500">{product.inHindi}</p>
                          </div>
                        </div>
                        <span className="text-green-700 font-semibold text-sm">₹{product.price}</span>
                      </div>
                    ))}
                    {searchResults.length > 7 && (
                      <button
                        onClick={handleSeeMore}
                        className="w-full text-center py-2 text-[var(--primary-color)] font-semibold border-t border-gray-200 hover:bg-gray-50 transition"
                      >
                        See More
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <FiSearch
                role="button"
                aria-label="Open search"
                className="cursor-pointer text-xl text-[var(--text-color)] hover:text-[var(--hover-color)]"
                onClick={() => setSearchOpen(true)}
              />
            )}
          </div>

          {/* Cart */}
          <div className="relative cursor-pointer group" onClick={() => router.push("/cart")}>
            <FiShoppingCart className="text-xl text-[var(--text-color)] hover:text-[var(--hover-color)]" />
            <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 text-xs bg-[var(--text-color)] text-white px-2 py-1 rounded-md shadow transition w-20">
              Add to cart
            </span>
            {isLoggedIn && (
              <span className="absolute -top-2 -right-2 bg-[var(--primary-color)] text-white text-xs font-bold rounded-full px-2 py-0.5">
                {cartCount}
              </span>
            )}
          </div>

          {/* User Dropdown */}
          <div ref={userRef} className="relative">
            <button
              className="flex items-center gap-2"
              onClick={() => {
                if (isLoading) return;
                if (!isLoggedIn) router.push("/login");
                else setUserOpen((p) => !p);
              }}
              aria-haspopup="true"
              aria-expanded={userOpen}
            >
              {isLoggedIn && image ? (
                <img src={image} alt={user?.name || "User avatar"} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <FiUser className="cursor-pointer text-xl text-[var(--text-color)] hover:text-[var(--hover-color)]" />
              )}
            </button>

            {isLoggedIn && userOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-[var(--background-color)] shadow-lg rounded-xl border border-[var(--border-color)] overflow-hidden">
                <div className="px-4 py-3 border-b border-[var(--border-color)]">
                  <p className="font-semibold capitalize">{user?.name || "User"}</p>
                  <p className="text-sm text-gray-500 truncate">{user?.email || ""}</p>
                </div>
                <ul className="flex flex-col">
                  <li>
                    <Link href="/profile" onClick={() => setUserOpen(false)} className="flex items-center px-4 py-2 hover:bg-[var(--primary-color)] hover:text-white">👤 Profile</Link>
                  </li>
                  <li>
                    <Link href="/order" onClick={() => setUserOpen(false)} className="flex items-center px-4 py-2 hover:bg-[var(--primary-color)] hover:text-white">📦 Orders</Link>
                  </li>
                  {user?.role === "admin" && (
                    <li>
                      <Link href="/admin" onClick={() => setUserOpen(false)} className="flex items-center px-4 py-2 hover:bg-[var(--primary-color)] hover:text-white">🧭 Admin Dashboard</Link>
                    </li>
                  )}
                  <li>
                    <button onClick={handleLogout} className="w-full flex items-center px-4 py-2 hover:bg-[var(--accent-color)]">🚪 Logout</button>
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-2xl text-[var(--text-color)]"
            onClick={() => setIsOpen((p) => !p)}
            aria-label="Toggle Menu"
          >
            {isOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {isOpen && (
        <div ref={mobileMenuRef} className="md:hidden bg-[var(--background-color)] border-t border-[var(--border-color)] shadow-md">
          <ul className="flex flex-col space-y-2 p-4">
            {navLinks.map((link) => (
              <li key={link.name}>
                <Link
                  href={link.href}
                  onClick={() => {
                    setActive(link.name);
                    setIsOpen(false);
                  }}
                  className="block capitalize text-[var(--text-color)] hover:text-[var(--primary-color)] py-2"
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
}
