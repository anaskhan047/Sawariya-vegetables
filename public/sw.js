/* public/sw.js — Shri Sawariya Mart (cleaned) */

const CACHE_VERSION = "v1";
const CACHE_NAME = `ssm-cache-${CACHE_VERSION}`;
const RUNTIME_CACHE = `ssm-runtime-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  "/", 
  "/favicon.ico",
  "/logo/logo.png",
  "/manifest.json",
  // don't include directory entries like "/_next/static/". Use runtime caching for Next assets.
];

function safeParsePushData(data) {
  try {
    // PushMessageData.json() returns an object; if it throws fall back to text
    if (data && typeof data.json === "function") {
      return data.json();
    }
    if (data && typeof data.text === "function") {
      return { message: data.text() };
    }
  } catch (e) {
    try {
      return JSON.parse(typeof data === "string" ? data : "");
    } catch {
      return null;
    }
  }
  return null;
}

/* Install / Precache */
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      for (const url of PRECACHE_URLS) {
        try {
          // Use network fetch to ensure we get the actual response (not cached by browser)
          const res = await fetch(url, { cache: "no-cache" });
          if (res && res.ok) {
            await cache.put(url, res.clone());
          } else {
            console.warn("Precache skip (not ok):", url, res && res.status);
          }
        } catch (err) {
          // ignore errors (404s, network) and continue
          console.warn("Precache failed, skipping:", url, err && err.message ? err.message : err);
        }
      }
    })()
  );
});


/* Activate: clean old caches */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
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

/* Fetch: runtime caching */
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  if (url.pathname.startsWith("/api/")) return; // don't cache API

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
          return cached || fetch(req);
        }
      })
    );
    return;
  }

  // stale-while-revalidate for other assets
  event.respondWith(
    caches.open(RUNTIME_CACHE).then(async (cache) => {
      const cached = await cache.match(req);
      const networkFetch = fetch(req)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            cache.put(req, networkResponse.clone());
          }
          return networkResponse;
        })
        .catch(() => null);
      return cached || networkFetch;
    })
  );
});

/* Push event: display notification */
self.addEventListener("push", (event) => {
  let payload = safeParsePushData(event.data) || {};
  const title = payload.title || payload.t || "Shri Sawariya Mart";
  const body = payload.message || payload.body || payload.m || "You have a new update.";
  const data = payload.data || {};
  const icon = payload.icon || "/logo/logo.png";
  const badge = payload.badge || "/favicon.ico";
  const tag = payload.tag || `ssm-${Date.now()}`;

  const options = {
    body,
    icon,
    badge,
    tag,
    data,
    vibrate: [100, 50, 100],
    requireInteraction: !!payload.requireInteraction,
    actions: payload.actions || [],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

/* Notification click */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const urlToOpen = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    (async () => {
      const allClients = await clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of allClients) {
        try {
          const clientUrl = new URL(client.url || "", location.href);
          if (clientUrl.origin === location.origin) {
            client.focus();
            if (client.url !== urlToOpen) {
              // navigate is supported on WindowClient
              try { await client.navigate(urlToOpen); } catch (e) {}
            }
            return;
          }
        } catch (e) {
          // ignore
        }
      }
      await clients.openWindow(urlToOpen);
    })()
  );
});

/* Push subscription change: notify pages to re-subscribe */
self.addEventListener("pushsubscriptionchange", (event) => {
  console.warn("pushsubscriptionchange fired");
  event.waitUntil(
    (async () => {
      const allClients = await clients.matchAll({ includeUncontrolled: true });
      for (const client of allClients) {
        client.postMessage({ type: "PUSH_SUBSCRIPTION_CHANGE" });
      }
    })()
  );
});

/* Message from pages */
self.addEventListener("message", (event) => {
  const msg = event.data;
  if (!msg || typeof msg !== "object") return;

  if (msg.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (msg.type === "TEST_NOTIFICATION") {
    const { title, message } = msg;
    self.registration.showNotification(title || "Test", { body: message || "Test message", icon: "/logo/logo.png" });
  }
});
