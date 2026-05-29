/**
 * Shows a native OS / browser notification when an order is placed (customer).
 * Call from the same synchronous click/tap chain as "Place order" when possible
 * so permission prompts are not suppressed (Chrome user-gesture rules).
 */
export function requestNotificationPermissionFromUserGesture(): void {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "default") return;
  void Notification.requestPermission().catch(() => undefined);
}

type OrderConfirmationParams = {
  orderId?: string;
  total?: number;
  itemCount?: number;
};

function formatInr(n: number | undefined): string {
  if (n == null || Number.isNaN(n)) return "";
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
  } catch {
    return `₹${Math.round(n)}`;
  }
}

export async function showBrowserOrderConfirmation(params: OrderConfirmationParams): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false;

  let perm = Notification.permission;
  if (perm === "default") {
    try {
      perm = await Notification.requestPermission();
    } catch {
      return false;
    }
  }
  if (perm !== "granted") return false;

  const shortId = params.orderId ? String(params.orderId).slice(-8) : "";
  const title = "Order placed!";
  const parts: string[] = ["Thank you — we received your order."];
  if (params.itemCount != null && params.itemCount > 0) {
    parts.push(`${params.itemCount} item(s).`);
  }
  if (params.total != null) {
    parts.push(`Total ${formatInr(params.total)}.`);
  }
  if (shortId) {
    parts.push(`Ref …${shortId}`);
  }
  const body = parts.join(" ");

  const tag = params.orderId ? `ORDER_PLACED:${params.orderId}` : `ORDER_PLACED:${Date.now()}`;
  const targetUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/order`
      : "/order";

  try {
    const n = new Notification(title, {
      body,
      icon: "/logo/android-launchericon-192-192.png",
      tag,
      requireInteraction: true,
      silent: false,
    });
    n.onclick = () => {
      try {
        window.focus();
        window.location.href = targetUrl;
      } finally {
        n.close();
      }
    };
    return true;
  } catch (err) {
    console.warn("[order-notify] Native Notification failed", err);
    try {
      const reg =
        (await navigator.serviceWorker?.getRegistration("/firebase-cloud-messaging-push-scope")) ||
        (await navigator.serviceWorker?.getRegistration()) ||
        (await navigator.serviceWorker?.ready);
      if (reg) {
        await reg.showNotification(title, {
          body,
          icon: "/logo/android-launchericon-192-192.png",
          badge: "/logo/android-launchericon-192-192.png",
          tag,
          data: { url: targetUrl },
          requireInteraction: true,
          silent: false,
        });
        return true;
      }
    } catch (e2) {
      console.warn("[order-notify] serviceWorker.showNotification failed", e2);
    }
    return false;
  }
}
