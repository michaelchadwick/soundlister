/* global MP3Tag */

// let songs = []
let audioDir = 'assets/audio'
let audioFormat = 'mp3'
let tags = {}
let index = 0
const playlistContainer = document.getElementById('amplitude-right')

// get ID3 tags from an MP3 buffer
function getID3Tags(buffer) {
  const mp3tag = new MP3Tag(buffer)

  mp3tag.read()

  return mp3tag.tags
}

// attach any additional event listeners
function attachEventListeners() {
  // console.log('attaching event listener for progress bar...')

  const progressBar = document.getElementsByClassName('amplitude-song-slider')[0]

  progressBar.addEventListener('click', function(event) {
    var offset = this.getBoundingClientRect()
    var x = event.pageX - offset.left
    var perc = (parseFloat(x) / parseFloat(this.offsetWidth)) * 100

    Amplitude.setSongPlayedPercentage(perc)
  });

  // console.log('progressBar', progressBar)
}

// add DOM element to playlist
function createPlaylistItem(song) {
  // console.log('adding song to Amplitude.js player...')
  // console.log('container to add songs to', playlistContainer)
  // console.log('song to make DOM element for', song)

  const divSongContainer = document.createElement('div')
  divSongContainer.classList.add('song', 'amplitude-song-container', 'amplitude-play-pause')
  divSongContainer.dataset.amplitudeSongIndex = index

    const divNowPlaying = document.createElement('div')
    divNowPlaying.classList.add('song-now-playing-icon-container')

      const divPlay = document.createElement('div')
      divPlay.classList.add('play-button-container')

      const imgNowPlaying = document.createElement('img')
      imgNowPlaying.classList.add('now-playing')
      imgNowPlaying.src = "assets/images/vendor/amplitudejs/blue-player/now-playing.svg"

      divNowPlaying.appendChild(divPlay)
      divNowPlaying.appendChild(imgNowPlaying)

    divSongContainer.appendChild(divNowPlaying)

    const divSongMeta = document.createElement('div')
    divSongMeta.classList.add('song-meta-data')

      const spanName = document.createElement('span')
      spanName.classList.add('song-title')
      spanName.innerHTML = song.name

      const spanArtist = document.createElement('span')
      spanArtist.classList.add('song-artist')
      spanArtist.innerHTML = song.artist

      const spanAlbum = document.createElement('span')
      spanAlbum.classList.add('song-album')
      spanAlbum.innerHTML = song.album

      divSongMeta.appendChild(spanName)
      divSongMeta.appendChild(spanArtist)
      divSongMeta.appendChild(spanAlbum)

    divSongContainer.appendChild(divSongMeta)

    const spanDuration = document.createElement('span')
    spanDuration.classList.add('song-duration')

  divSongContainer.appendChild(spanDuration)

  playlistContainer.appendChild(divSongContainer)

  Amplitude.bindNewElements()
}

// convert filename to a title, if needed
function filenameToTitle(filename) {
  let t = filename.replaceAll('-', ' ').replaceAll(/^[0-9]+/g, '')
  let t_split = t.split(' ')

  for (var i = 0; i < t_split.length; i++) {
    t_split[i] = t_split[i].charAt(0).toUpperCase() + t_split[i].slice(1);
  }

  return t_split.join(' ')
}

function readFileAsync(file) {
  return new Promise((resolve, reject) => {
    let reader = new FileReader()

    reader.onload = function() {
      resolve(reader.result)
    }

    reader.onloadend = function() {
      // console.log('song finished loading')
    }

    reader.readAsArrayBuffer(file)
  })
}

// fill songs object[] with JSON
async function fillSongs(titles) {
  const songArr = []

  // put all file information into 'songs' object[]
  for (const f in titles) {
    const filePath = `${audioDir}/${titles[f]}.${audioFormat}`
    const response = await fetch(filePath)
    const data = await response.blob()

    // when FileReader loads, read ID3 tags from file via MP3Tag
    // if found, use; otherwise use defaults
    const buffer = await readFileAsync(data)
    tags = await getID3Tags(buffer)

    // console.log('tags', titles[f], tags)

    const defaultTitle = filenameToTitle(titles[f])
    const defaultArtist = 'Unknown Artist'
    const defaultAlbum = 'Unknown Album'
    const defaultArt = 'assets/images/sound_wave-600x420.jpg'

    const newSong = {
      "name": tags.title || defaultTitle,
      "artist": tags.artist || defaultArtist,
      "album": tags.album || defaultAlbum,
      "url": filePath,
      "cover_art_url": defaultArt
    }

    songArr.push(newSong)

    createPlaylistItem(newSong)

    index++
  }

  return songArr
}

// use PHP script to scan audio directory
// return titles of files
async function getFiles() {
  // get filenames in directory
  let fileList = await fetch('./assets/dir.php')

  // console.log('fileList', fileList)

  let titlesArray = await fileList.text()

  // console.log('titlesArray', titlesArray)

  let titlesJSON = JSON.parse(titlesArray)

  // console.log('titlesJSON', titlesJSON)

  return titlesJSON
}

function addSongDurations(songs) {
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
      document.querySelectorAll('.song-duration')[index].innerHTML = `${minutes}:${seconds > 10 ? seconds : '0' + seconds}`;
    });
  });
}

(async() => {
  const titles = await getFiles()
  const songs = await fillSongs(titles)

  Amplitude.init({ 'debug': false, 'songs': songs })

  attachEventListeners()

  addSongDurations(songs)
})()
