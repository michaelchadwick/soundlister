/* adds event listeners to dom */
/* global SoundLister */

// attach DOM presentation event listeners
SoundLister.attachPresentationListeners = () => {
  // play/pause button
  SoundLister.dom.playButton.addEventListener('click', () => {
    SoundLister._updatePlayState('click');
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

    SoundLister._updatePlayState('playlist');
  });

  window.onresize = SoundLister._resizePlaylist;
};

// attach DOM functional event listeners
SoundLister.attachFunctionalListeners = () => {
  // <audio> element has started loading
  SoundLister.dom.audio.addEventListener('loadstart', () => {
    // SoundLister._logStatus('audio loading begun')
    SoundLister._displayBufferedAmount('loadstart');
  });
  // <audio> element is loaded enough to start playing
  SoundLister.dom.audio.addEventListener('canplay', () => {
    // SoundLister._logStatus('audio can play')
    SoundLister._displayAudioDuration();
    SoundLister._displayCurrentTrackName();
    SoundLister._setSliderMax();
    SoundLister._displayBufferedAmount('canplay');
  });
  // <audio> element is loaded enough to play to end
  SoundLister.dom.audio.addEventListener('canplaythrough', () => {
    // SoundLister._logStatus('audio can play through')
    SoundLister._displayBufferedAmount('canplaythrough');
  });
  // <audio> element has started playing
  SoundLister.dom.audio.addEventListener('play', () => {
    // SoundLister._logStatus('audio has started playing');
    SoundLister._displayBufferedAmount('play');
    SoundLister._updatePlayState();
    SoundLister._setTitle();
  });
  // <audio> element is playing
  SoundLister.dom.audio.addEventListener('playing', () => {
    // SoundLister._logStatus('audio is playing');
    SoundLister._displayBufferedAmount('playing');
  });
  // <audio> element has been paused
  SoundLister.dom.audio.addEventListener('pause', () => {
    // SoundLister._logStatus('audio has been paused');
    SoundLister._displayBufferedAmount('pause');
    SoundLister._updatePlayState();
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
    const volume = parseInt(e.target.value);

    SoundLister.dom.audio.volume = volume / 100;
  });

  // gotta use keydown
  document.addEventListener('keydown', (event) => {
    if (event.code == 'Space') {
      // fix issue with double-triggering
      // if space bar is activeElement
      document.activeElement.blur();
      SoundLister._updatePlayState('key');
    } else {
      // Next Track: Shift+Cmd/Win+Right
      // Prev Track: Shift+Cmd/Win+Left
      if (event.metaKey && event.shiftKey && event.code == 'ArrowRight') {
        SoundLister.goForward();
      } else if (event.metaKey && event.shiftKey && event.code == 'ArrowLeft') {
        SoundLister.goBack();
      }
    }
  });

  document.addEventListener('keyup', () => {});
};
