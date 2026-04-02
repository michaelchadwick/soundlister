/* audio handling functions */
/* global SoundLister, SL_CACHE_AUDIO_KEY */

// asynchronously read a file from disk
SoundLister.__readFileAsync = (file) => {
  return new Promise((resolve) => {
    let reader = new FileReader()

    reader.onload = function () {
      resolve(reader.result)
    }

    reader.onloadend = function () {}

    reader.readAsArrayBuffer(file)
  })
}

SoundLister.__isCached = (filename) => {
  return window.caches
    .open(SL_CACHE_AUDIO_KEY)
    .then((cache) => cache.match(filename))
    .then(Boolean)
}

SoundLister.__addToCache = (filename) => {
  window.caches
    .open(SL_CACHE_AUDIO_KEY)
    .then((cache) => cache.add(filename))
    .then(() => console.log(`added '${filename}' to cache`))
    .catch((e) => console.error(`failed to cache '${filename}'`, e))
}

SoundLister.__removeFromCache = (filename) => {
  window.caches
    .open(SL_CACHE_AUDIO_KEY)
    .then((cache) => cache.delete(filename))
    .then(() => console.log(`removed '${filename}' from cache`))
    .catch((e) => console.error(`failed to remove '${filename}' from cache`, e))
}
