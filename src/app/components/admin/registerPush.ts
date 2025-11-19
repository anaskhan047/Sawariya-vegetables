// src/app/components/admin/registerPush.ts
export async function registerAdminPush(adminId?: string) {
  if (typeof window === "undefined") return null;
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.warn("Push not supported");
    return null;
  }

  try {
    // register service worker and wait until it's active
    const reg = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;

    // ask permission
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("Push permission not granted");
      return null;
    }

    // IMPORTANT: check existing subscription first to avoid duplicates
    let subscription = await reg.pushManager.getSubscription();
    if (!subscription) {
      // fetch public key (your API uses /api/push/publicKey)
      const res = await fetch("/api/push/publicKey");
      if (!res.ok) {
        console.warn("Failed to fetch VAPID key");
        return null;
      }
      const data = await res.json();
      if (!data?.success || !data.key) {
        console.warn("Invalid VAPID key response");
        return null;
      }

      const applicationServerKey = urlBase64ToUint8Array(data.key);
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
    }

    // send subscription to server (include origin so server can filter)
    await fetch("/api/push/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription, adminId, origin: location.origin }),
    });

    console.info("Push subscription registered/updated for", location.origin);
    return subscription;
  } catch (err) {
    console.error("registerAdminPush error:", err);
    return null;
  }
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
