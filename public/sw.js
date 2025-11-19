// public/sw.js
self.addEventListener("push", function (event) {
  // default fallback notification
  let notifyData = {
    title: "Notification",
    body: "You have a new message",
    icon: "/icons/icon-192.png",
    badge: "/icons/badge-72.png",
    data: { url: "/" },
    tag: undefined,
    renotify: false,
    requireInteraction: false,
  };

  if (event.data) {
    try {
      // try JSON
      const payload = event.data.json();
      // merge payload into notifyData safely
      notifyData = {
        ...notifyData,
        title: payload.title ?? notifyData.title,
        body: payload.body ?? payload.message ?? notifyData.body,
        icon: payload.icon ?? notifyData.icon,
        badge: payload.badge ?? notifyData.badge,
        tag: payload.tag ?? notifyData.tag,
        renotify: payload.renotify ?? notifyData.renotify,
        requireInteraction: payload.requireInteraction ?? notifyData.requireInteraction,
        data: { ...(notifyData.data || {}), ...(payload.data || {}) },
      };
    } catch (err) {
      // not JSON — treat as simple text
      try {
        const text = event.data.text();
        notifyData = { ...notifyData, body: text };
      } catch (e) {
        // leave defaults
      }
    }
  }

  const options = {
    body: notifyData.body,
    icon: notifyData.icon,
    badge: notifyData.badge,
    data: notifyData.data,
    tag: notifyData.tag,
    renotify: notifyData.renotify,
    requireInteraction: notifyData.requireInteraction,
  };

  event.waitUntil(self.registration.showNotification(notifyData.title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  const urlToOpen = (event.notification && event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      // try to focus an open tab with same origin
      for (const client of clientList) {
        try {
          const clientUrl = new URL(client.url);
          const openUrl = new URL(urlToOpen, self.location.origin);
          if (clientUrl.origin === openUrl.origin) {
            // if URL matches origin, focus and navigate if needed
            client.focus();
            // optionally navigate existing client to the path
            if (client.url !== openUrl.href) client.navigate(openUrl.href).catch(() => {});
            return;
          }
        } catch (e) {
          // ignore parse errors
        }
      }
      // if no client found, open a new window/tab
      return clients.openWindow(urlToOpen);
    })
  );
});
