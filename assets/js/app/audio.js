/* audio */
/* custom <audio> player functions and properties */
/* global SoundLister */

/* global SoundLister, MP3Tag */

SoundLister.playIconState = 'play'
SoundLister.muteIconState = 'unmute'
SoundLister.audioDir = 'assets/audio'

SoundLister.dom = {}
SoundLister.dom.audioPlayerContainer = document.getElementById('audio-player-container')
SoundLister.dom.playButton = document.getElementById('play-icon')
SoundLister.dom.playButtonIcon = document.querySelector('#play-icon i')
SoundLister.dom.seekSlider = document.getElementById('seek-slider')
SoundLister.dom.volumeSlider = document.getElementById('volume-slider')
SoundLister.dom.muteButton = document.getElementById('mute-icon')
SoundLister.dom.muteButtonIcon = document.querySelector('#mute-icon i')

/* ********************************* */
/* public functions                  */
/* ********************************* */

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
}

SoundLister.attachFunctionalListeners = () => {
  // <audio> element
  SoundLister.dom.audio.addEventListener('progress', SoundLister._displayBufferedAmount)

  // audio seek slider
  SoundLister.dom.seekSlider.addEventListener('input', () => {
    SoundLister.dom.currentTime.textContent = SoundLister._calculateTime(SoundLister.dom.seekSlider.value);

    if (!SoundLister.dom.audio.paused) {
      cancelAnimationFrame(SoundLister.raf)
    }
  })
  SoundLister.dom.seekSlider.addEventListener('change', () => {
    SoundLister.dom.audio.currentTime = SoundLister.dom.seekSlider.value

    if (!SoundLister.dom.audio.paused) {
      requestAnimationFrame(SoundLister._whilePlaying)
    }
  })

  // audio volume slider
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
}

/* ********************************* */
/* _private functions                */
/* ********************************* */

SoundLister._updatePlayButton = (playlist = false) => {
  if (playlist) {
    requestAnimationFrame(SoundLister._whilePlaying)
    SoundLister.playIconState = 'pause'

    if (SoundLister.dom.playButtonIcon.classList.contains('fa-play')) {
      SoundLister.dom.playButtonIcon.classList.remove('fa-play')

      if (!SoundLister.dom.playButtonIcon.classList.contains('fa-pause')) {
        SoundLister.dom.playButtonIcon.classList.add('fa-pause')
      }
    }
  } else {
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
  }
}

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

SoundLister._calculateTime = (secs) => {
  const minutes = Math.floor(secs / 60)
  const seconds = Math.floor(secs % 60)
  const returnedSeconds = seconds < 10 ? `0${seconds}` : `${seconds}`

  return `${minutes}:${returnedSeconds}`
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
  const duration = SoundLister._calculateTime(SoundLister.dom.audio.duration)

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
  SoundLister.dom.currentTime.textContent = SoundLister._calculateTime(SoundLister.dom.seekSlider.value)

  SoundLister.dom.audioPlayerContainer.style.setProperty(
    '--seek-before-width',
    `${SoundLister.dom.seekSlider.value / SoundLister.dom.seekSlider.max * 100}%`
  )

  SoundLister.raf = requestAnimationFrame(SoundLister._whilePlaying)
}

SoundLister.attachPresentationListeners()

SoundLister.dom.audio = document.querySelector('audio')
SoundLister.dom.currentTime = document.getElementById('time-current')
SoundLister.dom.totalTime = document.getElementById('time-total')
SoundLister.dom.outputVolume = document.getElementById('output-volume')
SoundLister.raf = null

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
