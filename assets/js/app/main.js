/* main */
/* global Proxy */
/* global SoundLister, MP3Tag */
/* global SL_AUDIO_ASSETS_DIR, SL_CACHE_TEXT_KEY, SL_DEFAULT_COLLECTION, SL_PHP_DIR_SCRIPT, SL_SERVICE_WORKER_PATH */

// TODO: playlist scroll not working correctly sometimes

SoundLister.activeTrack = '';
SoundLister.currentIndex = 0;
SoundLister.tags = {};
SoundLister.index = 0;
SoundLister.coll = SL_DEFAULT_COLLECTION;
SoundLister.playIconState = 'play';
SoundLister.muteIconState = 'unmute';
SoundLister.raf = null;
SoundLister.repeatMode = true; // for now, only 2 modes
SoundLister.shuffleMode = false; // for now, only 2 modes
SoundLister.title = 'SoundLister';

SoundLister.config = {};

/* ********************************* */
/* public functions                  */
/* ********************************* */

// attach DOM presentation event listeners
SoundLister.attachPresentationListeners = () => {
  // play/pause button
  SoundLister.dom.playButton.addEventListener('click', () => {
    SoundLister._updatePlayButton('click');
    SoundLister._setTitle();
  });

  // mute/unmute button
  SoundLister.dom.muteButton.addEventListener('click', () => {
    SoundLister._updateMuteButton();
  });

  // audio seek slider
  SoundLister.dom.seekSlider.addEventListener('input', (e) => {
    SoundLister._showRangeProgress(e.target);
  });

  // audio volume slider
  SoundLister.dom.volumeSlider.addEventListener('input', (e) => {
    SoundLister._showRangeProgress(e.target);
  });

  // click/tap Prev button
  SoundLister.dom.prevButton.addEventListener('click', (e) => SoundLister.goBack(e));
  // click/tap Repeat Mode button
  SoundLister.dom.repeatButton.addEventListener('click', (e) => SoundLister.toggleRepeatMode(e));
  // click/tap Shuffle Mode button
  SoundLister.dom.shuffleButton.addEventListener('click', (e) => SoundLister.toggleShuffleMode(e));
  // click/tap Next button
  SoundLister.dom.nextButton.addEventListener('click', (e) => SoundLister.goForward(e));

  // collection filter changes
  SoundLister.dom.collDropdown.addEventListener('change', (e) => {
    // update SoundLister current collection
    SoundLister.coll = e.target.value;

    // remake playlist
    SoundLister._remakePlaylist();

    // update browser UI
    SoundLister._updateCollDisplay();
  });

  // click/tap audio track on playlist
  SoundLister.dom.playlist.addEventListener('click', (e) => {
    e.preventDefault();

    let track = e.target;

    // if we "miss" the correct position to click, bubble up to the a
    if (track.classList.contains('track-attribute')) {
      track = track.closest('a');
    }

    SoundLister.currentIndex = parseInt(track.dataset.index);

    SoundLister.playTrack(track);

    SoundLister._updatePlayButton('playlist');
  });

  window.onresize = SoundLister._resizePlaylist;
};

// attach DOM functional event listeners
SoundLister.attachFunctionalListeners = () => {
  // <audio> element has started loading
  SoundLister.dom.audio.addEventListener('loadstart', () => {
    // SoundLister._logStatus('audio loading begun', e)
    SoundLister._displayBufferedAmount('loadstart');
  });
  // <audio> element is loaded enough to start playing
  SoundLister.dom.audio.addEventListener('canplay', () => {
    // SoundLister._logStatus('audio can play', e)
    SoundLister._displayAudioDuration();
    SoundLister._displayCurrentTrackName();
    SoundLister._setSliderMax();
    SoundLister._displayBufferedAmount('canplay');
  });
  // <audio> element is loaded enough to play to end
  SoundLister.dom.audio.addEventListener('canplaythrough', () => {
    // SoundLister._logStatus('audio can play through', e)
    SoundLister._displayBufferedAmount('canplaythrough');
  });
  // <audio> element has started playing
  SoundLister.dom.audio.addEventListener('play', () => {
    // SoundLister._logStatus('audio has started playing', e);
    SoundLister._displayBufferedAmount('play');
  });
  // <audio> element is playing
  SoundLister.dom.audio.addEventListener('playing', () => {
    // SoundLister._logStatus('audio is playing', e)
    SoundLister._displayBufferedAmount('playing');
  });
  // <audio> element has been paused
  SoundLister.dom.audio.addEventListener('pause', () => {
    // SoundLister._logStatus('audio has been paused', e)
    SoundLister._displayBufferedAmount('pause');
  });
  // <audio> element ended
  SoundLister.dom.audio.addEventListener('ended', () => {
    // SoundLister._logStatus('audio ended', e)
    SoundLister.goForward();
  });
  // <audio> element had an error occur
  SoundLister.dom.audio.addEventListener('error', (e) => {
    console.error('<audio> element error', e);
  });

  // <audio> element progress
  SoundLister.dom.audio.addEventListener('progress', () => {
    SoundLister._displayBufferedAmount('progress');
  });

  // <audio> element progress seek slider
  SoundLister.dom.seekSlider.addEventListener('input', () => {
    SoundLister.dom.currentTime.textContent = SoundLister.__calculateTime(
      SoundLister.dom.seekSlider.value,
    );

    if (!SoundLister.dom.audio.paused) {
      cancelAnimationFrame(SoundLister.raf);
    }
  });
  SoundLister.dom.seekSlider.addEventListener('change', () => {
    // SoundLister._logStatus('manually seeked through song')

    SoundLister.dom.audio.currentTime = SoundLister.dom.seekSlider.value;

    if (!SoundLister.dom.audio.paused) {
      requestAnimationFrame(SoundLister._whilePlaying);
      SoundLister.dom.audio.play();
    }
  });

  // <audio> element volume slider
  SoundLister.dom.volumeSlider.addEventListener('input', (e) => {
    const volume = e.target.value;

    if (parseInt(volume) > 0) {
      SoundLister.dom.muteButtonIcon.classList.remove('fa-volume-off');
      if (parseInt(volume) > 49) {
        SoundLister.dom.muteButtonIcon.classList.remove('fa-volume-low');
        SoundLister.dom.muteButtonIcon.classList.add('fa-volume-high');
      } else {
        SoundLister.dom.muteButtonIcon.classList.remove('fa-volume-high');
        SoundLister.dom.muteButtonIcon.classList.add('fa-volume-low');
      }
    } else {
      SoundLister.dom.muteButtonIcon.classList.remove('fa-volume-low');
      SoundLister.dom.muteButtonIcon.classList.remove('fa-volume-high');
      SoundLister.dom.muteButtonIcon.classList.add('fa-volume-off');
    }

    // SoundLister.dom.outputVolume.textContent = volume.padStart(3, '0')

    SoundLister.dom.audio.volume = volume / 100;
  });

  // gotta use keydown
  document.addEventListener('keydown', (event) => {
    if (event.code == 'Space') {
      // fix issue with double-triggering
      // if space bar is activeElement
      document.activeElement.blur();
      SoundLister._updatePlayButton('key');
    } else {
      if (event.metaKey && event.shiftKey && event.code == 'ArrowRight') {
        SoundLister.goForward();
      } else if (event.metaKey && event.shiftKey && event.code == 'ArrowLeft') {
        SoundLister.goBack();
      }
    }
  });

  document.addEventListener('keyup', () => {});
};

// gets tracklist with potential collection filter
SoundLister.tracks = () => {
  let tracks = null;

  if (SoundLister.coll !== SL_DEFAULT_COLLECTION) {
    tracks = document.querySelectorAll(`#playlist a[data-col=${SoundLister.coll}]`);

    SoundLister._updateCollDisplay();
  } else {
    tracks = document.querySelectorAll('#playlist a');
  }

  return tracks;
};

// go back one track in the playlist
SoundLister.goBack = (e = null) => {
  // SoundLister._logStatus('goBack()')

  if (e) {
    e.preventDefault();
  }

  const len = SoundLister.tracks().length - 1;

  if (!SoundLister.shuffleMode) {
    SoundLister.currentIndex = SoundLister.currentIndex === 0 ? len : SoundLister.currentIndex - 1;

    SoundLister.changeTrack(SoundLister.currentIndex);
  }
  // TODO: add shuffle button
  // else {
  // }
};

// toggle repeat mode
SoundLister.toggleRepeatMode = () => {
  if (SoundLister.repeatMode) {
    SoundLister.dom.repeatButton.classList.remove('repeat-all');
    SoundLister.dom.repeatButton.classList.add('repeat-none');
  } else {
    SoundLister.dom.repeatButton.classList.remove('repeat-none');
    SoundLister.dom.repeatButton.classList.add('repeat-all');
  }

  SoundLister.repeatMode = !SoundLister.repeatMode;
};

// toggle shuffle mode
SoundLister.toggleShuffleMode = () => {
  // default is off, so first check is turning it on
  if (!SoundLister.shuffleMode) {
    // dom updates
    // SoundLister.dom.shuffleButton.classList.remove('shuffle-none')
    // SoundLister.dom.shuffleButton.classList.add('shuffle-all')
    // // shuffle keys and add to queue
    // SoundLister.shuffleQueue = SoundLister._shuffleArray(Object.keys(SoundLister.tracks()))
  } else {
    // dom updates
    SoundLister.dom.shuffleButton.classList.remove('shuffle-all');
    SoundLister.dom.shuffleButton.classList.add('shuffle-none');
  }

  SoundLister.shuffleMode = !SoundLister.shuffleMode;
};

// go forward one track in the playlist
SoundLister.goForward = (e = null) => {
  // SoundLister._logStatus('goForward()')

  if (e) {
    e.preventDefault();

    // SoundLister._logStatus('manual change to next song')
  } else {
    // SoundLister._logStatus('song ended and changing to next one')
  }

  const len = SoundLister.tracks().length - 1;

  if (!SoundLister.shuffleMode) {
    if (SoundLister.currentIndex === len) {
      SoundLister.currentIndex = 0;

      if (SoundLister.repeatMode) {
        SoundLister.changeTrack(SoundLister.currentIndex);
      } else {
        SoundLister._updatePlayButton();
      }
    } else {
      SoundLister.currentIndex = SoundLister.currentIndex + 1;

      SoundLister.changeTrack(SoundLister.currentIndex);
    }
  } else {
    /* TODO: SHUFFLE */
  }
};

// change the currently-playing track
SoundLister.changeTrack = (current) => {
  SoundLister._logStatus(`changeTrack(${current})`, SoundLister.tracks()[current].title);

  // scroll new track into view
  const activeTrack = document.querySelector('#playlist a.active');
  activeTrack.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  // set <title>
  SoundLister.activeTrack = SoundLister.tracks()[current].title;
  SoundLister._setTitle();

  // play track
  SoundLister.playTrack(SoundLister.tracks()[current]);
};

// play currently-loaded track
SoundLister.playTrack = async (track) => {
  SoundLister._logStatus('playTrack()', track.href);

  // change <audio> source
  SoundLister.dom.audio.src = track.href;

  // switch DOM's active track
  SoundLister.tracks().forEach((t) => t.classList.remove('active'));
  track.classList.add('active');

  // set <title>
  SoundLister.activeTrack = track.title;
  SoundLister._setTitle();

  // play track
  SoundLister.dom.audio.play();

  SoundLister._updatePlayButton('playlist');
};

/* ********************************* */
/* _private functions                */
/* ********************************* */

SoundLister._setCustomIcon = (iconPath) => {
  var links = document.querySelectorAll("link[rel~='icon']");
  links.forEach((link) => {
    link.href = iconPath;
  });
};
SoundLister._setCustomLogo = (logoPath) => {
  SoundLister.dom.logo.src = logoPath;
};
SoundLister._setCustomHeader = (headerText) => {
  SoundLister.dom.headerText.innerHTML = headerText;
};
SoundLister._setCustomTitle = (titleText) => {
  SoundLister.title = titleText;
  SoundLister._setTitle();
};

SoundLister._setTitle = () => {
  let title = SoundLister.env == 'local' ? '(LH) ' : '';

  title += SoundLister.activeTrack != '' ? SoundLister.activeTrack + ' | ' : '';
  title += SoundLister.title;

  document.title = title;
};

// Fisher-Yates Shuffle
// https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
SoundLister._shuffleArray = (arr) => {
  let curIdx = arr.length,
    randIdx;

  // While there remain elements to shuffle.
  while (curIdx != 0) {
    // Pick a remaining element.
    randIdx = Math.floor(Math.random() * curIdx);
    curIdx--;

    // And swap it with the current element.
    [arr[curIdx], arr[randIdx]] = [arr[randIdx], arr[curIdx]];
  }

  return arr;
};

SoundLister._registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register(SL_SERVICE_WORKER_PATH, { scope: 'assets/js/app/' })
      .then((registration) => {
        SoundLister._logStatus('Service Worker registered', registration);

        if (registration.installing) {
          SoundLister._logStatus('Service worker installing');
        } else if (registration.waiting) {
          SoundLister._logStatus('Service worker installed');
        } else if (registration.active) {
          SoundLister._logStatus('Service worker active');
        }
      })
      .catch((err) => {
        console.error('Service Worker failed to register', err);
      });
  }
};

// change max-height of playlist to match viewport
// TODO: playlist sometimes doesn't extend to bottom of viewport on iPhone
SoundLister._resizePlaylist = () => {
  const winHeight = window.innerHeight;
  const winWidth = window.innerWidth;

  let plHeight = 0;

  if (winWidth >= 992) {
    plHeight = Math.floor(winHeight - 370);
  } else if (winWidth >= 768) {
    plHeight = Math.floor(winHeight - 310);
  } else {
    plHeight = Math.floor(winHeight - 250);
  }

  // console.log(`_resizePlaylist: winHeight(${winHeight}), plHeight(${plHeight})`)

  SoundLister.dom.playlist.style.height = `${plHeight}px`;
};

// remake playlist with collection filter
SoundLister._remakePlaylist = () => {
  // SoundLister._logStatus('_remakePlaylist()')

  // empty playlist
  SoundLister.dom.playlist.innerHTML = '';
  SoundLister.index = 0;
  SoundLister.songsCol = [];

  // remake playlist
  if (SoundLister.coll !== SL_DEFAULT_COLLECTION) {
    SoundLister.songsBase.forEach((song) => {
      if (song.col == SoundLister.coll) {
        SoundLister.songsCol.push(song);
        SoundLister._createPlaylistItem(song);
      }
    });

    if (SoundLister.songsCol.length) {
      SoundLister.songs = SoundLister.songsCol;
    }
  } else {
    SoundLister.songsBase.forEach((song) => {
      SoundLister._createPlaylistItem(song);
    });

    SoundLister.songs = SoundLister.songsBase;
  }

  // update new playlist song durations
  SoundLister._getSongDurations();

  SoundLister.dom.currentTime.textContent = SoundLister.__calculateTime(0);
  SoundLister.dom.seekSlider.value = 0;
  SoundLister.dom.audioPlayerContainer.style.setProperty('--seek-before-width', 0);

  SoundLister._updatePlayButton('collection');
};

// add song durations to playlist
SoundLister._getSongDurations = () => {
  // create audio elements - to read songs duration
  let audio_arr = [];

  SoundLister.tracks().forEach((track) => {
    const audio = document.createElement('audio');

    audio.src = track.href;
    audio_arr.push(audio);
  });

  // get each song duration and put it in html element with '.song-duration' class name
  audio_arr.forEach((audio, index) => {
    audio.addEventListener('loadeddata', () => {
      const minutes = Math.floor(audio.duration / 60);
      const seconds = Math.floor(audio.duration % 60);

      if (document.querySelectorAll('.track-duration')[index]) {
        document.querySelectorAll('.track-duration')[index].innerHTML =
          `${minutes}:${seconds >= 10 ? seconds : '0' + seconds}`;
      }
    });
  });
};

// use mp3tag to read ID3 tags from files
SoundLister._getID3Tags = (buffer) => {
  const mp3tag = new MP3Tag(buffer);

  mp3tag.read();

  return mp3tag.tags;
};

// add DOM element to playlist
SoundLister._createPlaylistItem = (song) => {
  const track = document.createElement('a');

  if (SoundLister.index == 0) {
    track.classList.add('active');
    SoundLister.dom.audio.setAttribute('src', song.url);
  }

  const timestamp = new Date(song.updated);
  const year = timestamp.getFullYear();
  const month = (timestamp.getMonth() + 1).toString().padStart(2, '0');
  const day = timestamp.getDate().toString().padStart(2, '0');
  const hours =
    timestamp.getHours() > 12
      ? (timestamp.getHours() - 12).toString().padStart(2, '0')
      : timestamp.getHours().toString().padStart(2, '0');
  const mins = timestamp.getMinutes().toString().padStart(2, '0');
  const ampm = timestamp.getHours() >= 12 ? 'PM' : 'AM';

  let trackUpdated = `${year}/${month}/${day} ${hours}:${mins}${ampm}`;

  track.setAttribute('title', song.title);
  track.setAttribute('alt', song.title);
  track.dataset.index = SoundLister.index;
  track.dataset.col = song.col;
  track.dataset.updated = trackUpdated;
  track.href = song.url;

  const trackNum = document.createElement('label');
  trackNum.classList.add('track-attribute', 'track-num');
  trackNum.innerHTML = (SoundLister.index + 1).toString().padStart(2, '0');

  const trackTitles = document.createElement('div');
  trackTitles.classList.add('track-attribute', 'titles');

  const trackName = document.createElement('div');
  trackName.classList.add('track-attribute', 'track-name');
  trackName.innerHTML = song.title;

  const trackArtistAlbum = document.createElement('div');
  trackArtistAlbum.classList.add('track-attribute', 'track-artist-album');
  trackArtistAlbum.innerHTML = `
    by <span class='track-attribute highlight'>${song.artist}</span> on <span class='track-attribute highlight'>${song.album}</span>
  `;

  const trackMetaInfo = document.createElement('div');
  trackMetaInfo.classList.add('track-attribute', 'track-meta-info');
  trackMetaInfo.innerHTML = `
    updated: ${trackUpdated}
  `;

  trackTitles.append(trackName);
  trackTitles.append(trackArtistAlbum);

  const trackDuration = document.createElement('div');
  trackDuration.classList.add('track-attribute', 'track-duration');
  trackDuration.innerHTML = song.duration;

  track.append(trackNum);
  track.append(trackTitles);
  track.append(trackDuration);

  SoundLister.dom.playlist.appendChild(track);
  SoundLister.dom.playlist.appendChild(trackMetaInfo);

  SoundLister.index++;
};

// convert filename to a title, if needed
SoundLister._filenameToTitle = (filename) => {
  let title;
  // change '-' to ' '
  title = filename.replaceAll('-', ' ');
  // remove track numbers
  // e.g. 0 Track, 11 Track, 115 Track, 4-Track, 05-Track, 043-Track
  title = title.replaceAll(/^([0-9]{1,3}[\s-]+)/g, '');
  // remove file extension
  title = title.replaceAll(/\.{1}[a-zA-Z0-9]{3,4}$/g, '');

  let t_split = title.split(' ');

  // uppercase first letter in title
  for (var i = 0; i < t_split.length; i++) {
    t_split[i] = t_split[i].charAt(0).toUpperCase() + t_split[i].slice(1);
  }

  return t_split.join(' ');
};

// fill songs object[] with JSON
SoundLister._fillSongs = async (fileColObj) => {
  const songObjArr = [];
  let fileIndex = 1;

  let fileCount = SoundLister.__getFileCount(fileColObj);

  // put all file information into 'songs' object[]
  for (const col in fileColObj) {
    for (const index in fileColObj[col]) {
      const baseName = fileColObj[col][index]['basename']; // music.mp3
      const duration = fileColObj[col][index]['duration']; // 3:12
      const ext = fileColObj[col][index]['extension']; // mp3
      const subdirs = fileColObj[col][index]['subdirPath']; // [/subdir]
      const filePath = `${SL_AUDIO_ASSETS_DIR}/${subdirs}/${col}/${baseName}`;
      const ms = fileColObj[col][index]['ms']; // 300
      const updated = fileColObj[col][index]['updated']; // Fri May 9 13:48:41 PDT 2025

      const response = await fetch(filePath);
      const data = await response.blob();

      // when FileReader loads, read ID3 tags from file via MP3Tag
      // if found, use; otherwise use defaults
      const buffer = await SoundLister.__readFileAsync(data);
      const tags = await SoundLister._getID3Tags(buffer);

      const defaultTitle = SoundLister._filenameToTitle(baseName);
      const defaultArtist = 'Unknown Artist';
      const defaultAlbum = 'Unknown Album';

      const songTitle = tags.title || defaultTitle;
      const songArtist = tags.artist || defaultArtist;
      const songAlbum = tags.album || defaultAlbum;

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
      };

      songObjArr.push(newSong);

      const percentDone = (fileIndex / fileCount) * 100;

      SoundLister._updateProgressBar(percentDone, songTitle, fileIndex, fileCount);

      fileIndex += 1;
    }
  }

  return SoundLister.__sortObjArr(songObjArr, ['url']);
};

SoundLister._updateProgressBar = (percent, title, cur, total) => {
  if (percent >= 0 && percent <= 100) {
    SoundLister.dom.progressText.innerHTML = `<span>loading </span><span><strong>${title}</strong></span><span> (${cur}/${total})</span>`;
    SoundLister.dom.progressBar.style.width = percent + '%';

    // SoundLister.dom.progressBar.innerHTML = `<span>loading </span><span><strong>${title}</strong></span><span> (${cur}/${total})</span>`
    // SoundLister.dom.progressBar.style.width = percent + '%'
  }
};

// use PHP script to scan audio directory
// add to CacheStorage
// return titles of files
SoundLister._getFiles = async () => {
  const fileList = await fetch(SL_PHP_DIR_SCRIPT);
  const titlesArray = await fileList.text();
  let titlesJSON = null;

  if (titlesArray.length) {
    titlesJSON = JSON.parse(titlesArray);

    // initiate the collection dropdown if more than one collection
    if (Object.keys(titlesJSON).length > 1) {
      Object.keys(titlesJSON).forEach((col) => SoundLister._addCollectionOption(col));
    } else {
      SoundLister._removeCollDropdown(titlesJSON[0]);
    }

    // TODO: use a Service Worker to intercept requests
    // return cached versions if possible
    // SoundLister._registerServiceWorker()

    // check querystring for ?col|coll|collection= to filter dropdown
    SoundLister._loadQSCollection();

    if (SoundLister.coll !== SL_DEFAULT_COLLECTION) {
      titlesJSON = Object.keys(titlesJSON)
        .filter((key) => key.includes(SoundLister.coll))
        .reduce((cur, key) => {
          return Object.assign(cur, { [key]: titlesJSON[key] });
        }, {});
    }
  } else {
    titlesJSON = {};
  }

  if (Object.keys(titlesJSON).length == 1) {
    SoundLister._updateCollDisplay(Object.keys(titlesJSON)[0]);
  }

  return titlesJSON;
};

// add new option to collections dropdown
SoundLister._addCollectionOption = (col) => {
  // bog-standard <select>
  SoundLister.dom.collDropdown.options.add(new Option(col, col));

  // STUB
  // Blog: https://css-tricks.com/striking-a-balance-between-native-and-custom-select-elements/
  // Codepen: https://codepen.io/sandrina-p/pen/YzyOYRr

  // SoundLister.dom.collNative.options.add(new Option(col, col))

  // const option = document.createElement('div')
  // option.classList.add('selectCustom-option')
  // option.dataset.value = col
  // option.textContent = col
  // SoundLister.dom.collCustom.querySelector('.selectCustom-options').appendChild(option)
};

// change play/pause icon depending on context
SoundLister._updatePlayButton = (source = null) => {
  switch (source) {
    case 'playlist':
      requestAnimationFrame(SoundLister._whilePlaying);
      SoundLister.playIconState = 'pause';

      if (SoundLister.dom.playButtonIcon.classList.contains('fa-play')) {
        SoundLister.dom.playButtonIcon.classList.remove('fa-play');

        if (!SoundLister.dom.playButtonIcon.classList.contains('fa-pause')) {
          SoundLister.dom.playButtonIcon.classList.add('fa-pause');
        }
      }
      break;

    case 'collection':
      cancelAnimationFrame(SoundLister.raf);
      SoundLister.playIconState = 'play';

      SoundLister.dom.audio.src = SoundLister.tracks()[0].href;

      if (SoundLister.dom.playButtonIcon.classList.contains('fa-pause')) {
        SoundLister.dom.playButtonIcon.classList.remove('fa-pause');

        if (!SoundLister.dom.playButtonIcon.classList.contains('fa-play')) {
          SoundLister.dom.playButtonIcon.classList.add('fa-play');
        }
      }
      break;

    default:
      if (SoundLister.playIconState === 'play') {
        SoundLister.dom.audio.play();

        requestAnimationFrame(SoundLister._whilePlaying);
        SoundLister.playIconState = 'pause';
      } else {
        SoundLister.dom.audio.pause();

        cancelAnimationFrame(SoundLister.raf);
        SoundLister.playIconState = 'play';
      }

      SoundLister.dom.playButtonIcon.classList.toggle('fa-play');
      SoundLister.dom.playButtonIcon.classList.toggle('fa-pause');

      break;
  }
};

// toggle mute button icon
SoundLister._updateMuteButton = () => {
  if (SoundLister.muteIconState === 'unmute') {
    SoundLister.dom.audio.muted = true;
    SoundLister.muteIconState = 'mute';
  } else {
    SoundLister.dom.audio.muted = false;
    SoundLister.muteIconState = 'unmute';
  }

  SoundLister.dom.muteButtonIcon.classList.toggle('fa-volume-mute');
};

SoundLister._displayBufferedAmount = (msg = null) => {
  const bufferedLength = SoundLister.dom.audio.buffered.length - 1;

  if (bufferedLength >= 0) {
    const bufferedAmount = Math.floor(SoundLister.dom.audio.buffered.end(bufferedLength));

    SoundLister._logStatus(
      'bufferedAmount',
      `${bufferedAmount} / ${SoundLister.dom.seekSlider.max}: ${msg}`,
    );

    SoundLister.dom.audioPlayerContainer.style.setProperty(
      '--buffered-width',
      `${(bufferedAmount / SoundLister.dom.seekSlider.max) * 100}%`,
    );
  }
};

SoundLister._displayAudioDuration = () => {
  const duration = SoundLister.__calculateTime(SoundLister.dom.audio.duration);

  SoundLister.dom.totalTime.textContent = duration;
};

SoundLister._displayCurrentTrackName = () => {
  const curTrackTitle = SoundLister.songs[SoundLister.currentIndex].title;

  SoundLister.dom.currentTrackName.textContent = curTrackTitle;
  SoundLister.dom.currentTrackName.setAttribute('title', curTrackTitle);

  const titleTextHeight = SoundLister.dom.currentTrackName.getBoundingClientRect().height;
  const titleTextContainerHeight = document
    .querySelector('#track-current-name')
    .parentElement.getBoundingClientRect().height;

  if (titleTextHeight > titleTextContainerHeight) {
    document.querySelector('#track-current-name').classList.remove('short');
    document.querySelector('#track-current-name').parentElement.style.display = '-webkit-box';
  } else {
    document.querySelector('#track-current-name').classList.add('short');
    document.querySelector('#track-current-name').parentElement.style.display = 'flex';
  }
};

SoundLister._setSliderMax = () => {
  const duration = Math.floor(SoundLister.dom.audio.duration);

  SoundLister.dom.seekSlider.max = duration;
};

SoundLister._showRangeProgress = (rangeInput) => {
  if (rangeInput === SoundLister.dom.seekSlider) {
    SoundLister.dom.audioPlayerContainer.style.setProperty(
      '--seek-before-width',
      (rangeInput.value / rangeInput.max) * 100 + '%',
    );
  } else {
    SoundLister.dom.audioPlayerContainer.style.setProperty(
      '--volume-before-width',
      (rangeInput.value / rangeInput.max) * 100 + '%',
    );
  }
};

SoundLister._whilePlaying = () => {
  SoundLister.dom.seekSlider.value = Math.floor(SoundLister.dom.audio.currentTime);
  SoundLister.dom.currentTime.textContent = SoundLister.__calculateTime(
    SoundLister.dom.seekSlider.value,
  );

  SoundLister.dom.audioPlayerContainer.style.setProperty(
    '--seek-before-width',
    `${(SoundLister.dom.seekSlider.value / SoundLister.dom.seekSlider.max) * 100}%`,
  );

  SoundLister.raf = requestAnimationFrame(SoundLister._whilePlaying);
};

SoundLister._addAudioToCache = async (collections) => {
  await caches.open(SL_CACHE_TEXT_KEY).then(async (cache) => {
    await cache.keys().then(async function (keys) {
      if (!keys.length) {
        let filesToAdd = [];

        Object.keys(collections).forEach((col) => {
          collections[col].forEach((song) => {
            filesToAdd.push(`/assets/${song.dirname}/${song.basename}`);
          });
        });

        await cache.addAll(filesToAdd);
      } else {
        // SoundLister._logStatus(`${SL_CACHE_TEXT_KEY} is full, so no need to initialize`)
      }
    });
  });
};

SoundLister._loadQSCollection = () => {
  const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
  });

  const colToLoad = params.col || params.coll || params.collection;

  if (colToLoad) {
    SoundLister.coll = colToLoad;

    const validChoices = Array.from(SoundLister.dom.collDropdown.options).map((op) => op.value);

    // permananently change to one collection (save network)
    // remove collection dropdown
    if (validChoices.includes(colToLoad)) {
      SoundLister._removeCollDropdown(colToLoad);
    } else {
      // if invalid collection speficied, default to all collections
      SoundLister.coll = SL_DEFAULT_COLLECTION;
    }
  }
};

SoundLister._updateCollDisplay = (overridedTitle = null) => {
  if (overridedTitle) {
    SoundLister.coll = overridedTitle;
  }

  if (SoundLister.coll !== SL_DEFAULT_COLLECTION) {
    document.title = SoundLister.coll.toUpperCase() + ' | SoundLister';

    SoundLister.dom.collHeader.innerHTML = `<strong>${SoundLister.coll.toUpperCase()}</strong>.`;

    SoundLister._updateQueryString(SoundLister.coll);
  } else {
    document.title = 'SoundLister';

    SoundLister.dom.collHeader.innerHTML = 'something.';
  }

  if (SoundLister.env == 'local') {
    document.title = '(LH) ' + document.title;
  }
};

SoundLister._removeCollDropdown = (collection) => {
  SoundLister.dom.collDropdown.value = collection;
  SoundLister.dom.collDropdown.dispatchEvent(new Event('change'));
  SoundLister.dom.collDropdown.disabled = true;
  SoundLister.dom.collDropdown.style.display = 'none';

  if (collection && collection !== SL_DEFAULT_COLLECTION) {
    SoundLister._updateCollDisplay();
  }
};

SoundLister._updateQueryString = (coll) => {
  const url = new URL(location);
  url.searchParams.set('coll', coll);
  window.history.pushState({}, '', url);
};

/* ********************************* */
/* start the engine                  */
/* ********************************* */

/* eslint-disable no-extra-semi */
(async () => {
  // adjust <title> for env
  if (SoundLister.env == 'local') {
    SoundLister._setTitle();
  }

  try {
    const resp = await fetch('./custom.json');

    if (resp) {
      const conf = await resp.json();

      if (conf) {
        const icon = conf.faviconFilePath;
        const header = conf.headerText;
        const logo = conf.logoFilePath;
        const title = conf.titleText;

        if (icon !== '') {
          SoundLister._setCustomIcon(icon);
        }
        if (logo !== '') {
          SoundLister._setCustomLogo(logo);
        }
        if (header !== '') {
          SoundLister._setCustomHeader(header);
        }
        if (title !== '') {
          SoundLister._setCustomTitle(title);
        }
      } else {
        console.error('custom.json could not be loaded');
      }
    } else {
      // console.warn('custom.json not found');
    }
  } catch (e) {
    // console.warn('no custom.json file found', e);
  }

  // create fileObjArr object array of file info
  const fileObjArr = await SoundLister._getFiles();

  if (Object.keys(fileObjArr).length) {
    // create SoundLister.songsBase JSON object
    // use title, artist, etc. of all songs
    SoundLister.songsBase = await SoundLister._fillSongs(fileObjArr);

    // set array of objects for reference during usage
    SoundLister.songs = SoundLister.songsBase;

    // create playlist from SoundLister.songs
    SoundLister.dom.playlist.textContent = '';

    let album = null;
    let albumTrackCount = 0;
    let albumDuration = 0;

    Object.values(SoundLister.songs).forEach((song) => {
      let songAlbum = song.album;

      if (songAlbum != album) {
        const hr = document.createElement('hr');
        hr.classList.add('album-separator');

        SoundLister.dom.playlist.appendChild(hr);

        album = songAlbum;
      }

      albumTrackCount++;
      albumDuration += song.ms / 1000;
      SoundLister._createPlaylistItem(song);
    });

    // SoundLister.dom.loadMessage.classList.remove('loading')

    // hide loading info once songs are loaded
    SoundLister.dom.progressText.innerHTML = '<span>loading done!</span>';

    setTimeout(() => {
      SoundLister.dom.progressBar.parentElement.style.height = '0';
      setTimeout(() => {
        SoundLister.dom.progressBar.parentElement.style.display = 'none';
      }, 100);
    }, 2000);

    // attach DOM listeners
    SoundLister.attachPresentationListeners();

    // init DOM status labels
    SoundLister.dom.currentTime = document.getElementById('time-current');
    SoundLister.dom.totalTime = document.getElementById('time-total');
    SoundLister.dom.outputVolume = document.getElementById('output-volume');
    SoundLister.dom.audioPlaylistInfo.innerHTML = `<strong>${albumTrackCount}</strong> tracks, <strong>${SoundLister.__calculateTime(albumDuration)}</strong>`;

    // TODO: add files to CacheStorage AND be able to use them
    // SoundLister._addAudioToCache(fileObjArr)

    // if <audio> is loaded and ready, then get its duration and such
    if (SoundLister.dom.audio.readyState == 4) {
      SoundLister._displayAudioDuration();
      SoundLister._displayCurrentTrackName();
      SoundLister._setSliderMax();
      SoundLister._displayBufferedAmount('ready');
    }
    // otherwise, set an event listener for metadata loading completion
    else {
      SoundLister.dom.audio.addEventListener('loadeddata', () => {
        SoundLister._displayBufferedAmount('loadeddata');
      });
      SoundLister.dom.audio.addEventListener('loadedmetadata', () => {
        SoundLister._displayAudioDuration();
        SoundLister._displayCurrentTrackName();
        SoundLister._setSliderMax();
        SoundLister._displayBufferedAmount('loadedmetadata');

        SoundLister.activeTrack = SoundLister.tracks()[0].title;
      });
    }

    // now attach <audio>, etc. listeners
    SoundLister.attachFunctionalListeners();
  } else {
    SoundLister.dom.progressContainer.style.display = 'none';

    SoundLister.dom.playButton.disabled = 'true';
    SoundLister.dom.seekSlider.disabled = 'true';
    SoundLister.dom.volumeSlider.disabled = 'true';
    SoundLister.dom.muteButton.disabled = 'true';
    SoundLister.dom.prevButton.disabled = 'true';
    SoundLister.dom.repeatButton.disabled = 'true';
    SoundLister.dom.nextButton.disabled = 'true';

    SoundLister.dom.playlist.classList.add('no-audio-found');
    SoundLister.dom.playlist.innerHTML =
      '<p>No audio files found. Try adding some to <code>/assets/audio</code>!</p>';

    SoundLister.dom.collDropdown.disabled = 'true';

    console.error('No audio files found.');
  }
})();
