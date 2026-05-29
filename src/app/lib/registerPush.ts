// src/app/lib/registerPush.ts
export async function registerAdminPush(adminId?: string, authToken?: string | null) {
  if (typeof window === "undefined") return null;
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.warn("Push not supported");
    return null;
  }

  try {
    const reg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    await reg.update().catch(() => undefined);
    if (reg.waiting) {
      reg.waiting.postMessage({ type: "SKIP_WAITING" });
    }
    await navigator.serviceWorker.ready;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("Push permission not granted");
      return null;
    }

    const activeReg =
      (await navigator.serviceWorker.getRegistration("/")) ||
      (await navigator.serviceWorker.ready);
    let subscription = await activeReg.pushManager.getSubscription();
    if (!subscription) {
      const res = await fetch("/api/push/public-key");
      if (!res.ok) {
        console.warn("Failed to fetch VAPID key");
        return null;
      }
      const json = await res.json();
      if (!json?.success || !json.key) {
        console.warn("VAPID key missing");
        return null;
      }
      const applicationServerKey = urlBase64ToUint8Array(json.key);
      subscription = await activeReg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
    }

    const saveResponse = await fetch("/api/push/register", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify({
        subscription,
        adminId,
        origin: window.location.origin,
      }),
    });

    const saveData = (await saveResponse.json().catch(() => ({}))) as {
      success?: boolean;
      message?: string;
      error?: string;
    };
    if (!saveResponse.ok || !saveData.success) {
      console.warn("Push subscription save failed", {
        status: saveResponse.status,
        data: saveData,
      });
      return null;
    }

    console.info("Push subscription registered for", window.location.origin);
    return subscription;
  } catch (err) {
    console.error("registerAdminPush error", err);
    return null;
  }
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i)
    outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}
