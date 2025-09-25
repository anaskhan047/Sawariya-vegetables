"use client";
import { Suspense } from "react";
import ShopSidebar from "./sidebar";

// Define a proper props interface
interface ShopSidebarWrapperProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ShopSidebarWrapper(props: ShopSidebarWrapperProps) {
  return (
    <Suspense fallback={null}>
      <ShopSidebar {...props} />
    </Suspense>
  );
}
