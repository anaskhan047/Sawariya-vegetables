// public/sw.js
/* Service Worker: robust payload parsing + click handling
   - Try JSON -> text -> fallback
   - Use data.url for notification click to open/focus a client
*/

self.addEventListener("push", function (event) {
  // defaults
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
      // try parse JSON payload
      const payload = event.data.json();
      notify = {
        title: payload.title ?? notify.title,
        body: payload.body ?? payload.message ?? notify.body,
        icon: payload.icon ?? notify.icon,
        badge: payload.badge ?? notify.badge,
        data: { ...(notify.data || {}), ...(payload.data || {}) },
        tag: payload.tag ?? notify.tag,
        renotify: payload.renotify ?? notify.renotify,
        requireInteraction: payload.requireInteraction ?? notify.requireInteraction,
      };
    } catch (e) {
      // not JSON -> fallback to text
      try {
        const text = event.data.text();
        notify.body = text || notify.body;
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
      // try to focus an existing client of same origin
      for (const client of clientList) {
        try {
          const clientUrl = new URL(client.url);
          const openUrl = new URL(urlToOpen, self.location.origin);
          if (clientUrl.origin === openUrl.origin) {
            // focus and navigate if needed
            client.focus();
            // navigate only if it's a different path
            if (client.url !== openUrl.href) {
              try {
                client.navigate(openUrl.href);
              } catch (e) {
                // some browsers may not support navigate(), ignore
              }
            }
            return;
          }
        } catch (err) {
          // ignore parse errors
        }
      }

      // open a new window/tab if none matched
      return clients.openWindow(urlToOpen);
    })
  );
});
