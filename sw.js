const CACHE = "lostfound-shell-v2";
const SHELL_FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./supabase-config.js",
  "./manifest.json",
  "./img/map_castle.jpg",
  "./img/map_blossom.jpg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL_FILES).catch(() => {}))
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 앱 셸(정적 파일)은 캐시 우선, 그 외(Supabase 등 API 요청)는 항상 네트워크로
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return; // Supabase 등 외부 요청은 그대로 통과
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});
