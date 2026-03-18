// public/sw.js  — OpenClaw Console Service Worker
const CACHE_NAME = "openclaw-v1.3";
const STATIC_ASSETS = [
  "/",
  "/dashboard",
  "/login",
  "/offline.html",
];

// ── Install ───────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ── Activate ──────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// ── Fetch — Network first, cache fallback ─────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Don't cache API calls, WS, or external resources
  if (url.pathname.startsWith("/api/") ||
      url.pathname.startsWith("/webhook/") ||
      url.protocol === "ws:" ||
      request.method !== "GET") {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful page navigations
        if (response.ok && url.origin === self.location.origin) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then(cached =>
          cached ?? caches.match("/offline.html")
        )
      )
  );
});

// ── Push Notifications ────────────────────────────────────────
self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};
  const options = {
    body:    data.body    ?? "OpenClaw Console 有新通知",
    icon:    "/icon-192.png",
    badge:   "/icon-192.png",
    vibrate: [100, 50, 100],
    data:    { url: data.url ?? "/dashboard" },
    actions: data.actions ?? [],
  };
  event.waitUntil(
    self.registration.showNotification(data.title ?? "OpenClaw", options)
  );
});

// ── Notification click ────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url ?? "/dashboard";
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((windowClients) => {
      const existing = windowClients.find(c => c.url.includes(targetUrl));
      if (existing) return existing.focus();
      return clients.openWindow(targetUrl);
    })
  );
});
