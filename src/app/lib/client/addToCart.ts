"use client";

import Swal from "sweetalert2";

type AddToCartApiResponse = {
  success?: boolean;
  error?: string;
  orderWindow?: {
    isOpen?: boolean;
    outsideMessage?: string;
    label?: string;
  };
};

/** Shared add-to-cart + optional order-window info toast (cart always allowed). */
export async function postAddToCart(payload: {
  productId: string;
  quantity: number;
  userId?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch("/api/cart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = (await res.json().catch(() => ({}))) as AddToCartApiResponse;

  if (!res.ok || !data.success) {
    return { ok: false, error: data.error || "Failed to add to cart" };
  }

  if (data.orderWindow && data.orderWindow.isOpen === false && data.orderWindow.outsideMessage) {
    await Swal.fire({
      title: "Added to cart",
      text: data.orderWindow.outsideMessage,
      icon: "info",
      confirmButtonText: "OK",
      confirmButtonColor: "#059669",
    });
  }

  return { ok: true };
}
