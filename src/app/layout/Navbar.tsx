"use client";

import { useState, useRef, useEffect } from "react";
import { FiSearch, FiShoppingCart, FiUser, FiMenu, FiX } from "react-icons/fi";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
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
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [searchValue, setSearchValue] = useState<string>("");
  const [userOpen, setUserOpen] = useState<boolean>(false);
  const [isNavVisible, setIsNavVisible] = useState<boolean>(true);

  const searchRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const lastScrollYRef = useRef<number>(0);
  const showTimerRef = useRef<number | null>(null);

  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, isLoggedIn, logout, refresh } = useAuth();
  const { cartCount } = useCart();
  const [image, setImage] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const isLinkActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

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

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || 0;
      const lastY = lastScrollYRef.current;
      const scrollingDown = y > lastY;

      if (y <= 10) {
        setIsNavVisible(true);
      } else if (scrollingDown && y - lastY > 3 && !isOpen && !searchOpen && !userOpen) {
        setIsNavVisible(false);
      } else if (!scrollingDown) {
        setIsNavVisible(true);
      }

      if (showTimerRef.current) window.clearTimeout(showTimerRef.current);
      showTimerRef.current = window.setTimeout(() => {
        setIsNavVisible(true);
      }, 180);

      lastScrollYRef.current = y;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (showTimerRef.current) window.clearTimeout(showTimerRef.current);
    };
  }, [isOpen, searchOpen, userOpen]);

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

  const linkClass = (href: string) =>
    `relative rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-200 ${
      isLinkActive(href)
        ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-[0_8px_20px_rgba(16,185,129,0.28)]"
        : "text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
    }`;

  const actionIconClass =
    "inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-800 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700";

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
    <nav
      className={`fixed left-0 top-0 z-50 w-full border-b border-emerald-100 bg-white/95 shadow-[0_8px_28px_rgba(15,23,42,0.10)] backdrop-blur-xl transition-transform duration-300 ease-out ${
        isNavVisible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="mx-auto flex w-full max-w-[1320px] items-center justify-between px-2 py-2.5 sm:px-3 md:px-5 md:py-3">
        <div className="min-w-0">
          <Link
            href="/"
            aria-label="Shri Sawariya Mart - Home"
            className="flex items-center rounded-2xl border border-emerald-100 bg-gradient-to-r from-white to-emerald-50/70 px-1.5 py-1.5 shadow-sm sm:px-2"
          >
            <img
              src="/logo/logo.png"
              alt="Shri Sawariya Mart logo"
              className="h-8 w-8 rounded object-cover sm:h-9 sm:w-9 md:h-10 md:w-10"
              loading="lazy"
            />
            <span className="ml-2 hidden whitespace-nowrap text-sm font-bold leading-tight text-emerald-700 sm:block md:text-base">
              Shri Sawariya Mart
            </span>
          </Link>
        </div>

        <ul className="hidden items-center gap-1 rounded-2xl border border-emerald-100 bg-white px-1.5 py-1.5 shadow-[0_10px_22px_rgba(16,185,129,0.12)] md:flex">
          {navLinks.map((link) => (
            <li className="capitalize" key={link.name}>
              <Link href={link.href} className={linkClass(link.href)}>
                {link.name}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
          <div ref={searchRef} className="relative flex items-center">
            {searchOpen ? (
              <div className="relative">
                <input
                  type="search"
                  aria-label="Search products"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="Search products..."
                  className="w-[180px] max-w-[62vw] rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-emerald-500 focus:outline-none sm:w-[260px] md:w-[320px]"
                  autoFocus
                />
                {searchValue && searchResults.length > 0 && (
                  <div className="absolute left-0 z-50 mt-2 max-h-80 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
                    {searchResults.slice(0, 7).map((product) => (
                      <div
                        key={product._id}
                        onClick={() => handleProductClick(product)}
                        className="flex cursor-pointer items-center justify-between px-3 py-2 transition hover:bg-gray-100"
                      >
                        <div className="flex items-center space-x-3">
                          <img
                            src={product.images?.[0]?.url || "/placeholder.png"}
                            alt={product.name}
                            className="h-10 w-10 rounded object-cover"
                          />
                          <div>
                            <p className="font-medium text-gray-800">{product.name}</p>
                            <p className="text-sm text-gray-500">{product.inHindi}</p>
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-green-700">Rs {product.price}</span>
                      </div>
                    ))}
                    {searchResults.length > 7 && (
                      <button
                        onClick={handleSeeMore}
                        className="w-full border-t border-gray-200 py-2 text-center font-semibold text-[var(--primary-color)] transition hover:bg-gray-50"
                      >
                        See More
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                aria-label="Open search"
                className={actionIconClass}
                onClick={() => setSearchOpen(true)}
              >
                <FiSearch size={20} />
              </button>
            )}
          </div>

          <div className="group relative cursor-pointer" onClick={() => router.push("/cart")}>
            <button type="button" aria-label="Open cart" className={actionIconClass}>
              <FiShoppingCart size={20} />
            </button>
            <span className="absolute -bottom-7 left-1/2 w-20 -translate-x-1/2 rounded-md bg-slate-800 px-2 py-1 text-xs text-white opacity-0 shadow transition group-hover:opacity-100">
              Add to cart
            </span>
            {isLoggedIn && (
              <span className="absolute -right-2 -top-2 rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-bold text-white">
                {cartCount}
              </span>
            )}
          </div>

          <div ref={userRef} className="relative">
            <button
              className="flex items-center gap-2"
              onClick={() => {
                if (isLoading || loading) return;
                if (!isLoggedIn) router.push("/login");
                else setUserOpen((p) => !p);
              }}
              aria-haspopup="true"
              aria-expanded={userOpen}
            >
              {isLoggedIn && image ? (
                <img src={image} alt={user?.name || "User avatar"} className="h-8 w-8 rounded-full border border-slate-200 object-cover shadow-sm" />
              ) : (
                <span className={actionIconClass}>
                  <FiUser size={20} />
                </span>
              )}
            </button>

            {isLoggedIn && userOpen && (
              <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                <div className="border-b border-slate-200 px-4 py-3">
                  <p className="font-semibold capitalize">{user?.name || "User"}</p>
                  <p className="truncate text-sm text-gray-500">{user?.email || ""}</p>
                </div>
                <ul className="flex flex-col">
                  <li>
                    <Link href="/profile" onClick={() => setUserOpen(false)} className="flex items-center px-4 py-2 hover:bg-emerald-50 hover:text-emerald-700">Profile</Link>
                  </li>
                  <li>
                    <Link href="/order" onClick={() => setUserOpen(false)} className="flex items-center px-4 py-2 hover:bg-emerald-50 hover:text-emerald-700">Orders</Link>
                  </li>
                  <li>
                    <Link href="/notifications" onClick={() => setUserOpen(false)} className="flex items-center px-4 py-2 hover:bg-emerald-50 hover:text-emerald-700">Notifications</Link>
                  </li>
                  {user?.role === "admin" && (
                    <li>
                      <Link href="/admin" onClick={() => setUserOpen(false)} className="flex items-center px-4 py-2 hover:bg-emerald-50 hover:text-emerald-700">Admin Dashboard</Link>
                    </li>
                  )}
                  <li>
                    <button onClick={handleLogout} className="flex w-full items-center px-4 py-2 hover:bg-red-50 hover:text-red-600">Logout</button>
                  </li>
                </ul>
              </div>
            )}
          </div>

          <button
            className="rounded-xl border border-slate-200 bg-white p-1.5 text-2xl text-slate-700 shadow-sm md:hidden"
            onClick={() => setIsOpen((p) => !p)}
            aria-label="Toggle Menu"
          >
            {isOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div ref={mobileMenuRef} className="border-t border-slate-200 bg-white shadow-md md:hidden">
          <ul className="flex flex-col space-y-2 p-3">
            {navLinks.map((link) => (
              <li key={link.name}>
                <Link
                  href={link.href}
                  onClick={() => {
                    setIsOpen(false);
                  }}
                  className={`block rounded-xl px-2.5 py-2 text-sm font-medium capitalize transition ${
                    isLinkActive(link.href)
                      ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white"
                      : "text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
                  }`}
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
