import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "";
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "";
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "";
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "";
  const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "";
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "";
  const measurementId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "";

  const body = `
importScripts("https://www.gstatic.com/firebasejs/12.6.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.6.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "${apiKey}",
  authDomain: "${authDomain}",
  projectId: "${projectId}",
  storageBucket: "${storageBucket}",
  messagingSenderId: "${messagingSenderId}",
  appId: "${appId}",
  measurementId: "${measurementId}"
});

const messaging = firebase.messaging();

function normalizePayload(payload) {
  const data = payload?.data || {};
  const title = payload?.notification?.title || data.title || "Shri Sawariya Mart";
  const body = payload?.notification?.body || data.body || "";
  const url = data.url || "/";
  const tag = data.type && data.orderId ? data.type + ":" + data.orderId : undefined;
  return { data, title, body, url, tag };
}

async function showPushNotification(payload) {
  const normalized = normalizePayload(payload);
  await self.registration.showNotification(normalized.title, {
    body: normalized.body,
    data: { url: normalized.url },
    icon: "/logo/android-launchericon-192-192.png",
    badge: "/logo/android-launchericon-192-192.png",
    tag: normalized.tag,
    requireInteraction: true,
  });
}

messaging.onBackgroundMessage((payload) => {
  showPushNotification(payload);
});

self.addEventListener("push", (event) => {
  if (!event?.data) return;
  try {
    const payload = event.data.json();
    event.waitUntil(showPushNotification(payload));
  } catch {
    // Ignore malformed push payloads.
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification?.data?.url || "/";

  event.waitUntil((async () => {
    const clientsList = await clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of clientsList) {
      if ("focus" in client) {
        client.postMessage({ type: "FCM_NAVIGATE", url: targetUrl });
        await client.focus();
        if ("navigate" in client) {
          await client.navigate(targetUrl);
        }
        return;
      }
    }

    if (clients.openWindow) {
      await clients.openWindow(targetUrl);
    }
  })());
});
`;

  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
