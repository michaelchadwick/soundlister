/* worker */
/* js service worker for audio cache */

// TODO: add to CacheStorage?

self.addEventListener('install', e => {
  console.log('Service Worker install', e)
})

self.addEventListener('message', (event) => {
  console.log('message received from main js thread', event)

  event.source.postMessage({
    cmd: 'test',
    val: 'bar',
  })
})

self.addEventListener('fetch', event => {
  console.log('Service Worker fetch request', event.request.url)

  event.respondWith(
    caches.match(event.request).then(response => {
      console.log(response ? 'Serving file from cache' : 'Fetching file from network')

      return response || fetch(event.request)
    })
  )
})

