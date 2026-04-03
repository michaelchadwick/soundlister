/* misc UI update functions */
/* global SoundLister, SL_DEFAULT_COLLECTION */

// update loading progress bar visual as audio is loaded
SoundLister._updateProgressBar = (percent, title, cur, total) => {
  if (percent >= 0 && percent <= 100) {
    SoundLister.dom.progressText.innerHTML = `<span>loading </span><span><strong>${title}</strong></span><span> (${cur}/${total})</span>`
    SoundLister.dom.progressBar.style.width = percent + '%'

    // SoundLister.dom.progressBar.innerHTML = `<span>loading </span><span><strong>${title}</strong></span><span> (${cur}/${total})</span>`
    // SoundLister.dom.progressBar.style.width = percent + '%'
  }
}

// set <title>
SoundLister._setHtmlTitle = () => {
  let title = SoundLister.env == 'local' ? '(LH) ' : ''

  title += SoundLister.activeTrack != '' ? SoundLister.activeTrack + ' | ' : ''

  if (SoundLister.coll !== SL_DEFAULT_COLLECTION) {
    title += SoundLister.coll.toUpperCase() + ' | '

    SoundLister.dom.collHeader.innerHTML = `<strong>${SoundLister.coll.toUpperCase()}</strong>.`

    SoundLister._updateQueryString(SoundLister.coll)
  } else {
    SoundLister.dom.collHeader.innerHTML = 'something.'
  }

  title += SoundLister.title

  document.title = title
}

// update playlist UI track count and total time
SoundLister._updatePlaylistInfo = (albumTrackCount, albumDuration) => {
  const albumDurationText = SoundLister.__calculateTime(albumDuration)

  SoundLister.dom.audioPlaylistInfo.innerHTML = `<strong>${albumTrackCount}</strong> tracks, <strong>${albumDurationText}</strong>`
}

// change max-height of playlist to match viewport
// TODO: playlist sometimes doesn't extend to bottom of viewport on iPhone
SoundLister._resizePlaylist = () => {
  const winHeight = window.innerHeight
  const winWidth = window.innerWidth

  let plHeight = 0

  if (winWidth >= 992) {
    plHeight = Math.floor(winHeight - 370)
  } else if (winWidth >= 768) {
    plHeight = Math.floor(winHeight - 310)
  } else {
    plHeight = Math.floor(winHeight - 250)
  }

  // console.log(`_resizePlaylist: winHeight(${winHeight}), plHeight(${plHeight})`)

  SoundLister.dom.playlist.style.height = `${plHeight}px`
}
