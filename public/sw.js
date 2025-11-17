// public/sw.js

self.addEventListener("install", (evt) => {
  self.skipWaiting();
});

self.addEventListener("activate", (evt) => {
  clients.claim();
});

// Handle incoming push - always show a visible notification (fallback if payload missing)
self.addEventListener("push", (event) => {
  let payload = { title: "New message", message: "You have a new notification", data: {} };

  try {
    if (event.data) {
      payload = event.data.json();
    }
  } catch (e) {
    // If parsing fails, read plain text
    try {
      payload = JSON.parse(event.data.text());
    } catch (_) {
      payload = { title: "Notification", message: event.data ? event.data.text() : "You have an update", data: {} };
    }
  }

  const title = payload.title || "Notification";
  const options = {
    body: payload.message || payload.body || "",
    icon: payload.icon || "/icons/icon-192.png",
    badge: payload.badge || "/icons/badge-72.png",
    data: payload.data || payload, // used on click
    tag: payload.tag || undefined,
    renotify: payload.renotify || false,
    requireInteraction: payload.requireInteraction || false, // if you want user to dismiss
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle click: focus existing client or open a new window
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const urlToOpen = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (new URL(client.url).origin === self.location.origin) {
          // focus existing tab and navigate if needed
          return client.focus().then(() => client.navigate(urlToOpen).catch(() => {}));
        }
      }
      // open new window
      return clients.openWindow(urlToOpen);
    })
  );
});
