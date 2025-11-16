/* Service Worker for Shri Sawariya Mart
   - Place this file in /public/sw.js
   - Register from client with navigator.serviceWorker.register('/sw.js')
   - When push subscription changes, SW posts a message to clients to re-subscribe
*/

const CACHE_VERSION = "v1";
const CACHE_NAME = `ssm-cache-${CACHE_VERSION}`;
const RUNTIME_CACHE = `ssm-runtime-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  "/", // root
  "/favicon.ico",
  "/logo/logo.png",
  "/manifest.json",
  "/_next/static/", // NextJS static folder (will be handled by runtime caching)
  // add any other static assets you want precached (fonts, critical css)
];

// Utility: safe JSON parse
function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch (e) {
    return null;
  }
}

/* ---------- Install / Precache ---------- */
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        await cache.addAll(PRECACHE_URLS);
      } catch (err) {
        // If addAll fails for some reason, ignore and continue
        console.warn("Precache addAll failed:", err);
      }
    })()
  );
});

/* ---------- Activate ---------- */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // clean up old caches
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => ![CACHE_NAME, RUNTIME_CACHE].includes(key))
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

/* ---------- Fetch: runtime caching ---------- */
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Only handle GET requests
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Bypass SW for API calls to your server that should not be cached
  // (e.g., /api/...), you can customize as needed
  if (url.pathname.startsWith("/api/")) {
    return; // let network handle API requests
  }

  // Images: cache-first (fast)
  if (req.destination === "image" || /\.(png|jpg|jpeg|gif|webp|svg)$/.test(url.pathname)) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        if (cached) return cached;
        try {
          const resp = await fetch(req);
          if (resp && resp.status === 200) cache.put(req, resp.clone());
          return resp;
        } catch {
          return cached || fetch(req); // best-effort
        }
      })
    );
    return;
  }

  // For everything else: stale-while-revalidate
  event.respondWith(
    caches.open(RUNTIME_CACHE).then(async (cache) => {
      const cached = await cache.match(req);
      const networkFetch = fetch(req)
        .then((networkResponse) => {
          // only cache successful responses
          if (networkResponse && networkResponse.status === 200) {
            cache.put(req, networkResponse.clone());
          }
          return networkResponse;
        })
        .catch(() => null);

      // Return cached if available, otherwise wait for network
      return cached || networkFetch;
    })
  );
});

/* ---------- Push event: display notification ---------- */
self.addEventListener("push", (event) => {
  // Payload convention: JSON with { title, message (or body), data, icon, badge, tag, actions }
  let payload = null;
  if (event.data) {
    try {
      payload = event.data.json();
    } catch (e) {
      // fallback to text
      payload = { title: "Notification", message: event.data.text() };
    }
  }

  const title = (payload && (payload.title || payload.t)) || "Shri Sawariya Mart";
  const body = (payload && (payload.message || payload.body || payload.m)) || "You have a new update.";
  const data = (payload && payload.data) || {};
  const icon = (payload && (payload.icon || "/logo/logo.png")) || "/logo/logo.png";
  const badge = (payload && payload.badge) || "/favicon.ico";
  const tag = (payload && payload.tag) || `ssm-${Date.now()}`;

  const options = {
    body,
    icon,
    badge,
    tag,
    data,
    vibrate: [100, 50, 100],
    requireInteraction: !!payload?.requireInteraction, // if you want the notification to stay
    actions: payload?.actions || [], // array of {action, title, icon}
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

/* ---------- Notification click ---------- */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const clickedAction = event.action;

  // If payload data contains url, open it. Otherwise open root.
  const urlToOpen = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    (async () => {
      const allClients = await clients.matchAll({ type: "window", includeUncontrolled: true });
      // Try focus existing window with same origin
      for (const client of allClients) {
        try {
          const clientUrl = new URL((client.url || ""), location.href);
          // Focus the first client of same origin (we match origin by default)
          if (clientUrl.origin === location.origin) {
            client.focus();
            // navigate if different url
            if (client.url !== urlToOpen) client.navigate(urlToOpen).catch(() => {});
            return;
          }
        } catch (e) {
          // ignore URL parse errors
        }
      }
      // If no client found, open a new window/tab
      await clients.openWindow(urlToOpen);
    })()
  );
});

/* ---------- Push subscription change ----------
   When push subscription changes (e.g., browser keys rotated), browsers may fire this event.
   Best practice: notify the pages to re-subscribe and send the new subscription to server.
*/
self.addEventListener("pushsubscriptionchange", (event) => {
  console.warn("pushsubscriptionchange fired");
  event.waitUntil(
    (async () => {
      // inform all pages to re-subscribe (client will call /api/push/register with new sub)
      const allClients = await clients.matchAll({ includeUncontrolled: true });
      for (const client of allClients) {
        client.postMessage({ type: "PUSH_SUBSCRIPTION_CHANGE" });
      }
    })()
  );
});

/* ---------- Message handler (from pages) ----------
   Accept messages for SKIP_WAITING (to activate updated SW) or for manual actions.
*/
self.addEventListener("message", (event) => {
  const msg = event.data;
  if (!msg || typeof msg !== "object") return;

  if (msg.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  // Allow page to ask SW to show a test notification (debug only)
  if (msg.type === "TEST_NOTIFICATION") {
    const { title, message } = msg;
    self.registration.showNotification(title || "Test", { body: message || "Test message", icon: "/logo/logo.png" });
  }
});
