/* main */
/* global SoundLister, MP3Tag */

SoundLister.currentIndex = 0
SoundLister.tags = {}
SoundLister.index = 0
SoundLister.col = '_'
SoundLister.playIconState = 'play'
SoundLister.muteIconState = 'unmute'
SoundLister.raf = null
SoundLister.repeatMode = true // for now, only 2 modes
SoundLister.shuffleMode = false // for now, only 2 modes

SoundLister.config = {}

SoundLister.dom = {}
SoundLister.dom.audioPlayerContainer = document.getElementById('audio-player-container')
SoundLister.dom.audio = document.querySelector('audio')
SoundLister.dom.playButton = document.getElementById('play-icon')
SoundLister.dom.playButtonIcon = document.querySelector('#play-icon i')
SoundLister.dom.seekSlider = document.getElementById('seek-slider')
SoundLister.dom.volumeSlider = document.getElementById('volume-slider')
SoundLister.dom.muteButton = document.getElementById('mute-icon')
SoundLister.dom.muteButtonIcon = document.querySelector('#mute-icon i')
SoundLister.dom.prevButton = document.getElementById('backward')
SoundLister.dom.repeatButton = document.getElementById('repeat-mode')
SoundLister.dom.shuffleButton = document.getElementById('shuffle-mode')
SoundLister.dom.nextButton = document.getElementById('forward')
SoundLister.dom.collDisplay = document.getElementById('coll-display')
SoundLister.dom.collDropdown = document.querySelector('#collections select')
// STUB:
// SoundLister.dom.collNative = document.querySelector('#collections select.selectNative')
// SoundLister.dom.collCustom = document.querySelector('#collections .selectCustom')
SoundLister.dom.loadMessage = document.getElementById('load-message')
SoundLister.dom.loadAnimation = document.getElementById('load-animation')
SoundLister.dom.progressBar = document.querySelector('#progress-bar .progress__bar')
SoundLister.dom.playlist = document.getElementById('playlist')

/* ********************************* */
/* public functions                  */
/* ********************************* */

// attach DOM presentation event listeners
SoundLister.attachPresentationListeners = () => {
  // play/pause button
  SoundLister.dom.playButton.addEventListener('click', () => {
    SoundLister._updatePlayButton()
  })

  // mute/unmute button
  SoundLister.dom.muteButton.addEventListener('click', () => {
    SoundLister._updateMuteButton()
  })

  // audio seek slider
  SoundLister.dom.seekSlider.addEventListener('input', (e) => {
    SoundLister._showRangeProgress(e.target)
  })

  // audio volume slider
  SoundLister.dom.volumeSlider.addEventListener('input', (e) => {
    SoundLister._showRangeProgress(e.target)
  })

  // click/tap Prev button
  SoundLister.dom.prevButton.addEventListener('click', (e) => SoundLister.goBack(e))
  // click/tap Repeat Mode button
  SoundLister.dom.repeatButton.addEventListener('click', (e) => SoundLister.toggleRepeatMode(e))
  // click/tap Shuffle Mode button
  SoundLister.dom.shuffleButton.addEventListener('click', (e) => SoundLister.toggleShuffleMode(e))
  // click/tap Next button
  SoundLister.dom.nextButton.addEventListener('click', (e) => SoundLister.goForward(e))

  // collection filter changes
  SoundLister.dom.collDropdown.addEventListener('change', (e) => {
    // update SoundLister current collection
    SoundLister.col = e.target.value

    // remake playlist
    SoundLister._remakePlaylist()

    // update browser UI
    SoundLister._updateCollDisplay()
  })

  // click/tap audio track on playlist
  SoundLister.dom.playlist.addEventListener('click', (e) => {
    e.preventDefault()

    let track = e.target

    // if we "miss" the correct position to click, bubble up to the a
    if (track.classList.contains('track-attribute')) {
      track = track.closest('a')
    }

    SoundLister.currentIndex = parseInt(track.dataset.index)

    SoundLister.playTrack(track)

    SoundLister._updatePlayButton('playlist')
  })

  window.onresize = SoundLister._resizePlaylist
}

// attach DOM functional event listeners
SoundLister.attachFunctionalListeners = () => {
  // <audio> element has started loading
  SoundLister.dom.audio.addEventListener('loadstart', (e) => {
    // console.log('audio loading begun', e)
  })
  // <audio> element is loaded enough to start playing
  SoundLister.dom.audio.addEventListener('canplay', (e) => {
    // console.log('audio can play', e)
    SoundLister._displayAudioDuration()
    SoundLister._setSliderMax()
    SoundLister._displayBufferedAmount()
  })
  // <audio> element is loaded enough to play to end
  SoundLister.dom.audio.addEventListener('canplaythrough', (e) => {
    // console.log('audio can play through', e)
  })
  // <audio> element has started playing
  SoundLister.dom.audio.addEventListener('play', (e) => {
    // console.log('audio has started playing', e)
  })
  // <audio> element is playing
  SoundLister.dom.audio.addEventListener('playing', (e) => {
    // console.log('audio is playing', e)
  })
  // <audio> element has been paused
  SoundLister.dom.audio.addEventListener('paused', (e) => {
    // console.log('audio has been paused', e)
  })
  // <audio> element ended
  SoundLister.dom.audio.addEventListener('ended', (e) => {
    // console.log('audio ended', e)
    SoundLister.goForward()
  })
  // <audio> element had an error occur
  SoundLister.dom.audio.addEventListener('error', (e) => {
    console.error('<audio> element error', e)
  })

  // <audio> element progress
  SoundLister.dom.audio.addEventListener('progress', () => {
    SoundLister._displayBufferedAmount()
  })

  // <audio> element progress seek slider
  SoundLister.dom.seekSlider.addEventListener('input', () => {
    SoundLister.dom.currentTime.textContent = SoundLister.__calculateTime(SoundLister.dom.seekSlider.value);

    if (!SoundLister.dom.audio.paused) {
      cancelAnimationFrame(SoundLister.raf)
    }
  })
  SoundLister.dom.seekSlider.addEventListener('change', () => {
    // console.log('manually seeked through song')

    SoundLister.dom.audio.currentTime = SoundLister.dom.seekSlider.value

    if (!SoundLister.dom.audio.paused) {
      requestAnimationFrame(SoundLister._whilePlaying)
      SoundLister.dom.audio.play()
    }
  })

  // <audio> element volume slider
  SoundLister.dom.volumeSlider.addEventListener('input', (e) => {
    const volume = e.target.value

    if (parseInt(volume) > 0) {
      SoundLister.dom.muteButtonIcon.classList.remove('fa-volume-off')
      if (parseInt(volume) > 49) {
        SoundLister.dom.muteButtonIcon.classList.remove('fa-volume-low')
        SoundLister.dom.muteButtonIcon.classList.add('fa-volume-high')
      } else {
        SoundLister.dom.muteButtonIcon.classList.remove('fa-volume-high')
        SoundLister.dom.muteButtonIcon.classList.add('fa-volume-low')
      }
    } else {
      SoundLister.dom.muteButtonIcon.classList.remove('fa-volume-low')
      SoundLister.dom.muteButtonIcon.classList.remove('fa-volume-high')
      SoundLister.dom.muteButtonIcon.classList.add('fa-volume-off')
    }

    // SoundLister.dom.outputVolume.textContent = volume.padStart(3, '0')

    SoundLister.dom.audio.volume = volume / 100
  })

  // gotta use keydown, not keypress, or else Delete/Backspace aren't recognized
  document.addEventListener('keydown', (event) => {
    if (event.code == 'Space') {
      SoundLister._updatePlayButton()
    } else {
      if (event.metaKey && event.code == 'ArrowRight') {
        SoundLister.goForward()
      } else if (event.metaKey && event.code == 'ArrowLeft') {
        SoundLister.goBack()
      }
    }
  })
}

// gets tracklist with potential collection filter
SoundLister.tracks = () => {
  let tracks = null

  if (SoundLister.col !== '_') {
    tracks = document.querySelectorAll(`#playlist a[data-col=${SoundLister.col}]`)
  } else {
    tracks = document.querySelectorAll('#playlist a')
  }

  return tracks
}

// go back one track in the playlist
SoundLister.goBack = (e = null) => {
  // console.log('goBack()')

  if (e) {
    e.preventDefault()
  }

  const len = SoundLister.tracks().length - 1

  if (!SoundLister.shuffleMode) {
    SoundLister.currentIndex = SoundLister.currentIndex === 0 ? len : SoundLister.currentIndex - 1

    SoundLister.changeTrack(SoundLister.currentIndex)
  }
  /* TODO: SHUFFLE */
  else {

  }
}

// toggle repeat mode
SoundLister.toggleRepeatMode = (e = null) => {
  if (SoundLister.repeatMode) {
    SoundLister.dom.repeatButton.classList.remove('repeat-all')
    SoundLister.dom.repeatButton.classList.add('repeat-none')
  } else {
    SoundLister.dom.repeatButton.classList.remove('repeat-none')
    SoundLister.dom.repeatButton.classList.add('repeat-all')
  }

  SoundLister.repeatMode = !SoundLister.repeatMode
}

// toggle shuffle mode
SoundLister.toggleShuffleMode = (e = null) => {
  // default is off, so first check is turning it on
  if (!SoundLister.shuffleMode) {
    // dom updates
    // SoundLister.dom.shuffleButton.classList.remove('shuffle-none')
    // SoundLister.dom.shuffleButton.classList.add('shuffle-all')

    // // shuffle keys and add to queue
    // SoundLister.shuffleQueue = SoundLister._shuffleArray(Object.keys(SoundLister.tracks()))
  } else {
    // dom updates
    SoundLister.dom.shuffleButton.classList.remove('shuffle-all')
    SoundLister.dom.shuffleButton.classList.add('shuffle-none')
  }

  SoundLister.shuffleMode = !SoundLister.shuffleMode
}

// go forward one track in the playlist
SoundLister.goForward = (e = null) => {
  // console.log('goForward()')

  if (e) {
    e.preventDefault()

    // console.log('manual change to next song')
  } else {
    // console.log('song ended and changing to next one')
  }

  const len = SoundLister.tracks().length - 1

  if (!SoundLister.shuffleMode) {
    if (SoundLister.currentIndex === len) {
      SoundLister.currentIndex = 0

      if (SoundLister.repeatMode) {
        SoundLister.changeTrack(SoundLister.currentIndex)
      } else {
        SoundLister._updatePlayButton()
      }
    } else {
      SoundLister.currentIndex = SoundLister.currentIndex + 1

      SoundLister.changeTrack(SoundLister.currentIndex)
    }
  }
  /* TODO: SHUFFLE */
  else {

  }
}

// change the currently-playing track
SoundLister.changeTrack = (current) => {
  // console.log('changeTrack()', current)

  SoundLister.playTrack(SoundLister.tracks()[current])

  const activeTrack = document.querySelector('#playlist a.active')

  activeTrack.scrollIntoView({ 'behavior': 'smooth', 'block': 'end' })
}

// play currently-loaded track
SoundLister.playTrack = async (track) => {
  // console.log('playTrack()', track.href)

  // change <audio> source
  SoundLister.dom.audio.src = track.href

  // switch DOM's active track
  SoundLister.tracks().forEach(t => t.classList.remove('active'))
  track.classList.add('active')

  // play song
  SoundLister.dom.audio.play()

  SoundLister._updatePlayButton('playlist')
}

/* ********************************* */
/* _private functions                */
/* ********************************* */

// Fisher-Yates Shuffle
// https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
SoundLister._shuffleArray = (arr) => {
  let curIdx = arr.length, randIdx;

  // While there remain elements to shuffle.
  while (curIdx != 0) {

    // Pick a remaining element.
    randIdx = Math.floor(Math.random() * curIdx);
    curIdx--;

    // And swap it with the current element.
    [arr[curIdx], arr[randIdx]] = [arr[randIdx], arr[curIdx]];
  }

  return arr;
}

SoundLister._registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register(SL_SERVICE_WORKER_PATH, { scope: 'assets/js/app/' })
      .then((registration) => {
        console.log('Service Worker registered', registration)

        if (registration.installing) {
          console.log('Service worker installing');
        } else if (registration.waiting) {
          console.log('Service worker installed');
        } else if (registration.active) {
          console.log('Service worker active');
        }
      })
      .catch((err) => {
        console.error('Service Worker failed to register', err)
      })
  }
}

// change max-height of playlist to match viewport
SoundLister._resizePlaylist = () => {
  SoundLister.dom.playlist.style.maxHeight = `${window.innerHeight - 295}px`
}

// remake playlist with collection filter
SoundLister._remakePlaylist = () => {
  // console.log('_remakePlaylist()')

  // empty playlist
  SoundLister.dom.playlist.innerHTML = ''
  SoundLister.index = 0

  // remake playlist
  SoundLister.songs.forEach(song => {
    if (SoundLister.col !== '_') {
      if (song.col == SoundLister.col) {
        SoundLister._createPlaylistItem(song)
      }
    } else {
      SoundLister._createPlaylistItem(song)
    }

    // SoundLister.index = SoundLister.index + 1
  })

  // update new playlist song durations
  SoundLister._getSongDurations()

  SoundLister._updatePlayButton('collection')
}

// add song durations to playlist
SoundLister._getSongDurations = () => {
  // create audio elements - to read songs duration
  let audio_arr = [];

  SoundLister.tracks().forEach((track) => {
    const audio = document.createElement('audio')

    audio.src = track.href
    audio_arr.push(audio)
  })

  // get each song duration and put it in html element with '.song-duration' class name
  audio_arr.forEach((audio, index) => {
    audio.addEventListener('loadeddata', () => {
      const minutes = Math.floor(audio.duration / 60)
      const seconds = Math.floor(audio.duration % 60)

      if (document.querySelectorAll('.track-duration')[index]) {
        document.querySelectorAll('.track-duration')[index].innerHTML = `${minutes}:${seconds >= 10 ? seconds : '0' + seconds}`
      }
    })
  })
}

// use mp3tag to read ID3 tags from songs
SoundLister._getID3Tags = (buffer) => {
  const mp3tag = new MP3Tag(buffer)

  mp3tag.read()

  return mp3tag.tags
}

// add DOM element to playlist
SoundLister._createPlaylistItem = (song) => {
  const track = document.createElement('a')

  if (SoundLister.index == 0) {
    track.classList.add('active')
    SoundLister.dom.audio.setAttribute('src', song.url)
  }

  track.setAttribute('title', song.title)
  track.setAttribute('alt', song.title)
  track.dataset.index = SoundLister.index
  track.dataset.col = song.col
  track.href = song.url

    const trackNum = document.createElement('label')
    trackNum.classList.add('track-attribute', 'track-num')
    trackNum.innerHTML = (SoundLister.index + 1).toString().padStart(2, '0')

    const trackTitles = document.createElement('div')
    trackTitles.classList.add('track-attribute', 'titles')

      const trackName = document.createElement('div')
      trackName.classList.add('track-attribute', 'track-name')
      trackName.innerHTML = song.title

      const trackArtistAlbum = document.createElement('div')
      trackArtistAlbum.classList.add('track-attribute', 'track-artist-album')
      trackArtistAlbum.innerHTML = `
        by <span class='track-attribute highlight'>${song.artist}</span> on <span class='track-attribute highlight'>${song.album}</span>
      `

      trackTitles.append(trackName)
      trackTitles.append(trackArtistAlbum)

    const trackDuration = document.createElement('div')
    trackDuration.classList.add('track-attribute', 'track-duration')
    trackDuration.innerHTML = song.duration

    track.append(trackNum)
    track.append(trackTitles)
    track.append(trackDuration)

  SoundLister.dom.playlist.appendChild(track)

  SoundLister.index++
}

// convert filename to a title, if needed
SoundLister._filenameToTitle = (filename) => {
  // change '-' to ' ', remove track numbers, remove file extension
  let t = filename
    .replaceAll('-', ' ')
    .replaceAll(/^[0-9]+/g, '')
    .replaceAll(/\.{1}[a-zA-Z0-9]{3,4}$/g, '')
  let t_split = t.split(' ')

  for (var i = 0; i < t_split.length; i++) {
    t_split[i] = t_split[i].charAt(0).toUpperCase() + t_split[i].slice(1);
  }

  return t_split.join(' ')
}

// fill songs object[] with JSON
SoundLister._fillSongs = async (fileColObj) => {
  const songObjArr = []
  let fileIndex = 1

  let fileCount = SoundLister.__getFileCount(fileColObj)

  // put all file information into 'songs' object[]
  for (const col in fileColObj) {
    const dirPath = `./assets/audio/${col}`

    for (const index in fileColObj[col]) {
      const baseName = fileColObj[col][index]['basename']
      const filePath = `${dirPath}/${baseName}`
      const ms = fileColObj[col][index]['ms']
      const duration = fileColObj[col][index]['duration']
      const response = await fetch(filePath)
      const data = await response.blob()

      // when FileReader loads, read ID3 tags from file via MP3Tag
      // if found, use; otherwise use defaults
      const buffer = await SoundLister.__readFileAsync(data)
      const tags = await SoundLister._getID3Tags(buffer)

      const defaultTitle = SoundLister._filenameToTitle(baseName)
      const defaultArtist = 'Unknown Artist'
      const defaultAlbum = 'Unknown Album'

      const songTitle = tags.title || defaultTitle
      const songArtist = tags.artist || defaultArtist
      const songAlbum = tags.album || defaultAlbum

      const newSong = {
        "title": songTitle,
        "artist": songArtist,
        "album": songAlbum,
        "ms": ms,
        "duration": duration,
        "col": col,
        "url": filePath
      }

      songObjArr.push(newSong)

      const percentDone = (fileIndex / fileCount) * 100

      SoundLister._updateProgressBar(percentDone, songTitle, fileIndex, fileCount)

      fileIndex += 1
    }
  }

  return SoundLister.__sortObjArr(songObjArr, ['url'])
}

SoundLister._updateProgressBar = (percent, title, cur, total) => {
  if (percent >=0 && percent <= 100) {
    SoundLister.dom.progressBar.innerHTML = `<span>loading </span><span><strong>${title}</strong></span><span> (${cur}/${total})</span>`
    SoundLister.dom.progressBar.style.width = percent + '%'
  }
}

// use PHP script to scan audio directory
// add to CacheStorage
// return titles of files
SoundLister._getFiles = async () => {
  let fileList = await fetch('./assets/dir.php')
  let titlesArray = await fileList.text()
  let titlesJSON = JSON.parse(titlesArray)

  // initiate the collection dropdown
  Object.keys(titlesJSON).forEach(col => SoundLister._addCollectionOption(col))

  // TODO: use a Service Worker to intercept requests and return cached versions if possible
  // SoundLister._registerServiceWorker()

  // check querystring for ?collection= to filter dropdown
  SoundLister._loadQSCollection()

  if (SoundLister.col !== '_') {
    titlesJSON = Object.keys(titlesJSON)
      .filter(key => key.includes(SoundLister.col))
      .reduce((cur, key) => { return Object.assign(cur, { [key]: titlesJSON[key] }) }, {})
  }

  return titlesJSON
}

// add new option to collections dropdown
SoundLister._addCollectionOption = (col) => {
  // bog-standard <select>
  SoundLister.dom.collDropdown.options.add(new Option(col, col))

  // STUB
  // Blog: https://css-tricks.com/striking-a-balance-between-native-and-custom-select-elements/
  // Codepen: https://codepen.io/sandrina-p/pen/YzyOYRr

  // SoundLister.dom.collNative.options.add(new Option(col, col))

  // const option = document.createElement('div')
  // option.classList.add('selectCustom-option')
  // option.dataset.value = col
  // option.textContent = col
  // SoundLister.dom.collCustom.querySelector('.selectCustom-options').appendChild(option)
}

// change play/pause icon depending on context
SoundLister._updatePlayButton = (source = null) => {
  // console.log('_updatePlayButton', source)

  switch (source) {
    case 'playlist':
      requestAnimationFrame(SoundLister._whilePlaying)
      SoundLister.playIconState = 'pause'

      if (SoundLister.dom.playButtonIcon.classList.contains('fa-play')) {
        SoundLister.dom.playButtonIcon.classList.remove('fa-play')

        if (!SoundLister.dom.playButtonIcon.classList.contains('fa-pause')) {
          SoundLister.dom.playButtonIcon.classList.add('fa-pause')
        }
      }
      break

    case 'collection':
      cancelAnimationFrame(SoundLister.raf)

      const track = SoundLister.tracks()[0]

      SoundLister.dom.audio.src = track.href

      if (SoundLister.dom.playButtonIcon.classList.contains('fa-pause')) {
        SoundLister.dom.playButtonIcon.classList.remove('fa-pause')

        if (!SoundLister.dom.playButtonIcon.classList.contains('fa-play')) {
          SoundLister.dom.playButtonIcon.classList.add('fa-play')
        }
      }
      break

    default:
      if (SoundLister.playIconState === 'play') {
        SoundLister.dom.audio.play()

        requestAnimationFrame(SoundLister._whilePlaying)
        SoundLister.playIconState = 'pause'
      } else {
        SoundLister.dom.audio.pause()

        cancelAnimationFrame(SoundLister.raf)
        SoundLister.playIconState = 'play'
      }

      SoundLister.dom.playButtonIcon.classList.toggle('fa-play')
      SoundLister.dom.playButtonIcon.classList.toggle('fa-pause')

      break
  }
}

// toggle mute button icon
SoundLister._updateMuteButton = () => {
  if (SoundLister.muteIconState === 'unmute') {
    SoundLister.dom.audio.muted = true
    SoundLister.muteIconState = 'mute'
  } else {
    SoundLister.dom.audio.muted = false
    SoundLister.muteIconState = 'unmute'
  }

  SoundLister.dom.muteButtonIcon.classList.toggle('fa-volume-mute')
}

SoundLister._displayBufferedAmount = () => {
  // const bufferedLength = SoundLister.dom.audio.buffered.length - 1

  // console.log('audio.buffered', SoundLister.dom.audio.buffered)
  // console.log('bufferedLength', bufferedLength)

  // const bufferedAmount = Math.floor(SoundLister.dom.audio.buffered.end(bufferedLength))

  // SoundLister.dom.audioPlayerContainer.style.setProperty(
  //   '--buffered-width',
  //   `${(bufferedAmount / SoundLister.dom.seekSlider.max) * 100}%`
  // )
}

SoundLister._displayAudioDuration = () => {
  const duration = SoundLister.__calculateTime(SoundLister.dom.audio.duration)

  SoundLister.dom.totalTime.textContent = duration
}

SoundLister._setSliderMax = () => {
  const duration = Math.floor(SoundLister.dom.audio.duration)

  SoundLister.dom.seekSlider.max = duration
}

SoundLister._showRangeProgress = (rangeInput) => {
  if (rangeInput === SoundLister.dom.seekSlider) {
    SoundLister.dom.audioPlayerContainer.style.setProperty(
      '--seek-before-width',
      rangeInput.value / rangeInput.max * 100 + '%'
    )
  } else {
    SoundLister.dom.audioPlayerContainer.style.setProperty(
      '--volume-before-width',
      rangeInput.value / rangeInput.max * 100 + '%'
    )
  }
}

SoundLister._whilePlaying = () => {
  SoundLister.dom.seekSlider.value = Math.floor(SoundLister.dom.audio.currentTime)
  SoundLister.dom.currentTime.textContent = SoundLister.__calculateTime(SoundLister.dom.seekSlider.value)

  SoundLister.dom.audioPlayerContainer.style.setProperty(
    '--seek-before-width',
    `${SoundLister.dom.seekSlider.value / SoundLister.dom.seekSlider.max * 100}%`
  )

  SoundLister.raf = requestAnimationFrame(SoundLister._whilePlaying)
}

SoundLister._addAudioToCache = async (collections) => {
  await caches.open(SL_CACHE_TEXT_KEY).then(async cache => {
    await cache.keys().then(async function(keys) {
      if (!keys.length) {
        // console.log(`${SL_CACHE_TEXT_KEY} is non-existing or empty, so adding files to it...`)

        let filesToAdd = []

        Object.keys(collections).forEach(col => {
          collections[col].forEach(song => {
            filesToAdd.push(`/assets/${song.dirname}/${song.basename}`)
          })
        })

        await cache.addAll(filesToAdd)

        // console.log(`added files to ${SL_CACHE_TEXT_KEY} cache`)
      } else {
        // console.log(`${SL_CACHE_TEXT_KEY} is full, so no need to initialize`)
      }
    })
  })
}

SoundLister._loadQSCollection = () => {
  const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
  })

  const colToLoad = params.collection

  if (colToLoad) {
    SoundLister.col = colToLoad

    const validChoices = Array.from(SoundLister.dom.collDropdown.options).map(op => op.value)

    // permananently change to one collection (save network)
    // remove collection dropdown
    if (validChoices.includes(colToLoad)) {
      SoundLister.dom.collDropdown.value = params.collection
      SoundLister.dom.collDropdown.dispatchEvent(new Event('change'))
      SoundLister.dom.collDropdown.disabled = true
      SoundLister.dom.collDropdown.style.display = 'none'

      SoundLister._updateCollDisplay()
    } else {
      // if invalid collection speficied, default to all collections
      SoundLister.col = SL_DEFAULT_COLLECTION
    }
  }
}

SoundLister._updateCollDisplay = () => {
  if (SoundLister.col != '_') {
    document.title = SoundLister.col.toUpperCase() + ' | Soundlister'

    SoundLister.dom.collDisplay.innerHTML = `<strong>${SoundLister.col.toUpperCase()}</strong>.`
  } else {
    document.title = 'Soundlister'

    SoundLister.dom.collDisplay.innerHTML = 'something.'
  }

  if (SoundLister.env == 'local') {
    document.title = '(LH) ' + document.title
  }
}

/* ********************************* */
/* _private __helper functions       */
/* ********************************* */

SoundLister.__getFileCount = (obj) => {
  let sum = 0

  Object.keys(obj).forEach(dir => {
    Object.keys(obj[dir]).forEach(() => sum += 1)
  })

  return sum
}

// get a mm:ss styled time display
SoundLister.__calculateTime = (secs) => {
  const minutes = Math.floor(secs / 60)
  const seconds = Math.floor(secs % 60)
  const returnedSeconds = seconds < 10 ? `0${seconds}` : `${seconds}`

  return `${minutes}:${returnedSeconds}`
}

// asynchronously read a file from disk
SoundLister.__readFileAsync = (file) => {
  return new Promise((resolve, reject) => {
    let reader = new FileReader()

    reader.onload = function() {
      resolve(reader.result)
    }

    reader.onloadend = function() {}

    reader.readAsArrayBuffer(file)
  })
}

SoundLister.__isCached = (filename) => {
  return window.caches.open(SL_CACHE_TEXT_KEY)
    .then(cache => cache.match(filename))
    .then(Boolean);
}

SoundLister.__addToCache = (filename) => {
  window.caches.open(SL_CACHE_TEXT_KEY)
    .then(cache => cache.add(filename))
    .then(() => console.log(`added '${filename}' to cache`))
    .catch(e => console.error(`failed to cache '${filename}'`, e))
}

SoundLister.__removeFromCache = (filename) => {
  window.caches.open(SL_CACHE_TEXT_KEY)
    .then(cache => cache.delete(filename))
    .then(() => console.log(`removed '${filename}' from cache`))
    .catch(e => console.error(`failed to remove '${filename}' from cache`, e))
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
    if (!lookupObject.hasOwnProperty(key)) {
      if (typeof key === 'object') {
        if (key[0] !== undefined) {
          key = key[0];
        } else {
          key = index
        }
      }
    } else { // if a key exists, we tack on an index
      if (typeof key === 'object') {
        if (oldObjArr[index][props[0]][0] !== undefined) {
          key = oldObjArr[index][props[0]][0];
        } else {
          key = index
        }
      } else if (typeof key === 'string') {
        key = `${key},${index}`;
      } else { // is number
        key = (key + 1).toString();
      }
    }

    //  console.log('sortObjArr2 key', key);

    lookupObject[key] = oldObjArr[index];
  }

  // console.log('sortObjArr2 lookupObject', lookupObject);        // object

  // sort object's keys alphabetically, and then put into a new object[]
  Object.keys(lookupObject).sort().forEach(key => {
    newObjArr.push(lookupObject[key]);
  });

  // console.log('sortObjArr2 newObjArr', newObjArr);              // object[]

  return newObjArr;
}

/* ********************************* */
/* start the engine                  */
/* ********************************* */

;(async() => {
  // create fileObjArr object array of file info
  const fileObjArr = await SoundLister._getFiles()

  // create SoundLister.songs JSON object with title, artist, etc. of all songs
  SoundLister.songs = await SoundLister._fillSongs(fileObjArr)

  // create playlist from SoundLister.songs
  SoundLister.dom.playlist.textContent = ''
  Object.values(SoundLister.songs).forEach(song => SoundLister._createPlaylistItem(song))

  // SoundLister.dom.loadMessage.classList.remove('loading')

  // hide loading info once songs are loaded
  SoundLister.dom.progressBar.innerHTML = '<span>loading done!</span>'
  setTimeout(() => {
    SoundLister.dom.progressBar.parentElement.style.height = '0'
    setTimeout(() => {
      SoundLister.dom.progressBar.parentElement.style.display = 'none'
    }, 100)
  }, 2000)

  // attach DOM listeners
  SoundLister.attachPresentationListeners()

  // init DOM status labels
  SoundLister.dom.currentTime = document.getElementById('time-current')
  SoundLister.dom.totalTime = document.getElementById('time-total')
  SoundLister.dom.outputVolume = document.getElementById('output-volume')

  // TODO: add files to CacheStorage AND be able to use them
  // SoundLister._addAudioToCache(fileObjArr)

  // if <audio> is loaded and ready, then get its duration and such
  if (SoundLister.dom.audio.readyState == 4) {
    SoundLister._displayAudioDuration()
    SoundLister._setSliderMax()
    SoundLister._displayBufferedAmount()
  } else {
    SoundLister.dom.audio.addEventListener('loadedmetadata', () => {
      SoundLister._displayAudioDuration()
      SoundLister._setSliderMax()
      SoundLister._displayBufferedAmount()
    })
  }

  // now attach <audio>, etc. listeners
  SoundLister.attachFunctionalListeners()

  // set env
  SoundLister.env = SL_ENV_PROD_URL.includes(document.location.hostname) ? 'prod' : 'local'

  // adjust <title> for env
  if (SoundLister.env == 'local') {
    document.title = '(LH) ' + document.title
  }
})()
