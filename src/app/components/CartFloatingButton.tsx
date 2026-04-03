"use client";

import React, { JSX } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useCart } from "@/app/context/CartContext";
import { ShoppingCart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CartFloatingButton(): JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const { cartCount } = useCart();

  const isRestrictedPage =
    pathname.startsWith("/admin") || pathname.startsWith("/deliveryBoy") || pathname.startsWith("/cart");
  const showButton = (cartCount ?? 0) > 0 && !isRestrictedPage;

  const handleClick = (): void => {
    router.push("/cart");
  };

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.75, y: 12 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { type: "spring", stiffness: 500, damping: 26 },
    },
    exit: { opacity: 0, scale: 0.8, y: 6, transition: { duration: 0.18 } },
  } as const;

  return (
    <AnimatePresence>
      {showButton && (
        <motion.button
          aria-label={`Open cart with ${cartCount} item${cartCount > 1 ? "s" : ""}`}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={containerVariants}
          onClick={handleClick}
          className="fixed bottom-3 left-1/2 z-50 flex w-[calc(100%-14px)] max-w-[360px] -translate-x-1/2 items-center gap-2 rounded-2xl border border-white/10 bg-gradient-to-r from-green-600 to-emerald-500 px-2.5 py-2 text-white shadow-2xl backdrop-blur-md sm:bottom-5 sm:w-auto sm:max-w-none sm:gap-3 sm:rounded-full sm:px-4 sm:py-2.5"
          style={{ WebkitTapHighlightColor: "transparent" }}
        >
          <motion.span
            className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/10 sm:h-10 sm:w-10"
            initial={{ rotate: -10 }}
            animate={{ rotate: 0 }}
            whileHover={{ rotate: 8, scale: 1.04 }}
            transition={{ type: "spring", stiffness: 380, damping: 16 }}
          >
            <motion.span
              className="absolute inset-0 rounded-full"
              animate={{
                scale: [1, 1.06, 1],
                boxShadow: [
                  "0 0 0 0 rgba(34,197,94,0.35)",
                  "0 0 18px 6px rgba(34,197,94,0.12)",
                  "0 0 0 0 rgba(34,197,94,0)",
                ],
              }}
              transition={{ duration: 1.6, repeat: Infinity }}
            />

            <ShoppingCart className="h-5 w-5 text-white drop-shadow-md" />

            <motion.span
              layout
              className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white px-1 text-[11px] font-semibold text-green-700 shadow-inner sm:-right-2 sm:-top-2 sm:min-w-[22px] sm:text-xs"
              initial={{ scale: 0 }}
              animate={{ scale: 1, transition: { type: "spring", stiffness: 700, damping: 20 } }}
            >
              {cartCount}
            </motion.span>
          </motion.span>

          <div className="min-w-0 flex-1 leading-tight sm:flex-none">
            <motion.span
              className="truncate text-xs font-semibold tracking-tight sm:text-sm"
              initial={{ y: 6, opacity: 0 }}
              animate={{ y: 0, opacity: 1, transition: { delay: 0.06 } }}
            >
              View cart
            </motion.span>
            <motion.span
              className="block truncate text-[11px] text-white/90 opacity-90 sm:text-[13px]"
              initial={{ y: 6, opacity: 0 }}
              animate={{ y: 0, opacity: 1, transition: { delay: 0.12 } }}
            >
              {cartCount} item{cartCount > 1 ? "s" : ""} | Checkout now
            </motion.span>
          </div>

          <motion.span
            className="ml-1 flex h-7 w-7 items-center justify-center rounded-full bg-white/8 sm:ml-2 sm:h-8 sm:w-8"
            whileHover={{ x: 6 }}
            transition={{ type: "spring", stiffness: 400, damping: 24 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 18l6-6-6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
