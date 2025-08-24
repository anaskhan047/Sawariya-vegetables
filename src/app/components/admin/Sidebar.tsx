"use client";

import React, { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Receipt,
  Package,
  Tag,
  Users,
  MessageSquare,
  MapPin,
  Settings,
  Menu,
} from "lucide-react";
import { BiCube } from "react-icons/bi";
import { MdDraw } from "react-icons/md";
import clsx from "clsx";

interface MenuItem {
  name: string;
  icon: ReactNode;
  link: string;
  notification?: boolean;
}

const menuItems: MenuItem[] = [
  { name: "Dashboard", icon: <BiCube size={20} />, link: "/admin" },
  { name: "Orders", icon: <Receipt size={20} />, link: "/admin/orders" },
  { name: "Product Management", icon: <Package size={20} />, link: "/products",  },
  { name: "Categories", icon: <Tag size={20} />, link: "/admin/categories" },
  { name: "UI", icon: <MdDraw size={20} />, link: "/admin/ui" },
  { name: "Users", icon: <Users size={20} />, link: "/admin/users" ,notification: true},
  { name: "Messages", icon: <MessageSquare size={20} />, link: "/messages" },
  { name: "Delivery Areas", icon: <MapPin size={20} />, link: "/delivery-areas" },
  { name: "Settings", icon: <Settings size={20} />, link: "/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();

  // Desktop collapsed state
  const [isOpen, setIsOpen] = useState<boolean>(true);

  // Mobile drawer open state
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);

  // Close mobile menu when route changes (client-side nav)
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Close mobile menu when resizing to desktop (client-only effect)
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileOpen]);

  const handleMenuClick = () => {
    // close mobile drawer when user clicks any menu link
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Hamburger Button (CSS hides on md+) */}
      <button
        aria-label="Open menu"
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white shadow-md hover:bg-gray-100 transition"
        onClick={() => setIsMobileOpen((p) => !p)}
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      <div
        onClick={() => setIsMobileOpen(false)}
        className={clsx(
          "fixed inset-0 bg-black/40 z-30 transition-opacity md:hidden",
          {
            "opacity-100 pointer-events-auto": isMobileOpen,
            "opacity-0 pointer-events-none": !isMobileOpen,
          }
        )}
        aria-hidden={!isMobileOpen}
      />

      {/* Sidebar */}
      <aside
        className={clsx(
          "bg-white shadow-md h-screen p-4 flex flex-col fixed md:static top-0 left-0 z-40 transition-transform duration-300",
          {
            "w-60": isOpen,
            "w-16": !isOpen,
            // Mobile drawer behavior: open -> translate-x-0; closed -> off-canvas left.
            // md:translate-x-0 ensures on desktop the sidebar is always visible regardless of isMobileOpen.
            "translate-x-0": isMobileOpen,
            "-translate-x-full md:translate-x-0": !isMobileOpen,
          }
        )}
        aria-hidden={false}
      >
       

        {/* Logo (always render small icon to avoid SSR/CSR differences) */}
        <div className={clsx("flex items-center mb-8", { "justify-center": !isOpen })}>
          <div className="flex items-center gap-3">
            {/* small icon/logo square — always visible */}
            <div className="w-8 h-8 rounded-md bg-[var(--secondary-color)] flex items-center justify-center text-white font-bold">
              A
            </div>

            {/* Logo text hidden when collapsed */}
            <span className={clsx("text-[var(--secondary-color)] font-bold text-xl tracking-wide transition-all", { hidden: !isOpen })}>
              Logo
            </span>
          </div>
        </div>

        {/* Menu */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.link;
            return (
              <Link
                key={item.name}
                href={item.link}
                onClick={handleMenuClick}
                className={clsx(
                  "relative flex items-center gap-3 p-2 rounded-md transition-all duration-200",
                  { "justify-center": !isOpen },
                  isActive
                    ? "bg-[var(--secondary-color)] text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-100 hover:text-[var(--secondary-color)]"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                {/* Active left bar */}
                {isActive && <span className="absolute left-0 top-0 h-full w-1 bg-[var(--secondary-color)] rounded-tr-md rounded-br-md" />}

                {/* Icon */}
                <span className="flex-shrink-0">{item.icon}</span>

                {/* Text label (hidden when collapsed) */}
                <span className={clsx("flex-1 transition-opacity", { hidden: !isOpen })}>
                  {item.name}
                </span>

                {/* Notification */}
                {item.notification && isOpen && <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
