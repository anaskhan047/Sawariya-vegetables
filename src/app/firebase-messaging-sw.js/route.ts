import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const fallbackFirebaseConfig = {
    apiKey: "AIzaSyD9hppcBYI550csqNpISvpRFu-O17vRVxQ",
    authDomain: "shri-sawariya-mart.firebaseapp.com",
    projectId: "shri-sawariya-mart",
    storageBucket: "shri-sawariya-mart.firebasestorage.app",
    messagingSenderId: "400592809243",
    appId: "1:400592809243:web:d66c767e3240550ff3b7be",
    measurementId: "G-MM60NTPP4F",
  };

  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || fallbackFirebaseConfig.apiKey,
    authDomain:
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || fallbackFirebaseConfig.authDomain,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || fallbackFirebaseConfig.projectId,
    storageBucket:
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || fallbackFirebaseConfig.storageBucket,
    messagingSenderId:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
      fallbackFirebaseConfig.messagingSenderId,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || fallbackFirebaseConfig.appId,
    measurementId:
      process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || fallbackFirebaseConfig.measurementId,
  };

  const body = `
importScripts("https://www.gstatic.com/firebasejs/12.6.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.6.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: ${JSON.stringify(firebaseConfig.apiKey)},
  authDomain: ${JSON.stringify(firebaseConfig.authDomain)},
  projectId: ${JSON.stringify(firebaseConfig.projectId)},
  storageBucket: ${JSON.stringify(firebaseConfig.storageBucket)},
  messagingSenderId: ${JSON.stringify(firebaseConfig.messagingSenderId)},
  appId: ${JSON.stringify(firebaseConfig.appId)},
  measurementId: ${JSON.stringify(firebaseConfig.measurementId)}
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
