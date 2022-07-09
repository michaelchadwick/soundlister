/* global SoundLister, MP3Tag */

const audioDir = 'assets/audio'

SoundLister.current = 0
SoundLister.player = document.getElementsByTagName('audio')[0]
SoundLister.playerButtons = document.getElementById('audio-controls')
SoundLister.backward = document.getElementById('backward')
SoundLister.forward = document.getElementById('forward')
SoundLister.playlist = document.getElementById('playlist')
SoundLister.track = null
SoundLister.audioDir = 'assets/audio'
SoundLister.tags = {}
SoundLister.index = 0

// set initial volume
SoundLister.player.volume = 1.0

/* ********************************* */
/* public functions                  */
/* ********************************* */

SoundLister.goBack = function(e) {
  e.preventDefault()

  const len = document.querySelectorAll('#playlist li').length - 1

  SoundLister.current = SoundLister.current === 0 ? len : SoundLister.current - 1

  SoundLister.changeTrack(SoundLister.current)
}

SoundLister.goForward = function(e = null) {
  if (e) {
    e.preventDefault()

    // console.log('manual change to next song')
  } else {
    // console.log('song ended and changing to next one')
  }

  const len = document.querySelectorAll('#playlist li').length - 1

  SoundLister.current = SoundLister.current === len ? 0 : SoundLister.current + 1

  SoundLister.changeTrack(SoundLister.current)
}

SoundLister.changeTrack = function(current) {
  // console.log('changing track...')

  const tracks = document.querySelectorAll('#playlist li')

  SoundLister.play(tracks[current].querySelectorAll('a')[0])
}

SoundLister.play = function(track) {
  // change <audio> source
  SoundLister.player.src = track.getAttribute('href')

  // switch active track
  document.querySelectorAll('#playlist li').forEach(t => t.classList.remove('active'))
  track.parentNode.classList.add('active')

  // load and play song
  SoundLister.player.load()
  // SoundLister.player.play()
}

SoundLister.attachEventListeners = function() {
  // click/tap audio track on playlist
  SoundLister.playlist.addEventListener('click', (e) => {
    e.preventDefault()

    track = e.target

    // if we "miss" the correct position to click, bubble up to the a
    if (track.classList.contains('track-attribute')) {
      track = track.closest('a')
    }

    SoundLister.current = parseInt(track.dataset.index)

    SoundLister.play(track)
  })
  // click/tap Prev button
  SoundLister.backward.addEventListener('click', (e) => SoundLister.goBack(e))
  // click/tap Next button
  SoundLister.forward.addEventListener('click', (e) => SoundLister.goForward(e))

  // audio has started loading
  SoundLister.player.addEventListener('loadstart', (e) => {
    // console.log('audio loading begun', e)
  })
  // audio is loaded enough to start playing
  SoundLister.player.addEventListener('canplay', (e) => {
    // console.log('audio can play', e)
  })
  // audio is loaded enough to play to end
  SoundLister.player.addEventListener('canplaythrough', (e) => {
    // console.log('audio can play through', e)
    SoundLister.player.play()
  })
  // audio has started playing
  SoundLister.player.addEventListener('play', (e) => {
    // console.log('audio has started playing', e)
  })
  // audio is playing
  SoundLister.player.addEventListener('playing', (e) => {
    // console.log('audio is playing', e)
  })
  // audio has been paused
  SoundLister.player.addEventListener('paused', (e) => {
    // console.log('audio has been paused', e)
  })
  // audio ended
  SoundLister.player.addEventListener('ended', (e) => {
    // console.log('audio ended', e)
    SoundLister.goForward()
  })
  // error occurs
  SoundLister.player.addEventListener('error', (e) => {
    console.error('audio error', e)
  })
}

/* ********************************* */
/* _private functions                */
/* ********************************* */

SoundLister._getSongDurations = function(songs) {
  // create audio elements - to read songs duration
  let audio_arr = [];

  songs.forEach((song) => {
    const audio = document.createElement('audio');

    audio.src = song.url;
    audio_arr.push(audio)
  });

  // get each song duration and put it in html element with '.song-duration' class name
  audio_arr.forEach((audio, index) => {
    audio.addEventListener('loadeddata', () => {
      const minutes = Math.floor(audio.duration / 60);
      const seconds = Math.floor(audio.duration % 60);

      document.querySelectorAll('.track-duration')[index].innerHTML = `${minutes}:${seconds > 10 ? seconds : '0' + seconds}`;
    });
  });
}

SoundLister._getID3Tags = function(buffer) {
  const mp3tag = new MP3Tag(buffer)

  mp3tag.read()

  return mp3tag.tags
}

// add DOM element to playlist
SoundLister._createPlaylistItem = function(song) {
  const track = document.createElement('li')

  if (SoundLister.index == 0) {
    track.classList.add('active')
    SoundLister.player.setAttribute('src', song.url)
  }

    const trackLink = document.createElement('a')
    trackLink.setAttribute('title', song.title)
    trackLink.setAttribute('alt', song.title)
    trackLink.dataset.index = SoundLister.index
    trackLink.href = song.url

      const trackNum = document.createElement('label')
      trackNum.classList.add('track-attribute', 'track-num')
      trackNum.innerHTML = SoundLister.index + 1

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

      trackLink.append(trackNum)
      trackLink.append(trackTitles)
      trackLink.append(trackDuration)

    track.append(trackLink)

  SoundLister.playlist.appendChild(track)
}

// convert filename to a title, if needed
SoundLister._filenameToTitle = function(filename) {
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

SoundLister._readFileAsync = function(file) {
  return new Promise((resolve, reject) => {
    let reader = new FileReader()

    reader.onload = function() {
      resolve(reader.result)
    }

    reader.onloadend = function() {
      // console.log('file finished loading')
    }

    reader.readAsArrayBuffer(file)
  })
}

// fill songs object[] with JSON
SoundLister._fillSongs = async function(titles) {
  const songArr = []

  // put all file information into 'songs' object[]
  for (const f in titles) {
    const filePath = `${audioDir}/${titles[f]}`
    const response = await fetch(filePath)
    const data = await response.blob()

    // when FileReader loads, read ID3 tags from file via MP3Tag
    // if found, use; otherwise use defaults
    const buffer = await SoundLister._readFileAsync(data)
    tags = await SoundLister._getID3Tags(buffer)

    const defaultTitle = SoundLister._filenameToTitle(titles[f])
    const defaultArtist = 'Unknown Artist'
    const defaultAlbum = 'Unknown Album'

    const newSong = {
      "title": tags.title || defaultTitle,
      "artist": tags.artist || defaultArtist,
      "album": tags.album || defaultAlbum,
      "url": filePath
    }

    songArr.push(newSong)

    SoundLister._createPlaylistItem(newSong)

    SoundLister.index++
  }

  return songArr
}

// use PHP script to scan audio directory
// return titles of files
SoundLister._getFiles = async function() {
  let fileList = await fetch('./assets/dir.php')
  let titlesArray = await fileList.text()
  let titlesJSON = JSON.parse(titlesArray)

  return titlesJSON
}

SoundLister._fixBrowserIssues = function() {
  // if Chrome, change player and button colors
  if (navigator.userAgent.includes('Chrome')) {
    SoundLister.player.classList.add('chrome')
    SoundLister.playerButtons.classList.add('chrome')
  }
  // if it's Safari, the default <audio> player needs to be wider
  else if (navigator.userAgent.includes('Safari')) {
    SoundLister.player.classList.add('safari')
    SoundLister.playerButtons.classList.add('safari')
  }
};

(async() => {
  // create array of file names, e.g. ['song1.mp3', 'song2.mp3'...'songN.mp3']
  const titles = await SoundLister._getFiles()

  // create JSON object with title, artist, album, etc. of all songs
  const songs = await SoundLister._fillSongs(titles)

  // hide loader gif once songs are loaded
  document.querySelector('.loader').style.display = 'none'

  // attach all our event listeners once songs are loaded
  SoundLister.attachEventListeners()

  // fill in durations after the fact
  // SoundLister._getSongDurations(songs)
  // add new m3u playlist to <audio>
  // SoundLister.player.querySelector('source')
  //   .setAttribute('src', './assets/audio/playlist.m3u')
  // SoundLister.player.querySelector('source')
  //   .setAttribute('type', 'audio/mp3')

  // browser inconsistencies in UI need fixing
  SoundLister._fixBrowserIssues()
})()