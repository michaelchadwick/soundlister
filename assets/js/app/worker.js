/* worker */
/* js background worker for audio cache */

const SL_CACHE_TEXT_KEY = 'gemwarrior-cache-audio'
const SL_ASSET_DATA_PATH = '/assets/audio'

// Try to get data from the cache, but fall back to fetching it live.
async function getData(cacheName, url) {
  let cachedData = await this.getCachedData(cacheName, url)

  if (cachedData) {
    // console.log('Cache full:', cachedData)

    return cachedData
  }

  // console.log(`Cache empty: fetching fresh data for ${url}`)

  const cacheStorage = await caches.open(cacheName)
  await cacheStorage.add(url)
  cachedData = await this.getCachedData(cacheName, url)
  await this.deleteOldCaches(cacheName)

  return cachedData
}

// Get data from the cache.
async function getCachedData(cacheName, url) {
  const cacheStorage = await caches.open(cacheName)
  const cachedResponse = await cacheStorage.match(url)

  if (!cachedResponse || !cachedResponse.ok) {
    return false
  }

  return cachedResponse
}

// Delete cache when unused to respect user's disk space
async function deleteCache(cacheName) {
  console.log(`web worker: deleting ${cacheName} cache...`)

  const keys = await caches.keys()

  for (const key of keys) {
    if (cacheName !== key) {
      continue
    } else {
      caches.delete(key)
    }
  }
}

// use CacheStorage to check cache
async function useCache(url) {
  try {
    // console.log(`web-worker: Cache Request: '${url}'`)

    const cacheResponse = await this.getData(SL_CACHE_TEXT_KEY, url)
    const textBuffer = await cacheResponse.text()

    postMessage({ command: 'data', value: textBuffer })
  } catch (error) {
    console.error('web-worker: CacheStorage error', error)
  }
}

// use direct fetch(url)
async function useFetch(url) {
  console.log(`web-worker: Fetch Request: '${url}'`)

  const statusText = await fetch(url)
    .then(response => response.text())

  postMessage({ command: 'data', value: statusText })
}

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

function loadAudio(url) {
  if ('caches' in self) {
    this.useCache(url)
  } else {
    this.useFetch(url)
  }
}

onmessage = function(msg) {
  console.log('web-worker: received msg from main js', msg.data)

  const cmd = msg.data.command
  const val = msg.data.value

  if (msg.isTrusted) {
    if (cmd == 'init') {
      this.initData(val)
    } else if (cmd == 'destroy') {
      this.deleteCache(SL_CACHE_TEXT_KEY)
    } else {
      loadAudio(val)
    }
  } else {
    console.error('web-worker: untrusted message posted to Web Worker!', msg)
  }
}