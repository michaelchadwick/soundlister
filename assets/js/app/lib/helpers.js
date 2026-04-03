/* misc global functions */
/* global SoundLister */

// return number of files loaded for stat purposes
SoundLister.__getFileCount = (dirList) => {
  let sum = 0

  Object.keys(dirList).forEach((dir) => {
    Object.keys(dirList[dir]).forEach(() => (sum += 1))
  })

  return sum
}

// get a (hh:)mm:ss styled time display
SoundLister.__calculateTime = (seconds) => {
  const hrs = Math.floor(Number(seconds) / 3600)
    .toString()
    .padStart(2, '0')
  const mins = Math.floor((Number(seconds) % 3600) / 60)
    .toString()
    .padStart(2, '0')
  const secs = Math.floor(Number(seconds) % 60)
    .toString()
    .padStart(2, '0')

  return hrs > 0 ? `${hrs}:${mins}:${secs}` : `${mins}:${secs}`
}

// sort an array of objects by any number of properties
SoundLister.__sortObjArr = (oldObjArr, props) => {
  const newObjArr = []
  const lookupObject = {}

  // look through old object[] and put entries into unique object keys
  for (const index in oldObjArr) {
    let keyArr = []

    for (const prop in props) {
      keyArr.push(oldObjArr[index][props[prop]])
    }

    let key = keyArr.join(',')

    // first time we look for a key, it won't exist, so make it
    if (!Object.prototype.hasOwnProperty.call(lookupObject, key)) {
      if (typeof key === 'object') {
        if (key[0] !== undefined) {
          key = key[0]
        } else {
          key = index
        }
      }
    } else {
      // if a key exists, we tack on an index
      if (typeof key === 'object') {
        if (oldObjArr[index][props[0]][0] !== undefined) {
          key = oldObjArr[index][props[0]][0]
        } else {
          key = index
        }
      } else if (typeof key === 'string') {
        key = `${key},${index}`
      } else {
        // is number
        key = (key + 1).toString()
      }
    }

    lookupObject[key] = oldObjArr[index]
  }

  // sort object's keys alphabetically, and then put into a new object[]
  Object.keys(lookupObject)
    .sort()
    .forEach((key) => {
      newObjArr.push(lookupObject[key])
    })

  return newObjArr
}

// Fisher-Yates Shuffle
// https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
SoundLister.__shuffleArray = (arr) => {
  let curIdx = arr.length,
    randIdx

  // While there remain elements to shuffle.
  while (curIdx != 0) {
    // Pick a remaining element.
    randIdx = Math.floor(Math.random() * curIdx)
    curIdx--

    // And swap it with the current element.
    ;[arr[curIdx], arr[randIdx]] = [arr[randIdx], arr[curIdx]]
  }

  return arr
}

// convert filename to a title, if needed
SoundLister._filenameToTitle = (filename) => {
  let title
  // change '-' to ' '
  title = filename.replaceAll('-', ' ')
  // remove track numbers
  // e.g. 0 Track, 11 Track, 115 Track, 4-Track, 05-Track, 043-Track
  title = title.replaceAll(/^([0-9]{1,3}[\s-]+)/g, '')
  // remove file extension
  title = title.replaceAll(/\.{1}[a-zA-Z0-9]{3,4}$/g, '')

  let t_split = title.split(' ')

  // uppercase first letter in title
  for (var i = 0; i < t_split.length; i++) {
    t_split[i] = t_split[i].charAt(0).toUpperCase() + t_split[i].slice(1)
  }

  return t_split.join(' ')
}
