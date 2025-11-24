// public/sw.js
// Service worker: only show notifications on actual push events.
// - Supports JSON payload or text fallback
// - Respects payload.silent === true (no notification shown)
// - Uses tag/renotify for dedupe
// - Opens/focuses client on notificationclick
self.addEventListener("install", (e) => {
  console.log("[SW] install event");
});
self.addEventListener("activate", (e) => {
  console.log("[SW] activate event");
});
self.addEventListener("push", (e) => {
  console.log("[SW] push event, data:", e.data ? e.data.text() : null);
});
self.addEventListener("push", (event) => {
  // don't accidentally show notifications during registration/activate
  // only react to an actual push event
  let payloadData = null;
  try {
    if (event.data) {
      // Try JSON first
      payloadData = event.data.json();
    }
  } catch (e) {
    // fallback to text
    try {
      payloadData = { body: event.data.text() };
    } catch (e2) {
      payloadData = null;
    }
  }

  // Default notify object
  const notifyDefault = {
    title: "Notification",
    body: "You have a new message",
    icon: "/icons/icon-192.png",
    badge: "/icons/badge-72.png",
    data: { url: "/" },
    tag: undefined,
    renotify: false,
    requireInteraction: false,
    silent: false, // if true -> do not show notification
  };

  const payload = typeof payloadData === "object" && payloadData !== null ? payloadData : {};
  // Respect `silent` in payload (server can send { silent: true } for data-only pushes)
  if (payload.silent) {
    // If it's a silent push, you can still do background work here (sync DB, fetch, etc.)
    // But do NOT show a notification.
    event.waitUntil(Promise.resolve());
    return;
  }

  const notify = {
    title: payload.title || notifyDefault.title,
    body: payload.body || payload.message || notifyDefault.body,
    icon: payload.icon || notifyDefault.icon,
    badge: payload.badge || notifyDefault.badge,
    data: { ...(notifyDefault.data || {}), ...(payload.data || {}) },
    tag: payload.tag || notifyDefault.tag,
    renotify: payload.renotify ?? notifyDefault.renotify,
    requireInteraction: payload.requireInteraction ?? notifyDefault.requireInteraction,
  };

  const options = {
    body: notify.body,
    icon: notify.icon,
    badge: notify.badge,
    data: notify.data,
    tag: notify.tag,
    renotify: notify.renotify,
    requireInteraction: notify.requireInteraction,
  };

  // Ensure event.waitUntil resolves to the showNotification promise
  event.waitUntil(self.registration.showNotification(notify.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const urlToOpen = (event.notification && event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        try {
          // focus an existing window on the same origin and navigate if required
          const clientUrl = new URL(client.url);
          const openUrl = new URL(urlToOpen, self.location.origin);
          if (clientUrl.origin === openUrl.origin) {
            client.focus();
            if (client.url !== openUrl.href) {
              // navigate existing tab to the URL
              client.navigate(openUrl.href).catch(() => {});
            }
            return;
          }
        } catch (e) {
          // ignore parsing errors
        }
      }
      // no window found — open new one
      return clients.openWindow(urlToOpen);
    })
  );
});

// Optional: clean up old notifications on activate (no show here)
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Perform any cleanup if necessary
      // For example, close old notifications (not required usually)
      const notifications = await self.registration.getNotifications();
      notifications.forEach((n) => {
        // Do not automatically show notifications here — just close stale ones
        try { n.close(); } catch (e) { /* ignore */ }
      });
    })()
  );
});
