$(function () {
  new jPlayerPlaylist({
    jPlayer: '#jquery_jplayer_1',
    cssSelectorAncestor: '#jp_container_1'
  }, [
    // Add entries to load into playlist
    // {
    //   title: 'File1',
    //   mp3: 'assets/audio/file-01.mp3',
    //   oga: 'assets/audio/file-01.ogg',
    //   free: true
    // },
    // {
    //   title: 'File2',
    //   mp3: 'assets/audio/file-02.mp3',
    //   oga: 'assets/audio/file-02.ogg',
    //   free: true
    // },
    // {
    //   title: 'File3',
    //   mp3: 'assets/audio/file-03.mp3',
    //   oga: 'assets/audio/file-03.ogg',
    //   free: true
    // }
  ], {
    swfPath: 'vendor/jquery.jplayer.swf',
    supplied: 'mp3, oga',
    wmode: 'window',
    volume: 0.75
  })
})
