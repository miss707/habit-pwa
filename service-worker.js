const CACHE = "habit-spark-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./app.css",
  "./app.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(ASSETS);
    self.skipWaiting();
  })());
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    self.clients.claim();
  })());
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req);
    if (cached) return cached;
    try {
      const fresh = await fetch(req);
      if (fresh && fresh.status === 200 && fresh.type === "basic") {
        cache.put(req, fresh.clone());
      }
      return fresh;
    } catch (err) {
      return cached || new Response("Offline", { status: 200, headers: { "Content-Type": "text/plain" } });
    }
  })());
});

function formatNotificationDate(iso) {
  if (!iso) return "today";
  try {
    const date = new Date(`${iso}T00:00:00`);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    }
  } catch (err) {
    // ignore
  }
  return iso;
}

self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type !== "habit-missed") return;
  if (!data.habitId || !data.name || !data.date) return;
  const title = `Did you complete ${data.name}?`;
  const body = `Your ${formatNotificationDate(data.date)} check-in is still open.`;
  const options = {
    body,
    tag: `${data.habitId}-${data.date}`,
    data: { habitId: data.habitId, date: data.date },
    actions: [
      { action: "habit-complete", title: "✅ Yes" },
      { action: "habit-skip", title: "❌ Not today" },
    ],
    requireInteraction: false,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  const { notification, action } = event;
  const data = notification.data || {};
  notification.close();

  const handleClick = async () => {
    const clientList = await clients.matchAll({ type: "window", includeUncontrolled: true });
    if (action === "habit-complete" || action === "habit-skip") {
      const responseAction = action === "habit-complete" ? "complete" : "skip";
      clientList.forEach((client) => {
        client.postMessage({
          type: "habit-response",
          habitId: data.habitId,
          date: data.date,
          action: responseAction,
        });
      });
      if (!clientList.length) {
        await clients.openWindow("./");
      }
    } else {
      if (clientList.length) {
        clientList[0].focus();
      } else {
        await clients.openWindow("./");
      }
    }
  };

  event.waitUntil(handleClick());
});
