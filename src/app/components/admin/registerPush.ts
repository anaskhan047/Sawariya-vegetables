export async function registerAdminPush(adminId?: string) {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.warn("Push not supported");
    return;
  }

  try {
    const reg = await navigator.serviceWorker.register("/sw.js");
    // get VAPID public key from server (or from env exposed)
    const res = await fetch("/api/push/publicKey");
    const data = await res.json();
    if (!data?.success) return;

    const vapidPublicKey = data.key;
    const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("Push permission not granted");
      return;
    }

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey,
    });

    // send subscription to server
    await fetch("/api/push/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription: sub, adminId }),
    });
  } catch (err) {
    console.error("registerAdminPush error", err);
  }
}

// helper conversion
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
