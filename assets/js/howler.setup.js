/* global MP3Tag */

/**
 * Player class containing the state of our playlist and where we are in it.
 * Includes all methods for playing, skipping, updating the display, etc.
 * @param {Array} playlist Array of objects with playlist song details ({title, file, howl}).
 */
var Player = function(playlist) {
  this.playlist = playlist;
  this.index = 0;

  // Display the title of the first track.
  track.classList.remove('loader')
  track.innerHTML = '1. ' + playlist[0].title;

  // Setup the playlist display.
  playlist.forEach(function(song) {
    var div = document.createElement('div');
    div.className = 'list-song';
    div.innerHTML = song.title;
    div.onclick = function() {
      SoundLister.player.skipTo(playlist.indexOf(song));
    };
    list.appendChild(div);
  });
};
Player.prototype = {
  /**
   * Play a song in the playlist.
   * @param  {Number} index Index of the song in the playlist (leave empty to play the first or current).
   */
  play: function(index) {
    var self = this;
    var sound;

    index = typeof index === 'number' ? index : self.index;
    var data = self.playlist[index];

    // If we already loaded this track, use the current one.
    // Otherwise, setup and load a new Howl.
    if (data.howl) {
      console.log('playing loaded track')
      sound = data.howl;
    } else {
      console.log('playing newly loaded track')
      sound = data.howl = new Howl({
        src: [data.file],
        html5: true, // Force to HTML5 so that audio will keep playing when mobile browser is minimized or mobile screen locked.
        onplay: function() {
          // Display the duration.
          duration.innerHTML = self.formatTime(Math.round(sound.duration()));

          // Start updating the progress of the track.
          requestAnimationFrame(self.step.bind(self));

          // Start the wave animation if we have already loaded
          SoundLister.wave.container.style.display = 'block';
          bar.style.display = 'none';
          pauseBtn.style.display = 'block';
        },
        onload: function() {
          console.log('track loaded')
          // Start the wave animation.
          SoundLister.wave.container.style.display = 'block';
          bar.style.display = 'none';
          loading.style.display = 'none';
        },
        onend: function() {
          console.log('track ended')
          // Stop the wave animation.
          SoundLister.wave.container.style.display = 'none';
          bar.style.display = 'block';
          SoundLister.savedPosition = 0
          self.skip('next');
        },
        onpause: function() {
          console.log('track paused')
          // Stop the wave animation.
          SoundLister.wave.container.style.display = 'none';
          bar.style.display = 'block';
        },
        onstop: function() {
          console.log('track stopped')
          // Stop the wave animation.
          SoundLister.wave.container.style.display = 'none';
          bar.style.display = 'block';
        },
        onseek: function() {
          // Start updating the progress of the track.
          requestAnimationFrame(self.step.bind(self));
        }
      });
      console.log('new sound', sound)
    }

    // if a savedPosition is found, the sound was paused and is now being unpaused
    if (SoundLister.savedPosition) {
      sound.seek(SoundLister.savedPosition)
    }

    // Begin playing the sound.
    // sound.play();
    sound.play()

    // Update the track display.
    track.innerHTML = (index + 1) + '. ' + data.title;

    // Show the pause button.
    if (sound.state() === 'loaded') {
      playBtn.style.display = 'none';
      pauseBtn.style.display = 'block';
    } else {
      loading.style.display = 'block';
      playBtn.style.display = 'none';
      pauseBtn.style.display = 'none';
    }

    // Keep track of the index we are currently playing.
    self.index = index;
  },

  /**
   * Pause the currently playing track.
   */
  pause: function() {
    var self = this;

    // Get the Howl we want to manipulate.
    var sound = self.playlist[self.index].howl;

     // Determine our current seek position.
    SoundLister.savedPosition = sound.seek() || 0;

    // Pause the sound.
    sound.pause();

    // Show the play button.
    playBtn.style.display = 'block';
    pauseBtn.style.display = 'none';
  },

  /**
   * Skip to the next or previous track.
   * @param  {String} direction 'next' or 'prev'.
   */
  skip: function(direction) {
    var self = this;

    // Get the next track based on the direction of the track.
    var index = 0;
    if (direction === 'prev') {
      index = self.index - 1;
      if (index < 0) {
        index = self.playlist.length - 1;
      }
    } else {
      index = self.index + 1;
      if (index >= self.playlist.length) {
        index = 0;
      }
    }

    self.skipTo(index);
  },

  /**
   * Skip to a specific track based on its playlist index.
   * @param  {Number} index Index in the playlist.
   */
  skipTo: function(index) {
    var self = this;

    // Stop the current track.
    if (self.playlist[self.index].howl) {
      self.playlist[self.index].howl.stop();
    }

    // Reset progress.
    progress.style.width = '0%';

    // Play the new track.
    self.play(index);
  },

  /**
   * Set the volume and update the volume slider display.
   * @param  {Number} val Volume between 0 and 1.
   */
  volume: function(val) {
    var self = this;

    // Update the global volume (affecting all Howls).
    Howler.volume(val);

    // Update the display on the slider.
    var barWidth = (val * 90) / 100;
    barFull.style.width = (barWidth * 100) + '%';
    sliderBtn.style.left = (window.innerWidth * barWidth + window.innerWidth * 0.05 - 25) + 'px';
  },

  /**
   * Seek to a new position in the currently playing track.
   * @param  {Number} per Percentage through the song to skip.
   */
  seek: function(per) {
    console.log('seeking track', per)
    var self = this;

    // Get the Howl we want to manipulate.
    var sound = self.playlist[self.index].howl;

    // Convert the percent into a seek position.
    if (sound.playing()) {
      const seekPos = sound.duration() * per
      console.log('seekPos', seekPos)
      sound.seek(seekPos);
    }
  },

  /**
   * The step called within requestAnimationFrame to update the playback position.
   */
  step: function() {
    var self = this;

    // Get the Howl we want to manipulate.
    var sound = self.playlist[self.index].howl;

    // Determine our current seek position.
    var seek = sound.seek() || 0;
    timer.innerHTML = self.formatTime(Math.round(seek));
    progress.style.width = (((seek / sound.duration()) * 100) || 0) + '%';

    // If the sound is still playing, continue stepping.
    if (sound.playing()) {
      requestAnimationFrame(self.step.bind(self));
    }
  },

  /**
   * Toggle the playlist display on/off.
   */
  togglePlaylist: function() {
    var self = this;
    var display = (playlist.style.display === 'block') ? 'none' : 'block';

    setTimeout(function() {
      playlist.style.display = display;
    }, (display === 'block') ? 0 : 500);
    playlist.className = (display === 'block') ? 'fadein' : 'fadeout';
  },

  /**
   * Toggle the volume display on/off.
   */
  toggleVolume: function() {
    var self = this;
    var display = (volume.style.display === 'block') ? 'none' : 'block';

    setTimeout(function() {
      volume.style.display = display;
    }, (display === 'block') ? 0 : 500);
    volume.className = (display === 'block') ? 'fadein' : 'fadeout';
  },

  /**
   * Format the time from seconds to M:SS.
   * @param  {Number} secs Seconds to format.
   * @return {String}      Formatted time.
   */
  formatTime: function(secs) {
    var minutes = Math.floor(secs / 60) || 0;
    var seconds = (secs - minutes * 60) || 0;

    return minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
  }
};

// let songs = []
let audioDir = 'assets/audio'
let tags = {}
let index = 0
const playlistContainer = document.getElementById('amplitude-right')

// get ID3 tags from an MP3 buffer
function getID3Tags(buffer) {
  const mp3tag = new MP3Tag(buffer)

  mp3tag.read()

  return mp3tag.tags
}

function attachEventListeners() {
  var player = SoundLister.player

  // Cache references to DOM elements.
  var elms = ['track', 'timer', 'duration', 'playBtn', 'pauseBtn', 'prevBtn', 'nextBtn', 'playlistBtn', 'volumeBtn', 'progress', 'bar', 'wave', 'loading', 'playlist', 'list', 'volume', 'barEmpty', 'barFull', 'sliderBtn'];

  elms.forEach(function(elm) {
    window[elm] = document.getElementById(elm);
  });

  // Bind our player controls.
  playBtn.addEventListener('click', function() {
    player.play();
  });
  pauseBtn.addEventListener('click', function() {
    player.pause();
  });
  prevBtn.addEventListener('click', function() {
    player.skip('prev');
  });
  nextBtn.addEventListener('click', function() {
    player.skip('next');
  });
  waveform.addEventListener('click', function(event) {
    player.seek(event.clientX / window.innerWidth);
  });
  playlistBtn.addEventListener('click', function() {
    player.togglePlaylist();
  });
  playlist.addEventListener('click', function() {
    player.togglePlaylist();
  });
  volumeBtn.addEventListener('click', function() {
    player.toggleVolume();
  });
  volume.addEventListener('click', function() {
    player.toggleVolume();
  });

  // Setup the event listeners to enable dragging of volume slider.
  barEmpty.addEventListener('click', function(event) {
    var per = event.layerX / parseFloat(barEmpty.scrollWidth);
    player.volume(per);
  });
  sliderBtn.addEventListener('mousedown', function() {
    window.sliderDown = true;
  });
  sliderBtn.addEventListener('touchstart', function() {
    window.sliderDown = true;
  });
  volume.addEventListener('mouseup', function() {
    window.sliderDown = false;
  });
  volume.addEventListener('touchend', function() {
    window.sliderDown = false;
  });

  var move = function(event) {
    if (window.sliderDown) {
      var x = event.clientX || event.touches[0].clientX;
      var startX = window.innerWidth * 0.05;
      var layerX = x - startX;
      var per = Math.min(1, Math.max(0, layerX / parseFloat(barEmpty.scrollWidth)));
      player.volume(per);
    }
  };

  volume.addEventListener('mousemove', move);
  volume.addEventListener('touchmove', move);

  // Setup the "waveform" animation.
  SoundLister.wave = new SiriWave({
    container: waveform,
    width: window.innerWidth,
    height: window.innerHeight * 0.3,
    cover: true,
    speed: 0.03,
    amplitude: 0.7,
    frequency: 2
  });
  SoundLister.wave.start();

  // Update the height of the wave animation.
  // These are basically some hacks to get SiriWave.js to do what we want.
  var resizeWave = function() {
    var wave = SoundLister.wave
    var height = window.innerHeight * 0.3;
    var width = window.innerWidth;

    wave.height = height;
    wave.height_2 = height / 2;
    wave.MAX = wave.height_2 - 4;
    wave.width = width;
    wave.width_2 = width / 2;
    wave.width_4 = width / 4;
    wave.canvas.height = height;
    wave.canvas.width = width;
    wave.container.style.margin = -(height / 2) + 'px auto';

    // Update the position of the slider.
    var sound = SoundLister.player.playlist[SoundLister.player.index].howl;
    if (sound) {
      var vol = sound.volume();
      var barWidth = (vol * 0.9);
      sliderBtn.style.left = (window.innerWidth * barWidth + window.innerWidth * 0.05 - 25) + 'px';
    }
  };

  window.addEventListener('resize', resizeWave);
  resizeWave();
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
    const filePath = `${audioDir}/${titles[f]}`
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
      "title": tags.title || defaultTitle,
      "artist": tags.artist || defaultArtist,
      "album": tags.album || defaultAlbum,
      "file": filePath,
      "cover_art_url": defaultArt,
      "howl": null
    }

    songArr.push(newSong)

    index++
  }

  return songArr
}

// use PHP script to scan audio directory
// return titles of files
async function getFiles() {
  let fileList = await fetch('./assets/dir.php')
  let titlesArray = await fileList.text()
  let titlesJSON = JSON.parse(titlesArray)

  return titlesJSON
}

(async() => {
  const trackTitle = document.getElementById('track')
  trackTitle.classList.add('loader')

  const titles = await getFiles()
  // vvv slow because mp3tag needs to load whole file to get metadata
  const songs = await fillSongs(titles)

  // SoundLister.silencePlayer = new Howl({ src: '/assets/data/silence-2s.mp3', html5: true, loop: true, autoPlay: true })
  // SoundLister.silencePlayer.play()

  // Setup our new audio player class and pass it the playlist.
  SoundLister.player = new Player(songs)

  attachEventListeners()
})()
