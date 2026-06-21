"use client";

import { useAuth } from "@/app/context/AuthContext";
import { useCart } from "@/app/context/CartContext";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import QRCode from "qrcode";
import Swal from "sweetalert2";
import OrbitVegetableLoader from "../components/Loader/Loader";
import {
  requestNotificationPermissionFromUserGesture,
  showBrowserOrderConfirmation,
} from "@/app/lib/notifications/browserOrderNotification";
import { getCheckoutBlockedMessage, getOrderWindowStatus } from "@/app/lib/orderWindow";
import { getOrderableMaxQty } from "@/app/lib/stock";

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
  stockQty?: number;
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
    isActive?: boolean;
  };
};

type CheckoutForm = {
  name: string;
  phone: string;
  address: string;
  area: string;
  paymentMethod: "cod" | "upi";
};

type UpiState = {
  upiId: string;
  upiUrl: string;
  qrDataUrl: string;
  utr: string;
};

type SavedCheckoutDetails = {
  name?: string;
  phone?: string;
  address?: string;
  area?: string;
};

const UPI_IDS = [
  process.env.NEXT_PUBLIC_UPI_1 || "rathorevishal7523-1@okaxis",
  process.env.NEXT_PUBLIC_UPI_2 || "rathorevishal7523-1@okaxis",
  process.env.NEXT_PUBLIC_UPI_3 || "rathorevishal7523-1@okaxis",
  process.env.NEXT_PUBLIC_UPI_4 || "rathorevishal7523-1@okaxis",
];

const CHECKOUT_STORAGE_KEY = "ssm_checkout_details_v1";

export default function CartPage() {
  const { isLoggedIn, isLoading } = useAuth();
  const { refreshCart } = useCart();
  const router = useRouter();

  const [items, setItems] = useState<CartItem[]>([]);
  const [loadingCart, setLoadingCart] = useState(false);
  const [areas, setAreas] = useState<DeliveryArea[]>([]);
  const [settings, setSettings] = useState<{
    deliveryCharge?: number;
    freeDeliveryThreshold?: number;
    freeDeliveryAbove?: number;
    orderWindowStart?: string;
    orderWindowEnd?: string;
  }>({});
  const [isAccountActive, setIsAccountActive] = useState<boolean>(true);

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<"details" | "upi">("details");
  const [checkoutError, setCheckoutError] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState<CheckoutForm>({
    name: "",
    phone: "",
    address: "",
    area: "",
    paymentMethod: "cod",
  });

  const [upiState, setUpiState] = useState<UpiState>({
    upiId: "",
    upiUrl: "",
    qrDataUrl: "",
    utr: "",
  });

  const getSavedCheckoutDetails = useCallback((): SavedCheckoutDetails => {
    try {
      const raw = localStorage.getItem(CHECKOUT_STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw) as SavedCheckoutDetails;
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }, []);

  const saveCheckoutDetails = useCallback((details: SavedCheckoutDetails) => {
    try {
      localStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(details));
    } catch {
      // ignore storage failures
    }
  }, []);

  useEffect(() => {
    if (!checkoutOpen) return;

    const previousOverflow = document.body.style.overflow;
    const previousTouchAction = document.body.style.touchAction;
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.touchAction = previousTouchAction;
    };
  }, [checkoutOpen]);

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

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/settings", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (data?.success && data.settings) {
        const s = data.settings;
        setSettings({
          deliveryCharge: typeof s.deliveryCharge === "number" ? s.deliveryCharge : undefined,
          freeDeliveryThreshold: typeof s.freeDeliveryThreshold === "number" ? s.freeDeliveryThreshold : undefined,
          freeDeliveryAbove: typeof s.freeDeliveryAbove === "number" ? s.freeDeliveryAbove : undefined,
          orderWindowStart: typeof s.orderWindowStart === "string" ? s.orderWindowStart : "08:00",
          orderWindowEnd: typeof s.orderWindowEnd === "string" ? s.orderWindowEnd : "23:59",
        });
      }
    } catch (err) {
      console.warn("Failed to fetch settings:", err);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
    const iv = setInterval(fetchSettings, 60_000);
    return () => clearInterval(iv);
  }, [fetchSettings]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    const fetchMe = async () => {
      try {
        const res = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = (await res.json().catch(() => ({}))) as UserResponse;
        const active = Boolean(data?.user?.isActive ?? true);
        setIsAccountActive(active);
      } catch {
        setIsAccountActive(true);
      }
    };

    fetchMe().catch(() => undefined);
  }, [isLoggedIn]);

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
    fetchAreas().catch(() => undefined);
  }, []);

  const updateQty = async (productId: string, newQty: number) => {
    setItems((prev) => prev.map((it) => (it.productId._id === productId ? { ...it, quantity: newQty } : it)));

    try {
      await fetch("/api/cart", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ productId, quantity: newQty }),
      });
      refreshCart();
    } catch (err) {
      console.error(err);
    }
  };

  const removeItem = async (productId: string) => {
    const previousItems = items;
    setItems((prev) => prev.filter((it) => it.productId._id !== productId));

    try {
      const res = await fetch("/api/cart", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ productId }),
      });
      if (!res.ok) {
        setItems(previousItems);
        return;
      }
      refreshCart().catch(() => undefined);
    } catch (err) {
      console.error(err);
      setItems(previousItems);
    }
  };

  const deliveryChargeSetting = typeof settings.deliveryCharge === "number" ? settings.deliveryCharge : undefined;
  const freeDeliveryThresholdSetting =
    typeof settings.freeDeliveryThreshold === "number"
      ? settings.freeDeliveryThreshold
      : typeof settings.freeDeliveryAbove === "number"
      ? settings.freeDeliveryAbove
      : undefined;

  const DEFAULT_DELIVERY = 29;
  const DEFAULT_FREE_THRESHOLD = 300;

  const priceSummary = useMemo(() => {
    const subTotal = items.reduce((sum, it) => sum + it.productId.price * it.quantity, 0);
    const freeThreshold = freeDeliveryThresholdSetting ?? DEFAULT_FREE_THRESHOLD;
    const configuredDelivery = deliveryChargeSetting ?? DEFAULT_DELIVERY;
    const delivery = subTotal >= freeThreshold ? 0 : configuredDelivery;
    const total = subTotal + delivery;
    return { subTotal, delivery, total, freeThreshold };
  }, [items, deliveryChargeSetting, freeDeliveryThresholdSetting]);

  const showInactiveAccountModal = async () => {
    await Swal.fire({
      title: "Account Deactivated",
      html: `
        <div style="text-align:left;line-height:1.6;font-size:14px;">
          <div style="background:#fff1f2;border:1px solid #fecdd3;padding:12px;border-radius:10px;margin-bottom:10px;">
            <strong style="color:#be123c;">Your account is currently deactivated.</strong>
          </div>
          <p style="margin:0 0 8px;">You cannot proceed to checkout right now.</p>
          <p style="margin:0;color:#475569;">Please contact admin to activate your account.</p>
        </div>
      `,
      icon: "warning",
      confirmButtonText: "Understood",
      confirmButtonColor: "#be123c",
      background: "#ffffff",
      customClass: { popup: "swal2-rounded" },
    });
  };

  const orderItems = useMemo(
    () =>
      items.map((it) => ({
        productId: it.productId._id,
        name: it.productId.name,
        inHindi: it.productId.inHindi || "",
        price: it.productId.price,
        quantity: it.quantity,
        unit: it.productId.unit,
      })),
    [items]
  );

  const placeOrder = useCallback(
    async ({ paymentMethod, upiId, utr }: { paymentMethod: "cod" | "upi"; upiId?: string; utr?: string }) => {
      const token = localStorage.getItem("token");
      if (!token) {
        await Swal.fire("Error", "Please login again!", "error");
        return false;
      }

      setPlacingOrder(true);
      try {
        const body: Record<string, unknown> = {
          items: orderItems,
          address: {
            name: checkoutForm.name,
            phone: checkoutForm.phone,
            address: checkoutForm.address,
            area: checkoutForm.area,
          },
          paymentMethod,
          deliveryCharge: priceSummary.delivery,
        };

        if (paymentMethod === "upi") {
          body.upiId = upiId;
          body.utr = utr;
        }

        const res = await fetch("/api/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || "Unable to place order");
        }

        const oid = data.order?._id != null ? String(data.order._id) : undefined;
        const totalNum =
          typeof data.order?.total === "number" && !Number.isNaN(data.order.total)
            ? data.order.total
            : priceSummary.total;
        await showBrowserOrderConfirmation({
          orderId: oid,
          total: totalNum,
          itemCount: orderItems.length,
        });

        await Swal.fire(
          "Success",
          paymentMethod === "upi" ? "Payment verified and order placed!" : "Your order has been placed!",
          "success",
        );

        saveCheckoutDetails({
          name: checkoutForm.name,
          phone: checkoutForm.phone,
          address: checkoutForm.address,
          area: checkoutForm.area,
        });

        fetch("/api/auth/update", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: checkoutForm.name,
            phone: checkoutForm.phone,
            address: checkoutForm.address,
          }),
        }).catch(() => undefined);

        setCheckoutOpen(false);
        setCheckoutStep("details");
        setCheckoutError("");
        setUpiState({ upiId: "", upiUrl: "", qrDataUrl: "", utr: "" });
        setItems([]);

        await fetch("/api/cart", {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        await refreshCart();
        router.push("/order");
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Something went wrong";
        await Swal.fire("Error", message, "error");
        return false;
      } finally {
        setPlacingOrder(false);
      }
    },
    [
      checkoutForm.address,
      checkoutForm.area,
      checkoutForm.name,
      checkoutForm.phone,
      orderItems,
      priceSummary.delivery,
      refreshCart,
      router,
      saveCheckoutDetails,
    ]
  );

  const openCheckoutModal = useCallback(async () => {
    if (priceSummary.subTotal < 50) return;

    const windowStatus = getOrderWindowStatus(
      settings.orderWindowStart || "08:00",
      settings.orderWindowEnd || "23:59"
    );
    if (!windowStatus.isOpen) {
      await Swal.fire({
        title: "Ordering closed for now",
        text: getCheckoutBlockedMessage(windowStatus),
        icon: "info",
        confirmButtonText: "OK",
        confirmButtonColor: "#059669",
      });
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      await Swal.fire("Error", "Please login again!", "error");
      return;
    }

    try {
      const resUser = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData: UserResponse = await resUser.json();
      if (!resUser.ok) throw new Error("Please login again!");

      if (userData?.user?.isActive === false) {
        setIsAccountActive(false);
        await showInactiveAccountModal();
        return;
      }

      const saved = getSavedCheckoutDetails();
      const candidateArea = (saved.area || "").trim();
      const hasValidSavedArea = candidateArea ? areas.some((a) => a._id === candidateArea) : false;

      setCheckoutForm((prev) => ({
        ...prev,
        name: (saved.name || userData.user?.name || "").trim(),
        phone: (saved.phone || userData.user?.phone || "").trim(),
        address: (saved.address || userData.user?.address || "").trim(),
        area: hasValidSavedArea ? candidateArea : "",
        paymentMethod: "cod",
      }));
      setCheckoutError("");
      setCheckoutStep("details");
      setUpiState({ upiId: "", upiUrl: "", qrDataUrl: "", utr: "" });
      setCheckoutOpen(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not open checkout";
      await Swal.fire("Error", message, "error");
    }
  }, [areas, getSavedCheckoutDetails, priceSummary.subTotal, settings.orderWindowEnd, settings.orderWindowStart]);

  const handleContinueDetails = async () => {
    if (placingOrder) return;
    requestNotificationPermissionFromUserGesture();

    if (!checkoutForm.name.trim() || !checkoutForm.phone.trim() || !checkoutForm.address.trim() || !checkoutForm.area) {
      setCheckoutError("Please fill all delivery details and select delivery area.");
      return;
    }

    setCheckoutError("");

    if (checkoutForm.paymentMethod === "cod") {
      await placeOrder({ paymentMethod: "cod" });
      return;
    }

    const chosenUpiId = UPI_IDS[Math.floor(Math.random() * UPI_IDS.length)];
    const upiUrl = `upi://pay?pa=${chosenUpiId}&am=${priceSummary.total}&cu=INR&tn=Order`;

    try {
      const qrDataUrl = await QRCode.toDataURL(upiUrl, { width: 230, margin: 1 });
      setUpiState({ upiId: chosenUpiId, upiUrl, qrDataUrl, utr: "" });
      setCheckoutStep("upi");
    } catch {
      setCheckoutError("Unable to generate UPI QR. Please try again.");
    }
  };

  const handleUpiSubmit = async () => {
    if (placingOrder) return;
    requestNotificationPermissionFromUserGesture();

    if (!upiState.utr.trim()) {
      setCheckoutError("Please enter UTR / transaction ID.");
      return;
    }

    setCheckoutError("");
    await placeOrder({ paymentMethod: "upi", upiId: upiState.upiId, utr: upiState.utr.trim() });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center py-10">
        <OrbitVegetableLoader />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <h2 className="mb-4 text-xl font-bold text-gray-700">Please login to view your cart</h2>
        <button onClick={() => router.push("/login")} className="rounded-lg bg-emerald-600 px-6 py-3 text-white transition hover:bg-emerald-700">
          Go to Login
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <h2 className="mb-4 text-lg text-gray-600">Your cart is empty</h2>
        <button onClick={() => router.push("/shop")} className="rounded-lg bg-emerald-600 px-6 py-3 text-white transition hover:bg-emerald-700">
          Go to Shop
        </button>
      </div>
    );
  }

  const minOrderThreshold = 50;
  const remainingForMinOrder = Math.max(0, minOrderThreshold - priceSummary.subTotal);
  const remainingForFreeDelivery = Math.max(0, priceSummary.freeThreshold - priceSummary.subTotal);
  const freeDeliveryProgress = Math.min(100, (priceSummary.subTotal / priceSummary.freeThreshold) * 100);

  return (
    <>
      <div className="mx-auto w-full max-w-7xl px-3 pb-8 pt-24 md:px-6 md:py-6">
        <div className="mb-5 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-cyan-50 p-4">
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">Cart</h1>
          <p className="mt-1 text-sm text-slate-600">Review quantities, pricing, and checkout details before placing your order.</p>
        </div>

        {!isAccountActive && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            Your account is deactivated. Checkout is blocked. Contact admin to reactivate your account.
          </div>
        )}

        <div className="mb-5 rounded-xl border border-emerald-200 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-700">
              {priceSummary.subTotal >= priceSummary.freeThreshold
                ? "Free delivery unlocked"
                : `Add Rs ${remainingForFreeDelivery} more for free delivery`}
            </p>
            <span className="text-xs font-semibold text-emerald-700">Target Rs {priceSummary.freeThreshold}</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-emerald-100">
            <div className="h-2.5 rounded-full bg-emerald-500 transition-all duration-300" style={{ width: `${freeDeliveryProgress}%` }} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            {items.map((it, idx) => (
              <motion.div
                key={it._id + it.productId._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(0.02 * idx, 0.16) }}
                className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <Image
                    src={it.productId.images[0]?.url || "/placeholder.png"}
                    alt={it.productId.name}
                    width={84}
                    height={84}
                    className="h-20 w-20 rounded-lg object-cover"
                  />

                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-semibold text-slate-900 md:text-lg">
                      {it.productId.name}
                      {it.productId.inHindi ? ` / ${it.productId.inHindi}` : ""}
                    </h3>
                    <p className="text-xs text-slate-500">Unit: {it.productId.unit}</p>
                    <p className="mt-1 text-sm font-semibold text-emerald-700">Rs {it.productId.price * it.quantity}</p>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => {
                          const step = it.productId.unit === "kg" ? 0.5 : 1;
                          const newQty = Math.max(it.productId.minQty, it.quantity - step);
                          if (newQty !== it.quantity) updateQty(it.productId._id, newQty);
                        }}
                        className="rounded-md border px-3 py-1 text-sm hover:bg-slate-50"
                      >
                        -
                      </button>

                      <span className="min-w-12 text-center text-sm font-medium text-slate-700">{it.quantity}</span>

                      <button
                        onClick={() => {
                          const step = it.productId.unit === "kg" ? 0.5 : 1;
                          const cap = getOrderableMaxQty(it.productId);
                          const newQty = Math.min(cap, it.quantity + step);
                          if (newQty !== it.quantity) updateQty(it.productId._id, newQty);
                        }}
                        className="rounded-md border px-3 py-1 text-sm hover:bg-slate-50"
                      >
                        +
                      </button>

                      <button
                        onClick={() => removeItem(it.productId._id)}
                        className="ml-auto rounded-md bg-rose-50 px-3 py-1 text-sm font-medium text-rose-600 hover:bg-rose-100"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="lg:sticky lg:top-20 lg:h-fit">
            <div className="relative rounded-xl border border-slate-200 bg-white p-4 shadow-md">
              {loadingCart && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/70">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
                </div>
              )}

              <h2 className="mb-4 text-lg font-semibold text-slate-900">Bill Details</h2>

              <div className="space-y-2 text-sm text-slate-700">
                <div className="flex justify-between">
                  <span>Items total</span>
                  <span>Rs {priceSummary.subTotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery</span>
                  <span>{priceSummary.delivery === 0 ? "Free" : `Rs ${priceSummary.delivery}`}</span>
                </div>
                <div className="my-2 border-t" />
                <div className="flex justify-between text-base font-semibold text-slate-900">
                  <span>Total</span>
                  <span>Rs {priceSummary.total}</span>
                </div>
              </div>

              {priceSummary.subTotal < minOrderThreshold && (
                <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-center text-sm font-medium text-amber-700">
                  Add Rs {remainingForMinOrder} more to checkout.
                </p>
              )}

              <button
                disabled={priceSummary.subTotal < minOrderThreshold || !isAccountActive}
                onClick={async () => {
                  if (!isAccountActive) {
                    await showInactiveAccountModal();
                    return;
                  }
                  await openCheckoutModal();
                }}
                className={`mt-4 w-full rounded-lg py-2.5 text-sm font-medium transition ${
                  priceSummary.subTotal < minOrderThreshold || !isAccountActive
                    ? "cursor-not-allowed bg-slate-300 text-slate-600"
                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                }`}
              >
                {!isAccountActive ? "Account Deactivated" : "Proceed to Checkout"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {checkoutOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center overflow-hidden bg-slate-950/55 p-2 sm:p-3 sm:items-center">
          <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl max-[360px]:rounded-xl">
            <div className="border-b border-slate-200 bg-gradient-to-r from-emerald-600 to-emerald-500 px-3 py-3 text-white sm:px-5">
              <h3 className="text-lg font-bold">Secure Checkout</h3>
              <p className="text-xs text-emerald-50">Step {checkoutStep === "details" ? "1 of 2" : "2 of 2"} | Total Rs {priceSummary.total}</p>
            </div>

            <div className="max-h-[78vh] overflow-y-auto p-3 sm:p-5">
              {checkoutStep === "details" ? (
                <div className="space-y-3.5">
                  <p className="text-sm text-slate-600">Enter delivery details and choose your payment method.</p>

                  <label className="block">
                    <span className="mb-1 block text-sm font-semibold text-slate-700">Full Name</span>
                    <input
                      value={checkoutForm.name}
                      onChange={(e) => setCheckoutForm((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500"
                      placeholder="Enter your name"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-sm font-semibold text-slate-700">Phone Number</span>
                    <input
                      value={checkoutForm.phone}
                      onChange={(e) => setCheckoutForm((prev) => ({ ...prev, phone: e.target.value }))}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500"
                      placeholder="Enter phone number"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-sm font-semibold text-slate-700">Address</span>
                    <input
                      value={checkoutForm.address}
                      onChange={(e) => setCheckoutForm((prev) => ({ ...prev, address: e.target.value }))}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500"
                      placeholder="House no, street, landmark"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-sm font-semibold text-slate-700">Delivery Area</span>
                    <select
                      value={checkoutForm.area}
                      onChange={(e) => setCheckoutForm((prev) => ({ ...prev, area: e.target.value }))}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500"
                    >
                      <option value="">Select delivery area</option>
                      {areas.map((a) => (
                        <option key={a._id} value={a._id}>
                          {a.name} - {a.pincode}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div>
                    <span className="mb-2 block text-sm font-semibold text-slate-700">Payment Method</span>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => setCheckoutForm((prev) => ({ ...prev, paymentMethod: "cod" }))}
                        className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                          checkoutForm.paymentMethod === "cod"
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                            : "border-slate-300 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        Cash on Delivery
                      </button>
                      <button
                        type="button"
                        onClick={() => setCheckoutForm((prev) => ({ ...prev, paymentMethod: "upi" }))}
                        className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                          checkoutForm.paymentMethod === "upi"
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                            : "border-slate-300 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        UPI Payment
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600">Scan QR and complete payment. Then submit UTR/transaction ID.</p>

                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                    <p><strong>Pay To:</strong> {upiState.upiId}</p>
                    <p><strong>Amount:</strong> Rs {priceSummary.total}</p>
                  </div>

                  <div className="flex justify-center rounded-2xl border border-slate-200 bg-white p-3">
                    {upiState.qrDataUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={upiState.qrDataUrl} alt="UPI QR" className="h-52 w-52 rounded-lg border border-slate-200 object-contain" />
                    ) : (
                      <div className="h-52 w-52 animate-pulse rounded-lg bg-slate-100" />
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-3">
                    <a href={upiState.upiUrl} target="_blank" className="rounded-lg bg-slate-900 px-3 py-2 text-center text-sm font-semibold text-white" rel="noreferrer">Google Pay</a>
                    <a href={upiState.upiUrl} target="_blank" className="rounded-lg bg-emerald-600 px-3 py-2 text-center text-sm font-semibold text-white" rel="noreferrer">PhonePe</a>
                    <a href={upiState.upiUrl} target="_blank" className="rounded-lg bg-cyan-600 px-3 py-2 text-center text-sm font-semibold text-white" rel="noreferrer">Paytm</a>
                  </div>

                  <label className="block">
                    <span className="mb-1 block text-sm font-semibold text-slate-700">UTR / Transaction ID</span>
                    <input
                      value={upiState.utr}
                      onChange={(e) => setUpiState((prev) => ({ ...prev, utr: e.target.value }))}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500"
                      placeholder="Enter UTR number"
                    />
                  </label>
                </div>
              )}

              {checkoutError && (
                <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{checkoutError}</p>
              )}
            </div>

            <div className="flex flex-col gap-2 border-t border-slate-200 p-3 min-[360px]:flex-row sm:p-4">
              <button
                type="button"
                onClick={() => {
                  if (placingOrder) return;
                  if (checkoutStep === "upi") {
                    setCheckoutStep("details");
                    setCheckoutError("");
                    return;
                  }
                  setCheckoutOpen(false);
                  setCheckoutError("");
                }}
                className="flex-1 rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-700"
              >
                {checkoutStep === "upi" ? "Back" : "Cancel"}
              </button>

              <button
                type="button"
                onClick={checkoutStep === "details" ? handleContinueDetails : handleUpiSubmit}
                disabled={placingOrder}
                className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-semibold text-white ${placingOrder ? "cursor-not-allowed bg-slate-400" : "bg-emerald-600 hover:bg-emerald-700"}`}
              >
                {placingOrder ? "Processing..." : checkoutStep === "details" ? (checkoutForm.paymentMethod === "upi" ? "Continue to UPI" : "Place Order") : "Submit Payment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
