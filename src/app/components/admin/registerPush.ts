// src/app/components/admin/registerPush.ts
const PUSH_SW_URL = "/firebase-messaging-sw.js";
const PUSH_SUBSCRIPTION_VERSION = "firebase-sw-v3-details";
const PUSH_SUBSCRIPTION_VERSION_KEY = "ssm_push_subscription_version";

export async function registerAdminPush(adminId?: string, authToken?: string | null) {
  if (typeof window === "undefined") return null;
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.warn("Push not supported");
    return null;
  }
  try {
    const reg = await navigator.serviceWorker.register(PUSH_SW_URL);
    await reg.update().catch(() => undefined);
    if (reg.waiting) {
      reg.waiting.postMessage({ type: "SKIP_WAITING" });
    }
    await navigator.serviceWorker.ready;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    const activeReg =
      (await navigator.serviceWorker.getRegistration("/")) ||
      (await navigator.serviceWorker.ready);
    let subscription = await activeReg.pushManager.getSubscription();
    if (subscription && shouldRenewChromeSubscription()) {
      await subscription.unsubscribe().catch(() => false);
      subscription = null;
      console.info("Chrome push subscription renewed for active service worker.");
    }
    if (!subscription) {
      const res = await fetch("/api/push/public-key");
      if (!res.ok) return null;
      const json = await res.json();
      if (!json?.success || !json.key) return null;
      const applicationServerKey = urlBase64ToUint8Array(json.key);
      subscription = await activeReg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey });
    }

    const activeWorkerUrl =
      activeReg.active?.scriptURL || activeReg.installing?.scriptURL || activeReg.waiting?.scriptURL || "";
    const saveResponse = await fetch("/api/push/register", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify({ subscription, adminId, origin: location.origin }),
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

    localStorage.setItem(PUSH_SUBSCRIPTION_VERSION_KEY, PUSH_SUBSCRIPTION_VERSION);
    console.info("Push subscription registered for", location.origin, {
      endpointPrefix: subscription.endpoint.slice(0, 45),
      serviceWorker: activeWorkerUrl,
    });
    return subscription;
  } catch (err) {
    console.error("registerAdminPush error", err);
    return null;
  }
}

function shouldRenewChromeSubscription() {
  const ua = navigator.userAgent || "";
  const isChromeLike = /\bChrome\//.test(ua) || /\bEdg\//.test(ua);
  const isFirefox = /\bFirefox\//.test(ua);
  if (!isChromeLike || isFirefox) return false;
  return localStorage.getItem(PUSH_SUBSCRIPTION_VERSION_KEY) !== PUSH_SUBSCRIPTION_VERSION;
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}
