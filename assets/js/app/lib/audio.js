/* audio handling functions */
/* global SoundLister */

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

// try to get data from the cache, but fall back to fetching it
SoundLister.__getData = async (url) => {
  let dataResponse = await fetch(url)

  if (!dataResponse.ok) {
    throw new Error(
      `Audio didn't load successfully; error code: ${
        dataResponse.statusText || dataResponse.status
      }`
    )
  }

  return dataResponse.blob()
}
