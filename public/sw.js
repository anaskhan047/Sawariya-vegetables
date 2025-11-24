// public/sw.js

self.addEventListener("install", (event) => {
  console.log("[SW] install");
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  console.log("[SW] activate");
  event.waitUntil(
    (async () => {
      const notifications = await self.registration.getNotifications();
      notifications.forEach((n) => {
        try {
          n.close();
        } catch (e) {}
      });
      await self.clients.claim();
    })()
  );
});

// SINGLE push listener
self.addEventListener("push", (event) => {
  console.log(
    "[SW] push event raw:",
    event.data ? event.data.text() : "no data"
  );

  let payloadData = null;
  try {
    if (event.data) {
      payloadData = event.data.json();
    }
  } catch (e) {
    try {
      payloadData = { body: event.data.text() };
    } catch (e2) {
      payloadData = null;
    }
  }

  const notifyDefault = {
    title: "Notification",
    body: "You have a new message",
    icon: "/icons/icon-192.png",
    badge: "/icons/badge-72.png",
    data: { url: "/" },
    tag: undefined,
    renotify: true, // हर बार popup आने के लिए
    requireInteraction: false,
    silent: false,
  };

  const payload =
    typeof payloadData === "object" && payloadData !== null
      ? payloadData
      : {};

  if (payload.silent) {
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
    renotify:
      typeof payload.renotify === "boolean"
        ? payload.renotify
        : notifyDefault.renotify,
    requireInteraction:
      typeof payload.requireInteraction === "boolean"
        ? payload.requireInteraction
        : notifyDefault.requireInteraction,
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

  event.waitUntil(self.registration.showNotification(notify.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const urlToOpen =
    (event.notification &&
      event.notification.data &&
      event.notification.data.url) ||
    "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          try {
            const clientUrl = new URL(client.url);
            const openUrl = new URL(urlToOpen, self.location.origin);
            if (clientUrl.origin === openUrl.origin) {
              client.focus();
              if (client.url !== openUrl.href) {
                client.navigate(openUrl.href).catch(() => {});
              }
              return;
            }
          } catch (e) {}
        }
        return clients.openWindow(urlToOpen);
      })
  );
});
