// public/sw.js
self.addEventListener("install", (evt) => {
  self.skipWaiting();
});

self.addEventListener("activate", (evt) => {
  clients.claim();
});

self.addEventListener("push", (event) => {
  // Default fallback
  let payload = { title: "Notification", message: "You have a new notification", data: {} };

  try {
    if (event.data) {
      // prefer JSON payload
      payload = event.data.json();
    }
  } catch (e) {
    try {
      // fallback to text
      const txt = event.data ? event.data.text() : "";
      payload = { title: "Notification", message: txt, data: {} };
    } catch (_) {}
  }

  const title = payload.title || "Notification";
  const options = {
    body: payload.message || payload.body || "",
    icon: payload.icon || "/icons/icon-192.png",
    badge: payload.badge || "/icons/badge-72.png",
    data: payload.data || {},
    tag: payload.tag,
    renotify: !!payload.renotify,
    requireInteraction: !!payload.requireInteraction,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// On click: focus existing matching window or open a new one
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const urlToOpen = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        try {
          if (new URL(client.url).origin === self.location.origin) {
            return client.focus().then(() => client.navigate(urlToOpen).catch(() => {}));
          }
        } catch (err) {
          // skip malformed client.url
        }
      }
      return clients.openWindow(urlToOpen);
    })
  );
});