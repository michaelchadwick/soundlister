/* main */
/* global SoundLister, MP3Tag */

SoundLister.currentIndex = 0
SoundLister.tags = {}
SoundLister.index = 0
SoundLister.col = '_'
SoundLister.playIconState = 'play'
SoundLister.muteIconState = 'unmute'
SoundLister.raf = null

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
SoundLister.dom.nextButton = document.getElementById('forward')
SoundLister.dom.collections = document.querySelector('#collections select')
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
  // click/tap Next button
  SoundLister.dom.nextButton.addEventListener('click', (e) => SoundLister.goForward(e))

  // collection filter changes
  SoundLister.dom.collections.addEventListener('change', (e) => {
    // update SoundLister current collection
    SoundLister.col = e.target.value

    // remake playlist
    SoundLister._remakePlaylist()
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
    console.error('audio error', e)
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

  SoundLister.currentIndex = SoundLister.currentIndex === 0 ? len : SoundLister.currentIndex - 1

  SoundLister.changeTrack(SoundLister.currentIndex)
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

  SoundLister.currentIndex = SoundLister.currentIndex === len ? 0 : SoundLister.currentIndex + 1

  SoundLister.changeTrack(SoundLister.currentIndex)
}

// change the currently-playing track
SoundLister.changeTrack = (current) => {
  // console.log('changeTrack()', current)

  SoundLister.playTrack(SoundLister.tracks()[current])

  document.querySelector('#playlist a.active').scrollIntoView({
    'behavior': 'smooth',
    'block': 'end'
  })
}

// play currently-loaded track
SoundLister.playTrack = (track) => {
  // console.log('playTrack()', track)

  // change <audio> source
  SoundLister.dom.audio.src = track.getAttribute('href')

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

// change max-height of playlist to match viewport
SoundLister._resizePlaylist = () => {
  SoundLister.dom.playlist.style.maxHeight = `${window.innerHeight - 285}px`
}

// add song durations to playlist
SoundLister._getSongDurations = () => {
  // create audio elements - to read songs duration
  let audio_arr = [];

  SoundLister.tracks().forEach((song) => {
    const audio = document.createElement('audio')

    audio.src = song.href
    audio_arr.push(audio)
  })

  // get each song duration and put it in html element with '.song-duration' class name
  audio_arr.forEach((audio, index) => {
    audio.addEventListener('loadeddata', () => {
      const minutes = Math.floor(audio.duration / 60)
      const seconds = Math.floor(audio.duration % 60)

      document.querySelectorAll('.track-duration')[index].innerHTML = `${minutes}:${seconds >= 10 ? seconds : '0' + seconds}`
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
SoundLister._fillSongs = async (files) => {
  const songArr = []

  // put all file information into 'songs' object[]
  for (const col in files) {
    const dirPath = `./assets/audio/${col}`

    SoundLister.dom.collections.options.add(new Option(col, col))

    for (const index in files[col]) {
      const baseName = files[col][index]['basename']
      const filePath = `${dirPath}/${baseName}`
      const response = await fetch(filePath)
      const data = await response.blob()

      // when FileReader loads, read ID3 tags from file via MP3Tag
      // if found, use; otherwise use defaults
      const buffer = await SoundLister.__readFileAsync(data)
      const tags = await SoundLister._getID3Tags(buffer)

      const defaultTitle = SoundLister._filenameToTitle(baseName)
      const defaultArtist = 'Unknown Artist'
      const defaultAlbum = 'Unknown Album'

      const newSong = {
        "title": tags.title || defaultTitle,
        "artist": tags.artist || defaultArtist,
        "album": tags.album || defaultAlbum,
        "col": col,
        "url": filePath
      }

      songArr.push(newSong)

      SoundLister._createPlaylistItem(newSong)
    }
  }

  return songArr
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

// use PHP script to scan audio directory
// return titles of files
SoundLister._getFiles = async () => {
  let fileList = await fetch('./assets/dir.php')
  let titlesArray = await fileList.text()
  let titlesJSON = JSON.parse(titlesArray)

  return titlesJSON
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
      SoundLister.playIconState = 'play'
      SoundLister.dom.audio.src = SoundLister.tracks()[0]

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

/* ********************************* */
/* _private __helper functions       */
/* ********************************* */

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

/* ********************************* */
/* start the engine                  */
/* ********************************* */

;(async() => {
  // create SoundLister.files object array of file info
  SoundLister.fileObjArr = await SoundLister._getFiles()

  // create JSON object with title, artist, album, etc. of all songs
  SoundLister.songs = await SoundLister._fillSongs(SoundLister.fileObjArr)

  // hide loader gif once songs are loaded
  document.querySelector('.loader').style.display = 'none'

  SoundLister.attachPresentationListeners()

  // fill in durations after the fact
  SoundLister._getSongDurations()

  SoundLister.dom.currentTime = document.getElementById('time-current')
  SoundLister.dom.totalTime = document.getElementById('time-total')
  SoundLister.dom.outputVolume = document.getElementById('output-volume')

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

  SoundLister.attachFunctionalListeners()
})()
