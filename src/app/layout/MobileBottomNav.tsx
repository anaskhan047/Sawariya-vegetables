"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Store, Carrot, Apple, Phone } from "lucide-react";

const items = [
  { href: "/", label: "Home", Icon: Home, match: (p: string) => p === "/" },
  { href: "/shop", label: "Shop", Icon: Store, match: (p: string) => p === "/shop" || p.startsWith("/shop/") },
  {
    href: "/vegetables",
    label: "Veggies",
    Icon: Carrot,
    match: (p: string) => p === "/vegetables" || p.startsWith("/vegetables/"),
  },
  {
    href: "/fruit",
    label: "Fruit",
    Icon: Apple,
    match: (p: string) => p === "/fruit" || p.startsWith("/fruit/"),
  },
  {
    href: "/contact",
    label: "Contact",
    Icon: Phone,
    match: (p: string) => p === "/contact" || p.startsWith("/contact/"),
  },
] as const;

export default function MobileBottomNav() {
  const pathname = usePathname() ?? "/";

  return (
    <nav
      aria-label="Main navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-emerald-100/90 bg-white/95 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 shadow-[0_-10px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl md:hidden"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between gap-0.5 px-1.5">
        {items.map(({ href, label, Icon, match }) => {
          const active = match(pathname);
          return (
            <li key={href} className="min-w-0 flex-1">
              <Link
                href={href}
                prefetch
                className={`flex min-h-[48px] min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 transition active:scale-[0.97] ${
                  active
                    ? "text-emerald-700"
                    : "text-slate-500 hover:text-emerald-600 active:text-emerald-700"
                } `}
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${
                    active
                      ? "bg-emerald-100 text-emerald-700 shadow-inner"
                      : "bg-transparent text-current"
                  }`}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} aria-hidden />
                </span>
                <span className="max-w-full truncate text-[0.625rem] font-semibold leading-none tracking-tight text-current min-[360px]:text-[0.6875rem]">
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
