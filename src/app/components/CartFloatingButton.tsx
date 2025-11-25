"use client";

import React, { JSX } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useCart } from "@/app/context/CartContext";
import { ShoppingCart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CartFloatingButton(): JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const { cartCount } = useCart(); // assume number

  // Hide button on admin / delivery pages
  const isRestrictedPage = pathname.startsWith("/admin") || pathname.startsWith("/deliveryBoy");
  const showButton = (cartCount ?? 0) > 0 && !isRestrictedPage;

  const handleClick = (): void => {
    router.push("/cart");
  };

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.75, y: 12 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 500, damping: 26 } },
    exit: { opacity: 0, scale: 0.8, y: 6, transition: { duration: 0.18 } },
  } as const;

  const pulseVariants = {
    idle: { scale: 1 },
    pulse: { scale: [1, 1.06, 1], boxShadow: ["0 0 0 0 rgba(34,197,94,0.35)", "0 0 18px 6px rgba(34,197,94,0.12)", "0 0 0 0 rgba(34,197,94,0)"] , transition: { duration: 1.6, repeat: Infinity } },
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
          className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-full shadow-2xl bg-gradient-to-r from-green-600 to-emerald-500 text-white border border-white/10 backdrop-blur-md"
          style={{ WebkitTapHighlightColor: "transparent" }}
        >
          {/* animated badge + icon */}
          <motion.span
            className="relative flex items-center justify-center w-10 h-10 rounded-full bg-white/10"
            initial={{ rotate: -10 }}
            animate={{ rotate: 0 }}
            whileHover={{ rotate: 8, scale: 1.04 }}
            transition={{ type: "spring", stiffness: 380, damping: 16 }}
          >
            <motion.span
              className="absolute inset-0 rounded-full"
              animate="pulse"
            />

            <ShoppingCart className="w-5 h-5 text-white drop-shadow-md" />

            {/* count bubble */}
            <motion.span
              layout
              className="absolute -top-2 -right-2 flex items-center justify-center min-w-[22px] h-5 px-1 rounded-full bg-white text-green-700 text-xs font-semibold shadow-inner"
              initial={{ scale: 0 }}
              animate={{ scale: 1, transition: { type: "spring", stiffness: 700, damping: 20 } }}
            >
              {cartCount}
            </motion.span>
          </motion.span>

          <div className="flex flex-col items-start leading-tight">
            <motion.span
              className="text-sm font-semibold tracking-tight"
              initial={{ y: 6, opacity: 0 }}
              animate={{ y: 0, opacity: 1, transition: { delay: 0.06 } }}
            >
              View cart
            </motion.span>
            <motion.span
              className="text-[13px] opacity-90 text-white/90"
              initial={{ y: 6, opacity: 0 }}
              animate={{ y: 0, opacity: 1, transition: { delay: 0.12 } }}
            >
              {cartCount} item{cartCount > 1 ? "s" : ""} • Checkout now
            </motion.span>
          </div>

          {/* subtle chevron */}
          <motion.span
            className="ml-3 flex items-center justify-center rounded-full w-8 h-8 bg-white/8"
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
