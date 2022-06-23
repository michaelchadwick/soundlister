# Soundlister

Create a quick one-page website playlist for just about any[^1] HTML5 audio[^2]. Custom colors for body background, link color, playlist border, and active song background color can be specified in `custom.css`.

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
