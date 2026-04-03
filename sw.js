/* service worker */
// modified from MDN's https://raw.githubusercontent.com/mdn/dom-examples/refs/heads/main/service-worker/simple-service-worker/sw.js

const SL_CACHE_AUDIO_KEY = 'soundlister-cache-audio-v1'
const SL_CACHE_STATIC_KEY = 'soundlister-cache-static-v1'
const SL_AUDIO_MANIFEST = '/assets/json/audio_manifest.json'
const SL_AUDIO_ASSETS_DIR = '/assets/audio'

const enableNavigationPreload = async () => {
  if (self.registration.navigationPreload) {
    // Enable navigation preloads!
    await self.registration.navigationPreload.enable()
  }
}

self.addEventListener('activate', (event) => {
  event.waitUntil(enableNavigationPreload())
})

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SL_CACHE_STATIC_KEY)
      .then((cache) => {
        const staticAssets = [
          '/',
          '/favicon.ico',
          '/index.html',
          '/site.webmanifest',
          '/assets/css/app.css',
          '/assets/css/colors.css',
          '/assets/css/custom-select.css',
          '/assets/custom/colors.css',
          '/assets/fontawesome/css/fontawesome.min.css',
          '/assets/fontawesome/css/solid.min.css',
          '/assets/fontawesome/webfonts/fa-solid-900.ttf',
          '/assets/fontawesome/webfonts/fa-solid-900.woff2',
          '/assets/icons/android-chrome-192x192.png',
          '/assets/icons/android-chrome-384x384.png',
          '/assets/icons/apple-touch-icon.png',
          '/assets/icons/favicon-16x16.png',
          '/assets/icons/favicon-32x32.png',
          '/assets/icons/mstile-150x150.png',
          '/assets/icons/safari-pinned-tab.svg',
          '/assets/images/logo-small.png',
          '/assets/includes/custom-select.html',
          '/assets/js/app.js',
          '/assets/js/app/constants.js',
          '/assets/js/app/dom.js',
          '/assets/js/app/events.js',
          '/assets/js/app/main.js',
          '/assets/js/app/lib/audio.js',
          '/assets/js/app/lib/collection.js',
          '/assets/js/app/lib/custom-select.js',
          '/assets/js/app/lib/custom-theming.js',
          '/assets/js/app/lib/helpers.js',
          '/assets/js/app/lib/ui.js',
          '/assets/js/vendor/mp3tag.min.js',
          '/assets/php/dir.php',
        ]
        return cache.addAll(staticAssets)
      })
      .then(() => {
        return fetch(SL_AUDIO_MANIFEST)
      })
      .then((resp) => resp.json())
      .then(async (audioUrls) => {
        const cache = await caches.open(SL_CACHE_AUDIO_KEY)
        return await cache.addAll(audioUrls)
      })
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url)

  // If the request is for a static asset, serve from static cache
  if (
    requestUrl.origin === location.origin &&
    !requestUrl.pathname.startsWith(SL_AUDIO_ASSETS_DIR)
  ) {
    event.respondWith(caches.match(event.request).then((resp) => resp || fetch(event.request)))
    return
  }

  // If the request is for an audio file, serve from the audio cache
  if (requestUrl.pathname.startsWith(SL_AUDIO_ASSETS_DIR)) {
    event.respondWith(
      caches.open(SL_CACHE_AUDIO_KEY).then((cache) => {
        return cache.match(event.request).then((resp) => {
          if (resp) {
            return resp // Serve from cache
          }
          // If not cached (e.g. after an update), fetch from network and cache it
          return fetch(event.request).then((networkResp) => {
            cache.put(event.request, networkResp.clone())
            return networkResp
          })
        })
      })
    )
    return
  }

  // Default: just pass through
  event.respondWith(fetch(event.request))
})
