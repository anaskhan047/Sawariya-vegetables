"use client";

import { useRouter, usePathname } from "next/navigation";
import { useCart } from "@/app/context/CartContext";
import { ShoppingCart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CartFloatingButton() {
  const router = useRouter();
  const pathname = usePathname();
  const { cartCount } = useCart();

  // Hide button if user is in Admin or DeliveryBoy layout
  const isRestrictedPage =
    pathname.startsWith("/admin") || pathname.startsWith("/deliveryBoy");

  const showButton = cartCount > 0 && !isRestrictedPage;
// update 
  return (
    <AnimatePresence>
      {showButton && (
        <motion.button
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.7 }}
          transition={{ duration: 0.3 }}
          onClick={() => router.push("/cart")}
          className="fixed bottom-5 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-2 bg-green-600 text-white font-medium px-5 py-3 rounded-full shadow-lg hover:bg-green-700 transition"
        >
          <ShoppingCart className="w-5 h-5" />
          <span>
            {cartCount} item{cartCount > 1 ? "s" : ""}
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
