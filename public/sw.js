// public/sw.js
self.addEventListener("push", function (event) {
  // Default notification
  let notify = {
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
      // prefer JSON payload
      const payload = event.data.json();
      notify = {
        ...notify,
        title: payload.title ?? notify.title,
        body: payload.body ?? payload.message ?? notify.body,
        icon: payload.icon ?? notify.icon,
        badge: payload.badge ?? notify.badge,
        tag: payload.tag ?? notify.tag,
        renotify: payload.renotify ?? notify.renotify,
        requireInteraction: payload.requireInteraction ?? notify.requireInteraction,
        data: { ...(notify.data || {}), ...(payload.data || {}) },
      };
    } catch (e) {
      // fallback to text
      try {
        const text = event.data.text();
        notify = { ...notify, body: text };
      } catch (e2) {
        // leave defaults
      }
    }
  }

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

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const urlToOpen = (event.notification && event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        try {
          if (new URL(client.url).origin === new URL(urlToOpen, self.location.origin).origin) {
            client.focus();
            if (client.url !== urlToOpen) {
              // navigate existing tab to the URL
              client.navigate(urlToOpen).catch(() => {});
            }
            return;
          }
        } catch (e) {
          // ignore parse errors
        }
      }
      return clients.openWindow(urlToOpen);
    })
  );
});
