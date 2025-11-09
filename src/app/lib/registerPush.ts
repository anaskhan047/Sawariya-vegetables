// src/app/lib/registerPush.ts
export async function registerAdminPush(adminToken?: string) {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.warn("Push is not supported in this browser");
    return;
  }
  try {
    const reg = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("Push permission not granted");
      return;
    }

    const publicKeyRes = await fetch("/api/push/public-key");
    if (!publicKeyRes.ok) {
      const txt = await publicKeyRes.text().catch(() => "");
      console.warn("Failed to fetch VAPID key:", publicKeyRes.status, txt);
      return;
    }
    const publicKeyJson = await publicKeyRes.json().catch(async (e) => {
      const t = await publicKeyRes.text().catch(() => "");
      console.error("public-key not valid JSON:", t);
      return null;
    });
    if (!publicKeyJson?.success || !publicKeyJson?.key) {
      console.warn("Invalid public key response:", publicKeyJson);
      return;
    }
    const applicationServerKey = urlBase64ToUint8Array(publicKeyJson.key);

    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });

    const registerRes = await fetch("/api/push/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: adminToken ? `Bearer ${adminToken}` : "",
      },
      body: JSON.stringify({ subscription, adminId: undefined }),
    });
    if (!registerRes.ok) {
      const t = await registerRes.text().catch(() => "");
      console.warn("Push register failed:", registerRes.status, t);
    } else {
      console.info("Push subscription registered");
    }
  } catch (err) {
    console.error("registerAdminPush error:", err);
  }
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}
