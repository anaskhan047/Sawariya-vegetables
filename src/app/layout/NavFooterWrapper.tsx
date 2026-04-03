'use client';

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function NavbarFooterWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");
  const isDeliveryBoyRoute = pathname.startsWith("/delivery");
  const isShopRoute = pathname.startsWith("/shop");
  const shouldShowNavbar = !isAdminRoute && !isDeliveryBoyRoute;
  return (
    <>
      {shouldShowNavbar && <Navbar />}
      <main className={shouldShowNavbar ? "pt-[72px] md:pt-[84px]" : ""}>{children}</main>
      {shouldShowNavbar && !isShopRoute && <Footer />}
    </>
  );
}
