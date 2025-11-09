self.addEventListener("push", function(event) {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch (e) {
    payload = { title: "Notification", message: event.data.text() };
  }

  const title = payload.title || payload.data?.title || "New notification";
  const message = payload.message || payload.data?.message || "";
  const data = payload.data || {};

  const options = {
    body: message,
    data,
    tag: data.notificationId || ("notif-" + Date.now()),
    renotify: true,
    // optionally icon, badge
    icon: "/icons/icon-192.png",
    badge: "/icons/badge-72.png",
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function(event) {
  event.notification.close();
  const data = event.notification.data || {};
  // focus/open admin dashboard — adjust URL as needed
  const urlToOpen = new URL("/admin", self.location.origin);
  if (data.orderId) urlToOpen.searchParams.set("orderId", data.orderId);

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(windowClients => {
      // focus already open admin window if exists
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen.toString()) return client.focus();
      }
      return clients.openWindow(urlToOpen.toString());
    })
  );
});
