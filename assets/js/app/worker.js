/* worker */
/* js service worker for audio cache */

const SL_CACHE_TEXT_KEY = 'soundlister-cache-audio'

async function initData(collections) {
  await caches.open(SL_CACHE_TEXT_KEY).then(async cache => {
    await cache.keys().then(async function(keys) {
      if (!keys.length) {
        console.log(`web-worker: ${SL_CACHE_TEXT_KEY} is non-existing or empty. Adding files to it...`)

        let filesToAdd = []

        Object.keys(collections).forEach(col => {
          collections[col].forEach(song => {
            filesToAdd.push(`/assets/${song.dirname}/${song.basename}`)
          })
        })

        await cache.addAll(filesToAdd)

        console.log(`web-worker: Added files to ${SL_CACHE_TEXT_KEY} cache`)
      } else {
        // console.log(`web-worker: ${SL_CACHE_TEXT_KEY} is full, so no need to initialize.`)
      }
    })
  })
}

self.addEventListener('install', e => {
  console.log('Service Worker install', e)

  this.initData()
})

self.addEventListener('fetch', e => {
  console.log(e.request.url);
  e.respondWith(
    caches.match(e.request).then(response => response || fetch(e.request))
  )
})
