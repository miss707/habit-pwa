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

const reminderTimers = new Map();

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
      return cached || new Response("Offline", {{ status: 200, headers: {{ "Content-Type": "text/plain" }} }});
    }
  })());
});

self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || data.type !== "schedule-reminder") return;
  const habitId = data.habitId;
  if (!habitId) return;

  if (reminderTimers.has(habitId)) {
    clearTimeout(reminderTimers.get(habitId));
  }

  let targetTime = null;
  if (data.scheduledFor) {
    const parsed = new Date(data.scheduledFor);
    if (!Number.isNaN(parsed.getTime())) {
      targetTime = parsed;
    }
  }

  if (!targetTime && data.reminderTime) {
    const parts = String(data.reminderTime).split(":");
    const hour = parseInt(parts[0], 10);
    const minute = parseInt(parts[1], 10);
    if (!Number.isNaN(hour) && !Number.isNaN(minute)) {
      const now = new Date();
      targetTime = new Date(now);
      targetTime.setSeconds(0, 0);
      targetTime.setHours(hour, minute, 0, 0);
      if (targetTime.getTime() <= now.getTime()) {
        targetTime.setDate(targetTime.getDate() + 1);
      }
    }
  }

  if (!targetTime) return;

  const delay = Math.max(0, targetTime.getTime() - Date.now());
  const timeoutId = setTimeout(async () => {
    reminderTimers.delete(habitId);
    if (typeof self.registration.showNotification === "function" && typeof Notification !== "undefined" && Notification.permission === "granted") {
      try {
        await self.registration.showNotification(`Reminder: ${data.habitName || "Habit"}`, {
          body: data.habitName ? `Time to check in on ${data.habitName}.` : "Time to check in on your habit.",
          tag: `habit-${habitId}`,
        });
      } catch (err) {
        // ignore notification errors
      }
    }
  }, delay);

  reminderTimers.set(habitId, timeoutId);
});
