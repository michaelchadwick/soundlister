/* misc global functions */
/* global SoundLister */
/* eslint-disable no-undef */

SoundLister.__getFileCount = (dirList) => {
  let sum = 0;

  Object.keys(dirList).forEach((dir) => {
    Object.keys(dirList[dir]).forEach(() => (sum += 1));
  });

  return sum;
};

// get a (hh:)mm:ss styled time display
SoundLister.__calculateTime = (seconds) => {
  const hrs = Math.floor(Number(seconds) / 3600)
    .toString()
    .padStart(2, '0');
  const mins = Math.floor((Number(seconds) % 3600) / 60)
    .toString()
    .padStart(2, '0');
  const secs = Math.floor(Number(seconds) % 60)
    .toString()
    .padStart(2, '0');

  return hrs > 0 ? `${hrs}:${mins}:${secs}` : `${mins}:${secs}`;
};

// asynchronously read a file from disk
SoundLister.__readFileAsync = (file) => {
  return new Promise((resolve) => {
    let reader = new FileReader();

    reader.onload = function () {
      resolve(reader.result);
    };

    reader.onloadend = function () {};

    reader.readAsArrayBuffer(file);
  });
};

SoundLister.__isCached = (filename) => {
  return window.caches
    .open(SL_CACHE_TEXT_KEY)
    .then((cache) => cache.match(filename))
    .then(Boolean);
};

SoundLister.__addToCache = (filename) => {
  window.caches
    .open(SL_CACHE_TEXT_KEY)
    .then((cache) => cache.add(filename))
    .then(() => console.log(`added '${filename}' to cache`))
    .catch((e) => console.error(`failed to cache '${filename}'`, e));
};

SoundLister.__removeFromCache = (filename) => {
  window.caches
    .open(SL_CACHE_TEXT_KEY)
    .then((cache) => cache.delete(filename))
    .then(() => console.log(`removed '${filename}' from cache`))
    .catch((e) => console.error(`failed to remove '${filename}' from cache`, e));
};

// sort an array of objects by any number of properties
SoundLister.__sortObjArr = (oldObjArr, props) => {
  const newObjArr = [];
  const lookupObject = {};

  // look through old object[] and put entries into unique object keys
  for (const index in oldObjArr) {
    let keyArr = [];

    for (const prop in props) {
      keyArr.push(oldObjArr[index][props[prop]]);
    }

    let key = keyArr.join(',');

    // first time we look for a key, it won't exist, so make it
    if (!Object.prototype.hasOwnProperty.call(lookupObject, key)) {
      if (typeof key === 'object') {
        if (key[0] !== undefined) {
          key = key[0];
        } else {
          key = index;
        }
      }
    } else {
      // if a key exists, we tack on an index
      if (typeof key === 'object') {
        if (oldObjArr[index][props[0]][0] !== undefined) {
          key = oldObjArr[index][props[0]][0];
        } else {
          key = index;
        }
      } else if (typeof key === 'string') {
        key = `${key},${index}`;
      } else {
        // is number
        key = (key + 1).toString();
      }
    }

    lookupObject[key] = oldObjArr[index];
  }

  // sort object's keys alphabetically, and then put into a new object[]
  Object.keys(lookupObject)
    .sort()
    .forEach((key) => {
      newObjArr.push(lookupObject[key]);
    });

  return newObjArr;
};
