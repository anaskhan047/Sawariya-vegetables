// public/sw.js  — TEMP logging version (remove after debugging)
self.addEventListener("push", function (event) {
  let text = "no event.data";
  let parsed = null;

  try {
    if (event.data) {
      // try json first
      parsed = event.data.json();
      text = "json: " + JSON.stringify(parsed);
      console.log(event.data.json())
    }
  } catch (e) {
    try {
      // fallback to text
      text = "text: " + event.data.text();
    } catch (e2) {
      // nothing usable
      text = "event.data present but failed to parse";
    }
  }

  // log to service worker console (visible in devtools under service worker context)
  console.log("[SW] push received. parsed:", parsed, "rawText:", text);

  // show a diagnostic notification so you see precisely what arrived
  const title = parsed?.title ?? "Diagnostic push (no title)";
  const options = {
    body: parsed?.body ?? parsed?.message ?? text,
    data: parsed?.data ?? { debug: true },
    tag: parsed?.tag ?? "diagnostic-push",
    renotify: parsed?.renotify ?? false,
    requireInteraction: parsed?.requireInteraction ?? false,
    icon: parsed?.icon ?? "/icons/icon-192.png",
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const url = (event.notification && event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && new URL(client.url).origin === new URL(url, self.location.origin).origin) {
          client.focus();
          try { client.navigate(url); } catch (e) {}
          return;
        }
      }
      return clients.openWindow(url);
    })
  );
});
