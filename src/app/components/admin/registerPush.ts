// src/app/components/admin/registerPush.ts

// Helper function MUST be above its usage
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

export async function registerAdminPush(adminId?: string) {
  if (typeof window === "undefined") return null;
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.warn("Push not supported");
    return null;
  }

  try {
    const reg = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("Push permission not granted");
      return null;
    }

    let subscription = await reg.pushManager.getSubscription();

    if (!subscription) {
      const res = await fetch("/api/push/public-key");
      if (!res.ok) return null;

      const json = await res.json();
      if (!json?.success || !json.key) return null;

      const applicationServerKey = urlBase64ToUint8Array(json.key);

      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
    }

    await fetch("/api/push/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription, adminId, origin: location.origin }),
    });

    return subscription;
  } catch (err) {
    console.error("registerAdminPush error", err);
    return null;
  }
}
