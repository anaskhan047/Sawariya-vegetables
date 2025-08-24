export const metadata = {
  title: "Shop - My Website",
};

import ShopSidebar from "../components/shop/sidebar";
import ShopGrid from "../components/shop/shopgrid";

export default function ShopPage() {
  return (
    <main className="min-h-screen bg-[var(--background-color)]">
      <div className="flex flex-col md:flex-row">
        {/* Sidebar (visible on desktop) */}
        <div className="hidden md:block">
          <ShopSidebar />
        </div>

        {/* Products grid */}
        <div className="flex-1">
          <ShopGrid />
        </div>
      </div>
    </main>
  );
}
