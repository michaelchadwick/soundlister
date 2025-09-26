/* dom */
/* global SoundLister */

SoundLister.dom = {}

SoundLister.dom.headerText = document.querySelector('header h1')
SoundLister.dom.logo = document.querySelector('#logo')

SoundLister.dom.audioPlayerContainer = document.getElementById('audio-player-container')
SoundLister.dom.audioPlaylistInfo = document.getElementById('audio-playlist-info')
SoundLister.dom.audio = document.querySelector('audio')
SoundLister.dom.currentTrackName = document.querySelector('#track-current-name span')
SoundLister.dom.currentAlbumArtistName = document.querySelector('#track-current-album-artist span')
SoundLister.dom.playButton = document.getElementById('play-icon')
SoundLister.dom.playButtonIcon = document.querySelector('#play-icon i')
SoundLister.dom.seekSlider = document.getElementById('seek-slider')
SoundLister.dom.volumeSlider = document.getElementById('volume-slider')
SoundLister.dom.prevButton = document.getElementById('backward')
SoundLister.dom.repeatButton = document.getElementById('repeat-mode')
SoundLister.dom.shuffleButton = document.getElementById('shuffle-mode')
SoundLister.dom.nextButton = document.getElementById('forward')
SoundLister.dom.collHeader = document.getElementById('coll-display')
SoundLister.dom.collContainer = document.querySelector('#collections')
SoundLister.dom.collDropdown = document.querySelector('#collections select')
// STUB:
// SoundLister.dom.collNative = document.querySelector('#collections select.selectNative')
// SoundLister.dom.collCustom = document.querySelector('#collections .selectCustom')
SoundLister.dom.loadMessage = document.getElementById('load-message')
SoundLister.dom.loadAnimation = document.getElementById('load-animation')
SoundLister.dom.progressContainer = document.querySelector('#progress-bar')
SoundLister.dom.progressText = document.querySelector('#progress-bar .progress__text')
SoundLister.dom.progressBar = document.querySelector('#progress-bar .progress__bar')
SoundLister.dom.playlist = document.getElementById('playlist')
