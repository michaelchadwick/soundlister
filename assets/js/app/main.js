/* main */
/* global SoundLister, MP3Tag */
/* global SL_AUDIO_ASSETS_DIR, SL_DEFAULT_COLLECTION, SL_PHP_DIR_SCRIPT, SL_SERVICE_WORKER_PATH */

// TODO: playlist scroll not working correctly sometimes

SoundLister.activeTrack = ''
SoundLister.currentIndex = 0
SoundLister.tags = {}
SoundLister.index = 0
SoundLister.coll = SL_DEFAULT_COLLECTION
SoundLister.muteIconState = 'unmute'
SoundLister.raf = null
SoundLister.repeatMode = true // for now, only 2 modes
SoundLister.shuffleMode = false // for now, only 2 modes
SoundLister.title = 'SoundLister'

SoundLister.config = {}

SoundLister.registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register(SL_SERVICE_WORKER_PATH, {
        scope: '/',
      })

      SoundLister._logStatus('Service Worker registered', registration)

      if (registration.installing) {
        SoundLister._logStatus('Service worker installing')
      } else if (registration.waiting) {
        SoundLister._logStatus('Service worker installed')
      } else if (registration.active) {
        SoundLister._logStatus('Service worker active')
      }
    } catch (error) {
      console.error('Service Worker failed to register', error)
    }
  }
}

/* ********************************* */
/* public functions                  */
/* ********************************* */

// gets tracklist with potential collection filter
SoundLister.tracks = () => {
  let tracks = null

  if (SoundLister.coll !== SL_DEFAULT_COLLECTION) {
    tracks = document.querySelectorAll(`#playlist a[data-col=${SoundLister.coll}]`)

    SoundLister._updateCollDisplay()
  } else {
    tracks = document.querySelectorAll('#playlist a')
  }

  return tracks
}

// go back one track in the playlist
SoundLister.goBack = (e = null) => {
  // SoundLister._logStatus('goBack()')

  if (e) {
    e.preventDefault()
  }

  const len = SoundLister.tracks().length - 1

  if (!SoundLister.shuffleMode) {
    SoundLister.currentIndex = SoundLister.currentIndex === 0 ? len : SoundLister.currentIndex - 1

    SoundLister.changeTrack(SoundLister.currentIndex)
  }
  // TODO: add shuffle button
  // else {
  // }
}

// toggle repeat mode
SoundLister.toggleRepeatMode = () => {
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
SoundLister.toggleShuffleMode = () => {
  // default is off, so first check is turning it on
  if (!SoundLister.shuffleMode) {
    // dom updates
    // SoundLister.dom.shuffleButton.classList.remove('shuffle-none')
    // SoundLister.dom.shuffleButton.classList.add('shuffle-all')
    // // shuffle keys and add to queue
    // SoundLister.shuffleQueue = SoundLister.__shuffleArray(Object.keys(SoundLister.tracks()))
  } else {
    // dom updates
    SoundLister.dom.shuffleButton.classList.remove('shuffle-all')
    SoundLister.dom.shuffleButton.classList.add('shuffle-none')
  }

  SoundLister.shuffleMode = !SoundLister.shuffleMode
}

// go forward one track in the playlist
SoundLister.goForward = (e = null) => {
  // SoundLister._logStatus('goForward()')

  if (e) {
    e.preventDefault()

    // SoundLister._logStatus('manual change to next song')
  } else {
    // SoundLister._logStatus('song ended and changing to next one')
  }

  const len = SoundLister.tracks().length - 1

  if (!SoundLister.shuffleMode) {
    if (SoundLister.currentIndex === len) {
      SoundLister.currentIndex = 0

      if (SoundLister.repeatMode) {
        SoundLister.changeTrack(SoundLister.currentIndex)
      } else {
        SoundLister._updatePlayState()
      }
    } else {
      SoundLister.currentIndex = SoundLister.currentIndex + 1

      SoundLister.changeTrack(SoundLister.currentIndex)
    }
  } else {
    /* TODO: SHUFFLE */
  }
}

// change the currently-playing track
SoundLister.changeTrack = (current) => {
  SoundLister._logStatus(`changeTrack(${current})`, SoundLister.tracks()[current].title)

  // scroll new track into view
  const activeTrack = document.querySelector('#playlist a.active')
  activeTrack.scrollIntoView({ behavior: 'smooth', block: 'nearest' })

  // set <title>
  SoundLister.activeTrack = SoundLister.tracks()[current].title
  SoundLister._setHtmlTitle()

  // play track
  SoundLister.playTrack(SoundLister.tracks()[current])
}

// play currently-loaded track
SoundLister.playTrack = async (track) => {
  SoundLister._logStatus('playTrack()', track.href)

  // change <audio> source
  SoundLister.dom.audio.src = track.href

  // switch DOM's active track
  SoundLister.tracks().forEach((t) => t.classList.remove('active'))
  track.classList.add('active')

  // set <title>
  SoundLister.activeTrack = track.title
  SoundLister._setHtmlTitle()

  // play track
  SoundLister.dom.audio.play()

  SoundLister._updatePlayState('playlist')
}

/* ********************************* */
/* _private functions                */
/* ********************************* */

// remake playlist with collection filter
SoundLister._remakePlaylist = () => {
  // SoundLister._logStatus('_remakePlaylist()')

  // empty playlist
  SoundLister.dom.playlist.innerHTML = ''
  SoundLister.index = 0
  SoundLister.songsCol = []

  // remake playlist
  if (SoundLister.coll !== SL_DEFAULT_COLLECTION) {
    SoundLister.songsBase.forEach((song) => {
      if (song.col == SoundLister.coll) {
        SoundLister.songsCol.push(song)
        SoundLister._createPlaylistItem(song)
      }
    })

    if (SoundLister.songsCol.length) {
      SoundLister.songs = SoundLister.songsCol
    }
  } else {
    SoundLister.songsBase.forEach((song) => {
      SoundLister._createPlaylistItem(song)
    })

    SoundLister.songs = SoundLister.songsBase
  }

  // update new playlist song durations
  SoundLister._getSongDurations()

  SoundLister.dom.currentTime.textContent = SoundLister.__calculateTime(0)
  SoundLister.dom.seekSlider.value = 0
  SoundLister.dom.audioPlayerContainer.style.setProperty('--seek-before-width', 0)

  SoundLister._updatePlayState('collection')
}

// add song durations to playlist
SoundLister._getSongDurations = () => {
  // create audio elements - to read songs duration
  let audio_arr = []

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
        document.querySelectorAll('.track-duration')[index].innerHTML = `${minutes}:${
          seconds >= 10 ? seconds : '0' + seconds
        }`
      }
    })
  })
}

// use mp3tag to read ID3 tags from files
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

  const timestamp = new Date(song.updated)
  const year = timestamp.getFullYear()
  const month = (timestamp.getMonth() + 1).toString().padStart(2, '0')
  const day = timestamp.getDate().toString().padStart(2, '0')
  const hours =
    timestamp.getHours() > 12
      ? (timestamp.getHours() - 12).toString().padStart(2, '0')
      : timestamp.getHours().toString().padStart(2, '0')
  const mins = timestamp.getMinutes().toString().padStart(2, '0')
  const ampm = timestamp.getHours() >= 12 ? 'PM' : 'AM'

  let trackUpdated = `${year}/${month}/${day} ${hours}:${mins}${ampm}`

  track.setAttribute('title', song.title)
  track.setAttribute('alt', song.title)
  track.dataset.index = SoundLister.index
  track.dataset.col = song.col
  track.dataset.updated = trackUpdated
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

  const trackMetaInfo = document.createElement('div')
  trackMetaInfo.classList.add('track-attribute', 'track-meta-info')
  trackMetaInfo.innerHTML = `
    updated: ${trackUpdated}
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
  SoundLister.dom.playlist.appendChild(trackMetaInfo)

  SoundLister.index++
}

// fill songs object[] with JSON
SoundLister._fillSongsObj = async (fileColObj) => {
  const songObjArr = []
  let fileIndex = 1

  let fileCount = SoundLister.__getFileCount(fileColObj)

  // put all file information into 'songs' object[]
  for (const col in fileColObj) {
    for (const index in fileColObj[col]) {
      const baseName = fileColObj[col][index]['basename'] // music.mp3
      const duration = fileColObj[col][index]['duration'] // 3:12
      const ext = fileColObj[col][index]['extension'] // mp3
      const subdirs = fileColObj[col][index]['subdirPath'] // [/subdir]
      const ms = fileColObj[col][index]['ms'] // 300
      const updated = fileColObj[col][index]['updated'] // Fri May 9 13:48:41 PDT 2025
      let filePath = ''
      if (subdirs == col) {
        filePath = `${SL_AUDIO_ASSETS_DIR}/${subdirs}/${baseName}`
      } else {
        filePath = `${SL_AUDIO_ASSETS_DIR}/${subdirs}/${col}/${baseName}`
      }

      // get audio blob data from file
      const data = await SoundLister.__getData(filePath)

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
        title: songTitle,
        artist: songArtist,
        album: songAlbum,
        updated: updated,
        ms: ms,
        duration: duration,
        col: col,
        url: filePath,
        ext: ext,
      }

      songObjArr.push(newSong)

      const percentDone = (fileIndex / fileCount) * 100

      SoundLister._updateProgressBar(percentDone, songTitle, fileIndex, fileCount)

      fileIndex += 1
    }
  }

  return SoundLister.__sortObjArr(songObjArr, ['url'])
}

// use PHP script to scan audio directory
// return titles of files
SoundLister._getFiles = async () => {
  const fileList = await fetch(SL_PHP_DIR_SCRIPT)
  const titlesArray = await fileList.text()
  let titlesJSON = null

  if (titlesArray.length) {
    titlesJSON = JSON.parse(titlesArray)

    // initiate the collection dropdown if more than one collection
    if (Object.keys(titlesJSON).length > 1) {
      Object.keys(titlesJSON).forEach((col) => SoundLister._addCollectionOption(col))
    } else {
      SoundLister._removeCollDropdown(titlesJSON[0])
    }

    // check querystring for ?col|coll|collection= to filter dropdown
    SoundLister._loadQSCollection()

    if (SoundLister.coll !== SL_DEFAULT_COLLECTION) {
      titlesJSON = Object.keys(titlesJSON)
        .filter((key) => key.includes(SoundLister.coll))
        .reduce((cur, key) => {
          return Object.assign(cur, { [key]: titlesJSON[key] })
        }, {})
    }
  } else {
    titlesJSON = {}
  }

  if (Object.keys(titlesJSON).length == 1) {
    SoundLister._updateCollDisplay(Object.keys(titlesJSON)[0])
  }

  return titlesJSON
}

// change play/pause icon and audio element depending on context
SoundLister._updatePlayState = (source = null) => {
  switch (source) {
    // clicking in the audio playlist auto-starts track
    // and sets play/pause icon to 'pause'
    case 'playlist':
      // start the audio scrubbing bar updating so refreshes every second
      requestAnimationFrame(SoundLister._whilePlaying)

      // change play/pause icon to 'pause'
      SoundLister.dom.playButtonIcon.classList.remove('fa-play')
      SoundLister.dom.playButtonIcon.classList.add('fa-pause')

      break

    // clicking on the collection dropdown auto-stops track
    // and sets play/pause icon to 'play'
    case 'collection':
      // stop updating the audio scrubber bar refresh
      cancelAnimationFrame(SoundLister.raf)

      // load first track in collection
      SoundLister.dom.audio.src = SoundLister.tracks()[0].href

      // change play/pause icon to 'play'
      SoundLister.dom.playButtonIcon.classList.remove('fa-pause')
      SoundLister.dom.playButtonIcon.classList.add('fa-play')

      break

    // clicking directly on the play/pause icon
    // or using the space or next/prev keys
    case 'click':
    case 'key':
      if (SoundLister.dom.audio.paused) {
        SoundLister.dom.audio.play()

        // start the audio scrubbing bar updating so refreshes every second
        requestAnimationFrame(SoundLister._whilePlaying)

        // change play/pause icon to 'play'
        SoundLister.dom.playButtonIcon.classList.remove('fa-pause')
        SoundLister.dom.playButtonIcon.classList.add('fa-play')
      } else {
        SoundLister.dom.audio.pause()

        // stop updating the audio scrubber bar refresh
        cancelAnimationFrame(SoundLister.raf)

        // change play/pause icon to 'pause'
        SoundLister.dom.playButtonIcon.classList.remove('fa-play')
        SoundLister.dom.playButtonIcon.classList.add('fa-pause')
      }

      break

    // audio play/pause events
    default:
      if (SoundLister.dom.audio.paused) {
        // change play/pause icon to 'play'
        SoundLister.dom.playButtonIcon.classList.remove('fa-pause')
        SoundLister.dom.playButtonIcon.classList.add('fa-play')
      } else {
        // change play/pause icon to 'pause'
        SoundLister.dom.playButtonIcon.classList.remove('fa-play')
        SoundLister.dom.playButtonIcon.classList.add('fa-pause')
      }

      break
  }
}

SoundLister._displayBufferedAmount = (msg = null) => {
  const bufferedLength = SoundLister.dom.audio.buffered.length - 1

  if (bufferedLength >= 0) {
    const bufferedAmount = Math.floor(SoundLister.dom.audio.buffered.end(bufferedLength))

    SoundLister._logStatus(
      'bufferedAmount',
      `${bufferedAmount} / ${SoundLister.dom.seekSlider.max}: ${msg}`
    )

    SoundLister.dom.audioPlayerContainer.style.setProperty(
      '--buffered-width',
      `${(bufferedAmount / SoundLister.dom.seekSlider.max) * 100}%`
    )
  }
}

SoundLister._displayAudioDuration = () => {
  const duration = SoundLister.__calculateTime(SoundLister.dom.audio.duration)

  SoundLister.dom.totalTime.textContent = duration
}

SoundLister._displayCurrentTrackName = () => {
  const curTrackTitle = SoundLister.songs[SoundLister.currentIndex].title
  const curAlbumTitle = SoundLister.songs[SoundLister.currentIndex].album
  const curArtistTitle = SoundLister.songs[SoundLister.currentIndex].artist

  SoundLister.dom.currentTrackName.textContent = curTrackTitle
  SoundLister.dom.currentTrackName.setAttribute('title', curTrackTitle)
  SoundLister.dom.currentAlbumArtistName.innerHTML = `<strong>${curArtistTitle}</strong> - <strong>${curAlbumTitle}</strong>`
  SoundLister.dom.currentAlbumArtistName.setAttribute(
    'title',
    `by ${curArtistTitle} on ${curAlbumTitle}`
  )

  const titleTextHeight = SoundLister.dom.currentTrackName.getBoundingClientRect().height
  const titleTextContainerHeight = document
    .querySelector('#track-current-name')
    .parentElement.getBoundingClientRect().height

  if (titleTextHeight > titleTextContainerHeight) {
    document.querySelector('#track-current-name').classList.remove('short')
    document.querySelector('#track-current-name').parentElement.style.display = '-webkit-box'
  } else {
    document.querySelector('#track-current-name').classList.add('short')
    document.querySelector('#track-current-name').parentElement.style.display = 'flex'
  }
}

SoundLister._setSliderMax = () => {
  const duration = Math.floor(SoundLister.dom.audio.duration)

  SoundLister.dom.seekSlider.max = duration
}

SoundLister._showRangeProgress = (rangeInput) => {
  const newValNum = (rangeInput.value / rangeInput.max) * 100
  const newVal = newValNum + '%'

  if (rangeInput === SoundLister.dom.seekSlider) {
    SoundLister.dom.audioPlayerContainer.style.setProperty('--seek-before-width', newVal)
  } else {
    SoundLister.dom.audioPlayerContainer.style.setProperty('--volume-before-width', newVal)
  }
}

SoundLister._whilePlaying = () => {
  SoundLister.dom.seekSlider.value = Math.floor(SoundLister.dom.audio.currentTime)
  SoundLister.dom.currentTime.textContent = SoundLister.__calculateTime(
    SoundLister.dom.seekSlider.value
  )

  SoundLister.dom.audioPlayerContainer.style.setProperty(
    '--seek-before-width',
    `${(SoundLister.dom.seekSlider.value / SoundLister.dom.seekSlider.max) * 100}%`
  )

  SoundLister.raf = requestAnimationFrame(SoundLister._whilePlaying)
}

/* ********************************* */
/* start the engine                  */
/* ********************************* */
;(async () => {
  // adjust <title> for env
  if (SoundLister.env == 'local') {
    SoundLister._setHtmlTitle()
  }

  // try to customize theme if `custom.json` is present
  SoundLister._setCustomTheme()

  // create fileObjArr object array of file info
  const fileObjArr = await SoundLister._getFiles()

  // if we have audio, build playlist
  if (Object.keys(fileObjArr).length) {
    // create SoundLister.songsBase JSON object
    // use title, artist, etc. of all songs
    SoundLister.songsBase = await SoundLister._fillSongsObj(fileObjArr)

    // set array of objects for reference during usage
    SoundLister.songs = SoundLister.songsBase

    // create playlist from SoundLister.songs
    SoundLister.dom.playlist.textContent = ''

    let album = null
    let albumTrackCount = 0
    let albumDuration = 0

    Object.values(SoundLister.songs).forEach((song) => {
      let songAlbum = song.album

      if (songAlbum != album) {
        const hr = document.createElement('hr')
        hr.classList.add('album-separator')

        SoundLister.dom.playlist.appendChild(hr)

        album = songAlbum
      }

      albumTrackCount++
      albumDuration += song.ms / 1000
      SoundLister._createPlaylistItem(song)
    })

    // SoundLister.dom.loadMessage.classList.remove('loading')

    // hide loading info once songs are loaded
    SoundLister.dom.progressText.innerHTML = '<span>loading done!</span>'

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
    SoundLister._updatePlaylistInfo(albumTrackCount, albumDuration)

    // if <audio> is loaded and ready, then get its duration and such
    if (SoundLister.dom.audio.readyState == 4) {
      SoundLister._displayAudioDuration()
      SoundLister._displayCurrentTrackName()
      SoundLister._setSliderMax()
      // SoundLister._displayBufferedAmount('ready');
    }
    // otherwise, set an event listener for metadata loading completion
    else {
      SoundLister.dom.audio.addEventListener('loadeddata', () => {
        // SoundLister._displayBufferedAmount('loadeddata');
      })
      SoundLister.dom.audio.addEventListener('loadedmetadata', () => {
        SoundLister._displayAudioDuration()
        SoundLister._displayCurrentTrackName()
        SoundLister._setSliderMax()
        // SoundLister._displayBufferedAmount('loadedmetadata');

        SoundLister.activeTrack = SoundLister.tracks()[0].title
      })
    }

    // now attach <audio>, etc. listeners
    SoundLister.attachFunctionalListeners()
  }
  // if no audio, then disable everything
  else {
    SoundLister.dom.progressContainer.style.display = 'none'

    SoundLister.dom.playButton.disabled = 'true'
    SoundLister.dom.seekSlider.disabled = 'true'
    SoundLister.dom.volumeSlider.disabled = 'true'
    SoundLister.dom.prevButton.disabled = 'true'
    SoundLister.dom.repeatButton.disabled = 'true'
    SoundLister.dom.nextButton.disabled = 'true'

    SoundLister.dom.playlist.classList.add('no-audio-found')
    SoundLister.dom.playlist.innerHTML =
      '<p>No audio files found. Try adding some to <code>/assets/audio</code>!</p>'

    SoundLister.dom.collDropdown.disabled = 'true'

    console.error('No audio files found.')
  }

  // create Service Worker
  SoundLister.registerServiceWorker()
})()
