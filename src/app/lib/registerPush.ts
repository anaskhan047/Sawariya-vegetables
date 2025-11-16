// src/app/lib/registerPush.ts
export async function registerAdminPush(adminToken?: string) {
  if (typeof window === "undefined") return null;
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.warn("Push is not supported in this browser");
    return null;
  }

  try {
    // register service worker (idempotent if already registered)
    const reg = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;

    // request permission for notifications
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("Push permission not granted");
      return null;
    }

    // get existing subscription if any
    let subscription = await reg.pushManager.getSubscription();

    // fetch VAPID key only if we need to subscribe
    let applicationServerKey: Uint8Array | undefined;
    if (!subscription) {
      const publicKeyRes = await fetch("/api/push/public-key");
      if (!publicKeyRes.ok) {
        const txt = await publicKeyRes.text().catch(() => "");
        console.warn("Failed to fetch VAPID key:", publicKeyRes.status, txt);
        return null;
      }
      const publicKeyJson = await publicKeyRes.json().catch(async () => {
        const t = await publicKeyRes.text().catch(() => "");
        console.error("public-key not valid JSON:", t);
        return null;
      });
      if (!publicKeyJson?.success || !publicKeyJson?.key) {
        console.warn("Invalid public key response:", publicKeyJson);
        return null;
      }
      applicationServerKey = urlBase64ToUint8Array(publicKeyJson.key);

      // subscribe
      // NOTE: TS expects a BufferSource (ArrayBuffer or ArrayBufferView). We cast to ArrayBuffer to satisfy types.
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        // cast here to satisfy TypeScript
        applicationServerKey: (applicationServerKey as unknown) as ArrayBuffer,
      });
    }

    if (!subscription) {
      console.warn("Could not obtain a push subscription");
      return null;
    }

    // prepare body including origin so server stores domain for the subscription
    const body: Record<string, unknown> = {
      subscription,
      origin: location.origin, // important: ensures server associates subscription with production domain
    };

    // include adminId if you want to store admin association. We're not passing adminId here.
    // send to server with Authorization only if provided
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (adminToken && typeof adminToken === "string" && adminToken.trim() !== "") {
      headers["Authorization"] = `Bearer ${adminToken}`;
    }

    const registerRes = await fetch("/api/push/register", {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!registerRes.ok) {
      const t = await registerRes.text().catch(() => "");
      console.warn("Push register failed:", registerRes.status, t);
      return null;
    }

    console.info("Push subscription registered/updated for origin:", location.origin);
    return subscription;
  } catch (err) {
    console.error("registerAdminPush error:", err);
    return null;
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}
