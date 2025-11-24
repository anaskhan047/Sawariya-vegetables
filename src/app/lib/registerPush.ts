// src/app/lib/registerPush.ts
// Client helper to register service worker and subscribe to push (no notifications during subscribe)
// - returns subscription or null
// - idempotent: won't re-subscribe if subscription already exists

export async function registerAdminPush(adminToken?: string) {
  if (typeof window === "undefined") return null;
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.warn("Push not supported in this browser");
    return null;
  }

  try {
    // register SW and wait for ready
    const reg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    await navigator.serviceWorker.ready;

    // request permission only when needed
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("Push permission not granted");
      return null;
    }

    // check existing subscription (do not re-subscribe every page load)
    let subscription = await reg.pushManager.getSubscription();

    if (!subscription) {
      // fetch VAPID public key
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

      // subscribe once
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
    }

    if (!subscription) {
      console.warn("No push subscription obtained");
      return null;
    }

    // send subscription to server (idempotent upsert)
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

// helper
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
