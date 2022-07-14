# SoundLister

Create a quick one-page website playlist for just about any[^1] HTML5 audio[^2]. Custom colors for body background, link color, playlist border, and active song background color can be specified in `custom.css`.

## How to Use

SoundLister will load all audio files it supports in the `/assets/audio` directory, including subdirectories.

Click on the play button or click a track in the playlist to begin playback. When a track is done, it will immediately go to the next track and begin playing. When the playlist is complete, it will loop back to the first track.

If the audio source contains multiple directories (a "collection"), then the dropdown below the audio player can be changed to filter the playlist to only use a specific collection.

Keyboard shortcuts:

* Space - toggles playback and pause
* Cmd/Win+Right - go to next track in playlist
* Cmd/Win+Left - go to previous track in playlist

## Dependencies

* [PHP](https://php.net) to read files from a local directory
* [<audio>](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio) to play stuff
* [mp3tag.js](https://github.com/eidoriantan/mp3tag.js) to read ID3 tags

## Local Development / Deploy

1. `git clone https://github.com/michaelchadwick/soundlister.git`
2. `cd soundlister`
3. `mkdir /path/to/soundlister/audio`
4. `cp audio-file-of-awesome.mp3 /path/to/soundlister/audio`
5. `open index.html`

[^1]: Supports `aac,flac,m4a,mp3,mp4,ogg,wav,webm` files
[^2]: [HTML5 audio formats](https://en.wikipedia.org/wiki/HTML5_audio#Supported_audio_coding_formats)

## Acknowledgements

Thanks to [CSS-Tricks](https://css-tricks.com) for their very awesome article on [making your own custom audio player](https://css-tricks.com/lets-create-a-custom-audio-player/).
