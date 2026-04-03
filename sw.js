/* service worker */
// modified from MDN's https://raw.githubusercontent.com/mdn/dom-examples/refs/heads/main/service-worker/simple-service-worker/sw.js

const SL_CACHE_AUDIO_KEY = 'soundlister-cache-audio-v1'
const SL_CACHE_STATIC_KEY = 'soundlister-cache-static-v1'
const SL_AUDIO_MANIFEST = '/assets/json/audio_manifest.json'
const SL_AUDIO_ASSETS_DIR = '/assets/audio'

const putInCache = async (request, response) => {
  // ignore chrome extension sending messages
  if (/^chrome-extension/gi.test(request.url)) {
    return
  }

  const cache = await caches.open(SL_CACHE_AUDIO_KEY)
  await cache.put(request, response)
}

const cacheFirst = async ({ request, preloadResponsePromise, fallbackUrl }) => {
  // First try to get the resource from the cache
  const responseFromCache = await caches.match(request)
  if (responseFromCache) {
    return responseFromCache
  }

  // Next try to use the preloaded response, if it's there
  // NOTE: Chrome throws errors regarding preloadResponse, see:
  // https://bugs.chromium.org/p/chromium/issues/detail?id=1420515
  // https://github.com/mdn/dom-examples/issues/145
  // To avoid those errors, remove or comment out this block of preloadResponse
  // code along with enableNavigationPreload() and the "activate" listener.
  const preloadResponse = await preloadResponsePromise
  if (preloadResponse) {
    console.info('using preload response', preloadResponse)
    putInCache(request, preloadResponse.clone())
    return preloadResponse
  }

  // Next try to get the resource from the network
  try {
    const responseFromNetwork = await fetch(request.clone())
    // response may be used only once
    // we need to save clone to put one copy in cache
    // and serve second one
    putInCache(request, responseFromNetwork.clone())
    return responseFromNetwork
  } catch (error) {
    const fallbackResponse = await caches.match(fallbackUrl)
    if (fallbackResponse) {
      return fallbackResponse
    }
    // when even the fallback response is not available,
    // there is nothing we can do, but we must always
    // return a Response object
    return new Response('Network error happened', {
      status: 408,
      headers: { 'Content-Type': 'text/plain' },
    })
  }
}

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
  console.log('install event', event)

  // Object.keys(collections).forEach((col) => {
  //   collections[col].forEach((song) => {
  //     const filename = `/assets/audio/${song.subdirPath}/${song.basename}`
  //     SoundLister._logStatus(`Adding ${filename} to the cache`)
  //     filesToAdd.push(filename)
  //   })
  // })

  event.waitUntil(
    caches
      .open(SL_CACHE_STATIC_KEY)
      .then((cache) => {
        const staticAssets = [
          './',
          './favicon.ico',
          './index.html',
          './site.webmanifest',
          './assets/dir.php',
          './assets/css/app.css',
          './assets/css/colors.css',
          './assets/custom/colors.css',
          './assets/fontawesome/css/fontawesome.min.css',
          './assets/fontawesome/css/solid.min.css',
          './assets/fontawesome/webfonts/fa-solid-900.ttf',
          './assets/fontawesome/webfonts/fa-solid-900.woff2',
          './assets/icons/android-chrome-192x192.png',
          './assets/icons/android-chrome-384x384.png',
          './assets/icons/apple-touch-icon.png',
          './assets/icons/favicon-16x16.png',
          './assets/icons/favicon-32x32.png',
          './assets/icons/mstile-150x150.png',
          './assets/icons/safari-pinned-tab.svg',
          './assets/images/logo-small.png',
          './assets/js/app.js',
          './assets/js/app/constants.js',
          './assets/js/app/dom.js',
          './assets/js/app/events.js',
          './assets/js/app/main.js',
          './assets/js/app/lib/audio.js',
          './assets/js/app/lib/collection.js',
          './assets/js/app/lib/custom-select.js',
          './assets/js/app/lib/custom-theming.js',
          './assets/js/app/lib/helpers.js',
          './assets/js/app/lib/ui.js',
          './assets/js/vendor/mp3tag.min.js',
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
