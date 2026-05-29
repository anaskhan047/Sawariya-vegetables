import { NextResponse } from "next/server";
import { getPublicSiteUrl } from "@/app/lib/notifications/siteUrl";
import { getFirebaseWebConfig } from "@/app/lib/firebase/webConfig";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FB_JS = "12.11.0";

export async function GET() {
  const siteOrigin = getPublicSiteUrl();
  const firebaseConfig = getFirebaseWebConfig();

const body = `
importScripts("https://www.gstatic.com/firebasejs/${FB_JS}/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/${FB_JS}/firebase-messaging-compat.js");

self.addEventListener("install", function () {
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(clients.claim());
});

self.addEventListener("message", function (event) {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

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
const SITE_ORIGIN = ${JSON.stringify(siteOrigin)};

function toAbsoluteUrl(u) {
  if (!u || typeof u !== "string") return SITE_ORIGIN + "/";
  var t = u.trim();
  if (t.indexOf("http://") === 0 || t.indexOf("https://") === 0) return t;
  return SITE_ORIGIN + (t.charAt(0) === "/" ? t : "/" + t);
}

function normalizePayload(payload) {
  var data = payload && payload.data ? payload.data : {};
  var title =
    (payload && payload.notification && payload.notification.title) ||
    (payload && payload.title) ||
    data.title ||
    "Shri Sawariya Mart";
  var bodyText =
    (payload && payload.notification && payload.notification.body) ||
    (payload && payload.body) ||
    data.body ||
    "";
  var url = toAbsoluteUrl(data.url || "/");
  var tag =
    data.type && data.orderId ? String(data.type) + ":" + String(data.orderId) : undefined;
  return { data: data, title: title, body: bodyText, url: url, tag: tag };
}

function showPushNotification(payload) {
  var normalized = normalizePayload(payload);
  return self.registration.showNotification(normalized.title, {
    body: normalized.body,
    data: { url: normalized.url },
    icon: "/logo/android-launchericon-192-192.png",
    badge: "/logo/android-launchericon-192-192.png",
    tag: normalized.tag,
    requireInteraction: true,
    silent: false,
    renotify: true,
    vibrate: [160, 80, 160],
  });
}

messaging.onBackgroundMessage(function (payload) {
  return showPushNotification(payload);
});

self.addEventListener("push", function (event) {
  if (!event.data) return;

  var payload = {};
  try {
    payload = event.data.json();
  } catch (e) {
    payload = { title: "Shri Sawariya Mart", body: event.data.text() };
  }

  if (payload && (payload.firebaseMessaging || payload.from || payload.collapse_key)) {
    return;
  }

  event.waitUntil(showPushNotification(payload));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  var raw = (event.notification && event.notification.data && event.notification.data.url) || "/";
  var targetUrl = toAbsoluteUrl(raw);

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientsList) {
      for (var i = 0; i < clientsList.length; i++) {
        var client = clientsList[i];
        if ("focus" in client) {
          client.postMessage({ type: "FCM_NAVIGATE", url: targetUrl });
          return client.focus().then(function () {
            if (client.url !== targetUrl && "navigate" in client) {
              try {
                return client.navigate(targetUrl);
              } catch (e) {
                return undefined;
              }
            }
            return undefined;
          });
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
      return undefined;
    })
  );
});
`;

  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
