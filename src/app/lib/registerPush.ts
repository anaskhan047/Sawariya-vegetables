// src/app/lib/registerPush.ts
export async function registerAdminPush(adminToken?: string) {
  if (typeof window === "undefined") return null;
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.warn("Push not supported");
    return null;
  }

  try {
    // register SW and wait ready
    const reg = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;

    // permission
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("Push permission not granted");
      return null;
    }

    // check existing subscription first (important)
    let subscription = await reg.pushManager.getSubscription();

    if (!subscription) {
      // fetch public VAPID key
      const res = await fetch("/api/push/public-key");
      if (!res.ok) {
        console.warn("Failed to fetch VAPID key");
        return null;
      }
      const json = await res.json();
      const key = json?.key;
      if (!key) {
        console.warn("VAPID key missing");
        return null;
      }
      const applicationServerKey = urlBase64ToUint8Array(key);
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
    }

    if (!subscription) {
      console.warn("No subscription obtained");
      return null;
    }

    // send subscription to server with origin
    await fetch("/api/push/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
      },
      body: JSON.stringify({ subscription, origin: location.origin }),
    });

    console.info("Push subscription registered for", location.origin);
    return subscription;
  } catch (err) {
    console.error("registerAdminPush error", err);
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
