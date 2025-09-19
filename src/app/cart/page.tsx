"use client";

import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { useCart } from "../context/CartContext";

type Product = {
  _id: string;
  id: string;
  name: string;
  inHindi?: string;
  price: number;
  unit: string;
  images: { url: string }[];
};

type CartItem = {
  _id: string;
  productId: Product;
  quantity: number;
  priceAtAdd: number;
};

export default function CartPage() {
  const { isLoggedIn, isLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loadingCart, setLoadingCart] = useState(false);
  const { refreshCart } = useCart();
  const fetchCart = async () => {
    if (!isLoggedIn) return;
    try {
      setLoadingCart(true);
      const res = await fetch("/api/cart");
      const data = await res.json();
      if (res.ok && data.success) setItems(data.items);
    } catch (err) {
      console.error("Failed to fetch cart:", err);
    } finally {
      setLoadingCart(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) fetchCart();
  }, [isLoggedIn]);

  const updateQty = async (productId: string, newQty: number) => {
    try {
      setLoadingCart(true);
      const res = await fetch("/api/cart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: newQty }),
      });
      if (res.ok) fetchCart();
    } catch (err) {
      console.error(err);
      setLoadingCart(false);
    }
  };

  const removeItem = async (productId: string) => {
    try {
      setLoadingCart(true);
      const res = await fetch("/api/cart", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (res.ok) {
        await refreshCart();
        fetchCart();
      }
    } catch (err) {
      console.error(err);
      setLoadingCart(false);
    }
  };

  const priceSummary = useMemo(() => {
    const subTotal = items.reduce(
      (sum, it) => sum + it.productId.price * it.quantity,
      0
    );
    const delivery = subTotal >= 300 ? 0 : 29;
    const total = subTotal + delivery;
    return { subTotal, delivery, total };
  }, [items]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-xl font-bold text-gray-700 mb-4">
          Please login to view your cart 🛒
        </h2>
        <button
          onClick={() => router.push("/login")}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          Go to Login
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-lg text-gray-600 mb-4">Your cart is empty 🛍️</h2>
        <button
          onClick={() => router.push("/shop")}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          Go to Shop
        </button>
      </div>
    );
  }

  // Free delivery calculation
  const freeDeliveryThreshold = 300;
  const remainingForFreeDelivery =
    priceSummary.subTotal >= freeDeliveryThreshold
      ? 0
      : freeDeliveryThreshold - priceSummary.subTotal;
  const progressPercent =
    priceSummary.subTotal >= freeDeliveryThreshold
      ? 100
      : (priceSummary.subTotal / freeDeliveryThreshold) * 100;

  return (
    <div className="px-4 py-6 max-w-7xl mx-auto relative">
      {/* Fixed Free Delivery Bar */}
      <div className="fixed top-14 left-1/2 transform -translate-x-1/2 w-11/12 md:w-3/4 lg:w-2/3 z-50">
        <div className="p-4 bg-green-50 rounded-lg border border-green-200 shadow-md">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium text-green-800">
              {priceSummary.subTotal >= freeDeliveryThreshold
                ? "🎉 Free delivery applied!"
                : `Add ₹${remainingForFreeDelivery} more for free delivery`}
            </span>
            {priceSummary.subTotal >= freeDeliveryThreshold && (
              <span className="text-green-700 font-bold text-xl">✔️</span>
            )}
          </div>
          <div className="w-full h-3 bg-green-200 rounded-full overflow-hidden">
            <div
              className="h-3 bg-green-600 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      <h1 className="text-3xl font-bold mb-6 mt-32">Your Cart</h1>

      {/* Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 capitalize">
        {items.map((it) => (
          <div
            key={it._id}
            className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition transform hover:-translate-y-1"
          >
            <div className="flex items-center gap-3 mb-2">
              <img
                src={it.productId.images[0]?.url || "/placeholder.png"}
                alt={it.productId.name}
                className="w-16 h-16 object-cover rounded-md"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-lg">
                  {it.productId.name} / {it.productId.inHindi}
                </h3>
                <p className="text-gray-500">{it.productId.unit}</p>
              </div>
              <p className="font-semibold text-green-700">
                ₹ {it.productId.price * it.quantity}
              </p>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => {
                  const step = it.productId.unit === "kg" ? 0.5 : 1;
                  updateQty(it.productId.id, Math.max(step, it.quantity - step));
                }}
                className="px-3 py-1 border rounded hover:bg-gray-100 transition"
              >
                -
              </button>

              <span>{it.quantity}</span>

              <button
                onClick={() => {
                  const step = it.productId.unit === "kg" ? 0.5 : 1;
                  updateQty(it.productId.id, it.quantity + step);
                }}
                className="px-3 py-1 border rounded hover:bg-gray-100 transition"
              >
                +
              </button>

              <button
                onClick={() => removeItem(it.productId.id)}
                className="ml-auto text-red-600 hover:underline transition"
              >
                Remove
              </button>
            </div>

          </div>
        ))}
      </div>

      {/* Summary */}
<div className="mt-6 border rounded-lg p-4 bg-white shadow-md max-w-md relative">
  {loadingCart && (
    <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center rounded-lg">
      <div className="loader border-4 border-green-500 border-t-transparent rounded-full w-8 h-8 animate-spin"></div>
    </div>
  )}
  <h2 className="text-lg font-semibold mb-4">Bill Details</h2>
  <div className="space-y-2 text-sm">
    <div className="flex justify-between">
      <span>Items total</span>
      <span>₹ {priceSummary.subTotal}</span>
    </div>
    <div className="flex justify-between">
      <span>Delivery</span>
      <span>
        {priceSummary.delivery === 0 ? "Free" : `₹ ${priceSummary.delivery}`}
      </span>
    </div>
    <div className="border-t my-2"></div>
    <div className="flex justify-between font-semibold">
      <span>Total</span>
      <span>₹ {priceSummary.total}</span>
    </div>
  </div>

  {/* ✅ Minimum Order Restriction */}
  {priceSummary.subTotal < 50 ? (
    <p className="mt-3 text-sm text-red-600 font-medium text-center">
      Add ₹{50 - priceSummary.subTotal} more to checkout 🚀
    </p>
  ) : null}

  <button
    disabled={priceSummary.subTotal < 50}
    className={`mt-4 w-full rounded-lg py-2 transition ${
      priceSummary.subTotal < 50
        ? "bg-gray-400 cursor-not-allowed"
        : "bg-green-600 text-white hover:bg-green-700"
    }`}
  >
    Proceed to Checkout
  </button>
</div>


      {/* Loader CSS */}
      <style jsx>{`
        .loader {
          border-width: 3px;
          border-color: #16a34a;
          border-top-color: transparent;
          border-radius: 50%;
          width: 2rem;
          height: 2rem;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
