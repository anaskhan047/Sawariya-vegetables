'use client';

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function NavbarFooterWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");
  const isDeliveryBoyRoute = pathname.startsWith("/delivery");
  return (
    <>
      {!isAdminRoute && !isDeliveryBoyRoute && <Navbar />}
      {children}
      {!isAdminRoute && !isDeliveryBoyRoute && <Footer />}
    </>
  );
}