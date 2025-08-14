export const metadata = {
  title: "Shop - My Website",
};

// import ShopSidebar from "../components/shop/sidebar";
import ShopGrid from "../components/shop/shopgrid";

export default function ShopPage() {

  return (
    <main>
      <div className="flex">
        <ShopGrid />
      </div>
    </main>
  );
}
