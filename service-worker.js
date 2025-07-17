// service-worker.js

const CACHE_NAME = "my-rvs-cache-v3"; // IMPORTANT: Increment cache version again
const urlsToCache = [
  "index.html",
  "manifest.json",
  "icons/icon-192x192.png",
  "icons/icon-512x512.png",
  // Temporarily removed app.css and app.js from cache to isolate issue
  // We will re-add them once registration is successful
];

self.addEventListener("install", (event) => {
  console.log("Service Worker: Install event triggered.");
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Service Worker: Caching app shell");
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // Forces the waiting service worker to become the active service worker
      .catch((error) => {
        console.error("Service Worker: Failed to cache during install:", error);
      })
  );
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activate event triggered.");
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log("Service Worker: Deleting old cache", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim()) // Takes control of any clients that are not yet controlled by this service worker
  );
});

self.addEventListener("fetch", (event) => {
  console.log("Service Worker: Fetching", event.request.url);
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return response
      if (response) {
        return response;
      }
      // If not in cache, fetch from network
      return fetch(event.request)
        .then((networkResponse) => {
          // Check if we received a valid response
          if (
            !networkResponse ||
            networkResponse.status !== 200 ||
            networkResponse.type !== "basic"
          ) {
            return networkResponse;
          }

          // IMPORTANT: Clone the response. A response is a stream
          // and can only be consumed once. We must clone it so that
          // we can consume one in the cache and one in the browser.
          const responseToCache = networkResponse.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        })
        .catch((error) => {
          console.error(
            "Service Worker: Fetch failed:",
            event.request.url,
            error
          );
          // Provide a fallback for offline use if possible, e.g., an offline page
          // For now, we'll just return an empty response or a generic error.
          // You could add a fallback HTML page here if needed.
          return new Response(
            "<h1>Offline</h1><p>You are offline and this content is not cached.</p>",
            {
              headers: { "Content-Type": "text/html" },
            }
          );
        });
    })
  );
});
