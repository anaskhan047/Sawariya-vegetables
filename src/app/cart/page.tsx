"use client";

import { useAuth } from "@/app/context/AuthContext";
import { useCart } from "@/app/context/CartContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo, useCallback } from "react";
import Swal from "sweetalert2";
import Image from "next/image";
import QRCode from "qrcode";
type Product = {
  _id: string;
  id: string;
  name: string;
  inHindi?: string;
  price: number;
  unit: string;
  images: { url: string }[];
  minQty: number;
  maxQty: number;
};

type CartItem = {
  _id: string;
  productId: Product;
  quantity: number;
  priceAtAdd: number;
};

type DeliveryArea = {
  _id: string;
  name: string;
  pincode: string;
};

type UserResponse = {
  success?: boolean;
  user?: {
    name?: string;
    phone?: string;
    address?: string;
  };
};

const UPI_IDS = [
  process.env.NEXT_PUBLIC_UPI_1 || "9301893055@ybl",
  process.env.NEXT_PUBLIC_UPI_2 || "7489988065@ibl",
  process.env.NEXT_PUBLIC_UPI_3 || "7869600155@ybl",
  process.env.NEXT_PUBLIC_UPI_4 || "9893404617@ybl",
];

export default function CartPage() {
  const { isLoggedIn, isLoading } = useAuth();
  const { refreshCart } = useCart();
  const router = useRouter();

  const [items, setItems] = useState<CartItem[]>([]);
  const [loadingCart, setLoadingCart] = useState(false);
  const [areas, setAreas] = useState<DeliveryArea[]>([]);

  //  Fetch Cart from API
  const fetchCart = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      setLoadingCart(true);
      const res = await fetch("/api/cart", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      if (res.ok && data.success) setItems(data.items);
    } catch (err) {
      console.error("Failed to fetch cart:", err);
    } finally {
      setLoadingCart(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) fetchCart();
  }, [isLoggedIn, fetchCart]);

  //  Update quantity
  const updateQty = async (productId: string, newQty: number) => {
    try {
      setLoadingCart(true);
      const res = await fetch("/api/cart", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ productId, quantity: newQty }),
      });
      if (res.ok) fetchCart();
    } catch (err) {
      console.error(err);
      setLoadingCart(false);
    }
  };

  //  Remove item
  const removeItem = async (productId: string) => {
    try {
      setLoadingCart(true);
      const res = await fetch("/api/cart", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
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

  //  Price Summary
  const priceSummary = useMemo(() => {
    const subTotal = items.reduce(
      (sum, it) => sum + it.productId.price * it.quantity,
      0
    );
    const delivery = subTotal >= 300 ? 0 : 29;
    const total = subTotal + delivery;
    return { subTotal, delivery, total };
  }, [items]);

  //  Fetch delivery areas
  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const res = await fetch("/api/delivery-area");
        const data: DeliveryArea[] = await res.json();
        if (res.ok) setAreas(data);
      } catch (err) {
        console.error("Failed to fetch delivery areas", err);
      }
    };
    fetchAreas();
  }, []);

  //  Checkout Flow
  //  Checkout Flow
  const handleCheckout = async () => {
    if (priceSummary.subTotal < 50) return;

    const token = localStorage.getItem("token");
    if (!token) {
      return Swal.fire("Error", "Please login again!", "error");
    }

    try {
      // Confirm order
      const confirm = await Swal.fire({
        title: "Confirm Your Order",
        html: `<p><b>Total:</b> ₹${priceSummary.total}</p><p>Are you sure?</p>`,
        showCancelButton: true,
        confirmButtonText: "Yes, Proceed",
      });
      if (!confirm.isConfirmed) return;

      //  Fetch logged-in user
      const resUser = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData: UserResponse = await resUser.json();
      if (!resUser.ok) throw new Error("Please login again!");

      //  Get Address
      const { value: addressForm } = await Swal.fire({
        title: "Enter Delivery Details",
        html: `
        <input id="swalName" class="swal2-input" placeholder="Name" value="${userData.user?.name || ""}" />
        <input id="swalPhone" class="swal2-input" placeholder="Phone" value="${userData.user?.phone || ""}" />
        <input id="swalAddress" class="swal2-input" placeholder="House No, Street" value="${userData.user?.address || ""}" />
        <select id="swalArea" class="swal2-input">
          <option value="">Select Delivery Area</option>
          ${areas.map((a) => `<option value="${a._id}">${a.name} - ${a.pincode}</option>`).join("")}
        </select>
      `,
        focusConfirm: false,
        preConfirm: () => ({
          name: (document.getElementById("swalName") as HTMLInputElement)?.value,
          phone: (document.getElementById("swalPhone") as HTMLInputElement)?.value,
          address: (document.getElementById("swalAddress") as HTMLInputElement)?.value,
          area: (document.getElementById("swalArea") as HTMLSelectElement)?.value,
        }),
      });

      if (!addressForm || !addressForm.area)
        return Swal.fire("Error", "Please select delivery area.", "error");

      //  Payment Method
      const { value: paymentMethod } = await Swal.fire({
        title: "Select Payment Method",
        input: "radio",
        inputOptions: { cod: "Cash on Delivery", upi: "UPI (QR + Apps)" },
        inputValidator: (v) => (!v ? "Select one option" : undefined),
      });
      if (!paymentMethod) return;

      //  Prepare order items
      const orderItems = items.map((it) => ({
        productId: it.productId._id, // MUST use _id
        name: it.productId.name,
        inHindi: it.productId.inHindi || "",
        price: it.productId.price,
        quantity: it.quantity,
        unit: it.productId.unit,
      }));

      if (paymentMethod === "upi") {
        const chosenUpiId =
          UPI_IDS[Math.floor(Math.random() * UPI_IDS.length)];

        // build UPI URL (client side)
        const upiUrl = `upi://pay?pa=${chosenUpiId}&am=${priceSummary.total}&cu=INR&tn=Order`;

        // Show QR + apps + UTR input
        const result = await Swal.fire({
          title: "UPI Payment",
          html: `
          <p>Pay ₹${priceSummary.total} using any UPI app:</p>
          <div style="display:flex; justify-content:center; margin:12px 0;">
            <canvas id="swal-qr-canvas"></canvas>
          </div>
          <div class="flex justify-center gap-4 mt-2">
            <a href="${upiUrl}" target="_blank" class="px-3 py-1 bg-green-500 text-white rounded">Google Pay</a>
            <a href="${upiUrl}" target="_blank" class="px-3 py-1 bg-purple-600 text-white rounded">PhonePe</a>
            <a href="${upiUrl}" target="_blank" class="px-3 py-1 bg-blue-600 text-white rounded">Paytm</a>
          </div>
          <input id="utrInput" class="swal2-input mt-4" placeholder="Enter UTR/Txn ID" />
        `,
          confirmButtonText: "Submit Payment",
          cancelButtonText: "Back",
          showCancelButton: true,
          allowOutsideClick: false,
          allowEscapeKey: false,
          didOpen: () => {
            const canvas = document.getElementById("swal-qr-canvas") as HTMLCanvasElement | null;
            if (canvas) {
              QRCode.toCanvas(canvas, upiUrl, { width: 220 });
            }
          },
          preConfirm: () => {
            const utr = ((document.getElementById("utrInput") as HTMLInputElement)?.value || "").trim();
            if (!utr) {
              Swal.showValidationMessage("Please enter your UTR / Transaction ID");
            }
            return utr;
          },
        });

        if (result.dismiss === Swal.DismissReason.cancel) {
          return handleCheckout(); // restart flow if back pressed
        }
        if (!result.isConfirmed) return;

        const utrNumber = result.value as string;

        //  Now create order only after UTR is given
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            items: orderItems,
            address: addressForm,
            paymentMethod,
            deliveryCharge: priceSummary.delivery,
            upiId: chosenUpiId,
            utr: utrNumber,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Payment failed!");

        Swal.fire("Success", "Payment recorded. Your order is placed!", "success");
      } else {
        //  COD directly creates order
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            items: orderItems,
            address: addressForm,
            paymentMethod,
            deliveryCharge: priceSummary.delivery,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Server error!");

        Swal.fire("Success", "Your order has been placed!", "success");
      }

      //  Clear cart both sides
      setItems([]);
      await fetch("/api/cart", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      await refreshCart();
      router.push("/order");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      Swal.fire("Error", message, "error");
    }
  };


  //  UI States
  if (isLoading)
    return <div className="flex items-center justify-center min-h-[60vh]">Loading...</div>;

  if (!isLoggedIn)
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

  if (items.length === 0)
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

  //  Free delivery bar progress
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
      {/* Free Delivery Bar */}
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

      {/* Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {items.map((it) => (
          <div
            key={it._id + it.productId._id}
            className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition"
          >
            <div className="flex items-center gap-3 mb-2">
              <Image
                src={it.productId.images[0]?.url || "/placeholder.png"}
                alt={it.productId.name}
                width={64}
                height={64}
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
                  const newQty = Math.max(it.productId.minQty, it.quantity - step); // 👈 minQty se kam nahi hoga
                  updateQty(it.productId._id, newQty);
                }}
                className="px-3 py-1 border rounded hover:bg-gray-100 transition"
              >
                -
              </button>

              <span>{it.quantity}</span>

              <button
                onClick={() => {
                  const step = it.productId.unit === "kg" ? 0.5 : 1;
                  const newQty = Math.min(it.productId.maxQty, it.quantity + step); // 👈 maxQty se zyada nahi hoga
                  updateQty(it.productId._id, newQty);
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
            <span>{priceSummary.delivery === 0 ? "Free" : `₹ ${priceSummary.delivery}`}</span>
          </div>
          <div className="border-t my-2"></div>
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>₹ {priceSummary.total}</span>
          </div>
        </div>

        {priceSummary.subTotal < 50 && (
          <p className="mt-3 text-sm text-red-600 font-medium text-center">
            Add ₹{50 - priceSummary.subTotal} more to checkout 🚀
          </p>
        )}

        <button
          disabled={priceSummary.subTotal < 50}
          onClick={handleCheckout}
          className={`mt-4 w-full rounded-lg py-2 transition ${priceSummary.subTotal < 50
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-green-600 text-white hover:bg-green-700"
            }`}
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
}