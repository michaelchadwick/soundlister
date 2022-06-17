# Soundlister

Create a quick one-page website playlist for any[^1] audio.

## Dependencies

* [PHP](https://php.net) to read files from a local directory
* [Amplitude.js](https://521dimensions.com/open-source/amplitudejs) to play stuff
* [mp3tag.js](https://github.com/eidoriantan/mp3tag.js) to read ID3 tags

## Local Development / Deploy

1. `git clone https://github.com/michaelchadwick/soundlister.git`
2. `cd soundlister`
3. `mkdir /path/to/soundlister/audio`
4. `cp audio-file-of-awesome.mp3 /path/to/soundlister/audio`
5. `open index.html`

[^1]: Only supports "mp3" for now
