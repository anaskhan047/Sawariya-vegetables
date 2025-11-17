// public/sw.js (replace or merge with this)

self.addEventListener("push", function (event) {
  // Helpful logs: open Chrome DevTools -> Application -> Service Workers -> check Console for these logs
  try {
    console.log("[sw] push event received", event);
  } catch (e) {}

  let payload = null;
  try {
    if (event.data) {
      payload = event.data.json();
      console.log("[sw] push payload JSON:", payload);
    } else {
      console.log("[sw] push event has no data (event.data is null)");
    }
  } catch (e) {
    console.error("[sw] failed to parse push event data:", e);
  }

  // If payload present, use it; otherwise show safe fallback notification
  const title = (payload && payload.title) || "New notification";
  const options = {
    body: (payload && payload.message) || "You have a new update. Open the admin panel to view details.",
    data: (payload && payload.data) || { fallback: true },
    // optionally add icon/badge here
    // icon: "/logo/android-launchericon-192-192.png"
  };

  event.waitUntil(
    (async () => {
      try {
        await self.registration.showNotification(title, options);
        console.log("[sw] showNotification called with options:", options);
      } catch (err) {
        console.error("[sw] showNotification error:", err);
      }
    })()
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const data = (event.notification && event.notification.data) || {};
  const targetUrl = typeof data.url === "string" && data.url ? data.url : "/admin";

  console.log("[sw] notificationclick, data:", data, "targetUrl:", targetUrl);

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        try {
          const clientUrl = new URL(client.url);
          const target = new URL(targetUrl, clientUrl.origin);
          if (clientUrl.origin === target.origin) {
            if (client.focus) client.focus();
            if (client.url !== target.href && client.navigate) {
              return client.navigate(target.href);
            }
            return Promise.resolve();
          }
        } catch (e) {
          // ignore parse errors
        }
      }
      return clients.openWindow(targetUrl);
    })
  );
});
